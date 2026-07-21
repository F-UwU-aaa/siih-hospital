import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { crearNotificacion } from "@/lib/notificaciones";
import { registrarAuditoria } from "@/lib/auditoria";

async function getRolYPacienteId(usuarioId: number) {
  const { rows } = await pool.query(
    `SELECT r.nombre AS rol_nombre, u.paciente_id
     FROM usuario u JOIN rol r ON u.rol_id = r.id
     WHERE u.id = $1`,
    [usuarioId]
  );
  return rows[0] as { rol_nombre: string; paciente_id: number | null } | undefined;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "CITAS", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;

    const { rows } = await pool.query(
      `SELECT
        c.*,
        p.ci AS paciente_ci,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        p.telefono AS paciente_telefono,
        p.email AS paciente_email,
        m.nombre AS medico_nombre,
        m.apellido AS medico_apellido,
        m.especialidad,
        m.telefono AS medico_telefono,
        u.username AS creado_por_username
      FROM cita c
      JOIN paciente p ON c.paciente_id = p.id
      JOIN medico m ON c.medico_id = m.id
      LEFT JOIN usuario u ON c.creado_por = u.id
      WHERE c.id = $1`,
      [parseInt(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    const cita = rows[0];
    const rol = await getRolYPacienteId(sesion.usuario_id);
    if (rol?.rol_nombre === "PACIENTE" && rol.paciente_id !== cita.paciente_id) {
      return NextResponse.json(
        { error: "No tiene acceso a esta cita" },
        { status: 403 }
      );
    }

    return NextResponse.json(cita);
  } catch (error) {
    console.error("Error al obtener cita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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
    if (!await verificarPermiso(sesion.usuario_id, "CITAS", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const rol = await getRolYPacienteId(sesion.usuario_id);
    if (rol?.rol_nombre === "DIRECTOR") {
      return NextResponse.json(
        { error: "Solo lectura — no puede modificar citas" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { estado, motivo } = body;

    const { rows: existing } = await pool.query(
      "SELECT id, estado, paciente_id, medico_id, fecha, hora FROM cita WHERE id = $1",
      [parseInt(id)]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    const citaActual = existing[0];

    if (rol?.rol_nombre === "PACIENTE" && rol.paciente_id !== citaActual.paciente_id) {
      return NextResponse.json(
        { error: "No puede modificar citas de otros pacientes" },
        { status: 403 }
      );
    }

    const estadosPermitidos = ["PENDIENTE", "CONFIRMADA", "EN_ESPERA", "COMPLETADA", "CANCELADA"];
    if (estado && !estadosPermitidos.includes(estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Permitidos: ${estadosPermitidos.join(", ")}` },
        { status: 400 }
      );
    }

    if (rol?.rol_nombre === "PACIENTE" && estado && !["CANCELADA"].includes(estado)) {
      return NextResponse.json(
        { error: "El paciente solo puede cancelar citas" },
        { status: 403 }
      );
    }

    if (citaActual.estado === "EN_ESPERA" && estado === "COMPLETADA") {
      return NextResponse.json(
        { error: "Una cita en EN_ESPERA solo puede completarse cerrando la atención médica desde el módulo de Atención Médica" },
        { status: 400 }
      );
    }

    const sets: string[] = [];
    const paramsArr: (string | number)[] = [];
    let paramIdx = 1;

    if (estado) {
      sets.push(`estado = $${paramIdx++}`);
      paramsArr.push(estado);
    }
    if (motivo !== undefined) {
      sets.push(`motivo = $${paramIdx++}`);
      paramsArr.push(motivo || null);
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    paramsArr.push(parseInt(id));
    const { rows } = await pool.query(
      `UPDATE cita SET ${sets.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      paramsArr
    );

    if (estado === "CANCELADA" && citaActual.estado !== "CANCELADA") {
      await crearNotificacion({
        paciente_id: citaActual.paciente_id,
        medico_id: citaActual.medico_id,
        cita_id: citaActual.id,
        tipo: "CANCELACION",
        asunto: `Cita cancelada - ${citaActual.fecha} ${citaActual.hora}`,
        mensaje: `Su cita del ${citaActual.fecha} a las ${citaActual.hora} ha sido cancelada.`,
      });
    }

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "cita",
      accion: "UPDATE",
      registro_id: parseInt(id),
      detalle: `Cita #${id} actualizada${estado ? ` — estado: ${citaActual.estado} → ${estado}` : ""}`,
    });

    return NextResponse.json({
      mensaje: "Cita actualizada",
      cita: rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
