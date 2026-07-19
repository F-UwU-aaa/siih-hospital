# SIIH — DOCUMENTO TÉCNICO DEFINITIVO v2
## Sistema Integrado de Información Hospitalaria
### Hospital Universitario San Andrés

---

## 1. ACTORES DEL SISTEMA

| # | Actor | Tipo | Función principal |
|---|---|---|---|
| 1 | Paciente | Primario | Solicita/cancela/reprograma citas vía app, selecciona especialista con horarios disponibles, consulta su historial clínico propio, consulta disponibilidad de medicamentos en farmacia |
| 2 | Admisionista | Primario | Registra pacientes, programa citas normales y de emergencia, gestiona admisiones hospitalarias |
| 3 | Médico | Primario | Atiende pacientes, registra diagnósticos, emite recetas, solicita exámenes, gestiona altas hospitalarias, consulta disponibilidad de farmacia e inventario de laboratorio |
| 4 | Enfermera | Primario | Registra signos vitales, administra medicamentos en hospitalización, visualiza lista de pacientes hospitalizados activos con alertas de alergias |
| 5 | Farmacéutico | Primario | Controla inventario de medicamentos, dispensa recetas, gestiona compras a proveedores |
| 6 | Técnico de Laboratorio | Primario | Recibe órdenes de examen, procesa muestras, registra resultados, queda registrado en cada examen que procesa |
| 7 | Facturador | Primario | Genera facturas a partir de servicios prestados, aplica descuentos/seguros, registra cobros |
| 8 | Director / Gerencia | Secundario | Consulta reportes y dashboards BI; no opera el sistema en el día a día |
| 9 | Administrador del Sistema | Secundario | Gestiona usuarios, roles, permisos y auditoría; crea y administra cuentas de todos los actores del sistema (médicos, enfermeras, técnicos, etc.) |
| 10 | Sistema de Notificaciones | Externo | Envía recordatorios automáticos por SMS/correo a pacientes Y médicos (citas, alertas críticas de laboratorio, stock bajo) |

> **Nota de unificación:** los documentos originales usaban "Cajero" y "Facturador" para el mismo actor. Se estandariza como **Facturador** en todo el sistema.

---

## 2. MER — ENTIDADES Y ATRIBUTOS

> Todas las entidades usan **PostgreSQL**. `SERIAL PRIMARY KEY` equivale a `BIGSERIAL` si se prefiere.

---

### PACIENTE
```sql
id                   SERIAL PRIMARY KEY
ci                   VARCHAR(20)  UNIQUE NOT NULL        -- documento de identidad
nombre               VARCHAR(100) NOT NULL
apellido             VARCHAR(100) NOT NULL
fecha_nacimiento     DATE         NOT NULL
sexo                 CHAR(1)                             -- M / F / O
direccion            VARCHAR(255)
telefono             VARCHAR(20)
email                VARCHAR(100)
seguro_medico        VARCHAR(100)
registrado_por       INTEGER      FK → USUARIO (nullable)  -- Admisionista que lo registró
huella_dactilar_ref  TEXT         (nullable)             -- ⚠ referencia al sistema biométrico externo
foto_rostro_ref      TEXT         (nullable)             -- ⚠ URL/ref al sistema de reconocimiento facial externo
activo               BOOLEAN      DEFAULT TRUE
```

> **Nota biométrica:** `huella_dactilar_ref` y `foto_rostro_ref` son campos de integración con un
> **sistema biométrico externo** (no implementado en este proyecto). Permiten identificar pacientes
> inconscientes en emergencias sin necesidad de CI. La verificación real la realiza el sistema externo;
> SIIH solo almacena la referencia y consume el resultado.

---

### MEDICO
```sql
id                  SERIAL PRIMARY KEY
ci                  VARCHAR(20)  UNIQUE NOT NULL
nombre              VARCHAR(100) NOT NULL
apellido            VARCHAR(100) NOT NULL
especialidad        VARCHAR(100) NOT NULL
telefono            VARCHAR(20)
email               VARCHAR(100)
horario_atencion    TEXT                                -- JSON o texto libre
activo              BOOLEAN      DEFAULT TRUE
```

---

### ENFERMERA
```sql
id                  SERIAL PRIMARY KEY
ci                  VARCHAR(20)  UNIQUE NOT NULL
nombre              VARCHAR(100) NOT NULL
apellido            VARCHAR(100) NOT NULL
turno               VARCHAR(20)                         -- MAÑANA / TARDE / NOCHE
telefono            VARCHAR(20)
activo              BOOLEAN      DEFAULT TRUE
```

---

### FARMACEUTICO
```sql
id                  SERIAL PRIMARY KEY
ci                  VARCHAR(20)  UNIQUE NOT NULL
nombre              VARCHAR(100) NOT NULL
apellido            VARCHAR(100) NOT NULL
telefono            VARCHAR(20)
email               VARCHAR(100)
activo              BOOLEAN      DEFAULT TRUE
```

---

### TECNICO_LABORATORIO
```sql
id                  SERIAL PRIMARY KEY
ci                  VARCHAR(20)  UNIQUE NOT NULL
nombre              VARCHAR(100) NOT NULL
apellido            VARCHAR(100) NOT NULL
telefono            VARCHAR(20)
email               VARCHAR(100)
activo              BOOLEAN      DEFAULT TRUE
```

---

### ADMISIONISTA
```sql
id                  SERIAL PRIMARY KEY
ci                  VARCHAR(20)  UNIQUE NOT NULL
nombre              VARCHAR(100) NOT NULL
apellido            VARCHAR(100) NOT NULL
telefono            VARCHAR(20)
email               VARCHAR(100)
activo              BOOLEAN      DEFAULT TRUE
```

---

### FACTURADOR
```sql
id                  SERIAL PRIMARY KEY
ci                  VARCHAR(20)  UNIQUE NOT NULL
nombre              VARCHAR(100) NOT NULL
apellido            VARCHAR(100) NOT NULL
telefono            VARCHAR(20)
email               VARCHAR(100)
activo              BOOLEAN      DEFAULT TRUE
```

---

### ROL
```sql
id                  SERIAL PRIMARY KEY
nombre              VARCHAR(50)  UNIQUE NOT NULL
-- Valores: PACIENTE, MEDICO, ENFERMERA, ADMISIONISTA,
--          FARMACEUTICO, TECNICO_LAB, FACTURADOR, DIRECTOR, ADMIN
descripcion         TEXT
```

---

### PERMISO
```sql
id                  SERIAL PRIMARY KEY
nombre              VARCHAR(100) NOT NULL
modulo              VARCHAR(50)                         -- CITAS, HISTORIAL, FARMACIA, LABORATORIO, etc.
accion              VARCHAR(20)                         -- READ, WRITE, DELETE
```

---

### ROL_PERMISO  (tabla pivote N:M)
```sql
rol_id              INTEGER FK → ROL
permiso_id          INTEGER FK → PERMISO
PRIMARY KEY (rol_id, permiso_id)
```

---

