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

    const { rows: userRows } = await pool.query(
      "SELECT paciente_id FROM usuario WHERE id = $1 AND paciente_id IS NOT NULL",
      [sesion.usuario_id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "No se encontro paciente" }, { status: 404 });
    }

    const pacienteId = userRows[0].paciente_id;

    const { rows } = await pool.query(
      `SELECT f.*,
        p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
        u.username AS facturador_username
       FROM factura f
       JOIN paciente p ON f.paciente_id = p.id
       JOIN usuario u ON f.usuario_id = u.id
       WHERE f.paciente_id = $1
       ORDER BY f.fecha_emision DESC`,
      [pacienteId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al obtener facturas del paciente:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
