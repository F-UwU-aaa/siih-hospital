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
    if (!await verificarPermiso(sesion.usuario_id, "HISTORIAL", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;

    // RN-20: PACIENTE can only see own record
    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre, u.paciente_id FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;
    if (rol === "PACIENTE" && rolRows[0].paciente_id !== parseInt(id)) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    const { rows: historialRows } = await pool.query(
      "SELECT id FROM historial_clinico WHERE paciente_id = $1",
      [id]
    );
    if (historialRows.length === 0) {
      return NextResponse.json(
        { error: "Historial no encontrado" },
        { status: 404 }
      );
    }

    const { rows } = await pool.query(
      `SELECT a.*, u.username AS registrado_por_username
       FROM antecedente a
       LEFT JOIN usuario u ON a.usuario_id = u.id
       WHERE a.historial_id = $1
       ORDER BY a.fecha_registro DESC`,
      [historialRows[0].id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar antecedentes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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
    if (!await verificarPermiso(sesion.usuario_id, "HISTORIAL", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { tipo, descripcion } = body;

    if (!tipo || !descripcion) {
      return NextResponse.json(
        { error: "tipo y descripcion son requeridos" },
        { status: 400 }
      );
    }

    // Obtener historial_id
    const { rows: historialRows } = await pool.query(
      "SELECT id FROM historial_clinico WHERE paciente_id = $1",
      [id]
    );
    if (historialRows.length === 0) {
      return NextResponse.json(
        { error: "Historial no encontrado" },
        { status: 404 }
      );
    }

    const historialId = historialRows[0].id;

    // RN-24: registrar usuario_id y fecha_registro
    const { rows } = await pool.query(
      `INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id, fecha_registro)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [historialId, tipo, descripcion, sesion.usuario_id]
    );

    // RN-09: Auditar
    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "antecedente",
      accion: "INSERT",
      registro_id: rows[0].id,
      detalle: `Antecedente registrado: ${tipo} (paciente_id: ${id})`,
    });

    return NextResponse.json(
      { mensaje: "Antecedente registrado", antecedente: rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar antecedente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
