# Datos Agregados — SIIH

**Fecha de ejecución:** 2026-07-21
**Backup:** `db/backup_antes_de_expansion_20260721.sql` (91 KB)
**Script:** `db/seed_demo_ampliado.sql` + `db/fix_discrepancies.js`
**Plan:** `docs/PLAN-DATOS-AGREGADOS.md`

---

## Resumen general

Se agregaron **~82 registros nuevos** en 28 tablas, más **2 atenciones** y **1 receta** adicionales para completar la integridad referencial. Total de INSERTs efectivos: **~85**. Un único UPDATE autorizado (cama 401-A → OCUPADA).

---

## Tabla por tabla: antes → después

### Actores

| Tabla | Antes | Después | Qué se agregó |
|-------|-------|---------|---------------|
| medico | 4 | 6 | **Dra. Isabella Fernandez** (Neurologia, CI V-55555555), **Dr. Andres Morales** (Ortopedia, CI V-66666666) |
| enfermera | 2 | 4 | **Patricia Lopez** (MANANA, CI V-30333444), **Diana Perez** (NOCTURNO, CI V-30444555) |
| farmaceutico | 3 | 4 | **Sofia Ramirez** (CI V-20777888) |
| tecnico_laboratorio | 1 | 2 | **Ana Torres** (CI V-20160888) |
| admisionista | 1 | 2 | **Lucia Fernandez** (CI V-60000002) |
| facturador | 1 | 2 | **Carlos Mendez** (CI V-30000002) |

### Usuarios

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| usuario | 13 | 21 | +8 (dra_fernandez, dr_morales, nurse3_test, nurse4_test, V-20777888, lab2_test, adm2_test, fact2_test) — todos con contraseña bcrypt via pgcrypto |

### Pacientes

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| paciente | 13 | 18 | +5 |

**Pacientes nuevos:**
| CI | Nombre | Sexo | Seguro | Nacimiento |
|----|--------|------|--------|------------|
| V-20345678 | Daniel Suarez | M | Seguros Mercantil | 1988-06-14 |
| V-18765432 | Elena Torres | F | Seguros Provincial | 1975-11-08 |
| V-27890123 | Fernando Castillo | M | (sin seguro) | 2001-02-28 |
| E-87654321 | Ana Maria Rivas | F | Seguros Qualitas | 1995-09-19 |
| V-15678901 | Ricardo Paredes | M | Seguros Mapfre | 1962-04-03 |

*Nota: Los 3 pacientes TEMP-* del wizard de testing permanecen intactos.*

### Historial clínico + datos clínicos

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| historial_clinico | 13 | 18 | +5 (1 por cada paciente nuevo) |
| alergia | 3 | 7 | +4 |
| antecedente | 5 | 10 | +5 |

**Alergias nuevas:**
| Paciente | Sustancia | Severidad |
|----------|-----------|-----------|
| Daniel Suarez | Penicilina | GRAVE |
| Daniel Suarez | Ibuprofeno | MODERADA |
| Elena Torres | Latex | LEVE |
| Ricardo Paredes | Sulfas | MODERADA |

**Antecedentes nuevos:**
| Paciente | Tipo | Descripción |
|----------|------|-------------|
| Daniel Suarez | PATOLOGICO | Asma bronquial desde la infancia, uso Salbutamol PRN |
| Daniel Suarez | QUIRURGICO | Apendicectomía laparoscópica en 2010 |
| Elena Torres | CARDIOVASCULAR | Hipertensión arterial desde 2015, Losartan 50mg |
| Ricardo Paredes | PATOLOGICO | Diabetes tipo 2 desde 2012, Metformina 850mg |
| Ricardo Paredes | CARDIOVASCULAR | Hipercolesterolemia desde 2018, Atorvastatina 20mg |

### Farmacia

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| medicamento | 13 | 16 | +3 |
| proveedor | 3 | 4 | +1 |
| inventario | 17 | 20 | +3 |

