import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";
import { generarFactura } from "@/lib/facturacion";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "ATENCION", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const atencionId = parseInt(id);

    // Obtener atención con joins de paciente y médico
    const { rows: atencionRows } = await pool.query(
      `SELECT
        a.*,
        m.nombre AS medico_nombre,
        m.apellido AS medico_apellido,
        m.especialidad,
        hc.paciente_id,
        p.ci AS paciente_ci,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        p.fecha_nacimiento,
        p.sexo,
        p.telefono AS paciente_telefono,
        p.email AS paciente_email,
        p.seguro_medico
      FROM atencion a
      JOIN medico m ON a.medico_id = m.id
      JOIN historial_clinico hc ON a.historial_id = hc.id
      JOIN paciente p ON hc.paciente_id = p.id
      WHERE a.id = $1`,
      [atencionId]
    );

    if (atencionRows.length === 0) {
      return NextResponse.json(
        { error: "Atención no encontrada" },
        { status: 404 }
      );
    }

    const atencion = atencionRows[0];

    // Alergias SIEMPRE se devuelven (RN-04) — imposible de ignorar
    const { rows: alergias } = await pool.query(
      `SELECT sustancia, reaccion, severidad
       FROM alergia
       WHERE historial_id = $1
       ORDER BY severidad DESC, fecha_registro DESC`,
      [atencion.historial_id]
    );

    // Antecedentes
    const { rows: antecedentes } = await pool.query(
      `SELECT tipo, descripcion
       FROM antecedente
       WHERE historial_id = $1
       ORDER BY fecha_registro DESC`,
      [atencion.historial_id]
    );

    // Atenciones previas (excluyendo la actual)
    const { rows: atenciones_previas } = await pool.query(
      `SELECT at.fecha_atencion, at.motivo_consulta, at.diagnostico, at.tipo,
              m.nombre || ' ' || m.apellido AS medico_nombre
       FROM atencion at
       JOIN medico m ON at.medico_id = m.id
       WHERE at.historial_id = $1 AND at.id != $2
       ORDER BY at.fecha_atencion DESC
       LIMIT 10`,
      [atencion.historial_id, atencionId]
    );

    // Signos vitales de esta atención
    const { rows: signos_vitales } = await pool.query(
      `SELECT sv.*
       FROM signos_vitales sv
       WHERE sv.atencion_id = $1
       ORDER BY sv.fecha_hora DESC`,
      [atencionId]
    );

    return NextResponse.json({
      atencion,
      alergias,
      antecedentes,
      atenciones_previas,
      signos_vitales,
    });
  } catch (error) {
    console.error("Error al obtener atención:", error);
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
    if (!await verificarPermiso(sesion.usuario_id, "ATENCION", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const atencionId = parseInt(id);
    const body = await request.json();
    const { motivo_consulta, diagnostico, tratamiento, observaciones, cerrar } = body;

    // Verificar que la atención existe
    const { rows: existing } = await pool.query(
      "SELECT id, cita_id FROM atencion WHERE id = $1",
      [atencionId]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Atención no encontrada" },
        { status: 404 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Actualizar campos de la atención (solo los proporcionados)
      const sets: string[] = [];
      const paramsArr: (string | number)[] = [];
      let paramIdx = 1;

      if (motivo_consulta !== undefined) {
        sets.push(`motivo_consulta = $${paramIdx++}`);
        paramsArr.push(motivo_consulta);
      }
      if (diagnostico !== undefined) {
        sets.push(`diagnostico = $${paramIdx++}`);
        paramsArr.push(diagnostico);
      }
      if (tratamiento !== undefined) {
        sets.push(`tratamiento = $${paramIdx++}`);
        paramsArr.push(tratamiento);
      }
      if (observaciones !== undefined) {
        sets.push(`observaciones = $${paramIdx++}`);
        paramsArr.push(observaciones);
      }

      let atencionActualizada = null;
      if (sets.length > 0) {
        paramsArr.push(atencionId);
        const { rows } = await client.query(
          `UPDATE atencion SET ${sets.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
          paramsArr
        );
        atencionActualizada = rows[0];
      } else {
        const { rows } = await client.query(
          "SELECT * FROM atencion WHERE id = $1",
          [atencionId]
        );
        atencionActualizada = rows[0];
      }

      // Cerrar atención → CITA.estado = COMPLETADA
      if (cerrar && existing[0].cita_id) {
        await client.query(
          "UPDATE cita SET estado = 'COMPLETADA' WHERE id = $1 AND estado != 'CANCELADA'",
          [existing[0].cita_id]
        );
      }

      await client.query("COMMIT");

      // Auditoría RN-09
      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "atencion",
        accion: cerrar ? "CLOSE" : "UPDATE",
        registro_id: atencionId,
        detalle: cerrar
          ? `Atención #${atencionId} cerrada → Cita #${existing[0].cita_id} COMPLETADA`
          : `Atención #${atencionId} actualizada`,
      });

      if (cerrar && existing[0].cita_id) {
        await registrarAuditoria({
          usuario_id: sesion.usuario_id,
          tabla_afectada: "cita",
          accion: "UPDATE",
          registro_id: existing[0].cita_id,
          detalle: `Cita COMPLETADA desde atención #${atencionId}`,
        });
      }

      if (cerrar && atencionActualizada) {
        try {
          const { rows: hcRows } = await pool.query(
            "SELECT paciente_id FROM historial_clinico WHERE id = $1",
            [atencionActualizada.historial_id]
          );
          if (hcRows.length > 0) {
            await generarFactura(hcRows[0].paciente_id, sesion.usuario_id, atencionId);
          }
        } catch (e) {
          console.error("Auto-facturación al cerrar atención falló:", e);
        }
      }

      return NextResponse.json({
        mensaje: cerrar ? "Atención cerrada" : "Atención actualizada",
        atencion: atencionActualizada,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al actualizar atención:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
