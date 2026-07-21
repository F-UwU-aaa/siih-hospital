"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import AuditoriaTab from "@/components/AuditoriaTab";

export default function AuditoriaPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.usuario?.id) {
          router.push("/login");
          return;
        }
        const tienePermiso = data.permisos?.some(
          (p: { modulo: string; accion: string }) => p.modulo === "AUDITORIA" && p.accion === "READ"
        );
        if (!tienePermiso) {
          router.push("/dashboard");
          return;
        }
        setAutorizado(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (autorizado === null) {
    return (
      <div className="min-h-screen bg-bg-page p-8">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" subtitle="Registro de actividad del sistema" />
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      <AuditoriaTab onError={setError} />
    </div>
  );
}
