import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { crearNotificacion } from "@/lib/notificaciones";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "CITAS", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const paciente_id = searchParams.get("paciente_id");
    const medico_id = searchParams.get("medico_id");
    const fecha = searchParams.get("fecha");
    const estado = searchParams.get("estado");
    const busqueda = searchParams.get("busqueda");

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre, u.paciente_id
       FROM usuario u JOIN rol r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    const rolNombre = rolRows[0]?.nombre;
    const sesionPacienteId = rolRows[0]?.paciente_id;

    if (rolNombre === "PACIENTE" && sesionPacienteId) {
      conditions.push(`c.paciente_id = $${paramIdx++}`);
      params.push(sesionPacienteId);
    } else if (rolNombre === "MEDICO") {
      const { rows: medicoRows } = await pool.query(
        `SELECT medico_id FROM usuario WHERE id = $1 AND medico_id IS NOT NULL`,
        [sesion.usuario_id]
      );
      if (medicoRows.length > 0) {
        conditions.push(`c.medico_id = $${paramIdx++}`);
        params.push(medicoRows[0].medico_id);
      }
    } else if (paciente_id) {
      conditions.push(`c.paciente_id = $${paramIdx++}`);
      params.push(parseInt(paciente_id));
    }

    if (medico_id) {
      conditions.push(`c.medico_id = $${paramIdx++}`);
      params.push(parseInt(medico_id));
    }
    if (fecha) {
      conditions.push(`c.fecha = $${paramIdx++}`);
      params.push(fecha);
    }
    if (estado) {
      conditions.push(`c.estado = $${paramIdx++}`);
      params.push(estado);
    }
    if (busqueda) {
      conditions.push(`(
        p.ci ILIKE $${paramIdx} OR
        p.nombre ILIKE $${paramIdx} OR
        p.apellido ILIKE $${paramIdx} OR
        m.nombre ILIKE $${paramIdx} OR
        m.apellido ILIKE $${paramIdx}
      )`);
      params.push(`%${busqueda}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
        c.*,
        p.ci AS paciente_ci,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        m.nombre AS medico_nombre,
        m.apellido AS medico_apellido,
        m.especialidad,
        u.username AS creado_por_username
      FROM cita c
      JOIN paciente p ON c.paciente_id = p.id
      JOIN medico m ON c.medico_id = m.id
      LEFT JOIN usuario u ON c.creado_por = u.id
      ${where}
      ORDER BY c.fecha DESC, c.hora DESC`,
      params
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar citas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "CITAS", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { paciente_id, medico_id, fecha, hora, tipo, prioridad, motivo } = body;

    if (!paciente_id || !medico_id || !fecha || !hora) {
      return NextResponse.json(
        { error: "paciente_id, medico_id, fecha y hora son requeridos" },
        { status: 400 }
      );
    }

    const { rows: pacienteRows } = await pool.query(
      "SELECT id, nombre, apellido FROM paciente WHERE id = $1",
      [paciente_id]
    );
    if (pacienteRows.length === 0) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const { rows: medicoRows } = await pool.query(
      "SELECT id, nombre, apellido FROM medico WHERE id = $1 AND activo = TRUE",
      [medico_id]
    );
    if (medicoRows.length === 0) {
      return NextResponse.json({ error: "Médico no encontrado o inactivo" }, { status: 404 });
    }

    const esEmergencia = tipo === "EMERGENCIA";

    if (!esEmergencia) {
      const { rows: ocupado } = await pool.query(
        `SELECT id FROM cita
         WHERE medico_id = $1 AND fecha = $2 AND hora = $3
         AND estado NOT IN ('CANCELADA')`,
        [medico_id, fecha, hora]
      );
      if (ocupado.length > 0) {
        return NextResponse.json(
          { error: "Este horario ya está ocupado para este médico" },
          { status: 409 }
        );
      }
    }

    const { rows: citaRows } = await pool.query(
      `INSERT INTO cita
        (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        paciente_id,
        medico_id,
        fecha,
        hora,
        esEmergencia ? "CONFIRMADA" : "PENDIENTE",
        tipo || "NORMAL",
        prioridad || "NORMAL",
        motivo || null,
        sesion.usuario_id,
      ]
    );

    const cita = citaRows[0];

    await crearNotificacion({
      paciente_id,
      medico_id,
      cita_id: cita.id,
      tipo: "CITA",
      asunto: `Cita ${tipo || "NORMAL"} - ${fecha} ${hora}`,
      mensaje: `Su cita con Dr(a). ${medicoRows[0].apellido} ha sido programada para el ${fecha} a las ${hora}.`,
    });

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "cita",
      accion: "INSERT",
      registro_id: cita.id,
      detalle: `Cita #${cita.id} creada — paciente ${pacienteRows[0].nombre} ${pacienteRows[0].apellido}, Dr(a). ${medicoRows[0].apellido}, ${fecha} ${hora}`,
    });

    return NextResponse.json(
      {
        mensaje: "Cita creada exitosamente",
        cita,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear cita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
