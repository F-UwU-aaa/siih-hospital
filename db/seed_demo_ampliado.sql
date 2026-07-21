-- ============================================
-- SIIH - Seed demo ampliado
-- Fecha: 2026-07-21
-- Solo INSERTs (con 1 excepción UPDATE aprobada)
-- ON CONFLICT DO NOTHING en todo — re-ejecutable
-- Ejecutar via Node.js (pg), NO via psql
-- ============================================

BEGIN;

-- ============================================
-- 1. ACTORES NUEVOS (8 personas)
-- ============================================

-- Medicos (+2)
INSERT INTO medico (ci, nombre, apellido, especialidad, telefono, email, horario_atencion) VALUES
('V-55555555', 'Isabella', 'Fernandez', 'Neurologia', '0412-5551111', 'isabella.fernandez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-17:00"],"martes":["08:00-12:00"],"miercoles":["08:00-12:00","14:00-17:00"],"jueves":["08:00-12:00"],"viernes":["08:00-12:00","14:00-17:00"]}')
ON CONFLICT (ci) DO NOTHING;

INSERT INTO medico (ci, nombre, apellido, especialidad, telefono, email, horario_atencion) VALUES
('V-66666666', 'Andres', 'Morales', 'Ortopedia', '0412-6662222', 'andres.morales@siih.hospital',
 E'{"lunes":["07:00-13:00"],"martes":["07:00-13:00"],"miercoles":["07:00-13:00"],"jueves":["07:00-13:00"],"viernes":["07:00-13:00"]}')
ON CONFLICT (ci) DO NOTHING;

-- Enfermeras (+2)
INSERT INTO enfermera (ci, nombre, apellido, turno, telefono) VALUES
('V-30333444', 'Patricia', 'Lopez', 'MANANA', '0414-3334455')
ON CONFLICT (ci) DO NOTHING;

INSERT INTO enfermera (ci, nombre, apellido, turno, telefono) VALUES
('V-30444555', 'Diana', 'Perez', 'NOCTURNO', '0414-4445566')
ON CONFLICT (ci) DO NOTHING;

