"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Button } from "@/components/ui";

export default function NuevoPacientePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [crearUsuario, setCrearUsuario] = useState(false);

  const [form, setForm] = useState({
    ci: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    sexo: "",
    direccion: "",
    telefono: "",
    email: "",
    seguro_medico: "",
    password: "",
  });

  const [alergias, setAlergias] = useState<Array<{
    sustancia: string;
    reaccion: string;
    severidad: string;
  }>>([]);

  const set = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const agregarAlergia = () => {
    setAlergias([...alergias, { sustancia: "", reaccion: "", severidad: "" }]);
  };

  const actualizarAlergia = (idx: number, campo: string, valor: string) => {
    const copia = [...alergias];
    (copia[idx] as Record<string, string>)[campo] = valor;
    setAlergias(copia);
  };

  const eliminarAlergia = (idx: number) => {
    setAlergias(alergias.filter((_, i) => i !== idx));
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setExito("");

    const body = {
      ...form,
      alergias: alergias.filter((a) => a.sustancia.trim() !== ""),
      crear_usuario: crearUsuario,
    };

    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.paciente) {
          setError(
            `CI duplicada. Ya existe: ${data.paciente.nombre} ${data.paciente.apellido} (ID: ${data.paciente.id})`
          );
        } else {
          setError(data.error || "Error al registrar");
        }
        return;
      }

      setExito(
        `Paciente registrado (ID: ${data.paciente.id}). Historial creado: #${data.historial_clinico_id}`
      );
      setTimeout(() => router.push(`/pacientes/${data.paciente.id}`), 1500);
    } catch {
      setError("Error de conexión");
    }
  };

  return (
    <div className="min-h-screen bg-bg-page p-8 max-w-2xl">
      <PageHeader title="Registrar Nuevo Paciente" />

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

      <form onSubmit={enviar} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">CI *</label>
            <input
              type="text"
              required
              value={form.ci}
              onChange={(e) => set("ci", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Fecha Nacimiento *
            </label>
            <input
              type="date"
              required
              value={form.fecha_nacimiento}
              onChange={(e) => set("fecha_nacimiento", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Apellido *
            </label>
            <input
              type="text"
              required
              value={form.apellido}
              onChange={(e) => set("apellido", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sexo</label>
            <select
              value={form.sexo}
              onChange={(e) => set("sexo", e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccionar</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="O">O</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Seguro Médico
            </label>
            <input
              type="text"
              value={form.seguro_medico}
              onChange={(e) => set("seguro_medico", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Alergias iniciales */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">
              Alergias iniciales (opcional)
            </h2>
            <Button
              type="button"
              onClick={agregarAlergia}
              variant="secondary"
            >
              + Agregar
            </Button>
          </div>
          {alergias.map((a, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Sustancia"
                value={a.sustancia}
                onChange={(e) => actualizarAlergia(idx, "sustancia", e.target.value)}
                className="border rounded px-2 py-1 flex-1"
              />
              <input
                type="text"
                placeholder="Reacción"
                value={a.reaccion}
                onChange={(e) => actualizarAlergia(idx, "reaccion", e.target.value)}
                className="border rounded px-2 py-1 flex-1"
              />
              <select
                value={a.severidad}
                onChange={(e) => actualizarAlergia(idx, "severidad", e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">Severidad</option>
                <option value="LEVE">Leve</option>
                <option value="MODERADA">Moderada</option>
                <option value="GRAVE">Grave</option>
              </select>
              <Button
                type="button"
                onClick={() => eliminarAlergia(idx)}
                variant="secondary"
              >
                ✗
              </Button>
            </div>
          ))}
        </div>

        {/* Crear usuario PACIENTE */}
        <div className="border-t pt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={crearUsuario}
              onChange={(e) => setCrearUsuario(e.target.checked)}
            />
            <span className="text-sm font-medium">
              Crear usuario PACIENTE (para acceso a la app)
            </span>
          </label>
          {crearUsuario && (
            <div className="mt-2">
              <label className="block text-sm text-gray-600 mb-1">
                Password (username será la CI)
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full border rounded px-3 py-2"
                required={crearUsuario}
              />
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
        >
          Registrar Paciente
        </Button>
      </form>
    </div>
  );
}
