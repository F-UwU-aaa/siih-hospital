import { NextResponse } from "next/server";
import { getSesionActual } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que el usuario sigue activo
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.email, r.nombre AS rol_nombre
       FROM usuario u
       JOIN rol r ON u.rol_id = r.id
       WHERE u.id = $1 AND u.activo = TRUE`,
      [sesion.usuario_id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario desactivado" },
        { status: 403 }
      );
    }

    const usuario = rows[0];

    // Obtener permisos del usuario
    const { rows: permisos } = await pool.query(
      `SELECT DISTINCT p.modulo, p.accion
       FROM rol_permiso rp
       JOIN permiso p ON rp.permiso_id = p.id
       WHERE rp.rol_id = $1`,
      [sesion.rol_id]
    );

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol_nombre: usuario.rol_nombre,
      },
      permisos,
    });
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