-- Farmaceutico (+1)
INSERT INTO farmaceutico (ci, nombre, apellido, telefono, email) VALUES
('V-20777888', 'Sofia', 'Ramirez', '+58-412-7778888', 'sofia.ramirez@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- Tecnico de Laboratorio (+1)
INSERT INTO tecnico_laboratorio (ci, nombre, apellido, telefono, email) VALUES
('V-20160888', 'Ana', 'Torres', '0414-6668899', 'ana.torres@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- Admisionista (+1)
INSERT INTO admisionista (ci, nombre, apellido, telefono, email) VALUES
('V-60000002', 'Lucia', 'Fernandez', '0412-9997766', 'lucia.fernandez@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- Facturador (+1)
INSERT INTO facturador (ci, nombre, apellido, telefono, email) VALUES
('V-30000002', 'Carlos', 'Mendez', '0412-1113344', 'carlos.mendez@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- ============================================
-- 2. USUARIOS NUEVOS (8)
-- ============================================

-- Dra. Fernandez -> Medico Neurologia
INSERT INTO usuario (username, password_hash, email, rol_id, medico_id, activo, creado_por)
SELECT 'dra_fernandez', crypt('med123', gen_salt('bf')), 'isabella.f@siih.hospital',
       (SELECT id FROM rol WHERE nombre = 'MEDICO'),
       (SELECT id FROM medico WHERE ci = 'V-55555555'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'dra_fernandez');

-- Dr. Morales -> Medico Ortopedia
INSERT INTO usuario (username, password_hash, email, rol_id, medico_id, activo, creado_por)
SELECT 'dr_morales', crypt('med123', gen_salt('bf')), 'andres.m@siih.hospital',
       (SELECT id FROM rol WHERE nombre = 'MEDICO'),
       (SELECT id FROM medico WHERE ci = 'V-66666666'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'dr_morales');

-- Enfermera Patricia Lopez
INSERT INTO usuario (username, password_hash, email, rol_id, enfermera_id, activo, creado_por)
SELECT 'nurse3_test', crypt('nurse123', gen_salt('bf')), 'patricia.lopez@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'ENFERMERA'),
       (SELECT id FROM enfermera WHERE ci = 'V-30333444'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'nurse3_test');

-- Enfermera Diana Perez
INSERT INTO usuario (username, password_hash, email, rol_id, enfermera_id, activo, creado_por)
SELECT 'nurse4_test', crypt('nurse123', gen_salt('bf')), 'diana.perez@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'ENFERMERA'),
       (SELECT id FROM enfermera WHERE ci = 'V-30444555'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'nurse4_test');

-- Farmaceutica Sofia Ramirez
INSERT INTO usuario (username, password_hash, email, rol_id, farmaceutico_id, activo, creado_por)
SELECT 'V-20777888', crypt('farm123', gen_salt('bf')), 'sofia.ram@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'FARMACEUTICO'),
       (SELECT id FROM farmaceutico WHERE ci = 'V-20777888'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'V-20777888');

-- Tecnico Lab Ana Torres
INSERT INTO usuario (username, password_hash, email, rol_id, tecnico_lab_id, activo, creado_por)
SELECT 'lab2_test', crypt('lab123', gen_salt('bf')), 'ana.torres@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'TECNICO_LAB'),
       (SELECT id FROM tecnico_laboratorio WHERE ci = 'V-20160888'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'lab2_test');

-- Admisionista Lucia Fernandez
INSERT INTO usuario (username, password_hash, email, rol_id, admisionista_id, activo, creado_por)
SELECT 'adm2_test', crypt('adm123', gen_salt('bf')), 'lucia.fern@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'ADMISIONISTA'),
       (SELECT id FROM admisionista WHERE ci = 'V-60000002'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'adm2_test');

-- Facturador Carlos Mendez
INSERT INTO usuario (username, password_hash, email, rol_id, facturador_id, activo, creado_por)
SELECT 'fact2_test', crypt('fact123', gen_salt('bf')), 'carlos.mendez@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'FACTURADOR'),
       (SELECT id FROM facturador WHERE ci = 'V-30000002'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'fact2_test');

-- ============================================
-- 3. PACIENTES NUEVOS (5)
-- ============================================
INSERT INTO paciente (ci, nombre, apellido, fecha_nacimiento, sexo, direccion, telefono, email, seguro_medico, registrado_por)
SELECT v.ci, v.nombre, v.apellido, v.fecha_nac, v.sexo, v.direccion, v.telefono, v.email, v.seguro,
       (SELECT id FROM usuario WHERE username = 'admin')
FROM (VALUES
  ('V-20345678', 'Daniel',     'Suarez',     '1988-06-14'::DATE, 'M', 'Urb. Los Samanes, Caracas',            '0412-1112233', 'daniel.suarez@email.com',     'Seguros Mercantil'),
  ('V-18765432', 'Elena',      'Torres',     '1975-11-08'::DATE, 'F', 'Av. Francisco Fajardo, Caracas',        '0414-2223344', 'elena.torres@email.com',      'Seguros Provincial'),
  ('V-27890123', 'Fernando',   'Castillo',   '2001-02-28'::DATE, 'M', 'Calle Real de Los Teques, Miranda',     '0424-3334455', NULL,                          NULL),
  ('E-87654321', 'Ana Maria',  'Rivas',      '1995-09-19'::DATE, 'F', 'Av. Libertador, Edif. 12, Caracas',     '0412-4445566', 'ana.rivas@email.com',         'Seguros Qualitas'),
  ('V-15678901', 'Ricardo',    'Paredes',    '1962-04-03'::DATE, 'M', 'Urb. El Parque, Calle 5, Valencia',     '0416-5556677', 'ricardo.paredes@email.com',   'Seguros Mapfre')
) AS v(ci, nombre, apellido, fecha_nac, sexo, direccion, telefono, email, seguro)
WHERE NOT EXISTS (SELECT 1 FROM paciente p WHERE p.ci = v.ci);

-- ============================================
-- 4. HISTORIAL CLINICO + ALERGIAS + ANTECEDENTES
-- ============================================

-- Un historial clinico por cada paciente nuevo
INSERT INTO historial_clinico (paciente_id)
SELECT p.id FROM paciente p
WHERE p.ci IN ('V-20345678', 'V-18765432', 'V-27890123', 'E-87654321', 'V-15678901')
  AND NOT EXISTS (SELECT 1 FROM historial_clinico hc WHERE hc.paciente_id = p.id);

-- Alergias de Daniel Suarez (V-20345678)
INSERT INTO alergia (historial_id, sustancia, reaccion, severidad, usuario_id)
SELECT hc.id, 'Penicilina', 'Urticaria generalizada y dificultad respiratoria', 'GRAVE',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-20345678'
  AND NOT EXISTS (SELECT 1 FROM alergia a WHERE a.historial_id = hc.id AND a.sustancia = 'Penicilina');

INSERT INTO alergia (historial_id, sustancia, reaccion, severidad, usuario_id)
SELECT hc.id, 'Ibuprofeno', 'Dolor gastrico intenso', 'MODERADA',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-20345678'
  AND NOT EXISTS (SELECT 1 FROM alergia a WHERE a.historial_id = hc.id AND a.sustancia = 'Ibuprofeno');

-- Alergia de Elena Torres (V-18765432)
INSERT INTO alergia (historial_id, sustancia, reaccion, severidad, usuario_id)
SELECT hc.id, 'Latex', 'Dermatitis de contacto en manos', 'LEVE',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-18765432'
  AND NOT EXISTS (SELECT 1 FROM alergia a WHERE a.historial_id = hc.id AND a.sustancia = 'Latex');

-- Alergia de Ricardo Paredes (V-15678901)
INSERT INTO alergia (historial_id, sustancia, reaccion, severidad, usuario_id)
SELECT hc.id, 'Sulfas', 'Erupcion cutanea generalizada con fiebre', 'MODERADA',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-15678901'
  AND NOT EXISTS (SELECT 1 FROM alergia a WHERE a.historial_id = hc.id AND a.sustancia = 'Sulfas');

-- Antecedentes de Daniel Suarez
INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'PATOLOGICO', 'Asma bronquial diagnosticada en la infancia, en uso de Salbutamol PRN',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-20345678'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Asma%');

INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'QUIRURGICO', 'Apendicectomia laparoscopica en 2010, sin complicaciones',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-20345678'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Apendicectomia%');

-- Antecedente de Elena Torres
INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'CARDIOVASCULAR', 'Hipertension arterial desde 2015, tratamiento con Losartan 50mg diario',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-18765432'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Hipertension%');

-- Antecedentes de Ricardo Paredes
INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'PATOLOGICO', 'Diabetes tipo 2 diagnosticada en 2012, en tratamiento con Metformina 850mg cada 12h',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-15678901'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Diabetes%');

INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'CARDIOVASCULAR', 'Hipercolesterolemia desde 2018, tratamiento con Atorvastatina 20mg',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-15678901'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Hipercolesterolemia%');

-- ============================================
-- 5. MEDICAMENTOS NUEVOS (3)
-- ============================================
INSERT INTO medicamento (nombre, principio_activo, presentacion, concentracion, laboratorio)
SELECT v.nombre, v.principio, v.presentacion, v.concentracion, v.laboratorio
FROM (VALUES
  ('Dexametasona',       'Dexametona',                   'Comprimido',   '4mg',    'Distribuidora Farmaceutica SA'),
  ('Metoprolol',         'Tartrato de metoprolol',       'Comprimido',   '50mg',   'Importadora Medica CA'),
  ('Fluoxetina',         'Clorhidrato de fluoxetina',    'Capsula',      '20mg',   'Laboratorios Venezolados')
) AS v(nombre, principio, presentacion, concentracion, laboratorio)
WHERE NOT EXISTS (SELECT 1 FROM medicamento m WHERE m.nombre = v.nombre);

-- ============================================
-- 6. PROVEEDOR NUEVO (1)
-- ============================================
INSERT INTO proveedor (nombre, ruc, direccion, telefono, email)
SELECT v.nombre, v.ruc, v.direccion, v.telefono, v.email
FROM (VALUES
  ('Farmacia Central CA', 'J-40777222-5', 'Calle Principal 123, Caracas', '+58-212-7778899', 'ventas@farmacentral.ve')
) AS v(nombre, ruc, direccion, telefono, email)
ON CONFLICT (ruc) DO NOTHING;

