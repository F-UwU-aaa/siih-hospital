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
    const estado = searchParams.get("estado") || "";

    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre AS rol, u.paciente_id, u.medico_id
       FROM usuario u JOIN rol r ON u.rol_id = r.id WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.rol;
    const pacienteId = rolRows[0]?.paciente_id;
    const medicoId = rolRows[0]?.medico_id;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (busqueda) {
      conditions.push(`(
        r.codigo_receta ILIKE $${paramIdx} OR
        p.ci ILIKE $${paramIdx} OR
        p.nombre ILIKE $${paramIdx} OR
        p.apellido ILIKE $${paramIdx}
      )`);
      params.push(`%${busqueda}%`);
      paramIdx++;
    }

    if (estado) {
      conditions.push(`r.estado = $${paramIdx++}`);
      params.push(estado);
    }

    // Role-based filtering
    if (rol === "PACIENTE" && pacienteId) {
      conditions.push(`hc.paciente_id = $${paramIdx++}`);
      params.push(pacienteId);
    } else if (rol === "MEDICO" && medicoId) {
      conditions.push(`r.medico_id = $${paramIdx++}`);
      params.push(medicoId);
    }
    // FARMACEUTICO, DIRECTOR, ADMIN: no extra filter

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
        r.*,
        p.ci AS paciente_ci,
        p.nombre || ' ' || p.apellido AS paciente_nombre,
        m.nombre || ' ' || m.apellido AS medico_nombre,
        m.especialidad,
        (SELECT count(*) FROM detalle_receta dr WHERE dr.receta_id = r.id) AS items_count
       FROM receta r
       JOIN atencion a ON r.atencion_id = a.id
       JOIN historial_clinico hc ON a.historial_id = hc.id
       JOIN paciente p ON hc.paciente_id = p.id
       JOIN medico m ON r.medico_id = m.id
       ${where}
       ORDER BY r.fecha_emision DESC`,
      params
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error al listar recetas:", error);
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
    if (!await verificarPermiso(sesion.usuario_id, "ATENCION", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { atencion_id, items } = body;

    if (!atencion_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "atencion_id y al menos 1 item son requeridos" },
        { status: 400 }
      );
    }

    // Verify attention exists and get medico_id
    const { rows: atencionRows } = await pool.query(
      `SELECT a.id, a.medico_id FROM atencion a WHERE a.id = $1`,
      [atencion_id]
    );
    if (atencionRows.length === 0) {
      return NextResponse.json({ error: "Atención no encontrada" }, { status: 404 });
    }

    const medicoId = atencionRows[0].medico_id;

    // Verify user is the medico of this attention (or admin)
    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre AS rol FROM usuario u JOIN rol r ON u.rol_id = r.id WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    if (rolRows[0]?.rol !== "ADMIN" && rolRows[0]?.rol !== "DIRECTOR") {
      // Check user is the medico linked to this attention
      const { rows: userMedico } = await pool.query(
        `SELECT u.medico_id FROM usuario u WHERE u.id = $1 AND u.medico_id IS NOT NULL`,
        [sesion.usuario_id]
      );
      if (userMedico.length === 0 || userMedico[0].medico_id !== medicoId) {
        return NextResponse.json(
          { error: "Solo el médico de esta atención puede emitir recetas" },
          { status: 403 }
        );
      }
    }

    // Generate codigo_receta: REC-YYYYMMDD-XXXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) + 1 AS seq FROM receta WHERE codigo_receta LIKE $1`,
      [`REC-${today}-%`]
    );
    const seq = String(countRows[0].seq).padStart(4, "0");
    const codigoReceta = `REC-${today}-${seq}`;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create RECETA
      const { rows: recetaRows } = await client.query(
        `INSERT INTO receta (atencion_id, medico_id, fecha_emision, codigo_receta, estado)
         VALUES ($1, $2, NOW(), $3, 'EMITIDA')
         RETURNING *`,
        [atencion_id, medicoId, codigoReceta]
      );
      const receta = recetaRows[0];

      // Create DETALLE_RECETAs
      const detalleItems = [];
      for (const item of items) {
        if (!item.medicamento_id || !item.cantidad) continue;
        const { rows: detRows } = await client.query(
          `INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            receta.id,
            item.medicamento_id,
            item.dosis || null,
            item.frecuencia || null,
            item.duracion || null,
            item.cantidad,
            item.indicaciones || null,
          ]
        );
        detalleItems.push(detRows[0]);
      }

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "receta",
        accion: "INSERT",
        registro_id: receta.id,
        detalle: `Receta ${codigoReceta} emitida con ${detalleItems.length} items`,
      });

      return NextResponse.json(
        { receta, items: detalleItems },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al emitir receta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
