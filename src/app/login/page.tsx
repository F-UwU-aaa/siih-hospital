"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seguridad/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesion");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold">
            S
          </div>
          <h1 className="text-2xl font-bold text-text-primary">SIIH</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Hospital Universitario San Andres
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border-card bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-danger-bg border border-danger px-4 py-3 text-sm font-medium text-danger">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-border-card px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ingrese su usuario"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-card px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ingrese su contrasena"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
