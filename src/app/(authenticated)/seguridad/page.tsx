"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import AlertBanner from "@/components/ui/AlertBanner";
import BadgeEstado from "@/components/ui/BadgeEstado";

interface Usuario {
  id: number;
  username: string;
  email: string | null;
  rol_nombre: string;
  nombre_completo: string;
  activo: boolean;
  ultimo_acceso: string | null;
}

interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  total_permisos: number;
}

interface Permiso {
  id: number;
  nombre: string;
  modulo: string;
  accion: string;
}

interface AuditoriaEntry {
  id: number;
  usuario_id: number;
  username: string;
  tabla_afectada: string;
  accion: string;
  registro_id: number | null;
  detalle: string | null;
  fecha_hora: string;
  ip_origen: string | null;
}

export default function SeguridadPage() {
  const [tab, setTab] = useState<"usuarios" | "roles" | "auditoria">("usuarios");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!d?.usuario_id) router.push("/login"); })
      .catch(() => router.push("/login"));
  }, [router]);

  return (
    <div className="space-y-6">
      <PageHeader title="Seguridad" subtitle="Gestion de usuarios, roles y auditoria" />

      {error && <AlertBanner variant="danger" title="Error">{error}</AlertBanner>}

      <div className="flex gap-1 border-b border-slate-200">
        {(["usuarios", "roles", "auditoria"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-teal-700 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "usuarios" ? "Usuarios" : t === "roles" ? "Roles y Permisos" : "Auditoria"}
          </button>
        ))}
      </div>

      {tab === "usuarios" && <UsuariosTab onError={setError} />}
      {tab === "roles" && <RolesTab onError={setError} />}
      {tab === "auditoria" && <AuditoriaTab onError={setError} />}
    </div>
  );
}

