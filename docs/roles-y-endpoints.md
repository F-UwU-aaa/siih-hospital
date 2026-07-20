# Guía de Roles, Endpoints y Demo — SIIH

## 1. ADMIN

**Qué hace:** Super-usuario del sistema. Puede crear/editar/desactivar cualquier usuario, asignar roles y permisos, y consultar la auditoría de quién hizo qué. Es el único que puede gestionar el catálogo de actores del hospital.

**CU que cubre:** CU-11 (gestión de usuarios/roles/auditoría). Acceso de lectura a casi todos los módulos.

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | Cards de TODOS los módulos (10+) |
| `/pacientes`, `/pacientes/nuevo`, `/pacientes/[id]` | CRUD completo |
| `/citas`, `/citas/nueva`, `/citas/[id]` | CRUD completo (como admisionista) |
| `/atencion`, `/atencion/[id]` | Lectura+escritura |
| `/farmacia`, `/farmacia/recetas/[id]` | CRUD medicamentos, inventario, recetas |
| `/compras` | CRUD compras |
| `/laboratorio`, `/laboratorio/[id]` | Lectura de todos los exámenes |
| `/hospitalizacion`, `/hospitalizacion/[id]` | Lectura de todas las hospitalizaciones |
| `/seguridad` | Lectura de usuarios, roles, auditoría |
| `/facturacion`, `/reportes`, `/notificaciones` | Placeholders |

**Endpoints que usa:**
`POST /api/seguridad/login`, `GET/POST /api/seguridad/usuarios`, `GET/PUT /api/seguridad/usuarios/[id]`, `PATCH /api/seguridad/usuarios/[id]/toggle-activo`, `POST/DELETE /api/seguridad/roles/[id]/permisos`, `GET /api/seguridad/auditoria`, `GET /api/pacientes`, `GET/POST /api/citas`, `GET/POST /api/farmacia/medicamentos`, `GET/POST /api/farmacia/inventario`, `GET/POST /api/farmacia/recetas`, `GET/POST /api/compras`, `GET /api/laboratorio/examenes`, `GET /api/hospitalizacion`, y más (~25 endpoints).

**Qué NO puede hacer:** Nada — tiene acceso total. La única limitación real es que no tiene `medico_id` ni `enfermera_id`, así que no puede hacer acciones que requieran esos FKs (ej: registrar signos vitales como enfermera).

**Estado para demo:** **Parcial** — Los módulos core funcionan (pacientes, citas, atención, farmacia, laboratorio, hospitalización, compras, seguridad). Pero `/facturacion`, `/reportes` y `/notificaciones` son placeholders. El Admin tiene acceso de lectura a esos módulos en la spec pero no hay nada que mostrar ahí.

**Usuario de prueba:** `admin` / `admin123` ✅

---

## 2. DIRECTOR

**Qué hace:** Gerencia del hospital. Solo lee datos de todos los módulos para tomar decisiones. No modifica nada. Puede ver reportes (cuando existan) y la auditoría. Puede crear compras y gestionar farmacia.

**CU que cubre:** CU-08 (reportes gerenciales), acceso de lectura a CU-01 a CU-13.

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | Cards de: Citas(R), Historial(R), Atención(R), Laboratorio(R), Farmacia(R/W inventario), Hospitalización(R), Compras(R/W), Facturación(R), Reportes(R), Auditoría(R) |
| `/citas` | Solo lectura (no puede crear ni editar) |
| `/farmacia` | Puede gestionar inventario y compras |
| `/compras` | CRUD completo |
| `/laboratorio`, `/hospitalizacion` | Solo lectura |
| `/seguridad` | Auditoría |

**Endpoints que usa:** `GET /api/citas` (R), `GET/POST /api/farmacia/inventario`, `GET/POST /api/farmacia/medicamentos`, `GET/POST /api/compras`, `GET/POST /api/compras/[id]`, `GET /api/laboratorio/examenes`, `GET /api/hospitalizacion`, `GET /api/seguridad/auditoria`.

