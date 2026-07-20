import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";
import { crearNotificacion } from "@/lib/notificaciones";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "HOSPITALIZACION", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const hospId = parseInt(id);

    const { rows: existing } = await pool.query(
      "SELECT id, estado FROM hospitalizacion WHERE id = $1",
      [hospId]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Hospitalizacion no encontrada" }, { status: 404 });
    }
    if (existing[0].estado !== "ACTIVA") {
      return NextResponse.json(
        { error: "Solo se puede administrar medicacion en hospitalizaciones activas" },
        { status: 400 }
      );
    }

    const { rows: enfRows } = await pool.query(
      "SELECT enfermera_id FROM usuario WHERE id = $1 AND enfermera_id IS NOT NULL",
      [sesion.usuario_id]
    );
    if (enfRows.length === 0) {
      return NextResponse.json(
        { error: "Solo las enfermeras pueden administrar medicacion en hospitalizacion" },
        { status: 403 }
      );
    }
    const enfermeraId = enfRows[0].enfermera_id;

    const body = await request.json();
    const { medicamento_id, dosis, observaciones } = body;

    if (!medicamento_id || !dosis) {
      return NextResponse.json(
        { error: "medicamento_id y dosis son requeridos" },
        { status: 400 }
      );
    }

    const medId = parseInt(medicamento_id);

    const { rows: medRows } = await pool.query(
      "SELECT id, nombre FROM medicamento WHERE id = $1",
      [medId]
    );
    if (medRows.length === 0) {
      return NextResponse.json({ error: "Medicamento no encontrado" }, { status: 404 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: lotes } = await client.query(
        `SELECT id, lote, cantidad, fecha_vencimiento
         FROM inventario
         WHERE medicamento_id = $1 AND fecha_vencimiento >= CURRENT_DATE AND cantidad > 0
         ORDER BY fecha_vencimiento ASC`,
        [medId]
      );

      const stockTotal = lotes.reduce((sum: number, l: { cantidad: number }) => sum + l.cantidad, 0);
      if (stockTotal <= 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: `No hay stock disponible de ${medRows[0].nombre}` },
          { status: 400 }
        );
      }

      const cantidad = 1;
      let porDescontar = cantidad;
      const lotesUsados: { lote: string; cantidad: number }[] = [];

      for (const lote of lotes) {
        if (porDescontar <= 0) break;
        const aDescontar = Math.min(lote.cantidad, porDescontar);

        await client.query(
          "UPDATE inventario SET cantidad = cantidad - $1 WHERE id = $2",
          [aDescontar, lote.id]
        );

        lotesUsados.push({ lote: lote.lote, cantidad: aDescontar });
        porDescontar -= aDescontar;

        const loteActual = await client.query(
          "SELECT cantidad, stock_minimo FROM inventario WHERE id = $1",
          [lote.id]
        );
        if (loteActual.rows[0].cantidad <= loteActual.rows[0].stock_minimo) {
          crearNotificacion({
            tipo: "STOCK_BAJO",
            asunto: `Stock bajo: ${medRows[0].nombre}`,
            mensaje: `El lote ${lote.lote} de ${medRows[0].nombre} tiene stock ${loteActual.rows[0].cantidad} (minimo: ${loteActual.rows[0].stock_minimo})`,
          }).catch(() => {});
        }
      }

      const { rows: maRows } = await client.query(
        `INSERT INTO medicacion_administrada
           (hospitalizacion_id, enfermera_id, medicamento_id, dosis, observaciones)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [hospId, enfermeraId, medId, dosis, observaciones || null]
      );

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "medicacion_administrada",
        accion: "INSERT",
        registro_id: maRows[0].id,
        detalle: `Medicacion: ${medRows[0].nombre} ${dosis} para hospitalizacion #${hospId}. Lot${lotesUsados.length > 1 ? "es" : ""} usad${lotesUsados.length > 1 ? "os" : "o"}: ${lotesUsados.map((l) => `${l.lote}(${l.cantidad})`).join(", ")}`,
      });

      return NextResponse.json({
        medicacion: maRows[0],
        lotes_usados: lotesUsados,
      }, { status: 201 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al administrar medicacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
