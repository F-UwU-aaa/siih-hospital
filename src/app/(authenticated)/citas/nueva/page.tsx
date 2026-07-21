"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BadgeEstado, PageHeader } from "@/components/ui";

interface Paciente {
  id: number;
  ci: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string;
  sexo?: string | null;
  telefono?: string | null;
  email?: string | null;
  seguro_medico?: string | null;
  direccion?: string | null;
}

interface Medico {
  id: number;
  ci: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  horario_atencion: string | null;
}

export default function NuevaCitaPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [step, setStep] = useState(1);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsOcupados, setSlotsOcupados] = useState<string[]>([]);

  const [pacienteBusqueda, setPacienteBusqueda] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);

  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  const [medicoSeleccionado, setMedicoSeleccionado] = useState<Medico | null>(null);

  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  const [tipo, setTipo] = useState("NORMAL");
  const [prioridad, setPrioridad] = useState("NORMAL");
  const [motivo, setMotivo] = useState("");

  const [modoForm, setModoForm] = useState<"buscar" | "nuevo">("buscar");
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [creandoPaciente, setCreandoPaciente] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
    ci: "", nombre: "", apellido: "", fecha_nacimiento: "",
    sexo: "", telefono: "", email: "", seguro_medico: "", direccion: "",
  });

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.usuario?.id) { router.push("/login"); return; }
        if (data.usuario.rol_nombre === "PACIENTE") { router.push("/citas"); return; }
      })
      .catch(() => router.push("/login"));
    fetch("/api/especialidades")
      .then((r) => r.json())
      .then(setEspecialidades)
      .catch(() => {});
  }, []);

  const buscarPacientes = async () => {
    if (!pacienteBusqueda.trim()) return;
    setBusquedaRealizada(true);
    const res = await fetch(`/api/pacientes?busqueda=${pacienteBusqueda}`);
    if (res.ok) {
      const data = await res.json();
      setPacientes(data);
    }
  };

  const setForm = (campo: string, valor: string) => {
    setFormNuevo((prev) => ({ ...prev, [campo]: valor }));
  };

  const crearPacienteInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm("");
    try {
      setCreandoPaciente(true);
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formNuevo),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setErrorForm(`CI duplicada. Ya existe un paciente con CI ${formNuevo.ci}`);
        } else {
          setErrorForm(data.error || "Error al registrar paciente");
        }
        return;
      }
      const nuevoPaciente: Paciente = data.paciente;
      setPacienteSeleccionado(nuevoPaciente);
      setStep(2);
      setPacienteBusqueda(`${nuevoPaciente.ci} - ${nuevoPaciente.nombre} ${nuevoPaciente.apellido}`);
      setModoForm("buscar");
    } catch {
      setErrorForm("Error de conexión");
    } finally {
      setCreandoPaciente(false);
    }
  };

  const seleccionarPaciente = (p: Paciente) => {
    setPacienteSeleccionado(p);
    setStep(2);
    setPacienteBusqueda(`${p.ci} - ${p.nombre} ${p.apellido}`);
  };

  const seleccionarEspecialidad = async (esp: string) => {
    setEspecialidadSeleccionada(esp);
    setMedicoSeleccionado(null);
    const res = await fetch(`/api/medicos?especialidad=${encodeURIComponent(esp)}`);
    if (res.ok) {
      const data = await res.json();
      setMedicos(data);
    }
    setStep(3);
  };

  const seleccionarMedico = (m: Medico) => {
    setMedicoSeleccionado(m);
    setStep(4);
  };

  useEffect(() => {
    if (!fechaSeleccionada || !medicoSeleccionado) return;
    fetch(
      `/api/citas/disponibilidad?medico_id=${medicoSeleccionado.id}&fecha=${fechaSeleccionada}`
    )
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots_disponibles || []);
        setSlotsOcupados(data.slots_ocupados || []);
      })
      .catch(() => {});
  }, [fechaSeleccionada, medicoSeleccionado]);

  const seleccionarHora = (hora: string) => {
    setHoraSeleccionada(hora);
    setStep(5);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (!pacienteSeleccionado || !medicoSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      setError("Faltan datos por completar");
      return;
    }

    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: pacienteSeleccionado.id,
          medico_id: medicoSeleccionado.id,
          fecha: fechaSeleccionada,
          hora: horaSeleccionada,
          tipo,
          prioridad,
          motivo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear cita");
        return;
      }

      setExito(`Cita #${data.cita.id} creada exitosamente`);
      setTimeout(() => router.push(`/citas/${data.cita.id}`), 1500);
    } catch {
      setError("Error de conexión");
    }
  };

  return (
    <div className="p-8 max-w-2xl bg-bg-page">
      <PageHeader title="Programar Nueva Cita" />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {exito && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {exito}
        </div>
      )}

      {/* Step 1: Buscar paciente */}
      <div className={`border rounded p-4 mb-4 ${step >= 1 ? "border-blue-400" : "border-gray-200"}`}>
        <h2 className="font-semibold mb-2">
          1. Seleccionar Paciente
          {pacienteSeleccionado && (
            <span className="text-green-600 ml-2">
              ✓ {pacienteSeleccionado.ci} - {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
            </span>
          )}
        </h2>
        {step === 1 && (
          <div>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setModoForm("buscar"); setErrorForm(""); }}
                className={`px-3 py-1.5 rounded text-sm font-medium ${modoForm === "buscar" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Paciente existente
              </button>
              <button
                type="button"
                onClick={() => { setModoForm("nuevo"); setErrorForm(""); }}
                className={`px-3 py-1.5 rounded text-sm font-medium ${modoForm === "nuevo" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Paciente nuevo
              </button>
            </div>

            {modoForm === "buscar" && (
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Buscar por CI o nombre..."
                    value={pacienteBusqueda}
                    onChange={(e) => setPacienteBusqueda(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscarPacientes()}
                    className="border rounded px-3 py-2 flex-1"
                  />
                  <button
                    type="button"
                    onClick={buscarPacientes}
                    className="bg-gray-200 px-3 py-2 rounded"
                  >
                    Buscar
                  </button>
                </div>
                {pacientes.length > 0 && (
                  <div className="border rounded max-h-48 overflow-y-auto">
                    {pacientes.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => seleccionarPaciente(p)}
                        className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                      >
                        {p.ci} - {p.nombre} {p.apellido}
                      </div>
                    ))}
                  </div>
                )}
                {busquedaRealizada && pacientes.length === 0 && (
                  <p className="text-sm text-gray-500 mb-2">
                    No se encontró ningún paciente con esos datos.{" "}
                    <button type="button" onClick={() => setModoForm("nuevo")} className="text-blue-600 hover:underline font-medium">
                      Registrar paciente nuevo
                    </button>
                  </p>
                )}
              </div>
            )}

            {modoForm === "nuevo" && (
              <form onSubmit={crearPacienteInline} className="space-y-3">
                {errorForm && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{errorForm}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">CI *</label>
                    <input type="text" required value={formNuevo.ci} onChange={(e) => setForm("ci", e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha Nacimiento *</label>
                    <input type="date" required value={formNuevo.fecha_nacimiento} onChange={(e) => setForm("fecha_nacimiento", e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                    <input type="text" required value={formNuevo.nombre} onChange={(e) => setForm("nombre", e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Apellido *</label>
                    <input type="text" required value={formNuevo.apellido} onChange={(e) => setForm("apellido", e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Sexo</label>
                    <select value={formNuevo.sexo} onChange={(e) => setForm("sexo", e.target.value)} className="w-full border rounded px-3 py-2">
                      <option value="">Seleccionar</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input type="text" value={formNuevo.telefono} onChange={(e) => setForm("telefono", e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Seguro Médico</label>
                    <input type="text" value={formNuevo.seguro_medico} onChange={(e) => setForm("seguro_medico", e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={formNuevo.email} onChange={(e) => setForm("email", e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dirección</label>
                  <input type="text" value={formNuevo.direccion} onChange={(e) => setForm("direccion", e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
                <button type="submit" disabled={creandoPaciente} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {creandoPaciente ? "Registrando..." : "Registrar Paciente"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Seleccionar especialidad */}
      <div className={`border rounded p-4 mb-4 ${step >= 2 ? "border-blue-400" : "border-gray-200"}`}>
        <h2 className="font-semibold mb-2">
          2. Seleccionar Especialidad
          {especialidadSeleccionada && (
            <span className="text-green-600 ml-2">✓ {especialidadSeleccionada}</span>
          )}
        </h2>
        {step === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {especialidades.map((esp) => (
              <button
                key={esp}
                type="button"
                onClick={() => seleccionarEspecialidad(esp)}
                className={`p-2 border rounded text-left hover:bg-blue-50 ${
                  especialidadSeleccionada === esp ? "bg-blue-100 border-blue-400" : ""
                }`}
              >
                {esp}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Seleccionar médico */}
      <div className={`border rounded p-4 mb-4 ${step >= 3 ? "border-blue-400" : "border-gray-200"}`}>
        <h2 className="font-semibold mb-2">
          3. Seleccionar Médico
          {medicoSeleccionado && (
            <span className="text-green-600 ml-2">
              ✓ Dr(a). {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}
            </span>
          )}
        </h2>
        {step === 3 && (
          <div className="grid grid-cols-1 gap-2">
            {medicos.map((m) => (
              <div
                key={m.id}
                onClick={() => seleccionarMedico(m)}
                className="p-3 border rounded hover:bg-blue-50 cursor-pointer"
              >
                <div className="font-medium">
                  Dr(a). {m.nombre} {m.apellido}
                </div>
                <div className="text-sm text-gray-500">
                  {m.especialidad} | CI: {m.ci}
                </div>
              </div>
            ))}
            {medicos.length === 0 && (
              <p className="text-gray-500">No hay médicos disponibles para esta especialidad</p>
            )}
          </div>
        )}
      </div>

      {/* Step 4: Seleccionar fecha y hora */}
      <div className={`border rounded p-4 mb-4 ${step >= 4 ? "border-blue-400" : "border-gray-200"}`}>
        <h2 className="font-semibold mb-2">
          4. Seleccionar Fecha y Hora
          {horaSeleccionada && (
            <span className="text-green-600 ml-2">
              ✓ {fechaSeleccionada} {horaSeleccionada}
            </span>
          )}
        </h2>
        {step >= 4 && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border rounded px-3 py-2"
              />
            </div>

            {fechaSeleccionada && (
              <div>
                <label className="block text-sm font-medium mb-1">Horarios disponibles</label>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => seleccionarHora(s)}
                      className={`p-2 border rounded text-sm ${
                        horaSeleccionada === s
                          ? "bg-blue-600 text-white"
                          : "hover:bg-blue-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  {slots.length === 0 && fechaSeleccionada && (
                    <p className="text-gray-500 col-span-4">
                      No hay horarios disponibles para esta fecha
                    </p>
                  )}
                </div>
                {slotsOcupados.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Horarios ocupados: </span>
                    {slotsOcupados.map((s) => (
                      <span key={s} className="text-xs text-red-500 mr-2 line-through">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 5: Confirmar */}
      {step === 5 && (
        <form onSubmit={enviar} className="border rounded p-4 mb-4 border-blue-400">
          <h2 className="font-semibold mb-4">5. Confirmar Cita</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="NORMAL">Normal</option>
                <option value="EMERGENCIA">Emergencia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
            <div>
              <strong>Paciente:</strong> {pacienteSeleccionado?.ci} - {pacienteSeleccionado?.nombre}{" "}
              {pacienteSeleccionado?.apellido}
            </div>
            <div>
              <strong>Médico:</strong> Dr(a). {medicoSeleccionado?.nombre}{" "}
              {medicoSeleccionado?.apellido} ({medicoSeleccionado?.especialidad})
            </div>
            <div>
              <strong>Fecha/Hora:</strong> {fechaSeleccionada} {horaSeleccionada}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Crear Cita
          </button>
        </form>
      )}
    </div>
  );
}
