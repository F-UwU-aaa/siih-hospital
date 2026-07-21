"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEST_CREDENTIALS } from "@/config/testCredentials";

const IS_DEV = process.env.NODE_ENV !== "production";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [highlighted, setHighlighted] = useState(false);

  const fillCredentials = (usuario: string, contrasena: string) => {
    setUsername(usuario);
    setPassword(contrasena);
    setHighlighted(true);
    setTimeout(() => setHighlighted(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (IS_DEV) setShowQuickLogin(false);
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

  const inputClass =
    "w-full rounded-lg border border-border-card px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300" +
    (highlighted ? " ring-2 ring-primary/40 border-primary" : "");

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
        <div className="relative rounded-xl border border-border-card bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit}>
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
                className={inputClass}
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
                className={inputClass}
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

          {IS_DEV && (
            <button
              type="button"
              onClick={() => setShowQuickLogin(!showQuickLogin)}
              className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-border-card bg-white text-sm shadow-sm transition-colors hover:bg-gray-50"
              title="Acceso rapido (solo desarrollo)"
            >
              🧪
            </button>
          )}

          {IS_DEV && showQuickLogin && (
            <div className="mt-4 border-t border-border-card pt-4">
              <p className="mb-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wide">
                Acceso rapido
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TEST_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.rol}
                    type="button"
                    onClick={() => fillCredentials(cred.usuario, cred.contrasena)}
                    className="rounded-lg border border-border-card bg-bg-page px-2 py-2 text-xs font-medium text-text-primary transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    {cred.rol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
