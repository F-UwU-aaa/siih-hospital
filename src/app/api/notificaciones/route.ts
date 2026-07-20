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

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const tipo = searchParams.get("tipo");
    const pacienteId = searchParams.get("paciente_id");
    const medicoId = searchParams.get("medico_id");

    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    // RBAC filtering
    if (rol === "ADMIN" || rol === "DIRECTOR") {
      // Can see all
    } else {
      // Can only see own notifications, role-targeted, or system ones
      conditions.push(`(
        n.paciente_id = (SELECT paciente_id FROM usuario WHERE id = $${paramIdx} AND paciente_id IS NOT NULL)
        OR n.medico_id = (SELECT medico_id FROM usuario WHERE id = $${paramIdx} AND medico_id IS NOT NULL)
        OR n.rol_destino = $${paramIdx + 1}
        OR (n.paciente_id IS NULL AND n.medico_id IS NULL AND n.rol_destino IS NULL)
      )`);
      params.push(sesion.usuario_id, rol);
      paramIdx += 2;
    }

    if (estado) {
      conditions.push(`n.estado = $${paramIdx++}`);
      params.push(estado);
    }
    if (tipo) {
      conditions.push(`n.tipo = $${paramIdx++}`);
      params.push(tipo);
    }
    if (pacienteId) {
      conditions.push(`n.paciente_id = $${paramIdx++}`);
      params.push(parseInt(pacienteId));
    }
    if (medicoId) {
      conditions.push(`n.medico_id = $${paramIdx++}`);
      params.push(parseInt(medicoId));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT n.*,
        p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.ci AS paciente_ci,
        m.nombre AS medico_nombre, m.apellido AS medico_apellido, m.especialidad AS medico_especialidad
       FROM notificacion n
       LEFT JOIN paciente p ON n.paciente_id = p.id
       LEFT JOIN medico m ON n.medico_id = m.id
       ${where}
       ORDER BY n.creado_en DESC NULLS LAST, n.fecha_envio DESC NULLS LAST
       LIMIT 200`,
      params
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar notificaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, accion } = body;

    if (!id || !["ENVIAR", "FALLIDA"].includes(accion)) {
      return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
    }

    const { rows: notifRows } = await pool.query(
      "SELECT * FROM notificacion WHERE id = $1",
      [id]
    );
    if (notifRows.length === 0) {
      return NextResponse.json({ error: "Notificacion no encontrada" }, { status: 404 });
    }

    const notif = notifRows[0];

    // RBAC: only admin/director or the recipient can modify
    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    if (rol !== "ADMIN" && rol !== "DIRECTOR") {
      const { rows: userRows } = await pool.query(
        "SELECT paciente_id, medico_id FROM usuario WHERE id = $1",
        [sesion.usuario_id]
      );
      const user = userRows[0];
      if (user?.paciente_id !== notif.paciente_id && user?.medico_id !== notif.medico_id && notif.rol_destino !== rol) {
        return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
      }
    }

    if (accion === "ENVIAR") {
      // Simulated delivery: mark as ENVIADA with timestamp
      await pool.query(
        `UPDATE notificacion SET estado = 'ENVIADA', fecha_envio = NOW() WHERE id = $1`,
        [id]
      );
    } else {
      await pool.query(
        `UPDATE notificacion SET estado = 'FALLIDA' WHERE id = $1`,
        [id]
      );
    }

    const { rows: updated } = await pool.query("SELECT * FROM notificacion WHERE id = $1", [id]);
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error al actualizar notificacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
