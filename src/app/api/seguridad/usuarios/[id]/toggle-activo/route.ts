import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PATCH(
  _request: Request,
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

    // Obtener estado actual
    const { rows } = await pool.query(
      "SELECT id, username, activo FROM usuario WHERE id = $1",
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const nuevoEstado = !rows[0].activo;

    await pool.query(
      "UPDATE usuario SET activo = $1 WHERE id = $2",
      [nuevoEstado, id]
    );

    // Registrar en auditoría
    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "usuario",
      accion: nuevoEstado ? "ACTIVAR" : "DESACTIVAR",
      registro_id: parseInt(id),
      detalle: `Usuario ${rows[0].username} ${nuevoEstado ? "activado" : "desactivado"}`,
    });

    return NextResponse.json({
      mensaje: `Usuario ${nuevoEstado ? "activado" : "desactivado"}`,
      activo: nuevoEstado,
    });
  } catch (error) {
    console.error("Error al toggle activo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
