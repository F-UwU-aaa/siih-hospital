# SIIH — Sistema Integrado de Informacion Hospitalaria

Sistema de gestion hospitalaria para el Hospital Universitario San Andres. Incluye seguridad con RBAC, pacientes e historial clinico, citas medicas, laboratorio, farmacia, hospitalizacion, facturacion y notificaciones.

## Requisitos Previos

- **Node.js** 18+
- **PostgreSQL** 15+
- **npm** (incluido con Node.js)

## Inicio Rapido

```bash
# 1. Crear la base de datos
psql -U postgres -c "CREATE DATABASE siih_db"

# 2. Ejecutar el esquema (tablas + datos basicos: roles, admin, camas, tarifas)
psql -U postgres -d siih_db -f db/schema.sql

# 3. Cargar datos de demo completos (permisos, actores, usuarios, pacientes,
#    clinica de ejemplo, farmacia, laboratorio, hospitalizacion, facturacion)
psql -U postgres -d siih_db -f db/seed_demo.sql

# 4. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con las credenciales correctas de PostgreSQL

# 5. Instalar dependencias y arrancar
npm install
npm run dev
```

El servidor se inicia en **http://localhost:3000**.

### Configuracion de `.env.local`

```
DATABASE_URL="postgresql://postgres:123456@localhost:5432/siih_db"
SESSION_SECRET="siih_k8$mP2xQ7nR4vL9wJ3cF6hT0yB5eU1oA8"
```

## Credenciales de Prueba

| Usuario | Contrasena | Rol | Observaciones |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | Administrador del sistema |
| `director_test` | `dir123` | DIRECTOR | Director / Gerencia |
| `dr_test` | `med123` | MEDICO | Dr. Carlos Rodriguez (Medicina General) |
| `nurse_test` | `nurse123` | ENFERMERA | Ana Martinez ( turno manana) |
| `nurse2_test` | `nurse123` | ENFERMERA | Lucia Hernandez (turno tarde) |
| `V-20111222` | `farm123` | FARMACEUTICO | Pedro Rodriguez |
| `V-20333444` | `farm123` | FARMACEUTICO | Laura Fernandez |
| `V-20555666` | `farm123` | FARMACEUTICO | Carlos Mendoza |
| `lab_test` | `lab123` | TECNICO_LAB | Pedro Torres |
| `adm_test` | `adm123` | ADMISIONISTA | Diego Torres |
| `fact_test` | `fact123` | FACTURADOR | Maria Lopez Garcia |
| `V-87654321` | `pac123` | PACIENTE | Maria Garcia (paciente) |

## Datos de Demo

El script `seed_demo.sql` crea dos recorridos clinicos completos:

### Recorrido 1: Maria Garcia (consulta rutinaria)

Cita completada -> Atencion por cefalea tensional -> Signos vitales normales
-> Receta dispensada (Paracetamol 500mg x20) -> Hemograma completo con resultado normal
-> Factura pendiente de pago

### Recorrido 2: Jose Hernandez (emergencia + hospitalizacion)

Cita urgente -> Atencion de emergencia (neumonia) -> Signos vitales con fiebre
-> Receta parcial (Amoxicilina dispensada, Omeprazol pendiente)
-> Hospitalizacion activa en cama 201-A (Pediatria) -> Signos vitales mejorando
-> Medicion administrada (Amoxicilina) -> Cama en estado OCUPADA
-> Examen de laboratorio solicitado (pendiente)

## Estructura del Proyecto

```
siih/
  src/
    app/
      (authenticated)/     # Layout con sidebar, rutas protegidas
        dashboard/
        pacientes/
        mi-historial/      # Vista del paciente para su propio historial
        citas/
        farmacia/
        laboratorio/
        hospitalizacion/
        facturacion/
        seguridad/         # Gestion de usuarios, roles y auditoria
      api/                 # API Routes (backend)
        auth/
        pacientes/
        citas/
        ...
      login/
    components/ui/         # Componentes reutilizables
    lib/                   # Logica compartida (db, session, rbac, etc.)
  db/
    schema.sql             # Esquema de base de datos (34 tablas)
    seed_demo.sql          # Datos de demo completos
  docs/
    especificacion-siih.md # Especificacion funcional completa
    roles-y-endpoints.md   # Matriz de permisos por rol
```

## Stack Tecnologico

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Base de datos:** PostgreSQL via `pg` (SQL crudo, sin ORM)
- **Estilos:** Tailwind CSS
- **Autenticacion:** Cookie httpOnly firmada (HMAC-SHA256)
- **RBAC:** Verificacion de permisos por rol en cada endpoint
