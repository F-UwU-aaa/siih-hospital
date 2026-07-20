import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "COMPRAS", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const compraId = parseInt(id);

    const { rows: compraRows } = await pool.query(
      `SELECT c.*,
        p.nombre AS proveedor_nombre,
        p.ruc AS proveedor_ruc,
        p.telefono AS proveedor_telefono,
        u.username AS gestionado_por_username
       FROM compra c
       JOIN proveedor p ON c.proveedor_id = p.id
       LEFT JOIN usuario u ON c.usuario_id = u.id
       WHERE c.id = $1`,
      [compraId]
    );

    if (compraRows.length === 0) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    }

    const { rows: items } = await pool.query(
      `SELECT dc.*,
        m.nombre AS medicamento_nombre,
        m.principio_activo,
        m.presentacion,
        m.concentracion
       FROM detalle_compra dc
       JOIN medicamento m ON dc.medicamento_id = m.id
       WHERE dc.compra_id = $1`,
      [compraId]
    );

    return NextResponse.json({ compra: compraRows[0], items });
  } catch (error) {
    console.error("Error al obtener compra:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "COMPRAS", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const compraId = parseInt(id);
    const body = await request.json();
    const { estado, lotes } = body; // lotes: { [detalle_compra_id]: { lote: string, fecha_vencimiento: string } }

    const { rows: compraRows } = await pool.query(
      "SELECT * FROM compra WHERE id = $1",
      [compraId]
    );
    if (compraRows.length === 0) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    }
    const compra = compraRows[0];

    if (compra.estado === "RECIBIDA") {
      return NextResponse.json(
        { error: "Esta compra ya fue recibida" },
        { status: 400 }
      );
    }
    if (compra.estado === "CANCELADA") {
      return NextResponse.json(
        { error: "No se puede recibir una compra cancelada" },
        { status: 400 }
      );
    }

    if (estado !== "RECIBIDA") {
      return NextResponse.json(
        { error: 'Solo se puede cambiar estado a "RECIBIDA"' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update COMPRA estado
      await client.query(
        "UPDATE compra SET estado = 'RECIBIDA' WHERE id = $1",
        [compraId]
      );

      // Get DETALLE_COMPRA items
      const { rows: detalleItems } = await client.query(
        "SELECT * FROM detalle_compra WHERE compra_id = $1",
        [compraId]
      );

      // Create INVENTARIO lots for each item
      for (const item of detalleItems) {
        const loteInfo = lotes?.[item.id] || {};
        const loteNombre = loteInfo.lote || `LOTE-${compraId}-${item.id}`;
        const fechaVenc = loteInfo.fecha_vencimiento || (() => {
          const d = new Date();
          d.setFullYear(d.getFullYear() + 1);
          return d.toISOString().split("T")[0];
        })();

        // Check if lot already exists (same medicamento + lote name)
        const { rows: existing } = await client.query(
          "SELECT id, cantidad FROM inventario WHERE medicamento_id = $1 AND lote = $2",
          [item.medicamento_id, loteNombre]
        );

        if (existing.length > 0) {
          // Merge into existing lot
          await client.query(
            "UPDATE inventario SET cantidad = cantidad + $1 WHERE id = $2",
            [item.cantidad, existing[0].id]
          );
        } else {
          // Create new lot
          await client.query(
            `INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, precio_unitario)
             VALUES ($1, $2, $3, 10, $4, $5)`,
            [item.medicamento_id, loteNombre, item.cantidad, fechaVenc, item.precio_unitario]
          );
        }

        await registrarAuditoria({
          usuario_id: sesion.usuario_id,
          tabla_afectada: "inventario",
          accion: existing.length > 0 ? "UPDATE" : "INSERT",
          detalle: `Compra #${compraId} recibida: +${item.cantidad} unidades lote ${loteNombre}`,
        });
      }

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "compra",
        accion: "UPDATE",
        registro_id: compraId,
        detalle: `Compra #${compraId} RECIBIDA — ${detalleItems.length} items入库`,
      });

      // Return updated compra
      const { rows: updatedCompra } = await pool.query(
        `SELECT c.*, p.nombre AS proveedor_nombre
         FROM compra c JOIN proveedor p ON c.proveedor_id = p.id
         WHERE c.id = $1`,
        [compraId]
      );

      return NextResponse.json({
        compra: updatedCompra[0],
        mensaje: "Compra recibida e inventario actualizado",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al recibir compra:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
