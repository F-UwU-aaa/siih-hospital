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
    const busqueda = searchParams.get("busqueda") || "";

    // Get role
    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre AS rol, u.paciente_id, u.medico_id, u.farmaceutico_id
       FROM usuario u JOIN rol r ON u.rol_id = r.id WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.rol;

    let conditions: string[] = [];
    let params: (string | number)[] = [];
    let paramIdx = 1;

    if (busqueda) {
      conditions.push(`(m.nombre ILIKE $${paramIdx} OR m.principio_activo ILIKE $${paramIdx})`);
      params.push(`%${busqueda}%`);
      paramIdx++;
    }

    // Only show active medications
    conditions.push(`m.activo = TRUE`);

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows: meds } = await pool.query(
      `SELECT m.id, m.nombre, m.principio_activo, m.presentacion, m.concentracion, m.laboratorio
       FROM medicamento m
       ${where}
       ORDER BY m.nombre`,
      params
    );

    // For each medication, compute role-appropriate stock info
    const resultados = [];
    for (const med of meds) {
      // Sum non-expired stock
      const { rows: stockRows } = await pool.query(
        `SELECT COALESCE(SUM(i.cantidad), 0) AS stock_total,
                MIN(i.stock_minimo) AS stock_minimo
         FROM inventario i
         WHERE i.medicamento_id = $1 AND i.fecha_vencimiento >= CURRENT_DATE`,
        [med.id]
      );
      const stockTotal = parseInt(stockRows[0]?.stock_total || "0");
      const stockMinimo = parseInt(stockRows[0]?.stock_minimo || "10");

      if (rol === "PACIENTE") {
        // RN-21: paciente solo ve DISPONIBLE / NO DISPONIBLE
        resultados.push({
          ...med,
          disponibilidad: stockTotal > 0 ? "DISPONIBLE" : "NO DISPONIBLE",
        });
      } else {
        // MÉDICO / FARMACÉUTICO / DIRECTOR / ADMIN: ven stock numérico
        resultados.push({
          ...med,
          stock_total: stockTotal,
          stock_minimo: stockMinimo,
          bajo_stock: stockTotal <= stockMinimo,
        });
      }
    }

    return NextResponse.json(resultados);
  } catch (error) {
    console.error("Error al listar medicamentos:", error);
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
    const { nombre, principio_activo, presentacion, concentracion, laboratorio } = body;

    if (!nombre) {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO medicamento (nombre, principio_activo, presentacion, concentracion, laboratorio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, principio_activo || null, presentacion || null, concentracion || null, laboratorio || null]
    );

    await registrarAuditoria({
      usuario_id: sesion.usuario_id,
      tabla_afectada: "medicamento",
      accion: "INSERT",
      registro_id: rows[0].id,
    });

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear medicamento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
