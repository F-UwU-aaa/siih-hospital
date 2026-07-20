import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";

export async function PATCH(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { accion } = body;

    if (accion !== "ENVIAR_TODAS") {
      return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
    }

    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    let query: string;
    let params: unknown[];

    if (rol === "ADMIN" || rol === "DIRECTOR") {
      query = `UPDATE notificacion SET estado = 'ENVIADA', fecha_envio = NOW() WHERE estado = 'PENDIENTE'`;
      params = [];
    } else {
      query = `UPDATE notificacion SET estado = 'ENVIADA', fecha_envio = NOW()
               WHERE estado = 'PENDIENTE'
               AND (
                 paciente_id = (SELECT paciente_id FROM usuario WHERE id = $1 AND paciente_id IS NOT NULL)
                 OR medico_id = (SELECT medico_id FROM usuario WHERE id = $1 AND medico_id IS NOT NULL)
                 OR rol_destino = $2
               )`;
      params = [sesion.usuario_id, rol];
    }

    const result = await pool.query(query, params);
    return NextResponse.json({ marcadas: result.rowCount ?? 0 });
  } catch (error) {
    console.error("Error al marcar notificaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
