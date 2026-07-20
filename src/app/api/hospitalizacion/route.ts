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
    if (!await verificarPermiso(sesion.usuario_id, "HOSPITALIZACION", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    let query: string;
    let params: unknown[];

    const baseSelect = `
      SELECT h.*,
        p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
        c.numero_cama, c.piso, c.sala, c.tipo AS cama_tipo,
        m.nombre AS medico_nombre, m.apellido AS medico_apellido, m.especialidad,
        (SELECT COUNT(*)::int FROM alergia a
         JOIN historial_clinico hc ON a.historial_id = hc.id
         WHERE hc.paciente_id = h.paciente_id) AS alergias_count
      FROM hospitalizacion h
      JOIN paciente p ON h.paciente_id = p.id
      JOIN cama c ON h.cama_id = c.id
      JOIN medico m ON h.medico_id = m.id
    `;

    if (rol === "MEDICO") {
      query = `${baseSelect}
        WHERE h.medico_id = (SELECT medico_id FROM usuario WHERE id = $1)
        ORDER BY h.fecha_ingreso DESC`;
      params = [sesion.usuario_id];
    } else if (rol === "ENFERMERA") {
      query = `${baseSelect}
        WHERE h.estado = 'ACTIVA'
        ORDER BY c.piso, c.sala, p.nombre`;
      params = [];
    } else {
      query = `${baseSelect} ORDER BY h.fecha_ingreso DESC`;
      params = [];
    }

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar hospitalizaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "HOSPITALIZACION", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { atencion_id, cama_id, diagnostico_ingreso } = body;

    if (!atencion_id || !cama_id || !diagnostico_ingreso) {
      return NextResponse.json(
        { error: "atencion_id, cama_id y diagnostico_ingreso son requeridos" },
        { status: 400 }
      );
    }

    const atencionId = parseInt(atencion_id);
    const camaId = parseInt(cama_id);

    const { rows: atencionRows } = await pool.query(
      `SELECT a.id, a.medico_id, hc.paciente_id, u.medico_id AS user_medico_id
       FROM atencion a
       JOIN historial_clinico hc ON a.historial_id = hc.id
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
        { error: "Solo puede hospitalizar pacientes de sus propias atenciones" },
        { status: 403 }
      );
    }

    const { rows: existente } = await pool.query(
      "SELECT id FROM hospitalizacion WHERE atencion_id = $1 AND estado = 'ACTIVA'",
      [atencionId]
    );
    if (existente.length > 0) {
      return NextResponse.json(
        { error: "Ya existe una hospitalizacion activa para esta atencion" },
        { status: 400 }
      );
    }

    const { rows: camaRows } = await pool.query(
      "SELECT id, estado FROM cama WHERE id = $1",
      [camaId]
    );
    if (camaRows.length === 0) {
      return NextResponse.json({ error: "Cama no encontrada" }, { status: 404 });
    }
    if (camaRows[0].estado !== "DISPONIBLE") {
      return NextResponse.json(
        { error: `La cama no esta disponible (estado actual: ${camaRows[0].estado})` },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: hospRows } = await client.query(
        `INSERT INTO hospitalizacion
           (paciente_id, medico_id, cama_id, atencion_id, diagnostico_ingreso, estado)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVA')
         RETURNING *`,
        [atencion.paciente_id, atencion.medico_id, camaId, atencionId, diagnostico_ingreso]
      );

      await client.query(
        "UPDATE cama SET estado = 'OCUPADA' WHERE id = $1",
        [camaId]
      );

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "hospitalizacion",
        accion: "INSERT",
        registro_id: hospRows[0].id,
        detalle: `Hospitalizacion #${hospRows[0].id} creada: paciente_id=${atencion.paciente_id}, cama=${camaId}, atencion #${atencionId}`,
      });

      return NextResponse.json({ hospitalizacion: hospRows[0] }, { status: 201 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al crear hospitalizacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
