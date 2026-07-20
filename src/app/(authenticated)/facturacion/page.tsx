"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import AlertBanner from "@/components/ui/AlertBanner";

interface SesionData {
  usuario_id: number;
  rol_id: number;
  username: string;
  rol_nombre: string;
}

interface Factura {
  id: number;
  paciente_id: number;
  numero_factura: string;
  subtotal: number;
  impuesto: number;
  descuento: number;
  cobertura_seguro: number;
  total: number;
  estado: string;
  fecha_emision: string;
  paciente_ci?: string;
  paciente_nombre?: string;
  paciente_apellido?: string;
}

export default function FacturacionPage() {
  const [sesion, setSesion] = useState<SesionData | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [creando, setCreando] = useState(false);
  const [creandoPacienteId, setCreandoPacienteId] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => r.json())
      .then((data) => {
        if (data.usuario_id) {
          setSesion(data);
          fetchFacturas(data.rol_nombre, data.usuario_id);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const fetchFacturas = async (rol: string, userId: number) => {
    try {
      setLoading(true);
      let url = "/api/facturacion";
      if (rol === "PACIENTE") {
        url = "/api/facturacion/paciente";
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFacturas(data);
      }
    } catch {
      setError("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearFactura = async () => {
    if (!creandoPacienteId) return;
    try {
      setCreando(true);
      setError("");
      const res = await fetch("/api/facturacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paciente_id: parseInt(creandoPacienteId) }),
      });
      const data = await res.json();
      if (res.ok) {
        setFacturas((prev) => [data.factura, ...prev]);
        setCreando(false);
        setCreandoPacienteId("");
        router.push(`/facturacion/${data.factura.id}`);
      } else {
        setError(data.error || "Error al crear factura");
      }
    } catch {
      setError("Error al crear factura");
    } finally {
      setCreando(false);
    }
  };

  const handlePagar = async (facturaId: number) => {
    try {
      const res = await fetch(`/api/facturacion/${facturaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "PAGAR", descuento: 0, cobertura_seguro: 0 }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFacturas((prev) =>
          prev.map((f) => (f.id === facturaId ? updated : f))
        );
      }
    } catch {
      setError("Error al pagar factura");
    }
  };

  const handleAnular = async (facturaId: number) => {
    if (!confirm("Seguro que desea anular esta factura?")) return;
    try {
      const res = await fetch(`/api/facturacion/${facturaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "ANULAR", motivo: "Anulacion desde interfaz" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFacturas((prev) =>
          prev.map((f) => (f.id === facturaId ? updated : f))
        );
      }
    } catch {
      setError("Error al anular factura");
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      PENDIENTE: "bg-amber-100 text-amber-700",
      PAGADA: "bg-emerald-100 text-emerald-700",
      ANULADA: "bg-red-100 text-red-700",
    };
    return styles[estado] || "bg-slate-100 text-slate-700";
  };

  const formatMoney = (val: number) =>
    `$${Number(val).toFixed(2)}`;

  const isFacturador = sesion?.rol_nombre === "FACTURADOR" || sesion?.rol_nombre === "ADMIN";

  const filtered = facturas.filter((f) => {
    if (filtroEstado && f.estado !== filtroEstado) return false;
    if (filtroPaciente) {
      const q = filtroPaciente.toLowerCase();
      const ci = (f.paciente_ci || "").toLowerCase();
      const nombre = `${f.paciente_nombre || ""} ${f.paciente_apellido || ""}`.toLowerCase();
      if (!ci.includes(q) && !nombre.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Facturacion" subtitle="Gestion de facturas del hospital" />

      {error && (
        <AlertBanner variant="danger" title="Error">
          {error}
        </AlertBanner>
      )}

      {isFacturador && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Nueva Factura</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID Paciente</label>
              <input
                type="number"
                value={creandoPacienteId}
                onChange={(e) => setCreandoPacienteId(e.target.value)}
                placeholder="Ej: 1"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-40 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <button
              onClick={handleCrearFactura}
              disabled={creando || !creandoPacienteId}
              className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {creando ? "Creando..." : "Crear Factura"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADA">Pagada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar paciente</label>
            <input
              type="text"
              value={filtroPaciente}
              onChange={(e) => setFiltroPaciente(e.target.value)}
              placeholder="CI o nombre..."
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500 text-center py-8">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No hay facturas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-medium text-slate-600">#</th>
                  <th className="text-left py-3 px-3 font-medium text-slate-600">Numero</th>
                  <th className="text-left py-3 px-3 font-medium text-slate-600">Paciente</th>
                  <th className="text-left py-3 px-3 font-medium text-slate-600">Fecha</th>
                  <th className="text-right py-3 px-3 font-medium text-slate-600">Subtotal</th>
                  <th className="text-right py-3 px-3 font-medium text-slate-600">Impuesto</th>
                  <th className="text-right py-3 px-3 font-medium text-slate-600">Descuento</th>
                  <th className="text-right py-3 px-3 font-medium text-slate-600">Seguro</th>
                  <th className="text-right py-3 px-3 font-medium text-slate-600">Total</th>
                  <th className="text-center py-3 px-3 font-medium text-slate-600">Estado</th>
                  <th className="text-center py-3 px-3 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3">{f.id}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{f.numero_factura}</td>
                    <td className="py-3 px-3">{f.paciente_nombre} {f.paciente_apellido}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(f.fecha_emision).toLocaleDateString("es-VE")}
                    </td>
                    <td className="py-3 px-3 text-right">{formatMoney(f.subtotal)}</td>
                    <td className="py-3 px-3 text-right">{formatMoney(f.impuesto)}</td>
                    <td className="py-3 px-3 text-right">{formatMoney(f.descuento)}</td>
                    <td className="py-3 px-3 text-right">{formatMoney(f.cobertura_seguro)}</td>
                    <td className="py-3 px-3 text-right font-semibold">{formatMoney(f.total)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(f.estado)}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => router.push(`/facturacion/${f.id}`)}
                        className="text-teal-700 hover:text-teal-900 text-xs font-medium mr-2"
                      >
                        Ver
                      </button>
                      {isFacturador && f.estado === "PENDIENTE" && (
                        <button
                          onClick={() => handlePagar(f.id)}
                          className="text-emerald-600 hover:text-emerald-800 text-xs font-medium mr-2"
                        >
                          Pagar
                        </button>
                      )}
                      {isFacturador && ["PENDIENTE", "PAGADA"].includes(f.estado) && (
                        <button
                          onClick={() => handleAnular(f.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
