import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "HOSPITALIZACION", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const hospId = parseInt(id);

    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    const { rows: hospRows } = await pool.query(
      `SELECT h.*,
        p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
        p.fecha_nacimiento, p.seguro_medico,
        c.numero_cama, c.piso, c.sala, c.tipo AS cama_tipo,
        m.nombre AS medico_nombre, m.apellido AS medico_apellido, m.especialidad
       FROM hospitalizacion h
       JOIN paciente p ON h.paciente_id = p.id
       JOIN cama c ON h.cama_id = c.id
       JOIN medico m ON h.medico_id = m.id
       WHERE h.id = $1`,
      [hospId]
    );

    if (hospRows.length === 0) {
      return NextResponse.json({ error: "Hospitalizacion no encontrada" }, { status: 404 });
    }

    const hosp = hospRows[0];

    if (rol === "MEDICO" && hosp.medico_id !== (await getMedicoId(sesion.usuario_id))) {
      return NextResponse.json({ error: "Sin acceso a esta hospitalizacion" }, { status: 403 });
    }

    const { rows: alergias } = await pool.query(
      `SELECT sustancia, reaccion, severidad
       FROM alergia
       WHERE historial_id = (SELECT id FROM historial_clinico WHERE paciente_id = $1)
       ORDER BY severidad DESC, fecha_registro DESC`,
      [hosp.paciente_id]
    );

    const { rows: antecedentes } = await pool.query(
      `SELECT tipo, descripcion
       FROM antecedente
       WHERE historial_id = (SELECT id FROM historial_clinico WHERE paciente_id = $1)
       ORDER BY fecha_registro DESC`,
      [hosp.paciente_id]
    );

    const { rows: signos_vitales } = await pool.query(
      `SELECT sv.*, u.username AS enfermera_username
       FROM signos_vitales sv
       LEFT JOIN usuario u ON sv.enfermera_id = u.enfermera_id
       WHERE sv.hospitalizacion_id = $1
       ORDER BY sv.fecha_hora DESC`,
      [hospId]
    );

    const { rows: medicaciones } = await pool.query(
      `SELECT ma.*, med.nombre AS medicamento_nombre, u.username AS enfermera_username
       FROM medicacion_administrada ma
       JOIN medicamento med ON ma.medicamento_id = med.id
       LEFT JOIN usuario u ON ma.enfermera_id = u.enfermera_id
       WHERE ma.hospitalizacion_id = $1
       ORDER BY ma.fecha_hora DESC`,
      [hospId]
    );

    let atenciones_previas: unknown[] = [];
    if (rol === "MEDICO" || rol === "ENFERMERA" || rol === "ADMIN") {
      const { rows } = await pool.query(
        `SELECT at.fecha_atencion, at.motivo_consulta, at.diagnostico, at.tipo,
                m2.nombre || ' ' || m2.apellido AS medico_nombre
         FROM atencion at
         JOIN medico m2 ON at.medico_id = m2.id
         JOIN historial_clinico hc ON at.historial_id = hc.id
         WHERE hc.paciente_id = $1 AND at.id != $2
         ORDER BY at.fecha_atencion DESC
         LIMIT 10`,
        [hosp.paciente_id, hosp.atencion_id ?? 0]
      );
      atenciones_previas = rows;
    }

    return NextResponse.json({
      hospitalizacion: hosp,
      alergias,
      antecedentes,
      signos_vitales,
      medicaciones,
      atenciones_previas,
    });
  } catch (error) {
    console.error("Error al obtener hospitalizacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "HOSPITALIZACION", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const hospId = parseInt(id);
    const body = await request.json();
    const { diagnostico_alta } = body;

    if (!diagnostico_alta) {
      return NextResponse.json({ error: "diagnostico_alta es requerido" }, { status: 400 });
    }

    const { rows: existing } = await pool.query(
      "SELECT id, estado, medico_id, cama_id FROM hospitalizacion WHERE id = $1",
      [hospId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Hospitalizacion no encontrada" }, { status: 404 });
    }

    const hosp = existing[0];
    if (hosp.estado !== "ACTIVA") {
      return NextResponse.json(
        { error: `No se puede dar de alta: estado actual es ${hosp.estado}` },
        { status: 400 }
      );
    }

    const userMedicoId = await getMedicoId(sesion.usuario_id);
    if (hosp.medico_id !== userMedicoId) {
      return NextResponse.json(
        { error: "Solo el medico tratante puede dar de alta" },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE hospitalizacion
         SET estado = 'ALTA', diagnostico_alta = $1, fecha_alta = NOW()
         WHERE id = $2`,
        [diagnostico_alta, hospId]
      );

      await client.query(
        "UPDATE cama SET estado = 'EN_LIMPIEZA' WHERE id = $1",
        [hosp.cama_id]
      );

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "hospitalizacion",
        accion: "UPDATE",
        registro_id: hospId,
        detalle: `Hospitalizacion #${hospId} dada de alta. Cama #${hosp.cama_id} → EN_LIMPIEZA`,
      });

      const { rows: updated } = await pool.query(
        "SELECT * FROM hospitalizacion WHERE id = $1",
        [hospId]
      );

      return NextResponse.json({ hospitalizacion: updated[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al dar de alta:", error);
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
