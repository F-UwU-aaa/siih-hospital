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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Find unbilled atenciones for this patient
      const atencionConditions = [`hc.paciente_id = $1`];
      const atencionParams: unknown[] = [paciente_id];
      if (atencion_id) {
        atencionConditions.push(`a.id = $2`);
        atencionParams.push(parseInt(atencion_id));
      }
      const { rows: atenciones } = await client.query(
        `SELECT a.id, a.tipo, a.fecha_atencion
         FROM atencion a
         JOIN historial_clinico hc ON a.historial_id = hc.id
         WHERE ${atencionConditions.join(" AND ")}
           AND NOT EXISTS (
             SELECT 1 FROM detalle_factura df
             JOIN factura f ON df.factura_id = f.id
             WHERE f.paciente_id = $1
               AND df.descripcion LIKE '%Atencion #' || a.id || '%'
               AND f.estado != 'ANULADA'
           )
         ORDER BY a.fecha_atencion ASC`,
        atencionParams
      );

      // 2. Get tariffs
      const { rows: tarifas } = await client.query(
        "SELECT tipo_servicio, precio_unitario FROM tarifa_servicio WHERE activo = TRUE"
      );
      const tarifaMap: Record<string, number> = {};
      for (const t of tarifas) {
        tarifaMap[t.tipo_servicio] = parseFloat(t.precio_unitario);
      }

      const detalles: { descripcion: string; cantidad: number; precio_unitario: number; subtotal: number }[] = [];

      // 3. Process each unbilled atencion
      for (const atencion of atenciones) {
        const tipoAtencion = atencion.tipo === "EMERGENCIA" ? "EMERGENCIA" : "CONSULTA";
        const precioConsulta = tarifaMap[tipoAtencion] ?? 50;
        detalles.push({
          descripcion: `${tipoAtencion === "EMERGENCIA" ? "Atencion de emergencia" : "Consulta medica"} (Atencion #${atencion.id})`,
          cantidad: 1,
          precio_unitario: precioConsulta,
          subtotal: precioConsulta,
        });

        // 4. Recetas DISPENSADAS/PARCIALES for this atencion
        const { rows: recetas } = await client.query(
          `SELECT r.id, r.estado FROM receta r WHERE r.atencion_id = $1 AND r.estado IN ('DISPENSADA', 'PARCIAL')`,
          [atencion.id]
        );
        for (const receta of recetas) {
          const { rows: detalleReceta } = await client.query(
            `SELECT dr.medicamento_id, dr.cantidad, m.nombre AS medicamento_nombre,
                    i.precio_unitario AS precio
             FROM detalle_receta dr
             JOIN medicamento m ON dr.medicamento_id = m.id
             LEFT JOIN inventario i ON i.medicamento_id = dr.medicamento_id
             WHERE dr.receta_id = $1
             ORDER BY i.fecha_vencimiento ASC
             LIMIT 1`,
            [receta.id]
          );
          for (const item of detalleReceta) {
            const precio = parseFloat(item.precio) || 0;
            detalles.push({
              descripcion: `Medicamento: ${item.medicamento_nombre} (Receta #${receta.id})`,
              cantidad: item.cantidad,
              precio_unitario: precio,
              subtotal: item.cantidad * precio,
            });
          }
        }

        // 5. Examenes COMPLETADOS for this atencion
        const { rows: examenes } = await client.query(
          `SELECT el.id, el.tipo_examen FROM examen_laboratorio el WHERE el.atencion_id = $1 AND el.estado = 'COMPLETADO'`,
          [atencion.id]
        );
        for (const examen of examenes) {
          const precioExamen = tarifaMap["EXAMEN_LABORATORIO"] ?? 30;
          detalles.push({
            descripcion: `Examen: ${examen.tipo_examen} (Examen #${examen.id})`,
            cantidad: 1,
            precio_unitario: precioExamen,
            subtotal: precioExamen,
          });
        }
      }

      // 6. Hospitalizaciones ALTA for this patient (not yet billed)
      const { rows: hospAltas } = await client.query(
        `SELECT h.id, h.fecha_ingreso, h.fecha_alta
         FROM hospitalizacion h
         WHERE h.paciente_id = $1
           AND h.estado = 'ALTA'
           AND h.fecha_alta IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM detalle_factura df
             JOIN factura f2 ON df.factura_id = f2.id
             WHERE f2.paciente_id = $1
               AND df.descripcion LIKE '%' || h.id || '%'
               AND f2.estado != 'ANULADA'
           )`,
        [paciente_id]
      );
      for (const hosp of hospAltas) {
        const ingreso = new Date(hosp.fecha_ingreso);
        const alta = new Date(hosp.fecha_alta);
        const dias = Math.max(1, Math.ceil((alta.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24)));
        const precioDia = tarifaMap["HOSPITALIZACION_DIA"] ?? 200;
        detalles.push({
          descripcion: `Hospitalizacion #${hosp.id}: ${dias} dia(s)`,
          cantidad: dias,
          precio_unitario: precioDia,
          subtotal: dias * precioDia,
        });
      }

      if (detalles.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "No hay servicios pendientes de facturar para este paciente" },
          { status: 400 }
        );
      }

      // 7. Calculate totals
      const subtotal = detalles.reduce((sum, d) => sum + d.subtotal, 0);
      const impuesto = 0;
      const total = subtotal + impuesto;

      // 8. Generate invoice number
      const hoy = new Date();
      const fechaStr = hoy.toISOString().slice(0, 10).replace(/-/g, "");
      const { rows: countRows } = await client.query(
        `SELECT COUNT(*) + 1 AS seq FROM factura WHERE numero_factura LIKE $1`,
        [`FAC-${fechaStr}-%`]
      );
      const seq = String(countRows[0].seq).padStart(4, "0");
      const numeroFactura = `FAC-${fechaStr}-${seq}`;

      // 9. Create factura
      const { rows: facturaRows } = await client.query(
        `INSERT INTO factura (paciente_id, atencion_id, numero_factura, subtotal, impuesto, total, estado, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', $7)
         RETURNING *`,
        [
          paciente_id,
          atencion_id ? parseInt(atencion_id) : null,
          numeroFactura,
          subtotal,
          impuesto,
          total,
          sesion.usuario_id,
        ]
      );
      const factura = facturaRows[0];

      // 10. Create detalle_factura for each service
      for (const d of detalles) {
        await client.query(
          `INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [factura.id, d.descripcion, d.cantidad, d.precio_unitario, d.subtotal]
        );
      }

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "factura",
        accion: "INSERT",
        registro_id: factura.id,
        detalle: `Factura ${numeroFactura} creada — paciente #${paciente_id}, total $${total}`,
      });

      // Return factura with details
      const { rows: detallesFinales } = await pool.query(
        "SELECT * FROM detalle_factura WHERE factura_id = $1 ORDER BY id",
        [factura.id]
      );

      return NextResponse.json({
        factura: { ...factura, subtotal, impuesto, total },
        detalles: detallesFinales,
      }, { status: 201 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al crear factura:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
