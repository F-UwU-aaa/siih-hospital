import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET() {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT r.id, r.nombre, r.descripcion,
              COUNT(rp.permiso_id) AS total_permisos
       FROM rol r
       LEFT JOIN rol_permiso rp ON rp.rol_id = r.id
       GROUP BY r.id, r.nombre, r.descripcion
       ORDER BY r.nombre`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar roles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { nombre, descripcion } = await request.json();
    if (!nombre) {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    }

    const { rows: existente } = await pool.query(
      "SELECT id FROM rol WHERE nombre = $1",
      [nombre]
    );
    if (existente.length > 0) {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre" }, { status: 409 });
    }

    const { rows } = await pool.query(
      "INSERT INTO rol (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion",
      [nombre, descripcion || null]
    );

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "rol",
      accion: "INSERT",
      registro_id: rows[0].id,
      detalle: `Rol creado: ${nombre}`,
    });

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear rol:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
