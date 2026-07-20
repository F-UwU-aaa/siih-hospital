import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";
import { hashPassword } from "@/lib/hash";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email, u.ultimo_acceso, u.activo,
              u.rol_id, r.nombre AS rol_nombre,
              u.paciente_id, u.medico_id, u.enfermera_id,
              u.farmaceutico_id, u.tecnico_lab_id,
              u.admisionista_id, u.facturador_id,
              -- Datos del actor
              COALESCE(m.ci, e.ci, f.ci, tl.ci, a.ci, fa.ci) AS ci,
              COALESCE(m.nombre, e.nombre, f.nombre, tl.nombre, a.nombre, fa.nombre) AS nombre,
              COALESCE(m.apellido, e.apellido, f.apellido, tl.apellido, a.apellido, fa.apellido) AS apellido,
              m.especialidad, m.horario_atencion,
              e.turno,
              COALESCE(m.telefono, e.telefono, f.telefono, tl.telefono, a.telefono, fa.telefono) AS telefono,
              COALESCE(m.email, e.email, f.email, tl.email, a.email, fa.email) AS actor_email
       FROM usuario u
       JOIN rol r ON u.rol_id = r.id
       LEFT JOIN medico m ON u.medico_id = m.id
       LEFT JOIN enfermera e ON u.enfermera_id = e.id
       LEFT JOIN farmaceutico f ON u.farmaceutico_id = f.id
       LEFT JOIN tecnico_laboratorio tl ON u.tecnico_lab_id = tl.id
       LEFT JOIN admisionista a ON u.admisionista_id = a.id
       LEFT JOIN facturador fa ON u.facturador_id = fa.id
       WHERE u.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
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
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { username, email, password, rol_nombre } = body;

    // Obtener usuario actual
    const { rows: actuales } = await pool.query(
      "SELECT * FROM usuario WHERE id = $1",
      [id]
    );
    if (actuales.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    const actual = actuales[0];

    // Si cambia el rol → registrar en auditoría (RN-17)
    let nuevoRolId = actual.rol_id;
    if (rol_nombre && rol_nombre !== actual.rol_id) {
      const { rows: rolRows } = await pool.query(
        "SELECT id FROM rol WHERE nombre = $1",
        [rol_nombre]
      );
      if (rolRows.length === 0) {
        return NextResponse.json(
          { error: `Rol '${rol_nombre}' no existe` },
          { status: 400 }
        );
      }
      nuevoRolId = rolRows[0].id;

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "usuario",
        accion: "UPDATE",
        registro_id: parseInt(id),
        detalle: `Cambio de rol: ${actual.rol_id} → ${nuevoRolId}`,
      });
    }

    const password_hash = password ? await hashPassword(password) : actual.password_hash;

    await pool.query(
      `UPDATE usuario
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           password_hash = COALESCE($3, password_hash),
           rol_id = $4
       WHERE id = $5`,
      [username ?? null, email ?? null, password_hash, nuevoRolId, id]
    );

    return NextResponse.json({ mensaje: "Usuario actualizado" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
