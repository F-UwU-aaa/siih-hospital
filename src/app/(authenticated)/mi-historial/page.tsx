"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import BadgeEstado from "@/components/ui/BadgeEstado";

interface Paciente {
  id: number;
  ci: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  sexo: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  seguro_medico: string | null;
}

interface Alergia {
  id: number;
  sustancia: string;
  reaccion: string | null;
  severidad: string | null;
  fecha_registro: string;
}

interface Antecedente {
  id: number;
  tipo: string;
  descripcion: string;
  fecha_registro: string;
}

interface Atencion {
  id: number;
  fecha_atencion: string;
  tipo: string;
  motivo_consulta: string | null;
  diagnostico: string | null;
  medico_nombre: string;
}

interface SignosVitales {
  id: number;
  fecha_hora: string;
  temperatura: number | null;
  presion_sistolica: number | null;
  presion_diastolica: number | null;
  frecuencia_cardiaca: number | null;
  saturacion_oxigeno: number | null;
  peso: number | null;
}

interface HistorialData {
  paciente: Paciente;
  alergias: Alergia[];
  antecedentes: Antecedente[];
  atenciones: Atencion[];
  signos_vitales: SignosVitales[];
}

export default function MiHistorialPage() {
  const [data, setData] = useState<HistorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"datos" | "alergias" | "antecedentes" | "atenciones">("datos");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then((sesion) => {
        if (!sesion?.usuario?.id) { router.push("/login"); return; }
        cargarHistorial();
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const cargarHistorial = async () => {
    setLoading(true);
    setError("");
    try {
      const pacRes = await fetch("/api/pacientes");
      if (!pacRes.ok) { setError("Error al cargar datos"); setLoading(false); return; }
      const pacientes = await pacRes.json();
      const miPaciente = Array.isArray(pacientes) && pacientes.length > 0 ? pacientes[0] : null;
      if (!miPaciente) { setError("No se encontro su registro de paciente"); setLoading(false); return; }

      const histRes = await fetch(`/api/pacientes/${miPaciente.id}/historial`);
      if (histRes.ok) {
        setData(await histRes.json());
      } else {
        setError("Error al cargar historial clinico");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "datos", label: "Mis Datos" },
    { key: "alergias", label: `Alergias (${data?.alergias.length ?? 0})` },
    { key: "antecedentes", label: `Antecedentes (${data?.antecedentes.length ?? 0})` },
    { key: "atenciones", label: `Atenciones (${data?.atenciones.length ?? 0})` },
  ] as const;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mi Historial" subtitle="Su informacion medica" />
        <p className="text-slate-500 text-center py-8">Cargando...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mi Historial" subtitle="Su informacion medica" />
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-red-600 text-center">{error || "No se pudieron cargar los datos"}</p>
        </div>
      </div>
    );
  }

  const { paciente, alergias, antecedentes, atenciones, signos_vitales } = data;

  const fechaNacimiento = paciente.fecha_nacimiento
    ? new Date(paciente.fecha_nacimiento).toLocaleDateString("es-VE")
    : "-";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Historial"
        subtitle={`${paciente.nombre} ${paciente.apellido} — CI: ${paciente.ci}`}
      />

      {/* Alergias alerta */}
      {alergias.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
          <h3 className="font-bold text-red-700 text-sm">
            Alergias registradas ({alergias.length})
          </h3>
          <ul className="mt-1 flex flex-wrap gap-2">
            {alergias.map((a) => (
              <li key={a.id} className="text-sm text-red-600">
                {a.sustancia}{a.severidad ? ` (${a.severidad})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-teal-700 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Mis Datos */}
      {tab === "datos" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Nombre:</span> <span className="font-medium">{paciente.nombre} {paciente.apellido}</span></div>
            <div><span className="text-slate-500">CI:</span> <span className="font-medium">{paciente.ci}</span></div>
            <div><span className="text-slate-500">Fecha nacimiento:</span> <span className="font-medium">{fechaNacimiento}</span></div>
            <div><span className="text-slate-500">Sexo:</span> <span className="font-medium">{paciente.sexo || "-"}</span></div>
            <div><span className="text-slate-500">Telefono:</span> <span className="font-medium">{paciente.telefono || "-"}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="font-medium">{paciente.email || "-"}</span></div>
            <div><span className="text-slate-500">Direccion:</span> <span className="font-medium">{paciente.direccion || "-"}</span></div>
            <div><span className="text-slate-500">Seguro medico:</span> <span className="font-medium">{paciente.seguro_medico || "-"}</span></div>
          </div>
          {signos_vitales.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-900 mb-3">Ultimos Signos Vitales</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Fecha</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">Temp</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">PA</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">FC</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">SpO2</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signos_vitales.map((sv) => (
                      <tr key={sv.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{new Date(sv.fecha_hora).toLocaleString("es-VE")}</td>
                        <td className="py-2 px-3 text-right">{sv.temperatura ?? "-"}</td>
                        <td className="py-2 px-3 text-right">{sv.presion_sistolica && sv.presion_diastolica ? `${sv.presion_sistolica}/${sv.presion_diastolica}` : "-"}</td>
                        <td className="py-2 px-3 text-right">{sv.frecuencia_cardiaca ?? "-"}</td>
                        <td className="py-2 px-3 text-right">{sv.saturacion_oxigeno ?? "-"}</td>
                        <td className="py-2 px-3 text-right">{sv.peso ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Alergias */}
      {tab === "alergias" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {alergias.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No tiene alergias registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Sustancia</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Reaccion</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Severidad</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {alergias.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-medium">{a.sustancia}</td>
                      <td className="py-2 px-3">{a.reaccion || "-"}</td>
                      <td className="py-2 px-3">
                        <BadgeEstado estado={a.severidad || "-"} />
                      </td>
                      <td className="py-2 px-3 text-slate-500">{new Date(a.fecha_registro).toLocaleDateString("es-VE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Antecedentes */}
      {tab === "antecedentes" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {antecedentes.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No tiene antecedentes registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Tipo</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Descripcion</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {antecedentes.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-2 px-3"><BadgeEstado estado={a.tipo} /></td>
                      <td className="py-2 px-3">{a.descripcion}</td>
                      <td className="py-2 px-3 text-slate-500">{new Date(a.fecha_registro).toLocaleDateString("es-VE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Atenciones */}
      {tab === "atenciones" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {atenciones.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No tiene atenciones registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-600">#</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Fecha</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Tipo</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Motivo</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Diagnostico</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-600">Medico</th>
                  </tr>
                </thead>
                <tbody>
                  {atenciones.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3">{a.id}</td>
                      <td className="py-2 px-3 text-slate-500">{new Date(a.fecha_atencion).toLocaleString("es-VE")}</td>
                      <td className="py-2 px-3"><BadgeEstado estado={a.tipo} /></td>
                      <td className="py-2 px-3">{a.motivo_consulta || "-"}</td>
                      <td className="py-2 px-3">{a.diagnostico || "-"}</td>
                      <td className="py-2 px-3">{a.medico_nombre || "-"}</td>
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