### USUARIO
```sql
id                  SERIAL PRIMARY KEY
username            VARCHAR(50)  UNIQUE NOT NULL
password_hash       VARCHAR(255) NOT NULL               -- bcrypt; NUNCA texto plano
email               VARCHAR(100) UNIQUE
ultimo_acceso       TIMESTAMP
activo              BOOLEAN      DEFAULT TRUE
creado_por          INTEGER      FK → USUARIO (nullable) -- Admin que creó la cuenta
rol_id              INTEGER      FK → ROL NOT NULL
-- Referencias al actor real según el rol (solo una debe tener valor):
paciente_id         INTEGER      FK → PACIENTE            (nullable)
medico_id           INTEGER      FK → MEDICO              (nullable)
enfermera_id        INTEGER      FK → ENFERMERA           (nullable)
farmaceutico_id     INTEGER      FK → FARMACEUTICO        (nullable)
tecnico_lab_id      INTEGER      FK → TECNICO_LABORATORIO (nullable)
admisionista_id     INTEGER      FK → ADMISIONISTA        (nullable)
facturador_id       INTEGER      FK → FACTURADOR          (nullable)
```

---

### CITA
```sql
id                  SERIAL PRIMARY KEY
paciente_id         INTEGER  FK → PACIENTE NOT NULL
medico_id           INTEGER  FK → MEDICO   NOT NULL
fecha               DATE     NOT NULL
hora                TIME     NOT NULL
estado              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
-- Estados: PENDIENTE / CONFIRMADA / EN_ESPERA / COMPLETADA / CANCELADA
tipo                VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
-- Tipos: NORMAL / EMERGENCIA
prioridad           VARCHAR(20)          DEFAULT 'NORMAL'
-- Prioridades: NORMAL / ALTA / CRITICA
motivo              TEXT
creado_por          INTEGER  FK → USUARIO (nullable)    -- Admisionista o Paciente (app) que la creó
```

---

### HISTORIAL_CLINICO
```sql
id                  SERIAL PRIMARY KEY
paciente_id         INTEGER FK → PACIENTE UNIQUE NOT NULL
-- Relación 1:1. Se crea AUTOMÁTICAMENTE al registrar al paciente.
-- Nunca se crea manualmente sin un paciente.
```

---

### ALERGIA
```sql
id                  SERIAL PRIMARY KEY
historial_id        INTEGER   FK → HISTORIAL_CLINICO NOT NULL
sustancia           VARCHAR(200) NOT NULL
reaccion            TEXT
severidad           VARCHAR(20)                         -- LEVE / MODERADA / GRAVE
usuario_id          INTEGER   FK → USUARIO (nullable)  -- quién la registró
fecha_registro      TIMESTAMP DEFAULT NOW()             -- cuándo se registró
```

---

### ANTECEDENTE
```sql
id                  SERIAL PRIMARY KEY
historial_id        INTEGER   FK → HISTORIAL_CLINICO NOT NULL
tipo                VARCHAR(50)
-- PATOLOGICO / QUIRURGICO / FAMILIAR / ALERGICO / MEDICAMENTOSO / HABITOS
descripcion         TEXT      NOT NULL
usuario_id          INTEGER   FK → USUARIO (nullable)  -- quién lo registró
fecha_registro      TIMESTAMP DEFAULT NOW()             -- cuándo se registró
```

---

### ATENCION
```sql
id                  SERIAL PRIMARY KEY
historial_id        INTEGER   FK → HISTORIAL_CLINICO NOT NULL
medico_id           INTEGER   FK → MEDICO            NOT NULL
cita_id             INTEGER   FK → CITA              (nullable)
-- NULL cuando es emergencia sin cita previa
fecha_atencion      TIMESTAMP NOT NULL DEFAULT NOW()
motivo_consulta     TEXT
diagnostico         TEXT
tratamiento         TEXT
observaciones       TEXT
tipo                VARCHAR(20) DEFAULT 'CONSULTA'
-- CONSULTA / EMERGENCIA
```

---

### SIGNOS_VITALES
```sql
id                      SERIAL PRIMARY KEY
atencion_id             INTEGER   FK → ATENCION         (nullable)
hospitalizacion_id      INTEGER   FK → HOSPITALIZACION  (nullable)
-- CONSTRAINT: al menos uno de los dos debe ser NOT NULL
enfermera_id            INTEGER   FK → ENFERMERA         (nullable; puede registrarlo el médico)
fecha_hora              TIMESTAMP NOT NULL DEFAULT NOW()
temperatura             DECIMAL(4,1)          -- °C
presion_sistolica       INTEGER
presion_diastolica      INTEGER
frecuencia_cardiaca     INTEGER
frecuencia_resp         INTEGER
saturacion_oxigeno      DECIMAL(4,1)          -- %
peso                    DECIMAL(5,2)          -- kg
talla                   DECIMAL(5,2)          -- cm
```

---

### RECETA
```sql
id                  SERIAL PRIMARY KEY
atencion_id         INTEGER   FK → ATENCION NOT NULL
medico_id           INTEGER   FK → MEDICO   NOT NULL
fecha_emision       TIMESTAMP NOT NULL DEFAULT NOW()
codigo_receta       VARCHAR(50) UNIQUE NOT NULL           -- generado automáticamente
estado              VARCHAR(20) DEFAULT 'EMITIDA'
-- EMITIDA / PARCIAL / DISPENSADA / CANCELADA
dispensado_por      INTEGER   FK → USUARIO (nullable)    -- Farmacéutico que entregó la receta
```

---

### DETALLE_RECETA
```sql
id                  SERIAL PRIMARY KEY
receta_id           INTEGER FK → RECETA      NOT NULL
medicamento_id      INTEGER FK → MEDICAMENTO NOT NULL
dosis               VARCHAR(100)
frecuencia          VARCHAR(100)              -- "cada 8 horas"
duracion            VARCHAR(100)              -- "7 días"
cantidad            INTEGER NOT NULL
indicaciones        TEXT
```

---

### MEDICAMENTO
```sql
id                  SERIAL PRIMARY KEY
nombre              VARCHAR(200) NOT NULL
principio_activo    VARCHAR(200)
presentacion        VARCHAR(100)              -- comprimido / jarabe / inyectable
concentracion       VARCHAR(100)
laboratorio         VARCHAR(200)
activo              BOOLEAN DEFAULT TRUE
```

---

### INVENTARIO
```sql
id                  SERIAL PRIMARY KEY
medicamento_id      INTEGER FK → MEDICAMENTO NOT NULL
lote                VARCHAR(100) NOT NULL
cantidad            INTEGER      NOT NULL DEFAULT 0
stock_minimo        INTEGER      NOT NULL DEFAULT 10
fecha_vencimiento   DATE         NOT NULL
ubicacion           VARCHAR(100)
precio_unitario     DECIMAL(10,2)
```

---

### EXAMEN_LABORATORIO
```sql
id                      SERIAL PRIMARY KEY
atencion_id             INTEGER   FK → ATENCION NOT NULL
tipo_examen             VARCHAR(200) NOT NULL
fecha_solicitud         TIMESTAMP NOT NULL DEFAULT NOW()
estado                  VARCHAR(30) DEFAULT 'SOLICITADO'
-- SOLICITADO / EN_PROCESO / COMPLETADO / CANCELADO
observaciones_solicitud TEXT
tecnico_id              INTEGER   FK → USUARIO (nullable) -- Técnico que procesó el examen
```

---

### RESULTADO_LABORATORIO
```sql
id                  SERIAL PRIMARY KEY
examen_id           INTEGER   FK → EXAMEN_LABORATORIO UNIQUE NOT NULL
resultado           TEXT      NOT NULL
valores_referencia  TEXT
observaciones       TEXT
fecha_resultado     TIMESTAMP NOT NULL DEFAULT NOW()
es_critico          BOOLEAN   DEFAULT FALSE
-- Si es_critico = TRUE → notificar al médico tratante de inmediato
```

