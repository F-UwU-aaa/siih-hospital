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
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.modulo, p.accion
       FROM permiso p
       JOIN rol_permiso rp ON rp.permiso_id = p.id
       WHERE rp.rol_id = $1
       ORDER BY p.modulo, p.accion`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al obtener permisos del rol:", error);
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
    if (!await verificarPermiso(sesion.usuario_id, "SEGURIDAD", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const { permiso_id } = await request.json();

    if (!permiso_id) {
      return NextResponse.json(
        { error: "permiso_id es requerido" },
        { status: 400 }
      );
    }

    // Verificar que no ya tiene el permiso
    const { rows: existente } = await pool.query(
      "SELECT 1 FROM rol_permiso WHERE rol_id = $1 AND permiso_id = $2",
      [id, permiso_id]
    );
    if (existente.length > 0) {
      return NextResponse.json(
        { error: "El rol ya tiene este permiso" },
        { status: 409 }
      );
    }

    await pool.query(
      "INSERT INTO rol_permiso (rol_id, permiso_id) VALUES ($1, $2)",
      [id, permiso_id]
    );

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "rol_permiso",
      accion: "INSERT",
      registro_id: undefined,
      detalle: `Permiso ${permiso_id} agregado al rol ${id}`,
    });

    return NextResponse.json({ mensaje: "Permiso agregado al rol" }, { status: 201 });
  } catch (error) {
    console.error("Error al agregar permiso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { permiso_id } = await request.json();

    if (!permiso_id) {
      return NextResponse.json(
        { error: "permiso_id es requerido" },
        { status: 400 }
      );
    }

    await pool.query(
      "DELETE FROM rol_permiso WHERE rol_id = $1 AND permiso_id = $2",
      [id, permiso_id]
    );

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "rol_permiso",
      accion: "DELETE",
      registro_id: undefined,
      detalle: `Permiso ${permiso_id} removido del rol ${id}`,
    });

    return NextResponse.json({ mensaje: "Permiso removido del rol" });
  } catch (error) {
    console.error("Error al remover permiso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
