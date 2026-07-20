import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "CITAS", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const especialidad = searchParams.get("especialidad");

    let query: string;
    let params: string[] = [];

    if (especialidad) {
      query = `SELECT id, ci, nombre, apellido, especialidad, telefono, email, horario_atencion
               FROM medico
               WHERE activo = TRUE AND especialidad = $1
               ORDER BY apellido, nombre`;
      params = [especialidad];
    } else {
      query = `SELECT id, ci, nombre, apellido, especialidad, telefono, email, horario_atencion
               FROM medico
               WHERE activo = TRUE
               ORDER BY especialidad, apellido, nombre`;
    }

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar médicos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
