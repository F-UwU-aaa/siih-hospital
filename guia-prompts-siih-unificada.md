# Guía Unificada de Prompts para OpenCode — Proyecto SIIH
### Hospital Universitario San Andrés

> **Nota de esta versión:** esta guía combina las tres versiones que se armaron antes. Usa la secuencia **etapa por etapa** (Plan → qué revisar → Build → qué probar, con utilidades compartidas y una auditoría final) como columna vertebral, porque es la que más protege de terminar con módulos inconsistentes entre sí. La única pieza que se reemplaza es el paso de la base de datos: en vez de dejar que la IA "interprete" la sección 2 del documento y redacte las 33 tablas por su cuenta, se le da el **script SQL completo, exacto y ya verificado** (incluye el manejo correcto de la dependencia circular PACIENTE↔USUARIO y el CHECK de NOTIFICACION). Al final, después de la auditoría de cierre, se suma una etapa opcional de **datos de demo + README**.
>
> Basada en `docs/especificacion-siih.md` (33 tablas en la sección 2 — el resumen final del documento dice 31, pequeño desajuste del propio documento, no te preocupes por eso) y sus 13 casos de uso (CU-01 a CU-13).

## Cómo usar esta guía

- Sigue las etapas **en orden**, de arriba hacia abajo. No saltes ni combines etapas.
- Cada etapa trae (salvo que se indique lo contrario) un prompt de **Plan** (OpenCode solo propone, no toca nada), una lista de qué revisar antes de aprobar ese plan, un prompt corto de **Build** (recién ahí implementa), y una lista de "qué probar" antes de pasar a la siguiente.
- Cambias de modo con **Tab**: **Plan** = la IA solo piensa y te explica qué haría, no toca archivos. **Build** = la IA sí escribe archivos y ejecuta comandos.
- Si algo sale mal a mitad de una etapa, usa `/undo` antes de seguir agregando prompts sueltos para "arreglarlo".
- No avances de etapa hasta que `npm run dev` funcione y la lista de "qué probar" de esa etapa pase completa.
- Después de cada etapa que te funcione, corre `git add -A && git commit -m "nombre de la etapa"`. Si la siguiente etapa sale mal, siempre puedes volver atrás — con o sin `/undo`.
- Cada prompt ya incluye la referencia a `@docs/especificacion-siih.md` y a la sección/caso de uso puntual, así que aunque abras una sesión nueva de OpenCode otro día, no necesitas pegar el documento completo de nuevo.

## Requisito previo

Necesitas **PostgreSQL instalado y corriendo** en tu Windows antes de arrancar la Etapa 0. Si todavía no lo tienes:

- Descárgalo de https://www.postgresql.org/download/windows/
- Durante la instalación, anota el usuario (`postgres` por defecto) y la contraseña que le pongas — los vas a necesitar.
- Confirma que se instaló bien abriendo pgAdmin (viene incluido) o corriendo `psql --version` en PowerShell.
- Si algo no queda claro, dile a OpenCode qué pasó y lo resuelves antes de arrancar la Etapa 0.

Guarda el documento técnico dentro de tu proyecto (y, si quieres, esta guía también — la vas a necesitar durante varios días, etapa por etapa):

```
Proy_Tec_Sup/
  docs/
    especificacion-siih.md   ← pega aquí todo el documento técnico
```

Para abrir OpenCode (esto es terminal, no un prompt para la IA):

```powershell
cd C:\Users\Admin\Desktop\Proy_Tec_Sup
opencode
```

Confirma que estás en modo **Plan** (Tab si hace falta) antes de pegar el primer prompt de la Etapa 0.

(`create-next-app` ya ignora `.env*.local` en git por defecto, así que no te va a subir tus credenciales sin querer.)

## Mapa de las 10 etapas (+1 opcional)

| # | Módulo | Tablas | Casos de uso |
|---|---|---|---|
| 0 | Andamiaje + Schema de BD | todas (solo esquema) | — |
| 1 | Seguridad + Administración | USUARIO, ROL, PERMISO, ROL_PERMISO, AUDITORIA, MEDICO, ENFERMERA, ADMISIONISTA, FARMACEUTICO, TECNICO_LABORATORIO, FACTURADOR | CU-11 |
| 2 | Pacientes + Historial Clínico | PACIENTE, HISTORIAL_CLINICO, ALERGIA, ANTECEDENTE | CU-01, CU-04, CU-10 (parte) |
| 3 | Citas | CITA | CU-02, CU-10 (parte) |
| 4 | Atención Médica | ATENCION, SIGNOS_VITALES | CU-03A, CU-03B |
| 5 | Farmacia | MEDICAMENTO, INVENTARIO, RECETA, DETALLE_RECETA, PROVEEDOR, COMPRA, DETALLE_COMPRA | CU-05, CU-12 (parte), CU-10 (parte) |
| 6 | Laboratorio | EXAMEN_LABORATORIO, RESULTADO_LABORATORIO | CU-06, CU-12 (parte) |
| 7 | Hospitalización | CAMA, HOSPITALIZACION, MEDICACION_ADMINISTRADA | CU-09, CU-13 |
| 8 | Facturación | FACTURA, DETALLE_FACTURA | CU-07 |
| 9 | Reportes + Notificaciones | NOTIFICACION (+ consultas de solo lectura sobre todo lo demás) | CU-08 |
| 10 (opcional) | Datos de prueba + README | — | — |

> CU-10 (portal del paciente) y CU-12 (consultas de solo lectura del médico) no tienen etapa propia — están repartidos en las etapas donde ya existen sus datos, porque son solo vistas de lectura sobre módulos que ya construiste.

---

## Etapa 0 — Andamiaje del proyecto + Schema de base de datos

*No depende de nada. Es la base para todo lo demás.*

Esta etapa tiene dos partes. La **Parte A** (andamiaje) sigue el flujo normal de Plan → revisión → Build. La **Parte B** (schema SQL) va directo a Build: el SQL ya está completamente definido y verificado más abajo — son exactamente 33 `CREATE TABLE` —, así que no hay ambigüedad que planear. Dejar que OpenCode "interprete" y redacte las 33 tablas desde la sección 2 del documento es justo el tipo de paso donde más conviene no improvisar, porque un error en el schema se arrastra a las otras 9 etapas.

### Parte A — Andamiaje

