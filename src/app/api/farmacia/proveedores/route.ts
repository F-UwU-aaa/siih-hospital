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
    if (!await verificarPermiso(sesion.usuario_id, "COMPRAS", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";

    let query: string;
    let params: (string | number)[];

    if (busqueda) {
      query = `SELECT * FROM proveedor
               WHERE activo = TRUE AND (nombre ILIKE $1 OR ruc ILIKE $1)
               ORDER BY nombre`;
      params = [`%${busqueda}%`];
    } else {
      query = `SELECT * FROM proveedor WHERE activo = TRUE ORDER BY nombre`;
      params = [];
    }

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar proveedores:", error);
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
    if (!await verificarPermiso(sesion.usuario_id, "COMPRAS", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, ruc, direccion, telefono, email } = body;

    if (!nombre) {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO proveedor (nombre, ruc, direccion, telefono, email)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, ruc || null, direccion || null, telefono || null, email || null]
    );

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "proveedor",
      accion: "INSERT",
      registro_id: rows[0].id,
    });

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
