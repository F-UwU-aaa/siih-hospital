"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BadgeEstado, PageHeader, Button } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Alergia {
  sustancia: string;
  reaccion: string | null;
  severidad: string | null;
}

interface Antecedente {
  tipo: string;
  descripcion: string;
}

interface AtencionPrevia {
  fecha_atencion: string;
  motivo_consulta: string | null;
  diagnostico: string | null;
  tipo: string;
  medico_nombre: string;
}

interface SignosVitales {
  fecha_hora: string;
  temperatura: number | null;
  presion_sistolica: number | null;
  presion_diastolica: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_resp: number | null;
  saturacion_oxigeno: number | null;
  peso: number | null;
  talla: number | null;
}

interface Atencion {
  id: number;
  historial_id: number;
  medico_id: number;
  cita_id: number | null;
  fecha_atencion: string;
  motivo_consulta: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  tipo: string;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  paciente_id: number;
  paciente_ci: string;
  paciente_nombre: string;
  paciente_apellido: string;
  fecha_nacimiento: string;
  sexo: string | null;
  paciente_telefono: string | null;
  paciente_email: string | null;
  seguro_medico: string | null;
}

export default function AtencionDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [atencion, setAtencion] = useState<Atencion | null>(null);
  const [alergias, setAlergias] = useState<Alergia[]>([]);
  const [antecedentes, setAntecedentes] = useState<Antecedente[]>([]);
  const [atencionesPrevias, setAtencionesPrevias] = useState<AtencionPrevia[]>([]);
  const [signosVitales, setSignosVitales] = useState<SignosVitales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulario atención
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Formulario signos vitales
  const [showSignos, setShowSignos] = useState(false);
  const [signos, setSignos] = useState({
    temperatura: "",
    presion_sistolica: "",
    presion_diastolica: "",
    frecuencia_cardiaca: "",
    frecuencia_resp: "",
    saturacion_oxigeno: "",
    peso: "",
    talla: "",
  });
  const [guardandoSignos, setGuardandoSignos] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"historial" | "alergias" | "antecedentes" | "previas" | "signos">("historial");

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/atencion/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No encontrada");
        return r.json();
      })
      .then((data) => {
        setAtencion(data.atencion);
        setAlergias(data.alergias || []);
        setAntecedentes(data.antecedentes || []);
        setAtencionesPrevias(data.atenciones_previas || []);
        setSignosVitales(data.signos_vitales || []);
        setMotivoConsulta(data.atencion.motivo_consulta || "");
        setDiagnostico(data.atencion.diagnostico || "");
        setTratamiento(data.atencion.tratamiento || "");
        setObservaciones(data.atencion.observaciones || "");
      })
      .catch(() => setError("Atención no encontrada"))
      .finally(() => setLoading(false));
  }, [id]);

  const guardarAtencion = async (cerrar: boolean = false) => {
    setGuardando(true);
    setError("");
    try {
      const body: Record<string, unknown> = {};
      if (motivoConsulta) body.motivo_consulta = motivoConsulta;
      if (diagnostico) body.diagnostico = diagnostico;
      if (tratamiento) body.tratamiento = tratamiento;
      if (observaciones) body.observaciones = observaciones;
      if (cerrar) body.cerrar = true;

      const res = await fetch(`/api/atencion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      setAtencion(data.atencion);
      if (cerrar) {
        router.push("/atencion");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const guardarSignos = async () => {
    setGuardandoSignos(true);
    setError("");
    try {
      const body: Record<string, string> = {};
      for (const [key, val] of Object.entries(signos)) {
        if (val) body[key] = val;
      }

      const res = await fetch(`/api/atencion/${id}/signos-vitales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar signos vitales");
        return;
      }

      setShowSignos(false);
      setSignos({
        temperatura: "",
        presion_sistolica: "",
        presion_diastolica: "",
        frecuencia_cardiaca: "",
        frecuencia_resp: "",
        saturacion_oxigeno: "",
        peso: "",
        talla: "",
      });

      // Recargar datos
      const refreshRes = await fetch(`/api/atencion/${id}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setSignosVitales(refreshData.signos_vitales || []);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setGuardandoSignos(false);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error && !atencion) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link href="/atencion" className="text-blue-600 hover:underline mt-4 block">
          ← Volver a Atención
        </Link>
      </div>
    );
  }
  if (!atencion) return null;

  const esMedico = sesion?.usuario.rol_nombre === "MEDICO";
  const esEnfermera = sesion?.usuario.rol_nombre === "ENFERMERA";
  const esAdmisionista = sesion?.usuario.rol_nombre === "ADMISIONISTA";
  const esAdmin = sesion?.usuario.rol_nombre === "ADMIN";

  const calcularEdad = (fechaNac: string) => {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  return (
    <div className="p-8 max-w-5xl bg-bg-page">
      <Link href="/atencion" className="text-blue-600 hover:underline mb-4 block">
        ← Volver a Atención
      </Link>

      {/* ===== ALERTA DE ALERGIAS — RN-04: SIEMPRE VISIBLE, IMPOSIBLE DE IGNORAR ===== */}
      {alergias.length > 0 && (
        <div className="bg-red-700 text-white border-4 border-red-900 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <h2 className="text-xl font-bold">ALERTA DE ALERGIAS</h2>
            <svg className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alergias.map((a, i) => (
              <div
                key={i}
                className="bg-red-900 rounded p-3 border border-red-500"
              >
                <div className="font-bold text-yellow-300 text-lg">{a.sustancia}</div>
                {a.reaccion && (
                  <div className="text-sm">Reacción: {a.reaccion}</div>
                )}
                {a.severidad && (
                  <div className="text-sm font-semibold mt-1">
                    Severidad:{" "}
                    <span
                      className={
                        a.severidad === "CRITICA"
                          ? "text-yellow-300"
                          : a.severidad === "GRAVE"
                          ? "text-red-300"
                          : "text-red-200"
                      }
                    >
                      {a.severidad}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm mt-3 text-red-200 font-semibold">
            ⚠ Verifique alergias antes de prescribir medicamentos o procedimientos.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Header de la atención */}
      <PageHeader
        title={`Atención #${atencion.id} — ${atencion.tipo}`}
        subtitle={new Date(atencion.fecha_atencion).toLocaleString("es-ES")}
      />

      {/* Info paciente y médico */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Paciente</h2>
          <p className="font-medium">
            {atencion.paciente_nombre} {atencion.paciente_apellido}
          </p>
          <p className="text-sm text-gray-500">CI: {atencion.paciente_ci}</p>
          <p className="text-sm text-gray-500">
            Edad: {calcularEdad(atencion.fecha_nacimiento)} años
          </p>
          {atencion.seguro_medico && (
            <p className="text-sm text-gray-500">Seguro: {atencion.seguro_medico}</p>
          )}
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Médico</h2>
          <p className="font-medium">
            Dr(a). {atencion.medico_nombre} {atencion.medico_apellido}
          </p>
          <p className="text-sm text-gray-500">{atencion.especialidad}</p>
        </div>
      </div>

      {/* Tabs de información clínica */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab("historial")}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === "historial"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Datos Clínicos
        </button>
        <button
          onClick={() => setActiveTab("alergias")}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === "alergias"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Alergias ({alergias.length})
        </button>
        <button
          onClick={() => setActiveTab("antecedentes")}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === "antecedentes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Antecedentes ({antecedentes.length})
        </button>
        <button
          onClick={() => setActiveTab("previas")}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === "previas"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Atenciones Previas ({atencionesPrevias.length})
        </button>
        <button
          onClick={() => setActiveTab("signos")}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeTab === "signos"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Signos Vitales ({signosVitales.length})
        </button>
      </div>

      {/* Tab: Datos Clínicos (formulario de atención) */}
      {activeTab === "historial" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Motivo de Consulta</label>
            <textarea
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Describa el motivo de la consulta..."
              disabled={!esMedico}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Diagnóstico</label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Diagnóstico médico..."
              disabled={!esMedico}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tratamiento</label>
            <textarea
              value={tratamiento}
              onChange={(e) => setTratamiento(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Plan de tratamiento..."
              disabled={!esMedico}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Observaciones adicionales..."
              disabled={!esMedico}
            />
          </div>

          {esMedico && (
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => guardarAtencion(false)}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="primary"
                onClick={() => guardarAtencion(true)}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar y Cerrar Atención"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Alergias — siempre visible */}
      {activeTab === "alergias" && (
        <div>
          {alergias.length === 0 ? (
            <p className="text-gray-500">No hay alergias registradas</p>
          ) : (
            <div className="space-y-3">
              {alergias.map((a, i) => (
                <div
                  key={i}
                  className={`border rounded p-4 ${
                    a.severidad === "CRITICA" || a.severidad === "GRAVE"
                      ? "border-red-400 bg-red-50"
                      : ""
                  }`}
                >
                  <div className="font-semibold">{a.sustancia}</div>
                  {a.reaccion && <div className="text-sm">Reacción: {a.reaccion}</div>}
                  {a.severidad && (
                    <div className="text-sm font-medium">Severidad: {a.severidad}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Antecedentes */}
      {activeTab === "antecedentes" && (
        <div>
          {antecedentes.length === 0 ? (
            <p className="text-gray-500">No hay antecedentes registrados</p>
          ) : (
            <div className="space-y-3">
              {antecedentes.map((a, i) => (
                <div key={i} className="border rounded p-4">
                  <div className="font-semibold text-sm">{a.tipo}</div>
                  <p className="text-sm mt-1">{a.descripcion}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Atenciones Previas */}
      {activeTab === "previas" && (
        <div>
          {atencionesPrevias.length === 0 ? (
            <p className="text-gray-500">No hay atenciones previas</p>
          ) : (
            <div className="space-y-3">
              {atencionesPrevias.map((a, i) => (
                <div key={i} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-medium">{a.tipo}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(a.fecha_atencion).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">Dr(a). {a.medico_nombre}</span>
                  </div>
                  {a.motivo_consulta && (
                    <p className="text-sm mt-1">Motivo: {a.motivo_consulta}</p>
                  )}
                  {a.diagnostico && (
                    <p className="text-sm mt-1">Diagnóstico: {a.diagnostico}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Signos Vitales */}
      {activeTab === "signos" && (
        <div>
          {(esMedico || esEnfermera || esAdmin) && (
            <Button
              variant="primary"
              onClick={() => setShowSignos(!showSignos)}
              className="mb-4"
            >
              Registrar Signos Vitales
            </Button>
          )}

          {showSignos && (
            <div className="border rounded p-4 mb-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-3">Nuevos Signos Vitales</h3>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium">Temperatura (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={signos.temperatura}
                    onChange={(e) => setSignos({ ...signos, temperatura: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">PA Sistólica</label>
                  <input
                    type="number"
                    value={signos.presion_sistolica}
                    onChange={(e) => setSignos({ ...signos, presion_sistolica: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">PA Diastólica</label>
                  <input
                    type="number"
                    value={signos.presion_diastolica}
                    onChange={(e) => setSignos({ ...signos, presion_diastolica: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">FC (lpm)</label>
                  <input
                    type="number"
                    value={signos.frecuencia_cardiaca}
                    onChange={(e) => setSignos({ ...signos, frecuencia_cardiaca: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">FR (rpm)</label>
                  <input
                    type="number"
                    value={signos.frecuencia_resp}
                    onChange={(e) => setSignos({ ...signos, frecuencia_resp: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">SpO2 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={signos.saturacion_oxigeno}
                    onChange={(e) => setSignos({ ...signos, saturacion_oxigeno: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={signos.peso}
                    onChange={(e) => setSignos({ ...signos, peso: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Talla (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={signos.talla}
                    onChange={(e) => setSignos({ ...signos, talla: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={guardarSignos}
                  disabled={guardandoSignos}
                >
                  {guardandoSignos ? "Guardando..." : "Guardar Signos"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowSignos(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {signosVitales.length === 0 ? (
            <p className="text-gray-500">No hay signos vitales registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2">Fecha/Hora</th>
                    <th className="text-left px-3 py-2">Temp</th>
                    <th className="text-left px-3 py-2">PA</th>
                    <th className="text-left px-3 py-2">FC</th>
                    <th className="text-left px-3 py-2">FR</th>
                    <th className="text-left px-3 py-2">SpO2</th>
                    <th className="text-left px-3 py-2">Peso</th>
                    <th className="text-left px-3 py-2">Talla</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {signosVitales.map((sv, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        {new Date(sv.fecha_hora).toLocaleString("es-ES")}
                      </td>
                      <td className="px-3 py-2">
                        {sv.temperatura ? `${sv.temperatura}°C` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {sv.presion_sistolica
                          ? `${sv.presion_sistolica}/${sv.presion_diastolica}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2">{sv.frecuencia_cardiaca || "—"}</td>
                      <td className="px-3 py-2">{sv.frecuencia_resp || "—"}</td>
                      <td className="px-3 py-2">
                        {sv.saturacion_oxigeno ? `${sv.saturacion_oxigeno}%` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {sv.peso ? `${sv.peso} kg` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {sv.talla ? `${sv.talla} cm` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Emitir Receta — Médico */}
      {esMedico && (
        <div className="border-t mt-6 pt-4">
          <h3 className="font-semibold mb-2">Emitir Receta</h3>
          <RecetaForm atencionId={atencion.id} />
        </div>
      )}

      {/* Solicitar Examen de Laboratorio — Médico */}
      {esMedico && (
        <div className="border-t mt-6 pt-4">
          <h3 className="font-semibold mb-2">Solicitar Examen de Laboratorio</h3>
          <ExamenForm atencionId={atencion.id} />
        </div>
      )}

      {/* Hospitalizar — Médico */}
      {esMedico && (
        <div className="border-t mt-6 pt-4">
          <h3 className="font-semibold mb-2">Hospitalizar Paciente</h3>
          <HospitalForm atencionId={atencion.id} pacienteId={atencion.paciente_id} />
        </div>
      )}
    </div>
  );
}

interface RecetaMedicamento {
  id: number;
  nombre: string;
  principio_activo: string | null;
  presentacion: string | null;
  concentracion: string | null;
  stock_total?: number;
}

const TIPOS_EXAMEN = [
  "Hemograma Completo",
  "Quimica Sanguinea",
  "Examen General de Orina",
  "Glucosa en Ayunas",
  "Perfil Lipidico",
  "Electroforesis de Hemoglobina",
  "Pruebas de Funcion Hepatica",
  "Pruebas de Funcion Renal",
  "Uroanalisis",
  "Coagulograma",
  "Radiografia de Torax",
  "Tomografia Computarizada",
  "Ecografia General",
  "Electrocardiograma",
];

function ExamenForm({ atencionId }: { atencionId: number }) {
  const [tipoExamen, setTipoExamen] = useState("");
  const [tipoCustom, setTipoCustom] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [creando, setCreando] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const solicitar = async () => {
    const tipo = tipoExamen === "OTRO" ? tipoCustom : tipoExamen;
    if (!tipo) {
      setError("Seleccione un tipo de examen");
      return;
    }
    setCreando(true);
    setError("");
    setExito("");
    try {
      const res = await fetch("/api/laboratorio/examenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atencion_id: atencionId,
          tipo_examen: tipo,
          observaciones_solicitud: observaciones || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al solicitar examen");
        return;
      }
      setExito(`Examen #${data.examen.id} solicitado: ${tipo}`);
      setTipoExamen("");
      setTipoCustom("");
      setObservaciones("");
      setShowForm(false);
    } catch {
      setError("Error de conexion");
    } finally {
      setCreando(false);
    }
  };

  if (!showForm) {
    return (
      <div>
        {exito && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-3 text-sm">
            {exito}
          </div>
        )}
        <Button
          variant="primary"
          onClick={() => { setShowForm(true); setExito(""); }}
        >
          Solicitar Nuevo Examen
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 bg-teal-50 border-teal-200">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">{error}</div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Examen *</label>
          <select
            value={tipoExamen}
            onChange={(e) => setTipoExamen(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Seleccionar tipo de examen...</option>
            {TIPOS_EXAMEN.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="OTRO">Otro (especificar)</option>
          </select>
        </div>
        {tipoExamen === "OTRO" && (
          <div>
            <label className="block text-sm font-medium mb-1">Especificar tipo *</label>
            <input
              type="text"
              value={tipoCustom}
              onChange={(e) => setTipoCustom(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Nombre del examen..."
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={2}
            placeholder="Observaciones adicionales para el laboratorio..."
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={solicitar}
            disabled={creando}
          >
            {creando ? "Solicitando..." : "Solicitar Examen"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => { setShowForm(false); setTipoExamen(""); setTipoCustom(""); setObservaciones(""); setError(""); }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecetaForm({ atencionId }: { atencionId: number }) {
  const router = useRouter();
  const [medicamentos, setMedicamentos] = useState<RecetaMedicamento[]>([]);
  const [items, setItems] = useState<{
    medicamento_id: number;
    dosis: string;
    frecuencia: string;
    duracion: string;
    cantidad: number;
    indicaciones: string;
  }[]>([]);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [creando, setCreando] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/farmacia/medicamentos")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMedicamentos(data); })
      .catch(() => {});
  }, []);

  const agregarItem = () => {
    setItems([...items, {
      medicamento_id: 0,
      dosis: "",
      frecuencia: "",
      duracion: "",
      cantidad: 1,
      indicaciones: "",
    }]);
  };

  const actualizarItem = (idx: number, campo: string, valor: string | number) => {
    const nuevos = [...items];
    (nuevos[idx] as Record<string, unknown>)[campo] = valor;
    setItems(nuevos);
  };

  const eliminarItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const emitir = async () => {
    const validItems = items.filter((i) => i.medicamento_id > 0 && i.cantidad > 0);
    if (validItems.length === 0) {
      setError("Agregue al menos 1 medicamento con cantidad");
      return;
    }
    setCreando(true);
    setError("");
    setExito("");
    try {
      const res = await fetch("/api/farmacia/recetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atencion_id: atencionId, items: validItems }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al emitir receta");
        return;
      }
      setExito(`Receta ${data.receta.codigo_receta} emitida exitosamente`);
      setItems([]);
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setCreando(false);
    }
  };

  if (!showForm) {
    return (
      <div>
        {exito && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-3 text-sm">
            {exito}
          </div>
        )}
        <Button
          variant="primary"
          onClick={() => { setShowForm(true); setExito(""); }}
        >
          Emitir Nueva Receta
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 bg-purple-50 border-purple-200">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">Nueva Receta</h4>
        <button onClick={agregarItem} className="text-purple-600 text-sm hover:underline">+ Agregar medicamento</button>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="bg-white border rounded p-3 mb-2">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <select
              value={item.medicamento_id}
              onChange={(e) => actualizarItem(idx, "medicamento_id", Number(e.target.value))}
              className="border rounded px-2 py-1 col-span-3"
            >
              <option value={0}>Seleccionar medicamento...</option>
              {medicamentos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} — {m.presentacion} {m.concentracion}
                  {m.stock_total !== undefined ? ` (stock: ${m.stock_total})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <input
              type="text"
              placeholder="Dosis"
              value={item.dosis}
              onChange={(e) => actualizarItem(idx, "dosis", e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="Frecuencia"
              value={item.frecuencia}
              onChange={(e) => actualizarItem(idx, "frecuencia", e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="Duración"
              value={item.duracion}
              onChange={(e) => actualizarItem(idx, "duracion", e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Cantidad"
              value={item.cantidad || ""}
              onChange={(e) => actualizarItem(idx, "cantidad", Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
              min="1"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Indicaciones (opcional)"
              value={item.indicaciones}
              onChange={(e) => actualizarItem(idx, "indicaciones", e.target.value)}
              className="border rounded px-2 py-1 text-sm flex-1"
            />
            <button onClick={() => eliminarItem(idx)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-sm text-gray-500 mb-2">Haga clic en &quot;+ Agregar medicamento&quot; para comenzar</p>
      )}

      <div className="flex gap-3 mt-3">
        <Button
          variant="primary"
          onClick={emitir}
          disabled={creando || items.filter((i) => i.medicamento_id > 0).length === 0}
        >
          {creando ? "Emitiendo..." : "Emitir Receta"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => { setShowForm(false); setItems([]); setError(""); }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

interface CamaInfo {
  id: number;
  numero_cama: string;
  piso: string;
  sala: string;
  tipo: string;
}

function HospitalForm({ atencionId, pacienteId }: { atencionId: number; pacienteId: number }) {
  const router = useRouter();
  const [camas, setCamas] = useState<CamaInfo[]>([]);
  const [camaId, setCamaId] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [creando, setCreando] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (showForm) {
      fetch("/api/cama?estado=DISPONIBLE")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setCamas(data); })
        .catch(() => {});
    }
  }, [showForm]);

  const hospitalizar = async () => {
    if (!camaId || !diagnostico.trim()) {
      setError("Seleccione cama e ingrese diagnostico");
      return;
    }
    setCreando(true);
    setError("");
    setExito("");
    try {
      const res = await fetch("/api/hospitalizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atencion_id: atencionId, cama_id: parseInt(camaId), diagnostico_ingreso: diagnostico }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al hospitalizar");
        return;
      }
      setExito(`Paciente hospitalizado en cama ${camas.find((c) => c.id === parseInt(camaId))?.numero_cama || ""}. Hospitalizacion #${data.hospitalizacion.id}`);
      setShowForm(false);
      setCamaId("");
      setDiagnostico("");
    } catch {
      setError("Error de conexion");
    } finally {
      setCreando(false);
    }
  };

  if (!showForm) {
    return (
      <div>
        {exito && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-3 text-sm">{exito}</div>
        )}
        <Button
          variant="primary"
          onClick={() => { setShowForm(true); setExito(""); }}
        >
          Hospitalizar Paciente
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 bg-orange-50 border-orange-200">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">{error}</div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Cama Disponible *</label>
          <select value={camaId} onChange={(e) => setCamaId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Seleccionar cama...</option>
            {camas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.numero_cama} — Piso {c.piso}, {c.sala} ({c.tipo})
              </option>
            ))}
          </select>
          {camas.length === 0 && <p className="text-xs text-orange-600 mt-1">No hay camas disponibles</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Diagnostico de Ingreso *</label>
          <textarea
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={3}
            placeholder="Diagnostico de ingreso..."
          />
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={hospitalizar} disabled={creando || camas.length === 0}>
            {creando ? "Hospitalizando..." : "Confirmar Hospitalizacion"}
          </Button>
          <Button variant="secondary" onClick={() => { setShowForm(false); setCamaId(""); setDiagnostico(""); setError(""); }}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