---

### CAMA
```sql
id                  SERIAL PRIMARY KEY
numero_cama         VARCHAR(20) UNIQUE NOT NULL
piso                VARCHAR(20)
sala                VARCHAR(100)
tipo                VARCHAR(50)
-- GENERAL / UCI / PEDIATRIA / MATERNIDAD / CIRUGIA
estado              VARCHAR(30) DEFAULT 'DISPONIBLE'
-- DISPONIBLE / OCUPADA / EN_LIMPIEZA / EN_MANTENIMIENTO
```

---

### HOSPITALIZACION
```sql
id                  SERIAL PRIMARY KEY
paciente_id         INTEGER   FK → PACIENTE  NOT NULL
medico_id           INTEGER   FK → MEDICO    NOT NULL   -- médico tratante
cama_id             INTEGER   FK → CAMA      NOT NULL
atencion_id         INTEGER   FK → ATENCION  (nullable) -- atención que originó el ingreso
fecha_ingreso       TIMESTAMP NOT NULL DEFAULT NOW()
fecha_alta          TIMESTAMP (nullable)
diagnostico_ingreso TEXT
diagnostico_alta    TEXT      (nullable)
estado              VARCHAR(20) DEFAULT 'ACTIVA'
-- ACTIVA / ALTA
```

---

### MEDICACION_ADMINISTRADA
```sql
id                  SERIAL PRIMARY KEY
hospitalizacion_id  INTEGER   FK → HOSPITALIZACION NOT NULL
enfermera_id        INTEGER   FK → ENFERMERA        NOT NULL
medicamento_id      INTEGER   FK → MEDICAMENTO      NOT NULL
dosis               VARCHAR(100)
fecha_hora          TIMESTAMP NOT NULL DEFAULT NOW()
observaciones       TEXT
```

---

### FACTURA
```sql
id                  SERIAL PRIMARY KEY
paciente_id         INTEGER   FK → PACIENTE NOT NULL
atencion_id         INTEGER   FK → ATENCION (nullable)
numero_factura      VARCHAR(50) UNIQUE NOT NULL
fecha_emision       TIMESTAMP NOT NULL DEFAULT NOW()
subtotal            DECIMAL(12,2) NOT NULL
impuesto            DECIMAL(12,2) DEFAULT 0
descuento           DECIMAL(12,2) DEFAULT 0
cobertura_seguro    DECIMAL(12,2) DEFAULT 0
total               DECIMAL(12,2) NOT NULL
-- total = subtotal + impuesto - descuento - cobertura_seguro
estado              VARCHAR(20) DEFAULT 'PENDIENTE'
-- PENDIENTE / PAGADA / ANULADA
tipo_pago           VARCHAR(30)
-- EFECTIVO / TRANSFERENCIA / SEGURO / MIXTO
usuario_id          INTEGER   FK → USUARIO NOT NULL    -- Facturador que emitió la factura
```

---

### DETALLE_FACTURA
```sql
id                  SERIAL PRIMARY KEY
factura_id          INTEGER       FK → FACTURA NOT NULL
descripcion         VARCHAR(255)  NOT NULL
cantidad            INTEGER       DEFAULT 1
precio_unitario     DECIMAL(10,2) NOT NULL
subtotal            DECIMAL(12,2) NOT NULL
```

---

### PROVEEDOR
```sql
id                  SERIAL PRIMARY KEY
nombre              VARCHAR(200) NOT NULL
ruc                 VARCHAR(50)  UNIQUE
direccion           VARCHAR(255)
telefono            VARCHAR(20)
email               VARCHAR(100)
activo              BOOLEAN DEFAULT TRUE
```

---

### COMPRA
```sql
id                  SERIAL PRIMARY KEY
proveedor_id        INTEGER   FK → PROVEEDOR NOT NULL
fecha_compra        TIMESTAMP NOT NULL DEFAULT NOW()
total               DECIMAL(12,2) NOT NULL
estado              VARCHAR(30) DEFAULT 'PENDIENTE'
-- PENDIENTE / RECIBIDA / CANCELADA
usuario_id          INTEGER   FK → USUARIO NOT NULL    -- Farmacéutico que gestionó la compra
```

---

### DETALLE_COMPRA
```sql
id                  SERIAL PRIMARY KEY
compra_id           INTEGER       FK → COMPRA      NOT NULL
medicamento_id      INTEGER       FK → MEDICAMENTO NOT NULL
cantidad            INTEGER       NOT NULL
precio_unitario     DECIMAL(10,2) NOT NULL
```

---

### AUDITORIA
```sql
id                  SERIAL PRIMARY KEY
usuario_id          INTEGER      FK → USUARIO NOT NULL
tabla_afectada      VARCHAR(100) NOT NULL
accion              VARCHAR(30)  NOT NULL
-- INSERT / UPDATE / DELETE / SELECT_SENSITIVO
registro_id         INTEGER                   -- ID del registro afectado
detalle             TEXT
fecha_hora          TIMESTAMP NOT NULL DEFAULT NOW()
ip_origen           VARCHAR(45)
```

---

### NOTIFICACION
```sql
id                  SERIAL PRIMARY KEY
paciente_id         INTEGER      FK → PACIENTE (nullable) -- nullable: puede ir dirigida a un médico
medico_id           INTEGER      FK → MEDICO   (nullable) -- para alertas críticas al médico tratante
-- CONSTRAINT: paciente_id IS NOT NULL OR medico_id IS NOT NULL
cita_id             INTEGER      FK → CITA (nullable)
tipo                VARCHAR(20)  NOT NULL                 -- SMS / EMAIL
asunto              VARCHAR(200)
mensaje             TEXT         NOT NULL
estado              VARCHAR(20)  DEFAULT 'PENDIENTE'
-- PENDIENTE / ENVIADA / FALLIDA
fecha_envio         TIMESTAMP
```

---

## 3. RELACIONES DEL MER (cardinalidades)

