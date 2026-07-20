"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BadgeEstado, PageHeader, Button } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
}

interface Hospitalizacion {
  id: number;
  paciente_ci: string;
  paciente_nombre: string;
  paciente_apellido: string;
  numero_cama: string;
  piso: string;
  sala: string;
  cama_tipo: string;
  diagnostico_ingreso: string;
  estado: string;
  fecha_ingreso: string;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  alergias_count: number;
}

export default function HospitalizacionPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [hospitalizaciones, setHospitalizaciones] = useState<Hospitalizacion[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!sesion) return;
    fetch("/api/hospitalizacion")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (Array.isArray(data)) setHospitalizaciones(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sesion]);

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!sesion) return <div className="p-8">No autenticado</div>;

  return (
    <div className="min-h-screen bg-bg-page p-8 max-w-6xl">
      <PageHeader title={esEnfermera ? "Mis Pacientes - Hospitalizacion" : "Hospitalizacion"} />

      {hospitalizaciones.length === 0 ? (
        <p className="text-gray-500">
          {esEnfermera
            ? "No hay pacientes hospitalizados activos actualmente"
            : "No hay hospitalizaciones registradas"}
        </p>
      ) : esEnfermera ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitalizaciones.map((h) => (
            <Link
              key={h.id}
              href={`/hospitalizacion/${h.id}`}
              className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                h.alergias_count > 0
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {h.alergias_count > 0 && (
                <div className="bg-red-700 text-white text-xs font-bold px-3 py-1 rounded mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  {h.alergias_count} ALERGIA{h.alergias_count > 1 ? "S" : ""}
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">
                    {h.paciente_nombre} {h.paciente_apellido}
                  </h3>
                  <p className="text-sm text-gray-500">CI: {h.paciente_ci}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  Cama {h.numero_cama}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Piso {h.piso} - {h.sala} ({h.cama_tipo})
              </p>
              <p className="text-sm mb-2">
                <span className="font-medium">Dx:</span> {h.diagnostico_ingreso}
              </p>
              <p className="text-xs text-gray-500">
                Ingreso: {new Date(h.fecha_ingreso).toLocaleDateString("es-ES")}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Paciente</th>
                <th className="text-left px-3 py-2">Cama</th>
                <th className="text-left px-3 py-2">Piso/Sala</th>
                <th className="text-left px-3 py-2">Diagnostico</th>
                <th className="text-left px-3 py-2">Medico</th>
                <th className="text-left px-3 py-2">Estado</th>
                <th className="text-left px-3 py-2">Ingreso</th>
                <th className="text-left px-3 py-2">Alergias</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hospitalizaciones.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={`/hospitalizacion/${h.id}`} className="text-blue-600 hover:underline">
                      #{h.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {h.paciente_nombre} {h.paciente_apellido}
                  </td>
                  <td className="px-3 py-2">{h.numero_cama}</td>
                  <td className="px-3 py-2">{h.piso}/{h.sala}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate">{h.diagnostico_ingreso}</td>
                  <td className="px-3 py-2">Dr. {h.medico_nombre} {h.medico_apellido}</td>
                  <td className="px-3 py-2">
                    <BadgeEstado estado={h.estado} />
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {new Date(h.fecha_ingreso).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-3 py-2">
                    {h.alergias_count > 0 && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">
                        {h.alergias_count}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