**Prompt (modo Plan):**

```
Lee @docs/especificacion-siih.md completo antes de responder.

Vamos a construir el SIIH (Sistema Integrado de Información Hospitalaria)
del Hospital Universitario San Andrés. Stack obligatorio, según la sección
8: Next.js + TypeScript + PostgreSQL (sin ORM, usando la librería "pg") +
Tailwind CSS.

Por ahora SOLO quiero el andamiaje del proyecto, nada de módulos de negocio
y NADA de schema todavía (el script SQL te lo voy a dar yo, textual, en el
próximo paso — no lo redactes):

1. Crear el proyecto con create-next-app (TypeScript + Tailwind, App
   Router) y la estructura de carpetas de la sección 8: carpeta
   /src/app/api/ con una subcarpeta por módulo (pacientes, citas, atencion,
   laboratorio, farmacia, hospitalizacion, facturacion, compras, reportes,
   seguridad, notificaciones), páginas equivalentes en /src/app/, carpeta
   /src/components/, carpeta /lib, y una carpeta /db (vacía por ahora, ahí
   va a ir el schema.sql en el próximo paso).
2. Instala las dependencias: pg, bcrypt, y sus tipos (@types/pg,
   @types/bcrypt).
3. lib/db.ts con un pool de conexiones a PostgreSQL usando "pg", leyendo la
   configuración desde process.env.DATABASE_URL.
4. lib/hash.ts con dos funciones: hashPassword(password) y
   verifyPassword(password, hash), usando bcrypt. Nada de pantallas de
   login todavía.
5. Crea un archivo .env.local con la variable DATABASE_URL (placeholder) y
   agrégalo a .gitignore. También un .env.local.example con las variables
   necesarias.
6. Un .gitignore apropiado (node_modules, .env.local, .next).

No implementes ningún módulo de negocio todavía (nada de pacientes, citas,
etc.), ni pantallas de login, ni el schema de la base de datos. Solo el
esqueleto vacío y funcional (npm run dev debe arrancar sin errores). Dame
el plan detallado antes de tocar nada.
```

**Al revisar el plan, fíjate en:**
- Que use `pg` con pool, no una conexión nueva por query.
- Que no proponga escribir el SQL del schema por su cuenta — eso viene en la Parte B, con el script exacto.
- Que no proponga crear pantallas de login todavía.

**Prompt (Build):**

```
El plan se ve bien, procede a implementarlo. Al terminar, dime exactamente
qué comando debo correr para verificar que todo levantó bien.
```

**Antes de seguir a la Parte B, verifica:**
- `npm run dev` levanta sin errores.
- `lib/hash.ts` exporta `hashPassword` y `verifyPassword` sin errores al importarlo.

### Parte B — Schema completo de la base de datos (SQL exacto)

Antes de pegar el prompt, crea la base de datos vacía. Abre PowerShell y
ejecuta (te va a pedir la contraseña que pusiste al instalar PostgreSQL):

```powershell
psql -U postgres -c "CREATE DATABASE siih_db;"
```

Si `psql` no se reconoce como comando, abre pgAdmin en vez de la terminal,
clic derecho en "Databases" → "Create" → "Database" → nómbrala `siih_db`.
Si prefieres resolver el PATH en vez de usar pgAdmin, dile a OpenCode:
*"psql no se reconoce en PATH, dame la ruta típica de instalación en
Windows para agregarlo"*.

Ahora sí, en OpenCode (**modo Build, directo** — no hace falta Plan, el SQL
ya está cerrado):