```
PACIENTE             1:1       HISTORIAL_CLINICO
PACIENTE             1:N       CITA
PACIENTE             1:N       HOSPITALIZACION
PACIENTE             1:N       FACTURA
PACIENTE             1:N       NOTIFICACION

MEDICO               1:N       CITA
MEDICO               1:N       ATENCION
MEDICO               1:N       RECETA
MEDICO               1:N       EXAMEN_LABORATORIO
MEDICO               1:N       HOSPITALIZACION
MEDICO               1:N       NOTIFICACION              -- resultados críticos (medico_id)

ENFERMERA            1:N       SIGNOS_VITALES
ENFERMERA            1:N       MEDICACION_ADMINISTRADA

HISTORIAL_CLINICO    1:N       ATENCION
HISTORIAL_CLINICO    1:N       ALERGIA
HISTORIAL_CLINICO    1:N       ANTECEDENTE

CITA                 1:0..1    ATENCION
  -- ATENCION.cita_id es nullable → emergencias no necesitan cita previa

ATENCION             1:N       SIGNOS_VITALES
ATENCION             1:N       RECETA
ATENCION             1:N       EXAMEN_LABORATORIO
ATENCION             1:0..1    HOSPITALIZACION

RECETA               1:N       DETALLE_RECETA
MEDICAMENTO          1:N       DETALLE_RECETA

EXAMEN_LABORATORIO   1:1       RESULTADO_LABORATORIO

MEDICAMENTO          1:N       INVENTARIO            -- por lotes
MEDICAMENTO          1:N       MEDICACION_ADMINISTRADA
MEDICAMENTO          1:N       DETALLE_COMPRA

CAMA                 1:N       HOSPITALIZACION       -- históricamente; 1 activa a la vez
HOSPITALIZACION      1:N       SIGNOS_VITALES
HOSPITALIZACION      1:N       MEDICACION_ADMINISTRADA

FACTURA              1:N       DETALLE_FACTURA

PROVEEDOR            1:N       COMPRA
COMPRA               1:N       DETALLE_COMPRA

ROL                  1:N       USUARIO
ROL                  N:M       PERMISO               -- vía ROL_PERMISO
USUARIO              1:N       AUDITORIA

-- Relaciones de trazabilidad (quién hizo qué):
USUARIO              1:N       PACIENTE              -- registrado_por
USUARIO              1:N       CITA                  -- creado_por
USUARIO              1:N       ALERGIA               -- usuario_id (quién la cargó)
USUARIO              1:N       ANTECEDENTE           -- usuario_id (quién lo cargó)
USUARIO              1:N       RECETA                -- dispensado_por
USUARIO              1:N       EXAMEN_LABORATORIO    -- tecnico_id (quién lo procesó)
USUARIO              1:N       FACTURA               -- usuario_id (quién la emitió)
USUARIO              1:N       COMPRA                -- usuario_id (quién la gestionó)
USUARIO              1:N       USUARIO               -- creado_por (auto-referencia: Admin crea cuentas)

-- Relaciones USUARIO → actor real (una sola por usuario):
USUARIO              0..1:1    FARMACEUTICO
USUARIO              0..1:1    TECNICO_LABORATORIO
USUARIO              0..1:1    ADMISIONISTA
USUARIO              0..1:1    FACTURADOR
```

---

## 4. FLUJOS POR ACTOR (Casos de Uso)

---

### CU-01 — REGISTRO DE PACIENTE
**Actor:** Admisionista

```
Precondición: ninguna.

1. Admisionista busca paciente por CI en PACIENTE.
2. SI existe → mostrar ficha existente. FIN. (No duplicar.)
3. SI no existe:
   a. Ingresar: ci, nombre, apellido, fecha_nacimiento, sexo,
                direccion, telefono, email, seguro_medico.
   b. Sistema valida: CI único + campos obligatorios.
   c. Sistema crea PACIENTE con registrado_por = usuario_id del Admisionista.
   d. Sistema crea automáticamente HISTORIAL_CLINICO (paciente_id).
   e. [Opcional] Registrar ALERGIA si el paciente las declara en el momento.
      → Sistema guarda usuario_id = Admisionista y fecha_registro = NOW().
   f. [Opcional] Crear USUARIO con rol PACIENTE si tendrá acceso a la app.
4. Postcondición: PACIENTE registrado + HISTORIAL_CLINICO vacío creado.
```

---

### CU-02 — PROGRAMAR CITA NORMAL
**Actor:** Admisionista / Paciente (vía app)

```
Precondición: PACIENTE existe en el sistema.

1. Seleccionar paciente (por CI o nombre).
2. Seleccionar especialidad.
3. Sistema muestra médicos disponibles por especialidad.
4. Seleccionar médico.
5. Sistema muestra ÚNICAMENTE los horarios disponibles:
   slots libres (sin CITA asignada para ese médico en esa fecha).
   NO se muestran horarios ya ocupados.
6. Seleccionar fecha y hora del listado disponible.
7. Sistema crea CITA:
   - estado     = PENDIENTE
   - tipo       = NORMAL
   - prioridad  = NORMAL
   - creado_por = usuario_id de quien programa la cita
8. Sistema crea NOTIFICACION (SMS o EMAIL) con datos de la cita.
9. Postcondición: CITA creada, NOTIFICACION enviada.

Flujo alterno — Cancelar cita:
  1. Buscar CITA por paciente.
  2. CITA.estado = CANCELADA → slot liberado.
  3. Enviar NOTIFICACION de cancelación.

Flujo alterno — Reprogramar cita:
  1. CITA actual → estado = CANCELADA.
  2. Crear nueva CITA con nuevo horario (creado_por registrado).
  3. Enviar NOTIFICACION de reprogramación.
```

---

### CU-03A — ATENCIÓN MÉDICA CON CITA
**Actor:** Médico

```
Precondición: CITA en estado PENDIENTE o CONFIRMADA; paciente presente.

1. Admisionista confirma llegada → CITA.estado = EN_ESPERA.
2. Médico abre la atención desde su listado de citas del día.
3. Sistema muestra HISTORIAL_CLINICO completo:
   - Atenciones previas (ATENCION ordenadas DESC)
   - *** ALERGIAS — siempre visibles con ALERTA VISUAL si existen ***
   - Antecedentes (ANTECEDENTE)
   - Últimos SIGNOS_VITALES
   - EXAMEN_LABORATORIO + RESULTADO_LABORATORIO previos
   - RECETA previas
4. Sistema crea ATENCION:
   - historial_id, cita_id, medico_id
   - fecha_atencion = NOW()
   - tipo = CONSULTA
5. [Enfermera o Médico] Registrar SIGNOS_VITALES vinculados a atencion_id.
6. Médico completa: motivo_consulta, diagnostico, tratamiento, observaciones.
7. [Opcional] Emitir RECETA → ver CU-05.
8. [Opcional] Solicitar EXAMEN_LABORATORIO → ver CU-06.
9. [Opcional] Decidir hospitalización → ver CU-09.
10. Médico cierra la atención → CITA.estado = COMPLETADA.
11. Postcondición: ATENCION guardada en HISTORIAL_CLINICO.
```

---

### CU-03B — ATENCIÓN DE EMERGENCIA SIN CITA PREVIA
**Actor:** Admisionista + Médico

```
Precondición: NINGUNA. La urgencia tiene prioridad máxima.

1. [Admisionista] Intenta identificar al paciente:

   a. SI el paciente puede comunicarse → buscar por CI.
      · SI existe → cargar PACIENTE + HISTORIAL_CLINICO.
      · SI no existe → registrar datos mínimos:
        ci, nombre, apellido, fecha_nacimiento
        → crear PACIENTE (registrado_por = Admisionista) + HISTORIAL_CLINICO
        → continuar.

   b. SI el paciente está inconsciente o no puede dar datos:
      → Activar identificación biométrica (integración con sistema externo):

        HUELLA DACTILAR:
          El sistema consulta el servicio externo comparando la huella
          capturada contra PACIENTE.huella_dactilar_ref en la BD.

        RECONOCIMIENTO FACIAL:
          El sistema consulta el servicio externo comparando la foto
          capturada contra PACIENTE.foto_rostro_ref en la BD.

        · SI hay coincidencia → cargar PACIENTE existente y su historial.
        · SI no hay coincidencia → crear PACIENTE temporal:
            ci      = "TEMP-<timestamp>"
            nombre  = "DESCONOCIDO"
          Actualizar datos cuando el paciente recupere la conciencia
          o un familiar los aporte.

      ⚠ NOTA DE INTEGRACIÓN: la verificación biométrica depende de un
        sistema externo (lector de huella / cámara + motor de IA de
        reconocimiento facial). SIIH almacena solo la referencia y consume
        el resultado mediante API. Esta integración NO está implementada en
        el presente proyecto; está diseñada para una fase futura o mediante
        API de terceros.

2. [Admisionista] Crea CITA:
   - tipo      = EMERGENCIA
   - prioridad = ALTA o CRITICA (según evaluación inicial)
   - estado    = CONFIRMADA
   - fecha     = HOY, hora = AHORA
   - creado_por = usuario_id del Admisionista
   - NO requiere horario disponible previo.
   - Asignar médico de guardia disponible.

3. [Sistema] Crea ATENCION automáticamente:
   - cita_id       = la recién creada
   - tipo          = EMERGENCIA
   - fecha_atencion = NOW()

4. [Sistema] Muestra ALERTA OBLIGATORIA si el paciente tiene ALERGIA registradas.
   (Mostrar antes de cualquier prescripción.)

5. [Enfermera / Médico] Registrar SIGNOS_VITALES de urgencia.

6. [Médico] Registra: motivo_consulta, diagnostico, tratamiento, observaciones.

7. [Decisión] ¿Necesita exámenes?
   → SÍ: ver CU-06 (Laboratorio).

8. [Decisión] ¿Necesita medicamentos?
   → SÍ: emitir RECETA → ver CU-05 (Farmacia).

9. [Decisión] ¿Necesita hospitalización?
   → SÍ: ver CU-09 (Ingreso Hospitalario).
   → NO: cerrar ATENCION → ver CU-07 (Facturación).

10. Postcondición: ATENCION de emergencia registrada con
    trazabilidad completa en HISTORIAL_CLINICO.
```

