# Inventario por Rol — SIIH

> Documento generado automáticamente a partir del análisis del código fuente.
> Versión: 2026-07-20 | Basado en: `seed_permisos.sql`, `layout.tsx`, `especificacion-siih.md` sección 9.

---

## Tabla de Contenido

1. [Tabla de Credenciales de Demo](#1-tabla-de-credenciales-de-demo)
2. [ADMIN](#2-admin)
3. [DIRECTOR](#3-director)
4. [MEDICO](#4-medico)
5. [ENFERMERA](#5-enfermera)
6. [FARMACEUTICO](#6-farmaceutico)
7. [TECNICO_LAB](#7-tecnico_lab)
8. [ADMISIONISTA](#8-admisionista)
9. [FACTURADOR](#9-facturador)
10. [PACIENTE](#10-paciente)
11. [Matriz de Permisos por Rol](#11-matriz-de-permisos-por-rol)
12. [Discrepancias Especificación vs Implementación](#12-discrepancias-especificación-vs-implementación)

---

## 1. Tabla de Credenciales de Demo

| # | Usuario | Contraseña | Rol | Actor Asociado | CI |
|---|---|---|---|---|---|
| 1 | `admin` | `admin123` | ADMIN | — | — |
| 2 | `director_test` | `dir123` | DIRECTOR | — | — |
| 3 | `dr_test` | `med123` | MEDICO | Dr. Carlos Rodriguez | V-11111111 |
| 4 | `nurse_test` | `nurse123` | ENFERMERA | Ana Martinez | V-30111222 |
| 5 | `nurse2_test` | `nurse123` | ENFERMERA | Lucia Hernandez | V-30222333 |
| 6 | `V-20111222` | `farm123` | FARMACEUTICO | Pedro Rodriguez | V-20111222 |
| 7 | `V-20333444` | `farm123` | FARMACEUTICO | Laura Fernandez | V-20333444 |
| 8 | `V-20555666` | `farm123` | FARMACEUTICO | Carlos Mendoza | V-20555666 |
| 9 | `lab_test` | `lab123` | TECNICO_LAB | Pedro Torres | V-20150999 |
| 10 | `adm_test` | `adm123` | ADMISIONISTA | Diego Torres | V-60000001 |
| 11 | `fact_test` | `fact123` | FACTURADOR | Maria Lopez Garcia | V-30000000 |
| 12 | `V-87654321` | `pac123` | PACIENTE | Maria Garcia | V-87654321 |

---

## 2. ADMIN

### 2.1 Descripción
Rol con acceso total al sistema. Gestiona usuarios, roles, permisos y tiene visibilidad transversal.

### 2.2 Permisos RBAC
Acceso total a los 11 módulos × 2 acciones = 22 permisos.

| Módulo | READ | WRITE |
|---|:---:|:---:|
| CITAS | ✅ | ✅ |
| HISTORIAL | ✅ | ✅ |
| ATENCION | ✅ | ✅ |
| LABORATORIO | ✅ | ✅ |
| FARMACIA | ✅ | ✅ |
| HOSPITALIZACION | ✅ | ✅ |
| FACTURACION | ✅ | ✅ |
| COMPRAS | ✅ | ✅ |
| REPORTES | ✅ | — |
| SEGURIDAD | ✅ | ✅ |
| AUDITORIA | ✅ | ✅ |

### 2.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Pacientes | `/pacientes` | HISTORIAL |
| Citas | `/citas` | CITAS |
| Atencion Medica | `/atencion` | ATENCION |
| Laboratorio | `/laboratorio` | LABORATORIO |
| Farmacia | `/farmacia` | FARMACIA |
| Hospitalizacion | `/hospitalizacion` | HOSPITALIZACION |
| Compras | `/compras` | COMPRAS |
| Facturacion | `/facturacion` | FACTURACION |
| Reportes | `/reportes` | REPORTES |
| Seguridad | `/seguridad` | SEGURIDAD |
| Notificaciones | `/notificaciones` | `_` |

**Total: 12 items** — Todos los módulos.

### 2.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad |
|---|---|---|
| 1 | `/dashboard` | Dashboard principal con tarjetas de módulos |
| 2 | `/pacientes` | Lista de pacientes con búsqueda |
| 3 | `/pacientes/nuevo` | Registro de nuevo paciente |
| 4 | `/pacientes/[id]` | Detalle/historial clínico del paciente |
| 5 | `/citas` | Lista de citas con filtros |
| 6 | `/citas/nueva` | Wizard de 5 pasos para nueva cita |
| 7 | `/citas/[id]` | Detalle de cita (puede gestionar) |
| 8 | `/atencion` | Dashboard diario de atenciones + emergencias |
| 9 | `/atencion/[id]` | Detalle de atención (datos clínicos, recetas, exámenes, hospitalización) |
| 10 | `/laboratorio` | Lista de exámenes de laboratorio |
| 11 | `/laboratorio/[id]` | Detalle de examen |
| 12 | `/farmacia` | Farmacia (recetas, medicamentos, inventario) |
| 13 | `/farmacia/recetas/[id]` | Detalle y dispensación de receta |
| 14 | `/hospitalizacion` | Lista de hospitalizaciones |
| 15 | `/hospitalizacion/[id]` | Detalle (signos vitales, medicación, alta) |
| 16 | `/compras` | Órdenes de compra a proveedores |
| 17 | `/facturacion` | Lista de facturas |
| 18 | `/facturacion/[id]` | Detalle de factura (pagar/anular) |
| 19 | `/reportes` | Dashboard BI con 5 tipos de reporte |
| 20 | `/seguridad` | Gestión de usuarios, roles, auditoría |
| 21 | `/notificaciones` | Bandeja de notificaciones |

**Total: 21 páginas**

### 2.5 Endpoints API Accesibles

| Método | Endpoint | Permiso Requerido | Notas |
|---|---|---|---|
| GET | `/api/seguridad/sesion` | — | Sesión actual |
| POST | `/api/seguridad/logout` | — | Cerrar sesión |
| GET | `/api/seguridad/usuarios` | SEGURIDAD/READ | Listar usuarios |
| POST | `/api/seguridad/usuarios` | SEGURIDAD/WRITE | Crear usuario + actor |
| GET | `/api/seguridad/usuarios/[id]` | SEGURIDAD/READ | Detalle usuario |
| PUT | `/api/seguridad/usuarios/[id]` | SEGURIDAD/WRITE | Actualizar usuario |
| PATCH | `/api/seguridad/usuarios/[id]/toggle-activo` | SEGURIDAD/WRITE | Activar/desactivar |
| GET | `/api/seguridad/roles` | SEGURIDAD/READ | Listar roles |
| GET | `/api/seguridad/roles/[id]/permisos` | SEGURIDAD/READ | Permisos de un rol |
| POST | `/api/seguridad/roles/[id]/permisos` | SEGURIDAD/WRITE | Agregar permiso |
| DELETE | `/api/seguridad/roles/[id]/permisos` | SEGURIDAD/WRITE | Quitar permiso |
| GET | `/api/seguridad/auditoria` | AUDITORIA/READ | Registro de auditoría |
| GET | `/api/pacientes` | manual* | Lista de pacientes |
| POST | `/api/pacientes` | HISTORIAL/WRITE | Crear paciente |
| GET | `/api/pacientes/buscar` | HISTORIAL/READ | Buscar por CI |
| GET | `/api/pacientes/[id]` | manual* | Detalle paciente |
| PUT | `/api/pacientes/[id]` | HISTORIAL/WRITE | Actualizar paciente |
| GET | `/api/pacientes/[id]/historial` | HISTORIAL/READ | Historial completo |
| GET | `/api/pacientes/[id]/historial/alergias` | HISTORIAL/READ | Alergias |
| POST | `/api/pacientes/[id]/historial/alergias` | HISTORIAL/WRITE | Agregar alergia |
| GET | `/api/pacientes/[id]/historial/antecedentes` | HISTORIAL/READ | Antecedentes |
| POST | `/api/pacientes/[id]/historial/antecedentes` | HISTORIAL/WRITE | Agregar antecedente |
| GET | `/api/citas` | CITAS/READ | Lista de citas |
| POST | `/api/citas` | CITAS/WRITE | Crear cita |
| GET | `/api/citas/[id]` | CITAS/READ | Detalle de cita |
| PATCH | `/api/citas/[id]` | CITAS/WRITE | Actualizar cita |
| POST | `/api/citas/reprogramar` | CITAS/WRITE | Reprogramar cita |
| GET | `/api/citas/disponibilidad` | CITAS/READ | Slots disponibles |
| GET | `/api/medicos` | CITAS/READ | Lista de médicos |
| GET | `/api/especialidades` | CITAS/READ | Lista de especialidades |
| GET | `/api/atencion` | ATENCION/READ | Lista de atenciones |
| POST | `/api/atencion` | ATENCION/WRITE | Crear atención |
| GET | `/api/atencion/[id]` | ATENCION/READ | Detalle de atención |
| PATCH | `/api/atencion/[id]` | ATENCION/WRITE | Actualizar/cerrar atención |
| POST | `/api/atencion/[id]/signos-vitales` | ATENCION/WRITE | Registrar signos vitales |
| GET | `/api/laboratorio/examenes` | LABORATORIO/READ | Lista de exámenes |
| POST | `/api/laboratorio/examenes` | LABORATORIO/WRITE | Solicitar examen |
| GET | `/api/laboratorio/examenes/[id]` | LABORATORIO/READ | Detalle de examen |
| PATCH | `/api/laboratorio/examenes/[id]/tomar` | LABORATORIO/WRITE | Tomar examen |
| POST | `/api/laboratorio/examenes/[id]/resultado` | LABORATORIO/WRITE | Registrar resultado |
| GET | `/api/laboratorio/carga` | LABORATORIO/READ | Carga de trabajo |
| GET | `/api/farmacia/medicamentos` | FARMACIA/READ | Catálogo de medicamentos |
| POST | `/api/farmacia/medicamentos` | FARMACIA/WRITE | Crear medicamento |
| PATCH | `/api/farmacia/medicamentos/[id]` | FARMACIA/WRITE | Actualizar medicamento |
| GET | `/api/farmacia/inventario` | FARMACIA/READ | Lotes de inventario |
| POST | `/api/farmacia/inventario` | FARMACIA/WRITE | Crear lote |
| PATCH | `/api/farmacia/inventario/[id]` | FARMACIA/WRITE | Actualizar lote |
| GET | `/api/farmacia/recetas` | FARMACIA/READ | Lista de recetas |
| POST | `/api/farmacia/recetas` | ATENCION/WRITE | Crear receta (médico) |
| GET | `/api/farmacia/recetas/[id]` | FARMACIA/READ | Detalle de receta |
| PATCH | `/api/farmacia/recetas/[id]` | FARMACIA/WRITE | Dispensar receta |
| GET | `/api/farmacia/proveedores` | COMPRAS/READ | Lista de proveedores |
| POST | `/api/farmacia/proveedores` | COMPRAS/WRITE | Crear proveedor |
| PATCH | `/api/farmacia/proveedores/[id]` | COMPRAS/WRITE | Actualizar proveedor |
| GET | `/api/hospitalizacion` | HOSPITALIZACION/READ | Lista de hospitalizaciones |
| POST | `/api/hospitalizacion` | HOSPITALIZACION/WRITE | Crear hospitalización |
| GET | `/api/hospitalizacion/[id]` | HOSPITALIZACION/READ | Detalle |
| PATCH | `/api/hospitalizacion/[id]` | HOSPITALIZACION/WRITE | Dar de alta |
| GET | `/api/hospitalizacion/[id]/signos-vitales` | HOSPITALIZACION/READ | Signos vitales |
| POST | `/api/hospitalizacion/[id]/signos-vitales` | HOSPITALIZACION/WRITE | Registrar signos |
| POST | `/api/hospitalizacion/[id]/medicacion` | HOSPITALIZACION/WRITE | Administrar medicación |
| GET | `/api/cama` | HOSPITALIZACION/READ | Lista de camas |
| GET | `/api/facturacion` | FACTURACION/READ | Lista de facturas |
| POST | `/api/facturacion` | FACTURACION/WRITE | Crear factura |
| GET | `/api/facturacion/[id]` | FACTURACION/READ | Detalle de factura |
| PATCH | `/api/facturacion/[id]` | FACTURACION/WRITE | Pagar/anular factura |
| GET | `/api/facturacion/pendientes` | FACTURACION/READ | Facturas pendientes |
| GET | `/api/compras` | COMPRAS/READ | Lista de compras |
| POST | `/api/compras` | COMPRAS/WRITE | Crear compra |
| GET | `/api/compras/[id]` | COMPRAS/READ | Detalle de compra |
| PATCH | `/api/compras/[id]` | COMPRAS/WRITE | Recibir compra |
| GET | `/api/reportes` | REPORTES/READ | 5 tipos de reporte BI |
| GET | `/api/notificaciones` | manual* | Bandeja de notificaciones |
| PATCH | `/api/notificaciones` | manual* | Marcar notificación |
| PATCH | `/api/notificaciones/marcar-todas` | manual* | Marcar todas |

*\*manual\* = usa verificación de rol manual en lugar de `verificarPermiso()`*

**Total: ~75 endpoints**

### 2.6 Credenciales Demo

| Usuario | Contraseña | Estado |
|---|---|---|
| `admin` | `admin123` | ✅ Verificado |

### 2.7 Notas Especiales
- Es el **único rol** con acceso a SEGURIDAD (gestión de usuarios/roles).
- Puede crear facturas para pacientes, pagarlas y anularlas.
- Puede crear hospitalizaciones pero no es el caso de uso típico (directo por emergencia).

---

## 3. DIRECTOR

### 3.1 Descripción
Rol de supervisión con acceso de lectura a la mayoría de módulos. Escritura limitada a Facturación y Compras.

### 3.2 Permisos RBAC

| Módulo | READ | WRITE |
|---|:---:|:---:|
| CITAS | ✅ | — |
| HISTORIAL | ✅ | — |
| ATENCION | ✅ | — |
| LABORATORIO | ✅ | — |
| FARMACIA | ✅ | — |
| HOSPITALIZACION | ✅ | — |
| FACTURACION | ✅ | ✅ |
| COMPRAS | ✅ | ✅ |
| REPORTES | ✅ | — |
| SEGURIDAD | — | — |
| AUDITORIA | ✅ | — |

### 3.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Pacientes | `/pacientes` | HISTORIAL |
| Citas | `/citas` | CITAS |
| Atencion Medica | `/atencion` | ATENCION |
| Laboratorio | `/laboratorio` | LABORATORIO |
| Farmacia | `/farmacia` | FARMACIA |
| Hospitalizacion | `/hospitalizacion` | HOSPITALIZACION |
| Compras | `/compras` | COMPRAS |
| Facturacion | `/facturacion` | FACTURACION |
| Reportes | `/reportes` | REPORTES |
| Notificaciones | `/notificaciones` | `_` |

**Total: 11 items** — No ve "Seguridad" (no tiene permiso SEGURIDAD).

### 3.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad | Modo |
|---|---|---|---|
| 1 | `/dashboard` | Dashboard | Normal |
| 2 | `/pacientes` | Lista de pacientes | Solo lectura |
| 3 | `/pacientes/[id]` | Detalle paciente | Solo lectura |
| 4 | `/citas` | Lista de citas | Solo lectura |
| 5 | `/citas/[id]` | Detalle de cita | Solo lectura |
| 6 | `/atencion` | Dashboard de atenciones | Solo lectura |
| 7 | `/atencion/[id]` | Detalle de atención | Solo lectura |
| 8 | `/laboratorio` | Lista de exámenes | Solo lectura |
| 9 | `/laboratorio/[id]` | Detalle de examen | Solo lectura |
| 10 | `/farmacia` | Farmacia (recetas, medicamentos, inventario) | Solo lectura |
| 11 | `/farmacia/recetas/[id]` | Detalle de receta | Solo lectura |
| 12 | `/hospitalizacion` | Lista de hospitalizaciones | Solo lectura |
| 13 | `/hospitalizacion/[id]` | Detalle de hospitalización | Solo lectura |
| 14 | `/compras` | Órdenes de compra | **Escritura** (puede recibir) |
| 15 | `/facturacion` | Facturas | **Escritura** (puede pagar/anular) |
| 16 | `/facturacion/[id]` | Detalle de factura | **Escritura** |
| 17 | `/reportes` | Dashboard BI | Solo lectura |
| 18 | `/notificaciones` | Bandeja de notificaciones | Marcar como enviada/fallida |

**Total: 18 páginas**

### 3.5 Comportamiento en Páginas

- **Citas:** Solo lectura. Los botones de "Nueva Cita", "Confirmar Llegada", "Reprogramar", y "Cancelar" están deshabilitados o ocultos para DIRECTOR.
- **Atención:** Solo lectura. No puede editar datos clínicos, crear recetas, solicitar exámenes ni hospitalizar.
- **Laboratorio:** Solo lectura. No puede tomar exámenes ni registrar resultados.
- **Farmacia:** Solo lectura. No puede dispensar recetas.
- **Hospitalización:** Solo lectura. No puede registrar signos vitales, administrar medicación ni dar de alta.
- **Facturación:** **Puede pagar y anular facturas** (ACCION_WRITE en FACTURACION).
- **Compras:** **Puede recibir compras** (ACCION_WRITE en COMPRAS).

### 3.6 ⚠️ Discrepancia: Auditoría

El DIRECTOR tiene permiso `AUDITORIA/READ` en la BD, pero **no tiene acceso al módulo SEGURIDAD** en el sidebar. La pestaña de "Auditoría" está dentro de la página `/seguridad`, que requiere el permiso `SEGURIDAD` para aparecer en el menú.

**Resultado:** El DIRECTOR puede llamar al endpoint `GET /api/seguridad/auditoria` (verifica `AUDITORIA/READ`), pero **no tiene forma de acceder desde la interfaz** porque la página `/seguridad` no aparece en su sidebar.

### 3.7 Credenciales Demo

| Usuario | Contraseña | Estado |
|---|---|---|
| `director_test` | `dir123` | ✅ Verificado |

---

## 4. MEDICO

### 4.1 Descripción
Rol clínico principal. Gestiona atenciones médicas, solicita exámenes, crea recetas, hospitaliza pacientes.

### 4.2 Permisos RBAC

| Módulo | READ | WRITE |
|---|:---:|:---:|
| CITAS | ✅ | — |
| HISTORIAL | ✅ | ✅ |
| ATENCION | ✅ | ✅ |
| LABORATORIO | ✅ | ✅ |
| FARMACIA | ✅ | — |
| HOSPITALIZACION | ✅ | ✅ |
| FACTURACION | — | — |
| COMPRAS | — | — |
| REPORTES | — | — |
| SEGURIDAD | — | — |
| AUDITORIA | — | — |

### 4.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Pacientes | `/pacientes` | HISTORIAL |
| Citas | `/citas` | CITAS |
| Atencion Medica | `/atencion` | ATENCION |
| Laboratorio | `/laboratorio` | LABORATORIO |
| Farmacia | `/farmacia` | FARMACIA |
| Hospitalizacion | `/hospitalizacion` | HOSPITALIZACION |
| Notificaciones | `/notificaciones` | `_` |

**Total: 8 items**

### 4.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad | Modo |
|---|---|---|---|
| 1 | `/dashboard` | Dashboard | Normal |
| 2 | `/pacientes` | Lista de pacientes | Lectura/Escritura |
| 3 | `/pacientes/nuevo` | Nuevo paciente | Escritura |
| 4 | `/pacientes/[id]` | Detalle/historial | Lectura/Escritura |
| 5 | `/citas` | Lista de citas | **Solo lectura** |
| 6 | `/citas/[id]` | Detalle de cita | **Solo lectura** |
| 7 | `/atencion` | Dashboard diario | Crear atenciones |
| 8 | `/atencion/[id]` | Detalle atención | **Completo** (clínico, recetas, exámenes, hospitalizar) |
| 9 | `/laboratorio` | Exámenes propios | Lectura + carga actual |
| 10 | `/laboratorio/[id]` | Detalle examen | Solo lectura |
| 11 | `/farmacia` | Catálogo de medicamentos | **Solo lectura** (sin inventario ni recetas) |
| 12 | `/hospitalizacion` | Hospitalizaciones | Solo lectura (filtrado a propios) |
| 13 | `/hospitalizacion/[id]` | Detalle hospitalización | Alta (dar de alta) |
| 14 | `/notificaciones` | Bandeja de notificaciones | Marcar notificaciones |

**Total: 14 páginas**

### 4.5 Comportamiento en Páginas

- **Citas:** Solo lectura. Ve las citas de sus pacientes. No puede crear, confirmar, reprogramar ni cancelar.
- **Atención (ATENCION):** Rol principal. Puede:
  - Abrir atención desde cita (EN_ESPERA → en atención)
  - Crear emergencias (con paciente nuevo o existente)
  - Editar motivo_consulta, diagnostico, tratamiento, observaciones
  - Registrar signos vitales
  - **Crear recetas** (POST `/api/farmacia/recetas` con permiso ATENCION/WRITE)
  - **Solicitar exámenes** de laboratorio
  - **Hospitalizar** paciente (seleccionar cama disponible)
  - Cerrar atención
- **Laboratorio:** Ve sus propios exámenes y la carga actual del lab. No puede tomar ni registrar resultados (eso es TECNICO_LAB).
- **Farmacia:** Solo ve el catálogo de medicamentos (para conocer disponibilidad al recetar). No ve inventario ni recetas.
- **Hospitalización:** Solo ve hospitalizaciones de sus pacientes. Puede dar de alta.
  - **No puede** registrar signos vitales ni administrar medicación (eso es ENFERMERA).

### 4.6 Restricciones de Datos (Filtros Manuales)

- `GET /api/citas`: ve solo citas de pacientes asignados a él ( filtro por medico_id)
- `GET /api/laboratorio/examenes`: ve solo exámenes de sus pacientes
- `GET /api/hospitalizacion`: ve solo hospitalizaciones de sus pacientes
- `GET /api/hospitalizacion/[id]`: solo si el paciente le pertenece (usa helper `getMedicoId()`)

### 4.7 Credenciales Demo

| Usuario | Contraseña | Médico ID | Especialidad | Estado |
|---|---|---|---|---|
| `dr_test` | `med123` | 1 (Dr. Carlos Rodriguez) | Medicina General | ✅ Verificado |

---

## 5. ENFERMERA

### 5.1 Descripción
Rol de apoyo clínico. Registra signos vitales y administra medicación en hospitalizaciones. Ve historial de pacientes hospitalizados.

### 5.2 Permisos RBAC

| Módulo | READ | WRITE |
|---|:---:|:---:|
| HISTORIAL | ✅ | — |
| ATENCION | ✅ | ✅ |
| HOSPITALIZACION | ✅ | ✅ |
| CITAS | — | — |
| LABORATORIO | — | — |
| FARMACIA | — | — |
| FACTURACION | — | — |
| COMPRAS | — | — |
| REPORTES | — | — |
| SEGURIDAD | — | — |
| AUDITORIA | — | — |

### 5.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Pacientes | `/pacientes` | HISTORIAL |
| Atencion Medica | `/atencion` | ATENCION |
| Hospitalizacion | `/hospitalizacion` | HOSPITALIZACION |
| Notificaciones | `/notificaciones` | `_` |

**Total: 5 items**

### 5.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad | Modo |
|---|---|---|---|
| 1 | `/dashboard` | Dashboard | Normal |
| 2 | `/pacientes` | Lista de pacientes | Solo lectura |
| 3 | `/pacientes/[id]` | Detalle paciente | Solo lectura |
| 4 | `/atencion` | Dashboard diario | Ver citas pendientes |
| 5 | `/atencion/[id]` | Detalle atención | **Registrar signos vitales** |
| 6 | `/hospitalizacion` | Hospitalizaciones | **Vista tarjetas** (con alerta de alergias) |
| 7 | `/hospitalizacion/[id]` | Detalle hospitalización | **Completo**: signos vitales, medicación, alergias, antecedentes |
| 8 | `/notificaciones` | Bandeja de notificaciones | Marcar notificaciones |

**Total: 8 páginas**

### 5.5 Comportamiento en Páginas

- **Atención:** Ve las citas del día y puede registrar signos vitales para una atención en curso. No puede editar datos clínicos ni crear recetas.
- **Hospitalización:** Vista principal de ENFERMERA.
  - Lista en formato tarjetas (no tabla) con info de paciente, cama, diagnóstico y **alerta de alergias prominente**.
  - Detalle: puede registrar **signos vitales** (temperatura, PA, FC, FR, SpO2, peso, talla).
  - Puede **administrar medicación** (seleccionar medicamento, dosis, vía, frecuencia).
  - Puede ver **alergias** y **antecedentes** (solo lectura).
  - **Solo para hospitalizaciones con estado ACTIVA.**

### 5.6 Restricciones de Datos

- `GET /api/hospitalizacion`: solo ve hospitalizaciones con estado `ACTIVA`
- `POST /api/hospitalizacion/[id]/signos-vitales`: verifica que el usuario tiene un `enfermera_id` asociado
- `POST /api/hospitalizacion/[id]/medicacion`: verifica que el usuario tiene un `enfermera_id` asociado
- FEFO (First Expired First Out) al descontar inventario de medicación

### 5.7 Credenciales Demo

| Usuario | Contraseña | Enfermera ID | Turno | Estado |
|---|---|---|---|---|
| `nurse_test` | `nurse123` | 1 (Ana Martinez) | MAÑANA | ✅ Verificado |
| `nurse2_test` | `nurse123` | 2 (Lucia Hernandez) | TARDE | ✅ Verificado |

---

## 6. FARMACEUTICO

### 6.1 Descripción
Gestiona medicamentos, inventario y dispensación de recetas. También gestiona compras a proveedores.

### 6.2 Permisos RBAC

| Módulo | READ | WRITE |
|---|:---:|:---:|
| FARMACIA | ✅ | ✅ |
| COMPRAS | ✅ | ✅ |
| CITAS | — | — |
| HISTORIAL | — | — |
| ATENCION | — | — |
| LABORATORIO | — | — |
| HOSPITALIZACION | — | — |
| FACTURACION | — | — |
| REPORTES | — | — |
| SEGURIDAD | — | — |
| AUDITORIA | — | — |

### 6.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Farmacia | `/farmacia` | FARMACIA |
| Compras | `/compras` | COMPRAS |
| Notificaciones | `/notificaciones` | `_` |

**Total: 4 items** — No ve Pacientes (sin HISTORIAL perm).

### 6.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad | Modo |
|---|---|---|---|
| 1 | `/dashboard` | Dashboard | Normal |
| 2 | `/farmacia` | Farmacia completa | **3 tabs**: Recetas, Medicamentos, Inventario |
| 3 | `/farmacia/recetas/[id]` | Detalle/dispensación receta | **Dispensar** (FEFO) |
| 4 | `/compras` | Órdenes de compra | **Crear y recibir** |
| 5 | `/notificaciones` | Bandeja de notificaciones | Marcar notificaciones |

**Total: 5 páginas**

### 6.5 Comportamiento en Páginas

- **Farmacia:** Vista completa con 3 pestañas:
  - **Recetas:** Lista de todas las recetas con búsqueda y filtro por estado. Puede ver detalle y dispensar.
  - **Medicamentos:** Catálogo completo con búsqueda, información de stock.
  - **Inventario:** Vista a nivel de lote con código, cantidad, stock mínimo, vencimiento (con advertencias de vencimiento próximo/vencido), ubicación, precio.
- **Dispensación de recetas:** Auto-dispensación en orden FEFO. Descuenta inventario por lote. Genera notificación STOCK_BAJO si elstock cae bajo el mínimo.
- **Compras:** Crear órdenes de compra con ítems, recibirlas (lo que crea/actualiza lotes de inventario).

### 6.6 Restricciones de Datos

- `GET /api/farmacia/inventario`: PACIENTE recibe 403 (bloqueado completamente)
- `PATCH /api/farmacia/recetas/[id]`: dispensación FEFO con transacción y bloqueo FOR UPDATE

### 6.7 Credenciales Demo

| Usuario | Contraseña | Farmacéutico ID | Estado |
|---|---|---|---|
| `V-20111222` | `farm123` | 1 (Pedro Rodriguez) | ✅ Verificado |
| `V-20333444` | `farm123` | 2 (Laura Fernandez) | ✅ Verificado |
| `V-20555666` | `farm123` | 3 (Carlos Mendoza) | ✅ Verificado |

---

## 7. TECNICO_LAB

### 7.1 Descripción
Procesa exámenes de laboratorio: toma exámenes pendientes y registra resultados.

### 7.2 Permisos RBAC

| Módulo | READ | WRITE |
|---|:---:|:---:|
| LABORATORIO | ✅ | ✅ |
| OTROS | — | — |

**Solo 1 módulo: LABORATORIO R/W.**

### 7.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Laboratorio | `/laboratorio` | LABORATORIO |
| Notificaciones | `/notificaciones` | `_` |

**Total: 3 items**

### 7.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad | Modo |
|---|---|---|---|
| 1 | `/dashboard` | Dashboard | Normal |
| 2 | `/laboratorio` | Exámenes | **3 secciones**: Pendientes (Tomar), En Proceso (Resultado), Completados |
| 3 | `/laboratorio/[id]` | Detalle examen | **Tomar** y **Registrar resultado** |
| 4 | `/notificaciones` | Bandeja de notificaciones | Marcar notificaciones |

**Total: 4 páginas**

### 7.5 Comportamiento en Páginas

- **Laboratorio:** Vista con 3 secciones:
  - **Examenes Pendientes** (SOLICITADO): botón "Tomar" que cambia estado a EN_PROCESO y asigna tecnico_id.
  - **En Proceso** (EN_PROCESO): enlace "Registrar Resultado" que lleva al detalle.
  - **Completados** (COMPLETADO): muestra resultado y bandera de resultado crítico.
- **Detalle de examen:**
  - Si SOLICITADO: botón "Tomar Examen".
  - Si EN_PROCESO: formulario para registrar resultado (textarea), valores de referencia, observaciones, y checkbox de resultado crítico.
  - Resultado crítico genera notificación ALERTA_LAB al médico tratante.

### 7.6 Restricciones de Datos

- `GET /api/laboratorio/examenes`: ve SOLICITADO + EN_PROCESO + COMPLETADO propios
- `POST /api/laboratorio/examenes/[id]/resultado`: solo el técnico que tomó el examen puede registrar resultado

### 7.7 Credenciales Demo

| Usuario | Contraseña | Técnico Lab ID | Estado |
|---|---|---|---|
| `lab_test` | `lab123` | 1 (Pedro Torres) | ✅ Verificado |

---

## 8. ADMISIONISTA

### 8.1 Descripción
Gestiona el proceso de admisión: registro de pacientes y agendamiento de citas.

### 8.2 Permisos RBAC

| Módulo | READ | WRITE |
|---|:---:|:---:|
| CITAS | ✅ | ✅ |
| HOSPITALIZACION | ✅ | — |
| OTROS | — | — |

### 8.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Pacientes | `/pacientes` | HISTORIAL |
| Citas | `/citas` | CITAS |
| Hospitalizacion | `/hospitalizacion` | HOSPITALIZACION |
| Notificaciones | `/notificaciones` | `_` |

**Total: 5 items**

### 8.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad | Modo |
|---|---|---|---|
| 1 | `/dashboard` | Dashboard | Normal |
| 2 | `/pacientes` | Lista de pacientes | **Crear**, ver, buscar |
| 3 | `/pacientes/nuevo` | Nuevo paciente | **Escritura completa** |
| 4 | `/pacientes/[id]` | Detalle paciente | Lectura + agregar alergias/antecedentes |
| 5 | `/citas` | Lista de citas | **Crear**, gestionar, cancelar |
| 6 | `/citas/nueva` | Wizard de nueva cita | **Escritura completa** |
| 7 | `/citas/[id]` | Detalle de cita | Confirmar llegada, marcar en espera, completar, reprogramar |
| 8 | `/atencion` | Dashboard de atenciones | Confirmar llegada de citas |
| 9 | `/hospitalizacion` | Hospitalizaciones | **Solo lectura** |
| 10 | `/notificaciones` | Bandeja de notificaciones | Marcar notificaciones |

**Total: 10 páginas**

### 8.5 Comportamiento en Páginas

- **Pacientes:** Puede crear nuevos pacientes con registro completo (datos personales, alergias, cuenta de usuario PACIENTE opcional).
- **Citas:** Rol principal de gestión. Puede:
  - Crear citas (wizard de 5 pasos: paciente → especialidad → médico → fecha/hora → confirmación)
  - Confirmar llegada de pacientes (CONFIRMADA → EN_ESPERA)
  - Marcar en espera
  - Completar citas
  - Reprogramar citas
  - Cancelar citas
- **Atención:** Solo puede confirmar llegada de citas en el dashboard diario.
- **Hospitalización:** Solo lectura (ve la lista).

### 8.6 Credenciales Demo

| Usuario | Contraseña | Admisionista ID | Estado |
|---|---|---|---|
| `adm_test` | `adm123` | 1 (Diego Torres) | ✅ Verificado |

---

## 9. FACTURADOR

### 9.1 Descripción
Gestiona facturación: crea facturas, registra pagos y anula facturas.

### 9.2 Permisos RBAC

| Módulo | READ | WRITE |
|---|:---:|:---:|
| FACTURACION | ✅ | ✅ |
| OTROS | — | — |

**Solo 1 módulo: FACTURACION R/W.**

### 9.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Facturacion | `/facturacion` | FACTURACION |
| Notificaciones | `/notificaciones` | `_` |

**Total: 3 items**

### 9.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad | Modo |
|---|---|---|---|
| 1 | `/dashboard` | Dashboard | Normal |
| 2 | `/facturacion` | Lista de facturas | **Crear**, pagar, anular |
| 3 | `/facturacion/[id]` | Detalle de factura | **Pagar** (con descuento/cobertura), **Anular** |
| 4 | `/notificaciones` | Bandeja de notificaciones | Marcar notificaciones |

**Total: 4 páginas**

### 9.5 Comportamiento en Páginas

- **Facturación:**
  - **Crear factura:** Ingresa `paciente_id`. El sistema busca automáticamente todos los servicios no facturados: atenciones, recetas dispensadas, exámenes completados, hospitalizaciones con alta. Usa la tabla `tarifa_servicio` para precios.
  - **Pagar:** Puede aplicar descuento y cobertura de seguro. Recalcula el total. Cambia estado a PAGADA. Genera notificación SISTEMA.
  - **Anular:** Solo desde estado PENDIENTE o PAGADA. Registra en auditoría (RN-08).
  - Usa bloqueo `FOR UPDATE` para evitar concurrencia en pagos/anulaciones.

### 9.6 Credenciales Demo

| Usuario | Contraseña | Facturador ID | Estado |
|---|---|---|---|
| `fact_test` | `fact123` | 1 (Maria Lopez Garcia) | ✅ Verificado |

---

## 10. PACIENTE

### 10.1 Descripción
Rol de auto-servicio. Ve su propio historial, agenda y cancela citas, ve disponibilidad de medicamentos y sus facturas.

### 10.2 Permisos RBAC

| Módulo | READ | WRITE |
|---|:---:|:---:|
| CITAS | ✅ | ✅ |
| HISTORIAL | ✅ | — |
| FARMACIA | ✅ | — |
| FACTURACION | ✅ | — |
| OTROS | — | — |

### 10.3 Menú Sidebar Visible

| Menú | Ruta | Módulo |
|---|---|---|
| Dashboard | `/dashboard` | `_` |
| Mi Historial | `/mi-historial` | HISTORIAL |
| Citas | `/citas` | CITAS |
| Farmacia | `/farmacia` | FARMACIA |
| Facturacion | `/facturacion` | FACTURACION |
| Notificaciones | `/notificaciones` | `_` |

**Total: 6 items** — Ve "Mi Historial" en lugar de "Pacientes".

### 10.4 Páginas Frontend Accesibles

| # | Ruta | Funcionalidad | Modo |
|---|---|---|---|
| 1 | `/dashboard` | Dashboard | Normal |
| 2 | `/mi-historial` | Mi historial clínico | **Solo lectura** (datos, alergias, antecedentes, atenciones) |
| 3 | `/citas` | Mis citas | Ver propias, **crear**, **cancelar** |
| 4 | `/citas/nueva` | Nueva cita | **Escritura** (wizard completo) |
| 5 | `/citas/[id]` | Detalle de cita | Solo lectura |
| 6 | `/farmacia` | Medicamentos | **Solo disponibilidad** (sin stock numérico) |
| 7 | `/facturacion` | Mis facturas | **Solo lectura** |
| 8 | `/facturacion/[id]` | Detalle de factura | Solo lectura |
| 9 | `/notificaciones` | Bandeja de notificaciones | Marcar notificaciones |

**Total: 9 páginas**

### 10.5 Comportamiento en Páginas

- **Mi Historial:** Vista de auto-servicio con 4 pestañas:
  - "Mis Datos": demografía + últimos signos vitales
  - "Alergias": lista con badges de severidad
  - "Antecedentes": lista con badges de tipo
  - "Atenciones": historial de atenciones médicas
- **Citas:** Ve solo sus propias citas. Puede crear nuevas (wizard completo). Puede cancelar citas activas.
- **Farmacia:** Solo ve catálogo de medicamentos con estados DISPONIBLE/NO DISPONIBLE (sin cantidades numéricas).
- **Facturación:** Solo ve sus propias facturas. No puede pagar ni anular.

### 10.6 Restricciones de Datos (RN-20)

- `GET /api/pacientes`: solo ve su propio registro
- `GET /api/pacientes/[id]`: solo ve su propio registro
- `GET /api/pacientes/[id]/historial`: solo ve su propio historial
- `GET /api/citas`: auto-filtrado a citas propias
- `GET /api/citas/[id]`: solo ve citas propias
- `GET /api/farmacia/inventario`: **bloqueado** (403)
- `GET /api/farmacia/medicamentos`: solo ve estado DISPONIBLE/NO DISPONIBLE (sin stock numérico, RN-21)
- `GET /api/facturacion`: auto-filtrado a facturas propias
- `GET /api/facturacion/paciente`: endpoint dedicado para facturas del paciente logueado

### 10.7 Credenciales Demo

| Usuario | Contraseña | Paciente CI | Estado |
|---|---|---|---|
| `V-87654321` | `pac123` | V-87654321 (Maria Garcia) | ✅ Verificado |

---

## 11. Matriz de Permisos por Rol

### 11.1 Permisos en Base de Datos (seed_permisos.sql)

| Módulo | ADMIN | DIRECTOR | MEDICO | ENFERMERA | FARMACEUTICO | TECNICO_LAB | ADMISIONISTA | FACTURADOR | PACIENTE |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| CITAS R | ✅ | ✅ | ✅ | — | — | — | ✅ | — | ✅ |
| CITAS W | ✅ | — | — | — | — | — | ✅ | — | ✅ |
| HISTORIAL R | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| HISTORIAL W | ✅ | — | ✅ | — | — | — | — | — | — |
| ATENCION R | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — |
| ATENCION W | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| LABORATORIO R | ✅ | ✅ | ✅ | — | — | ✅ | — | — | — |
| LABORATORIO W | ✅ | — | ✅ | — | — | ✅ | — | — | — |
| FARMACIA R | ✅ | ✅ | ✅ | — | ✅ | — | — | — | ✅ |
| FARMACIA W | ✅ | — | — | — | ✅ | — | — | — | — |
| HOSPITALIZACION R | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — |
| HOSPITALIZACION W | ✅ | — | ✅ | ✅ | — | — | — | — | — |
| FACTURACION R | ✅ | ✅ | — | — | — | — | — | ✅ | ✅ |
| FACTURACION W | ✅ | ✅ | — | — | — | — | — | ✅ | — |
| COMPRAS R | ✅ | ✅ | — | — | ✅ | — | — | — | — |
| COMPRAS W | ✅ | ✅ | — | — | ✅ | — | — | — | — |
| REPORTES R | ✅ | ✅ | — | — | — | — | — | — | — |
| SEGURIDAD R | ✅ | — | — | — | — | — | — | — | — |
| SEGURIDAD W | ✅ | — | — | — | — | — | — | — | — |
| AUDITORIA R | ✅ | ✅ | — | — | — | — | — | — | — |
| AUDITORIA W | ✅ | — | — | — | — | — | — | — | — |

### 11.2 Conteo de Permisos

| Rol | Permisos Totales | Módulos con Acceso |
|---|---|---|
| ADMIN | 22 (todos) | 11 |
| DIRECTOR | 12 | 10 (sin SEGURIDAD) |
| MEDICO | 10 | 6 |
| ENFERMERA | 5 | 3 |
| FARMACEUTICO | 4 | 2 |
| ADMISIONISTA | 3 | 2 |
| TECNICO_LAB | 2 | 1 |
| FACTURADOR | 2 | 1 |
| PACIENTE | 5 | 4 |

---

## 12. Discrepancias Especificación vs Implementación

### 12.1 DIRECTOR — Auditoría Inaccesible

| Aspecto | Especificación (sección 9) | Implementación |
|---|---|---|
| Auditoría | DIRECTOR tiene R | Tiene permiso `AUDITORIA/READ` en BD, pero no hay menú sidebar para acceder |

**Impacto:** La pestaña de Auditoría está dentro de la página `/seguridad` que requiere permiso `SEGURIDAD`. El DIRECTOR no tiene `SEGURIDAD/READ`.

### 12.2 ADMIN — Hospitalización

| Aspecto | Especificación | Implementación |
|---|---|---|
| Hospitalización | ADMIN tiene `—` | ADMIN tiene `HOSPITALIZACION/READ/WRITE` en BD (acceso total) |

**Nota:** La especificación dice `—` pero el seed da acceso total al ADMIN. Esto es intencional (ADMIN tiene acceso total).

### 12.3 Endpoint POST /api/farmacia/recetas

| Aspecto | Lo esperado | Implementación |
|---|---|---|
| Permiso | `FARMACIA/WRITE` | Usa `ATENCION/WRITE` (porque es el médico quien crea la receta) |

**Nota:** Esto es correcto funcionalmente (el médico crea recetas desde atención), pero puede causar confusión ya que vive bajo la ruta `/api/farmacia/`.

### 12.4 Endpoints sin verificarPermiso()

| Endpoint | Método | Auth Method | Nota |
|---|---|---|---|
| `GET /api/pacientes` | GET | Manual role check | PACIENTE solo ve propio |
| `GET /api/pacientes/[id]` | GET | Manual role check | PACIENTE solo ve propio |
| `GET /api/notificaciones` | GET | Manual role check | ADMIN/DIRECTOR ven todos |
| `PATCH /api/notificaciones` | PATCH | Manual role check | ADMIN/DIRECTOR modifican cualquiera |
| `PATCH /api/notificaciones/marcar-todas` | PATCH | Manual role check | ADMIN/DIRECTOR marcan todos |

Estos endpoints usan `getSesionActual()` para autenticación pero implementan RBAC con consultas manuales a la tabla `rol` en lugar de llamar `verificarPermiso()`.
