import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "AUDITORIA", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const usuario_id = searchParams.get("usuario_id");
    const tabla_afectada = searchParams.get("tabla_afectada");
    const accion = searchParams.get("accion");
    const fecha_desde = searchParams.get("fecha_desde");
    const fecha_hasta = searchParams.get("fecha_hasta");
    const limite = searchParams.get("limite") || "100";

    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIdx = 1;

    if (usuario_id) {
      conditions.push(`a.usuario_id = $${paramIdx}`);
      values.push(parseInt(usuario_id));
      paramIdx++;
    }
    if (tabla_afectada) {
      conditions.push(`a.tabla_afectada = $${paramIdx}`);
      values.push(tabla_afectada);
      paramIdx++;
    }
    if (accion) {
      conditions.push(`a.accion = $${paramIdx}`);
      values.push(accion);
      paramIdx++;
    }
    if (fecha_desde) {
      conditions.push(`a.fecha_hora >= $${paramIdx}`);
      values.push(fecha_desde);
      paramIdx++;
    }
    if (fecha_hasta) {
      conditions.push(`a.fecha_hora <= $${paramIdx}`);
      values.push(fecha_hasta);
      paramIdx++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows } = await pool.query(
      `SELECT a.id, a.usuario_id, u.username, a.tabla_afectada, a.accion,
              a.registro_id, a.detalle, a.fecha_hora, a.ip_origen
       FROM auditoria a
       JOIN usuario u ON a.usuario_id = u.id
       ${whereClause}
       ORDER BY a.fecha_hora DESC
       LIMIT $${paramIdx}`,
      [...values, parseInt(limite)]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al consultar auditoría:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