---

### CU-04 — HISTORIAL CLÍNICO
**Actor:** Médico / Enfermera

```
CONSULTAR:
1. Buscar paciente por CI o nombre.
2. Sistema muestra HISTORIAL_CLINICO completo:
   - ATENCION (ORDER BY fecha_atencion DESC)
   - ALERGIA — siempre destacadas con alerta visual
   - ANTECEDENTE
   - Últimos SIGNOS_VITALES
   - EXAMEN_LABORATORIO + RESULTADO_LABORATORIO
   - RECETA + DETALLE_RECETA

REGISTRAR SIGNOS VITALES (Enfermera o Médico):
1. Seleccionar ATENCION activa o HOSPITALIZACION del paciente.
2. Ingresar: temperatura, presion_sistolica, presion_diastolica,
             frecuencia_cardiaca, frecuencia_resp,
             saturacion_oxigeno, peso, talla.
3. Sistema crea SIGNOS_VITALES con fecha_hora = NOW().

REGISTRAR ALERGIA:
1. Abrir HISTORIAL_CLINICO del paciente.
2. Ingresar: sustancia, reaccion, severidad.
3. Sistema guarda usuario_id (quién la registra) y fecha_registro = NOW().
4. Desde ese momento, se muestra alerta en toda ATENCION futura.

REGISTRAR ANTECEDENTE:
1. Abrir HISTORIAL_CLINICO.
2. Ingresar: tipo (PATOLOGICO, QUIRURGICO, FAMILIAR, etc.), descripcion.
3. Sistema guarda usuario_id (quién lo registra) y fecha_registro = NOW().
```

---

### CU-05 — CONTROL DE FARMACIA Y DISPENSACIÓN
**Actor:** Farmacéutico

```
DISPENSAR MEDICAMENTO:
Precondición: RECETA en estado EMITIDA.

1. Buscar RECETA por codigo_receta o por CI del paciente.
2. Sistema muestra DETALLE_RECETA con cada medicamento.
3. Para cada ítem en DETALLE_RECETA:
   a. Sistema consulta INVENTARIO (suma cantidad disponible, excluye vencidos).
   b. SI stock >= cantidad requerida:
      - Descontar del lote con fecha_vencimiento más próxima (FEFO).
   c. SI stock insuficiente:
      - Marcar ítem como pendiente.
      - Sugerir orden de compra.
4. SI todos los ítems dispensados:
   - RECETA.estado       = DISPENSADA
   - RECETA.dispensado_por = usuario_id del Farmacéutico
5. SI dispensación parcial:
   - RECETA.estado       = PARCIAL
   - RECETA.dispensado_por = usuario_id del Farmacéutico
6. SI INVENTARIO.cantidad <= stock_minimo → ALERTA automática.
7. Postcondición: INVENTARIO actualizado, RECETA en estado final.

GESTIONAR INVENTARIO:
1. Ver lista de MEDICAMENTO + INVENTARIO (cantidad, vencimiento).
2. Sistema resalta en ROJO los que están en/bajo stock_minimo.
3. Sistema alerta vencimientos próximos (< 30 días).

GESTIONAR COMPRAS A PROVEEDOR:
1. Crear COMPRA con proveedor_id y usuario_id = Farmacéutico que gestiona.
2. Agregar DETALLE_COMPRA (medicamento_id, cantidad, precio_unitario).
3. Al recibir la compra → COMPRA.estado = RECIBIDA.
4. Sistema crea nuevo lote en INVENTARIO con la cantidad recibida.
```

---

### CU-06 — EXÁMENES DE LABORATORIO
**Actor:** Técnico de Laboratorio / (Médico registra la orden)

```
REGISTRAR ORDEN (Médico, desde ATENCION activa):
1. Médico selecciona tipo de examen.
2. Sistema crea EXAMEN_LABORATORIO:
   - atencion_id, tipo_examen
   - estado    = SOLICITADO
   - tecnico_id = NULL (aún no asignado)
3. Técnico ve la orden en su módulo inmediatamente.

PROCESAR EXAMEN (Técnico de Laboratorio):
1. Ver lista de EXAMEN_LABORATORIO con estado = SOLICITADO.
2. Seleccionar orden → EXAMEN_LABORATORIO.estado = EN_PROCESO.
   - Registrar EXAMEN_LABORATORIO.tecnico_id = usuario_id del Técnico.
3. Procesar muestra físicamente.
4. Crear RESULTADO_LABORATORIO:
   - resultado, valores_referencia, observaciones
   - fecha_resultado = NOW()
   - es_critico = TRUE o FALSE
5. EXAMEN_LABORATORIO.estado = COMPLETADO.
6. SI es_critico = TRUE:
   → Sistema crea NOTIFICACION con medico_id = médico tratante (URGENTE).
     (no solo paciente_id; el destinatario principal es el médico.)
7. Resultado visible en HISTORIAL_CLINICO del paciente.
8. Postcondición: resultado disponible para el médico.
```

---

### CU-07 — FACTURACIÓN
**Actor:** Facturador

```
Precondición: ATENCION completada con al menos un servicio prestado.

1. Facturador busca paciente o atención a facturar.
2. Sistema recopila automáticamente los servicios:
   - Consulta médica (de ATENCION).
   - Exámenes de laboratorio (EXAMEN_LABORATORIO estado = COMPLETADO).
   - Medicamentos dispensados (RECETA estado = DISPENSADA).
   - Días de hospitalización (de HOSPITALIZACION, si aplica).
3. Sistema genera borrador con DETALLE_FACTURA por cada servicio.
4. Facturador aplica descuentos o cobertura de seguro médico.
5. Sistema calcula:
   total = subtotal + impuesto - descuento - cobertura_seguro
6. Facturador confirma → FACTURA.estado = PENDIENTE.
   - FACTURA.usuario_id = usuario_id del Facturador que emite.
7. Paciente paga → FACTURA.estado = PAGADA.
8. [Opcional] Exportar factura como PDF.

Flujo alterno — Paciente con seguro médico:
  - Ingresar cobertura_seguro (monto cubierto por el seguro).
  - El sistema recalcula el total automáticamente.

Flujo alterno — Anular factura:
  - FACTURA.estado = ANULADA.
  - Registrar justificación en AUDITORIA (OBLIGATORIO).
  - Una factura PAGADA solo se puede anular con registro en AUDITORIA.
```

