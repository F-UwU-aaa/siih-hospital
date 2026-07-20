"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import AlertBanner from "@/components/ui/AlertBanner";

interface DetalleFactura {
  id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
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
  paciente_telefono?: string;
  facturador_username?: string;
  detalles: DetalleFactura[];
}

interface SesionData {
  usuario_id: number;
  rol_nombre: string;
}

export default function FacturaDetailPage() {
  const [sesion, setSesion] = useState<SesionData | null>(null);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [cobertura, setCobertura] = useState(0);
  const [procesando, setProcesando] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => r.json())
      .then((data) => {
        if (data.usuario_id) {
          setSesion(data);
          fetchFactura(data.usuario_id);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router, id]);

  const fetchFactura = async (userId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/facturacion/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFactura(data);
        setDescuento(data.descuento || 0);
        setCobertura(data.cobertura_seguro || 0);
      } else {
        setError("Factura no encontrada");
      }
    } catch {
      setError("Error al cargar factura");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    try {
      setProcesando(true);
      setError("");
      const res = await fetch(`/api/facturacion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "CONFIRMAR", descuento, cobertura_seguro: cobertura }),
      });
      const data = await res.json();
      if (res.ok) {
        setFactura(data);
      } else {
        setError(data.error || "Error al confirmar");
      }
    } catch {
      setError("Error al confirmar factura");
    } finally {
      setProcesando(false);
    }
  };

  const handlePagar = async () => {
    try {
      setProcesando(true);
      setError("");
      const res = await fetch(`/api/facturacion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "PAGAR" }),
      });
      const data = await res.json();
      if (res.ok) {
        setFactura(data);
      } else {
        setError(data.error || "Error al pagar");
      }
    } catch {
      setError("Error al pagar factura");
    } finally {
      setProcesando(false);
    }
  };

  const handleAnular = async () => {
    if (!confirm("Seguro que desea anular esta factura?")) return;
    try {
      setProcesando(true);
      setError("");
      const res = await fetch(`/api/facturacion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "ANULAR", motivo: "Anulacion desde interfaz" }),
      });
      const data = await res.json();
      if (res.ok) {
        setFactura(data);
      } else {
        setError(data.error || "Error al anular");
      }
    } catch {
      setError("Error al anular factura");
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      BORRADOR: "bg-slate-100 text-slate-700",
      PENDIENTE: "bg-amber-100 text-amber-700",
      CONFIRMADA: "bg-blue-100 text-blue-700",
      PAGADA: "bg-emerald-100 text-emerald-700",
      ANULADA: "bg-red-100 text-red-700",
    };
    return styles[estado] || "bg-slate-100 text-slate-700";
  };

  const formatMoney = (val: number) => `$${Number(val).toFixed(2)}`;

  const isFacturador = sesion?.rol_nombre === "FACTURADOR" || sesion?.rol_nombre === "ADMIN";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">Cargando factura...</div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="space-y-6">
        <PageHeader title="Factura" subtitle="Detalle" actions={
          <button onClick={() => router.push("/facturacion")} className="text-sm text-slate-600 hover:text-slate-900">
            ← Volver
          </button>
        } />
        <AlertBanner variant="danger" title="Error">
          {error || "Factura no encontrada"}
        </AlertBanner>
      </div>
    );
  }

  const totalCalc = factura.subtotal + factura.impuesto - (factura.descuento || 0) - (factura.cobertura_seguro || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Factura ${factura.numero_factura}`}
        subtitle={`Estado: ${factura.estado}`}
        actions={
          <button onClick={() => router.push("/facturacion")} className="text-sm text-slate-600 hover:text-slate-900">
            ← Volver
          </button>
        }
      />

      {error && (
        <AlertBanner variant="danger" title="Error">
          {error}
        </AlertBanner>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Datos del Paciente</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Nombre:</span> {factura.paciente_nombre} {factura.paciente_apellido}</p>
              <p><span className="text-slate-500">CI:</span> {factura.paciente_ci}</p>
              <p><span className="text-slate-500">Telefono:</span> {factura.paciente_telefono || "N/A"}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Datos de la Factura</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Fecha emision:</span> {new Date(factura.fecha_emision).toLocaleString("es-VE")}</p>
              <p><span className="text-slate-500">Facturador:</span> {factura.facturador_username}</p>
              <p>
                <span className="text-slate-500">Estado:</span>{" "}
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(factura.estado)}`}>
                  {factura.estado}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Servicios Facturados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Servicio</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Cantidad</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Precio Unit.</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {factura.detalles.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="py-2 px-3">{d.descripcion}</td>
                  <td className="py-2 px-3 text-right">{d.cantidad}</td>
                  <td className="py-2 px-3 text-right">{formatMoney(d.precio_unitario)}</td>
                  <td className="py-2 px-3 text-right">{formatMoney(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Resumen de Totales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-medium">{formatMoney(factura.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Impuesto:</span>
              <span className="font-medium">{formatMoney(factura.impuesto)}</span>
            </div>
            {isFacturador && (factura.estado === "BORRADOR" || factura.estado === "CONFIRMADA") ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Descuento:</span>
                  <input
                    type="number"
                    value={descuento}
                    onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                    className="border border-slate-300 rounded px-2 py-1 text-sm w-28 text-right"
                    min={0}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Cobertura seguro:</span>
                  <input
                    type="number"
                    value={cobertura}
                    onChange={(e) => setCobertura(parseFloat(e.target.value) || 0)}
                    className="border border-slate-300 rounded px-2 py-1 text-sm w-28 text-right"
                    min={0}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Descuento:</span>
                  <span className="font-medium">{formatMoney(factura.descuento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cobertura seguro:</span>
                  <span className="font-medium">{formatMoney(factura.cobertura_seguro)}</span>
                </div>
              </>
            )}
            <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold">
              <span className="text-slate-900">Total:</span>
              <span className="text-teal-700">{formatMoney(factura.total)}</span>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center gap-3">
            {isFacturador && factura.estado === "BORRADOR" && (
              <button
                onClick={handleConfirmar}
                disabled={procesando}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 w-full max-w-xs"
              >
                {procesando ? "Procesando..." : "Confirmar Factura"}
              </button>
            )}
            {isFacturador && factura.estado === "CONFIRMADA" && (
              <button
                onClick={handlePagar}
                disabled={procesando}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 w-full max-w-xs"
              >
                {procesando ? "Procesando..." : "Marcar como Pagada"}
              </button>
            )}
            {isFacturador && ["CONFIRMADA", "PENDIENTE", "PAGADA"].includes(factura.estado) && (
              <button
                onClick={handleAnular}
                disabled={procesando}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 w-full max-w-xs"
              >
                {procesando ? "Procesando..." : "Anular Factura"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
