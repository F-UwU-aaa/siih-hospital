"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Button } from "@/components/ui";

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
  activo: boolean;
}

interface Alergia {
  id: number;
  sustancia: string;
  reaccion: string | null;
  severidad: string | null;
  fecha_registro: string;
  registrado_por_username: string | null;
}

interface Antecedente {
  id: number;
  tipo: string;
  descripcion: string;
  fecha_registro: string;
  registrado_por_username: string | null;
}

export default function FichaPacientePage() {
  const params = useParams();
  const id = params.id;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historial, setHistorial] = useState<{
    alergias: Alergia[];
    antecedentes: Antecedente[];
  }>({ alergias: [], antecedentes: [] });
  const [tab, setTab] = useState<"alergias" | "antecedentes">("alergias");
  const [cargando, setCargando] = useState(true);

  // Formulario nueva alergia
  const [nuevaAlergia, setNuevaAlergia] = useState({
    sustancia: "",
    reaccion: "",
    severidad: "",
  });
  const [msgAlergia, setMsgAlergia] = useState("");

  // Formulario nuevo antecedente
  const [nuevoAntecedente, setNuevoAntecedente] = useState({
    tipo: "",
    descripcion: "",
  });
  const [msgAntecedente, setMsgAntecedente] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [pacRes, histRes] = await Promise.all([
        fetch(`/api/pacientes/${id}`),
        fetch(`/api/pacientes/${id}/historial`),
      ]);
      if (pacRes.ok) setPaciente(await pacRes.json());
      if (histRes.ok) {
        const data = await histRes.json();
        setHistorial({ alergias: data.alergias, antecedentes: data.antecedentes });
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const registrarAlergia = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgAlergia("");
    try {
      const res = await fetch(`/api/pacientes/${id}/historial/alergias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaAlergia),
      });
      if (res.ok) {
        setMsgAlergia("Alergia registrada");
        setNuevaAlergia({ sustancia: "", reaccion: "", severidad: "" });
        cargarDatos();
      } else {
        const data = await res.json();
        setMsgAlergia(data.error || "Error");
      }
    } catch {
      setMsgAlergia("Error de conexión");
    }
  };

  const registrarAntecedente = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgAntecedente("");
    try {
      const res = await fetch(`/api/pacientes/${id}/historial/antecedentes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoAntecedente),
      });
      if (res.ok) {
        setMsgAntecedente("Antecedente registrado");
        setNuevoAntecedente({ tipo: "", descripcion: "" });
        cargarDatos();
      } else {
        const data = await res.json();
        setMsgAntecedente(data.error || "Error");
      }
    } catch {
      setMsgAntecedente("Error de conexión");
    }
  };

  if (cargando) return <div className="min-h-screen bg-bg-page p-8">Cargando...</div>;
  if (!paciente) return <div className="min-h-screen bg-bg-page p-8">Paciente no encontrado</div>;

  return (
    <div className="min-h-screen bg-bg-page p-8">
      <div className="mb-4">
        <Link href="/pacientes" className="text-blue-600 hover:underline">
          ← Volver a Pacientes
        </Link>
      </div>

      <PageHeader title={`${paciente.nombre} ${paciente.apellido}`} />
      <p className="text-gray-600 mb-6">
        CI: {paciente.ci} |{" "}
        {new Date(paciente.fecha_nacimiento).toLocaleDateString("es-VE")} |{" "}
        {paciente.activo ? (
          <span className="text-green-600">Activo</span>
        ) : (
          <span className="text-red-600">Inactivo</span>
        )}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <strong>Teléfono:</strong> {paciente.telefono || "-"}
        </div>
        <div>
          <strong>Email:</strong> {paciente.email || "-"}
        </div>
        <div>
          <strong>Dirección:</strong> {paciente.direccion || "-"}
        </div>
        <div>
          <strong>Seguro:</strong> {paciente.seguro_medico || "-"}
        </div>
      </div>

      {/* ALERTA: Alergias destacadas */}
      {historial.alergias.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <h2 className="font-bold text-red-700">
            ⚠ ALERGIAS ({historial.alergias.length})
          </h2>
          <ul className="mt-2">
            {historial.alergias.map((a) => (
              <li key={a.id} className="text-red-600">
                {a.sustancia} — {a.severidad || "Sin severidad"}
                {a.reaccion && ` (${a.reaccion})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4">
        <button
          onClick={() => setTab("alergias")}
          className={`pb-2 px-1 font-medium ${
            tab === "alergias"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Alergias
        </button>
        <button
          onClick={() => setTab("antecedentes")}
          className={`pb-2 px-1 font-medium ${
            tab === "antecedentes"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Antecedentes
        </button>
      </div>

      {tab === "alergias" && (
        <div>
          <h3 className="font-semibold mb-2">Registrar Alergia</h3>
          {msgAlergia && (
            <p className="text-sm text-green-600 mb-2">{msgAlergia}</p>
          )}
          <form onSubmit={registrarAlergia} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Sustancia"
              required
              value={nuevaAlergia.sustancia}
              onChange={(e) =>
                setNuevaAlergia({ ...nuevaAlergia, sustancia: e.target.value })
              }
              className="border rounded px-2 py-1 flex-1"
            />
            <input
              type="text"
              placeholder="Reacción"
              value={nuevaAlergia.reaccion}
              onChange={(e) =>
                setNuevaAlergia({ ...nuevaAlergia, reaccion: e.target.value })
              }
              className="border rounded px-2 py-1 flex-1"
            />
            <select
              value={nuevaAlergia.severidad}
              onChange={(e) =>
                setNuevaAlergia({ ...nuevaAlergia, severidad: e.target.value })
              }
              className="border rounded px-2 py-1"
            >
              <option value="">Severidad</option>
              <option value="LEVE">Leve</option>
              <option value="MODERADA">Moderada</option>
              <option value="GRAVE">Grave</option>
            </select>
            <Button type="submit" variant="primary">
              Guardar
            </Button>
          </form>

          {historial.alergias.length === 0 ? (
            <p className="text-gray-500">Sin alergias registradas</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Sustancia</th>
                  <th className="p-2 text-left">Reacción</th>
                  <th className="p-2 text-left">Severidad</th>
                  <th className="p-2 text-left">Registrado por</th>
                  <th className="p-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.alergias.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-2 font-medium">{a.sustancia}</td>
                    <td className="p-2">{a.reaccion || "-"}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          a.severidad === "GRAVE"
                            ? "bg-red-200 text-red-800"
                            : a.severidad === "MODERADA"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {a.severidad || "-"}
                      </span>
                    </td>
                    <td className="p-2">{a.registrado_por_username || "-"}</td>
                    <td className="p-2">
                      {new Date(a.fecha_registro).toLocaleDateString("es-VE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "antecedentes" && (
        <div>
          <h3 className="font-semibold mb-2">Registrar Antecedente</h3>
          {msgAntecedente && (
            <p className="text-sm text-green-600 mb-2">{msgAntecedente}</p>
          )}
          <form onSubmit={registrarAntecedente} className="flex gap-2 mb-4">
            <select
              required
              value={nuevoAntecedente.tipo}
              onChange={(e) =>
                setNuevoAntecedente({
                  ...nuevoAntecedente,
                  tipo: e.target.value,
                })
              }
              className="border rounded px-2 py-1"
            >
              <option value="">Tipo</option>
              <option value="PATOLOGICO">Patológico</option>
              <option value="QUIRURGICO">Quirúrgico</option>
              <option value="FAMILIAR">Familiar</option>
              <option value="ALERGICO">Alérgico</option>
              <option value="MEDICAMENTOSO">Medicamentoso</option>
              <option value="HABITOS">Hábitos</option>
            </select>
            <input
              type="text"
              placeholder="Descripción"
              required
              value={nuevoAntecedente.descripcion}
              onChange={(e) =>
                setNuevoAntecedente({
                  ...nuevoAntecedente,
                  descripcion: e.target.value,
                })
              }
              className="border rounded px-2 py-1 flex-1"
            />
            <Button type="submit" variant="primary">
              Guardar
            </Button>
          </form>

          {historial.antecedentes.length === 0 ? (
            <p className="text-gray-500">Sin antecedentes registrados</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Descripción</th>
                  <th className="p-2 text-left">Registrado por</th>
                  <th className="p-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.antecedentes.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-2">{a.tipo}</td>
                    <td className="p-2">{a.descripcion}</td>
                    <td className="p-2">{a.registrado_por_username || "-"}</td>
                    <td className="p-2">
                      {new Date(a.fecha_registro).toLocaleDateString("es-VE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="mt-8 border-t pt-4 text-sm text-gray-500">
        <p>Atenciones previas, signos vitales, recetas y exámenes se mostrarán cuando esos módulos estén disponibles.</p>
      </div>
    </div>
  );
}
