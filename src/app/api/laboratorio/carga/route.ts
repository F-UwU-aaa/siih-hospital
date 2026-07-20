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
    if (!await verificarPermiso(sesion.usuario_id, "LABORATORIO", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows: totalRows } = await pool.query(
      "SELECT COUNT(*)::int AS total FROM examen_laboratorio WHERE estado = 'EN_PROCESO'"
    );

    const { rows: porTipo } = await pool.query(
      `SELECT tipo_examen, COUNT(*)::int AS cantidad
       FROM examen_laboratorio
       WHERE estado = 'EN_PROCESO'
       GROUP BY tipo_examen
       ORDER BY cantidad DESC`
    );

    return NextResponse.json({
      total_en_proceso: totalRows[0].total,
      por_tipo: porTipo,
    });
  } catch (error) {
    console.error("Error al obtener carga:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
