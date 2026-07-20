"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BadgeEstado, PageHeader, Button } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Proveedor {
  id: number;
  nombre: string;
  ruc: string | null;
  telefono: string | null;
  email: string | null;
}

interface Medicamento {
  id: number;
  nombre: string;
  presentacion: string | null;
  concentracion: string | null;
}

interface CompraItem {
  medicamento_id: number;
  cantidad: number;
  precio_unitario: number;
}

interface Compra {
  id: number;
  proveedor_id: number;
  proveedor_nombre: string;
  fecha_compra: string;
  total: string;
  estado: string;
  gestionado_por_username: string | null;
}

interface CompraDetalle {
  compra: Compra & { proveedor_ruc: string | null; proveedor_telefono: string | null };
  items: { id: number; medicamento_id: number; medicamento_nombre: string; cantidad: number; precio_unitario: string }[];
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  RECIBIDA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export default function ComprasPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNueva, setShowNueva] = useState(false);
  const [error, setError] = useState("");

  // Nueva compra
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [proveedorId, setProveedorId] = useState<number | "">("");
  const [items, setItems] = useState<CompraItem[]>([]);
  const [creando, setCreando] = useState(false);

  // Recibir
  const [showRecibir, setShowRecibir] = useState<number | null>(null);
  const [detalleCompra, setDetalleCompra] = useState<CompraDetalle | null>(null);
  const [lotesInfo, setLotesInfo] = useState<Record<number, { lote: string; fecha_vencimiento: string }>>({});
  const [recibiendo, setRecibiendo] = useState(false);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/compras")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCompras(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const abrirNueva = async () => {
    setShowNueva(true);
    setError("");
    const [provRes, medRes] = await Promise.all([
      fetch("/api/farmacia/proveedores"),
      fetch("/api/farmacia/medicamentos"),
    ]);
    if (provRes.ok) {
      const data = await provRes.json();
      if (Array.isArray(data)) setProveedores(data);
    }
    if (medRes.ok) {
      const data = await medRes.json();
      if (Array.isArray(data)) setMedicamentos(data);
    }
  };

  const agregarItem = () => {
    setItems([...items, { medicamento_id: 0, cantidad: 1, precio_unitario: 0 }]);
  };

  const actualizarItem = (idx: number, campo: keyof CompraItem, valor: string | number) => {
    const nuevos = [...items];
    if (campo === "medicamento_id") nuevos[idx].medicamento_id = Number(valor);
    else if (campo === "cantidad") nuevos[idx].cantidad = Number(valor);
    else nuevos[idx].precio_unitario = Number(valor);
    setItems(nuevos);
  };

  const eliminarItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const crearCompra = async () => {
    if (!proveedorId || items.length === 0) {
      setError("Seleccione proveedor y al menos 1 item");
      return;
    }
    setCreando(true);
    setError("");
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proveedor_id: proveedorId, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear compra");
        return;
      }
      setShowNueva(false);
      setProveedorId("");
      setItems([]);
      // Refresh list
      const listRes = await fetch("/api/compras");
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData)) setCompras(listData);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCreando(false);
    }
  };

  const abrirRecibir = async (compraId: number) => {
    setShowRecibir(compraId);
    setError("");
    const res = await fetch(`/api/compras/${compraId}`);
    if (res.ok) {
      const data: CompraDetalle = await res.json();
      setDetalleCompra(data);
      // Default lote info
      const lotes: Record<number, { lote: string; fecha_vencimiento: string }> = {};
      for (const item of data.items) {
        lotes[item.id] = {
          lote: `LOTE-${compraId}-${item.id}`,
          fecha_vencimiento: (() => {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            return d.toISOString().split("T")[0];
          })(),
        };
      }
      setLotesInfo(lotes);
    }
  };

  const confirmarRecibir = async () => {
    if (!showRecibir) return;
    setRecibiendo(true);
    setError("");
    try {
      const res = await fetch(`/api/compras/${showRecibir}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "RECIBIDA", lotes: lotesInfo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al recibir");
        return;
      }
      setShowRecibir(null);
      setDetalleCompra(null);
      // Refresh
      const listRes = await fetch("/api/compras");
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData)) setCompras(listData);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setRecibiendo(false);
    }
  };

  const total = items.reduce((sum, i) => sum + i.cantidad * i.precio_unitario, 0);

  if (loading) return <div className="bg-bg-page p-8">Cargando...</div>;

  return (
    <div className="bg-bg-page p-8 max-w-5xl">
      <PageHeader 
        title="Compras a Proveedores"
        actions={
          <Button onClick={abrirNueva} variant="primary">
            Nueva Compra
          </Button>
        }
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      {/* Nueva Compra form */}
      {showNueva && (
        <div className="bg-white border border-border-card rounded-lg shadow-sm p-4 mb-6">
          <h2 className="font-semibold mb-3">Nueva Compra</h2>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Proveedor</label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : "")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.ruc || "S/RUC"})</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Items</label>
              <Button onClick={agregarItem} variant="secondary" className="text-sm">+ Agregar item</Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <select
                  value={item.medicamento_id}
                  onChange={(e) => actualizarItem(idx, "medicamento_id", e.target.value)}
                  className="border rounded px-2 py-1 flex-1"
                >
                  <option value={0}>Seleccionar medicamento...</option>
                  {medicamentos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.presentacion} {m.concentracion})</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Cant."
                  value={item.cantidad || ""}
                  onChange={(e) => actualizarItem(idx, "cantidad", e.target.value)}
                  className="border rounded px-2 py-1 w-20"
                  min="1"
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={item.precio_unitario || ""}
                  onChange={(e) => actualizarItem(idx, "precio_unitario", e.target.value)}
                  className="border rounded px-2 py-1 w-24"
                  step="0.01"
                  min="0"
                />
                <Button onClick={() => eliminarItem(idx)} variant="danger" className="text-sm px-2">✕</Button>
              </div>
            ))}
            {items.length > 0 && (
              <div className="text-right font-medium mt-2">Total: ${total.toFixed(2)}</div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={crearCompra}
              disabled={creando || !proveedorId || items.length === 0}
              variant="primary"
            >
              {creando ? "Creando..." : "Crear Compra"}
            </Button>
            <Button
              onClick={() => { setShowNueva(false); setItems([]); setProveedorId(""); }}
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Recibir compra modal */}
      {showRecibir && detalleCompra && (
        <div className="bg-white border border-border-card rounded-lg shadow-sm p-4 mb-6">
          <h2 className="font-semibold mb-3">
            Recibir Compra #{detalleCompra.compra.id} — {detalleCompra.compra.proveedor_nombre}
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Total: ${parseFloat(detalleCompra.compra.total).toFixed(2)} — Confirme los datos de los lotes que ingresarán a inventario:
          </p>
          {detalleCompra.items.map((item) => {
            const lote = lotesInfo[item.id] || { lote: "", fecha_vencimiento: "" };
            return (
              <div key={item.id} className="flex gap-2 mb-2 items-center text-sm">
                <span className="flex-1 font-medium">{item.medicamento_nombre} × {item.cantidad}</span>
                <input
                  type="text"
                  placeholder="Lote"
                  value={lote.lote}
                  onChange={(e) => setLotesInfo({ ...lotesInfo, [item.id]: { ...lote, lote: e.target.value } })}
                  className="border rounded px-2 py-1 w-40"
                />
                <input
                  type="date"
                  value={lote.fecha_vencimiento}
                  onChange={(e) => setLotesInfo({ ...lotesInfo, [item.id]: { ...lote, fecha_vencimiento: e.target.value } })}
                  className="border rounded px-2 py-1"
                />
              </div>
            );
          })}
          <div className="flex gap-3 mt-3">
            <Button
              onClick={confirmarRecibir}
              disabled={recibiendo}
              variant="primary"
            >
              {recibiendo ? "Recibiendo..." : "Confirmar Recepción"}
            </Button>
            <Button
              onClick={() => { setShowRecibir(null); setDetalleCompra(null); }}
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de compras */}
      <div className="bg-white border border-border-card rounded-lg shadow-sm">
        {compras.length === 0 ? (
          <p className="p-4 text-gray-500 text-center">No hay compras registradas</p>
        ) : (
          <div className="divide-y">
            {compras.map((c) => (
              <div key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <div>
                    <span className="font-medium">Compra #{c.id}</span>
                    <span className="ml-2"><BadgeEstado estado={c.estado} /></span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {c.proveedor_nombre} — {new Date(c.fecha_compra).toLocaleDateString("es-ES")}
                  </div>
                  <div className="text-sm font-medium">${parseFloat(c.total).toFixed(2)}</div>
                </div>
                <div>
                  {c.estado === "PENDIENTE" && (
                    <Button
                      onClick={() => abrirRecibir(c.id)}
                      variant="primary"
                    >
                      Recibir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