```
Crea el archivo db/schema.sql con EXACTAMENTE el siguiente contenido
(no lo modifiques, no agregues ni quites tablas):

-- ============================================
-- SIIH - Schema completo (33 tablas)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE rol (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT
);

CREATE TABLE permiso (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  modulo VARCHAR(50),
  accion VARCHAR(20)
);

CREATE TABLE rol_permiso (
  rol_id INTEGER NOT NULL REFERENCES rol(id),
  permiso_id INTEGER NOT NULL REFERENCES permiso(id),
  PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE medico (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  horario_atencion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE enfermera (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  turno VARCHAR(20),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE farmaceutico (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE tecnico_laboratorio (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE admisionista (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE facturador (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE paciente (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo CHAR(1),
  direccion VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(100),
  seguro_medico VARCHAR(100),
  registrado_por INTEGER,
  huella_dactilar_ref TEXT,
  foto_rostro_ref TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  ultimo_acceso TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  creado_por INTEGER REFERENCES usuario(id),
  rol_id INTEGER NOT NULL REFERENCES rol(id),
  paciente_id INTEGER REFERENCES paciente(id),
  medico_id INTEGER REFERENCES medico(id),
  enfermera_id INTEGER REFERENCES enfermera(id),
  farmaceutico_id INTEGER REFERENCES farmaceutico(id),
  tecnico_lab_id INTEGER REFERENCES tecnico_laboratorio(id),
  admisionista_id INTEGER REFERENCES admisionista(id),
  facturador_id INTEGER REFERENCES facturador(id)
);

ALTER TABLE paciente
  ADD CONSTRAINT fk_paciente_registrado_por
  FOREIGN KEY (registrado_por) REFERENCES usuario(id);

CREATE TABLE historial_clinico (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER UNIQUE NOT NULL REFERENCES paciente(id)
);

CREATE TABLE cita (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES paciente(id),
  medico_id INTEGER NOT NULL REFERENCES medico(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  tipo VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  prioridad VARCHAR(20) DEFAULT 'NORMAL',
  motivo TEXT,
  creado_por INTEGER REFERENCES usuario(id)
);

CREATE TABLE alergia (
  id SERIAL PRIMARY KEY,
  historial_id INTEGER NOT NULL REFERENCES historial_clinico(id),
  sustancia VARCHAR(200) NOT NULL,
  reaccion TEXT,
  severidad VARCHAR(20),
  usuario_id INTEGER REFERENCES usuario(id),
  fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE antecedente (
  id SERIAL PRIMARY KEY,
  historial_id INTEGER NOT NULL REFERENCES historial_clinico(id),
  tipo VARCHAR(50),
  descripcion TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuario(id),
  fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE atencion (
  id SERIAL PRIMARY KEY,
  historial_id INTEGER NOT NULL REFERENCES historial_clinico(id),
  medico_id INTEGER NOT NULL REFERENCES medico(id),
  cita_id INTEGER REFERENCES cita(id),
  fecha_atencion TIMESTAMP NOT NULL DEFAULT NOW(),
  motivo_consulta TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  observaciones TEXT,
  tipo VARCHAR(20) DEFAULT 'CONSULTA'
);

CREATE TABLE cama (
  id SERIAL PRIMARY KEY,
  numero_cama VARCHAR(20) UNIQUE NOT NULL,
  piso VARCHAR(20),
  sala VARCHAR(100),
  tipo VARCHAR(50),
  estado VARCHAR(30) DEFAULT 'DISPONIBLE'
);

CREATE TABLE hospitalizacion (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES paciente(id),
  medico_id INTEGER NOT NULL REFERENCES medico(id),
  cama_id INTEGER NOT NULL REFERENCES cama(id),
  atencion_id INTEGER REFERENCES atencion(id),
  fecha_ingreso TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_alta TIMESTAMP,
  diagnostico_ingreso TEXT,
  diagnostico_alta TEXT,
  estado VARCHAR(20) DEFAULT 'ACTIVA'
);

CREATE TABLE signos_vitales (
  id SERIAL PRIMARY KEY,
  atencion_id INTEGER REFERENCES atencion(id),
  hospitalizacion_id INTEGER REFERENCES hospitalizacion(id),
  enfermera_id INTEGER REFERENCES enfermera(id),
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  temperatura DECIMAL(4,1),
  presion_sistolica INTEGER,
  presion_diastolica INTEGER,
  frecuencia_cardiaca INTEGER,
  frecuencia_resp INTEGER,
  saturacion_oxigeno DECIMAL(4,1),
  peso DECIMAL(5,2),
  talla DECIMAL(5,2),
  CONSTRAINT chk_signos_origen CHECK (atencion_id IS NOT NULL OR hospitalizacion_id IS NOT NULL)
);

CREATE TABLE medicamento (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  principio_activo VARCHAR(200),
  presentacion VARCHAR(100),
  concentracion VARCHAR(100),
  laboratorio VARCHAR(200),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE receta (
  id SERIAL PRIMARY KEY,
  atencion_id INTEGER NOT NULL REFERENCES atencion(id),
  medico_id INTEGER NOT NULL REFERENCES medico(id),
  fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
  codigo_receta VARCHAR(50) UNIQUE NOT NULL,
  estado VARCHAR(20) DEFAULT 'EMITIDA',
  dispensado_por INTEGER REFERENCES usuario(id)
);

CREATE TABLE detalle_receta (
  id SERIAL PRIMARY KEY,
  receta_id INTEGER NOT NULL REFERENCES receta(id),
  medicamento_id INTEGER NOT NULL REFERENCES medicamento(id),
  dosis VARCHAR(100),
  frecuencia VARCHAR(100),
  duracion VARCHAR(100),
  cantidad INTEGER NOT NULL,
  indicaciones TEXT
);

CREATE TABLE inventario (
  id SERIAL PRIMARY KEY,
  medicamento_id INTEGER NOT NULL REFERENCES medicamento(id),
  lote VARCHAR(100) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 10,
  fecha_vencimiento DATE NOT NULL,
  ubicacion VARCHAR(100),
  precio_unitario DECIMAL(10,2)
);

CREATE TABLE medicacion_administrada (
  id SERIAL PRIMARY KEY,
  hospitalizacion_id INTEGER NOT NULL REFERENCES hospitalizacion(id),
  enfermera_id INTEGER NOT NULL REFERENCES enfermera(id),
  medicamento_id INTEGER NOT NULL REFERENCES medicamento(id),
  dosis VARCHAR(100),
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  observaciones TEXT
);

CREATE TABLE examen_laboratorio (
  id SERIAL PRIMARY KEY,
  atencion_id INTEGER NOT NULL REFERENCES atencion(id),
  tipo_examen VARCHAR(200) NOT NULL,
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
  estado VARCHAR(30) DEFAULT 'SOLICITADO',
  observaciones_solicitud TEXT,
  tecnico_id INTEGER REFERENCES usuario(id)
);

CREATE TABLE resultado_laboratorio (
  id SERIAL PRIMARY KEY,
  examen_id INTEGER UNIQUE NOT NULL REFERENCES examen_laboratorio(id),
  resultado TEXT NOT NULL,
  valores_referencia TEXT,
  observaciones TEXT,
  fecha_resultado TIMESTAMP NOT NULL DEFAULT NOW(),
  es_critico BOOLEAN DEFAULT FALSE
);

CREATE TABLE factura (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES paciente(id),
  atencion_id INTEGER REFERENCES atencion(id),
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
  subtotal DECIMAL(12,2) NOT NULL,
  impuesto DECIMAL(12,2) DEFAULT 0,
  descuento DECIMAL(12,2) DEFAULT 0,
  cobertura_seguro DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  tipo_pago VARCHAR(30),
  usuario_id INTEGER NOT NULL REFERENCES usuario(id)
);

CREATE TABLE detalle_factura (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL REFERENCES factura(id),
  descripcion VARCHAR(255) NOT NULL,
  cantidad INTEGER DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);

CREATE TABLE proveedor (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  ruc VARCHAR(50) UNIQUE,
  direccion VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE compra (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER NOT NULL REFERENCES proveedor(id),
  fecha_compra TIMESTAMP NOT NULL DEFAULT NOW(),
  total DECIMAL(12,2) NOT NULL,
  estado VARCHAR(30) DEFAULT 'PENDIENTE',
  usuario_id INTEGER NOT NULL REFERENCES usuario(id)
);

CREATE TABLE detalle_compra (
  id SERIAL PRIMARY KEY,
  compra_id INTEGER NOT NULL REFERENCES compra(id),
  medicamento_id INTEGER NOT NULL REFERENCES medicamento(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id),
  tabla_afectada VARCHAR(100) NOT NULL,
  accion VARCHAR(30) NOT NULL,
  registro_id INTEGER,
  detalle TEXT,
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_origen VARCHAR(45)
);

CREATE TABLE notificacion (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES paciente(id),
  medico_id INTEGER REFERENCES medico(id),
  cita_id INTEGER REFERENCES cita(id),
  tipo VARCHAR(20) NOT NULL,
  asunto VARCHAR(200),
  mensaje TEXT NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  fecha_envio TIMESTAMP,
  CONSTRAINT chk_notificacion_destinatario CHECK (paciente_id IS NOT NULL OR medico_id IS NOT NULL)
);

-- ============================================
-- DATOS SEMILLA (necesarios para poder arrancar)
-- ============================================

INSERT INTO rol (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema'),
('DIRECTOR', 'Director / Gerencia'),
('MEDICO', 'Médico'),
('ENFERMERA', 'Enfermera'),
('FARMACEUTICO', 'Farmacéutico'),
('TECNICO_LAB', 'Técnico de laboratorio'),
('ADMISIONISTA', 'Admisionista'),
('FACTURADOR', 'Facturador'),
('PACIENTE', 'Paciente');

-- Usuario admin inicial: username = admin / password = admin123
-- (CAMBIA esta contraseña luego desde el sistema una vez que puedas entrar)
INSERT INTO usuario (username, password_hash, rol_id, activo)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  (SELECT id FROM rol WHERE nombre = 'ADMIN'),
  TRUE
);

-- Un par de camas de ejemplo para poder probar hospitalización
INSERT INTO cama (numero_cama, piso, sala, tipo, estado) VALUES
('101-A', '1', 'General', 'GENERAL', 'DISPONIBLE'),
('101-B', '1', 'General', 'GENERAL', 'DISPONIBLE'),
('UCI-01', '2', 'UCI', 'UCI', 'DISPONIBLE');

Después de crear el archivo, ejecuta en la terminal (Windows, no bash):
psql -U postgres -d siih_db -f db/schema.sql

Actualiza lib/db.ts para que la cadena de conexión apunte a la base
"siih_db" usando las variables de .env.local. Confírmame que el script
corrió sin errores y que las 33 tablas existen.
```

