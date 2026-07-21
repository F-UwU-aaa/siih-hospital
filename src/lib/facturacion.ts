import pool from "@/lib/db";

export interface DetalleFacturaInput {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export async function generarFactura(
  pacienteId: number,
  usuarioId: number,
  atencionId?: number
): Promise<{ factura: Record<string, unknown>; detalles: DetalleFacturaInput[] } | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const atencionConditions = ["hc.paciente_id = $1"];
    const atencionParams: unknown[] = [pacienteId];
    if (atencionId) {
      atencionConditions.push("a.id = $2");
      atencionParams.push(atencionId);
    }
    const { rows: atenciones } = await client.query(
      `SELECT a.id, a.tipo, a.fecha_atencion
       FROM atencion a
       JOIN historial_clinico hc ON a.historial_id = hc.id
       WHERE ${atencionConditions.join(" AND ")}
       ORDER BY a.fecha_atencion ASC`,
      atencionParams
    );

    const { rows: tarifas } = await client.query(
      "SELECT tipo_servicio, precio_unitario FROM tarifa_servicio WHERE activo = TRUE"
    );
    const tarifaMap: Record<string, number> = {};
    for (const t of tarifas) {
      tarifaMap[t.tipo_servicio] = parseFloat(t.precio_unitario);
    }

    const detalles: DetalleFacturaInput[] = [];
    let hayRecetasPendientes = false;

    for (const atencion of atenciones) {
      const { rows: existentes } = await client.query(
        `SELECT df.descripcion FROM detalle_factura df
         JOIN factura f ON df.factura_id = f.id
         WHERE f.paciente_id = $1 AND f.estado != 'ANULADA'
           AND (df.descripcion LIKE '%Atencion #${atencion.id}%' OR df.descripcion LIKE '%Receta #%' OR df.descripcion LIKE '%Examen #%')
         ORDER BY df.id`,
        [pacienteId]
      );
      const descsExistentes = new Set(existentes.map((r: { descripcion: string }) => r.descripcion));

      const tipoAtencion = atencion.tipo === "EMERGENCIA" ? "EMERGENCIA" : "CONSULTA";
      const yaFacturadoConsulta = [...descsExistentes].some(d => d.includes(`Atencion #${atencion.id}`));
      if (!yaFacturadoConsulta) {
        const precioConsulta = tarifaMap[tipoAtencion] ?? 50;
        detalles.push({
          descripcion: `${tipoAtencion === "EMERGENCIA" ? "Atencion de emergencia" : "Consulta medica"} (Atencion #${atencion.id})`,
          cantidad: 1,
          precio_unitario: precioConsulta,
          subtotal: precioConsulta,
        });
      }

      const { rows: recetas } = await client.query(
        `SELECT r.id FROM receta r WHERE r.atencion_id = $1 AND r.estado IN ('DISPENSADA', 'PARCIAL')`,
        [atencion.id]
      );
      for (const receta of recetas) {
        const yaFacturada = [...descsExistentes].some(d => d.includes(`Receta #${receta.id}`));
        if (yaFacturada) continue;
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

      const { rows: recetasEmitidas } = await client.query(
        `SELECT r.id FROM receta r WHERE r.atencion_id = $1 AND r.estado = 'EMITIDA'`,
        [atencion.id]
      );
      if (recetasEmitidas.length > 0) {
        hayRecetasPendientes = true;
      }

      const { rows: examenes } = await client.query(
        `SELECT el.id, el.tipo_examen FROM examen_laboratorio el WHERE el.atencion_id = $1 AND el.estado = 'COMPLETADO'`,
        [atencion.id]
      );
      for (const examen of examenes) {
        const yaFacturado = [...descsExistentes].some(d => d.includes(`Examen #${examen.id}`));
        if (yaFacturado) continue;
        const precioExamen = tarifaMap["EXAMEN_LABORATORIO"] ?? 30;
        detalles.push({
          descripcion: `Examen: ${examen.tipo_examen} (Examen #${examen.id})`,
          cantidad: 1,
          precio_unitario: precioExamen,
          subtotal: precioExamen,
        });
      }
    }

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
      [pacienteId]
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
      return null;
    }

    const subtotal = detalles.reduce((sum, d) => sum + d.subtotal, 0);
    const impuesto = 0;
    const total = subtotal + impuesto;

    const hoy = new Date();
    const fechaStr = hoy.toISOString().slice(0, 10).replace(/-/g, "");
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*) + 1 AS seq FROM factura WHERE numero_factura LIKE $1`,
      [`FAC-${fechaStr}-%`]
    );
    const seq = String(countRows[0].seq).padStart(4, "0");
    const numeroFactura = `FAC-${fechaStr}-${seq}`;

    const estadoInicial = hayRecetasPendientes ? "INCOMPLETA" : "PENDIENTE";

    const { rows: facturaRows } = await client.query(
      `INSERT INTO factura (paciente_id, atencion_id, numero_factura, subtotal, impuesto, total, estado, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [pacienteId, atencionId || null, numeroFactura, subtotal, impuesto, total, estadoInicial, usuarioId]
    );
    const factura = facturaRows[0];

    for (const d of detalles) {
      await client.query(
        `INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [factura.id, d.descripcion, d.cantidad, d.precio_unitario, d.subtotal]
      );
    }

    await client.query("COMMIT");

    return { factura: { ...factura, subtotal, impuesto, total }, detalles };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function agregarMedicamentosAFactura(
  facturaId: number,
  recetaId: number,
  items: { medicamento_nombre: string; cantidad: number; precio: number }[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of items) {
      const precio = item.precio || 0;
      await client.query(
        `INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          facturaId,
          `Medicamento: ${item.medicamento_nombre} (Receta #${recetaId})`,
          item.cantidad,
          precio,
          item.cantidad * precio,
        ]
      );
    }

    const { rows: totales } = await client.query(
      "SELECT SUM(subtotal) AS nuevo_subtotal FROM detalle_factura WHERE factura_id = $1",
      [facturaId]
    );
    const nuevoSubtotal = parseFloat(totales[0].nuevo_subtotal) || 0;
    await client.query(
      "UPDATE factura SET subtotal = $1, total = $1 WHERE id = $2",
      [nuevoSubtotal, facturaId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function verificarYActivarFactura(facturaId: number): Promise<void> {
  const { rows: facturaRows } = await pool.query(
    "SELECT atencion_id FROM factura WHERE id = $1 AND estado = 'INCOMPLETA'",
    [facturaId]
  );
  if (facturaRows.length === 0) return;

  const atencionId = facturaRows[0].atencion_id;
  if (!atencionId) return;

  const { rows: emitidas } = await pool.query(
    "SELECT r.id FROM receta r WHERE r.atencion_id = $1 AND r.estado = 'EMITIDA'",
    [atencionId]
  );

  if (emitidas.length === 0) {
    await pool.query(
      "UPDATE factura SET estado = 'PENDIENTE' WHERE id = $1 AND estado = 'INCOMPLETA'",
      [facturaId]
    );
  }
}
