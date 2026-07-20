import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "LABORATORIO", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const examenId = parseInt(id);

    const { rows: examenRows } = await pool.query(
      `SELECT el.*,
        rl.resultado, rl.valores_referencia, rl.observaciones AS resultado_observaciones, rl.es_critico, rl.fecha_resultado,
        a.motivo_consulta, a.diagnostico, a.medico_id,
        m.nombre AS medico_nombre, m.apellido AS medico_apellido, m.especialidad,
        hc.paciente_id,
        p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.fecha_nacimiento,
        u.username AS tecnico_username
       FROM examen_laboratorio el
       JOIN atencion a ON el.atencion_id = a.id
       JOIN medico m ON a.medico_id = m.id
       JOIN historial_clinico hc ON a.historial_id = hc.id
       JOIN paciente p ON hc.paciente_id = p.id
       LEFT JOIN usuario u ON el.tecnico_id = u.id
       LEFT JOIN resultado_laboratorio rl ON rl.examen_id = el.id
       WHERE el.id = $1`,
      [examenId]
    );

    if (examenRows.length === 0) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
    }

    const examen = examenRows[0];
    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    if (rol === "MEDICO" && examen.medico_id !== (await getMedicoId(sesion.usuario_id))) {
      return NextResponse.json(
        { error: "Sin acceso a este examen" },
        { status: 403 }
      );
    }

    return NextResponse.json({ examen });
  } catch (error) {
    console.error("Error al obtener examen:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

async function getMedicoId(usuarioId: number): Promise<number | null> {
  const { rows } = await pool.query(
    "SELECT medico_id FROM usuario WHERE id = $1",
    [usuarioId]
  );
  return rows[0]?.medico_id ?? null;
}