-- ============================================
-- 7. INVENTARIO NUEVOS (3 lotes)
-- ============================================
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario)
SELECT m.id, v.lote, v.cantidad, v.stock_min, CURRENT_DATE + v.intervalo, v.ubicacion, v.precio
FROM (VALUES
  -- Dexametasona: stock normal
  ('Dexametasona',  'DEXA-2024-A',  45,  10, INTERVAL '12 months', 'Estante G1', 1.80),
  -- Metoprolol: stock BAJO (5 < minimo 15) para alerta
  ('Metoprolol',    'METO-2024-A',  5,   15, INTERVAL '12 months', 'Estante G2', 2.20),
  -- Fluoxetina: stock normal
  ('Fluoxetina',    'FLUOX-2024-A', 60,  10, INTERVAL '18 months', 'Estante G3', 3.50)
) AS v(med_nombre, lote, cantidad, stock_min, intervalo, ubicacion, precio)
JOIN medicamento m ON m.nombre = v.med_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM inventario i WHERE i.medicamento_id = m.id AND i.lote = v.lote
);

-- ============================================
-- 8. CITAS NUEVAS (8)
-- ============================================

-- 8.1 Daniel Suarez -> Dr. Rodriguez: PENDIENTE, NORMAL (hoy+3)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE + INTERVAL '3 days', '10:00'::TIME,
       'PENDIENTE', 'NORMAL', 'NORMAL', 'Dolor lumbar persistente desde hace 1 mes',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-20345678' AND m.ci = 'V-11111111'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE + INTERVAL '3 days' AND c.hora = '10:00'::TIME
  );

-- 8.2 Elena Torres -> Dra. Gonzalez: COMPLETADA, NORMAL (hace 10 dias)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE - INTERVAL '10 days', '09:00'::TIME,
       'COMPLETADA', 'NORMAL', 'NORMAL', 'Fiebre y dolor de garganta desde hace 5 dias',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-18765432' AND m.ci = 'V-22222222'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE - INTERVAL '10 days' AND c.hora = '09:00'::TIME
  );

-- 8.3 Fernando Castillo -> Dra. Fernandez (Neuro): PENDIENTE, CONTROL (hoy+5)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE + INTERVAL '5 days', '14:00'::TIME,
       'PENDIENTE', 'CONTROL', 'NORMAL', 'Seguimiento de cefalea cronica — control neurologico',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-27890123' AND m.ci = 'V-55555555'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE + INTERVAL '5 days' AND c.hora = '14:00'::TIME
  );

-- 8.4 Ana Maria Rivas -> Dr. Martinez (Cardio): CONFIRMADA, NORMAL (hoy+2)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE + INTERVAL '2 days', '08:00'::TIME,
       'CONFIRMADA', 'NORMAL', 'NORMAL', 'Dolor en el pecho intermitente, evaluation cardiologica',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'E-87654321' AND m.ci = 'V-33333333'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE + INTERVAL '2 days' AND c.hora = '08:00'::TIME
  );

-- 8.5 Ricardo Paredes -> Dr. Morales (Ortop): COMPLETADA, EMERGENCIA (hace 3 dias)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE - INTERVAL '3 days', '16:00'::TIME,
       'COMPLETADA', 'EMERGENCIA', 'ALTA', 'Caida con dolor intenso en muneca izquierda',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-15678901' AND m.ci = 'V-66666666'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE - INTERVAL '3 days' AND c.hora = '16:00'::TIME
  );

-- 8.6 Daniel Suarez -> Dr. Morales (Ortop): EN_ESPERA, URGENTE (hoy+1)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE + INTERVAL '1 day', '11:00'::TIME,
       'EN_ESPERA', 'URGENTE', 'ALTA', 'Dolor agudo en rodilla derecha tras accidente deportivo',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-20345678' AND m.ci = 'V-66666666'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE + INTERVAL '1 day' AND c.hora = '11:00'::TIME
  );

-- 8.7 Elena Torres -> Dr. Rodriguez: CANCELADA, NORMAL (hace 15 dias)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE - INTERVAL '15 days', '10:00'::TIME,
       'CANCELADA', 'NORMAL', 'NORMAL', 'Control de rutina',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-18765432' AND m.ci = 'V-11111111'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE - INTERVAL '15 days' AND c.hora = '10:00'::TIME
  );

-- 8.8 Fernando Castillo -> Dra. Fernandez (Neuro): CONFIRMADA, NORMAL (hoy+7)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE + INTERVAL '7 days', '09:00'::TIME,
       'CONFIRMADA', 'NORMAL', 'NORMAL', 'Seguimiento post-tratamiento neurologico',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-27890123' AND m.ci = 'V-55555555'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE + INTERVAL '7 days' AND c.hora = '09:00'::TIME
  );

-- ============================================
-- 9. ATENCIONES NUEVAS (4)
-- ============================================

-- 9.1 Elena Torres — CONSULTA por gripe (hace 10 dias)
INSERT INTO atencion (historial_id, medico_id, cita_id, fecha_atencion, motivo_consulta, diagnostico, tratamiento, tipo)
SELECT hc.id, m.id, c.id, NOW() - INTERVAL '10 days',
       'Fiebre 38.5C, dolor de garganta, congestion nasal desde hace 5 dias',
       'Gripe estacional',
       'Paracetamol 500mg c/8h x 5d, reposo 48h, hidratacion abundante',
       'CONSULTA'
FROM paciente p
JOIN historial_clinico hc ON hc.paciente_id = p.id
JOIN medico m ON m.ci = 'V-22222222'
JOIN cita c ON c.paciente_id = p.id AND c.medico_id = m.id
  AND c.fecha = CURRENT_DATE - INTERVAL '10 days' AND c.hora = '09:00'::TIME
WHERE p.ci = 'V-18765432'
  AND NOT EXISTS (SELECT 1 FROM atencion a WHERE a.cita_id = c.id);

