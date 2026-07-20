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
    if (!await verificarPermiso(sesion.usuario_id, "CITAS", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT DISTINCT especialidad
       FROM medico
       WHERE activo = TRUE
       ORDER BY especialidad`
    );

    return NextResponse.json(rows.map((r) => r.especialidad));
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
