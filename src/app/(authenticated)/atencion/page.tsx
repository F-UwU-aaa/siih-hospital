"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeEstado, PageHeader, Button } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
  permisos: { modulo: string; accion: string }[];
}

interface CitaDelDia {
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
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADA: "bg-blue-100 text-blue-800",
  EN_ESPERA: "bg-orange-100 text-orange-800",
  COMPLETADA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

export default function AtencionPage() {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [citas, setCitas] = useState<CitaDelDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Emergencia
  const [showEmergencia, setShowEmergencia] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pacientesEncontrados, setPacientesEncontrados] = useState<
    { id: number; ci: string; nombre: string; apellido: string }[]
  >([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<{
    id: number;
    ci: string;
    nombre: string;
    apellido: string;
  } | null>(null);
  const [nuevoPaciente, setNuevoPaciente] = useState({
    ci: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
  });
  const [modoPaciente, setModoPaciente] = useState<"buscar" | "nuevo" | "desconocido">("buscar");
  const [creandoEmergencia, setCreandoEmergencia] = useState(false);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sesion) return;
    const today = new Date().toISOString().split("T")[0];
    fetch(`/api/citas?fecha=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filtrar solo las que se pueden atender
          const atendibles = data.filter(
            (c: CitaDelDia) =>
              c.estado === "EN_ESPERA" || c.estado === "CONFIRMADA" || c.estado === "PENDIENTE"
          );
          setCitas(atendibles);
        }
      })
      .catch(() => setError("Error al cargar citas"))
      .finally(() => setLoading(false));
  }, [sesion]);

  const buscarPacientes = async () => {
    if (!busqueda.trim()) return;
    const res = await fetch(`/api/pacientes?busqueda=${encodeURIComponent(busqueda)}`);
    if (res.ok) {
      const data = await res.json();
      setPacientesEncontrados(data);
    }
  };

  const crearEmergencia = async () => {
    setCreandoEmergencia(true);
    setError("");
    try {
      let body: Record<string, unknown> = { emergencia: true };

      if (modoPaciente === "buscar" && pacienteSeleccionado) {
        body.paciente_id = pacienteSeleccionado.id;
      } else if (modoPaciente === "nuevo" && nuevoPaciente.ci) {
        body.paciente_ci = nuevoPaciente.ci;
        body.paciente_nombre = nuevoPaciente.nombre;
        body.paciente_apellido = nuevoPaciente.apellido;
        body.paciente_fecha_nacimiento = nuevoPaciente.fecha_nacimiento || undefined;
      } else if (modoPaciente === "desconocido") {
        // No enviar nada de paciente — se crea temporal
      } else {
        setError("Seleccione o registre un paciente");
        setCreandoEmergencia(false);
        return;
      }

      const res = await fetch("/api/atencion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear emergencia");
        setCreandoEmergencia(false);
        return;
      }

      router.push(`/atencion/${data.atencion.id}`);
    } catch {
      setError("Error de conexión");
      setCreandoEmergencia(false);
    }
  };

  const iniciarAtencion = async (citaId: number) => {
    try {
      const res = await fetch("/api/atencion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cita_id: citaId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar atención");
        return;
      }
      router.push(`/atencion/${data.atencion.id}`);
    } catch {
      setError("Error al iniciar atención");
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  const esMedico = sesion?.usuario.rol_nombre === "MEDICO";
  const esAdmisionista = sesion?.usuario.rol_nombre === "ADMISIONISTA";
  const esAdmin = sesion?.usuario.rol_nombre === "ADMIN";
  const puedeCrearEmergencia = esMedico || esAdmisionista || esAdmin;
  const puedeGestionarCitas = sesion?.permisos.some(p => p.modulo === "CITAS" && p.accion === "WRITE") ?? false;

  return (
    <div className="p-8 max-w-4xl bg-bg-page">
      <PageHeader
        title="Atención Médica"
        actions={
          puedeCrearEmergencia && (
            <Button variant="danger" onClick={() => setShowEmergencia(!showEmergencia)}>
              Nueva Emergencia
            </Button>
          )
        }
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulario de emergencia */}
      {showEmergencia && (
        <div className="border-2 border-red-400 rounded p-4 mb-6 bg-red-50">
          <h2 className="font-semibold text-red-800 mb-3">Nueva Emergencia</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setModoPaciente("buscar")}
              className={`px-3 py-1 rounded text-sm ${
                modoPaciente === "buscar" ? "bg-red-600 text-white" : "bg-white border"
              }`}
            >
              Buscar Existente
            </button>
            <button
              onClick={() => setModoPaciente("nuevo")}
              className={`px-3 py-1 rounded text-sm ${
                modoPaciente === "nuevo" ? "bg-red-600 text-white" : "bg-white border"
              }`}
            >
              Registrar Nuevo
            </button>
            <button
              onClick={() => setModoPaciente("desconocido")}
              className={`px-3 py-1 rounded text-sm ${
                modoPaciente === "desconocido" ? "bg-red-600 text-white" : "bg-white border"
              }`}
            >
              Paciente Desconocido
            </button>
          </div>

          {modoPaciente === "buscar" && (
            <div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="CI o nombre del paciente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarPacientes()}
                  className="border rounded px-3 py-2 flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={buscarPacientes}
                >
                  Buscar
                </Button>
              </div>
              {pacientesEncontrados.length > 0 && (
                <div className="border rounded max-h-40 overflow-y-auto bg-white">
                  {pacientesEncontrados.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setPacienteSeleccionado(p)}
                      className={`p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 ${
                        pacienteSeleccionado?.id === p.id ? "bg-blue-100" : ""
                      }`}
                    >
                      {p.ci} — {p.nombre} {p.apellido}
                    </div>
                  ))}
                </div>
              )}
              {pacienteSeleccionado && (
                <p className="text-sm text-green-700 mt-2">
                  Seleccionado: {pacienteSeleccionado.ci} — {pacienteSeleccionado.nombre}{" "}
                  {pacienteSeleccionado.apellido}
                </p>
              )}
            </div>
          )}

          {modoPaciente === "nuevo" && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="CI *"
                value={nuevoPaciente.ci}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, ci: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Nombre *"
                value={nuevoPaciente.nombre}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, nombre: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Apellido *"
                value={nuevoPaciente.apellido}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, apellido: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                placeholder="Fecha nacimiento"
                value={nuevoPaciente.fecha_nacimiento}
                onChange={(e) =>
                  setNuevoPaciente({ ...nuevoPaciente, fecha_nacimiento: e.target.value })
                }
                className="border rounded px-3 py-2"
              />
            </div>
          )}

          {modoPaciente === "desconocido" && (
            <p className="text-sm text-gray-600 bg-white p-2 rounded border">
              Se creará un paciente temporal con identificación genérica. Podrá actualizarse
              posteriormente.
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              variant="danger"
              onClick={crearEmergencia}
              disabled={creandoEmergencia}
            >
              {creandoEmergencia ? "Creando..." : "Crear Emergencia"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEmergencia(false);
                setBusqueda("");
                setPacientesEncontrados([]);
                setPacienteSeleccionado(null);
                setNuevoPaciente({ ci: "", nombre: "", apellido: "", fecha_nacimiento: "" });
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de citas del día */}
      <div className="border rounded">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h2 className="font-semibold">
            Citas de hoy — {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </h2>
        </div>
        {citas.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            No hay citas pendientes para hoy
          </div>
        ) : (
          <div className="divide-y">
            {citas.map((cita) => (
              <div key={cita.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BadgeEstado estado={cita.estado} />
                    <span className="text-xs text-gray-500">
                      {cita.hora} — {cita.tipo} — Prioridad: {cita.prioridad}
                    </span>
                  </div>
                  <div className="font-medium">
                    {cita.paciente_nombre} {cita.paciente_apellido}
                    <span className="text-sm text-gray-500 ml-2">CI: {cita.paciente_ci}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Dr(a). {cita.medico_nombre} {cita.medico_apellido} — {cita.especialidad}
                  </div>
                  {cita.motivo && (
                    <div className="text-sm text-gray-500 mt-1">Motivo: {cita.motivo}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  {cita.estado === "EN_ESPERA" && (
                    <Button
                      variant="primary"
                      onClick={() => iniciarAtencion(cita.id)}
                    >
                      Abrir Atención
                    </Button>
                  )}
                  {cita.estado === "CONFIRMADA" && puedeGestionarCitas && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await fetch(`/api/citas/${cita.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ estado: "EN_ESPERA" }),
                        });
                        setCitas((prev) =>
                          prev.map((c) =>
                            c.id === cita.id ? { ...c, estado: "EN_ESPERA" } : c
                          )
                        );
                      }}
                    >
                      Confirmar Llegada
                    </Button>
                  )}
                  <Link
                    href={`/citas/${cita.id}`}
                    className="border px-3 py-1 rounded text-sm hover:bg-gray-50"
                  >
                    Ver Cita
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
