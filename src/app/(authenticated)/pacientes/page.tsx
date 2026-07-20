"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader, Button } from "@/components/ui";

interface Paciente {
  id: number;
  ci: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPacientes("");
  }, []);

  const cargarPacientes = async (q: string) => {
    setCargando(true);
    try {
      const params = q ? `?busqueda=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/pacientes${params}`);
      if (res.ok) {
        const data = await res.json();
        setPacientes(data);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarPacientes(busqueda);
  };

  return (
    <div className="min-h-screen bg-bg-page p-8">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Pacientes" />
        <Link
          href="/pacientes/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nuevo Paciente
        </Link>
      </div>

      <form onSubmit={buscar} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por CI, nombre o apellido..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : pacientes.length === 0 ? (
        <p className="text-gray-500">No se encontraron pacientes</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">CI</th>
              <th className="border p-2 text-left">Nombre</th>
              <th className="border p-2 text-left">Apellido</th>
              <th className="border p-2 text-left">Teléfono</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-center">Activo</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="border p-2">
                  <Link
                    href={`/pacientes/${p.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {p.ci}
                  </Link>
                </td>
                <td className="border p-2">{p.nombre}</td>
                <td className="border p-2">{p.apellido}</td>
                <td className="border p-2">{p.telefono || "-"}</td>
                <td className="border p-2">{p.email || "-"}</td>
                <td className="border p-2 text-center">
                  {p.activo ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
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