**Nota sobre la contraseña de PostgreSQL:** si `psql` te pide contraseña y
no la sabes, es la que pusiste al instalar PostgreSQL. Recuerda además
reemplazar el placeholder de `.env.local` con tu cadena real, por ejemplo:
`DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/siih_db`.

**Antes de seguir a la Etapa 1, verifica:**
- Te conectas a la base (`psql` u otro cliente) y ves las 33 tablas creadas (puedes confirmarlo con `\dt` en `psql`).
- Ya existe un usuario admin de prueba sembrado por el propio script: `username = admin`, `password = admin123` (cámbiala luego desde el sistema una vez que puedas entrar) — no hace falta crearlo a mano.
- Existen 3 camas de ejemplo (`101-A`, `101-B`, `UCI-01`) para poder probar hospitalización más adelante.
- `lib/db.ts` apunta a `siih_db`.

---

## Etapa 1 — Seguridad + Administración (CU-11)

*Depende de la Etapa 0. Todo lo demás depende de este módulo: usuarios,
sesión y roles.*

Aunque la tabla resumen de la sección 7 no lista MEDICO ni ENFERMERA bajo
"Seguridad", el CU-11 (sección 4) sí los crea con el mismo flujo que los
demás actores — y Citas (Etapa 3) va a necesitar médicos ya cargados para
poder probar algo. Por eso van juntos acá.

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md, enfocándote en CU-11 (Gestión de
Usuarios, Roles y Administración), las tablas
USUARIO/ROL/PERMISO/ROL_PERMISO/AUDITORIA de la sección 2, las reglas
RN-10, RN-11 y RN-17 de la sección 6, y la tabla de accesos por rol de la
sección 9.

Ya tenemos el andamiaje (carpetas, conexión a PostgreSQL, todas las tablas
creadas, lib/hash.ts con hash/verify, y la tabla ROL ya sembrada con sus 9
valores desde el schema).

Construye el módulo de Seguridad y Administración, el primero de los
módulos de negocio:

