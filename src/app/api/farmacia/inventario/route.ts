import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "FARMACIA", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const medicamento_id = searchParams.get("medicamento_id");
    const solo_stock_bajo = searchParams.get("solo_stock_bajo") === "true";

    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre AS rol FROM usuario u JOIN rol r ON u.rol_id = r.id WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.rol;

    if (rol === "PACIENTE") {
      return NextResponse.json({ error: "Acceso no permitido" }, { status: 403 });
    }

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (medicamento_id) {
      conditions.push(`i.medicamento_id = $${paramIdx++}`);
      params.push(parseInt(medicamento_id));
    }

    if (solo_stock_bajo) {
      conditions.push(`i.cantidad <= i.stock_minimo`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
        i.*,
        m.nombre AS medicamento_nombre,
        m.principio_activo,
        m.presentacion,
        m.concentracion,
        (i.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days') AS vencimiento_proximo,
        (i.fecha_vencimiento < CURRENT_DATE) AS vencido
       FROM inventario i
       JOIN medicamento m ON i.medicamento_id = m.id
       ${where}
       ORDER BY m.nombre, i.fecha_vencimiento ASC`,
      params
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar inventario:", error);
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
    if (!await verificarPermiso(sesion.usuario_id, "FARMACIA", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario } = body;

    if (!medicamento_id || !lote || !cantidad || !fecha_vencimiento) {
      return NextResponse.json(
        { error: "medicamento_id, lote, cantidad y fecha_vencimiento son requeridos" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [medicamento_id, lote, cantidad, stock_minimo || 10, fecha_vencimiento, ubicacion || null, precio_unitario || null]
    );

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "inventario",
      accion: "INSERT",
      registro_id: rows[0].id,
    });

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear lote:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
