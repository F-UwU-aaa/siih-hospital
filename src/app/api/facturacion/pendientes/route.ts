import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

export async function GET() {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "FACTURACION", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT f.*,
        p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
       FROM factura f
       JOIN paciente p ON f.paciente_id = p.id
       WHERE f.estado IN ('PENDIENTE', 'CONFIRMADA')
       ORDER BY f.fecha_emision ASC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al obtener pendientes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
