import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "COMPRAS", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") || "";

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (estado) {
      conditions.push(`c.estado = $${paramIdx++}`);
      params.push(estado);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT c.*,
        p.nombre AS proveedor_nombre,
        u.username AS gestionado_por_username
       FROM compra c
       JOIN proveedor p ON c.proveedor_id = p.id
       LEFT JOIN usuario u ON c.usuario_id = u.id
       ${where}
       ORDER BY c.fecha_compra DESC`,
      params
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar compras:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "COMPRAS", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { proveedor_id, items } = body;

    if (!proveedor_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "proveedor_id y al menos 1 item son requeridos" },
        { status: 400 }
      );
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      if (!item.medicamento_id || !item.cantidad || !item.precio_unitario) {
        return NextResponse.json(
          { error: "Cada item requiere medicamento_id, cantidad y precio_unitario" },
          { status: 400 }
        );
      }
      total += item.cantidad * item.precio_unitario;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create COMPRA
      const { rows: compraRows } = await client.query(
        `INSERT INTO compra (proveedor_id, fecha_compra, total, estado, usuario_id)
         VALUES ($1, NOW(), $2, 'PENDIENTE', $3)
         RETURNING *`,
        [proveedor_id, total, sesion.usuario_id]
      );
      const compra = compraRows[0];

      // Create DETALLE_COMPRAs
      const detalleItems = [];
      for (const item of items) {
        const subtotal = item.cantidad * item.precio_unitario;
        const { rows: detRows } = await client.query(
          `INSERT INTO detalle_compra (compra_id, medicamento_id, cantidad, precio_unitario)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [compra.id, item.medicamento_id, item.cantidad, item.precio_unitario]
        );
        detalleItems.push(detRows[0]);
      }

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "compra",
        accion: "INSERT",
        registro_id: compra.id,
        detalle: `Compra #${compra.id} a proveedor #${proveedor_id}, total: ${total}`,
      });

      return NextResponse.json(
        { compra, items: detalleItems },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al crear compra:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