**Medicamentos nuevos:**
| Nombre | Principio activo | Concentración | Laboratorio |
|--------|-----------------|---------------|-------------|
| Dexametasona | Dexametona | 4mg | Distribuidora Farmaceutica SA |
| Metoprolol | Tartrato de metoprolol | 50mg | Importadora Medica CA |
| Fluoxetina | Clorhidrato de fluoxetina | 20mg | Laboratorios Venezolados |

**Proveedor nuevo:** Farmacia Central CA (J-40777222-5)

**Inventario nuevo:**
| Medicamento | Lote | Cantidad | Mínimo | Precio | Nota |
|-------------|------|----------|--------|--------|------|
| Dexametasona | DEXA-2024-A | 45 | 10 | $1.80 | Stock normal |
| Metoprolol | METO-2024-A | 5 | 15 | $2.20 | **Stock BAJO** (para alerta RN-06) |
| Fluoxetina | FLUOX-2024-A | 60 | 10 | $3.50 | Stock normal |

### Citas

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| cita | 10 | 18 | +8 |

**Citas nuevas (por estado):**
| Estado | Cantidad | Ejemplos |
|--------|----------|----------|
| PENDIENTE | 2 | Daniel Suarez → Dr. Rodriguez (hoy+3), Fernando Castillo → Dra. Fernandez (hoy+5) |
| COMPLETADA | 2 | Elena Torres → Dra. Gonzalez (hace 10d, gripe), Ricardo Paredes → Dr. Morales (hace 3d, fractura) |
| CONFIRMADA | 2 | Ana Maria Rivas → Dr. Martinez (hoy+2, cardiologia), Fernando Castillo → Dra. Fernandez (hoy+7) |
| EN_ESPERA | 1 | Daniel Suarez → Dr. Morales (hoy+1, rodilla) |
| CANCELADA | 1 | Elena Torres → Dr. Rodriguez (hace 15d) |

### Atenciones

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| atencion | 5 | 11 | +6 (4 plan + 2 fix) |

**Atenciones nuevas:**
| # | Paciente | Tipo | Diagnóstico |
|---|----------|------|-------------|
| 10 | Elena Torres | CONSULTA | Gripe estacional |
| 11 | Ricardo Paredes | EMERGENCIA | Fractura lineal de radio distal izquierdo |
| 12 | Daniel Suarez | CONSULTA | Lumbalgia mecánica crónica |
| 13 | Elena Torres | CONTROL | Cefalea crónica en control, sin crisis 30 días |
| 14 | Ana Maria Rivas | CONSULTA | Dolor torácico atípico — evaluación en curso |
| 15 | Fernando Castillo | CONSULTA | Cefalea crónica tipo tensional — evaluación inicial |

### Signos vitales

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| signos_vitales | 4 | 8 | +4 |

Todos con valores clínicos realistas (temperatura, presión, FC, FR, SpO2, peso, talla).

### Recetas

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| receta | 2 | 5 | +3 |
| detalle_receta | 3 | 7 | +4 |

**Recetas nuevas:**
| Receta | Médico | Estado | Medicamentos |
|--------|--------|--------|--------------|
| REC-20260711-0001 | Dra. Gonzalez | DISPENSADA | Paracetamol 500mg x15 |
| REC-20260718-0001 | Dr. Morales | EMITIDA | Dexametasona 4mg x10, Metoprolol 50mg x20 |
| REC-20260721-0099 | Dr. Rodriguez | EMITIDA | Paracetamol 500mg x14 |

### Laboratorio

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| examen_laboratorio | 3 | 7 | +4 |
| resultado_laboratorio | 1 | 3 | +2 |

**Exámenes nuevos:**
| Tipo | Estado | Paciente |
|------|--------|----------|
| Hemograma simple | COMPLETADO | Elena Torres |
| Radiografia de radio | COMPLETADO | Ricardo Paredes |
| Perfil lipidico | SOLICITADO | Ana Maria Rivas |
| Electroencefalograma | SOLICITADO | Fernando Castillo |

**Resultados nuevos:**
| Examen | Resultado | Crítico |
|--------|-----------|---------|
| Hemograma simple | Leucocitos 9200, Hb 12.8, Plaquetas 280000, VSG 12mm/h | No |
| Radiografia radio | Fractura lineal de metaradio distal izquierdo, sin desplazamiento | No |

