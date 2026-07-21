# Plan de Expansión de Datos Demo — SIIH

**Fecha:** 2026-07-21
**Backup:** `db/backup_antes_de_expansion_20260721.sql` (91 KB)
**Archivo de ejecución:** `db/seed_demo_ampliado.sql`

## Reglas

- Solo INSERTs, cero UPDATE/DELETE (con una excepción documentada)
- ON CONFLICT DO NOTHING en todo
- CIs, usernames, códigos verificados para no chocar con existentes
- Los 2 recorridos clínicos existentes (Maria Garcia #1, Jose Hernandez #2) no se tocan
- Los pacientes TEMP-* del wizard no se borran
- La hospitalización con "dwada" no se borra
- Las atenciones vacías no se borran
- Ejecución via Node.js (pg_dump funciona, psql no por timeout en Windows)
- Contraseñas via pgcrypto crypt() (método que ya usa seed_demo.sql)

## Aclaraciones

1. Son **8 actores nuevos** (no 7): 2 médicos + 2 enfermeras + 1 farmacéutico + 1 técnico de lab + 1 admisionista + 1 facturador → 8 usuarios nuevos
2. El UPDATE de cama 401-A → OCUPADA es la **única excepción** al "solo INSERTs" — está explícitamente aprobada para sincronizar el estado de la cama con la nueva hospitalización. Comentada en el SQL.

## Datos a insertar

### 1. Actores nuevos (8 personas)

| Tabla | CI | Nombre | Apellido | Detalle |
|-------|-----|--------|----------|---------|
| medico | V-55555555 | Isabella | Fernandez | Neurologia |
| medico | V-66666666 | Andres | Morales | Ortopedia |
| enfermera | V-30333444 | Patricia | Lopez | MANANA |
| enfermera | V-30444555 | Diana | Perez | NOCTURNO |
| farmaceutico | V-20777888 | Sofia | Ramirez | — |
| tecnico_laboratorio | V-20160888 | Ana | Torres | — |
| admisionista | V-60000002 | Lucia | Fernandez | — |
| facturador | V-30000002 | Carlos | Mendez | — |

### 2. Usuarios nuevos (8)

| Username | Rol | Actor vinculado |
|----------|-----|-----------------|
| dra_fernandez | MEDICO | Isabella Fernandez (Neurologia) |
| dr_morales | MEDICO | Andres Morales (Ortopedia) |
| nurse3_test | ENFERMERA | Patricia Lopez |
| nurse4_test | ENFERMERA | Diana Perez |
| V-20777888 | FARMACEUTICO | Sofia Ramirez |
| lab2_test | TECNICO_LAB | Ana Torres |
| adm2_test | ADMISIONISTA | Lucia Fernandez |
| fact2_test | FACTURADOR | Carlos Mendez |

### 3. Pacientes nuevos (5)

| CI | Nombre | Apellido | Sexo | Seguro |
|----|--------|----------|------|--------|
| V-20345678 | Daniel | Suarez | M | Seguros Mercantil |
| V-18765432 | Elena | Torres | F | Seguros Provincial |
| V-27890123 | Fernando | Castillo | M | NULL |
| E-87654321 | Ana Maria | Rivas | F | Seguros Qualitas |
| V-15678901 | Ricardo | Paredes | M | Seguros Mapfre |

### 4. Historial clínico (5) + alergias (4) + antecedentes (5)

- Historial clínico: 1 por cada paciente nuevo (ON CONFLICT pacmaniente_id DO NOTHING)
- Alergias:
  - Daniel Suarez: Penicilina (GRAVE), Ibuprofeno (MODERADA)
  - Elena Torres: Latex (LEVE)
  - Ricardo Paredes: Sulfas (MODERADA)
- Antecedentes:
  - Daniel Suarez: PATOLOGICO (Asma), QUIRURGICO (apendicectomia 2010)
  - Elena Torres: CARDIOVASCULAR (hipertension)
  - Ricardo Paredes: PATOLOGICO (diabetes tipo 2), CARDIOVASCULAR (colesterol alto)

### 5. Medicamentos nuevos (3)

| Nombre | Principio activo | Presentacion | Concentracion | Laboratorio |
|--------|-----------------|--------------|---------------|-------------|
| Dexametasona | Dexametasona | Comprimido | 4mg | Distribuidora Farmaceutica SA |
| Metoprolol | Tartrato de metoprolol | Comprimido | 50mg | Importadora Medica CA |
| Fluoxetina | Clorhidrato de fluoxetina | Capsula | 20mg | Laboratorios Venezolados |

### 6. Proveedor nuevo (1)

| Nombre | RUC | Direccion |
|--------|-----|-----------|
| Farmacia Central CA | J-40777222-5 | Calle Principal 123, Caracas |

### 7. Inventario nuevos (3 lotes)

| Medicamento | Lote | Cantidad | Stock min | Vencimiento | Precio |
|-------------|------|----------|-----------|-------------|--------|
| Dexametasona | DEXA-2024-A | 45 | 10 | +12 meses | 1.80 |
| Metoprolol | METO-2024-A | 5 | 15 | +12 meses | 2.20 |
| Fluoxetina | FLUOX-2024-A | 60 | 10 | +18 meses | 3.50 |

Nota: Metoprolol con stock bajo (5 < mínimo 15) para alerta RN-06.

### 8. Citas nuevas (8)

| Paciente | Medico | Fecha | Hora | Estado | Tipo | Prioridad |
|----------|--------|-------|------|--------|------|-----------|
| Daniel Suarez | Dr. Rodriguez (MG) | hoy+3 | 10:00 | PENDIENTE | NORMAL | NORMAL |
| Elena Torres | Dra. Gonzalez (Ped) | hoy-10 | 09:00 | COMPLETADA | NORMAL | NORMAL |
| Fernando Castillo | Dra. Fernandez (Neu) | hoy+5 | 14:00 | PENDIENTE | CONTROL | NORMAL |
| Ana Maria Rivas | Dr. Martinez (Card) | hoy+2 | 08:00 | CONFIRMADA | NORMAL | NORMAL |
| Ricardo Paredes | Dr. Morales (Ort) | hoy-3 | 16:00 | COMPLETADA | EMERGENCIA | ALTA |
| Daniel Suarez | Dr. Morales (Ort) | hoy+1 | 11:00 | EN_ESPERA | URGENTE | ALTA |
| Elena Torres | Dr. Rodriguez (MG) | hoy-15 | 10:00 | CANCELADA | NORMAL | NORMAL |
| Fernando Castillo | Dra. Fernandez (Neu) | hoy+7 | 09:00 | CONFIRMADA | NORMAL | NORMAL |

### 9. Atenciones nuevas (4)

| Historial | Medico | Cita | Tipo | Diagnostico |
|-----------|--------|------|------|-------------|
| Elena Torres | Dra. Gonzalez | Elena-Completada | CONSULTA | Gripe estacional |
| Ricardo Paredes | Dr. Morales | Ricardo-Completada | EMERGENCIA | Fractura de radio |
| Daniel Suarez | Dr. Rodriguez | Daniel-Pendiente→atencion_directa | CONSULTA | Dolor lumbar cronico |
| Elena Torres | Dra. Fernandez (Neu) | NULL (control sin cita) | CONTROL | Seguimiento neurologico |

### 10. Signos vitales (4)

Para cada una de las 4 atenciones nuevas, un registro de signos vitales.

### 11. Recetas nuevas (2) + detalle_receta (4 items)

| Atencion | Medico | Estado | Medicamentos |
|----------|--------|--------|--------------|
| Elena Torres atencion | Dra. Gonzalez | DISPENSADA | Paracetamol 500mg x15 |
| Ricardo Paredes atencion | Dr. Morales | EMITIDA | Dexametasona 4mg x10, Metoprolol 50mg x20 |

### 12. Exámenes lab (4)

| Atencion | Tipo | Estado |
|----------|------|--------|
| Elena Torres | Hemograma simple | COMPLETADO |
| Ricardo Paredes | Radiografia de radio | COMPLETADO |
| Ana Maria Rivas (control futuro) | Perfil lipidico | SOLICITADO |
| Fernando Castillo | Electroencefalograma | SOLICITADO |

### 13. Resultados lab (2)

| Examen | Resultado | Critico |
|--------|-----------|---------|
| Elena Torres - Hemograma | Leucocitos 9200, Hemoglobina 12.8, Plaquetas 280000 | FALSE |
| Ricardo Paredes - Radiografia | Fractura lineal de radio distal izquierdo, sin desplazamiento | FALSE |

### 14. Hospitalización (1 nueva ACTIVA) + UPDATE cama

- Ricardo Paredes en cama 401-A, Dr. Morales, desde hace 2 días
- **ÚNICA EXCEPCIÓN UPDATE:** cama 401-A → OCUPADA

### 15. Medicación administrada (2)

- Ricardo Paredes: Dexametasona 4mg IV + Metoprolol 50mg oral

### 16. Facturas nuevas (3) + detalle_factura (5 items)

| Paciente | Atencion | Total | Estado |
|----------|----------|-------|--------|
| Elena Torres | Elena-Atencion | 95.00 | PENDIENTE |
| Ricardo Paredes | Ricardo-Atencion | 380.00 | PENDIENTE |
| Elena Torres | NULL (solo medicamentos) | 45.00 | PAGADA |

Detalles: consulta, emergencia, medicamentos, examen, hospitalización-día.

### 17. Compras nuevas (2) + detalle_compra (4 items)

| Proveedor | Total | Estado | Medicamentos |
|-----------|-------|--------|--------------|
| Farmacia Central CA | 180.00 | RECIBIDA | Dexametasona x100 ($180) |
| Laboratorios Venezolados | 220.00 | PENDIENTE | Fluoxetina x50 ($175), Metoprolol x20 ($45) |

### 18. Notificaciones (5)

| Tipo | Asunto | Destino |
|------|--------|---------|
| CITA | Nueva cita pendiente | paciente Daniel Suarez |
| STOCK_BAJO | Stock bajo: Metoprolol | FARMACEUTICO |
| HOSPITALIZACION | Hospitalizacion activa | MEDICO (Dr. Morales) |
| CITA | Cita completada | paciente Elena Torres |
| EXAMEN | Resultado de examen disponible | paciente Elena Torres |

## Totales esperados

| Tabla | Antes | Después | +Nuevos |
|-------|-------|---------|---------|
| medico | 4 | 6 | +2 |
| enfermera | 2 | 4 | +2 |
| farmaceutico | 3 | 4 | +1 |
| tecnico_laboratorio | 1 | 2 | +1 |
| admisionista | 1 | 2 | +1 |
| facturador | 1 | 2 | +1 |
| usuario | 13 | 21 | +8 |
| paciente | 13 | 18 | +5 |
| historial_clinico | 13 | 18 | +5 |
| alergia | 3 | 7 | +4 |
| antecedente | 5 | 10 | +5 |
| medicamento | 13 | 16 | +3 |
| proveedor | 3 | 4 | +1 |
| inventario | 17 | 20 | +3 |
| cita | 10 | 18 | +8 |
| atencion | 5 | 9 | +4 |
| signos_vitales | 4 | 8 | +4 |
| receta | 2 | 4 | +2 |
| detalle_receta | 3 | 7 | +4 |
| examen_laboratorio | 3 | 7 | +4 |
| resultado_laboratorio | 1 | 3 | +2 |
| hospitalizacion | 2 | 3 | +1 |
| medicacion_administrada | 1 | 3 | +2 |
| factura | 3 | 6 | +3 |
| detalle_factura | 4 | 9 | +5 |
| compra | 1 | 3 | +2 |
| detalle_compra | 1 | 5 | +4 |
| notificacion | 16 | 21 | +5 |

**Total INSERTs nuevos: ~82**
**Total UPDATEs: 1 (cama 401-A → OCUPADA)**

## Tablas que NO reciben datos nuevos

| Tabla | Actual | Razón |
|-------|--------|-------|
| rol | 9 | Los 9 roles del sistema están completos (ADMIN, DIRECTOR, MEDICO, ENFERMERA, FARMACEUTICO, TECNICO_LAB, ADMISIONISTA, FACTURADOR, PACIENTE) |
| permiso | 21 | 11 módulos × 2 acciones (READ/WRITE) = 22 posibles, 21 asignados — completo |
| rol_permiso | 69 | Todas las asignaciones rol→permiso están definidas |
| tarifa_servicio | 4 | CONSULTA, EMERGENCIA, EXAMEN_LABORATORIO, HOSPITALIZACION_DIA — cubre todos los tipos de servicio del sistema |
| cama | 15 | 15 camas en 6 pisos/salas — suficiente para demo. Solo 1 UPDATE (401-A → OCUPADA) |
| auditoria | 31+ | Se genera automáticamente con cada acción del sistema |
