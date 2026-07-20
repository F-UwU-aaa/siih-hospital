"use client";

import { useState, useEffect } from "react";
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
  paciente_ci: string;
  paciente_nombre: string;
  paciente_apellido: string;
  tecnico_username: string | null;
  resultado: string | null;
  es_critico: boolean | null;
  fecha_resultado: string | null;
}

interface CargaTipo {
  tipo_examen: string;
  cantidad: number;
}

interface Carga {
  total_en_proceso: number;
  por_tipo: CargaTipo[];
}

export default function LaboratorioPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [carga, setCarga] = useState<Carga | null>(null);
  const [loading, setLoading] = useState(true);
  const [tomandoId, setTomandoId] = useState<number | null>(null);

  const rol = sesion?.usuario.rol_nombre;
  const esMedico = rol === "MEDICO";
  const esTecnico = rol === "TECNICO_LAB";

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sesion) return;
    Promise.all([
      fetch("/api/laboratorio/examenes").then((r) => (r.ok ? r.json() : [])),
      esMedico ? fetch("/api/laboratorio/carga").then((r) => (r.ok ? r.json() : null)) : Promise.resolve(null),
    ])
      .then(([examData, cargaData]) => {
        if (Array.isArray(examData)) setExamenes(examData);
        if (cargaData) setCarga(cargaData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sesion, esMedico]);

  const tomarExamen = async (id: number) => {
    setTomandoId(id);
    try {
      const res = await fetch(`/api/laboratorio/examenes/${id}/tomar`, {
        method: "PATCH",
      });
      if (res.ok) {
        setExamenes((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, estado: "EN_PROCESO", tecnico_username: sesion?.usuario.username || "" } : e
          )
        );
      }
    } catch {
    } finally {
      setTomandoId(null);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!sesion) return <div className="p-8">No autenticado</div>;

  const pendientes = examenes.filter((e) => e.estado === "SOLICITADO");
  const enProceso = examenes.filter((e) => e.estado === "EN_PROCESO");
  const completados = examenes.filter((e) => e.estado === "COMPLETADO");

  return (
    <div className="min-h-screen bg-bg-page p-8 max-w-6xl">
      <PageHeader title="Laboratorio" />

      {/* Vista para Médico */}
      {esMedico && (
        <div className="space-y-6">
          {/* Carga Actual */}
          <div className="border rounded p-4 bg-blue-50 border-blue-200">
            <h2 className="font-semibold mb-3">Carga Actual del Laboratorio</h2>
            {carga && carga.total_en_proceso > 0 ? (
              <div>
                <p className="text-lg font-bold mb-2">{carga.total_en_proceso} examen(es) en proceso</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {carga.por_tipo.map((t, i) => (
                    <div key={i} className="bg-white rounded p-2 border text-sm">
                      <span className="font-medium">{t.tipo_examen}</span>: {t.cantidad}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No hay exámenes en proceso actualmente</p>
            )}
          </div>

          {/* Mis Exámenes */}
          <div>
            <h2 className="font-semibold mb-3">Mis Exámenes</h2>
            {examenes.length === 0 ? (
              <p className="text-gray-500">No tiene exámenes registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">Tipo</th>
                      <th className="text-left px-3 py-2">Paciente</th>
                      <th className="text-left px-3 py-2">Estado</th>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-left px-3 py-2">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {examenes.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <Link href={`/laboratorio/${e.id}`} className="text-blue-600 hover:underline">
                            #{e.id}
                          </Link>
                        </td>
                        <td className="px-3 py-2 font-medium">{e.tipo_examen}</td>
                        <td className="px-3 py-2">{e.paciente_nombre} {e.paciente_apellido}</td>
                        <td className="px-3 py-2">
                          <BadgeEstado estado={e.estado} />
                          {e.es_critico && (
                            <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">
                              CRITICO
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {new Date(e.fecha_solicitud).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-3 py-2 text-xs max-w-[200px] truncate">
                          {e.resultado || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista para Técnico */}
      {esTecnico && (
        <div className="space-y-6">
          {/* Pendientes */}
          <div>
            <h2 className="font-semibold mb-3">
              Exámenes Pendientes
              {pendientes.length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                  {pendientes.length}
                </span>
              )}
            </h2>
            {pendientes.length === 0 ? (
              <p className="text-gray-500">No hay exámenes pendientes</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">Tipo</th>
                      <th className="text-left px-3 py-2">Paciente</th>
                      <th className="text-left px-3 py-2">Solicitado</th>
                      <th className="text-left px-3 py-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendientes.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <Link href={`/laboratorio/${e.id}`} className="text-blue-600 hover:underline">
                            #{e.id}
                          </Link>
                        </td>
                        <td className="px-3 py-2 font-medium">{e.tipo_examen}</td>
                        <td className="px-3 py-2">{e.paciente_nombre} {e.paciente_apellido}</td>
                        <td className="px-3 py-2 text-xs">
                          {new Date(e.fecha_solicitud).toLocaleString("es-ES")}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="primary"
                            onClick={() => tomarExamen(e.id)}
                            disabled={tomandoId === e.id}
                            className="text-xs"
                          >
                            {tomandoId === e.id ? "Tomando..." : "Tomar"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* En Proceso */}
          <div>
            <h2 className="font-semibold mb-3">En Proceso</h2>
            {enProceso.length === 0 ? (
              <p className="text-gray-500">No hay exámenes en proceso</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">Tipo</th>
                      <th className="text-left px-3 py-2">Paciente</th>
                      <th className="text-left px-3 py-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {enProceso.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <Link href={`/laboratorio/${e.id}`} className="text-blue-600 hover:underline">
                            #{e.id}
                          </Link>
                        </td>
                        <td className="px-3 py-2 font-medium">{e.tipo_examen}</td>
                        <td className="px-3 py-2">{e.paciente_nombre} {e.paciente_apellido}</td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/laboratorio/${e.id}`}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Registrar Resultado
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Completados */}
          <div>
            <h2 className="font-semibold mb-3">Completados</h2>
            {completados.length === 0 ? (
              <p className="text-gray-500">No hay exámenes completados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">Tipo</th>
                      <th className="text-left px-3 py-2">Paciente</th>
                      <th className="text-left px-3 py-2">Resultado</th>
                      <th className="text-left px-3 py-2">Crítico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {completados.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <Link href={`/laboratorio/${e.id}`} className="text-blue-600 hover:underline">
                            #{e.id}
                          </Link>
                        </td>
                        <td className="px-3 py-2 font-medium">{e.tipo_examen}</td>
                        <td className="px-3 py-2">{e.paciente_nombre} {e.paciente_apellido}</td>
                        <td className="px-3 py-2 text-xs max-w-[200px] truncate">
                          {e.resultado || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {e.es_critico ? (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">
                              SI
                            </span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Otros roles (admin, director) */}
      {!esMedico && !esTecnico && (
        <div>
          <p className="text-gray-500 mb-4">Vista de solo lectura</p>
          {examenes.length === 0 ? (
            <p className="text-gray-500">No hay exámenes registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2">ID</th>
                    <th className="text-left px-3 py-2">Tipo</th>
                    <th className="text-left px-3 py-2">Paciente</th>
                    <th className="text-left px-3 py-2">Estado</th>
                    <th className="text-left px-3 py-2">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {examenes.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <Link href={`/laboratorio/${e.id}`} className="text-blue-600 hover:underline">
                          #{e.id}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-medium">{e.tipo_examen}</td>
                      <td className="px-3 py-2">{e.paciente_nombre} {e.paciente_apellido}</td>
                      <td className="px-3 py-2">
                        <BadgeEstado estado={e.estado} />
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {new Date(e.fecha_solicitud).toLocaleDateString("es-ES")}
                      </td>
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
