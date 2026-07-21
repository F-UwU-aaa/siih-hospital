import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET() {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "LABORATORIO", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre, u.paciente_id FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    let query: string;
    let params: unknown[];

    if (rol === "PACIENTE") {
      const pacienteId = rolRows[0].paciente_id;
      if (!pacienteId) {
        return NextResponse.json([]);
      }
      query = `
        SELECT el.*,
          rl.resultado, rl.valores_referencia, rl.observaciones AS resultado_observaciones, rl.es_critico, rl.fecha_resultado,
          a.motivo_consulta, a.diagnostico,
          hc.paciente_id,
          p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
          u.username AS tecnico_username
        FROM examen_laboratorio el
        JOIN atencion a ON el.atencion_id = a.id
        JOIN historial_clinico hc ON a.historial_id = hc.id
        JOIN paciente p ON hc.paciente_id = p.id
        LEFT JOIN usuario u ON el.tecnico_id = u.id
        LEFT JOIN resultado_laboratorio rl ON rl.examen_id = el.id
        WHERE hc.paciente_id = $1
        ORDER BY el.fecha_solicitud DESC
      `;
      params = [pacienteId];
    } else if (rol === "MEDICO") {
      query = `
        SELECT el.*,
          rl.resultado, rl.valores_referencia, rl.observaciones AS resultado_observaciones, rl.es_critico, rl.fecha_resultado,
          a.motivo_consulta, a.diagnostico,
          hc.paciente_id,
          p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
          u.username AS tecnico_username
        FROM examen_laboratorio el
        JOIN atencion a ON el.atencion_id = a.id
        JOIN historial_clinico hc ON a.historial_id = hc.id
        JOIN paciente p ON hc.paciente_id = p.id
        LEFT JOIN usuario u ON el.tecnico_id = u.id
        LEFT JOIN resultado_laboratorio rl ON rl.examen_id = el.id
        WHERE a.medico_id = (
          SELECT medico_id FROM usuario WHERE id = $1
        )
        ORDER BY el.fecha_solicitud DESC
      `;
      params = [sesion.usuario_id];
    } else if (rol === "TECNICO_LAB") {
      query = `
        SELECT el.*,
          rl.resultado, rl.valores_referencia, rl.observaciones AS resultado_observaciones, rl.es_critico, rl.fecha_resultado,
          a.motivo_consulta, a.diagnostico,
          hc.paciente_id,
          p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
          u.username AS tecnico_username
        FROM examen_laboratorio el
        JOIN atencion a ON el.atencion_id = a.id
        JOIN historial_clinico hc ON a.historial_id = hc.id
        JOIN paciente p ON hc.paciente_id = p.id
        LEFT JOIN usuario u ON el.tecnico_id = u.id
        LEFT JOIN resultado_laboratorio rl ON rl.examen_id = el.id
        WHERE el.estado = 'SOLICITADO'
           OR el.tecnico_id = $1
        ORDER BY el.fecha_solicitud DESC
      `;
      params = [sesion.usuario_id];
    } else {
      query = `
        SELECT el.*,
          rl.resultado, rl.valores_referencia, rl.observaciones AS resultado_observaciones, rl.es_critico, rl.fecha_resultado,
          a.motivo_consulta, a.diagnostico,
          hc.paciente_id,
          p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
          u.username AS tecnico_username
        FROM examen_laboratorio el
        JOIN atencion a ON el.atencion_id = a.id
        JOIN historial_clinico hc ON a.historial_id = hc.id
        JOIN paciente p ON hc.paciente_id = p.id
        LEFT JOIN usuario u ON el.tecnico_id = u.id
        LEFT JOIN resultado_laboratorio rl ON rl.examen_id = el.id
        ORDER BY el.fecha_solicitud DESC
      `;
      params = [];
    }

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar examenes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "LABORATORIO", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { atencion_id, tipo_examen, observaciones_solicitud } = body;

    if (!atencion_id || !tipo_examen) {
      return NextResponse.json(
        { error: "atencion_id y tipo_examen son requeridos" },
        { status: 400 }
      );
    }

    const atencionId = parseInt(atencion_id);

    const { rows: atencionRows } = await pool.query(
      `SELECT a.id, a.medico_id, u.medico_id AS user_medico_id
       FROM atencion a
       JOIN usuario u ON u.id = $1
       WHERE a.id = $2`,
      [sesion.usuario_id, atencionId]
    );

    if (atencionRows.length === 0) {
      return NextResponse.json({ error: "Atencion no encontrada" }, { status: 404 });
    }

    const atencion = atencionRows[0];
    if (atencion.medico_id !== atencion.user_medico_id) {
      return NextResponse.json(
        { error: "Solo puede solicitar examenes para sus propias atenciones" },
        { status: 403 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud)
       VALUES ($1, $2, 'SOLICITADO', $3)
       RETURNING *`,
      [atencionId, tipo_examen, observaciones_solicitud || null]
    );

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "examen_laboratorio",
      accion: "INSERT",
      registro_id: rows[0].id,
      detalle: `Examen solicitado: ${tipo_examen} para atencion #${atencionId}`,
    });

    return NextResponse.json({ examen: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error al crear examen:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
