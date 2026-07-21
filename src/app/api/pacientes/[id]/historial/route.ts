import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "HISTORIAL", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;

    // RN-20: Si el usuario es PACIENTE, solo puede ver su propio historial
    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre, u.paciente_id
       FROM usuario u
       JOIN rol r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    if (rolRows.length > 0 && rolRows[0].nombre === "PACIENTE") {
      if (rolRows[0].paciente_id !== parseInt(id)) {
        return NextResponse.json(
          { error: "No tiene acceso a este historial" },
          { status: 403 }
        );
      }
    }

    // Verificar que el paciente existe
    const { rows: pacienteRows } = await pool.query(
      "SELECT p.* FROM paciente p WHERE p.id = $1",
      [id]
    );
    if (pacienteRows.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Obtener historial clínico
    const { rows: historialRows } = await pool.query(
      "SELECT id FROM historial_clinico WHERE paciente_id = $1",
      [id]
    );
    if (historialRows.length === 0) {
      return NextResponse.json(
        { error: "Historial clínico no encontrado" },
        { status: 404 }
      );
    }

    const historialId = historialRows[0].id;

    // Alergias
    const { rows: alergias } = await pool.query(
      `SELECT a.*, u.username AS registrado_por_username
       FROM alergia a
       LEFT JOIN usuario u ON a.usuario_id = u.id
       WHERE a.historial_id = $1
       ORDER BY a.fecha_registro DESC`,
      [historialId]
    );

    // Antecedentes
    const { rows: antecedentes } = await pool.query(
      `SELECT a.*, u.username AS registrado_por_username
       FROM antecedente a
       LEFT JOIN usuario u ON a.usuario_id = u.id
       WHERE a.historial_id = $1
       ORDER BY a.fecha_registro DESC`,
      [historialId]
    );

    // Atenciones previas (placeholder vacío por ahora)
    const { rows: atenciones } = await pool.query(
      `SELECT at.*, m.nombre || ' ' || m.apellido AS medico_nombre
       FROM atencion at
       LEFT JOIN medico m ON at.medico_id = m.id
       WHERE at.historial_id = $1
       ORDER BY at.fecha_atencion DESC`,
      [historialId]
    );

    // Últimos signos vitales (si existen)
    const { rows: signosVitales } = await pool.query(
      `SELECT sv.*
       FROM signos_vitales sv
       LEFT JOIN atencion at ON sv.atencion_id = at.id
       LEFT JOIN hospitalizacion h ON sv.hospitalizacion_id = h.id
       WHERE (at.historial_id = $1 OR h.paciente_id = $2)
       ORDER BY sv.fecha_hora DESC
       LIMIT 10`,
      [historialId, id]
    );

    return NextResponse.json({
      paciente: pacienteRows[0],
      alergias,
      antecedentes,
      atenciones,
      signos_vitales: signosVitales,
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