**Qué NO puede hacer:** Crear/modificar citas (solo lectura), atender pacientes, registrar signos vitales, dispensar medicamentos, crear usuarios.

**Estado para demo:** **Parcial** — Lectura de módulos core funciona. `/reportes` y `/facturacion` son placeholders. No hay usuario de prueba sembrado.

**Usuario de prueba:** **No existe.** Crear desde Admin con rol DIRECTOR.

---

## 3. MEDICO

**Qué hace:** El actor principal del sistema. Atiende pacientes con y sin cita, ve historiales clínicos, emite recetas, solicita exámenes de laboratorio, puede hospitalizar y dar de alta. Ve solo sus propios pacientes.

**CU que cubre:** CU-03A (atención con cita), CU-03B (emergencia), CU-04 (historial clínico), CU-05 parcial (emitir recetas), CU-06 (solicitar exámenes + ver resultados propios), CU-09 (ingreso/alta hospitalaria), CU-10 parcial (lectura farmacia), CU-12 (consultar disponibilidad farmacia y laboratorio).

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | 6 cards: Citas(R), Pacientes, Atención(R/W), Laboratorio(R propios), Farmacia(R consulta), Hospitalización(R/W propios) |
| `/citas` | Solo lectura — ve sus citas del día |
| `/citas/[id]` | Detalle cita (no puede editar) |
| `/atencion` | Lista de atenciones propias + botón "Emergencia" |
| `/atencion/[id]` | **Vista completa:** alerta alergias RN-04, historial, signos, recetas, exámenes, hospitalizar |
| `/farmacia` | Solo consulta de inventario y recetas propias |
| `/laboratorio` | Ve exámenes solicitados por él; solicitar nuevos |
| `/laboratorio/[id]` | Ver resultado de exámenes propios |
| `/hospitalizacion`, `/hospitalizacion/[id]` | Ver hospitalizaciones propias, dar de alta |
| `/pacientes` | Buscar y ver pacientes |

**Endpoints que usa:**
`GET /api/citas` (filtro propio), `GET /api/citas/[id]` (lectura), `POST /api/atencion`, `GET/PATCH /api/atencion/[id]`, `POST /api/atencion/[id]/signos-vitales`, `POST /api/farmacia/recetas` (emitir receta), `GET /api/farmacia/recetas` (propias), `GET /api/farmacia/medicamentos` (consulta), `POST /api/laboratorio/examenes` (solicitar), `GET /api/laboratorio/examenes` (propios), `GET /api/laboratorio/examenes/[id]`, `GET /api/hospitalizacion` (propios), `POST /api/hospitalizacion` (ingreso), `PATCH /api/hospitalizacion/[id]` (alta), `GET /api/pacientes/buscar`, `GET /api/pacientes/[id]/historial`, `GET /api/especialidades`, `GET /api/medicos`.

**Qué NO puede hacer:** Crear/editar usuarios, gestionar inventario, dispensar recetas, registrar signos vitales como enfermera, ver exámenes de otros médicos, ver facturación, ver reportes, acceder a auditoría.

**Estado para demo:** **Sí** — Flujo completo funcional (etapas 1-7).

**Usuario de prueba:** `dr_test` (contraseña creada en runtime — si no funciona, crear uno nuevo desde Admin).

---

## 4. ENFERMERA

**Qué hace:** Cuida pacientes hospitalizados. Ve solo hospitalizaciones activas con alerta de alergias prominentes. Registra signos vitales y administra medicación (con descuento FEFO del inventario). Ve antecedentes y alergias pero NO el historial completo de consultas externas.

**CU que cubre:** CU-04 parcial (signos vitales en hospitalización), CU-13 (vista de pacientes hospitalizados), CU-09 parcial (cuidados durante hospitalización).

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | 3 cards: Atención(R), Pacientes, Hospitalización(R/W) |
| `/hospitalizacion` | **Cards con alerta de alergias** (no tabla) — ve solo ACTIVAS |
| `/hospitalizacion/[id]` | Banner alergias imposible de ignorar, tabs signos/medicación/antecedentes, formularios de registro. NO ve atenciones previas |
| `/atencion` | Solo lectura (R + signos W) |

