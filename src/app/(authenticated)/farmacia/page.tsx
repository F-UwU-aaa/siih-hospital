"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BadgeEstado, PageHeader, Button } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Medicamento {
  id: number;
  nombre: string;
  principio_activo: string | null;
  presentacion: string | null;
  concentracion: string | null;
  laboratorio: string | null;
  stock_total?: number;
  stock_minimo?: number;
  bajo_stock?: boolean;
  disponibilidad?: string;
}

interface InventarioLote {
  id: number;
  medicamento_id: number;
  medicamento_nombre: string;
  principio_activo: string | null;
  presentacion: string | null;
  concentracion: string | null;
  lote: string;
  cantidad: number;
  stock_minimo: number;
  fecha_vencimiento: string;
  ubicacion: string | null;
  precio_unitario: number | null;
  vencimiento_proximo: boolean;
  vencido: boolean;
}

interface Receta {
  id: number;
  codigo_receta: string;
  estado: string;
  fecha_emision: string;
  paciente_ci: string;
  paciente_nombre: string;
  medico_nombre: string;
  items_count: string;
}

const ESTADO_COLORS: Record<string, string> = {
  EMITIDA: "bg-yellow-100 text-yellow-800",
  DISPENSADA: "bg-green-100 text-green-800",
  PARCIAL: "bg-orange-100 text-orange-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export default function FarmaciaPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [activeTab, setActiveTab] = useState<string>("recetas");

  // Medicamentos
  const [medBusqueda, setMedBusqueda] = useState("");
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  // Inventario (farmacéutico)
  const [invBusqueda, setInvBusqueda] = useState("");
  const [inventario, setInventario] = useState<InventarioLote[]>([]);
  const [soloStockBajo, setSoloStockBajo] = useState(false);

  // Recetas (farmacéutico)
  const [recBusqueda, setRecBusqueda] = useState("");
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [recEstado, setRecEstado] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  const rol = sesion?.usuario.rol_nombre;
  const esFarmaceutico = rol === "FARMACEUTICO" || rol === "ADMIN";
  const esMedico = rol === "MEDICO";
  const esPaciente = rol === "PACIENTE";

  // Default tab based on role
  useEffect(() => {
    if (esMedico) setActiveTab("medicamentos");
    if (esPaciente) setActiveTab("medicamentos");
  }, [esMedico, esPaciente]);

  // Load data based on active tab and role
  useEffect(() => {
    if (activeTab === "medicamentos" || (esPaciente && activeTab === "medicamentos")) {
      setLoading(true);
      fetch(`/api/farmacia/medicamentos${medBusqueda ? `?busqueda=${encodeURIComponent(medBusqueda)}` : ""}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setMedicamentos(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    if (activeTab === "inventario" && esFarmaceutico) {
      setLoading(true);
      const params = new URLSearchParams();
      if (soloStockBajo) params.set("solo_stock_bajo", "true");
      fetch(`/api/farmacia/inventario?${params}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setInventario(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    if (activeTab === "recetas" && esFarmaceutico) {
      setLoading(true);
      const params = new URLSearchParams();
      if (recBusqueda) params.set("busqueda", recBusqueda);
      if (recEstado) params.set("estado", recEstado);
      fetch(`/api/farmacia/recetas?${params}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setRecetas(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeTab, medBusqueda, soloStockBajo, recBusqueda, recEstado, esFarmaceutico, esPaciente]);

  if (!sesion) return <div className="bg-bg-page p-8">Cargando sesión...</div>;

  const subtitle = esFarmaceutico ? "(Panel de Farmacéutico)" : esMedico ? "(Consulta de Medicamentos)" : esPaciente ? "(Disponibilidad)" : undefined;

  return (
    <div className="bg-bg-page p-8 max-w-5xl">
      <PageHeader title="Farmacia" subtitle={subtitle} />

      {/* Tabs */}
      <div className="flex border-b mb-4">
        {(esFarmaceutico) && (
          <button
            onClick={() => setActiveTab("recetas")}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === "recetas" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Recetas
          </button>
        )}
        <button
          onClick={() => setActiveTab("medicamentos")}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === "medicamentos" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Medicamentos
        </button>
        {esFarmaceutico && (
          <button
            onClick={() => setActiveTab("inventario")}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === "inventario" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Inventario
          </button>
        )}
      </div>

      {/* === TAB RECETAS (Farmacéutico) === */}
      {activeTab === "recetas" && esFarmaceutico && (
        <div>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Buscar por código receta o CI paciente..."
              value={recBusqueda}
              onChange={(e) => setRecBusqueda(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
            <select
              value={recEstado}
              onChange={(e) => setRecEstado(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos los estados</option>
              <option value="EMITIDA">Emitidas</option>
              <option value="PARCIAL">Parciales</option>
              <option value="DISPENSADA">Dispensadas</option>
            </select>
          </div>

          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : recetas.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No se encontraron recetas</p>
          ) : (
            <div className="divide-y bg-white border border-border-card rounded-lg shadow-sm">
              {recetas.map((r) => (
                <Link
                  key={r.id}
                  href={`/farmacia/recetas/${r.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{r.codigo_receta}</span>
                      <span className="ml-2"><BadgeEstado estado={r.estado} /></span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(r.fecha_emision).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    Paciente: {r.paciente_nombre} (CI: {r.paciente_ci})
                  </div>
                  <div className="text-sm text-gray-500">
                    Dr(a). {r.medico_nombre} — {r.items_count} medicamento(s)
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TAB MEDICAMENTOS === */}
      {activeTab === "medicamentos" && (
        <div>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o principio activo..."
              value={medBusqueda}
              onChange={(e) => setMedBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setLoading(true);
                  fetch(`/api/farmacia/medicamentos?busqueda=${encodeURIComponent(medBusqueda)}`)
                    .then((r) => r.json())
                    .then((data) => { if (Array.isArray(data)) setMedicamentos(data); })
                    .catch(() => {})
                    .finally(() => setLoading(false));
                }
              }}
              className="border rounded px-3 py-2 flex-1"
            />
          </div>

          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : medicamentos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No se encontraron medicamentos</p>
          ) : (
            <div className="divide-y bg-white border border-border-card rounded-lg shadow-sm">
              {medicamentos.map((m) => (
                <div key={m.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{m.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {m.principio_activo && `${m.principio_activo} — `}
                        {m.presentacion} {m.concentracion}
                      </div>
                      {m.laboratorio && (
                        <div className="text-xs text-gray-400">{m.laboratorio}</div>
                      )}
                    </div>
                    <div className="text-right">
                      {esPaciente ? (
                        <BadgeEstado estado={m.disponibilidad || ""} />
                      ) : (
                        <>
                          <div className="text-sm">
                            Stock: <span className="font-medium">{m.stock_total}</span>
                          </div>
                          {m.bajo_stock && (
                            <span className="text-xs font-semibold text-red-600">
                              BAJO MÍNIMO ({m.stock_minimo})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TAB INVENTARIO (Farmacéutico) === */}
      {activeTab === "inventario" && esFarmaceutico && (
        <div>
          <div className="flex gap-3 mb-4 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={soloStockBajo}
                onChange={(e) => setSoloStockBajo(e.target.checked)}
              />
              Solo stock bajo
            </label>
          </div>

          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : inventario.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay lotes en inventario</p>
          ) : (
            <div className="overflow-x-auto bg-white border border-border-card rounded-lg shadow-sm">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2">Medicamento</th>
                    <th className="text-left px-3 py-2">Lote</th>
                    <th className="text-left px-3 py-2">Cantidad</th>
                    <th className="text-left px-3 py-2">Mínimo</th>
                    <th className="text-left px-3 py-2">Vencimiento</th>
                    <th className="text-left px-3 py-2">Ubicación</th>
                    <th className="text-left px-3 py-2">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inventario.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`${
                        inv.vencido
                          ? "bg-red-50"
                          : inv.vencimiento_proximo
                          ? "bg-yellow-50"
                          : inv.cantidad <= inv.stock_minimo
                          ? "bg-red-50"
                          : ""
                      } hover:bg-gray-50`}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">{inv.medicamento_nombre}</div>
                        <div className="text-xs text-gray-500">
                          {inv.principio_activo} {inv.concentracion}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{inv.lote}</td>
                      <td className="px-3 py-2">
                        <span className={`font-medium ${inv.cantidad <= inv.stock_minimo ? "text-red-600" : ""}`}>
                          {inv.cantidad}
                        </span>
                        {inv.cantidad <= inv.stock_minimo && (
                          <span className="ml-1 text-xs text-red-600 font-semibold">BAJO</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{inv.stock_minimo}</td>
                      <td className="px-3 py-2">
                        <span className={
                          inv.vencido
                            ? "text-red-600 font-semibold"
                            : inv.vencimiento_proximo
                            ? "text-yellow-600 font-semibold"
                            : ""
                        }>
                          {new Date(inv.fecha_vencimiento).toLocaleDateString("es-ES")}
                          {inv.vencido && " (VENCIDO)"}
                          {inv.vencimiento_proximo && !inv.vencido && " (PRÓXIMO)"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{inv.ubicacion || "—"}</td>
                      <td className="px-3 py-2">
                        {inv.precio_unitario ? `$${Number(inv.precio_unitario).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
