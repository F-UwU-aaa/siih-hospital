import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "FARMACIA", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const medId = parseInt(id);
    const body = await request.json();
    const { nombre, principio_activo, presentacion, concentracion, laboratorio, activo } = body;

    const sets: string[] = [];
    const values: (string | number | boolean)[] = [];
    let idx = 1;

    if (nombre !== undefined) { sets.push(`nombre = $${idx++}`); values.push(nombre); }
    if (principio_activo !== undefined) { sets.push(`principio_activo = $${idx++}`); values.push(principio_activo || null); }
    if (presentacion !== undefined) { sets.push(`presentacion = $${idx++}`); values.push(presentacion || null); }
    if (concentracion !== undefined) { sets.push(`concentracion = $${idx++}`); values.push(concentracion || null); }
    if (laboratorio !== undefined) { sets.push(`laboratorio = $${idx++}`); values.push(laboratorio || null); }
    if (activo !== undefined) { sets.push(`activo = $${idx++}`); values.push(activo); }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    values.push(medId);
    const { rows } = await pool.query(
      `UPDATE medicamento SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Medicamento no encontrado" }, { status: 404 });
    }

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "medicamento",
      accion: "UPDATE",
      registro_id: medId,
    });

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error al actualizar medicamento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
