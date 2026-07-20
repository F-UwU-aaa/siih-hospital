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

    const { rows } = await pool.query(
      `SELECT sv.*, u.username AS enfermera_username
       FROM signos_vitales sv
       LEFT JOIN usuario u ON sv.enfermera_id = u.enfermera_id
       WHERE sv.hospitalizacion_id = $1
       ORDER BY sv.fecha_hora DESC`,
      [hospId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al obtener signos vitales:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(
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

    const { rows: existing } = await pool.query(
      "SELECT id, estado FROM hospitalizacion WHERE id = $1",
      [hospId]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Hospitalizacion no encontrada" }, { status: 404 });
    }
    if (existing[0].estado !== "ACTIVA") {
      return NextResponse.json(
        { error: "Solo se pueden registrar signos en hospitalizaciones activas" },
        { status: 400 }
      );
    }

    const { rows: enfRows } = await pool.query(
      "SELECT enfermera_id FROM usuario WHERE id = $1 AND enfermera_id IS NOT NULL",
      [sesion.usuario_id]
    );
    if (enfRows.length === 0) {
      return NextResponse.json(
        { error: "Solo las enfermeras pueden registrar signos vitales en hospitalizacion" },
        { status: 403 }
      );
    }
    const enfermeraId = enfRows[0].enfermera_id;

    const body = await request.json();
    const { temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla } = body;

    const { rows } = await pool.query(
      `INSERT INTO signos_vitales
         (hospitalizacion_id, enfermera_id, temperatura, presion_sistolica, presion_diastolica,
          frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        hospId,
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

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "signos_vitales",
      accion: "INSERT",
      registro_id: rows[0].id,
      detalle: `Signos vitales registrados para hospitalizacion #${hospId}`,
    });

    return NextResponse.json({ signos: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error al registrar signos vitales:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
