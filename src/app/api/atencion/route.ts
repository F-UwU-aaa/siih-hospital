import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "ATENCION", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const medico_id = searchParams.get("medico_id");
    const paciente_id = searchParams.get("paciente_id");
    const cita_id = searchParams.get("cita_id");

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (medico_id) {
      conditions.push(`a.medico_id = $${paramIdx++}`);
      params.push(parseInt(medico_id));
    }
    if (paciente_id) {
      conditions.push(`a.historial_id IN (SELECT id FROM historial_clinico WHERE paciente_id = $${paramIdx})`);
      params.push(parseInt(paciente_id));
      paramIdx++;
    }
    if (cita_id) {
      conditions.push(`a.cita_id = $${paramIdx++}`);
      params.push(parseInt(cita_id));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
        a.*,
        m.nombre AS medico_nombre,
        m.apellido AS medico_apellido,
        m.especialidad,
        p.ci AS paciente_ci,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        hc.paciente_id
      FROM atencion a
      JOIN medico m ON a.medico_id = m.id
      JOIN historial_clinico hc ON a.historial_id = hc.id
      JOIN paciente p ON hc.paciente_id = p.id
      ${where}
      ORDER BY a.fecha_atencion DESC`,
      params
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar atenciones:", error);
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
    if (!await verificarPermiso(sesion.usuario_id, "ATENCION", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { cita_id, emergencia, paciente_id, paciente_ci, paciente_nombre, paciente_apellido, paciente_fecha_nacimiento, medico_id: medicoIdBody } = body;

    // CU-03A: Crear atención a partir de una cita existente
    if (cita_id && !emergencia) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Verificar que la cita existe y está en estado válido
        const { rows: citaRows } = await client.query(
          `SELECT c.*, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, m.id AS medico_real_id
           FROM cita c
           JOIN paciente p ON c.paciente_id = p.id
           JOIN medico m ON c.medico_id = m.id
           WHERE c.id = $1`,
          [cita_id]
        );
        if (citaRows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }
        const cita = citaRows[0];
        if (cita.estado !== "EN_ESPERA" && cita.estado !== "CONFIRMADA") {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "La cita debe estar en estado EN_ESPERA o CONFIRMADA" },
            { status: 400 }
          );
        }

        // Obtener historial_clinico del paciente
        const { rows: historialRows } = await client.query(
          "SELECT id FROM historial_clinico WHERE paciente_id = $1",
          [cita.paciente_id]
        );
        if (historialRows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "El paciente no tiene historial clínico" },
            { status: 400 }
          );
        }
        const historialId = historialRows[0].id;

        // Crear ATENCION
        const { rows: atencionRows } = await client.query(
          `INSERT INTO atencion (historial_id, medico_id, cita_id, fecha_atencion, tipo)
           VALUES ($1, $2, $3, NOW(), 'CONSULTA')
           RETURNING *`,
          [historialId, cita.medico_real_id, cita_id]
        );
        const atencion = atencionRows[0];

        // Actualizar CITA a EN_ESPERA si estaba CONFIRMADA
        if (cita.estado === "CONFIRMADA") {
          await client.query(
            "UPDATE cita SET estado = 'EN_ESPERA' WHERE id = $1",
            [cita_id]
          );
        }

        await client.query("COMMIT");

        // Auditoría RN-09
        await registrarAuditoria({
          usuario_id: sesion.usuario_id,
          tabla_afectada: "atencion",
          accion: "INSERT",
          registro_id: atencion.id,
          detalle: `Atención CONSULTA creada para cita #${cita_id}`,
        });

        // Alergias SIEMPRE incluidas (RN-04)
        const { rows: alergias } = await pool.query(
          "SELECT sustancia, reaccion, severidad FROM alergia WHERE historial_id = $1",
          [historialId]
        );

        return NextResponse.json(
          {
            mensaje: "Atención creada exitosamente",
            atencion,
            alergias,
          },
          { status: 201 }
        );
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    // CU-03B: Emergencia sin cita previa
    if (emergencia) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        let pacienteId: number;

        // Buscar paciente existente o crear uno temporal
        if (paciente_id) {
          pacienteId = parseInt(paciente_id);
          const { rows: existeP } = await client.query(
            "SELECT id FROM paciente WHERE id = $1",
            [pacienteId]
          );
          if (existeP.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
          }
        } else if (paciente_ci) {
          // Buscar por CI
          const { rows: existente } = await client.query(
            "SELECT id FROM paciente WHERE ci = $1",
            [paciente_ci]
          );
          if (existente.length > 0) {
            pacienteId = existente[0].id;
          } else {
            // Crear paciente nuevo
            const { rows: nuevoP } = await client.query(
              `INSERT INTO paciente (ci, nombre, apellido, fecha_nacimiento, registrado_por)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id`,
              [
                paciente_ci,
                paciente_nombre || "DESCONOCIDO",
                paciente_apellido || "DESCONOCIDO",
                paciente_fecha_nacimiento || "1900-01-01",
                sesion.usuario_id,
              ]
            );
            pacienteId = nuevoP[0].id;
            // Crear historial_clinico
            await client.query(
              "INSERT INTO historial_clinico (paciente_id) VALUES ($1)",
              [pacienteId]
            );
          }
        } else {
          // Paciente desconocido — crear temporal con CI timestamp
          const tempCi = `TEMP-${Date.now()}`;
          const { rows: nuevoP } = await client.query(
            `INSERT INTO paciente (ci, nombre, apellido, fecha_nacimiento, registrado_por)
             VALUES ($1, 'DESCONOCIDO', 'DESCONOCIDO', '1900-01-01', $2)
             RETURNING id`,
            [tempCi, sesion.usuario_id]
          );
          pacienteId = nuevoP[0].id;
          await client.query(
            "INSERT INTO historial_clinico (paciente_id) VALUES ($1)",
            [pacienteId]
          );
        }

        // Obtener historial
        const { rows: historialRows } = await client.query(
          "SELECT id FROM historial_clinico WHERE paciente_id = $1",
          [pacienteId]
        );
        const historialId = historialRows[0].id;

        // Obtener médico — usar el de la sesión o el proporcionado
        let medicoId: number;
        if (medicoIdBody) {
          medicoId = parseInt(medicoIdBody);
        } else {
          // Buscar el médico asociado al usuario de la sesión
          const { rows: medicoRows } = await client.query(
            `SELECT m.id FROM medico m
             JOIN usuario u ON u.medico_id = m.id
             WHERE u.id = $1 AND m.activo = TRUE`,
            [sesion.usuario_id]
          );
          if (medicoRows.length === 0) {
            // Si el usuario no es médico, buscar el primer médico activo
            const { rows: primerMedico } = await client.query(
              "SELECT id FROM medico WHERE activo = TRUE ORDER BY id LIMIT 1"
            );
            if (primerMedico.length === 0) {
              await client.query("ROLLBACK");
              return NextResponse.json(
                { error: "No hay médicos disponibles" },
                { status: 400 }
              );
            }
            medicoId = primerMedico[0].id;
          } else {
            medicoId = medicoRows[0].id;
          }
        }

        // Crear CITA tipo EMERGENCIA (sin validación de horario — RN-03)
        const now = new Date();
        const fecha = now.toISOString().split("T")[0];
        const hora = now.toTimeString().slice(0, 5);
        const { rows: citaRows } = await client.query(
          `INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
           VALUES ($1, $2, $3, $4, 'CONFIRMADA', 'EMERGENCIA', 'ALTA', 'Emergencia médica', $5)
           RETURNING *`,
          [pacienteId, medicoId, fecha, hora, sesion.usuario_id]
        );
        const cita = citaRows[0];

        // Crear ATENCION
        const { rows: atencionRows } = await client.query(
          `INSERT INTO atencion (historial_id, medico_id, cita_id, fecha_atencion, tipo)
           VALUES ($1, $2, $3, NOW(), 'EMERGENCIA')
           RETURNING *`,
          [historialId, medicoId, cita.id]
        );
        const atencion = atencionRows[0];

        await client.query("COMMIT");

        // Auditoría RN-09
        await registrarAuditoria({
          usuario_id: sesion.usuario_id,
          tabla_afectada: "atencion",
          accion: "INSERT",
          registro_id: atencion.id,
          detalle: `Atención EMERGENCIA creada (cita #${cita.id}, paciente #${pacienteId})`,
        });

        // Alergias SIEMPRE incluidas (RN-04)
        const { rows: alergias } = await pool.query(
          "SELECT sustancia, reaccion, severidad FROM alergia WHERE historial_id = $1",
          [historialId]
        );

        return NextResponse.json(
          {
            mensaje: "Emergencia registrada exitosamente",
            atencion,
            cita,
            alergias,
          },
          { status: 201 }
        );
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    return NextResponse.json(
      { error: "Se requiere cita_id o emergencia=true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error al crear atención:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