### Hospitalización

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| hospitalizacion | 2 | 3 | +1 |
| medicacion_administrada | 1 | 3 | +2 |

**Hospitalización nueva:**
- **Ricardo Paredes** en cama **401-A** (Cirugía), Dr. Morales, estado **ACTIVA** desde hace 2 días
- Diagnóstico: Fractura lineal de radio distal izquierdo — requiere observación post-reducción
- Medicación: Dexametasona 4mg c/12h + Metoprolol 50mg c/24h

**⚠ ÚNICA excepción UPDATE:** cama 401-A → OCUPADA (sincronizado con hospitalización)

### Facturación

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| factura | 3 | 6 | +3 |
| detalle_factura | 4 | 9 | +5 |

**Facturas nuevas:**
| # | Paciente | Total | Estado | Concepto |
|---|----------|-------|--------|----------|
| FAC-20260711-0001 | Elena Torres | $95.00 | PENDIENTE | Consulta gripe + Hemograma |
| FAC-20260718-0001 | Ricardo Paredes | $380.00 | PENDIENTE | Emergencia fractura + 2 días hospitalización |
| FAC-20260701-0001 | Elena Torres | $45.00 | PAGADA | Consulta de control gripal (EFECTIVO) |

### Compras

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| compra | 1 | 3 | +2 |
| detalle_compra | 1 | 5 | +4 |

**Compras nuevas:**
| Proveedor | Total | Estado | Items |
|-----------|-------|--------|-------|
| Farmacia Central CA | $180.00 | RECIBIDA | Dexametasona x100 ($180) |
| Laboratorios Venezolados | $220.00 | PENDIENTE | Fluoxetina x50 ($175), Metoprolol x20 ($45), Dexametasona x15 ($27) |

### Notificaciones

| Tabla | Antes | Después | Nuevos |
|-------|-------|---------|--------|
| notificacion | 16 | 21 | +5 |

**Notificaciones nuevas:**
| Tipo | Asunto | Destino | Estado |
|------|--------|---------|--------|
| CITA | Cita programada | Daniel Suarez | PENDIENTE |
| STOCK_BAJO | Stock bajo: Metoprolol | FARMACEUTICO | PENDIENTE |
| HOSPITALIZACION | Hospitalizacion activa — Ricardo Paredes | MEDICO | PENDIENTE |
| CITA | Cita completada | Elena Torres | ENVIADA |
| EXAMEN | Resultado de examen disponible | Elena Torres | PENDIENTE |

---

## Tablas que NO recibieron datos nuevos

| Tabla | Actual | Razón |
|-------|--------|-------|
| rol | 9 | Los 9 roles del sistema están completos |
| permiso | 21 | 11 módulos × 2 acciones — completo |
| rol_permiso | 69 | Todas las asignaciones rol→permiso definidas |
| tarifa_servicio | 4 | CONSULTA, EMERGENCIA, EXAMEN_LABORATORIO, HOSPITALIZACION_DIA — completo |
| cama | 15 | 15 camas en 6 pisos/salas — suficiente para demo (solo 1 UPDATE: 401-A → OCUPADA) |
| auditoria | 31→55+ | Se genera automáticamente con cada acción del sistema |

---

## Credenciales de usuarios nuevos

| Username | Contraseña | Rol | Actor |
|----------|-----------|-----|-------|
| dra_fernandez | med123 | MEDICO | Isabella Fernandez (Neurologia) |
| dr_morales | med123 | MEDICO | Andres Morales (Ortopedia) |
| nurse3_test | nurse123 | ENFERMERA | Patricia Lopez |
| nurse4_test | nurse123 | ENFERMERA | Diana Perez |
| V-20777888 | farm123 | FARMACEUTICO | Sofia Ramirez |
| lab2_test | lab123 | TECNICO_LAB | Ana Torres |
| adm2_test | adm123 | ADMISIONISTA | Lucia Fernandez |
| fact2_test | fact123 | FACTURADOR | Carlos Mendez |
