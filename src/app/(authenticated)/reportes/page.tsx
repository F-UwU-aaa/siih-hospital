"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
  permisos: { modulo: string; accion: string }[];
}

type ReporteTipo =
  | "pacientes_atendidos"
  | "ingresos_mensuales"
  | "ocupacion_hospitalaria"
  | "stock_bajo"
  | "examenes_procesados";

interface ReporteConfig {
  tipo: ReporteTipo;
  label: string;
  icon: string;
  desc: string;
  usesDate: boolean;
}

const reportes: ReporteConfig[] = [
  {
    tipo: "pacientes_atendidos",
    label: "Pacientes Atendidos",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    desc: "Atenciones por especialidad",
    usesDate: true,
  },
  {
    tipo: "ingresos_mensuales",
    label: "Ingresos Mensuales",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    desc: "Facturacion e ingresos diarios",
    usesDate: true,
  },
  {
    tipo: "ocupacion_hospitalaria",
    label: "Ocupacion Hospitalaria",
    icon: "M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
    desc: "Camas y hospitalizaciones por piso",
    usesDate: false,
  },
  {
    tipo: "stock_bajo",
    label: "Stock Bajo",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    desc: "Medicamentos por debajo del minimo",
    usesDate: false,
  },
  {
    tipo: "examenes_procesados",
    label: "Examenes Procesados",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    desc: "Examenes por tipo y estado",
    usesDate: true,
  },
];