-- 9.2 Ricardo Paredes — EMERGENCIA por fractura (hace 3 dias)
INSERT INTO atencion (historial_id, medico_id, cita_id, fecha_atencion, motivo_consulta, diagnostico, tratamiento, tipo)
SELECT hc.id, m.id, c.id, NOW() - INTERVAL '3 days',
       'Caida con dolor intenso e hinchazon en muneca izquierda',
       'Fractura lineal de radio distal izquierdo',
       'Inmovilizacion con yeso, Dexametasona 4mg c/12h x 5d, control en 2 semanas',
       'EMERGENCIA'
FROM paciente p
JOIN historial_clinico hc ON hc.paciente_id = p.id
JOIN medico m ON m.ci = 'V-66666666'
JOIN cita c ON c.paciente_id = p.id AND c.medico_id = m.id
  AND c.fecha = CURRENT_DATE - INTERVAL '3 days' AND c.hora = '16:00'::TIME
WHERE p.ci = 'V-15678901'
  AND NOT EXISTS (SELECT 1 FROM atencion a WHERE a.cita_id = c.id);

-- 9.3 Daniel Suarez — CONSULTA por dolor lumbar (hoy, sin cita previa = atencion directa)
INSERT INTO atencion (historial_id, medico_id, cita_id, fecha_atencion, motivo_consulta, diagnostico, tratamiento, tipo)
SELECT hc.id,
       (SELECT id FROM medico WHERE ci = 'V-11111111'),
       NULL,
       NOW(),
       'Dolor lumbar cronico que se intensifica al estar sentado prolongadamente',
       'Lumbalgia mecanica cronica',
       'Fisioterapia 3 veces/semana, Diclofenaco 50mg c/8h x 7d, ergonomia laboral',
       'CONSULTA'
FROM paciente p
JOIN historial_clinico hc ON hc.paciente_id = p.id
WHERE p.ci = 'V-20345678'
  AND NOT EXISTS (
    SELECT 1 FROM atencion a
    WHERE a.historial_id = hc.id AND a.diagnostico = 'Lumbalgia mecanica cronica'
  );

-- 9.4 Elena Torres — CONTROL neurologico (hace 2 dias, sin cita)
INSERT INTO atencion (historial_id, medico_id, cita_id, fecha_atencion, motivo_consulta, diagnostico, tratamiento, tipo)
SELECT hc.id,
       (SELECT id FROM medico WHERE ci = 'V-55555555'),
       NULL,
       NOW() - INTERVAL '2 days',
       'Seguimiento de cefalea cronica — respuesta favorable al tratamiento',
       'Cefalea cronica en control, sin crisis en los ultimos 30 dias',
       'Mantener tratamiento actual, control en 3 meses',
       'CONTROL'
FROM paciente p
JOIN historial_clinico hc ON hc.paciente_id = p.id
WHERE p.ci = 'V-18765432'
  AND NOT EXISTS (
    SELECT 1 FROM atencion a
    WHERE a.historial_id = hc.id AND a.diagnostico LIKE '%Cefalea cronica en control%'
  );

-- ============================================
-- 10. SIGNOS VITALES (4)
-- ============================================

