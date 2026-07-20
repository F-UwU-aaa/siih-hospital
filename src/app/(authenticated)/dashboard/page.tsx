"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard, PageHeader } from "@/components/ui";

interface Sesion {
  usuario: { id: number; username: string; rol_nombre: string };
  permisos: { modulo: string; accion: string }[];
}

interface ModuloInfo {
  modulo: string;
  label: string;
  href: string;
  desc: string;
  icon: string;
}

const modulos: ModuloInfo[] = [
  { modulo: "HISTORIAL", label: "Pacientes", href: "/pacientes", desc: "Gestion de pacientes e historial clinico", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { modulo: "CITAS", label: "Citas", href: "/citas", desc: "Agendamiento y gestion de citas", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { modulo: "ATENCION", label: "Atencion Medica", href: "/atencion", desc: "Consultas, recetas, examenes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { modulo: "LABORATORIO", label: "Laboratorio", href: "/laboratorio", desc: "Solicitud y procesamiento de examenes", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  { modulo: "FARMACIA", label: "Farmacia", href: "/farmacia", desc: "Inventario, recetas, dispensacion", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { modulo: "HOSPITALIZACION", label: "Hospitalizacion", href: "/hospitalizacion", desc: "Ingresos, signos vitales, altas", icon: "M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
  { modulo: "COMPRAS", label: "Compras", href: "/compras", desc: "Compras a proveedores", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" },
  { modulo: "FACTURACION", label: "Facturacion", href: "/facturacion", desc: "Facturacion y cobros", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
  { modulo: "REPORTES", label: "Reportes", href: "/reportes", desc: "Reportes e indicadores BI", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { modulo: "SEGURIDAD", label: "Seguridad", href: "/seguridad", desc: "Usuarios, roles, auditoria", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
];

export default function DashboardPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSesion)
      .catch(() => {});
  }, []);

  if (!sesion) return null;

  const permisos = sesion.permisos.map((p) => p.modulo);
  const visibles = modulos.filter((m) => permisos.includes(m.modulo));

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${sesion.usuario.username}`}
        subtitle={`Rol: ${sesion.usuario.rol_nombre}`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group flex items-start gap-4 rounded-xl border border-border-card bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-primary">{m.label}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