**Endpoints que usa:**
`GET /api/hospitalizacion` (solo ACTIVAS), `GET /api/hospitalizacion/[id]`, `POST /api/hospitalizacion/[id]/signos-vitales`, `POST /api/hospitalizacion/[id]/medicacion` (FEFO + alerta stock), `GET /api/atencion` (lectura), `GET /api/pacientes/[id]/historial` (hospitalizados).

**Qué NO puede hacer:** Crear/modificar citas, hospitalizar o dar de alta, emitir recetas, solicitar exámenes, gestionar farmacia/compras, crear usuarios. No puede ver atenciones previas del paciente (solo durante hospitalización). No puede dar de alta (403).

**Estado para demo:** **Parcial** — Hospitalización funciona (etapa 7). Pero la spec dice que la enfermera también debería ver "módulo Atención" para registrar signos de urgencia (CU-03B) — eso funciona parcialmente. `/notificaciones` es placeholder.

**Usuario de prueba:** `nurse_test` / `nurse123` (Enfermera 1, Ana Martinez). También `nurse2_test` / `nurse123` (Enfermera 2, Lucia Hernandez).

---

## 5. FARMACÉUTICO

**Qué hace:** Gestiona el inventario de medicamentos (crear, editar, ver stock), dispensa recetas emitidas por médicos (con lógica FEFO), gestiona compras a proveedores y proveedores.

**CU que cubre:** CU-05 completo (farmacia y dispensación), CU-12 parcial (compras).

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | 2 cards: Farmacia(R/W), Compras(R/W) |
| `/farmacia` | CRUD completo: medicamentos, inventario, proveedores, recetas con dispensar |
| `/farmacia/recetas/[id]` | Detalle receta con botón Dispensar (FEFO) |
| `/compras` | CRUD compras + recibir |

**Endpoints que usa:**
`GET/POST /api/farmacia/medicamentos`, `PATCH /api/farmacia/medicamentos/[id]`, `GET/POST /api/farmacia/inventario`, `PATCH /api/farmacia/inventario/[id]`, `GET/POST /api/farmacia/proveedores`, `PATCH /api/farmacia/proveedores/[id]`, `GET/POST /api/farmacia/recetas`, `GET/PATCH /api/farmacia/recetas/[id]` (con stock_info), `GET/POST /api/compras`, `GET/PATCH /api/compras/[id]`.

**Qué NO puede hacer:** Crear usuarios, atender pacientes, hospitalizar, crear/recibir exámenes, ver reportes. No puede crear recetas (solo dispensar las que el médico emite).

**Estado para demo:** **Sí** — Flujo completo funcional (etapa 5).

**Usuario de prueba:** `V-20111222` / `farm123`. También `V-20333444` y `V-20555666` con la misma contraseña.

---

## 6. TÉCNICO DE LABORATORIO

**Qué hace:** Procesa exámenes de laboratorio. Ve las órdenes solicitadas (SOLICITADO), las toma (→ EN_PROCESO), y registra resultados (→ COMPLETADO). Si el resultado es crítico, se envía una alerta al médico tratante.

**CU que cubre:** CU-06 (procesar exámenes de laboratorio).

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | 1 card: Laboratorio |
| `/laboratorio` | Ve exámenes SOLICITADOS + propios en proceso. Botón "Tomar examen" |
| `/laboratorio/[id]` | Detalle examen, formulario "Registrar resultado" (con campo es_critico) |

**Endpoints que usa:**
`GET /api/laboratorio/examenes` (SOLICITADO + propios), `PATCH /api/laboratorio/examenes/[id]/tomar` (→ EN_PROCESO), `POST /api/laboratorio/examenes/[id]/resultado` (→ COMPLETADO, envía ALERTA_LAB si es_critico), `GET /api/laboratorio/examenes/[id]`, `GET /api/laboratorio/carga`.