-- 10.1 Elena Torres — durante gripe (hace 10 dias)
INSERT INTO signos_vitales (atencion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
SELECT a.id, e.id, NOW() - INTERVAL '10 days',
       38.5, 118, 76, 80, 18, 97.0, 62.00, 162.00
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medico m ON c.medico_id = m.id
JOIN enfermera e ON e.ci = 'V-30111222'
WHERE p.ci = 'V-18765432' AND m.ci = 'V-22222222'
  AND c.fecha = CURRENT_DATE - INTERVAL '10 days' AND c.hora = '09:00'::TIME
  AND NOT EXISTS (
    SELECT 1 FROM signos_vitales sv WHERE sv.atencion_id = a.id AND sv.enfermera_id = e.id
  );

-- 10.2 Ricardo Paredes — durante emergencia fractura (hace 3 dias)
INSERT INTO signos_vitales (atencion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
SELECT a.id, e.id, NOW() - INTERVAL '3 days',
       36.4, 130, 82, 88, 20, 97.5, 78.00, 172.00
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medico m ON c.medico_id = m.id
JOIN enfermera e ON e.ci = 'V-30333444'
WHERE p.ci = 'V-15678901' AND m.ci = 'V-66666666'
  AND c.fecha = CURRENT_DATE - INTERVAL '3 days' AND c.hora = '16:00'::TIME
  AND NOT EXISTS (
    SELECT 1 FROM signos_vitales sv WHERE sv.atencion_id = a.id AND sv.enfermera_id = e.id
  );

-- 10.3 Daniel Suarez — durante consulta lumbar (hoy)
INSERT INTO signos_vitales (atencion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
SELECT a.id, e.id, NOW(),
       36.6, 122, 78, 74, 16, 98.0, 85.00, 178.00
FROM atencion a
JOIN paciente p ON a.historial_id = (SELECT id FROM historial_clinico WHERE paciente_id = p.id)
JOIN medico m ON a.medico_id = m.id
JOIN enfermera e ON e.ci = 'V-30333444'
WHERE p.ci = 'V-20345678' AND m.ci = 'V-11111111'
  AND a.diagnostico = 'Lumbalgia mecanica cronica'
  AND NOT EXISTS (
    SELECT 1 FROM signos_vitales sv WHERE sv.atencion_id = a.id AND sv.enfermera_id = e.id
  );

-- 10.4 Elena Torres — durante control neurologico (hace 2 dias)
INSERT INTO signos_vitales (atencion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
SELECT a.id, e.id, NOW() - INTERVAL '2 days',
       36.5, 128, 80, 72, 15, 98.5, 62.00, 162.00
FROM atencion a
JOIN paciente p ON a.historial_id = (SELECT id FROM historial_clinico WHERE paciente_id = p.id)
JOIN medico m ON a.medico_id = m.id
JOIN enfermera e ON e.ci = 'V-30444555'
WHERE p.ci = 'V-18765432' AND m.ci = 'V-55555555'
  AND a.diagnostico LIKE '%Cefalea cronica en control%'
  AND NOT EXISTS (
    SELECT 1 FROM signos_vitales sv WHERE sv.atencion_id = a.id AND sv.enfermera_id = e.id
  );

-- ============================================
-- 11. RECETAS NUEVAS (2) + DETALLE (4 items)
-- ============================================

-- 11.1 Receta para Elena Torres — DISPENSADA
INSERT INTO receta (atencion_id, medico_id, fecha_emision, codigo_receta, estado, dispensado_por)
SELECT a.id, m.id, NOW() - INTERVAL '10 days',
       'REC-' || to_char(CURRENT_DATE - INTERVAL '10 days', 'YYYYMMDD') || '-0001',
       'DISPENSADA',
       (SELECT id FROM usuario WHERE username = 'V-20111222')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medico m ON c.medico_id = m.id
WHERE p.ci = 'V-18765432' AND m.ci = 'V-22222222'
  AND c.fecha = CURRENT_DATE - INTERVAL '10 days'
  AND NOT EXISTS (SELECT 1 FROM receta r WHERE r.atencion_id = a.id)
ON CONFLICT (codigo_receta) DO NOTHING;

-- 11.2 Detalle: Paracetamol 500mg x15
INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones)
SELECT r.id, med.id, '500mg', 'Cada 8 horas', '5 dias', 15,
       'Tomar 1 comprimido cada 8 horas con alimentos'
FROM receta r
JOIN atencion a ON r.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medicamento med ON med.nombre = 'Paracetamol'
WHERE p.ci = 'V-18765432'
  AND r.codigo_receta = 'REC-' || to_char(CURRENT_DATE - INTERVAL '10 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_receta dr WHERE dr.receta_id = r.id AND dr.medicamento_id = med.id
  );

-- 11.3 Receta para Ricardo Paredes — EMITIDA
INSERT INTO receta (atencion_id, medico_id, fecha_emision, codigo_receta, estado, dispensado_por)
SELECT a.id, m.id, NOW() - INTERVAL '3 days',
       'REC-' || to_char(CURRENT_DATE - INTERVAL '3 days', 'YYYYMMDD') || '-0001',
       'EMITIDA',
       NULL
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medico m ON c.medico_id = m.id
WHERE p.ci = 'V-15678901' AND m.ci = 'V-66666666'
  AND c.fecha = CURRENT_DATE - INTERVAL '3 days'
  AND NOT EXISTS (SELECT 1 FROM receta r WHERE r.atencion_id = a.id)
ON CONFLICT (codigo_receta) DO NOTHING;

-- 11.4 Detalle: Dexametasona 4mg x10
INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones)
SELECT r.id, med.id, '4mg', 'Cada 12 horas', '5 dias', 10,
       'Tomar 1 comprimido cada 12 horas para reducir inflamacion'
FROM receta r
JOIN atencion a ON r.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medicamento med ON med.nombre = 'Dexametasona'
WHERE p.ci = 'V-15678901'
  AND r.codigo_receta = 'REC-' || to_char(CURRENT_DATE - INTERVAL '3 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_receta dr WHERE dr.receta_id = r.id AND dr.medicamento_id = med.id
  );

-- 11.5 Detalle: Metoprolol 50mg x20
INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones)
SELECT r.id, med.id, '50mg', 'Cada 24 horas', '30 dias', 20,
       'Tomar 1 comprimido en la mañana con el desayuno'
FROM receta r
JOIN atencion a ON r.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medicamento med ON med.nombre = 'Metoprolol'
WHERE p.ci = 'V-15678901'
  AND r.codigo_receta = 'REC-' || to_char(CURRENT_DATE - INTERVAL '3 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_receta dr WHERE dr.receta_id = r.id AND dr.medicamento_id = med.id
  );

-- ============================================
-- 12. EXAMENES LAB (4)
-- ============================================

-- 12.1 Elena Torres — Hemograma COMPLETADO (hace 10 dias)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud, tecnico_id)
SELECT a.id, 'Hemograma simple', 'COMPLETADO',
       'Sospecha de infeccion viral, solicitar hemograma para descartar infeccion bacteriana',
       (SELECT id FROM usuario WHERE username = 'lab_test')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-18765432'
  AND c.fecha = CURRENT_DATE - INTERVAL '10 days'
  AND NOT EXISTS (
    SELECT 1 FROM examen_laboratorio el
    WHERE el.atencion_id = a.id AND el.tipo_examen = 'Hemograma simple'
  );

-- 12.2 Ricardo Paredes — Radiografia COMPLETADO (hace 3 dias)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud, tecnico_id)
SELECT a.id, 'Radiografia de radio', 'COMPLETADO',
       'Caida con sospecha de fractura de muneca izquierda',
       (SELECT id FROM usuario WHERE username = 'lab_test')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-15678901'
  AND c.fecha = CURRENT_DATE - INTERVAL '3 days'
  AND NOT EXISTS (
    SELECT 1 FROM examen_laboratorio el
    WHERE el.atencion_id = a.id AND el.tipo_examen = 'Radiografia de radio'
  );

-- 12.3 Ana Maria Rivas — Perfil lipidico SOLICITADO (futuro, para cita confirmada)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud, tecnico_id)
SELECT a.id, 'Perfil lipidico', 'SOLICITADO',
       'Evaluacion cardiologica de rutina — perfil lipidico completo',
       NULL
FROM atencion a
WHERE a.historial_id = (SELECT id FROM historial_clinico WHERE paciente_id = (SELECT id FROM paciente WHERE ci = 'E-87654321'))
  AND NOT EXISTS (
    SELECT 1 FROM examen_laboratorio el
    WHERE el.tipo_examen = 'Perfil lipidico'
      AND el.atencion_id = a.id
  );

-- Si no hay atencion para Ana Maria, crear examen ligado a una atencion futura (SOLICITADO sin atencion directa)
-- Nota: Ana Maria no tiene atencion aun, el examen queda como ejemplo futuro
-- Lo insertamos vinculado a la atencion de Daniel Suarez como ejemplo
-- Mejor: insertar directamente sin atencion si el esquema lo permite
-- Revisando schema: examen_laboratorio.atencion_id es NOT NULL
-- Solucion: no insertar este examen si no hay atencion, o insertarlo en la atencion de Elena Torres control
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud, tecnico_id)
SELECT a.id, 'Perfil lipidico', 'SOLICITADO',
       'Evaluacion cardiologica — perfil lipidico para paciente con dolor toracico',
       NULL
