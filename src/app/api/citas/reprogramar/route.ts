import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { crearNotificacion } from "@/lib/notificaciones";

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
    const { cita_id, nueva_fecha, nueva_hora } = body;

    if (!cita_id || !nueva_fecha || !nueva_hora) {
      return NextResponse.json(
        { error: "cita_id, nueva_fecha y nueva_hora son requeridos" },
        { status: 400 }
      );
    }

    const { rows: existing } = await pool.query(
      "SELECT id, estado, paciente_id, medico_id, fecha, hora FROM cita WHERE id = $1",
      [parseInt(cita_id)]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const citaActual = existing[0];

    if (!["PENDIENTE", "CONFIRMADA"].includes(citaActual.estado)) {
      return NextResponse.json(
        { error: "Solo se pueden reprogramar citas PENDIENTES o CONFIRMADAS" },
        { status: 400 }
      );
    }

    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre AS rol_nombre, u.paciente_id
       FROM usuario u JOIN rol r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    const rol = rolRows[0];

    if (rol?.rol_nombre === "PACIENTE" && rol.paciente_id !== citaActual.paciente_id) {
      return NextResponse.json(
        { error: "No puede reprogramar citas de otros pacientes" },
        { status: 403 }
      );
    }

    if (rol?.rol_nombre === "MEDICO" || rol?.rol_nombre === "DIRECTOR") {
      return NextResponse.json(
        { error: "Solo lectura — no puede reprogramar citas" },
        { status: 403 }
      );
    }

    const { rows: ocupado } = await pool.query(
      `SELECT id FROM cita
       WHERE medico_id = $1 AND fecha = $2 AND hora = $3
       AND estado NOT IN ('CANCELADA')`,
      [citaActual.medico_id, nueva_fecha, nueva_hora]
    );
    if (ocupado.length > 0) {
      return NextResponse.json(
        { error: "El nuevo horario ya está ocupado para este médico" },
        { status: 409 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        "UPDATE cita SET estado = 'CANCELADA' WHERE id = $1",
        [citaActual.id]
      );

      const { rows: nuevaCitaRows } = await client.query(
        `INSERT INTO cita
          (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
         VALUES ($1, $2, $3, $4, 'PENDIENTE', $5, $6, $7, $8)
         RETURNING *`,
        [
          citaActual.paciente_id,
          citaActual.medico_id,
          nueva_fecha,
          nueva_hora,
          "NORMAL",
          "NORMAL",
          `Reprogramada desde cita #${citaActual.id}`,
          sesion.usuario_id,
        ]
      );

      await client.query("COMMIT");

      const nuevaCita = nuevaCitaRows[0];

      const { rows: medicoRows } = await pool.query(
        "SELECT apellido FROM medico WHERE id = $1",
        [citaActual.medico_id]
      );
      const apellidoMedico = medicoRows[0]?.apellido || "";

      await crearNotificacion({
        paciente_id: citaActual.paciente_id,
        medico_id: citaActual.medico_id,
        cita_id: citaActual.id,
        tipo: "CANCELACION",
        asunto: `Cita reprogramada - cancelación anterior`,
        mensaje: `Su cita del ${citaActual.fecha} a las ${citaActual.hora} ha sido cancelada por reprogramación.`,
      });

      await crearNotificacion({
        paciente_id: citaActual.paciente_id,
        medico_id: citaActual.medico_id,
        cita_id: nuevaCita.id,
        tipo: "CITA",
        asunto: `Cita reprogramada - ${nueva_fecha} ${nueva_hora}`,
        mensaje: `Su nueva cita con Dr(a). ${apellidoMedico} es el ${nueva_fecha} a las ${nueva_hora}.`,
      });

      return NextResponse.json(
        {
          mensaje: "Cita reprogramada exitosamente",
          cita_anterior: { id: citaActual.id, estado: "CANCELADA" },
          cita_nueva: nuevaCita,
        },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al reprogramar cita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