---

### CU-08 — REPORTES GERENCIALES
**Actor:** Director / Gerencia

```
1. Seleccionar tipo de reporte:
   a. Pacientes atendidos por período / especialidad.
   b. Ingresos económicos del mes (facturación).
   c. Ocupación hospitalaria (CAMA OCUPADA vs DISPONIBLE).
   d. Medicamentos con stock bajo mínimo.
   e. Exámenes de laboratorio procesados.
2. Sistema consulta BD y genera indicadores con gráficos.
3. [Opcional] Exportar a PDF / Excel.
4. Postcondición: reporte disponible para toma de decisiones.
```

---

### CU-09 — INGRESO Y ALTA HOSPITALARIA
**Actor:** Médico / Admisionista / Enfermera

```
INGRESO:
Precondición: existe CAMA con estado = DISPONIBLE.

1. Médico decide hospitalizar (desde ATENCION activa).
2. Sistema muestra CAMA disponibles.
3. Seleccionar CAMA.
4. Sistema crea HOSPITALIZACION:
   - paciente_id, medico_id (tratante), cama_id, atencion_id
   - fecha_ingreso = NOW()
   - diagnostico_ingreso
   - estado = ACTIVA
5. Sistema cambia CAMA.estado = OCUPADA.
6. Postcondición: paciente en HOSPITALIZACION activa.

DURANTE LA HOSPITALIZACIÓN (Enfermera):
1. Registrar SIGNOS_VITALES periódicamente (hospitalizacion_id).
2. Registrar MEDICACION_ADMINISTRADA:
   - hospitalizacion_id, enfermera_id, medicamento_id, dosis, fecha_hora.
3. Sistema descuenta del INVENTARIO en cada administración (FEFO).
4. Si INVENTARIO.cantidad <= stock_minimo → ALERTA al Farmacéutico.

ALTA MÉDICA:
1. Médico abre HOSPITALIZACION activa del paciente.
2. Registra: diagnostico_alta, fecha_alta = NOW().
3. HOSPITALIZACION.estado = ALTA.
4. CAMA.estado = EN_LIMPIEZA (luego pasa a DISPONIBLE manualmente).
5. Facturación consolida días de hospitalización → ver CU-07.
6. Postcondición: hospitalización cerrada, cama liberada.
```

---

### CU-10 — PORTAL DEL PACIENTE (APP)
**Actor:** Paciente

```
Precondición: PACIENTE tiene USUARIO activo con rol PACIENTE.

INICIAR SESIÓN:
1. Paciente ingresa username / password.
2. Sistema valida credenciales (bcrypt).
3. Acceso al portal personal.

AGENDAR CITA:
1. Paciente selecciona especialidad.
2. Sistema muestra médicos disponibles en esa especialidad.
3. Paciente selecciona médico.
4. Sistema muestra ÚNICAMENTE los horarios disponibles para ese médico
   (slots sin CITA asignada). Los horarios ocupados no son visibles.
5. Paciente selecciona fecha y hora del listado.
6. Sistema crea CITA:
   - tipo      = NORMAL
   - estado    = PENDIENTE
   - creado_por = usuario_id del Paciente
7. Sistema envía NOTIFICACION de confirmación (SMS/EMAIL).
8. Postcondición: cita visible también para el Admisionista.

CANCELAR / REPROGRAMAR CITA:
1. Paciente ve sus citas activas (estado PENDIENTE o CONFIRMADA).
2. Cancela → CITA.estado = CANCELADA; slot liberado; NOTIFICACION enviada.
3. Reprograma → cita actual CANCELADA; nueva CITA creada; NOTIFICACION enviada.

VER HISTORIAL CLÍNICO PROPIO:
1. Paciente accede a "Mi Historial" (solo lectura).
2. Sistema muestra únicamente su propio HISTORIAL_CLINICO:
   - Atenciones previas (fecha, motivo_consulta, diagnostico).
   - Alergias registradas (sustancia, severidad).
   - Antecedentes (tipo, descripcion).
   - Últimos SIGNOS_VITALES.
   - Resultados de exámenes (RESULTADO_LABORATORIO, solo si estado = COMPLETADO).
   - Recetas emitidas (RECETA + DETALLE_RECETA).
3. El paciente NO puede modificar ningún dato de su historial.
4. El paciente NO puede ver historiales de otros pacientes.

VER DISPONIBILIDAD DE FARMACIA:
1. Paciente busca medicamento por nombre o principio_activo.
2. Sistema consulta MEDICAMENTO + INVENTARIO:
   - Muestra: DISPONIBLE (cantidad > 0, lote no vencido) o NO DISPONIBLE.
   - NO muestra cantidades exactas ni precios unitarios.
3. Acceso de SOLO LECTURA. No puede modificar inventario.
4. Útil para confirmar si el hospital tiene el medicamento antes de ir a farmacia.

Postcondición: paciente informado y con autonomía de gestión básica desde la app.
```

---

### CU-11 — GESTIÓN DE USUARIOS, ROLES Y ADMINISTRACIÓN DEL SISTEMA
**Actor:** Administrador del Sistema

```
REGISTRAR ACTORES DEL SISTEMA (CRUD completo):
El Admin es el único rol autorizado para crear y desactivar cualquier tipo de actor.

  a. REGISTRAR MÉDICO:
     1. Ingresar: ci, nombre, apellido, especialidad, telefono, email,
                  horario_atencion.
     2. Sistema crea MEDICO.
     3. Sistema crea USUARIO vinculado (medico_id), rol = MEDICO,
        creado_por = usuario_id del Admin.

  b. REGISTRAR ENFERMERA:
     1. Ingresar: ci, nombre, apellido, turno, telefono.
     2. Sistema crea ENFERMERA.
     3. Sistema crea USUARIO vinculado (enfermera_id), rol = ENFERMERA,
        creado_por = usuario_id del Admin.

  c. REGISTRAR FARMACÉUTICO:
     1. Ingresar: ci, nombre, apellido, telefono, email.
     2. Sistema crea FARMACEUTICO.
     3. Sistema crea USUARIO vinculado (farmaceutico_id), rol = FARMACEUTICO,
        creado_por = usuario_id del Admin.

  d. REGISTRAR TÉCNICO DE LABORATORIO:
     1. Ingresar: ci, nombre, apellido, telefono, email.
     2. Sistema crea TECNICO_LABORATORIO.
     3. Sistema crea USUARIO vinculado (tecnico_lab_id), rol = TECNICO_LAB,
        creado_por = usuario_id del Admin.

  e. REGISTRAR ADMISIONISTA:
     1. Ingresar: ci, nombre, apellido, telefono, email.
     2. Sistema crea ADMISIONISTA.
     3. Sistema crea USUARIO vinculado (admisionista_id), rol = ADMISIONISTA,
        creado_por = usuario_id del Admin.

  f. REGISTRAR FACTURADOR:
     1. Ingresar: ci, nombre, apellido, telefono, email.
     2. Sistema crea FACTURADOR.
     3. Sistema crea USUARIO vinculado (facturador_id), rol = FACTURADOR,
        creado_por = usuario_id del Admin.

  g. REGISTRAR DIRECTOR:
     Solo se crea USUARIO con rol = DIRECTOR (sin tabla de actor propia).
     creado_por = usuario_id del Admin.

EDITAR / DESACTIVAR ACTORES:
1. Buscar USUARIO por username o CI del actor.
2. Editar datos del actor (MEDICO, ENFERMERA, etc.) o del USUARIO.
3. Desactivar: USUARIO.activo = FALSE → bloquea el acceso inmediatamente.
4. Reactivar: USUARIO.activo = TRUE.
5. Cambio de ROL → registro obligatorio en AUDITORIA.

GESTIONAR ROLES Y PERMISOS:
1. Ver lista de ROL con sus permisos asignados (ROL_PERMISO).
2. Agregar o quitar PERMISO de un ROL (modulo + accion).
3. Los cambios de permisos afectan a todos los USUARIO de ese ROL.

AUDITORÍA:
1. Consultar AUDITORIA filtrando por:
   usuario_id, tabla_afectada, accion, rango de fechas.
2. Sistema muestra quién modificó qué registro y cuándo.
3. [Opcional] Exportar log de auditoría.
```

