import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "LABORATORIO", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre FROM usuario u JOIN rol r ON u.rol_id = r.id WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;
    if (rol !== "TECNICO_LAB" && rol !== "ADMIN" && rol !== "DIRECTOR") {
      return NextResponse.json({ error: "Solo técnicos de laboratorio pueden tomar exámenes" }, { status: 403 });
    }

    const { id } = await params;
    const examenId = parseInt(id);

    const { rows: existing } = await pool.query(
      "SELECT id, estado, tecnico_id FROM examen_laboratorio WHERE id = $1",
      [examenId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
    }

    if (existing[0].estado !== "SOLICITADO") {
      return NextResponse.json(
        { error: `No se puede tomar: estado actual es ${existing[0].estado}, se requiere SOLICITADO` },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `UPDATE examen_laboratorio
       SET estado = 'EN_PROCESO', tecnico_id = $1
       WHERE id = $2
       RETURNING *`,
      [sesion.usuario_id, examenId]
    );

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "examen_laboratorio",
      accion: "UPDATE",
      registro_id: examenId,
      detalle: `Examen #${examenId} tomado: SOLICITADO -> EN_PROCESO (tecnico_id=${sesion.usuario_id})`,
    });

    return NextResponse.json({ examen: rows[0] });
  } catch (error) {
    console.error("Error al tomar examen:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