const COLORS = [
  "#0F766E",
  "#2563EB",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#059669",
  "#DB2777",
  "#4F46E5",
  "#0891B2",
  "#65A30D",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function PieChart({
  data,
  size = 160,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0)
    return (
      <div
        className="flex items-center justify-center rounded-full bg-slate-100 text-xs text-text-secondary"
        style={{ width: size, height: size }}
      >
        Sin datos
      </div>
    );

  const r = size / 2;
  const ir = r * 0.55;
  let cumulative = 0;

  const slices = data.map((d) => {
    const fraction = d.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const largeArc = fraction > 0.5 ? 1 : 0;
    const x1o = r + r * Math.cos(startAngle);
    const y1o = r + r * Math.sin(startAngle);
    const x2o = r + r * Math.cos(endAngle);
    const y2o = r + r * Math.sin(endAngle);
    const x1i = r + ir * Math.cos(endAngle);
    const y1i = r + ir * Math.sin(endAngle);
    const x2i = r + ir * Math.cos(startAngle);
    const y2i = r + ir * Math.sin(startAngle);
    const path = `M${x1o},${y1o} A${r},${r} 0 ${largeArc} 1 ${x2o},${y2o} L${x1i},${y1i} A${ir},${ir} 0 ${largeArc} 0 ${x2i},${y2i} Z`;
    return { path, color: d.color, label: d.label, value: d.value, pct: ((fraction * 100).toFixed(1)) };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-text-secondary">{s.label}</span>
            <span className="font-medium text-text-primary">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  data,
  maxBarWidth = 400,
}: {
  data: { label: string; value: number; color?: string }[];
  maxBarWidth?: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-right text-xs font-medium text-text-secondary">
            {d.label}
          </span>
          <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-100">
            <div
              className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
              style={{
                width: `${(d.value / maxVal) * 100}%`,
                backgroundColor: d.color || COLORS[i % COLORS.length],
                minWidth: d.value > 0 ? 4 : 0,
              }}
            />
          </div>
          <span className="w-16 text-right text-sm font-semibold text-text-primary">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function VerticalBarChart({
  data,
  height = 220,
  labelKey,
  valueKey,
  colorFn,
}: {
  data: Record<string, unknown>[];
  height?: number;
  labelKey: string;
  valueKey: string;
  colorFn?: (i: number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  const barW = Math.min(40, Math.max(12, Math.floor(600 / Math.max(data.length, 1))));
  const totalW = barW * data.length + (data.length - 1) * 4;
  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(totalW + 20, 200)} height={height + 40} className="block">
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = height - frac * height;
          return (
            <g key={frac}>
              <line x1={0} y1={y} x2={totalW + 20} y2={y} stroke="#E2E8F0" strokeWidth={1} />
              <text x={-4} y={y + 4} textAnchor="end" className="fill-text-secondary text-[10px]">
                {Math.round(frac * maxVal)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const val = Number(d[valueKey]) || 0;
          const barH = (val / maxVal) * height;
          const x = i * (barW + 4);
          const fill = colorFn ? colorFn(i) : COLORS[i % COLORS.length];
          return (
            <g key={i}>
              <rect
                x={x}
                y={height - barH}
                width={barW}
                height={barH}
                fill={fill}
                rx={3}
                className="transition-all duration-500"
              />
              <text
                x={x + barW / 2}
                y={height + 14}
                textAnchor="middle"
                className="fill-text-secondary text-[9px]"
              >
                {String(d[labelKey]).slice(0, 8)}
              </text>
              <text
                x={x + barW / 2}
                y={height - barH - 4}
                textAnchor="middle"
                className="fill-text-primary text-[10px] font-semibold"
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ReportesPage() {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [tipoActivo, setTipoActivo] = useState<ReporteTipo>("pacientes_atendidos");
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDate(d);
  });
  const [hasta, setHasta] = useState(() => formatDate(new Date()));
  const [datos, setDatos] = useState<Record<string, unknown> | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Sesion | null) => {
        if (!data) {
          router.replace("/login");
          return;
        }
        const permisos = data.permisos.map((p) => p.modulo);
        if (!permisos.includes("REPORTES")) {
          router.replace("/dashboard");
          return;
        }
        setSesion(data);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const cargarReporte = useCallback(async () => {
    setCargando(true);
    setError(null);
    setDatos(null);
    try {
      const config = reportes.find((r) => r.tipo === tipoActivo)!;
      const params = new URLSearchParams({ tipo: tipoActivo });
      if (config.usesDate) {
        params.set("desde", desde);
        params.set("hasta", hasta);
      }
      const res = await fetch(`/api/reportes?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Error al cargar reporte");
      }
      const data = await res.json();
      setDatos(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, [tipoActivo, desde, hasta]);

  useEffect(() => {
    if (sesion) cargarReporte();
  }, [sesion, cargarReporte]);

  const exportarCSV = () => {
    if (!datos) return;
    const config = reportes.find((r) => r.tipo === tipoActivo)!;
    const filename = `${tipoActivo}_${desde}_${hasta}.csv`;

    if (tipoActivo === "pacientes_atendidos") {
      const rows = (datos.datos as { especialidad: string; total_pacientes: number; total_atenciones: number }[]) || [];
      downloadCSV(
        filename,
        ["Especialidad", "Total Pacientes", "Total Atenciones"],
        rows.map((r) => [r.especialidad, String(r.total_pacientes), String(r.total_atenciones)])
      );
    } else if (tipoActivo === "ingresos_mensuales") {
      const rows =
        (datos.datos as { fecha: string; total_facturas: number; ingresos_totales: number }[]) || [];
      downloadCSV(
        filename,
        ["Fecha", "Total Facturas", "Ingresos Totales"],
        rows.map((r) => [r.fecha, String(r.total_facturas), String(r.ingresos_totales)])
      );
    } else if (tipoActivo === "ocupacion_hospitalaria") {
      const porPiso =
        (datos.por_piso as { piso: number; total: number; ocupadas: number; disponibles: number; mantenimiento: number }[]) || [];
      downloadCSV(
        `${tipoActivo}.csv`,
        ["Piso", "Total", "Ocupadas", "Disponibles", "Mantenimiento"],
        porPiso.map((r) => [
          String(r.piso),
          String(r.total),
          String(r.ocupadas),
          String(r.disponibles),
          String(r.mantenimiento),
        ])
      );
    } else if (tipoActivo === "stock_bajo") {
      const rows =
        (datos.datos as {
          medicamento_nombre: string;
          lote: string;
          cantidad: number;
          stock_minimo: number;
          fecha_vencimiento: string;
          ubicacion: string;
        }[]) || [];
      downloadCSV(
        filename,
        ["Medicamento", "Lote", "Cantidad", "Stock Minimo", "Vencimiento", "Ubicacion"],
        rows.map((r) => [
          r.medicamento_nombre,
          r.lote,
          String(r.cantidad),
          String(r.stock_minimo),
          r.fecha_vencimiento,
          r.ubicacion,
        ])
      );
    } else if (tipoActivo === "examenes_procesados") {
      const rows =
        (datos.datos as { tipo_examen: string; estado: string; total: number; criticos: number }[]) || [];
      downloadCSV(
        filename,
        ["Tipo Examen", "Estado", "Total", "Criticos"],
        rows.map((r) => [r.tipo_examen, r.estado, String(r.total), String(r.criticos)])
      );
    }
  };

  if (!sesion) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Verificando sesion...
        </div>
      </div>
    );
  }

  const config = reportes.find((r) => r.tipo === tipoActivo)!;

  return (
    <div className="min-h-screen bg-bg-page">
      <PageHeader
        title="Reportes"
        subtitle="Indicadores y analisis del sistema hospitalario"
      />

      {/* Report type selector */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {reportes.map((r) => (
          <button
            key={r.tipo}
            onClick={() => setTipoActivo(r.tipo)}
            className={`group flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
              tipoActivo === r.tipo
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border-card bg-white hover:border-primary/30 hover:shadow-sm"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                tipoActivo === r.tipo
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
              }`}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={r.icon} />
              </svg>
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${tipoActivo === r.tipo ? "text-primary" : "text-text-primary"}`}>
                {r.label}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary truncate">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border-card bg-white p-4 shadow-sm">
        {config.usesDate && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-secondary">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="rounded-lg border border-border-card bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-secondary">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="rounded-lg border border-border-card bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </>
        )}
        <button
          onClick={cargarReporte}
          disabled={cargando}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {cargando ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Generar Reporte
        </button>
        <button
          onClick={exportarCSV}
          disabled={!datos}
          className="inline-flex items-center gap-2 rounded-lg border border-border-card bg-white px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar CSV
        </button>
        {!config.usesDate && (
          <span className="ml-auto text-xs text-text-secondary italic">
            Este reporte no requiere filtro de fechas
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Loading */}
      {cargando && (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-3 text-text-secondary">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generando reporte...
          </div>
        </div>
      )}

      {/* Report content */}
      {!cargando && datos && (
        <>
          {/* Date range display */}
          {config.usesDate && (datos as Record<string, unknown>).desde && (
            <p className="mb-4 text-sm text-text-secondary">
              Periodo: <span className="font-medium text-text-primary">{String((datos as Record<string, unknown>).desde)}</span> al{" "}
              <span className="font-medium text-text-primary">{String((datos as Record<string, unknown>).hasta)}</span>
            </p>
          )}

          {/* PACIENTES ATENDIDOS */}
          {tipoActivo === "pacientes_atendidos" && (
            <PacientesReporte data={datos as { datos: { especialidad: string; total_pacientes: number; total_atenciones: number }[] }} />
          )}

          {/* INGRESOS MENSUALES */}
          {tipoActivo === "ingresos_mensuales" && (
            <IngresosReporte data={datos as {
              datos: { fecha: string; total_facturas: number; ingresos_totales: number }[];
              totales: { total_facturas: number; ingresos_totales: number; promedio_diario: number };
            }} />
          )}

          {/* OCUPACION HOSPITALARIA */}
          {tipoActivo === "ocupacion_hospitalaria" && (
            <OcupacionReporte data={datos as {
              camas: { estado: string; cantidad: number }[];
              hospitalizaciones: { estado: string; cantidad: number }[];
              por_piso: { piso: number; total: number; ocupadas: number; disponibles: number; mantenimiento: number }[];
            }} />
          )}

          {/* STOCK BAJO */}
          {tipoActivo === "stock_bajo" && (
            <StockBajoReporte data={datos as {
              datos: { medicamento_nombre: string; lote: string; cantidad: number; stock_minimo: number; fecha_vencimiento: string; ubicacion: string }[];
            }} />
          )}

          {/* EXAMENES PROCESADOS */}
          {tipoActivo === "examenes_procesados" && (
            <ExamenesReporte data={datos as {
              datos: { tipo_examen: string; estado: string; total: number; criticos: number }[];
            }} />
          )}
        </>
      )}

      {!cargando && !datos && !error && (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border-card bg-white">
          <p className="text-sm text-text-secondary">Selecciona un tipo de reporte y haz clic en Generar Reporte</p>
        </div>
      )}
    </div>
  );
}

function PacientesReporte({
  data,
}: {
  data: { datos: { especialidad: string; total_pacientes: number; total_atenciones: number }[] };
}) {
  const rows = data.datos || [];
  const totalPacientes = rows.reduce((s, r) => s + r.total_pacientes, 0);
  const totalAtenciones = rows.reduce((s, r) => s + r.total_atenciones, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Total Especialidades</p>
          <p className="mt-1 text-2xl font-bold text-primary">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Total Pacientes</p>
          <p className="mt-1 text-2xl font-bold text-info">{totalPacientes}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Total Atenciones</p>
          <p className="mt-1 text-2xl font-bold text-positive">{totalAtenciones}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-card bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Atenciones por Especialidad</h3>
        <HorizontalBarChart
          data={rows.map((r, i) => ({
            label: r.especialidad,
            value: r.total_atenciones,
            color: COLORS[i % COLORS.length],
          }))}
        />
      </div>

      <div className="rounded-xl border border-border-card bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-card">
          <h3 className="text-sm font-semibold text-text-primary">Detalle por Especialidad</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Especialidad</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">Pacientes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">Atenciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">{r.especialidad}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-text-primary">{r.total_pacientes}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-primary">{r.total_atenciones}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-text-secondary">
                    No hay datos para el periodo seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IngresosReporte({
  data,
}: {
  data: {
    datos: { fecha: string; total_facturas: number; ingresos_totales: number }[];
    totales: { total_facturas: number; ingresos_totales: number; promedio_diario: number };
  };
}) {
  const rows = data.datos || [];
  const totales = data.totales;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Ingresos Totales</p>
          <p className="mt-1 text-2xl font-bold text-positive">{totales ? formatCurrency(totales.ingresos_totales) : "-"}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Total Facturas</p>
          <p className="mt-1 text-2xl font-bold text-info">{totales ? totales.total_facturas : "-"}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Promedio Diario</p>
          <p className="mt-1 text-2xl font-bold text-primary">{totales ? formatCurrency(totales.promedio_diario) : "-"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-card bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Ingresos Diarios</h3>
        {rows.length > 0 ? (
          <VerticalBarChart
            data={rows}
            labelKey="fecha"
            valueKey="ingresos_totales"
            height={240}
            colorFn={(i) => COLORS[i % COLORS.length]}
          />
        ) : (
          <p className="py-8 text-center text-sm text-text-secondary">No hay datos para el periodo seleccionado</p>
        )}
      </div>

      <div className="rounded-xl border border-border-card bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-card">
          <h3 className="text-sm font-semibold text-text-primary">Detalle Diario</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">Facturas</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">{r.fecha}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-text-primary">{r.total_facturas}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-positive">{formatCurrency(r.ingresos_totales)}</td>
                </tr>
              ))}
            </tbody>
            {totales && (
              <tfoot>
                <tr className="bg-slate-100 font-semibold">
                  <td className="px-4 py-3 text-sm text-text-primary">Total</td>
                  <td className="px-4 py-3 text-right text-sm text-text-primary">{totales.total_facturas}</td>
                  <td className="px-4 py-3 text-right text-sm text-positive">{formatCurrency(totales.ingresos_totales)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function OcupacionReporte({
  data,
}: {
  data: {
    camas: { estado: string; cantidad: number }[];
    hospitalizaciones: { estado: string; cantidad: number }[];
    por_piso: { piso: number; total: number; ocupadas: number; disponibles: number; mantenimiento: number }[];
  };
}) {
  const camas = data.camas || [];
  const hosp = data.hospitalizaciones || [];
  const porPiso = data.por_piso || [];
  const totalCamas = camas.reduce((s, c) => s + c.cantidad, 0);
  const totalOcupadas = porPiso.reduce((s, p) => s + p.ocupadas, 0);
  const tasaOcupacion = totalCamas > 0 ? ((totalOcupadas / totalCamas) * 100).toFixed(1) : "0";

  const camasChartData = camas.map((c, i) => ({
    label: c.estado,
    value: c.cantidad,
    color: COLORS[i % COLORS.length],
  }));
  const hospChartData = hosp.map((h, i) => ({
    label: h.estado,
    value: h.cantidad,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Total Camas</p>
          <p className="mt-1 text-2xl font-bold text-primary">{totalCamas}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Ocupadas</p>
          <p className="mt-1 text-2xl font-bold text-warning">{totalOcupadas}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Tasa de Ocupacion</p>
          <p className="mt-1 text-2xl font-bold text-info">{tasaOcupacion}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border-card bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Estado de Camas</h3>
          <PieChart data={camasChartData} />
        </div>
        <div className="rounded-xl border border-border-card bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Hospitalizaciones por Estado</h3>
          <PieChart data={hospChartData} />
        </div>
      </div>

      <div className="rounded-xl border border-border-card bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-card">
          <h3 className="text-sm font-semibold text-text-primary">Ocupacion por Piso</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Piso</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Ocupadas</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Disponibles</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Mantenimiento</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Ocupacion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {porPiso.map((p, i) => {
                const pct = p.total > 0 ? ((p.ocupadas / p.total) * 100).toFixed(1) : "0";
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-center text-sm font-medium text-text-primary">{p.piso}</td>
                    <td className="px-4 py-3 text-center text-sm text-text-primary">{p.total}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-warning">{p.ocupadas}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-positive">{p.disponibles}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-danger">{p.mantenimiento}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          Number(pct) >= 80
                            ? "bg-red-100 text-red-700"
                            : Number(pct) >= 50
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {porPiso.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-secondary">
                    No hay datos de ocupacion
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StockBajoReporte({
  data,
}: {
  data: {
    datos: {
      medicamento_nombre: string;
      lote: string;
      cantidad: number;
      stock_minimo: number;
      fecha_vencimiento: string;
      ubicacion: string;
    }[];
  };
}) {
  const rows = data.datos || [];
  const totalItems = rows.length;
  const criticos = rows.filter((r) => r.cantidad === 0).length;
  const totalUnidades = rows.reduce((s, r) => s + r.cantidad, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Medicamentos Bajo Stock</p>
          <p className="mt-1 text-2xl font-bold text-danger">{totalItems}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Sin Stock (Criticos)</p>
          <p className="mt-1 text-2xl font-bold text-danger">{criticos}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Unidades Restantes</p>
          <p className="mt-1 text-2xl font-bold text-warning">{totalUnidades}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-card bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-card">
          <h3 className="text-sm font-semibold text-text-primary">Medicamentos con Stock Bajo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Medicamento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Lote</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Cantidad</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Stock Minimo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Vencimiento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Ubicacion</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {rows.map((r, i) => {
                const isCritico = r.cantidad === 0;
                const isVencido = new Date(r.fecha_vencimiento) < new Date();
                return (
                  <tr key={i} className={`transition-colors ${isCritico ? "bg-red-50" : "hover:bg-slate-50"}`}>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{r.medicamento_nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary font-mono">{r.lote}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-danger">{r.cantidad}</td>
                    <td className="px-4 py-3 text-center text-sm text-text-secondary">{r.stock_minimo}</td>
                    <td className={`px-4 py-3 text-sm ${isVencido ? "font-semibold text-danger" : "text-text-secondary"}`}>
                      {r.fecha_vencimiento}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{r.ubicacion}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isCritico
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isCritico ? "Sin stock" : "Bajo stock"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-text-secondary">
                    No hay medicamentos con stock bajo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExamenesReporte({
  data,
}: {
  data: { datos: { tipo_examen: string; estado: string; total: number; criticos: number }[] };
}) {
  const rows = data.datos || [];
  const totalExamenes = rows.reduce((s, r) => s + r.total, 0);
  const totalCriticos = rows.reduce((s, r) => s + r.criticos, 0);

  const byType: Record<string, { total: number; criticos: number; states: Record<string, number> }> = {};
  for (const r of rows) {
    if (!byType[r.tipo_examen]) {
      byType[r.tipo_examen] = { total: 0, criticos: 0, states: {} };
    }
    byType[r.tipo_examen].total += r.total;
    byType[r.tipo_examen].criticos += r.criticos;
    byType[r.tipo_examen].states[r.estado] = (byType[r.tipo_examen].states[r.estado] || 0) + r.total;
  }
  const typeEntries = Object.entries(byType);

  const uniqueStates = [...new Set(rows.map((r) => r.estado))];
  const stateColors: Record<string, string> = {};
  uniqueStates.forEach((s, i) => {
    stateColors[s] = COLORS[i % COLORS.length];
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Total Examenes</p>
          <p className="mt-1 text-2xl font-bold text-primary">{totalExamenes}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Tipos de Examen</p>
          <p className="mt-1 text-2xl font-bold text-info">{typeEntries.length}</p>
        </div>
        <div className="rounded-xl border border-border-card bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-text-secondary">Resultados Criticos</p>
          <p className="mt-1 text-2xl font-bold text-danger">{totalCriticos}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-card bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Examenes por Tipo</h3>
        {typeEntries.length > 0 ? (
          <div className="space-y-5">
            {typeEntries.map(([tipo, info], ti) => {
              const maxInGroup = Math.max(...Object.values(info.states), 1);
              return (
                <div key={tipo}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-text-primary">{tipo}</span>
                    <span className="text-xs text-text-secondary">{info.total} total</span>
                  </div>
                  <div className="flex gap-1 overflow-hidden rounded-lg">
                    {Object.entries(info.states).map(([estado, count]) => (
                      <div
                        key={estado}
                        title={`${estado}: ${count}`}
                        className="flex items-center justify-center text-[10px] font-semibold text-white transition-all"
                        style={{
                          width: `${(count / info.total) * 100}%`,
                          minWidth: 24,
                          height: 32,
                          backgroundColor: stateColors[estado] || COLORS[ti % COLORS.length],
                        }}
                      >
                        {count}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-secondary">
                    {Object.entries(info.states).map(([estado, count]) => (
                      <div key={estado} className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: stateColors[estado] || COLORS[ti % COLORS.length] }} />
                        {estado}: {count}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-text-secondary">No hay datos para el periodo seleccionado</p>
        )}
      </div>

      <div className="rounded-xl border border-border-card bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-card">
          <h3 className="text-sm font-semibold text-text-primary">Detalle por Tipo y Estado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Tipo de Examen</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary">Criticos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary">{r.tipo_examen}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: stateColors[r.estado] || COLORS[0] }}
                    >
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-text-primary">{r.total}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    <span className={r.criticos > 0 ? "text-danger" : "text-text-secondary"}>
                      {r.criticos}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-text-secondary">
                    No hay examenes para el periodo seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