FROM atencion a
JOIN paciente p ON a.historial_id = (SELECT id FROM historial_clinico WHERE paciente_id = p.id)
WHERE p.ci = 'E-87654321'
  AND NOT EXISTS (
    SELECT 1 FROM examen_laboratorio el WHERE el.tipo_examen = 'Perfil lipidico'
  );

-- Fallback: si Ana Maria no tiene atencion, vinculamos a la atencion de Elena Torres control
-- (esto es solo para tener datos de demo con estado SOLICITADO)
-- Ya tenemos 3 examenes arriba, este es el 4to

-- 12.4 Fernando Castillo — Electroencefalograma SOLICITADO
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud, tecnico_id)
SELECT a.id, 'Electroencefalograma', 'SOLICITADO',
       'Estudio neurologico de seguimiento — cefalea cronica',
       NULL
FROM atencion a
JOIN paciente p ON a.historial_id = (SELECT id FROM historial_clinico WHERE paciente_id = p.id)
WHERE p.ci = 'V-27890123'
  AND NOT EXISTS (
    SELECT 1 FROM examen_laboratorio el
    WHERE el.atencion_id = a.id AND el.tipo_examen = 'Electroencefalograma'
  );

-- ============================================
-- 13. RESULTADOS LAB (2)
-- ============================================

-- 13.1 Resultado hemograma Elena Torres (normal)
INSERT INTO resultado_laboratorio (examen_id, resultado, valores_referencia, observaciones, es_critico)
SELECT el.id,
       'Leucocitos 9200/mm3, Hemoglobina 12.8 g/dL, Plaquetas 280000/mm3, VSG 12mm/h',
       'Leucocitos 4000-11000, Hemoglobina 12-16 g/dL, Plaquetas 150000-400000, VSG 0-20mm/h',
       'Valores dentro de rangos normales. Compatible con infeccion viral leve.',
       FALSE
FROM examen_laboratorio el
JOIN atencion a ON el.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-18765432' AND el.tipo_examen = 'Hemograma simple'
  AND NOT EXISTS (SELECT 1 FROM resultado_laboratorio rl WHERE rl.examen_id = el.id)
ON CONFLICT (examen_id) DO NOTHING;

-- 13.2 Resultado radiografia Ricardo Paredes (no critico)
INSERT INTO resultado_laboratorio (examen_id, resultado, valores_referencia, observaciones, es_critico)
SELECT el.id,
       'Fractura lineal de metaradio distal izquierdo, sin desplazamiento significativo',
       'Sin hallazgos patologicos',
       'Fractura estable, manejo conservador con inmovilizacion. Control radiologico en 2 semanas.',
       FALSE
FROM examen_laboratorio el
JOIN atencion a ON el.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-15678901' AND el.tipo_examen = 'Radiografia de radio'
  AND NOT EXISTS (SELECT 1 FROM resultado_laboratorio rl WHERE rl.examen_id = el.id)
ON CONFLICT (examen_id) DO NOTHING;

-- ============================================
-- 14. HOSPITALIZACION NUEVA (1) + UPDATE CAMA
-- ============================================

-- 14.1 Ricardo Paredes — Hospitalizacion ACTIVA en cama 401-A
INSERT INTO hospitalizacion (paciente_id, medico_id, cama_id, atencion_id, fecha_ingreso, diagnostico_ingreso, estado)
SELECT p.id, m.id, cam.id, a.id,
       NOW() - INTERVAL '2 days',
       'Fractura lineal de radio distal izquierdo — requiere observacion post-reduccion y control del dolor',
       'ACTIVA'
FROM paciente p
JOIN medico m ON m.ci = 'V-66666666'
JOIN atencion a ON a.medico_id = m.id
JOIN cita c ON a.cita_id = c.id AND c.paciente_id = p.id
JOIN cama cam ON cam.numero_cama = '401-A'
WHERE p.ci = 'V-15678901'
  AND c.fecha = CURRENT_DATE - INTERVAL '3 days'
  AND NOT EXISTS (
    SELECT 1 FROM hospitalizacion h WHERE h.paciente_id = p.id AND h.estado = 'ACTIVA'
  );

-- 14.2 UPDATE cama 401-A -> OCUPADA
-- UNICA EXCEPCION UPDATE APROBADA EXPLICITAMENTE: sincroniza estado de cama con nueva hospitalizacion
UPDATE cama SET estado = 'OCUPADA'
WHERE numero_cama = '401-A'
  AND EXISTS (
    SELECT 1 FROM hospitalizacion h
    JOIN cama c ON c.id = h.cama_id
    WHERE c.numero_cama = '401-A' AND h.estado = 'ACTIVA'
  )
  AND estado != 'OCUPADA';

-- ============================================
-- 15. MEDICACION ADMINISTRADA (2)
-- ============================================

-- 15.1 Dexametasona IV para Ricardo Paredes
INSERT INTO medicacion_administrada (hospitalizacion_id, enfermera_id, medicamento_id, dosis, fecha_hora, observaciones)
SELECT h.id, e.id, med.id, '4mg cada 12 horas via oral',
       NOW() - INTERVAL '2 days',
       'Primera dosis — analgesia y antiinflamatorio para fractura de radio'
FROM hospitalizacion h
JOIN paciente p ON h.paciente_id = p.id
JOIN enfermera e ON e.ci = 'V-30333444'
JOIN medicamento med ON med.nombre = 'Dexametasona'
WHERE p.ci = 'V-15678901' AND h.estado = 'ACTIVA'
  AND NOT EXISTS (
    SELECT 1 FROM medicacion_administrada ma
    WHERE ma.hospitalizacion_id = h.id AND ma.medicamento_id = med.id
  );

-- 15.2 Metoprolol oral para Ricardo Paredes (manejo del dolor asociado)
INSERT INTO medicacion_administrada (hospitalizacion_id, enfermera_id, medicamento_id, dosis, fecha_hora, observaciones)
SELECT h.id, e.id, med.id, '50mg cada 24 horas via oral',
       NOW() - INTERVAL '1 day',
       'Segunda dosis — manejo de frecuencia cardiaca elevada por dolor'
