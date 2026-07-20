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
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT r.id, r.nombre, r.descripcion,
              COUNT(rp.permiso_id) AS total_permisos
       FROM rol r
       LEFT JOIN rol_permiso rp ON rp.rol_id = r.id
       GROUP BY r.id, r.nombre, r.descripcion
       ORDER BY r.nombre`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar roles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
