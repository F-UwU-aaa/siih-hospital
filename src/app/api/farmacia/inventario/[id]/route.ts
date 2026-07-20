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
    const loteId = parseInt(id);
    const body = await request.json();
    const { cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario } = body;

    const sets: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;

    if (cantidad !== undefined) { sets.push(`cantidad = $${idx++}`); values.push(cantidad); }
    if (stock_minimo !== undefined) { sets.push(`stock_minimo = $${idx++}`); values.push(stock_minimo); }
    if (fecha_vencimiento !== undefined) { sets.push(`fecha_vencimiento = $${idx++}`); values.push(fecha_vencimiento); }
    if (ubicacion !== undefined) { sets.push(`ubicacion = $${idx++}`); values.push(ubicacion || null); }
    if (precio_unitario !== undefined) { sets.push(`precio_unitario = $${idx++}`); values.push(precio_unitario || null); }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    values.push(loteId);
    const { rows } = await pool.query(
      `UPDATE inventario SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "inventario",
      accion: "UPDATE",
      registro_id: loteId,
    });

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
