"use client";

import { useState, useEffect } from "react";
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
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  creado_por_username: string | null;
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADA: "bg-blue-100 text-blue-800",
  EN_ESPERA: "bg-orange-100 text-orange-800",
  COMPLETADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export default function CitasPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [filtroEstado, filtroFecha, sesion]);

  const cargarCitas = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (busqueda) params.set("busqueda", busqueda);
    if (filtroEstado) params.set("estado", filtroEstado);
    if (filtroFecha) params.set("fecha", filtroFecha);

    try {
      const res = await fetch(`/api/citas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCitas(data);
      }
    } catch {
      console.error("Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarCitas();
  };

  const cancelarCita = async (id: number) => {
    if (!confirm("¿Está seguro de cancelar esta cita?")) return;
    try {
      const res = await fetch(`/api/citas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CANCELADA" }),
      });
      if (res.ok) {
        cargarCitas();
      }
    } catch {
      console.error("Error al cancelar cita");
    }
  };

  const esPaciente = sesion?.usuario.rol_nombre === "PACIENTE";
  const esSoloLectura = ["MEDICO", "DIRECTOR"].includes(sesion?.usuario.rol_nombre || "");
  const puedeAgendar = ["ADMISIONISTA", "ADMIN", "PACIENTE"].includes(sesion?.usuario.rol_nombre || "");

  const titulo = esPaciente ? "Mis Citas" : "Gestión de Citas";

  return (
    <div className="p-8 max-w-6xl bg-bg-page">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title={titulo} />
        {puedeAgendar && (
          <Link
            href="/citas/nueva"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {esPaciente ? "+ Agendar Cita" : "+ Nueva Cita"}
          </Link>
        )}
      </div>

      {!esPaciente && (
        <form onSubmit={handleBuscar} className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por paciente o médico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="EN_ESPERA">En Espera</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Buscar
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : citas.length === 0 ? (
        <p className="text-gray-500">
          {esPaciente ? "No tiene citas registradas" : "No hay citas registradas"}
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">ID</th>
              {!esPaciente && (
                <th className="border p-2 text-left">Paciente</th>
              )}
              <th className="border p-2 text-left">Médico</th>
              <th className="border p-2 text-left">Especialidad</th>
              <th className="border p-2 text-left">Fecha</th>
              <th className="border p-2 text-left">Hora</th>
              <th className="border p-2 text-left">Tipo</th>
              <th className="border p-2 text-left">Estado</th>
              <th className="border p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita) => (
              <tr key={cita.id} className="hover:bg-gray-50">
                <td className="border p-2">{cita.id}</td>
                {!esPaciente && (
                  <td className="border p-2">
                    {cita.paciente_nombre} {cita.paciente_apellido}
                    <br />
                    <span className="text-xs text-gray-500">{cita.paciente_ci}</span>
                  </td>
                )}
                <td className="border p-2">
                  Dr(a). {cita.medico_nombre} {cita.medico_apellido}
                </td>
                <td className="border p-2">{cita.especialidad}</td>
                <td className="border p-2">{cita.fecha}</td>
                <td className="border p-2">{cita.hora}</td>
                <td className="border p-2">
                  <span className="text-xs">{cita.tipo}</span>
                </td>
                <td className="border p-2">
                  <BadgeEstado estado={cita.estado} />
                </td>
                <td className="border p-2">
                  <Link
                    href={`/citas/${cita.id}`}
                    className="text-blue-600 hover:underline text-sm mr-2"
                  >
                    Ver
                  </Link>
                  {!esSoloLectura &&
                    cita.estado !== "CANCELADA" &&
                    cita.estado !== "COMPLETADA" && (
                      <button
                        onClick={() => cancelarCita(cita.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Cancelar
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