function UsuariosTab({ onError }: { onError: (m: string) => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seguridad/usuarios");
      if (res.ok) setUsuarios(await res.json());
      else onError("Error al cargar usuarios");
    } catch {
      onError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleActivo = async (id: number) => {
    try {
      const res = await fetch(`/api/seguridad/usuarios/${id}/toggle-activo`, { method: "PATCH" });
      if (res.ok) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
        );
      } else {
        const data = await res.json();
        onError(data.error || "Error al cambiar estado");
      }
    } catch {
      onError("Error de conexion");
    }
  };

  if (loading) return <p className="text-slate-500 text-center py-8">Cargando usuarios...</p>;

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-3 font-medium text-slate-600">ID</th>
              <th className="text-left py-3 px-3 font-medium text-slate-600">Username</th>
              <th className="text-left py-3 px-3 font-medium text-slate-600">Nombre</th>
              <th className="text-left py-3 px-3 font-medium text-slate-600">Rol</th>
              <th className="text-left py-3 px-3 font-medium text-slate-600">Email</th>
              <th className="text-center py-3 px-3 font-medium text-slate-600">Estado</th>
              <th className="text-center py-3 px-3 font-medium text-slate-600">Accion</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3">{u.id}</td>
                <td className="py-3 px-3 font-medium text-slate-900">{u.username}</td>
                <td className="py-3 px-3">{u.nombre_completo || "-"}</td>
                <td className="py-3 px-3"><BadgeEstado estado={u.rol_nombre} /></td>
                <td className="py-3 px-3 text-slate-500">{u.email || "-"}</td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    u.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => toggleActivo(u.id)}
                    className={`text-xs font-medium ${
                      u.activo ? "text-red-600 hover:text-red-800" : "text-emerald-600 hover:text-emerald-800"
                    }`}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolesTab({ onError }: { onError: (m: string) => void }) {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedRol, setSelectedRol] = useState<number | null>(null);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermisos, setLoadingPermisos] = useState(false);

  const cargarRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seguridad/roles");
      if (res.ok) setRoles(await res.json());
      else onError("Error al cargar roles");
    } catch {
      onError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { cargarRoles(); }, [cargarRoles]);

  const cargarPermisos = async (rolId: number) => {
    setSelectedRol(rolId);
    setLoadingPermisos(true);
    try {
      const res = await fetch(`/api/seguridad/roles/${rolId}/permisos`);
      if (res.ok) setPermisos(await res.json());
      else onError("Error al cargar permisos");
    } catch {
      onError("Error de conexion");
    } finally {
      setLoadingPermisos(false);
    }
  };

  if (loading) return <p className="text-slate-500 text-center py-8">Cargando roles...</p>;

  const modulos = [...new Set(permisos.map((p) => p.modulo))].sort();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Roles del Sistema</h3>
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => cargarPermisos(r.id)}
              className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors ${
                selectedRol === r.id
                  ? "bg-teal-50 border border-teal-300 text-teal-800"
                  : "border border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="text-left">
                <p className="font-medium">{r.nombre}</p>
                {r.descripcion && <p className="text-xs text-slate-500 mt-0.5">{r.descripcion}</p>}
              </div>
              <span className="text-xs text-slate-400">{r.total_permisos} permisos</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">
          {selectedRol ? `Permisos del Rol #${selectedRol}` : "Seleccione un rol"}
        </h3>
        {loadingPermisos ? (
          <p className="text-slate-500 text-center py-4">Cargando permisos...</p>
        ) : selectedRol && permisos.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Este rol no tiene permisos</p>
        ) : selectedRol ? (
          <div className="space-y-3">
            {modulos.map((mod) => {
              const modPermisos = permisos.filter((p) => p.modulo === mod);
              return (
                <div key={mod}>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{mod}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {modPermisos.map((p) => (
                      <span
                        key={p.id}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          p.accion === "WRITE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {p.accion === "WRITE" ? "Escritura" : "Lectura"}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Haga clic en un rol para ver sus permisos</p>
        )}
      </div>
    </div>
  );
}

function AuditoriaTab({ onError }: { onError: (m: string) => void }) {
  const [registros, setRegistros] = useState<AuditoriaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTabla, setFiltroTabla] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTabla) params.set("tabla_afectada", filtroTabla);
      if (filtroAccion) params.set("accion", filtroAccion);
      const res = await fetch(`/api/seguridad/auditoria?${params.toString()}`);
      if (res.ok) setRegistros(await res.json());
      else onError("Error al cargar auditoria");
    } catch {
      onError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }, [filtroTabla, filtroAccion, onError]);

  useEffect(() => { cargar(); }, [cargar]);

  const getAccionBadge = (accion: string) => {
    const styles: Record<string, string> = {
      INSERT: "bg-emerald-100 text-emerald-700",
      UPDATE: "bg-blue-100 text-blue-700",
      DELETE: "bg-red-100 text-red-700",
      ANULACION: "bg-red-100 text-red-700",
      ACTIVAR: "bg-emerald-100 text-emerald-700",
      DESACTIVAR: "bg-amber-100 text-amber-700",
    };
    return styles[accion] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tabla</label>
          <select
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todas</option>
            <option value="usuario">usuario</option>
            <option value="cita">cita</option>
            <option value="paciente">paciente</option>
            <option value="atencion">atencion</option>
            <option value="receta">receta</option>
            <option value="inventario">inventario</option>
            <option value="factura">factura</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Accion</label>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Todas</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="ANULACION">ANULACION</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-8">Cargando registros...</p>
      ) : registros.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No hay registros de auditoria</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Fecha</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Usuario</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Tabla</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Accion</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">#</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(r.fecha_hora).toLocaleString("es-VE")}
                  </td>
                  <td className="py-2 px-3 font-medium">{r.username}</td>
                  <td className="py-2 px-3"><BadgeEstado estado={r.tabla_afectada} /></td>
                  <td className="py-2 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getAccionBadge(r.accion)}`}>
                      {r.accion}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500">{r.registro_id ?? "-"}</td>
                  <td className="py-2 px-3 text-xs text-slate-500 max-w-xs truncate">{r.detalle || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
