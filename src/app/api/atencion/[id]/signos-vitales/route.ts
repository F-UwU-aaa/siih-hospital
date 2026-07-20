import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function POST(
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

    // Verificar que la atención existe
    const { rows: existing } = await pool.query(
      "SELECT id, historial_id FROM atencion WHERE id = $1",
      [atencionId]
    );
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Atención no encontrada" },
        { status: 404 }
      );
    }

    // Look up enfermera_id from the logged-in user
    const { rows: enfRows } = await pool.query(
      "SELECT enfermera_id FROM usuario WHERE id = $1 AND enfermera_id IS NOT NULL",
      [sesion.usuario_id]
    );
    const enfermeraId = enfRows.length > 0 ? enfRows[0].enfermera_id : null;

    const body = await request.json();
    const {
      temperatura,
      presion_sistolica,
      presion_diastolica,
      frecuencia_cardiaca,
      frecuencia_resp,
      saturacion_oxigeno,
      peso,
      talla,
    } = body;

    // Registrar signos vitales
    const { rows } = await pool.query(
      `INSERT INTO signos_vitales
        (atencion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica,
         frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        atencionId,
        enfermeraId,
        temperatura ?? null,
        presion_sistolica ?? null,
        presion_diastolica ?? null,
        frecuencia_cardiaca ?? null,
        frecuencia_resp ?? null,
        saturacion_oxigeno ?? null,
        peso ?? null,
        talla ?? null,
      ]
    );

    // Auditoría RN-09
    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "signos_vitales",
      accion: "INSERT",
      registro_id: rows[0].id,
      detalle: `Signos vitales registrados para atención #${atencionId}`,
    });

    return NextResponse.json(
      {
        mensaje: "Signos vitales registrados",
        signos_vitales: rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar signos vitales:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
