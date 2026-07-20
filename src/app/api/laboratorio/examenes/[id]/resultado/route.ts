import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";
import { crearNotificacion } from "@/lib/notificaciones";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "LABORATORIO", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const examenId = parseInt(id);

    const { rows: existing } = await pool.query(
      `SELECT el.id, el.estado, el.tecnico_id, el.tipo_examen, el.atencion_id,
              a.medico_id AS medico_tratante_id,
              hc.paciente_id
       FROM examen_laboratorio el
       JOIN atencion a ON el.atencion_id = a.id
       JOIN historial_clinico hc ON a.historial_id = hc.id
       WHERE el.id = $1`,
      [examenId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
    }

    const examen = existing[0];

    if (examen.estado !== "EN_PROCESO") {
      return NextResponse.json(
        { error: `No se puede registrar resultado: estado actual es ${examen.estado}, se requiere EN_PROCESO` },
        { status: 400 }
      );
    }

    if (examen.tecnico_id !== sesion.usuario_id) {
      return NextResponse.json(
        { error: "Solo el tecnico que tomo el examen puede registrar el resultado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { resultado, valores_referencia, observaciones, es_critico } = body;

    if (!resultado) {
      return NextResponse.json(
        { error: "resultado es requerido" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: resultRows } = await client.query(
        `INSERT INTO resultado_laboratorio (examen_id, resultado, valores_referencia, observaciones, es_critico)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [examenId, resultado, valores_referencia || null, observaciones || null, es_critico === true]
      );

      await client.query(
        "UPDATE examen_laboratorio SET estado = 'COMPLETADO' WHERE id = $1",
        [examenId]
      );

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "examen_laboratorio",
        accion: "UPDATE",
        registro_id: examenId,
        detalle: `Resultado registrado para examen #${examenId} (${examen.tipo_examen}): ${es_critico ? "CRITICO" : "NORMAL"}`,
      });

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "resultado_laboratorio",
        accion: "INSERT",
        registro_id: resultRows[0].id,
        detalle: `Resultado creado para examen #${examenId}: ${resultado.substring(0, 100)}`,
      });

      if (es_critico === true) {
        await crearNotificacion({
          medico_id: examen.medico_tratante_id,
          paciente_id: examen.paciente_id,
          tipo: "ALERTA_LAB",
          asunto: "Resultado Critico de Laboratorio",
          mensaje: `Resultado CRITICO: ${examen.tipo_examen} - ${resultado.substring(0, 200)}`,
        });
      }

      return NextResponse.json({
        resultado: resultRows[0],
        examen_estado: "COMPLETADO",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al registrar resultado:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
