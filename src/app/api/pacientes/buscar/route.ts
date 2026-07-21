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
    if (!await verificarPermiso(sesion.usuario_id, "PACIENTES", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ci = searchParams.get("ci");

    if (!ci) {
      return NextResponse.json(
        { error: "El parámetro 'ci' es requerido" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT p.*, u.username AS usuario_username
       FROM paciente p
       LEFT JOIN usuario u ON u.paciente_id = p.id
       WHERE p.ci = $1`,
      [ci]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No se encontró paciente con esa CI" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error al buscar paciente por CI:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
