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
    if (!(await verificarPermiso(sesion.usuario_id, "REPORTES", "READ"))) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
    const fechaDesde = desde || primerDiaMes;
    const fechaHasta = hasta || ultimoDiaMes;

    switch (tipo) {
      case "pacientes_atendidos": {
        const { rows } = await pool.query(
          `SELECT m.especialidad, COUNT(DISTINCT hc.paciente_id) AS total_pacientes, COUNT(a.id) AS total_atenciones
           FROM atencion a
           JOIN historial_clinico hc ON a.historial_id = hc.id
           JOIN medico m ON a.medico_id = m.id
           WHERE a.fecha_atencion::date BETWEEN $1 AND $2
           GROUP BY m.especialidad
           ORDER BY total_atenciones DESC`,
          [fechaDesde, fechaHasta]
        );
        return NextResponse.json({ reporte: "pacientes_atendidos", desde: fechaDesde, hasta: fechaHasta, datos: rows });
      }

      case "ingresos_mensuales": {
        const { rows } = await pool.query(
          `SELECT fecha_emision::date AS fecha,
                  COUNT(*) AS total_facturas,
                  COALESCE(SUM(total), 0) AS ingresos_totales,
                  COALESCE(SUM(subtotal), 0) AS subtotal,
                  COALESCE(SUM(impuesto), 0) AS impuestos,
                  COALESCE(SUM(descuento), 0) AS descuentos,
                  COALESCE(SUM(cobertura_seguro), 0) AS coberturas
           FROM factura
           WHERE estado = 'PAGADA'
             AND fecha_emision::date BETWEEN $1 AND $2
           GROUP BY fecha_emision::date
           ORDER BY fecha ASC`,
          [fechaDesde, fechaHasta]
        );
        const totales = await pool.query(
          `SELECT COUNT(*) AS total_facturas,
                  COALESCE(SUM(total), 0) AS ingresos_totales,
                  COALESCE(SUM(subtotal), 0) AS subtotal,
                  COALESCE(SUM(impuesto), 0) AS impuestos,
                  COALESCE(SUM(descuento), 0) AS descuentos,
                  COALESCE(SUM(cobertura_seguro), 0) AS coberturas,
                  CASE WHEN COUNT(*) > 0 THEN SUM(total) / COUNT(*) ELSE 0 END AS promedio_diario
           FROM factura
           WHERE estado = 'PAGADA'
             AND fecha_emision::date BETWEEN $1 AND $2`,
          [fechaDesde, fechaHasta]
        );
        const raw = totales.rows[0];
        const totalesNum: Record<string, number> = {};
        for (const k of Object.keys(raw)) totalesNum[k] = Number(raw[k]);
        return NextResponse.json({
          reporte: "ingresos_mensuales", desde: fechaDesde, hasta: fechaHasta,
          datos: rows, totales: totalesNum,
        });
      }

      case "ocupacion_hospitalaria": {
        const camas = await pool.query(
          `SELECT estado, COUNT(*) AS cantidad
           FROM cama
           GROUP BY estado
           ORDER BY estado`
        );
        const hospitalizaciones = await pool.query(
          `SELECT estado, COUNT(*) AS cantidad
           FROM hospitalizacion
           GROUP BY estado
           ORDER BY estado`
        );
        const porPiso = await pool.query(
          `SELECT c.piso,
                  COUNT(*) AS total,
                  SUM(CASE WHEN c.estado = 'OCUPADA' THEN 1 ELSE 0 END) AS ocupadas,
                  SUM(CASE WHEN c.estado = 'DISPONIBLE' THEN 1 ELSE 0 END) AS disponibles,
                  SUM(CASE WHEN c.estado = 'EN_MANTENIMIENTO' THEN 1 ELSE 0 END) AS mantenimiento
           FROM cama c
           GROUP BY c.piso
           ORDER BY c.piso`
        );
        return NextResponse.json({
          reporte: "ocupacion_hospitalaria",
          camas: camas.rows,
          hospitalizaciones: hospitalizaciones.rows,
          por_piso: porPiso.rows,
        });
      }

      case "stock_bajo": {
        const { rows } = await pool.query(
          `SELECT i.id, m.nombre AS medicamento_nombre, i.lote, i.cantidad,
                  i.stock_minimo, i.fecha_vencimiento, i.ubicacion
           FROM inventario i
           JOIN medicamento m ON i.medicamento_id = m.id
           WHERE i.cantidad <= i.stock_minimo
           ORDER BY (i.cantidad::float / NULLIF(i.stock_minimo, 0)) ASC, m.nombre ASC`
        );
        return NextResponse.json({ reporte: "stock_bajo", datos: rows });
      }

      case "examenes_procesados": {
        const { rows } = await pool.query(
          `SELECT el.tipo_examen, el.estado,
                  COUNT(*) AS total,
                  SUM(CASE WHEN rl.es_critico = TRUE THEN 1 ELSE 0 END) AS criticos
           FROM examen_laboratorio el
           LEFT JOIN resultado_laboratorio rl ON rl.examen_id = el.id
           WHERE el.fecha_solicitud::date BETWEEN $1 AND $2
           GROUP BY el.tipo_examen, el.estado
           ORDER BY total DESC`,
          [fechaDesde, fechaHasta]
        );
        return NextResponse.json({ reporte: "examenes_procesados", desde: fechaDesde, hasta: fechaHasta, datos: rows });
      }

      default:
        return NextResponse.json(
          { error: "Tipo de reporte invalido. Use: pacientes_atendidos, ingresos_mensuales, ocupacion_hospitalaria, stock_bajo, examenes_procesados" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error en reportes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
