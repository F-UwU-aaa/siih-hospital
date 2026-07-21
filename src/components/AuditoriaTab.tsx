"use client";

import { useState, useEffect, useCallback } from "react";
import BadgeEstado from "@/components/ui/BadgeEstado";

interface AuditoriaEntry {
  id: number;
  usuario_id: number;
  username: string;
  tabla_afectada: string;
  accion: string;
  registro_id: number | null;
  detalle: string | null;
  fecha_hora: string;
  ip_origen: string | null;
}

export default function AuditoriaTab({ onError }: { onError: (m: string) => void }) {
  const [registros, setRegistros] = useState<AuditoriaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTabla, setFiltroTabla] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTabla) params.set("tabla_afectada", filtroTabla);
      if (filtroAccion) params.set("accion", filtroAccion);
      const res = await fetch(`/api/seguridad/auditoria?${params.toString()}`);
      if (res.ok) setRegistros(await res.json());
      else onError("Error al cargar auditoria");
    } catch {
      onError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }, [filtroTabla, filtroAccion, onError]);

  useEffect(() => { cargar(); }, [cargar]);

  const getAccionBadge = (accion: string) => {
    const styles: Record<string, string> = {
      INSERT: "bg-emerald-100 text-emerald-700",
      UPDATE: "bg-blue-100 text-blue-700",
      DELETE: "bg-red-100 text-red-700",
      ANULACION: "bg-red-100 text-red-700",
      ACTIVAR: "bg-emerald-100 text-emerald-700",
      DESACTIVAR: "bg-amber-100 text-amber-700",
    };
    return styles[accion] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tabla</label>
          <select
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todas</option>
            <option value="usuario">usuario</option>
            <option value="cita">cita</option>
            <option value="paciente">paciente</option>
            <option value="atencion">atencion</option>
            <option value="receta">receta</option>
            <option value="inventario">inventario</option>
            <option value="factura">factura</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Accion</label>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todas</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="ANULACION">ANULACION</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-8">Cargando registros...</p>
      ) : registros.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No hay registros de auditoria</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Fecha</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Usuario</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Tabla</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Accion</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">#</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(r.fecha_hora).toLocaleString("es-VE")}
                  </td>
                  <td className="py-2 px-3 font-medium">{r.username}</td>
                  <td className="py-2 px-3"><BadgeEstado estado={r.tabla_afectada} /></td>
                  <td className="py-2 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getAccionBadge(r.accion)}`}>
                      {r.accion}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500">{r.registro_id ?? "-"}</td>
                  <td className="py-2 px-3 text-xs text-slate-500 max-w-xs truncate">{r.detalle || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
