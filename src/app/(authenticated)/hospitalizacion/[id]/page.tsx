"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BadgeEstado, PageHeader, Button } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Hospitalizacion {
  id: number;
  paciente_id: number;
  medico_id: number;
  cama_id: number;
  atencion_id: number | null;
  fecha_ingreso: string;
  fecha_alta: string | null;
  diagnostico_ingreso: string;
  diagnostico_alta: string | null;
  estado: string;
  paciente_ci: string;
  paciente_nombre: string;
  paciente_apellido: string;
  fecha_nacimiento: string;
  seguro_medico: string | null;
  numero_cama: string;
  piso: string;
  sala: string;
  cama_tipo: string;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
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

interface SignosVitales {
  id: number;
  fecha_hora: string;
  temperatura: number | null;
  presion_sistolica: number | null;
  presion_diastolica: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_resp: number | null;
  saturacion_oxigeno: number | null;
  peso: number | null;
  talla: number | null;
  enfermera_username: string | null;
}

interface Medicacion {
  id: number;
  medicamento_nombre: string;
  dosis: string;
  fecha_hora: string;
  observaciones: string | null;
  enfermera_username: string | null;
}

interface Medicamento {
  id: number;
  nombre: string;
}

export default function HospitalizacionDetallePage() {
  const params = useParams();
  const id = params.id;

  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [hosp, setHosp] = useState<Hospitalizacion | null>(null);
  const [alergias, setAlergias] = useState<Alergia[]>([]);
  const [antecedentes, setAntecedentes] = useState<Antecedente[]>([]);
  const [signosVitales, setSignosVitales] = useState<SignosVitales[]>([]);
  const [medicaciones, setMedicaciones] = useState<Medicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<"signos" | "medicacion" | "alergias" | "antecedentes">("signos");

  const [showSignos, setShowSignos] = useState(false);
  const [signos, setSignos] = useState({
    temperatura: "", presion_sistolica: "", presion_diastolica: "",
    frecuencia_cardiaca: "", frecuencia_resp: "", saturacion_oxigeno: "", peso: "", talla: "",
  });
  const [guardandoSignos, setGuardandoSignos] = useState(false);

  const [showMedicacion, setShowMedicacion] = useState(false);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [medForm, setMedForm] = useState({ medicamento_id: "", dosis: "", observaciones: "" });
  const [guardandoMed, setGuardandoMed] = useState(false);

  const [showAlta, setShowAlta] = useState(false);
  const [diagnosticoAlta, setDiagnosticoAlta] = useState("");
  const [guardandoAlta, setGuardandoAlta] = useState(false);

  const rol = sesion?.usuario.rol_nombre;
  const esMedico = rol === "MEDICO";
  const esEnfermera = rol === "ENFERMERA";

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/hospitalizacion/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No encontrada");
        return r.json();
      })
      .then((data) => {
        setHosp(data.hospitalizacion);
        setAlergias(data.alergias || []);
        setAntecedentes(data.antecedentes || []);
        setSignosVitales(data.signos_vitales || []);
        setMedicaciones(data.medicaciones || []);
      })
      .catch(() => setError("Hospitalizacion no encontrada"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (esEnfermera && showMedicacion) {
      fetch("/api/farmacia/medicamentos")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setMedicamentos(data); })
        .catch(() => {});
    }
  }, [esEnfermera, showMedicacion]);

  const registrarSignos = async () => {
    setGuardandoSignos(true);
    setError("");
    try {
      const body: Record<string, string> = {};
      for (const [key, val] of Object.entries(signos)) {
        if (val) body[key] = val;
      }
      const res = await fetch(`/api/hospitalizacion/${id}/signos-vitales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
        return;
      }
      setShowSignos(false);
      setSignos({ temperatura: "", presion_sistolica: "", presion_diastolica: "",
        frecuencia_cardiaca: "", frecuencia_resp: "", saturacion_oxigeno: "", peso: "", talla: "" });
      const refresh = await fetch(`/api/hospitalizacion/${id}`);
      if (refresh.ok) {
        const d = await refresh.json();
        setSignosVitales(d.signos_vitales || []);
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setGuardandoSignos(false);
    }
  };

  const registrarMedicacion = async () => {
    if (!medForm.medicamento_id || !medForm.dosis) {
      setError("Seleccione medicamento y dosis");
      return;
    }
    setGuardandoMed(true);
    setError("");
    try {
      const res = await fetch(`/api/hospitalizacion/${id}/medicacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicamento_id: parseInt(medForm.medicamento_id),
          dosis: medForm.dosis,
          observaciones: medForm.observaciones || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrar medicacion");
        return;
      }
      setShowMedicacion(false);
      setMedForm({ medicamento_id: "", dosis: "", observaciones: "" });
      const refresh = await fetch(`/api/hospitalizacion/${id}`);
      if (refresh.ok) {
        const d = await refresh.json();
        setMedicaciones(d.medicaciones || []);
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setGuardandoMed(false);
    }
  };

  const darAlta = async () => {
    if (!diagnosticoAlta.trim()) {
      setError("Ingrese el diagnostico de alta");
      return;
    }
    setGuardandoAlta(true);
    setError("");
    try {
      const res = await fetch(`/api/hospitalizacion/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnostico_alta: diagnosticoAlta }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al dar de alta");
        return;
      }
      setHosp(data.hospitalizacion);
      setShowAlta(false);
      setDiagnosticoAlta("");
    } catch {
      setError("Error de conexion");
    } finally {
      setGuardandoAlta(false);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error && !hosp) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
        <Link href="/hospitalizacion" className="text-blue-600 hover:underline mt-4 block">
          Volver a Hospitalizacion
        </Link>
      </div>
    );
  }
  if (!hosp) return null;

  return (
    <div className="min-h-screen bg-bg-page p-8 max-w-5xl">
      <Link href="/hospitalizacion" className="text-blue-600 hover:underline mb-4 block">
        Volver a Hospitalizacion
      </Link>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      {/* ALERTA ALERGIAS — RN-04 SIEMPRE VISIBLE (enfermera siempre, medico tambien) */}
      {alergias.length > 0 && (
        <div className="bg-red-700 text-white border-4 border-red-900 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-8 h-8 text-yellow-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <h2 className="text-xl font-bold">ALERTA DE ALERGIAS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alergias.map((a, i) => (
              <div key={i} className="bg-red-900 rounded p-3 border border-red-500">
                <div className="font-bold text-yellow-300 text-lg">{a.sustancia}</div>
                {a.reaccion && <div className="text-sm">Reaccion: {a.reaccion}</div>}
                {a.severidad && (
                  <div className="text-sm font-semibold mt-1">
                    Severidad:{" "}
                    <span className={
                      a.severidad === "CRITICA" ? "text-yellow-300"
                        : a.severidad === "GRAVE" ? "text-red-300"
                        : "text-red-200"
                    }>
                      {a.severidad}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <PageHeader title={`Hospitalizacion #${hosp.id}`} />
          <BadgeEstado estado={hosp.estado} />
        </div>
        {esMedico && hosp.estado === "ACTIVA" && (
          <Button
            variant="danger"
            onClick={() => setShowAlta(!showAlta)}
          >
            Dar de Alta
          </Button>
        )}
      </div>

      {showAlta && (
        <div className="border-2 rounded p-4 bg-red-50 border-red-300 mb-4">
          <h3 className="font-semibold mb-2">Alta Medica</h3>
          <textarea
            value={diagnosticoAlta}
            onChange={(e) => setDiagnosticoAlta(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mb-3"
            rows={3}
            placeholder="Diagnostico de alta..."
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={darAlta}
              disabled={guardandoAlta}
            >
              {guardandoAlta ? "Procesando..." : "Confirmar Alta"}
            </Button>
            <Button variant="secondary" onClick={() => setShowAlta(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Paciente</h2>
          <p className="font-medium">{hosp.paciente_nombre} {hosp.paciente_apellido}</p>
          <p className="text-sm text-gray-500">CI: {hosp.paciente_ci}</p>
          {hosp.seguro_medico && <p className="text-sm text-gray-500">Seguro: {hosp.seguro_medico}</p>}
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Cama</h2>
          <p className="font-medium">{hosp.numero_cama}</p>
          <p className="text-sm text-gray-500">Piso {hosp.piso} - {hosp.sala}</p>
          <p className="text-sm text-gray-500">Tipo: {hosp.cama_tipo}</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Medico Tratante</h2>
          <p className="font-medium">Dr(a). {hosp.medico_nombre} {hosp.medico_apellido}</p>
          <p className="text-sm text-gray-500">{hosp.especialidad}</p>
        </div>
      </div>

      <div className="border rounded p-3 mb-4 bg-gray-50">
        <p className="text-sm"><span className="font-medium">Diagnostico de ingreso:</span> {hosp.diagnostico_ingreso}</p>
        <p className="text-xs text-gray-500 mt-1">
          Ingreso: {new Date(hosp.fecha_ingreso).toLocaleString("es-ES")}
        </p>
        {hosp.diagnostico_alta && (
          <p className="text-sm mt-2"><span className="font-medium">Diagnostico de alta:</span> {hosp.diagnostico_alta}</p>
        )}
        {hosp.fecha_alta && (
          <p className="text-xs text-gray-500 mt-1">
            Alta: {new Date(hosp.fecha_alta).toLocaleString("es-ES")}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        {esEnfermera && (
          <>
            <button onClick={() => setActiveTab("alergias")} className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === "alergias" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
              Alergias ({alergias.length})
            </button>
            <button onClick={() => setActiveTab("antecedentes")} className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === "antecedentes" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
              Antecedentes ({antecedentes.length})
            </button>
          </>
        )}
        <button onClick={() => setActiveTab("signos")} className={`px-4 py-2 font-medium text-sm border-b-2 ${
          activeTab === "signos" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
        }`}>
          Signos Vitales ({signosVitales.length})
        </button>
        <button onClick={() => setActiveTab("medicacion")} className={`px-4 py-2 font-medium text-sm border-b-2 ${
          activeTab === "medicacion" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
        }`}>
          Medicacion ({medicaciones.length})
        </button>
      </div>

      {/* Tab: Alergias (enfermera, solo lectura) */}
      {esEnfermera && activeTab === "alergias" && (
        <div>
          {alergias.length === 0 ? (
            <p className="text-gray-500">No hay alergias registradas</p>
          ) : (
            <div className="space-y-3">
              {alergias.map((a, i) => (
                <div key={i} className={`border rounded p-4 ${
                  a.severidad === "CRITICA" || a.severidad === "GRAVE" ? "border-red-400 bg-red-50" : ""
                }`}>
                  <div className="font-semibold">{a.sustancia}</div>
                  {a.reaccion && <div className="text-sm">Reaccion: {a.reaccion}</div>}
                  {a.severidad && <div className="text-sm font-medium">Severidad: {a.severidad}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Antecedentes (enfermera, solo lectura) */}
      {esEnfermera && activeTab === "antecedentes" && (
        <div>
          {antecedentes.length === 0 ? (
            <p className="text-gray-500">No hay antecedentes registrados</p>
          ) : (
            <div className="space-y-3">
              {antecedentes.map((a, i) => (
                <div key={i} className="border rounded p-4">
                  <div className="font-semibold">{a.tipo}</div>
                  <div className="text-sm">{a.descripcion}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Signos Vitales */}
      {activeTab === "signos" && (
        <div>
          {esEnfermera && hosp.estado === "ACTIVA" && (
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
                  <label className="block text-xs font-medium">Temperatura (C)</label>
                  <input type="number" step="0.1" value={signos.temperatura}
                    onChange={(e) => setSignos({ ...signos, temperatura: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium">PA Sistolica</label>
                  <input type="number" value={signos.presion_sistolica}
                    onChange={(e) => setSignos({ ...signos, presion_sistolica: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium">PA Diastolica</label>
                  <input type="number" value={signos.presion_diastolica}
                    onChange={(e) => setSignos({ ...signos, presion_diastolica: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium">FC (lpm)</label>
                  <input type="number" value={signos.frecuencia_cardiaca}
                    onChange={(e) => setSignos({ ...signos, frecuencia_cardiaca: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium">FR (rpm)</label>
                  <input type="number" value={signos.frecuencia_resp}
                    onChange={(e) => setSignos({ ...signos, frecuencia_resp: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium">SpO2 (%)</label>
                  <input type="number" step="0.1" value={signos.saturacion_oxigeno}
                    onChange={(e) => setSignos({ ...signos, saturacion_oxigeno: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium">Peso (kg)</label>
                  <input type="number" step="0.01" value={signos.peso}
                    onChange={(e) => setSignos({ ...signos, peso: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium">Talla (cm)</label>
                  <input type="number" step="0.01" value={signos.talla}
                    onChange={(e) => setSignos({ ...signos, talla: e.target.value })}
                    className="border rounded px-2 py-1 w-full text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={registrarSignos} disabled={guardandoSignos}>
                  {guardandoSignos ? "Guardando..." : "Guardar Signos"}
                </Button>
                <Button variant="secondary" onClick={() => setShowSignos(false)}>
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
                    <th className="text-left px-3 py-2">Enfermera</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {signosVitales.map((sv) => (
                    <tr key={sv.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">{new Date(sv.fecha_hora).toLocaleString("es-ES")}</td>
                      <td className="px-3 py-2">{sv.temperatura ? `${sv.temperatura}C` : "-"}</td>
                      <td className="px-3 py-2">{sv.presion_sistolica ? `${sv.presion_sistolica}/${sv.presion_diastolica}` : "-"}</td>
                      <td className="px-3 py-2">{sv.frecuencia_cardiaca || "-"}</td>
                      <td className="px-3 py-2">{sv.frecuencia_resp || "-"}</td>
                      <td className="px-3 py-2">{sv.saturacion_oxigeno ? `${sv.saturacion_oxigeno}%` : "-"}</td>
                      <td className="px-3 py-2 text-xs">{sv.enfermera_username || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Medicacion */}
      {activeTab === "medicacion" && (
        <div>
          {esEnfermera && hosp.estado === "ACTIVA" && (
            <Button
              variant="primary"
              onClick={() => setShowMedicacion(!showMedicacion)}
              className="mb-4"
            >
              Registrar Medicacion
            </Button>
          )}
          {showMedicacion && (
            <div className="border rounded p-4 mb-4 bg-green-50 border-green-200">
              <h3 className="font-semibold mb-3">Nueva Medicacion Administrada</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium">Medicamento *</label>
                  <select value={medForm.medicamento_id}
                    onChange={(e) => setMedForm({ ...medForm, medicamento_id: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm">
                    <option value="">Seleccionar...</option>
                    {medicamentos.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium">Dosis *</label>
                  <input type="text" value={medForm.dosis}
                    onChange={(e) => setMedForm({ ...medForm, dosis: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="ej. 500mg cada 8 horas" />
                </div>
                <div>
                  <label className="block text-xs font-medium">Observaciones</label>
                  <input type="text" value={medForm.observaciones}
                    onChange={(e) => setMedForm({ ...medForm, observaciones: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={registrarMedicacion} disabled={guardandoMed}>
                    {guardandoMed ? "Guardando..." : "Registrar"}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowMedicacion(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
          {medicaciones.length === 0 ? (
            <p className="text-gray-500">No hay medicaciones registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2">Fecha/Hora</th>
                    <th className="text-left px-3 py-2">Medicamento</th>
                    <th className="text-left px-3 py-2">Dosis</th>
                    <th className="text-left px-3 py-2">Observaciones</th>
                    <th className="text-left px-3 py-2">Enfermera</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {medicaciones.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">{new Date(m.fecha_hora).toLocaleString("es-ES")}</td>
                      <td className="px-3 py-2 font-medium">{m.medicamento_nombre}</td>
                      <td className="px-3 py-2">{m.dosis}</td>
                      <td className="px-3 py-2 text-xs">{m.observaciones || "-"}</td>
                      <td className="px-3 py-2 text-xs">{m.enfermera_username || "-"}</td>
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
