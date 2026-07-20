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
    if (!await verificarPermiso(sesion.usuario_id, "COMPRAS", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const provId = parseInt(id);
    const body = await request.json();
    const { nombre, ruc, direccion, telefono, email, activo } = body;

    const sets: string[] = [];
    const values: (string | number | boolean)[] = [];
    let idx = 1;

    if (nombre !== undefined) { sets.push(`nombre = $${idx++}`); values.push(nombre); }
    if (ruc !== undefined) { sets.push(`ruc = $${idx++}`); values.push(ruc || null); }
    if (direccion !== undefined) { sets.push(`direccion = $${idx++}`); values.push(direccion || null); }
    if (telefono !== undefined) { sets.push(`telefono = $${idx++}`); values.push(telefono || null); }
    if (email !== undefined) { sets.push(`email = $${idx++}`); values.push(email || null); }
    if (activo !== undefined) { sets.push(`activo = $${idx++}`); values.push(activo); }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    values.push(provId);
    const { rows } = await pool.query(
      `UPDATE proveedor SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
    }

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "proveedor",
      accion: "UPDATE",
      registro_id: provId,
    });

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
