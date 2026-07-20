import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { crearSesion } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username y password son requeridos" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.password_hash, u.rol_id, u.activo, r.nombre AS rol_nombre
       FROM usuario u
       JOIN rol r ON u.rol_id = r.id
       WHERE u.username = $1`,
      [username]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const usuario = rows[0];

    if (!usuario.activo) {
      return NextResponse.json(
        { error: "Usuario desactivado. Contacte al administrador." },
        { status: 403 }
      );
    }

    const passwordValida = await verifyPassword(password, usuario.password_hash);
    if (!passwordValida) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Actualizar último acceso
    await pool.query(
      "UPDATE usuario SET ultimo_acceso = NOW() WHERE id = $1",
      [usuario.id]
    );

    // Crear sesión firmada
    await crearSesion({
      usuario_id: usuario.id,
      rol_id: usuario.rol_id,
      username: usuario.username,
    });

    return NextResponse.json({
      mensaje: "Login exitoso",
      usuario: {
        id: usuario.id,
        username: usuario.username,
        rol_id: usuario.rol_id,
        rol_nombre: usuario.rol_nombre,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
