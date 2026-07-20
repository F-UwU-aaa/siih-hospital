"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BadgeEstado, PageHeader, Button } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Examen {
  id: number;
  tipo_examen: string;
  estado: string;
  fecha_solicitud: string;
  observaciones_solicitud: string | null;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  paciente_ci: string;
  paciente_nombre: string;
  paciente_apellido: string;
  fecha_nacimiento: string;
  tecnico_username: string | null;
  resultado: string | null;
  valores_referencia: string | null;
  resultado_observaciones: string | null;
  es_critico: boolean | null;
  fecha_resultado: string | null;
  motivo_consulta: string | null;
  diagnostico: string | null;
}

export default function LaboratorioDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [examen, setExamen] = useState<Examen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [resultadoForm, setResultadoForm] = useState({
    resultado: "",
    valores_referencia: "",
    observaciones: "",
    es_critico: false,
  });
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/laboratorio/examenes/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No encontrado");
        return r.json();
      })
      .then((data) => {
        setExamen(data.examen);
      })
      .catch(() => setError("Examen no encontrado"))
      .finally(() => setLoading(false));
  }, [id]);

  const registrarResultado = async () => {
    if (!resultadoForm.resultado.trim()) {
      setError("El campo resultado es requerido");
      return;
    }
    setGuardando(true);
    setError("");
    setExito("");
    try {
      const res = await fetch(`/api/laboratorio/examenes/${id}/resultado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultado: resultadoForm.resultado,
          valores_referencia: resultadoForm.valores_referencia || undefined,
          observaciones: resultadoForm.observaciones || undefined,
          es_critico: resultadoForm.es_critico,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrar resultado");
        return;
      }
      setExito(
        resultadoForm.es_critico
          ? "Resultado registrado (CRITICO). Notificacion enviada al medico tratante."
          : "Resultado registrado exitosamente"
      );
      setExamen((prev) =>
        prev
          ? {
              ...prev,
              estado: "COMPLETADO",
              resultado: resultadoForm.resultado,
              valores_referencia: resultadoForm.valores_referencia || null,
              resultado_observaciones: resultadoForm.observaciones || null,
              es_critico: resultadoForm.es_critico,
              fecha_resultado: new Date().toISOString(),
            }
          : prev
      );
      setResultadoForm({ resultado: "", valores_referencia: "", observaciones: "", es_critico: false });
    } catch {
      setError("Error de conexion");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error && !examen) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
        <Link href="/laboratorio" className="text-blue-600 hover:underline mt-4 block">
          Volver a Laboratorio
        </Link>
      </div>
    );
  }
  if (!examen) return null;

  const esTecnico = sesion?.usuario.rol_nombre === "TECNICO_LAB";
  const puedeTomar = esTecnico && examen.estado === "SOLICITADO";
  const puedeResultado = esTecnico && examen.estado === "EN_PROCESO";

  return (
    <div className="min-h-screen bg-bg-page p-8 max-w-4xl">
      <Link href="/laboratorio" className="text-blue-600 hover:underline mb-4 block">
        Volver a Laboratorio
      </Link>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}
      {exito && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{exito}</div>
      )}

      <PageHeader
        title={`Examen #${examen.id} — ${examen.tipo_examen}`}
        subtitle={`Solicitado: ${new Date(examen.fecha_solicitud).toLocaleString("es-ES")}`}
      />

      <div className="mt-4 flex items-center gap-3">
        <BadgeEstado estado={examen.estado} />
        {examen.es_critico && (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-bold border border-red-300">
            RESULTADO CRITICO
          </span>
        )}
      </div>

      {/* Info del paciente */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Paciente</h2>
          <p className="font-medium">
            {examen.paciente_nombre} {examen.paciente_apellido}
          </p>
          <p className="text-sm text-gray-500">CI: {examen.paciente_ci}</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Medico Solicitante</h2>
          <p className="font-medium">
            Dr(a). {examen.medico_nombre} {examen.medico_apellido}
          </p>
          <p className="text-sm text-gray-500">{examen.especialidad}</p>
        </div>
      </div>

      {examen.observaciones_solicitud && (
        <div className="mt-4 border rounded p-4">
          <h2 className="font-semibold mb-1">Observaciones de la solicitud</h2>
          <p className="text-sm">{examen.observaciones_solicitud}</p>
        </div>
      )}

      {examen.tecnico_username && (
        <div className="mt-4 text-sm text-gray-600">
          Procesado por: <span className="font-medium">{examen.tecnico_username}</span>
        </div>
      )}

      {/* Resultado (si COMPLETADO) */}
      {examen.estado === "COMPLETADO" && examen.resultado && (
        <div className="mt-6 border-2 rounded p-4 bg-gray-50 border-green-300">
          <h2 className="font-semibold mb-3">Resultado del Examen</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Resultado</label>
              <p className="text-sm bg-white border rounded p-3">{examen.resultado}</p>
            </div>
            {examen.valores_referencia && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Valores de Referencia</label>
                <p className="text-sm bg-white border rounded p-3">{examen.valores_referencia}</p>
              </div>
            )}
            {examen.resultado_observaciones && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
                <p className="text-sm bg-white border rounded p-3">{examen.resultado_observaciones}</p>
              </div>
            )}
            {examen.fecha_resultado && (
              <p className="text-xs text-gray-500">
                Fecha de resultado: {new Date(examen.fecha_resultado).toLocaleString("es-ES")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Boton Tomar Examen (Tecnico + SOLICITADO) */}
      {puedeTomar && (
        <div className="mt-6">
          <Button
            variant="primary"
            onClick={async () => {
              const res = await fetch(`/api/laboratorio/examenes/${id}/tomar`, { method: "PATCH" });
              if (res.ok) {
                setExamen((prev) =>
                  prev
                    ? {
                        ...prev,
                        estado: "EN_PROCESO",
                        tecnico_username: sesion?.usuario.username || "",
                      }
                    : prev
                );
              } else {
                const data = await res.json();
                setError(data.error || "Error al tomar examen");
              }
            }}
          >
            Tomar Examen
          </Button>
        </div>
      )}

      {/* Formulario de Resultado (Tecnico + EN_PROCESO) */}
      {puedeResultado && (
        <div className="mt-6 border-2 rounded p-4 bg-green-50 border-green-300">
          <h2 className="font-semibold mb-3">Registrar Resultado</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Resultado *</label>
              <textarea
                value={resultadoForm.resultado}
                onChange={(e) => setResultadoForm({ ...resultadoForm, resultado: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={4}
                placeholder="Describa los resultados del examen..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valores de Referencia</label>
              <textarea
                value={resultadoForm.valores_referencia}
                onChange={(e) => setResultadoForm({ ...resultadoForm, valores_referencia: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={2}
                placeholder="Valores normales de referencia..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Observaciones</label>
              <textarea
                value={resultadoForm.observaciones}
                onChange={(e) => setResultadoForm({ ...resultadoForm, observaciones: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={2}
                placeholder="Observaciones adicionales..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="es_critico"
                checked={resultadoForm.es_critico}
                onChange={(e) => setResultadoForm({ ...resultadoForm, es_critico: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="es_critico" className="text-sm font-medium text-red-700">
                Resultado Critico (genera notificacion urgente al medico tratante)
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={registrarResultado}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Registrar Resultado"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