**Qué NO puede hacer:** Solicitar exámenes (solo médico), gestionar farmacia, hospitalizar, crear usuarios, ver reportes.

**Estado para demo:** **Sí** — Flujo completo funcional (etapa 6).

**Usuario de prueba:** `lab_test` / `lab123`.

---

## 7. ADMISIONISTA

**Qué hace:** Registra pacientes y gestiona citas (crear, confirmar, cancelar, reprogramar). También puede crear citas de emergencia.

**CU que cubre:** CU-01 (registro de pacientes), CU-02 (programar citas), CU-03B parcial (crear cita de emergencia).

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | Cards limitadas: Citas(R/W), Hospitalización(R) |
| `/pacientes`, `/pacientes/nuevo`, `/pacientes/[id]` | CRUD completo |
| `/citas`, `/citas/nueva`, `/citas/[id]` | CRUD completo |

**Endpoints que usa:**
`GET/POST /api/pacientes`, `GET /api/pacientes/buscar`, `GET/POST /api/citas`, `GET/PATCH /api/citas/[id]`, `POST /api/citas/reprogramar`, `GET /api/citas/disponibilidad`, `GET /api/especialidades`, `GET /api/medicos`, `GET /api/hospitalizacion` (lectura).

**Qué NO puede hacer:** Atender pacientes, emitir recetas, dispensar medicamentos, hospitalizar, ver historial clínico, ver facturación, ver reportes, crear usuarios.

**Estado para demo:** **Parcial** — Pacientes y citas funcionan (etapas 1-3). Pero el módulo de "Hospitalización" (lectura R) es un placeholder visual. Las funcionalidades core (CU-01, CU-02) sí funcionan.

**Usuario de prueba:** `adm_test` (contraseña creada en runtime — si no funciona, crear uno nuevo desde Admin).

---

## 8. FACTURADOR

**Qué hace:** Emite facturas por servicios prestados (consultas, exámenes, medicamentos, hospitalización), gestiona pagos y anulaciones.

**CU que cubre:** CU-07 (facturación).

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | 1 card: Facturación |
| `/facturacion` | Placeholder |

**Endpoints que usa:** Ninguno funcional — `/api/facturacion` es un stub que retorna "API en desarrollo".

**Qué NO puede hacer:** Todo excepto ver el placeholder de facturación.

**Estado para demo:** **No** — El módulo de facturación no está implementado (pendiente Etapa 8+).

**Usuario de prueba:** **No existe.** Crear desde Admin.

---

## 9. PACIENTE

**Qué hace:** Portal personal del paciente. Agenda y cancela sus propias citas, ve su historial clínico (solo lectura), busca medicamentos en farmacia (solo ve DISPONIBLE/NO DISPONIBLE, no cantidades).

**CU que cubre:** CU-10 completo (portal del paciente).

**Páginas que puede ver:**
| Ruta | Qué ve distinto |
|---|---|
| `/dashboard` | 3 cards: Citas(R/W propias), Pacientes(historial propio), Farmacia(consulta) |
| `/citas`, `/citas/nueva`, `/citas/[id]` | CRUD de citas propias |
| `/pacientes/[id]` | Su propio historial (solo lectura) |
| `/farmacia` | Busca medicamentos — ve DISPONIBLE/NO DISPONIBLE (no cantidades) |

**Endpoints que usa:**
`GET /api/pacientes/mi-historial` (propios), `GET/POST /api/citas` (propias), `GET /api/citas/[id]` (propias), `PATCH /api/citas/[id]` (solo cancelar), `POST /api/citas/reprogramar` (propias), `GET /api/farmacia/medicamentos` (DISPONIBLE/NO_DISPONIBLE), `GET /api/pacientes/[id]/historial/alergias`, `GET /api/pacientes/[id]/historial/antecedentes`.

