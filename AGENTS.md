# AGENTS.md — SIIH

## Project overview

Hospital Information System (Sistema Integrado de Informacion Hospitalaria) for Hospital Universitario San Andres. Single Next.js 16 monolith: React frontend + API Routes backend + PostgreSQL (no ORM).

## Commands

```bash
npm run dev          # Start dev server on :3000 (Turbopack)
npm run build        # Production build — use this to verify TS + compilation
npm run lint         # ESLint
npx next build       # Alternative to npm run build
```

No test framework installed yet. No CI configured.

## Architecture

- **Framework:** Next.js 16 (App Router) + TypeScript strict
- **Database:** PostgreSQL via `pg` (raw SQL, no ORM). Connection pool in `src/lib/db.ts`.
- **Auth:** Signed httpOnly cookie (HMAC-SHA256). See `src/lib/session.ts`. Session payload: `{ usuario_id, rol_id, username }`.
- **RBAC:** `src/lib/rbac.ts` — `verificarPermiso(usuario_id, modulo, accion)` checks `rol_permiso` table.
- **Password hashing:** bcrypt via `src/lib/hash.ts`.
- **Audit logging:** `src/lib/auditoria.ts` — `registrarAuditoria()` inserts into `auditoria` table.
- **Notifications:** `src/lib/notificaciones.ts` — `crearNotificacion()` inserts into `notificacion` (pending delivery only).

## Path alias

`@/*` maps to `./src/*` (tsconfig). All lib imports use `@/lib/...`.

**Important:** Lib files live in `src/lib/`, not a root `lib/` directory. If you put files in root `lib/`, the `@/lib/*` alias will not resolve them.

## Database

- **Connection:** `DATABASE_URL` in `.env.local`, user `postgres`, database `siih_db`.
- **Schema:** `db/schema.sql` (33 tables). Run with `psql -U postgres -d siih_db -f db/schema.sql`.
- **Seed permissions:** `db/seed_permisos.sql`. Run after schema.
- **Seed médicos:** `db/seed_medicos.sql` (4 example doctors with specialties). Run after schema.
- **PostgreSQL path on this machine:** `"C:\Program Files\PostgreSQL\15\bin\psql.exe"` — `psql` is not on PATH.
- **DB password:** `123456` (same for PGPASSWORD env var and DATABASE_URL).

## Key patterns

### API routes (`src/app/api/`)

Every protected endpoint follows this pattern:
```ts
import pool from "@/lib/db";
import { getSesionActual } from "@/lib/session";
import { verificarPermiso } from "@/lib/rbac";

export async function GET(request: Request) {
  const sesion = await getSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!await verificarPermiso(sesion.usuario_id, "MODULO", "READ")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }
  // ... query DB with pool.query()
}
```

### App Router dynamic routes

Static routes MUST be created on the filesystem BEFORE `[id]` routes. Example: `api/pacientes/buscar/route.ts` must exist before `api/pacientes/[id]/route.ts` or Next.js captures `buscar` as an `id` param.

### `params` type

Next.js 16 App Router: `params` is a `Promise`, not a plain object:
```ts
{ params }: { params: Promise<{ id: string }> }
// Must await: const { id } = await params;
```

### Transactions

Multi-table inserts (e.g., crear paciente + historial_clinico) use `pool.connect()` + `BEGIN/COMMIT/ROLLBACK`:
```ts
const client = await pool.connect();
try {
  await client.query("BEGIN");
  // ... multiple queries ...
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
}
```

## Permissions system (sección 9)

Rol → Permiso mapping is seeded in `db/seed_permisos.sql`. Permission modules: `CITAS`, `HISTORIAL`, `ATENCION`, `LABORATORIO`, `FARMACIA`, `HOSPITALIZACION`, `FACTURACION`, `COMPRAS`, `REPORTES`, `SEGURIDAD`, `AUDITORIA`. Actions: `READ`, `WRITE`.

Roles: ADMIN, DIRECTOR, MEDICO, ENFERMERA, FARMACEUTICO, TECNICO_LAB, ADMISIONISTA, FACTURADOR, PACIENTE.

## Implemented modules (Etapa 0–3)

| Etapa | Module | Status |
|---|---|---|
| 0 | Project scaffold + DB schema | Done |
| 1 | Seguridad (login, RBAC, usuarios CRUD, auditoria) | Done |
| 2 | Pacientes + Historial Clinico (CU-01, CU-04, CU-10 partial) | Done |
| 3 | Citas (CU-02, CU-10 agendamiento, reprogramar) | Done |

Not yet implemented: Atencion Medica (CU-03), Laboratorio, Farmacia, Hospitalizacion, Facturacion, Compras, Reportes.

## Gotchas

- `.env.local` is gitignored. `.env.local.example` is committed — keep it updated.
- The `paciente` table FK `registrado_por` is a deferred FK (added via ALTER TABLE after `usuario` is created, since there's a circular dependency).
- `SESSION_SECRET` must be set in `.env.local` or session signing fails silently.
- All business logic runs server-side in API Routes. No client-side DB access.
- `lib/db.ts` exports a singleton `Pool` — never create new pools per request.
- `medico.horario_atencion` is a `TEXT` column storing JSON. Use `E'{"lunes":[...]}'` (PostgreSQL escape syntax) in seed SQL — standard double-quotes get stripped by psql.
