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
    if (!await verificarPermiso(sesion.usuario_id, "HOSPITALIZACION", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    let query = "SELECT * FROM cama";
    const params: string[] = [];

    if (estado) {
      query += " WHERE estado = $1";
      params.push(estado);
    }
    query += " ORDER BY piso, sala, numero_cama";

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar camas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