---

### CU-12 — CONSULTA DE DISPONIBILIDAD DE FARMACIA Y LABORATORIO POR EL MÉDICO
**Actor:** Médico

```
Precondición: Médico autenticado con rol MEDICO.

CONSULTAR DISPONIBILIDAD DE MEDICAMENTO (antes de prescribir):
1. Médico accede al módulo "Farmacia — Consulta" (solo lectura).
2. Busca por nombre de medicamento o principio_activo.
3. Sistema muestra:
   - Nombre, presentación y concentración del medicamento.
   - Stock disponible total (suma de INVENTARIO sin lotes vencidos).
   - Indicador visual si el stock está en/bajo stock_minimo.
4. Con esta información el médico decide si emite la RECETA.
5. El médico NO puede modificar el inventario.

CONSULTAR CARGA ACTUAL DE LABORATORIO:
1. Médico accede al módulo "Laboratorio — Consulta" (solo lectura).
2. Ve el listado de tipos de exámenes disponibles.
3. Ve la carga actual: cuántos exámenes están en estado EN_PROCESO
   (para estimar tiempos de respuesta antes de solicitar un examen).
4. Solo puede ver los resultados de EXAMEN_LABORATORIO de sus propios pacientes.

Postcondición: el médico toma decisiones informadas antes de prescribir o
               solicitar exámenes.
```

---

### CU-13 — VISTA DE PACIENTES PARA LA ENFERMERA
**Actor:** Enfermera

```
Precondición: Enfermera autenticada con rol ENFERMERA.

VER PACIENTES HOSPITALIZADOS ACTIVOS:
1. Enfermera accede a "Mis Pacientes".
2. Sistema muestra todas las HOSPITALIZACION con estado = ACTIVA,
   ordenadas por piso y sala.
3. Por cada paciente se muestra resumen:
   - Nombre, número de cama, diagnóstico de ingreso.
   - *** ALERTA VISUAL DESTACADA si tiene ALERGIA registradas ***
   - Últimos SIGNOS_VITALES registrados.
   - Medicaciones pendientes o recientes (MEDICACION_ADMINISTRADA).

VER DETALLE DE PACIENTE HOSPITALIZADO:
1. Seleccionar paciente de la lista.
2. Sistema muestra (solo lectura):
   - ALERGIA con sustancia, reacción y severidad.
   - ANTECEDENTE relevantes.
   - SIGNOS_VITALES históricos durante esta hospitalización.
   - MEDICACION_ADMINISTRADA administrada en esta hospitalización.
3. La enfermera NO tiene acceso al historial completo de consultas externas
   (reservado al médico tratante — RBAC).

REGISTRAR SIGNOS VITALES (durante hospitalización):
1. Desde la vista del paciente → "Registrar signos vitales".
2. Ingresar valores → Sistema crea SIGNOS_VITALES con
   hospitalizacion_id y enfermera_id = usuario activo y fecha_hora = NOW().

REGISTRAR MEDICACIÓN ADMINISTRADA:
1. Desde la vista del paciente → "Registrar medicación".
2. Seleccionar MEDICAMENTO, ingresar dosis.
3. Sistema crea MEDICACION_ADMINISTRADA.
4. Sistema descuenta automáticamente del lote más próximo a vencer (FEFO).
5. Si INVENTARIO.cantidad <= stock_minimo → ALERTA enviada al Farmacéutico.

Postcondición: trazabilidad completa de cuidados durante la hospitalización.
```

---

## 5. ESTADOS DE ENTIDADES CLAVE

```
CITA.estado:
  PENDIENTE → CONFIRMADA → EN_ESPERA → COMPLETADA
  PENDIENTE → CANCELADA
  CONFIRMADA → CANCELADA

RECETA.estado:
  EMITIDA → DISPENSADA
  EMITIDA → PARCIAL → DISPENSADA
  EMITIDA → CANCELADA

EXAMEN_LABORATORIO.estado:
  SOLICITADO → EN_PROCESO → COMPLETADO
  SOLICITADO → CANCELADO

CAMA.estado:
  DISPONIBLE → OCUPADA → EN_LIMPIEZA → DISPONIBLE
  DISPONIBLE → EN_MANTENIMIENTO → DISPONIBLE

HOSPITALIZACION.estado:
  ACTIVA → ALTA

FACTURA.estado:
  PENDIENTE → PAGADA
  PENDIENTE → ANULADA
  PAGADA → ANULADA  (solo con registro obligatorio en AUDITORIA)

COMPRA.estado:
  PENDIENTE → RECIBIDA
  PENDIENTE → CANCELADA
```

---

## 6. REGLAS DE NEGOCIO CRÍTICAS

