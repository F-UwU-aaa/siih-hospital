import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { crearNotificacion } from "@/lib/notificaciones";
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
    if (!await verificarPermiso(sesion.usuario_id, "FACTURACION", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const facturaId = parseInt(id);

    const { rows: facturaRows } = await pool.query(
      `SELECT f.*,
        p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
        p.telefono AS paciente_telefono,
        u.username AS facturador_username
       FROM factura f
       JOIN paciente p ON f.paciente_id = p.id
       JOIN usuario u ON f.usuario_id = u.id
       WHERE f.id = $1`,
      [facturaId]
    );

    if (facturaRows.length === 0) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre, u.paciente_id FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    if (rolRows[0]?.nombre === "PACIENTE" && rolRows[0].paciente_id !== facturaRows[0].paciente_id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows: detalles } = await pool.query(
      "SELECT * FROM detalle_factura WHERE factura_id = $1 ORDER BY id",
      [facturaId]
    );

    return NextResponse.json({
      ...facturaRows[0],
      detalles,
    });
  } catch (error) {
    console.error("Error al obtener factura:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
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
    if (!await verificarPermiso(sesion.usuario_id, "FACTURACION", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const facturaId = parseInt(id);
    let body: { accion?: string; descuento?: number; cobertura_seguro?: number; motivo?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 });
    }
    const { accion, descuento, cobertura_seguro } = body;

    if (!["PAGAR", "ANULAR"].includes(accion ?? "")) {
      return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: facturaRows } = await client.query(
        "SELECT * FROM factura WHERE id = $1 FOR UPDATE",
        [facturaId]
      );

      if (facturaRows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
      }

      const factura = facturaRows[0];

      // Validate state transitions (spec: PENDIENTE → PAGADA, ANULADA from PENDIENTE or PAGADA)
      if (accion === "PAGAR" && factura.estado !== "PENDIENTE") {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Solo se pueden pagar facturas en PENDIENTE" }, { status: 400 });
      }
      if (accion === "ANULAR" && !["PENDIENTE", "PAGADA"].includes(factura.estado)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "No se puede anular esta factura" }, { status: 400 });
      }

      let nuevoEstado: string;
      let updateFields: string[] = [];
      let updateParams: unknown[] = [];
      let paramIdx = 1;

      if (accion === "PAGAR") {
        nuevoEstado = "PAGADA";
        const desc = Number(descuento) || 0;
        const cob = Number(cobertura_seguro) || 0;

        if (desc < 0) {
          await client.query("ROLLBACK");
          return NextResponse.json({ error: "El descuento no puede ser negativo" }, { status: 400 });
        }
        if (cob < 0) {
          await client.query("ROLLBACK");
          return NextResponse.json({ error: "La cobertura del seguro no puede ser negativa" }, { status: 400 });
        }
        const base = parseFloat(factura.subtotal) + parseFloat(factura.impuesto);
        if (desc + cob > base) {
          await client.query("ROLLBACK");
          return NextResponse.json({ error: `Descuento + cobertura ($${(desc + cob).toFixed(2)}) no puede exceder el total base ($${base.toFixed(2)})` }, { status: 400 });
        }

        if (descuento !== undefined) {
          updateFields.push(`descuento = $${paramIdx++}`);
          updateParams.push(desc);
        }
        if (cobertura_seguro !== undefined) {
          updateFields.push(`cobertura_seguro = $${paramIdx++}`);
          updateParams.push(cob);
        }
        updateFields.push(`estado = $${paramIdx++}`);
        updateParams.push(nuevoEstado);
      } else {
        // ANULAR
        nuevoEstado = "ANULADA";
        updateFields.push(`estado = $${paramIdx++}`);
        updateParams.push(nuevoEstado);

        // RN-08: Register in auditoria for annulled invoices
        await client.query(
          `INSERT INTO auditoria (usuario_id, tabla_afectada, accion, registro_id, detalle)
           VALUES ($1, 'factura', 'ANULACION', $2, $3)`,
          [
            sesion.usuario_id,
            facturaId,
            JSON.stringify({
              factura_numero: factura.numero_factura,
              paciente_id: factura.paciente_id,
              total: factura.total,
              motivo: body.motivo || "Sin especificar",
            }),
          ]
        );
      }

      updateParams.push(facturaId);
      await client.query(
        `UPDATE factura SET ${updateFields.join(", ")} WHERE id = $${paramIdx}`,
        updateParams
      );

      // Update total if descuento/cobertura changed
      if (accion === "PAGAR") {
        const desc = Number(descuento) || 0;
        const cob = Number(cobertura_seguro) || 0;
        const nuevoTotal = parseFloat(factura.subtotal) + parseFloat(factura.impuesto) - desc - cob;
        await client.query("UPDATE factura SET total = $1 WHERE id = $2", [nuevoTotal, facturaId]);
      }

      // Notify patient if payment (simulated delivery)
      if (accion === "PAGAR") {
        await crearNotificacion({
          paciente_id: factura.paciente_id,
          tipo: "SISTEMA",
          asunto: "Factura pagada",
          mensaje: `Su factura ${factura.numero_factura} ha sido pagada.`,
        });
      }

      await client.query("COMMIT");

      if (accion === "PAGAR") {
        await registrarAuditoria({
          usuario_id: sesion.usuario_id,
          tabla_afectada: "factura",
          accion: "UPDATE",
          registro_id: facturaId,
          detalle: `Factura #${facturaId} (${factura.numero_factura}) marcada como PAGADA — descuento: $${(Number(descuento) || 0).toFixed(2)}, cobertura: $${(Number(cobertura_seguro) || 0).toFixed(2)}`,
        });
      }

      const { rows: updated } = await pool.query("SELECT * FROM factura WHERE id = $1", [facturaId]);
      return NextResponse.json(updated[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al actualizar factura:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
