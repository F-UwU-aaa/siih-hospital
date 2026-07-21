import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";
import { registrarAuditoria } from "@/lib/auditoria";
import { crearNotificacion } from "@/lib/notificaciones";
import { agregarMedicamentosAFactura, verificarYActivarFactura } from "@/lib/facturacion";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "FARMACIA", "READ")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const recetaId = parseInt(id);

    const { rows: recetaRows } = await pool.query(
      `SELECT r.*,
        p.ci AS paciente_ci,
        p.nombre || ' ' || p.apellido AS paciente_nombre,
        p.id AS paciente_id,
        m.nombre || ' ' || m.apellido AS medico_nombre,
        m.especialidad,
        u_disp.username AS dispensado_por_username
       FROM receta r
       JOIN atencion a ON r.atencion_id = a.id
       JOIN historial_clinico hc ON a.historial_id = hc.id
       JOIN paciente p ON hc.paciente_id = p.id
       JOIN medico m ON r.medico_id = m.id
       LEFT JOIN usuario u_disp ON r.dispensado_por = u_disp.id
       WHERE r.id = $1`,
      [recetaId]
    );

    if (recetaRows.length === 0) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }

    const receta = recetaRows[0];

    // Role-based access
    const { rows: rolRows } = await pool.query(
      `SELECT r.nombre AS rol, u.paciente_id, u.medico_id
       FROM usuario u JOIN rol r ON u.rol_id = r.id WHERE u.id = $1`,
      [sesion.usuario_id]
    );
    const rol = rolRows[0]?.rol;

    if (rol === "PACIENTE" && rolRows[0].paciente_id !== receta.paciente_id) {
      return NextResponse.json({ error: "Sin acceso a esta receta" }, { status: 403 });
    }
    if (rol === "MEDICO" && rolRows[0].medico_id !== receta.medico_id) {
      return NextResponse.json({ error: "Sin acceso a esta receta" }, { status: 403 });
    }

    // Get detalle items
    const { rows: items } = await pool.query(
      `SELECT dr.*,
        med.nombre AS medicamento_nombre,
        med.principio_activo,
        med.presentacion,
        med.concentracion
       FROM detalle_receta dr
       JOIN medicamento med ON dr.medicamento_id = med.id
       WHERE dr.receta_id = $1
       ORDER BY dr.id`,
      [recetaId]
    );

    // For FARMACÉUTICO: include stock info for each medication
    let stockInfo: Record<number, { stock_total: number; lotes: { id: number; lote: string; cantidad: number; fecha_vencimiento: string }[] }> = {};
    if (rol === "FARMACEUTICO" || rol === "ADMIN") {
      for (const item of items) {
        const { rows: lotes } = await pool.query(
          `SELECT id, lote, cantidad, fecha_vencimiento
           FROM inventario
           WHERE medicamento_id = $1 AND fecha_vencimiento >= CURRENT_DATE AND cantidad > 0
           ORDER BY fecha_vencimiento ASC`,
          [item.medicamento_id]
        );
        stockInfo[item.medicamento_id] = {
          stock_total: lotes.reduce((sum: number, l: { cantidad: number }) => sum + l.cantidad, 0),
          lotes,
        };
      }
    }

    const { rows: alergias } = await pool.query(
      `SELECT sustancia, reaccion, severidad
       FROM alergia
       WHERE historial_id = (SELECT id FROM historial_clinico WHERE paciente_id = $1)
       ORDER BY severidad DESC, fecha_registro DESC`,
      [receta.paciente_id]
    );

    return NextResponse.json({ receta, items, stock_info: stockInfo, alergias });
  } catch (error) {
    console.error("Error al obtener receta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesion = await getSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!await verificarPermiso(sesion.usuario_id, "FARMACIA", "WRITE")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { id } = await params;
    const recetaId = parseInt(id);

    const { rows: recetaRows } = await pool.query(
      "SELECT * FROM receta WHERE id = $1",
      [recetaId]
    );
    if (recetaRows.length === 0) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }
    const receta = recetaRows[0];
    if (receta.estado === "CANCELADA") {
      return NextResponse.json({ error: "No se puede dispensar una receta cancelada" }, { status: 400 });
    }

    const body = await request.json();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get all detalle_receta items
      const { rows: items } = await client.query(
        `SELECT dr.*, med.nombre AS medicamento_nombre
         FROM detalle_receta dr
         JOIN medicamento med ON dr.medicamento_id = med.id
         WHERE dr.receta_id = $1`,
        [recetaId]
      );

      let todosDispensados = true;
      let algunoDispensado = false;
      const resultadosDispensacion: {
        detalle_receta_id: number;
        medicamento: string;
        requerido: number;
        dispensado: number;
        pendiente: number;
        lotes_usados: { lote: string; cantidad: number }[];
      }[] = [];

      for (const item of items) {
        // FEFO: get non-expired lots ordered by fecha_vencimiento ASC (RN-05)
        const { rows: lotes } = await client.query(
          `SELECT id, lote, cantidad, fecha_vencimiento
           FROM inventario
           WHERE medicamento_id = $1 AND fecha_vencimiento >= CURRENT_DATE AND cantidad > 0
           ORDER BY fecha_vencimiento ASC`,
          [item.medicamento_id]
        );

        const stockTotal = lotes.reduce(
          (sum: number, l: { cantidad: number }) => sum + l.cantidad,
          0
        );

        let porDispensar = item.cantidad;
        const lotesUsados: { lote: string; cantidad: number }[] = [];

        for (const lote of lotes) {
          if (porDispensar <= 0) break;
          const aDescontar = Math.min(lote.cantidad, porDispensar);

          await client.query(
            "UPDATE inventario SET cantidad = cantidad - $1 WHERE id = $2",
            [aDescontar, lote.id]
          );

          lotesUsados.push({ lote: lote.lote, cantidad: aDescontar });
          porDispensar -= aDescontar;

          // RN-06: check stock_minimo
          const loteActual = await client.query(
            "SELECT cantidad, stock_minimo FROM inventario WHERE id = $1",
            [lote.id]
          );
          if (loteActual.rows[0].cantidad <= loteActual.rows[0].stock_minimo) {
            // Fire-and-forget notification (will complete after commit)
            crearNotificacion({
              tipo: "STOCK_BAJO",
              asunto: `Stock bajo: ${item.medicamento_nombre}`,
              mensaje: `El lote ${lote.lote} de ${item.medicamento_nombre} tiene stock ${loteActual.rows[0].cantidad} (mínimo: ${loteActual.rows[0].stock_minimo})`,
              rol_destino: "FARMACEUTICO",
            }).catch(() => {});
          }
        }

        const dispensado = item.cantidad - porDispensar;
        const pendiente = porDispensar;

        if (pendiente > 0) todosDispensados = false;
        if (dispensado > 0) algunoDispensado = true;

        resultadosDispensacion.push({
          detalle_receta_id: item.id,
          medicamento: item.medicamento_nombre,
          requerido: item.cantidad,
          dispensado,
          pendiente,
          lotes_usados: lotesUsados,
        });

        // Audit each inventory update
        if (dispensado > 0) {
          registrarAuditoria({
            usuario_id: sesion.usuario_id,
            tabla_afectada: "inventario",
            accion: "UPDATE",
            detalle: `Dispensación: ${dispensado} unidades de ${item.medicamento_nombre} desde receta #${recetaId}`,
          }).catch(() => {});
        }
      }

      // Determine final state
      let nuevoEstado: string;
      if (todosDispensados) {
        nuevoEstado = "DISPENSADA";
      } else if (algunoDispensado) {
        nuevoEstado = "PARCIAL";
      } else {
        nuevoEstado = receta.estado; // No changes
      }

      await client.query(
        `UPDATE receta SET estado = $1, dispensado_por = $2 WHERE id = $3`,
        [nuevoEstado, sesion.usuario_id, recetaId]
      );

      await client.query("COMMIT");

      await registrarAuditoria({
        usuario_id: sesion.usuario_id,
        tabla_afectada: "receta",
        accion: "UPDATE",
        registro_id: recetaId,
        detalle: `Receta ${receta.codigo_receta} → ${nuevoEstado}`,
      });

      if (nuevoEstado === "DISPENSADA" || nuevoEstado === "PARCIAL") {
        try {
          const { rows: hcRows } = await pool.query(
            `SELECT hc.paciente_id FROM receta r
             JOIN atencion a ON r.atencion_id = a.id
             JOIN historial_clinico hc ON a.historial_id = hc.id
             WHERE r.id = $1`,
            [recetaId]
          );
          if (hcRows.length > 0) {
            const { rows: facturaRows } = await pool.query(
              `SELECT f.id FROM factura f
               WHERE f.atencion_id = $1 AND f.estado = 'INCOMPLETA'`,
              [receta.atencion_id]
            );
            if (facturaRows.length > 0) {
              const itemsMedicamentos = resultadosDispensacion
                .filter((r) => r.dispensado > 0)
                .map((r) => ({
                  medicamento_nombre: r.medicamento,
                  cantidad: r.dispensado,
                  precio: 0,
                }));
              if (itemsMedicamentos.length > 0) {
                const { rows: preciosRows } = await pool.query(
                  `SELECT dr.medicamento_id, m.nombre, i.precio_unitario
                   FROM detalle_receta dr
                   JOIN medicamento m ON dr.medicamento_id = m.id
                   LEFT JOIN inventario i ON i.medicamento_id = dr.medicamento_id
                   WHERE dr.receta_id = $1
                   ORDER BY i.fecha_vencimiento ASC
                   LIMIT 1`,
                  [recetaId]
                );
                for (const item of itemsMedicamentos) {
                  const precioRow = preciosRows.find((p: { nombre: string }) => p.nombre === item.medicamento_nombre);
                  if (precioRow?.precio_unitario) {
                    item.precio = parseFloat(precioRow.precio_unitario);
                  }
                }
                await agregarMedicamentosAFactura(facturaRows[0].id, recetaId, itemsMedicamentos);
                await verificarYActivarFactura(facturaRows[0].id);
              }
            }
          }
        } catch (e) {
          console.error("Error al actualizar factura tras dispensación:", e);
        }
      }

      // Get updated receta
      const { rows: updatedReceta } = await pool.query(
        `SELECT r.*, u.username AS dispensado_por_username
         FROM receta r
         LEFT JOIN usuario u ON r.dispensado_por = u.id
         WHERE r.id = $1`,
        [recetaId]
      );

      return NextResponse.json({
        receta: updatedReceta[0],
        dispensacion: resultadosDispensacion,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al dispensar receta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
