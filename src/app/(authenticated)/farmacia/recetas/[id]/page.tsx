"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeEstado, PageHeader, Button } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Receta {
  id: number;
  codigo_receta: string;
  estado: string;
  fecha_emision: string;
  paciente_ci: string;
  paciente_nombre: string;
  paciente_id: number;
  medico_nombre: string;
  especialidad: string;
  dispensado_por_username: string | null;
  atencion_id: number;
}

interface DetalleItem {
  id: number;
  medicamento_id: number;
  medicamento_nombre: string;
  principio_activo: string | null;
  presentacion: string | null;
  concentracion: string | null;
  dosis: string | null;
  frecuencia: string | null;
  duracion: string | null;
  cantidad: number;
  indicaciones: string | null;
}

interface StockInfo {
  stock_total: number;
  lotes: { id: number; lote: string; cantidad: number; fecha_vencimiento: string }[];
}

interface Alergia {
  sustancia: string;
  reaccion: string | null;
  severidad: string | null;
}

const ESTADO_COLORS: Record<string, string> = {
  EMITIDA: "bg-yellow-100 text-yellow-800",
  DISPENSADA: "bg-green-100 text-green-800",
  PARCIAL: "bg-orange-100 text-orange-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export default function RecetaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [receta, setReceta] = useState<Receta | null>(null);
  const [items, setItems] = useState<DetalleItem[]>([]);
  const [stockInfo, setStockInfo] = useState<Record<number, StockInfo>>({});
  const [alergias, setAlergias] = useState<Alergia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dispensando, setDispensando] = useState(false);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/farmacia/recetas/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No encontrada");
        return r.json();
      })
      .then((data) => {
        setReceta(data.receta);
        setItems(data.items || []);
        setStockInfo(data.stock_info || {});
        setAlergias(data.alergias || []);
      })
      .catch(() => setError("Receta no encontrada"))
      .finally(() => setLoading(false));
  }, [id]);

  const dispensar = async () => {
    setDispensando(true);
    setError("");
    try {
      const res = await fetch(`/api/farmacia/recetas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al dispensar");
        return;
      }
      setReceta(data.receta);
      // Reload to get updated stock
      const refreshRes = await fetch(`/api/farmacia/recetas/${id}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setItems(refreshData.items || []);
        setStockInfo(refreshData.stock_info || {});
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setDispensando(false);
    }
  };

  if (loading) return <div className="bg-bg-page p-8">Cargando...</div>;
  if (!receta) {
    return (
      <div className="bg-bg-page p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Receta no encontrada"}
        </div>
        <Link href="/farmacia" className="text-blue-600 hover:underline mt-4 block">← Volver a Farmacia</Link>
      </div>
    );
  }

  const esFarmaceutico = sesion?.usuario.rol_nombre === "FARMACEUTICO" || sesion?.usuario.rol_nombre === "ADMIN";
  const puedeDispensar = esFarmaceutico && (receta.estado === "EMITIDA" || receta.estado === "PARCIAL");

  return (
    <div className="bg-bg-page p-8 max-w-3xl">
      <Link href="/farmacia" className="text-blue-600 hover:underline mb-4 block">← Volver a Farmacia</Link>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      {/* ALERTA DE ALERGIAS — SIEMPRE VISIBLE ANTES DE DISPENSAR */}
      {alergias.length > 0 ? (
        <div className="bg-red-700 text-white border-4 border-red-900 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <h2 className="text-xl font-bold">ALERTA DE ALERGIAS — {receta.paciente_nombre}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alergias.map((a, i) => (
              <div
                key={i}
                className={`bg-red-900 rounded p-3 border ${
                  a.severidad === "CRITICA" || a.severidad === "GRAVE"
                    ? "border-red-500"
                    : "border-red-700"
                }`}
              >
                <div className="font-bold text-yellow-300 text-lg">{a.sustancia}</div>
                {a.reaccion && (
                  <div className="text-sm">Reacción: {a.reaccion}</div>
                )}
                {a.severidad && (
                  <div className={`text-sm font-semibold mt-1 ${
                    a.severidad === "CRITICA" ? "text-red-300" : a.severidad === "GRAVE" ? "text-orange-300" : "text-yellow-200"
                  }`}>
                    Severidad: {a.severidad}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">No se registran alergias para este paciente.</span>
          </div>
        </div>
      )}

      <PageHeader 
        title={receta.codigo_receta}
        actions={
          <>
            <BadgeEstado estado={receta.estado} />
            <span className="text-sm text-text-secondary">
              Emitida: {new Date(receta.fecha_emision).toLocaleString("es-ES")}
            </span>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-border-card rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-2">Paciente</h2>
          <p className="font-medium">{receta.paciente_nombre}</p>
          <p className="text-sm text-gray-500">CI: {receta.paciente_ci}</p>
        </div>
        <div className="bg-white border border-border-card rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-2">Médico</h2>
          <p className="font-medium">Dr(a). {receta.medico_nombre}</p>
          <p className="text-sm text-gray-500">{receta.especialidad}</p>
        </div>
      </div>

      <h2 className="font-semibold mb-3">Medicamentos Recetados</h2>
      <div className="divide-y bg-white border border-border-card rounded-lg shadow-sm mb-6">
        {items.map((item) => {
          const stock = stockInfo[item.medicamento_id];
          return (
            <div key={item.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{item.medicamento_nombre}</div>
                  <div className="text-sm text-gray-500">
                    {item.principio_activo} {item.presentacion} {item.concentracion}
                  </div>
                  <div className="text-sm mt-1">
                    Dosis: {item.dosis} — Frecuencia: {item.frecuencia} — Duración: {item.duracion}
                  </div>
                  {item.indicaciones && (
                    <div className="text-xs text-gray-400 mt-1">{item.indicaciones}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">Cantidad: {item.cantidad}</div>
                  {esFarmaceutico && stock && (
                    <div className="text-sm mt-1">
                      <span className={stock.stock_total >= item.cantidad ? "text-green-600" : "text-red-600"}>
                        Disponible: {stock.stock_total}
                      </span>
                      {stock.stock_total < item.cantidad && (
                        <span className="text-red-600 text-xs ml-1">(insuficiente)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Lot details for farmacéutico */}
              {esFarmaceutico && stock && stock.lotes.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                  <strong>Lotes disponibles (FEFO):</strong>{" "}
                  {stock.lotes.map((l) => `${l.lote} (${l.cantidad}, vence ${new Date(l.fecha_vencimiento).toLocaleDateString("es-ES")})`).join(" → ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dispensar button */}
      {puedeDispensar && (
        <Button
          onClick={dispensar}
          disabled={dispensando}
          variant="primary"
        >
          {dispensando ? "Dispensando..." : "Dispensar Receta"}
        </Button>
      )}

      {receta.dispensado_por_username && (
        <div className="mt-4 text-sm text-gray-500">
          Dispensado por: {receta.dispensado_por_username}
        </div>
      )}
    </div>
  );
}