**Qué NO puede hacer:** Ver historial de otros pacientes, ver cantidades de inventario, hospitalizar, emitir recetas, registrar signos vitales, crear usuarios. No puede ver `/api/farmacia/inventario` (403 explícito).

**Estado para demo:** **Parcial** — Las citas y el historial propio funcionan. Pero la spec menciona "Ver disponibilidad de farmacia" que sí funciona (muestra DISPONIBLE/NO_DISPONIBLE). `/notificaciones` es placeholder.

**Usuario de prueba:** `V-87654321` / `pac123` (Maria Garcia, paciente_id=4).

---

## Tabla resumen

| Rol | Rutas principales | Endpoints clave | Listo para demo |
|---|---|---|---|
| **ADMIN** | `/dashboard`, `/seguridad`, todas | login, sesion, usuarios CRUD, auditoria, + todos los READ | Parcial (facturación/reportes/placeholders) |
| **DIRECTOR** | `/dashboard`, `/farmacia`, `/compras`, `/seguridad` | todos los READ, farmacia/inventario W, compras W | **No** (no hay usuario; reportes placeholder) |
| **MEDICO** | `/atencion`, `/citas`(R), `/laboratorio`, `/farmacia`(R), `/hospitalizacion` | atencion CRUD, recetas POST, examenes POST/GET, hospitalizacion CRUD | **Sí** |
| **ENFERMERA** | `/hospitalizacion`, `/atencion`(R) | hospitalizacion GET, signos-vitales POST, medicacion POST | Parcial (notificaciones placeholder) |
| **FARMACÉUTICO** | `/farmacia`, `/compras` | medicamentos CRUD, inventario CRUD, recetas PATCH, compras CRUD | **Sí** |
| **TÉCN. LAB** | `/laboratorio` | examenes GET, tomar PATCH, resultado POST, carga GET | **Sí** |
| **ADMISIONISTA** | `/pacientes`, `/citas` | pacientes CRUD, citas CRUD, especialidades, medicos | Parcial (solo CU-01/CU-02) |
| **FACTURADOR** | `/facturacion` | `/api/facturacion` (stub) | **No** (no implementado) |
| **PACIENTE** | `/citas`(propias), `/pacientes/[id]`(propio), `/farmacia`(consulta) | mi-historial, citas propias, medicamentos DISPONIBLE | Parcial (no hay notificaciones) |

---

## Cómo extender un rol existente

Para agregar una funcionalidad nueva a un rol (ej: que el Facturador pueda ver un reporte simple), tocarías estos archivos en este orden:

1. **Permiso** → `db/seed_permisos.sql`: Insertar el permiso necesario si no existe (ej: `INSERT INTO permiso (modulo, accion) VALUES ('REPORTES', 'READ');` y asignarlo al rol con `INSERT INTO rol_permiso ...`).

2. **Endpoint** → `src/app/api/<nuevo-o-existentes>/route.ts`: Crear o modificar un route handler. Cada handler sigue el patrón: `getSesionActual()` → `verificarPermiso(usuario_id, "MODULO", "ACCION")` → query a la BD → respuesta JSON.

3. **Página** → `src/app/(authenticated)/<modulo>/page.tsx` o nueva ruta: Crear/modificar el componente `"use client"` que hace `fetch("/api/seguridad/sesion")` para el rol, y luego `fetch` al endpoint del paso 2.

4. **Sidebar** → `src/app/(authenticated)/layout.tsx`: Si es un módulo nuevo, agregar el item al array `menuItems` con el módulo correcto para que el filtro de permisos funcione.

5. **Badge de estado** (si aplica): Si el nuevo flujo tiene estados, agregarlos al mapa `estadoColores` en `src/components/ui/BadgeEstado.tsx`.

**Regla general:** Cada funcionalidad nueva necesita al menos 3 archivos: permiso en SQL, endpoint en API, página en frontend. Si el módulo ya existe, solo se agregan sub-rutas.