```
RN-01:  No registrar paciente con CI duplicado. (PACIENTE.ci UNIQUE)
RN-02:  Al crear PACIENTE, crear HISTORIAL_CLINICO automáticamente. (1:1 obligatorio)
RN-03:  CITA tipo EMERGENCIA no requiere horario disponible previo.
RN-04:  Si PACIENTE tiene ALERGIA → mostrar ALERTA VISUAL en toda apertura de ATENCION.
RN-05:  Dispensación de medicamentos usa lote con fecha_vencimiento más próxima (FEFO).
RN-06:  Si INVENTARIO.cantidad <= stock_minimo → disparar alerta automática de
         reabastecimiento al Farmacéutico.
RN-07:  Si RESULTADO_LABORATORIO.es_critico = TRUE → crear NOTIFICACION URGENTE
         con NOTIFICACION.medico_id = médico tratante (no solo paciente_id).
RN-08:  FACTURA en estado PAGADA no puede modificarse. Solo anularse con log en AUDITORIA.
RN-09:  Toda modificación a HISTORIAL_CLINICO debe registrarse en AUDITORIA.
RN-10:  USUARIO solo accede a módulos que su ROL tiene PERMISO (RBAC).
RN-11:  Contraseñas almacenadas siempre con bcrypt. Nunca en texto plano.
RN-12:  Al dar ALTA en HOSPITALIZACION → CAMA.estado pasa a EN_LIMPIEZA.
RN-13:  NOTIFICACION debe tener al menos uno de (paciente_id, medico_id) NOT NULL.
         (CHECK CONSTRAINT en BD)
RN-14:  PACIENTE.huella_dactilar_ref y foto_rostro_ref son referencias a un sistema
         biométrico externo. SIIH no procesa datos biométricos directamente.
         La integración real requiere API de terceros (fuera del alcance de este proyecto).
RN-15:  El Médico puede consultar INVENTARIO de farmacia en modo solo lectura
         antes de emitir una RECETA. No puede modificar el inventario.
RN-16:  La Enfermera puede ver datos y alergias de todos los pacientes con
         HOSPITALIZACION activa. El historial completo de consultas externas
         está restringido al médico tratante (RBAC).
RN-17:  Solo el ADMIN puede crear, modificar o desactivar USUARIO y asignar ROL.
         El cambio de ROL de un USUARIO requiere registro obligatorio en AUDITORIA.
RN-18:  Al dispensar una RECETA, registrar RECETA.dispensado_por con el usuario_id
         del Farmacéutico que realizó la dispensación.
RN-19:  Al procesar un EXAMEN_LABORATORIO, registrar EXAMEN_LABORATORIO.tecnico_id
         con el usuario_id del Técnico de Laboratorio que lo procesó.
RN-20:  El Paciente solo puede ver su propio HISTORIAL_CLINICO en la app (solo lectura).
         No puede ver información de otros pacientes.
RN-21:  El Paciente solo puede ver disponibilidad (DISPONIBLE / NO DISPONIBLE) de
         medicamentos en farmacia. No puede ver cantidades exactas ni precios.
RN-22:  Al crear un PACIENTE, registrar PACIENTE.registrado_por = usuario_id del
         Admisionista que realizó el registro.
RN-23:  Al crear una CITA (desde app o mostrador), registrar CITA.creado_por =
         usuario_id de quien la programó (Paciente o Admisionista).
RN-24:  Al registrar una ALERGIA o ANTECEDENTE, registrar usuario_id (quién) y
         fecha_registro = NOW() (cuándo). Obligatorio para trazabilidad clínica.
```

---

## 7. MÓDULOS → TABLAS (estructura de paquetes backend)

| Módulo | Paquete / Carpeta | Tablas principales |
|---|---|---|
| Pacientes | `gestion.pacientes` | PACIENTE, HISTORIAL_CLINICO, ALERGIA, ANTECEDENTE |
| Citas | `gestion.citas` | CITA |
| Atención Médica | `gestion.atencion` | ATENCION, SIGNOS_VITALES |
| Laboratorio | `gestion.laboratorio` | EXAMEN_LABORATORIO, RESULTADO_LABORATORIO |
| Farmacia | `gestion.farmacia` | MEDICAMENTO, INVENTARIO, RECETA, DETALLE_RECETA |
| Hospitalización | `gestion.hospitalizacion` | CAMA, HOSPITALIZACION, MEDICACION_ADMINISTRADA |
| Facturación | `gestion.facturacion` | FACTURA, DETALLE_FACTURA |
| Compras / SCM | `gestion.compras` | PROVEEDOR, COMPRA, DETALLE_COMPRA |
| Reportes BI | `gestion.reportes` | Consultas de solo lectura sobre todas las tablas |
| Seguridad | `gestion.seguridad` | USUARIO, ROL, PERMISO, ROL_PERMISO, AUDITORIA, ADMISIONISTA, FARMACEUTICO, TECNICO_LABORATORIO, FACTURADOR |
| Notificaciones | `gestion.notificaciones` | NOTIFICACION |

---

## 8. STACK TECNOLÓGICO

| Capa | ¿Qué es? | ¿Dónde corre? | Lenguaje |
|---|---|---|---|
| **Frontend** | React — componentes, páginas, dashboard | En el navegador del usuario | TypeScript |
| **Backend** | Next.js API Routes (`src/app/api/...`) | En el servidor (Node.js) | TypeScript |
| **Base de datos** | PostgreSQL — queries SQL directos con `pg` | Servidor de base de datos | SQL |
| **Autenticación** | bcrypt — solo hasheo de contraseñas | En el servidor (Node.js) | TypeScript |
| **Estilos** | Tailwind CSS | En el navegador | CSS |

### Por qué un solo proyecto resuelve todo

```
Un solo lenguaje:    TypeScript en frontend y backend
Un solo repositorio: todo en /siih
Un solo comando:     npm run dev arranca todo
Sin CORS:            frontend y backend corren en el mismo origen
Sin ORM:             queries SQL directos con la librería pg
Auth simple:         solo bcrypt, hashear al guardar y verificar al login
```

### Estructura del proyecto

```
/siih
  /src
    /app
      /api                    ← Backend: endpoints REST (Next.js API Routes)
        /pacientes/
          route.ts            ← GET /api/pacientes, POST /api/pacientes
        /citas/
          route.ts
        /atencion/
          route.ts
        /laboratorio/
          route.ts
        /farmacia/
          route.ts
        /hospitalizacion/
          route.ts
        /facturacion/
          route.ts
        /compras/
          route.ts
        /reportes/
          route.ts
        /seguridad/
          route.ts            ← usuarios, roles, permisos
        /notificaciones/
          route.ts
      /dashboard/             ← Frontend: páginas React
        page.tsx
      /pacientes/
        page.tsx
      /citas/
        page.tsx
      /...                    ← una carpeta por módulo
    /components               ← Componentes React reutilizables
  /lib
    db.ts                     ← Cliente pg (pool de conexiones a PostgreSQL)
    hash.ts                   ← Funciones bcrypt (hashear y verificar contraseña)
```

### Comandos de setup

```bash
npx create-next-app@latest siih --typescript --tailwind
cd siih
npm install pg bcrypt
npm install --save-dev @types/pg @types/bcrypt
# → Crear las tablas en PostgreSQL con el SQL del MER
npm run dev
# → Corre frontend + backend en http://localhost:3000
```

---

## 9. ACCESOS POR ROL — RESUMEN

| Módulo | PACIENTE | ADMISIONISTA | MÉDICO | ENFERMERA | FARMACÉUTICO | TÉC. LAB | FACTURADOR | DIRECTOR | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Citas | R/W (propias) | R/W | R | — | — | — | — | R | R/W |
| Historial Clínico | R (propio) | — | R/W | R (hospitalizados) | — | — | — | — | — |
| Atención Médica | — | — | R/W | R + signos W | — | — | — | — | — |
| Laboratorio — solicitar | — | — | W | — | — | — | — | — | — |
| Laboratorio — procesar | — | — | R (propios) | — | — | R/W | — | R | — |
| Farmacia — inventario | R (disponib.) | — | R (consulta) | — | R/W | — | — | R | R |
| Farmacia — dispensar | — | — | — | — | R/W | — | — | — | — |
| Hospitalización | — | R | R/W | R/W | — | — | — | R | — |
| Facturación | R (propias) | — | — | — | — | — | R/W | R | R |
| Compras / Proveedores | — | — | — | — | R/W | — | — | R | — |
| Reportes BI | — | — | — | — | — | — | — | R | R |
| Usuarios / Roles | — | — | — | — | — | — | — | — | R/W |
| Auditoría | — | — | — | — | — | — | — | R | R/W |

> **R** = solo lectura · **W** = escritura · **R/W** = lectura y escritura · **—** = sin acceso

---

> **Resumen de entidades:** 31 tablas en total
> (27 originales + FARMACEUTICO + TECNICO\_LABORATORIO + ADMISIONISTA + FACTURADOR)
> **Actores:** 10 (7 primarios, 2 secundarios, 1 externo)
> **Casos de uso cubiertos:** 13
