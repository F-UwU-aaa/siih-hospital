"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BadgeEstado, PageHeader } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Cita {
  id: number;
  paciente_id: number;
  medico_id: number;
  fecha: string;
  hora: string;
  estado: string;
  tipo: string;
  prioridad: string;
  motivo: string | null;
  paciente_ci: string;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_telefono: string | null;
  paciente_email: string | null;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  medico_telefono: string | null;
  creado_por_username: string | null;
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADA: "bg-blue-100 text-blue-800",
  EN_ESPERA: "bg-orange-100 text-orange-800",
  COMPLETADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export default function CitaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showReprogramar, setShowReprogramar] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [reprogramando, setReprogramando] = useState(false);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/citas/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No encontrada");
        return r.json();
      })
      .then(setCita)
      .catch(() => setError("Cita no encontrada"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!nuevaFecha || !cita) return;
    fetch(`/api/citas/disponibilidad?medico_id=${cita.medico_id}&fecha=${nuevaFecha}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots_disponibles || []))
      .catch(() => setSlots([]));
  }, [nuevaFecha, cita]);

  const actualizarEstado = async (nuevoEstado: string) => {
    if (!confirm(`¿Cambiar estado a ${nuevoEstado}?`)) return;
    try {
      const res = await fetch(`/api/citas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        const data = await res.json();
        setCita(data.cita);
      } else {
        const data = await res.json();
        setError(data.error || "Error al actualizar");
      }
    } catch {
      setError("Error al actualizar");
    }
  };

  const reprogramar = async () => {
    if (!nuevaFecha || !nuevaHora || !cita) return;
    setReprogramando(true);
    setError("");
    try {
      const res = await fetch("/api/citas/reprogramar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cita_id: cita.id,
          nueva_fecha: nuevaFecha,
          nueva_hora: nuevaHora,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCita(data.cita_nueva);
        setShowReprogramar(false);
        setNuevaFecha("");
        setNuevaHora("");
      } else {
        setError(data.error || "Error al reprogramar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setReprogramando(false);
    }
  };

  if (loading) return <div className="p-8 bg-bg-page">Cargando...</div>;
  if (error && !cita) {
    return (
      <div className="p-8 bg-bg-page">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link href="/citas" className="text-blue-600 hover:underline mt-4 block">
          ← Volver a Citas
        </Link>
      </div>
    );
  }

  if (!cita) return null;

  const esPaciente = sesion?.usuario.rol_nombre === "PACIENTE";
  const esSoloLectura = ["MEDICO", "DIRECTOR"].includes(sesion?.usuario.rol_nombre || "");
  const puedeGestionar = ["ADMISIONISTA", "ADMIN"].includes(sesion?.usuario.rol_nombre || "");

  const citaActiva = cita.estado !== "CANCELADA" && cita.estado !== "COMPLETADA";
  const puedeCancelar = !esSoloLectura && citaActiva;
  const puedeReprogramar = !esSoloLectura && ["PENDIENTE", "CONFIRMADA"].includes(cita.estado);

  return (
    <div className="p-8 max-w-2xl bg-bg-page">
      <Link href="/citas" className="text-blue-600 hover:underline mb-4 block">
        ← Volver a Citas
      </Link>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div>
          <PageHeader title={`Cita #${cita.id}`} subtitle={`${cita.tipo} | Prioridad: ${cita.prioridad}`} />
          <BadgeEstado estado={cita.estado} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Paciente</h2>
          <p>
            {cita.paciente_nombre || cita.paciente_apellido
              ? `${cita.paciente_nombre ?? ""} ${cita.paciente_apellido ?? ""}`.trim()
              : "No registrado"}
          </p>
          <p className="text-sm text-gray-500">CI: {cita.paciente_ci || "No registrado"}</p>
          <p className="text-sm text-gray-500">Tel: {cita.paciente_telefono || "No registrado"}</p>
          <p className="text-sm text-gray-500">Email: {cita.paciente_email || "No registrado"}</p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Médico</h2>
          <p>
            Dr(a). {cita.medico_nombre || cita.medico_apellido
              ? `${cita.medico_nombre ?? ""} ${cita.medico_apellido ?? ""}`.trim()
              : "No asignado"}
          </p>
          <p className="text-sm text-gray-500">{cita.especialidad || "No asignada"}</p>
          <p className="text-sm text-gray-500">Tel: {cita.medico_telefono || "No registrado"}</p>
        </div>
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">Detalles de la Cita</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Fecha:</strong> {cita.fecha}
          </div>
          <div>
            <strong>Hora:</strong> {cita.hora}
          </div>
          <div>
            <strong>Creado por:</strong> {cita.creado_por_username || "N/A"}
          </div>
        </div>
        {cita.motivo && (
          <div className="mt-3">
            <strong>Motivo:</strong>
            <p className="text-sm text-gray-600 mt-1">{cita.motivo}</p>
          </div>
        )}
      </div>

      {(puedeCancelar || puedeReprogramar) && (
        <div className="flex gap-3 mb-6">
          {puedeReprogramar && (
            <button
              onClick={() => setShowReprogramar(!showReprogramar)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reprogramar
            </button>
          )}
          {puedeCancelar && (
            <button
              onClick={() => actualizarEstado("CANCELADA")}
              className="border border-red-600 text-red-600 px-4 py-2 rounded hover:bg-red-50"
            >
              Cancelar Cita
            </button>
          )}
        </div>
      )}

      {puedeGestionar && !esPaciente && citaActiva && cita.estado === "PENDIENTE" && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => actualizarEstado("EN_ESPERA")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Confirmar Llegada
          </button>
        </div>
      )}

      {showReprogramar && (
        <div className="border rounded p-4 mb-6 border-blue-400 bg-blue-50">
          <h3 className="font-semibold mb-3">Reprogramar Cita</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Nueva Fecha</label>
            <input
              type="date"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="border rounded px-3 py-2"
            />
          </div>
          {nuevaFecha && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Horarios disponibles ({nuevaFecha})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNuevaHora(s)}
                    className={`p-2 border rounded text-sm ${
                      nuevaHora === s
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {slots.length === 0 && (
                  <p className="text-gray-500 col-span-4 text-sm">
                    No hay horarios disponibles
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={reprogramar}
              disabled={!nuevaFecha || !nuevaHora || reprogramando}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {reprogramando ? "Reprogramando..." : "Confirmar Reprogramación"}
            </button>
            <button
              onClick={() => {
                setShowReprogramar(false);
                setNuevaFecha("");
                setNuevaHora("");
              }}
              className="border px-4 py-2 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
