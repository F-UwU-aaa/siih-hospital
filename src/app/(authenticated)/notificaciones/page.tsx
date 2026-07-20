"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Notificacion {
  id: number;
  paciente_id: number | null;
  medico_id: number | null;
  cita_id: number | null;
  tipo: string;
  asunto: string;
  mensaje: string;
  estado: string;
  fecha_envio: string | null;
  creado_en: string;
  paciente_nombre: string | null;
  paciente_apellido: string | null;
  paciente_ci: string | null;
  medico_nombre: string | null;
  medico_apellido: string | null;
  medico_especialidad: string | null;
}

const TIPO_COLORS: Record<string, string> = {
  CITA: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELACION: "bg-amber-100 text-amber-800 border-amber-200",
  ALERTA_LAB: "bg-red-100 text-red-800 border-red-200",
  STOCK_BAJO: "bg-orange-100 text-orange-800 border-orange-200",
  SISTEMA: "bg-slate-100 text-slate-800 border-slate-200",
};

const TIPO_LABELS: Record<string, string> = {
  CITA: "Cita",
  CANCELACION: "Cancelación",
  ALERTA_LAB: "Alerta Lab",
  STOCK_BAJO: "Stock Bajo",
  SISTEMA: "Sistema",
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800 border-amber-200",
  ENVIADA: "bg-green-100 text-green-800 border-green-200",
  FALLIDA: "bg-red-100 text-red-800 border-red-200",
};

const TABS = ["TODAS", "PENDIENTE", "ENVIADA", "FALLIDA"] as const;

const TIPOS = [
  { value: "", label: "Todos los tipos" },
  { value: "CITA", label: "Cita" },
  { value: "CANCELACION", label: "Cancelación" },
  { value: "ALERTA_LAB", label: "Alerta Lab" },
  { value: "STOCK_BAJO", label: "Stock Bajo" },
  { value: "SISTEMA", label: "Sistema" },
];

export default function NotificacionesPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("TODAS");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [procesando, setProcesando] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  const cargarNotificaciones = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroEstado !== "TODAS") params.set("estado", filtroEstado);
    if (filtroTipo) params.set("tipo", filtroTipo);

    try {
      const res = await fetch(`/api/notificaciones?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data);
      }
    } catch {
      console.error("Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroTipo]);

  useEffect(() => {
    if (sesion) {
      cargarNotificaciones();
    }
  }, [sesion, cargarNotificaciones]);

  const cambiarEstado = async (id: number, accion: "ENVIAR" | "FALLIDA") => {
    setProcesando(id);
    try {
      const res = await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, accion }),
      });
      if (res.ok) {
        await cargarNotificaciones();
      }
    } catch {
      console.error("Error al actualizar notificación");
    } finally {
      setProcesando(null);
    }
  };

  const marcarTodasEnviadas = async () => {
    setProcesando(-1);
    try {
      const res = await fetch("/api/notificaciones/marcar-todas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "ENVIAR_TODAS" }),
      });
      if (res.ok) {
        await cargarNotificaciones();
      }
    } catch {
      console.error("Error al marcar todas como enviadas");
    } finally {
      setProcesando(null);
    }
  };

  const pendientesCount = notificaciones.filter(
    (n) => n.estado === "PENDIENTE"
  ).length;

  const getDestinatario = (n: Notificacion): string => {
    if (n.paciente_nombre && n.paciente_apellido) {
      return `${n.paciente_nombre} ${n.paciente_apellido}`;
    }
    if (n.medico_nombre && n.medico_apellido) {
      return `Dr(a). ${n.medico_nombre} ${n.medico_apellido}`;
    }
    return "Sistema";
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-8 max-w-6xl bg-bg-page">
      <PageHeader
        title="Notificaciones"
        subtitle="Bandeja de entrada del sistema"
        actions={
          <>
            <button
              onClick={marcarTodasEnviadas}
              disabled={procesando === -1 || pendientesCount === 0}
              className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {procesando === -1 ? "Procesando..." : "Marcar todas como enviadas"}
            </button>
          </>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-slate-200 bg-slate-50">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {TABS.map((tab) => {
              const count =
                tab === "TODAS"
                  ? notificaciones.length
                  : notificaciones.filter((n) => n.estado === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setFiltroEstado(tab)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filtroEstado === tab
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab === "TODAS" ? "Todas" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  {tab === "PENDIENTE" && pendientesCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                      {pendientesCount}
                    </span>
                  )}
                  {tab !== "PENDIENTE" && count > 0 && (
                    <span className="ml-1.5 text-xs text-slate-400">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tipo filter */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-slate-500">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-sm">Cargando notificaciones...</span>
              </div>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <svg
                className="h-12 w-12 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <p className="text-sm font-medium">No hay notificaciones</p>
              <p className="text-xs mt-1">
                {filtroEstado !== "TODAS" || filtroTipo
                  ? "No se encontraron notificaciones con los filtros seleccionados."
                  : "Tu bandeja de entrada está vacía."}
              </p>
            </div>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  n.estado === "PENDIENTE" ? "bg-amber-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Tipo indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        TIPO_COLORS[n.tipo] ?? "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {TIPO_LABELS[n.tipo] ?? n.tipo}
                    </span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                          {n.asunto}
                        </h3>
                        <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                          {n.mensaje}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          ESTADO_COLORS[n.estado] ?? "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {n.estado}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                        {getDestinatario(n)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                          />
                        </svg>
                        {formatDate(n.creado_en)}
                      </span>
                      {n.fecha_envio && (
                        <span className="flex items-center gap-1 text-green-600">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                          </svg>
                          Enviada: {formatDate(n.fecha_envio)}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    {n.estado === "PENDIENTE" && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => cambiarEstado(n.id, "ENVIAR")}
                          disabled={procesando === n.id}
                          className="inline-flex items-center gap-1.5 bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                          </svg>
                          Marcar ENVIADA
                        </button>
                        <button
                          onClick={() => cambiarEstado(n.id, "FALLIDA")}
                          disabled={procesando === n.id}
                          className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                          </svg>
                          Marcar FALLIDA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