1. Login: valida username/password contra USUARIO.password_hash con
   bcrypt, actualiza ultimo_acceso, y crea una sesión. El documento no
   especifica el mecanismo de sesión (solo dice "bcrypt: hasheo de
   contraseñas") — propón en tu plan cómo la manejarías de forma simple
   (por ejemplo cookie httpOnly firmada con el id de usuario y su rol) y
   justifícalo antes de implementar.
2. Un middleware/helper reutilizable para verificar sesión + rol (RBAC),
   que los módulos siguientes van a importar para proteger sus rutas según
   la tabla de accesos de la sección 9.
3. CRUD completo para el Administrador (CU-11):
   - Registrar/editar/desactivar MEDICO, ENFERMERA, FARMACEUTICO,
     TECNICO_LABORATORIO, ADMISIONISTA, FACTURADOR — cada uno crea su
     registro de actor + su USUARIO vinculado, con creado_por = admin
     actual.
   - Registrar DIRECTOR: solo crea USUARIO con rol DIRECTOR, sin tabla de
     actor propia (no existe tabla DIRECTOR).
   - Gestión de ROL y PERMISO (agregar/quitar permisos de un rol vía
     ROL_PERMISO).
   - Vista de AUDITORIA con filtros por usuario, tabla afectada, acción y
     rango de fechas.
4. Activar/desactivar USUARIO — activo=FALSE bloquea el acceso de
   inmediato.
5. La tabla ROL ya viene sembrada con los 9 valores desde el schema de la
   Etapa 0 (ADMIN, DIRECTOR, MEDICO, ENFERMERA, FARMACEUTICO, TECNICO_LAB,
   ADMISIONISTA, FACTURADOR, PACIENTE) — NO la vuelvas a insertar. Sí
   necesitamos el seed inicial de PERMISO (y su asignación en ROL_PERMISO,
   ver punto 3) según la tabla de accesos de la sección 9 del documento
   (esa tabla dice exactamente qué puede hacer cada rol en cada módulo).
6. Una función verificarPermiso(usuario, modulo, accion) que los módulos
   de las próximas etapas van a usar para controlar el acceso (RBAC,
   RN-10).
7. lib/auditoria.ts: función registrarAuditoria(usuario_id, tabla_afectada,
   accion, registro_id, detalle) que inserta en AUDITORIA. Úsala tú mismo
   ahora cuando se cambie el rol de un usuario (RN-17) — Historial Clínico
   y Facturación la van a reutilizar más adelante.
8. lib/notificaciones.ts: función simple crearNotificacion({paciente_id,
   medico_id, cita_id, tipo, asunto, mensaje}) que solo inserta en
   NOTIFICACION con estado=PENDIENTE, sin enviar nada todavía (eso es la
   última etapa). La necesitamos ya porque el módulo de Citas, en la
   próxima etapa, la va a llamar.

No implementes todavía pacientes, citas, ni ningún otro módulo de negocio.
Dame el plan antes de tocar nada, incluyendo tu propuesta de manejo de
sesión.
```

### Al revisar el plan, fíjate en:
- Qué mecanismo de sesión propone — es una decisión tuya, no de OpenCode. Si no te convence, pide otra opción antes de aprobar.
- Que el seed de permisos refleje de verdad la tabla de la sección 9 (por ejemplo: Paciente solo tiene R/W sobre sus propias citas).
- Que `verificarPermiso()` quede como algo reutilizable, no copiado en cada endpoint.
- Que no intente volver a insertar los valores de ROL (ya vienen del schema de la Etapa 0).

### Prompt (Build)
```
Me convence el mecanismo de sesión que propones. (O si no: "prefiero que
uses [cookies / JWT] en vez de eso".) Procede a implementarlo.
```

### Antes de seguir a la Etapa 2, verifica:
- Puedes loguearte con el usuario `admin` / `admin123` que ya quedó sembrado desde el schema de la Etapa 0 — no hace falta crearlo a mano.
- Login con contraseña incorrecta falla correctamente.
- Desactivar un usuario le bloquea el acceso de inmediato.

---

## Etapa 2 — Pacientes + Historial Clínico (CU-01, CU-04, parte de CU-10)

*Depende de la Etapa 1 (sesión y roles). Es la entidad central del
sistema.*

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md. Ya están listos el andamiaje y Seguridad
(login, roles, permisos).

Ahora quiero Pacientes e Historial Clínico — CU-01 y CU-04 de la sección
4, y las reglas RN-01, RN-02, RN-09, RN-20, RN-22 y RN-24 de la sección 6:

1. Registro de paciente (CU-01): buscar por CI primero (si existe, mostrar
   la ficha existente, no duplicar — RN-01). Si no existe, crear PACIENTE
   con registrado_por = usuario_id del Admisionista logueado (RN-22), y
   crear automáticamente HISTORIAL_CLINICO (relación 1:1 obligatoria,
   RN-02).
2. Opcional al registrar: cargar una ALERGIA inicial si el paciente la
   declara en el momento.
3. Opcional al registrar: crear USUARIO con rol PACIENTE si va a tener
   acceso a la app (usa el módulo de Seguridad).
4. Vista de Historial Clínico (CU-04) para Médico/Enfermera: alergias con
   alerta visual destacada, antecedentes. (Las atenciones todavía no
   existen — eso es la próxima etapa; deja el espacio preparado en la UI.)
5. Registrar ALERGIA y ANTECEDENTE desde el historial, guardando siempre
   usuario_id y fecha_registro=NOW() (RN-24), y registrando también en
   AUDITORIA con lib/auditoria.ts de la etapa anterior — toda modificación
   al historial clínico debe auditarse (RN-09).
6. Vista de "Mi Historial" para el Paciente autenticado (parte de CU-10):
   solo lectura, solo su propio historial (RN-20) — por ahora sin
   atenciones/recetas/exámenes porque esos módulos no existen todavía.
7. Usa verificarPermiso() de Seguridad para restringir el acceso según el
   rol.

No implementes Citas, Atención Médica, ni ningún otro módulo todavía. Dame
el plan antes de tocar nada.
```

### Al revisar el plan, fíjate en:
- Que de verdad cree el HISTORIAL_CLINICO automáticamente al crear el paciente, no como paso manual separado.
- Que la búsqueda por CI evite duplicados antes de crear.
- Que la vista del paciente filtre por su propio `paciente_id` y no exponga otros historiales.

### Prompt (Build)
```
El plan se ve bien, procede a implementarlo.
```

### Antes de seguir a la Etapa 3, verifica:
- Registrar un paciente nuevo crea su historial vacío automáticamente.
- Buscar por una CI ya registrada muestra la ficha existente, no crea un duplicado.
- Si creaste un usuario paciente, puedes loguearte con él y ver (solo) su propio historial.

---

## Etapa 3 — Citas (CU-02, parte de CU-10)

*Depende de Pacientes (Etapa 2) y de MEDICO (ya existe desde la Etapa 1).*

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md. Ya están listos andamiaje, Seguridad y
Pacientes.

Ahora quiero Citas — CU-02 completo (programar, cancelar, reprogramar) y
la parte de agendamiento de CU-10 (portal del paciente), sección 4, y la
regla RN-23 de la sección 6:

1. Programar cita normal: seleccionar paciente (o que lo haga el paciente
   mismo desde su portal) → seleccionar especialidad → sistema muestra
   médicos de esa especialidad → seleccionar médico → sistema muestra
   ÚNICAMENTE los horarios libres de ese médico en esa fecha (nunca los ya
   ocupados) → seleccionar fecha/hora → crear CITA con estado=PENDIENTE,
   tipo=NORMAL, prioridad=NORMAL, creado_por=usuario_id de quien programó
   (RN-23).
2. Al crear la cita, llama a crearNotificacion() (lib/notificaciones.ts de
   la Etapa 1) con los datos de la cita.
3. Cancelar cita: estado=CANCELADA, libera el horario, notifica.
4. Reprogramar cita: la actual pasa a CANCELADA, se crea una nueva con el
   nuevo horario, notifica.
5. Vista para el Admisionista (todas las citas) y vista para el Paciente
   en su portal (solo las suyas, con opción de cancelar/reprogramar las
   que estén PENDIENTE o CONFIRMADA).
6. Usa verificarPermiso() según la sección 9 (Paciente: R/W solo sobre sus
   propias citas; Admisionista: R/W sobre todas; Médico y Director: solo
   lectura; Admin: R/W).

No implementes Atención Médica todavía — eso es lo que pasa cuando el
paciente llega a su cita, en la próxima etapa. Dame el plan antes de tocar
nada.
```

### Al revisar el plan, fíjate en:
- Que el cálculo de horarios disponibles sea real (consulta contra las citas existentes del médico), no una lista fija.
- Que cancelar/reprogramar no borren la cita vieja, solo cambien su estado.
- Que sí esté llamando a `crearNotificacion()` en cada evento.

### Prompt (Build)
```
El plan se ve bien, procede a implementarlo.
```

### Antes de seguir a la Etapa 4, verifica:
- Un horario ya tomado por un médico deja de aparecer como disponible.
- Cancelar una cita libera el horario para otro paciente.
- Se está creando un registro en NOTIFICACION cada vez (puedes confirmarlo directo en la base).

---

## Etapa 4 — Atención Médica (CU-03A, CU-03B)

*Depende de Citas (Etapa 3). Usa por adelantado las tablas MEDICAMENTO y
EXAMEN_LABORATORIO (ya existen desde la Etapa 0), pero sin construir
todavía farmacia ni laboratorio.*

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md. Ya están listos andamiaje, Seguridad,
Pacientes y Citas.

Ahora quiero Atención Médica — CU-03A y CU-03B completos de la sección 4,
y las reglas RN-03, RN-04 y RN-09 de la sección 6:

1. CU-03A (atención con cita): Admisionista confirma llegada
   (CITA.estado=EN_ESPERA) → Médico abre la atención desde su listado de
   citas del día → sistema muestra el historial completo del paciente
   (reutiliza lo de la Etapa 2: alergias SIEMPRE visibles con alerta si
   existen — RN-04 —, antecedentes, atenciones previas, últimos signos
   vitales) → crea ATENCION (historial_id, cita_id, medico_id,
   tipo=CONSULTA) → médico completa motivo_consulta, diagnostico,
   tratamiento, observaciones → al cerrar, CITA.estado=COMPLETADA.
2. CU-03B (emergencia sin cita previa): Admisionista intenta identificar al
   paciente por CI. Si no puede comunicarse o no hay coincidencia, crea un
   PACIENTE temporal (ci="TEMP-<timestamp>", nombre="DESCONOCIDO") — NO
   implementes identificación biométrica real (huella o reconocimiento
   facial); eso depende de un sistema externo que está fuera de alcance de
   este proyecto (RN-14), solo el flujo manual de arriba. Crea CITA
   tipo=EMERGENCIA, prioridad=ALTA o CRITICA, estado=CONFIRMADA, sin
   requerir horario disponible (RN-03). Sistema crea ATENCION
   automáticamente. Alerta obligatoria si el paciente tiene alergias,
   antes de cualquier prescripción (RN-04).
3. Registrar SIGNOS_VITALES (enfermera o médico) vinculados a una ATENCION.
4. Cada ATENCION creada (y cada modificación al historial que implique)
   debe quedar registrada en AUDITORIA vía lib/auditoria.ts (RN-09).
5. Deja espacio en la UI (sin implementar aún) para emitir receta,
   solicitar examen, o decidir hospitalización desde la atención — son las
   próximas 3 etapas.

No implementes Farmacia, Laboratorio, ni Hospitalización todavía. Dame el
plan antes de tocar nada.
```

### Al revisar el plan, fíjate en:
- Que la alerta de alergias sea imposible de ignorar u ocultar (RN-04 dice "siempre", no "opcional").
- Que el flujo de emergencia NO intente conectar con un lector de huella o cámara real — solo el fallback manual.
- Que cerrar la atención cambie el estado de la cita a COMPLETADA.

### Prompt (Build)
```
El plan se ve bien — confirmo que no quiero identificación biométrica
real, solo el flujo manual con paciente temporal. Procede a implementarlo.
```

### Antes de seguir a la Etapa 5, verifica:
- Abrir la atención de un paciente con alergias muestra la alerta de forma imposible de pasar por alto.
- El flujo de emergencia crea el paciente temporal y la cita/atención sin pedir horario.
- Cerrar una atención marca la cita como COMPLETADA.

---

## Etapa 5 — Farmacia (CU-05, parte de CU-12, parte de CU-10)

*Depende de recetas emitidas en Atención Médica (Etapa 4).*

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md. Ya están listos andamiaje, Seguridad,
Pacientes, Citas y Atención Médica.

Ahora quiero Farmacia completa — CU-05 de la sección 4, más dos vistas de
solo lectura (parte de CU-12 y de CU-10), y las reglas RN-05, RN-06, RN-15,
RN-18 y RN-21 de la sección 6:

1. Emitir RECETA desde una ATENCION (medico_id, y DETALLE_RECETA con
   medicamento, dosis, frecuencia, duración, cantidad).
2. Dispensar receta (Farmacéutico): buscar por codigo_receta o CI, revisar
   cada DETALLE_RECETA contra INVENTARIO, descontar del lote con
   fecha_vencimiento más próxima primero (FEFO, RN-05); marcar ítems sin
   stock como pendientes. Todo dispensado → RECETA.estado=DISPENSADA;
   parcial → PARCIAL. Siempre registrar dispensado_por=usuario_id del
   farmacéutico (RN-18).
3. Gestión de inventario: alerta visual cuando cantidad<=stock_minimo
   (RN-06), y cuando el vencimiento está a menos de 30 días.
4. Gestión de compras a proveedor: crear COMPRA + DETALLE_COMPRA; al
   marcarla RECIBIDA, crear un nuevo lote en INVENTARIO.
5. Vista de solo lectura para el Médico (parte de CU-12): buscar
   medicamento, ver stock disponible total y si está bajo el mínimo, SIN
   poder modificar el inventario (RN-15).
6. Vista de solo lectura para el Paciente (parte de CU-10): buscar
   medicamento, ver solo DISPONIBLE / NO DISPONIBLE — sin cantidades
   exactas ni precios (RN-21).

No implementes Laboratorio ni Hospitalización todavía. Dame el plan antes
de tocar nada.
```

### Al revisar el plan, fíjate en:
- Que el descuento FEFO ordene por `fecha_vencimiento` ascendente, no por id o cantidad.
- Que la vista del médico y la del paciente muestren datos distintos (el médico ve stock numérico, el paciente solo disponible/no disponible).
- Que "RECIBIDA" en una compra sí genere un lote nuevo en INVENTARIO.

### Prompt (Build)
```
El plan se ve bien, procede a implementarlo. De paso, carga INVENTARIO
para los medicamentos que ya quedaron creados en la fase anterior (y un
par más si hace falta) para poder probar la dispensación.
```

### Antes de seguir a la Etapa 6, verifica:
- Dispensar con stock suficiente deja la receta en DISPENSADA y descuenta el lote que vence antes.
- Con stock insuficiente, queda en PARCIAL.
- El paciente ve "disponible/no disponible" pero nunca cantidades ni precios.

---

## Etapa 6 — Laboratorio (CU-06, parte de CU-12)

*Depende de exámenes solicitados en Atención Médica (Etapa 4).*

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md. Ya están listos andamiaje, Seguridad,
Pacientes, Citas, Atención Médica y Farmacia.

Ahora quiero Laboratorio — CU-06 de la sección 4, más la consulta de carga
del médico (parte de CU-12), y las reglas RN-07 y RN-19 de la sección 6:

1. Médico solicita examen desde una ATENCION activa: crea
   EXAMEN_LABORATORIO con estado=SOLICITADO, tecnico_id=NULL.
2. Técnico ve la lista de exámenes SOLICITADO, toma uno →
   estado=EN_PROCESO, tecnico_id=usuario_id del técnico (RN-19).
3. Técnico registra RESULTADO_LABORATORIO (resultado, valores_referencia,
   observaciones, es_critico) → EXAMEN_LABORATORIO pasa a COMPLETADO.
4. Si es_critico=TRUE → llama a crearNotificacion() con medico_id=médico
   tratante (no solo paciente_id), marcada urgente (RN-07).
5. Resultado visible en el historial clínico del paciente una vez
   COMPLETADO.
6. Vista de solo lectura para el médico (parte de CU-12): tipos de examen
   disponibles y cuántos están EN_PROCESO ahora mismo, y solo puede ver
   resultados de sus propios pacientes.

No implementes Hospitalización todavía. Dame el plan antes de tocar nada.
```

### Al revisar el plan, fíjate en:
- Que un resultado con es_critico=TRUE de verdad dispare la notificación al médico, no solo al paciente.
- Que el técnico registre su propio `tecnico_id` al tomar el examen.
- Que la vista de "carga actual" del médico sea un conteo real de EN_PROCESO.

### Prompt (Build)
```
El plan se ve bien, procede a implementarlo.
```

### Antes de seguir a la Etapa 7, verifica:
- Marcar un resultado como crítico genera una notificación dirigida al médico.
- El estado avanza correctamente: SOLICITADO → EN_PROCESO → COMPLETADO.
- El médico solo ve resultados de sus propios pacientes.

---

## Etapa 7 — Hospitalización (CU-09, CU-13)

*Depende de Atención Médica (Etapa 4) y del inventario de Farmacia (Etapa
5), por el descuento de medicación administrada.*

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md. Ya están listos todos los módulos
anteriores.

Ahora quiero Hospitalización completa — CU-09 y CU-13 (vista de la
enfermera) de la sección 4, y las reglas RN-12 y RN-16 de la sección 6:

1. Ingreso: médico decide hospitalizar desde una ATENCION activa → sistema
   muestra CAMA con estado=DISPONIBLE → al elegir, crea HOSPITALIZACION
   (paciente_id, medico_id tratante, cama_id, atencion_id,
   diagnostico_ingreso, estado=ACTIVA) → CAMA pasa a OCUPADA.
2. Durante la hospitalización: registrar SIGNOS_VITALES (con
   hospitalizacion_id) y MEDICACION_ADMINISTRADA (enfermera_id,
   medicamento_id, dosis) — cada medicación descuenta INVENTARIO por FEFO
   igual que en Farmacia, y dispara alerta si queda bajo el mínimo.
3. Alta médica: médico registra diagnostico_alta y fecha_alta →
   HOSPITALIZACION.estado=ALTA → CAMA.estado=EN_LIMPIEZA (RN-12; pasar a
   DISPONIBLE es un paso manual aparte, no automático).
4. Vista de enfermera (CU-13) "Mis Pacientes": todas las HOSPITALIZACION
   ACTIVA ordenadas por piso/sala, con nombre, cama, diagnóstico de
   ingreso, ALERTA VISUAL DESTACADA si tiene alergias, últimos signos
   vitales, medicaciones recientes.
5. Detalle de paciente hospitalizado (solo lectura para la enfermera):
   alergias, antecedentes, signos vitales y medicación de esta
   hospitalización — SIN acceso al historial completo de consultas
   externas, reservado al médico tratante (RN-16, RBAC).
6. Desde esa misma vista, la enfermera registra signos vitales y
   medicación administrada (punto 2, pero desde su propia pantalla).

No implementes Facturación todavía. Dame el plan antes de tocar nada.
```

### Al revisar el plan, fíjate en:
- Que dar de alta cambie la cama a EN_LIMPIEZA, no directo a DISPONIBLE.
- Que la vista de la enfermera destaque la alerta de alergias, no la esconda en un detalle.
- Que la enfermera NO vea el historial completo de consultas externas, solo lo de esta hospitalización.

### Prompt (Build)
```
El plan se ve bien, procede a implementarlo. De paso, agrega un seed de 5
a 10 camas de ejemplo (con distintos tipos: GENERAL, UCI, PEDIATRIA,
MATERNIDAD, CIRUGIA) para poder probar el ingreso (ya existen 3 camas
desde el schema de la Etapa 0 — 101-A, 101-B, UCI-01 — así que dale
números distintos a estas nuevas).
```

### Antes de seguir a la Etapa 8, verifica:
- Ingresar a un paciente ocupa la cama; darlo de alta la pasa a EN_LIMPIEZA.
- La enfermera ve solo hospitalizaciones ACTIVA, con alertas de alergia visibles.
- Administrar medicación descuenta el mismo lote FEFO que en Farmacia.

---

## Etapa 8 — Facturación (CU-07)

*Depende de casi todo lo anterior: consulta, exámenes, recetas y
hospitalización.*

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md. Ya están listos todos los módulos
clínicos y operativos.

Ahora quiero Facturación completa — CU-07 de la sección 4, y la regla
RN-08 de la sección 6:

1. Buscar paciente o atención a facturar. El sistema recopila
   automáticamente los servicios prestados: consulta médica (ATENCION),
   exámenes con estado COMPLETADO, medicamentos con RECETA en estado
   DISPENSADA, y días de hospitalización si aplica.
2. Generar un borrador con un DETALLE_FACTURA por cada servicio. El
   facturador puede aplicar descuento y/o cobertura de seguro médico. El
   sistema calcula total = subtotal + impuesto - descuento -
   cobertura_seguro.
3. Confirmar factura → estado PENDIENTE, usuario_id = facturador. Marcar
   como pagada → estado PAGADA.
4. Anular factura: solo con una justificación que se registra
   obligatoriamente en AUDITORIA. Una factura PAGADA solo puede anularse
   así, nunca modificarse directamente.
5. Vista de solo lectura para el Paciente (portal): sus propias facturas.

Dame el plan antes de tocar nada.
```

### Al revisar el plan, fíjate en:
- Que la recopilación de servicios consulte las tablas correctas, no le pida al facturador tipearlos a mano.
- Que anular una factura PAGADA quede registrado en AUDITORIA sin excepción.
- Que el total calculado siga la fórmula exacta del documento.

### Prompt (Build)
```
El plan se ve bien, procede a implementarlo.
```

### Antes de seguir a la Etapa 9, verifica:
- Facturar una atención con receta dispensada y examen completado junta todo automáticamente.
- El total coincide con subtotal + impuesto - descuento - cobertura_seguro.
- Anular una factura pagada deja un registro en AUDITORIA.

---

## Etapa 9 — Reportes + Notificaciones (CU-08)

*Cierra el sistema funcional: es de solo lectura sobre todo lo demás, más
el envío de las notificaciones que los módulos anteriores fueron
generando.*

### Prompt (Plan)
```
Lee @docs/especificacion-siih.md. Ya está todo el sistema funcional
excepto esto.

Quiero cerrar el proyecto con dos cosas — CU-08 de la sección 4, y
terminar el módulo de notificaciones (la tabla NOTIFICACION ya se está
llenando desde Citas y Laboratorio gracias a crearNotificacion() de la
Etapa 1):

REPORTES (CU-08), todo de SOLO LECTURA:
1. Pacientes atendidos por período/especialidad.
2. Ingresos económicos del mes (de FACTURA).
3. Ocupación hospitalaria (CAMA ocupada vs. disponible).
4. Medicamentos con stock bajo el mínimo.
5. Exámenes de laboratorio procesados.
6. Gráficos simples para cada uno, y exportar a PDF/Excel si es viable.

NOTIFICACIONES:
1. Bandeja: listar NOTIFICACION por estado (PENDIENTE/ENVIADA/FALLIDA),
   destinatario (paciente o médico), tipo (SMS/EMAIL).
2. El documento no dice si el envío debe ser real o simulado — dame las
   dos opciones (conectar un proveedor real de email/SMS, o marcar
   ENVIADA sin conexión externa) con sus pros y contras, antes de
   implementar cualquiera.
3. Marcar como ENVIADA o FALLIDA según corresponda.

Dame el plan antes de tocar nada, incluyendo tu recomendación sobre el
envío de notificaciones.
```

### Al revisar el plan, fíjate en:
- Qué recomienda para envío real vs. simulado — no hay una respuesta "correcta" en el documento, decide según tu tiempo/presupuesto.
- Que los reportes sean de verdad de solo lectura, sin ninguna escritura a la base.
- Que el reporte de ocupación calcule bien CAMA disponible vs. ocupada, no solo cuente hospitalizaciones activas.

### Prompt (Build)
```
Para las notificaciones quiero [envío simulado por ahora / conectar un
proveedor real]. Procede a implementar todo con esa decisión.
```

### Antes de dar el sistema por terminado, verifica:
- Cada reporte trae datos reales de tu base, no de ejemplo.
- La bandeja de notificaciones muestra las que ya se generaron desde etapas anteriores.
- Corre un flujo completo de punta a punta al menos una vez: registrar paciente → agendar cita → atenderlo → emitir receta → dispensarla → facturar.

---

## Al terminar las 9 etapas funcionales

Vale la pena un último prompt de auditoría antes de cerrar el proyecto:

```
Lee @docs/especificacion-siih.md completo de nuevo. Revisa todo el código
del proyecto contra el documento y dime si encuentras:
1. Alguna regla de negocio (sección 6, RN-01 a RN-24) que no se esté
   cumpliendo.
2. Algún caso de uso (sección 4, CU-01 a CU-13) con un flujo incompleto.
3. Alguna tabla de la sección 2 sin usar o mal relacionada.
No corrijas nada todavía — dame la lista de hallazgos, priorizada.
```

Este también es un Plan, no un Build — úsalo como checklist final y decide
ahí qué corregir primero.

---

## Etapa 10 (opcional) — Datos de prueba y README

*Depende de que las Etapas 1 a 9 estén funcionando (además del andamiaje y
el schema de la Etapa 0).*

### Prompt (Plan)
```
Ya tenemos las 9 áreas funcionales del SIIH completas (Etapas 1 a 9),
además del andamiaje y schema de la Etapa 0. Ahora quiero:

1. Un script de seed con datos de prueba realistas para hacer una demo
   completa: reutiliza el usuario admin ya sembrado desde la Etapa 0
   (admin/admin123, no crees uno nuevo con el mismo username) y agrega 3
   médicos de distintas especialidades, 2 enfermeras, 1 farmacéutico, 1
   técnico de laboratorio, 1 admisionista, 1 facturador, 1 director, 10
   pacientes, varios medicamentos con inventario variado (incluyendo
   alguno en stock bajo y alguno por vencer), camas adicionales si no
   alcanzan con las que ya creaste en la Etapa 7, y un recorrido de
   ejemplo completo (una cita completada, una atención con receta y
   examen, una hospitalización con alta).
2. Un README.md corto con: cómo levantar el proyecto (variables de
   entorno, comandos) y las credenciales de los usuarios de prueba de cada
   rol.

Dame el plan antes de tocar nada.
```

### Prompt (Build)
```
El plan se ve bien, procede a implementarlo.
```

### Prueba final:
Recorre el sistema logueado con cada rol de prueba y confirma que todo lo
construido en las etapas anteriores se ve y funciona en conjunto.

---

## Consejos generales

- Después de cada etapa, corre `npm run dev` y prueba manualmente antes de seguir con la siguiente.
- Si algo sale mal en Build mode, usa `/undo` para revertir antes de seguir insistiendo.
- Guarda tu progreso con Git entre etapa y etapa (`git add . && git commit -m "etapa X"`), así siempre puedes volver atrás si algo se rompe feo.
