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

    const { id } = await params;

    // RN-20: PACIENTE can only see own record
    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre, u.paciente_id FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;
    if (rol === "PACIENTE" && rolRows[0].paciente_id !== parseInt(id)) {
      return NextResponse.json({ error: "Sin acceso a este paciente" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT p.*, u.username AS usuario_username
       FROM paciente p
       LEFT JOIN usuario u ON u.paciente_id = p.id
       WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener paciente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { rows: actuales } = await pool.query(
      "SELECT * FROM paciente WHERE id = $1",
      [id]
    );
    if (actuales.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const {
      nombre, apellido, fecha_nacimiento,
      sexo, direccion, telefono, email, seguro_medico, activo,
    } = body;

    await pool.query(
      `UPDATE paciente
       SET nombre = COALESCE($1, nombre),
           apellido = COALESCE($2, apellido),
           fecha_nacimiento = COALESCE($3, fecha_nacimiento),
           sexo = COALESCE($4, sexo),
           direccion = COALESCE($5, direccion),
           telefono = COALESCE($6, telefono),
           email = COALESCE($7, email),
           seguro_medico = COALESCE($8, seguro_medico),
           activo = COALESCE($9, activo)
       WHERE id = $10`,
      [
        nombre ?? null, apellido ?? null, fecha_nacimiento ?? null,
        sexo ?? null, direccion ?? null, telefono ?? null,
        email ?? null, seguro_medico ?? null, activo ?? null,
        id,
      ]
    );

    const { rows: updated } = await pool.query(
      "SELECT * FROM paciente WHERE id = $1",
      [id]
    );

    return NextResponse.json({
      mensaje: "Paciente actualizado",
      paciente: updated[0],
    });
  } catch (error) {
    console.error("Error al actualizar paciente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