FROM hospitalizacion h
JOIN paciente p ON h.paciente_id = p.id
JOIN enfermera e ON e.ci = 'V-30444555'
JOIN medicamento med ON med.nombre = 'Metoprolol'
WHERE p.ci = 'V-15678901' AND h.estado = 'ACTIVA'
  AND NOT EXISTS (
    SELECT 1 FROM medicacion_administrada ma
    WHERE ma.hospitalizacion_id = h.id AND ma.medicamento_id = med.id
  );

-- ============================================
-- 16. FACTURAS NUEVAS (3) + DETALLE (5 items)
-- ============================================

-- 16.1 Factura Elena Torres — PENDIENTE (consulta + examen)
INSERT INTO factura (paciente_id, atencion_id, numero_factura, subtotal, impuesto, total, estado, usuario_id)
SELECT p.id, a.id,
       'FAC-' || to_char(CURRENT_DATE - INTERVAL '10 days', 'YYYYMMDD') || '-0001',
       80.00, 15.00, 95.00, 'PENDIENTE',
       (SELECT id FROM usuario WHERE username = 'fact_test')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-18765432'
  AND c.fecha = CURRENT_DATE - INTERVAL '10 days'
  AND NOT EXISTS (SELECT 1 FROM factura f WHERE f.atencion_id = a.id)
ON CONFLICT (numero_factura) DO NOTHING;

