import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";
import { generarFactura } from "@/lib/facturacion";

export async function GET(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "FACTURACION", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");
    const estado = searchParams.get("estado");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const { rows: rolRows } = await pool.query(
      "SELECT r.nombre FROM rol r JOIN usuario u ON u.rol_id = r.id WHERE u.id = $1",
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.nombre;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (rol === "PACIENTE") {
      const { rows: pacRows } = await pool.query(
        "SELECT paciente_id FROM usuario WHERE id = $1 AND paciente_id IS NOT NULL",
        [sesion.usuario_id]
      );
      if (pacRows.length === 0) {
        return NextResponse.json([]);
      }
      conditions.push(`f.paciente_id = $${paramIdx++}`);
      params.push(pacRows[0].paciente_id);
    } else if (pacienteId) {
      conditions.push(`f.paciente_id = $${paramIdx++}`);
      params.push(parseInt(pacienteId));
    }

    if (estado) {
      conditions.push(`f.estado = $${paramIdx++}`);
      params.push(estado);
    }
    if (desde) {
      conditions.push(`f.fecha_emision >= $${paramIdx++}`);
      params.push(desde);
    }
    if (hasta) {
      conditions.push(`f.fecha_emision <= $${paramIdx++}`);
      params.push(hasta + " 23:59:59");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT f.*,
        p.ci AS paciente_ci, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
        u.username AS facturador_username
       FROM factura f
       JOIN paciente p ON f.paciente_id = p.id
       JOIN usuario u ON f.usuario_id = u.id
       ${where}
       ORDER BY f.fecha_emision DESC`,
      params
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar facturas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "FACTURACION", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { paciente_id, atencion_id } = body;

    if (!paciente_id) {
      return NextResponse.json({ error: "paciente_id es requerido" }, { status: 400 });
    }

    const resultado = await generarFactura(
      parseInt(paciente_id),
      sesion.usuario_id,
      atencion_id ? parseInt(atencion_id) : undefined
    );

    if (!resultado) {
      return NextResponse.json(
        { error: "No hay servicios pendientes de facturar para este paciente" },
        { status: 400 }
      );
    }

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "factura",
      accion: "INSERT",
      registro_id: resultado.factura.id as number,
      detalle: `Factura ${resultado.factura.numero_factura} creada — paciente #${paciente_id}, total $${resultado.factura.total}`,
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error("Error al crear factura:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
