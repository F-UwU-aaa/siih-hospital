"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import AlertBanner from "@/components/ui/AlertBanner";
import BadgeEstado from "@/components/ui/BadgeEstado";
import AuditoriaTab from "@/components/AuditoriaTab";

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

const ROLES_LIST = [
  "ADMIN", "DIRECTOR", "MEDICO", "ENFERMERA", "FARMACEUTICO",
  "TECNICO_LAB", "ADMISIONISTA", "FACTURADOR", "PACIENTE",
];

export default function SeguridadPage() {
  const [tab, setTab] = useState<"usuarios" | "roles" | "auditoria">("usuarios");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/seguridad/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!d?.usuario?.id) router.push("/login"); })
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
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [creando, setCreando] = useState(false);

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
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setCreando(true); setEditando(null); }}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Nuevo Usuario
        </button>
      </div>

      {(creando || editando) && (
        <FormularioUsuario
          usuario={editando}
          onGuardar={() => { setCreando(false); setEditando(null); cargar(); }}
          onCancelar={() => { setCreando(false); setEditando(null); }}
          onError={onError}
        />
      )}

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
                <th className="text-center py-3 px-3 font-medium text-slate-600">Acciones</th>
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
                  <td className="py-3 px-3 text-center space-x-2">
                    <button
                      onClick={() => { setEditando(u); setCreando(false); }}
                      className="text-teal-700 hover:text-teal-900 text-xs font-medium"
                    >
                      Editar
                    </button>
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
    </div>
  );
}

function FormularioUsuario({
  usuario,
  onGuardar,
  onCancelar,
  onError,
}: {
  usuario: Usuario | null;
  onGuardar: () => void;
  onCancelar: () => void;
  onError: (m: string) => void;
}) {
  const esEdicion = !!usuario;
  const [username, setUsername] = useState(usuario?.username || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [rolNombre, setRolNombre] = useState(usuario?.rol_nombre || "");
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMsg("");
    try {
      if (esEdicion) {
        const body: Record<string, unknown> = {};
        if (username !== usuario!.username) body.username = username;
        if (email !== (usuario!.email || "")) body.email = email || null;
        if (rolNombre !== usuario!.rol_nombre) body.rol_nombre = rolNombre;
        if (password) body.password = password;

        if (Object.keys(body).length === 0) {
          setMsg("Sin cambios para guardar");
          setGuardando(false);
          return;
        }

        const res = await fetch(`/api/seguridad/usuarios/${usuario!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok) {
          onGuardar();
        } else {
          onError(data.error || "Error al actualizar");
        }
      } else {
        if (!username || !password || !rolNombre) {
          onError("Username, password y rol son requeridos");
          setGuardando(false);
          return;
        }
        const res = await fetch("/api/seguridad/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, email: email || null, rol_nombre: rolNombre }),
        });
        const data = await res.json();
        if (res.ok) {
          onGuardar();
        } else {
          onError(data.error || "Error al crear usuario");
        }
      }
    } catch {
      onError("Error de conexion");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-3">
        {esEdicion ? `Editar Usuario: ${usuario!.username}` : "Nuevo Usuario"}
      </h3>
      {msg && <p className="text-sm text-amber-600 mb-2">{msg}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
            <select
              value={rolNombre}
              onChange={(e) => setRolNombre(e.target.value)}
              required
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Seleccionar rol...</option>
              {ROLES_LIST.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {esEdicion ? "Nueva contraseña (dejar vacio para no cambiar)" : "Contraseña"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!esEdicion}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {guardando ? "Guardando..." : esEdicion ? "Guardar Cambios" : "Crear Usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RolesTab({ onError }: { onError: (m: string) => void }) {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedRol, setSelectedRol] = useState<number | null>(null);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [todosLosPermisos, setTodosLosPermisos] = useState<Permiso[]>([]);
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

  useEffect(() => {
    fetch("/api/seguridad/roles/1/permisos")
      .then(() => fetch("/api/seguridad/roles"))
      .then((r) => r.ok ? r.json() : [])
      .then(() => {
        const modulos = ["CITAS", "HISTORIAL", "ATENCION", "LABORATORIO", "FARMACIA", "HOSPITALIZACION", "FACTURACION", "COMPRAS", "REPORTES", "SEGURIDAD", "AUDITORIA"];
        const acciones = ["READ", "WRITE"];
        const all: Permiso[] = [];
        let id = 1;
        for (const mod of modulos) {
          for (const acc of acciones) {
            all.push({ id: id++, nombre: `${mod} ${acc}`, modulo: mod, accion: acc });
          }
        }
        setTodosLosPermisos(all);
      })
      .catch(() => {});
  }, []);

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

  const togglePermiso = async (permisoId: number, tienePermiso: boolean) => {
    if (!selectedRol) return;
    try {
      const method = tienePermiso ? "DELETE" : "POST";
      const res = await fetch(`/api/seguridad/roles/${selectedRol}/permisos`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permiso_id: permisoId }),
      });
      if (res.ok) {
        cargarPermisos(selectedRol);
        cargarRoles();
      } else {
        const data = await res.json();
        onError(data.error || "Error al modificar permiso");
      }
    } catch {
      onError("Error de conexion");
    }
  };

  if (loading) return <p className="text-slate-500 text-center py-8">Cargando roles...</p>;

  const modulos = [...new Set(todosLosPermisos.map((p) => p.modulo))].sort();

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
          {selectedRol ? `Permisos del Rol` : "Seleccione un rol"}
        </h3>
        {loadingPermisos ? (
          <p className="text-slate-500 text-center py-4">Cargando permisos...</p>
        ) : selectedRol ? (
          <div className="space-y-3">
            {modulos.map((mod) => {
              const todosMod = todosLosPermisos.filter((p) => p.modulo === mod);
              return (
                <div key={mod}>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{mod}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {todosMod.map((p) => {
                      const tiene = permisos.some((pp) => pp.modulo === p.modulo && pp.accion === p.accion);
                      return (
                        <button
                          key={`${p.modulo}-${p.accion}`}
                          onClick={() => togglePermiso(p.id, tiene)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                            tiene
                              ? p.accion === "WRITE"
                                ? "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
                                : "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {tiene ? "✓ " : ""}{p.accion === "WRITE" ? "Escritura" : "Lectura"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-4">Haga clic en un rol para editar sus permisos</p>
        )}
      </div>
    </div>
  );
}