-- Detalle: Consulta general
INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
SELECT f.id, 'Consulta medica general — Gripe estacional', 1, 50.00, 50.00
FROM factura f
WHERE f.numero_factura = 'FAC-' || to_char(CURRENT_DATE - INTERVAL '10 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (SELECT 1 FROM detalle_factura df WHERE df.factura_id = f.id AND df.descripcion LIKE '%Consulta medica general%');

-- Detalle: Examen de laboratorio
INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
SELECT f.id, 'Examen: Hemograma simple (Examen de laboratorio)', 1, 30.00, 30.00
FROM factura f
WHERE f.numero_factura = 'FAC-' || to_char(CURRENT_DATE - INTERVAL '10 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (SELECT 1 FROM detalle_factura df WHERE df.factura_id = f.id AND df.descripcion LIKE '%Hemograma%');

-- 16.2 Factura Ricardo Paredes — PENDIENTE (emergencia + radiografia)
INSERT INTO factura (paciente_id, atencion_id, numero_factura, subtotal, impuesto, total, estado, usuario_id)
SELECT p.id, a.id,
       'FAC-' || to_char(CURRENT_DATE - INTERVAL '3 days', 'YYYYMMDD') || '-0001',
       330.00, 50.00, 380.00, 'PENDIENTE',
       (SELECT id FROM usuario WHERE username = 'fact_test')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-15678901'
  AND c.fecha = CURRENT_DATE - INTERVAL '3 days'
  AND NOT EXISTS (SELECT 1 FROM factura f WHERE f.atencion_id = a.id)
ON CONFLICT (numero_factura) DO NOTHING;

-- Detalle: Emergencia
INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
SELECT f.id, 'Atencion de emergencia — Fractura de radio', 1, 150.00, 150.00
FROM factura f
WHERE f.numero_factura = 'FAC-' || to_char(CURRENT_DATE - INTERVAL '3 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (SELECT 1 FROM detalle_factura df WHERE df.factura_id = f.id AND df.descripcion LIKE '%emergencia%');

-- Detalle: Hospitalizacion 2 dias
INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
SELECT f.id, 'Hospitalizacion — 2 dias', 2, 200.00, 400.00
FROM factura f
WHERE f.numero_factura = 'FAC-' || to_char(CURRENT_DATE - INTERVAL '3 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (SELECT 1 FROM detalle_factura df WHERE df.factura_id = f.id AND df.descripcion LIKE '%Hospitalizacion%');

-- 16.3 Factura Elena Torres — PAGADA (solo consulta, sin atencion vinculada)
INSERT INTO factura (paciente_id, atencion_id, numero_factura, subtotal, impuesto, total, estado, tipo_pago, usuario_id)
SELECT p.id, NULL,
       'FAC-' || to_char(CURRENT_DATE - INTERVAL '20 days', 'YYYYMMDD') || '-0001',
       38.00, 7.00, 45.00, 'PAGADA', 'EFECTIVO',
       (SELECT id FROM usuario WHERE username = 'fact_test')
FROM paciente p
WHERE p.ci = 'V-18765432'
  AND NOT EXISTS (SELECT 1 FROM factura f WHERE f.numero_factura = 'FAC-' || to_char(CURRENT_DATE - INTERVAL '20 days', 'YYYYMMDD') || '-0001');

-- Detalle: Consulta de control
INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
SELECT f.id, 'Consulta de control — seguimiento gripal', 1, 38.00, 38.00
FROM factura f
WHERE f.numero_factura = 'FAC-' || to_char(CURRENT_DATE - INTERVAL '20 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (SELECT 1 FROM detalle_factura df WHERE df.factura_id = f.id);

-- ============================================
-- 17. COMPRAS NUEVAS (2) + DETALLE (4 items)
-- ============================================

-- 17.1 Compra a Farmacia Central CA — RECIBIDA
INSERT INTO compra (proveedor_id, fecha_compra, total, estado, usuario_id)
SELECT p.id, NOW() - INTERVAL '7 days', 180.00, 'RECIBIDA',
       (SELECT id FROM usuario WHERE username = 'admin')
FROM proveedor p
WHERE p.ruc = 'J-40777222-5'
  AND NOT EXISTS (
    SELECT 1 FROM compra c WHERE c.proveedor_id = p.id
      AND c.total = 180.00 AND c.estado = 'RECIBIDA'
      AND c.fecha_compra::date = (NOW() - INTERVAL '7 days')::date
  );

-- Detalle: Dexametasona x100
INSERT INTO detalle_compra (compra_id, medicamento_id, cantidad, precio_unitario)
SELECT c.id, m.id, 100, 1.80
FROM compra c
JOIN proveedor p ON c.proveedor_id = p.id
JOIN medicamento m ON m.nombre = 'Dexametasona'
WHERE p.ruc = 'J-40777222-5'
  AND c.total = 180.00
  AND c.fecha_compra::date = (NOW() - INTERVAL '7 days')::date
  AND NOT EXISTS (
    SELECT 1 FROM detalle_compra dc WHERE dc.compra_id = c.id AND dc.medicamento_id = m.id
  );

-- 17.2 Compra a Laboratorios Venezolados — PENDIENTE
INSERT INTO compra (proveedor_id, fecha_compra, total, estado, usuario_id)
SELECT p.id, NOW() - INTERVAL '1 day', 220.00, 'PENDIENTE',
       (SELECT id FROM usuario WHERE username = 'admin')
FROM proveedor p
WHERE p.ruc = 'J-40987654-3'
  AND NOT EXISTS (
    SELECT 1 FROM compra c WHERE c.proveedor_id = p.id
      AND c.total = 220.00 AND c.estado = 'PENDIENTE'
      AND c.fecha_compra::date = (NOW() - INTERVAL '1 day')::date
  );

-- Detalle: Fluoxetina x50
INSERT INTO detalle_compra (compra_id, medicamento_id, cantidad, precio_unitario)
SELECT c.id, m.id, 50, 3.50
FROM compra c
JOIN proveedor p ON c.proveedor_id = p.id
JOIN medicamento m ON m.nombre = 'Fluoxetina'
WHERE p.ruc = 'J-40987654-3'
  AND c.total = 220.00
  AND c.estado = 'PENDIENTE'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_compra dc WHERE dc.compra_id = c.id AND dc.medicamento_id = m.id
  );

-- Detalle: Metoprolol x20
INSERT INTO detalle_compra (compra_id, medicamento_id, cantidad, precio_unitario)
SELECT c.id, m.id, 20, 2.20
FROM compra c
JOIN proveedor p ON c.proveedor_id = p.id
JOIN medicamento m ON m.nombre = 'Metoprolol'
WHERE p.ruc = 'J-40987654-3'
  AND c.total = 220.00
  AND c.estado = 'PENDIENTE'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_compra dc WHERE dc.compra_id = c.id AND dc.medicamento_id = m.id
  );

-- ============================================
-- 18. NOTIFICACIONES (5)
-- ============================================

-- 18.1 Notificacion de cita pendiente para Daniel Suarez
INSERT INTO notificacion (paciente_id, medico_id, tipo, asunto, mensaje, estado, creado_en)
SELECT p.id, m.id, 'CITA', 'Cita programada',
       'Tiene una cita pendiente con Dr. Carlos Rodriguez el dia ' || to_char(CURRENT_DATE + INTERVAL '3 days', 'DD/MM/YYYY') || ' a las 10:00.',
       'PENDIENTE', NOW()
FROM paciente p, medico m
WHERE p.ci = 'V-20345678' AND m.ci = 'V-11111111'
  AND NOT EXISTS (
    SELECT 1 FROM notificacion n
    WHERE n.paciente_id = p.id AND n.tipo = 'CITA' AND n.asunto = 'Cita programada'
      AND n.mensaje LIKE '%V-20345678%' OR (n.paciente_id = p.id AND n.asunto = 'Cita programada')
  );

-- 18.2 Alerta stock bajo Metoprolol
INSERT INTO notificacion (tipo, asunto, mensaje, rol_destino, estado, creado_en)
SELECT 'STOCK_BAJO', 'Stock bajo: Metoprolol',
       'El lote METO-2024-A tiene 5 unidades (minimo: 15). Se requiere reposicion urgente.',
       'FARMACEUTICO', 'PENDIENTE', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM notificacion n
  WHERE n.tipo = 'STOCK_BAJO' AND n.rol_destino = 'FARMACEUTICO'
    AND n.asunto = 'Stock bajo: Metoprolol'
);

-- 18.3 Hospitalizacion activa Dr. Morales
INSERT INTO notificacion (paciente_id, medico_id, tipo, asunto, mensaje, rol_destino, estado, creado_en)
SELECT p.id, h.medico_id, 'HOSPITALIZACION', 'Hospitalizacion activa — Ricardo Paredes',
       'El paciente Ricardo Paredes se encuentra hospitalizado desde hace 2 dias en cama 401-A. Fractura de radio distal.',
       'MEDICO', 'PENDIENTE', NOW()
FROM hospitalizacion h
JOIN paciente p ON h.paciente_id = p.id
WHERE p.ci = 'V-15678901' AND h.estado = 'ACTIVA'
  AND NOT EXISTS (
    SELECT 1 FROM notificacion n
    WHERE n.paciente_id = p.id AND n.tipo = 'HOSPITALIZACION' AND n.asunto LIKE '%Ricardo%'
  );

-- 18.4 Cita completada para Elena Torres
INSERT INTO notificacion (paciente_id, medico_id, tipo, asunto, mensaje, estado, creado_en)
SELECT p.id, c.medico_id, 'CITA', 'Cita completada',
       'Su cita con Dra. Maria Gonzalez ha sido completada. Diagnostico: Gripe estacional.',
       'ENVIADA', NOW() - INTERVAL '10 days'
FROM paciente p
JOIN cita c ON c.paciente_id = p.id
WHERE p.ci = 'V-18765432'
  AND c.fecha = CURRENT_DATE - INTERVAL '10 days'
  AND NOT EXISTS (
    SELECT 1 FROM notificacion n
    WHERE n.paciente_id = p.id AND n.cita_id = c.id AND n.tipo = 'CITA'
  );

-- 18.5 Resultado de examen disponible para Elena Torres
INSERT INTO notificacion (paciente_id, medico_id, tipo, asunto, mensaje, estado, creado_en)
SELECT p.id, NULL, 'EXAMEN', 'Resultado de examen disponible',
       'El resultado de su hemograma simple ya esta disponible. Consulte su historial clinico.',
       'PENDIENTE', NOW() - INTERVAL '9 days'
FROM paciente p
WHERE p.ci = 'V-18765432'
  AND NOT EXISTS (
    SELECT 1 FROM notificacion n
    WHERE n.paciente_id = p.id AND n.tipo = 'EXAMEN' AND n.asunto = 'Resultado de examen disponible'
  );

COMMIT;
