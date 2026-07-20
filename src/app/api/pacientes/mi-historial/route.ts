import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

export async function GET() {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "HISTORIAL", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Obtener el paciente_id del usuario logueado
    const { rows: usuarioRows } = await pool.query(
      "SELECT paciente_id FROM usuario WHERE id = $1 AND activo = TRUE",
      [sesion.usuario_id]
    );

    if (usuarioRows.length === 0 || !usuarioRows[0].paciente_id) {
      return NextResponse.json(
        { error: "Usuario no tiene un paciente asociado" },
        { status: 403 }
      );
    }

    const pacienteId = usuarioRows[0].paciente_id;

    // RN-20: Obtener solo el historial propio
    const { rows: historialRows } = await pool.query(
      "SELECT id FROM historial_clinico WHERE paciente_id = $1",
      [pacienteId]
    );

    if (historialRows.length === 0) {
      return NextResponse.json(
        { error: "No se encontró historial clínico" },
        { status: 404 }
      );
    }

    const historialId = historialRows[0].id;

    // Datos del paciente
    const { rows: pacienteRows } = await pool.query(
      "SELECT id, ci, nombre, apellido, fecha_nacimiento, sexo, telefono, email, seguro_medico FROM paciente WHERE id = $1",
      [pacienteId]
    );

    // Alergias
    const { rows: alergias } = await pool.query(
      `SELECT id, sustancia, reaccion, severidad, fecha_registro
       FROM alergia WHERE historial_id = $1
       ORDER BY fecha_registro DESC`,
      [historialId]
    );

    // Antecedentes
    const { rows: antecedentes } = await pool.query(
      `SELECT id, tipo, descripcion, fecha_registro
       FROM antecedente WHERE historial_id = $1
       ORDER BY fecha_registro DESC`,
      [historialId]
    );

    return NextResponse.json({
      paciente: pacienteRows[0],
      alergias,
      antecedentes,
      message: "Atenciones, signos vitales, recetas y exámenes se mostrarán cuando esos módulos estén disponibles",
    });
  } catch (error) {
    console.error("Error al obtener mi historial:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
