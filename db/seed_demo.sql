-- ============================================
-- SIIH - Seed de Demo (Etapa 10)
-- Script unico y autocontenido para carga completa
-- ============================================
-- Ejecutar DESPUES de schema.sql
-- Reemplaza todos los archivos seed_*.sql individuales
-- Idempotente: puede ejecutarse multiples veces sin duplicar datos
-- Usa subqueries por clave natural (CI, numero_cama, username, etc.)
-- en vez de IDs hardcodeados.
-- ============================================

-- ============================================
-- 1. PERMISOS
-- ============================================
INSERT INTO permiso (nombre, modulo, accion)
SELECT v.nombre, v.modulo, v.accion
FROM (VALUES
  ('Citas - Consultar',      'CITAS',          'READ'),
  ('Citas - Gestionar',      'CITAS',          'WRITE'),
  ('Historial - Consultar',  'HISTORIAL',      'READ'),
  ('Historial - Editar',     'HISTORIAL',      'WRITE'),
  ('Atencion - Consultar',   'ATENCION',       'READ'),
  ('Atencion - Editar',      'ATENCION',       'WRITE'),
  ('Laboratorio - Consultar','LABORATORIO',    'READ'),
  ('Laboratorio - Gestionar','LABORATORIO',    'WRITE'),
  ('Farmacia - Consultar',   'FARMACIA',       'READ'),
  ('Farmacia - Gestionar',   'FARMACIA',       'WRITE'),
  ('Hospitalizacion - Consultar', 'HOSPITALIZACION', 'READ'),
  ('Hospitalizacion - Gestionar', 'HOSPITALIZACION', 'WRITE'),
  ('Facturacion - Consultar','FACTURACION',    'READ'),
  ('Facturacion - Gestionar','FACTURACION',    'WRITE'),
  ('Compras - Consultar',    'COMPRAS',        'READ'),
  ('Compras - Gestionar',    'COMPRAS',        'WRITE'),
  ('Reportes - Consultar',   'REPORTES',       'READ'),
  ('Seguridad - Consultar',  'SEGURIDAD',      'READ'),
  ('Seguridad - Gestionar',  'SEGURIDAD',      'WRITE'),
  ('Auditoria - Consultar',  'AUDITORIA',      'READ'),
  ('Auditoria - Gestionar',  'AUDITORIA',      'WRITE')
) AS v(nombre, modulo, accion)
WHERE NOT EXISTS (
  SELECT 1 FROM permiso p WHERE p.modulo = v.modulo AND p.accion = v.accion
);

-- ============================================
-- 2. ROL_PERMISO
-- ============================================

-- ADMIN: acceso total
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p WHERE r.nombre = 'ADMIN'
ON CONFLICT DO NOTHING;

-- DIRECTOR: R en mayoria, R/W Facturacion y Compras
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'DIRECTOR'
  AND (
    (p.modulo = 'CITAS'         AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL'      AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION'       AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO'    AND p.accion = 'READ')
    OR (p.modulo = 'FARMACIA'       AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION'    AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION'    AND p.accion = 'WRITE')
    OR (p.modulo = 'COMPRAS'        AND p.accion = 'READ')
    OR (p.modulo = 'COMPRAS'        AND p.accion = 'WRITE')
    OR (p.modulo = 'REPORTES'       AND p.accion = 'READ')
    OR (p.modulo = 'AUDITORIA'      AND p.accion = 'READ')
  )
ON CONFLICT DO NOTHING;

-- MEDICO
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'MEDICO'
  AND (
    (p.modulo = 'CITAS'         AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL'      AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL'      AND p.accion = 'WRITE')
    OR (p.modulo = 'ATENCION'       AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION'       AND p.accion = 'WRITE')
    OR (p.modulo = 'LABORATORIO'    AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO'    AND p.accion = 'WRITE')
    OR (p.modulo = 'FARMACIA'       AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'WRITE')
  )
ON CONFLICT DO NOTHING;

-- ADMISIONISTA: R/W Citas, R Hospitalizacion, R/W Historial, R Atencion
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'ADMISIONISTA'
  AND (
    (p.modulo = 'CITAS'         AND p.accion = 'READ')
    OR (p.modulo = 'CITAS'         AND p.accion = 'WRITE')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL'      AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL'      AND p.accion = 'WRITE')
    OR (p.modulo = 'ATENCION'       AND p.accion = 'READ')
  )
ON CONFLICT DO NOTHING;

-- ENFERMERA: R Historial, R/W Atencion, R/W Hospitalizacion, R Farmacia (listar medicamentos)
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'ENFERMERA'
  AND (
    (p.modulo = 'HISTORIAL'      AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION'       AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION'       AND p.accion = 'WRITE')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'WRITE')
    OR (p.modulo = 'FARMACIA'       AND p.accion = 'READ')
  )
ON CONFLICT DO NOTHING;

-- FARMACEUTICO: R/W Farmacia + R/W Compras
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'FARMACEUTICO'
  AND (
    (p.modulo = 'FARMACIA'   AND p.accion = 'READ')
    OR (p.modulo = 'FARMACIA'   AND p.accion = 'WRITE')
    OR (p.modulo = 'COMPRAS'    AND p.accion = 'READ')
    OR (p.modulo = 'COMPRAS'    AND p.accion = 'WRITE')
  )
ON CONFLICT DO NOTHING;

-- TECNICO_LAB: R/W Laboratorio
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'TECNICO_LAB'
  AND (
    (p.modulo = 'LABORATORIO' AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO' AND p.accion = 'WRITE')
  )
ON CONFLICT DO NOTHING;

-- FACTURADOR: R/W Facturacion
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'FACTURADOR'
  AND (
    (p.modulo = 'FACTURACION' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'WRITE')
  )
ON CONFLICT DO NOTHING;

-- PACIENTE: R/W Citas (propias), R Historial (propio), R Farmacia, R Facturacion, R Laboratorio (propios)
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'PACIENTE'
  AND (
    (p.modulo = 'CITAS'      AND p.accion = 'READ')
    OR (p.modulo = 'CITAS'      AND p.accion = 'WRITE')
    OR (p.modulo = 'HISTORIAL'  AND p.accion = 'READ')
    OR (p.modulo = 'FARMACIA'   AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO' AND p.accion = 'READ')
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ACTORES
-- ============================================

-- Medicos (4)
INSERT INTO medico (ci, nombre, apellido, especialidad, telefono, email, horario_atencion) VALUES
('V-11111111', 'Carlos',  'Rodriguez', 'Medicina General', '0412-1234567', 'carlos.rodriguez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}'),
('V-22222222', 'Maria',   'Gonzalez',  'Pediatria',        '0412-2345678', 'maria.gonzalez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}'),
('V-33333333', 'Roberto', 'Martinez',  'Cardiologia',      '0412-3456789', 'roberto.martinez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}'),
('V-44444444', 'Ana',     'Lopez',     'Ginecologia',      '0412-4567890', 'ana.lopez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}')
ON CONFLICT (ci) DO NOTHING;

-- Enfermeras (2)
INSERT INTO enfermera (ci, nombre, apellido, turno, telefono) VALUES
('V-30111222', 'Ana',      'Martinez',  'MANANA', '0414-1112233'),
('V-30222333', 'Lucia',    'Hernandez', 'TARDE',  '0414-2223344')
ON CONFLICT (ci) DO NOTHING;

-- Farmaceuticos (3)
INSERT INTO farmaceutico (ci, nombre, apellido, telefono, email) VALUES
('V-20111222', 'Pedro',  'Rodriguez', '+58-412-5551111', 'pedro.rodriguez@hospital.com'),
('V-20333444', 'Laura',  'Fernandez', '+58-414-5552222', 'laura.fernandez@hospital.com'),
('V-20555666', 'Carlos', 'Mendoza',   '+58-416-5553333', 'carlos.mendoza@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- Tecnico de Laboratorio (1)
INSERT INTO tecnico_laboratorio (ci, nombre, apellido, telefono, email) VALUES
('V-20150999', 'Pedro', 'Torres', '0414-5551234', 'pedro.torres@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- Admisionista (1)
INSERT INTO admisionista (ci, nombre, apellido, telefono, email) VALUES
('V-60000001', 'Diego', 'Torres', '0412-9998877', 'diego.torres@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- Facturador (1)
INSERT INTO facturador (ci, nombre, apellido, telefono, email) VALUES
('V-30000000', 'Maria Lopez', 'Garcia', '0412-1234567', 'maria.lopez@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- ============================================
-- 4. USUARIOS
-- ============================================
-- admin ya existe en schema.sql; se omite aqui.

-- Director (sin actor vinculado)
INSERT INTO usuario (username, password_hash, email, rol_id, activo, creado_por)
SELECT 'director_test', crypt('dir123', gen_salt('bf')), 'director@siih.hospital',
       (SELECT id FROM rol WHERE nombre = 'DIRECTOR'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'director_test');

-- Medico -> Carlos Rodriguez
INSERT INTO usuario (username, password_hash, email, rol_id, medico_id, activo, creado_por)
SELECT 'dr_test', crypt('med123', gen_salt('bf')), 'dr.rodriguez@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'MEDICO'),
       (SELECT id FROM medico WHERE ci = 'V-11111111'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'dr_test');

-- Enfermera 1 -> Ana Martinez
INSERT INTO usuario (username, password_hash, email, rol_id, enfermera_id, activo, creado_por)
SELECT 'nurse_test', crypt('nurse123', gen_salt('bf')), 'ana.martinez@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'ENFERMERA'),
       (SELECT id FROM enfermera WHERE ci = 'V-30111222'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'nurse_test');

-- Enfermera 2 -> Lucia Hernandez
INSERT INTO usuario (username, password_hash, email, rol_id, enfermera_id, activo, creado_por)
SELECT 'nurse2_test', crypt('nurse123', gen_salt('bf')), 'lucia.hernandez@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'ENFERMERA'),
       (SELECT id FROM enfermera WHERE ci = 'V-30222333'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'nurse2_test');

-- Farmaceutico 1 -> Pedro Rodriguez
INSERT INTO usuario (username, password_hash, email, rol_id, farmaceutico_id, activo, creado_por)
SELECT 'V-20111222', crypt('farm123', gen_salt('bf')), 'pedro.rod@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'FARMACEUTICO'),
       (SELECT id FROM farmaceutico WHERE ci = 'V-20111222'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'V-20111222');

-- Farmaceutico 2 -> Laura Fernandez
INSERT INTO usuario (username, password_hash, email, rol_id, farmaceutico_id, activo, creado_por)
SELECT 'V-20333444', crypt('farm123', gen_salt('bf')), 'laura.fern@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'FARMACEUTICO'),
       (SELECT id FROM farmaceutico WHERE ci = 'V-20333444'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'V-20333444');

-- Farmaceutico 3 -> Carlos Mendoza
INSERT INTO usuario (username, password_hash, email, rol_id, farmaceutico_id, activo, creado_por)
SELECT 'V-20555666', crypt('farm123', gen_salt('bf')), 'carlos.mend@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'FARMACEUTICO'),
       (SELECT id FROM farmaceutico WHERE ci = 'V-20555666'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'V-20555666');

-- Tecnico Lab -> Pedro Torres
INSERT INTO usuario (username, password_hash, email, rol_id, tecnico_lab_id, activo, creado_por)
SELECT 'lab_test', crypt('lab123', gen_salt('bf')), 'pedro.torres@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'TECNICO_LAB'),
       (SELECT id FROM tecnico_laboratorio WHERE ci = 'V-20150999'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'lab_test');

-- Admisionista -> Diego Torres
INSERT INTO usuario (username, password_hash, email, rol_id, admisionista_id, activo, creado_por)
SELECT 'adm_test', crypt('adm123', gen_salt('bf')), 'diego.torres@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'ADMISIONISTA'),
       (SELECT id FROM admisionista WHERE ci = 'V-60000001'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'adm_test');

-- Facturador -> Maria Lopez
INSERT INTO usuario (username, password_hash, email, rol_id, facturador_id, activo, creado_por)
SELECT 'fact_test', crypt('fact123', gen_salt('bf')), 'maria.lopez@hospital.com',
       (SELECT id FROM rol WHERE nombre = 'FACTURADOR'),
       (SELECT id FROM facturador WHERE ci = 'V-30000000'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'fact_test');

-- Paciente -> Maria Garcia (rol PACIENTE, vinculada a paciente)
INSERT INTO usuario (username, password_hash, email, rol_id, paciente_id, activo, creado_por)
SELECT 'V-87654321', crypt('pac123', gen_salt('bf')), 'maria.garcia@email.com',
       (SELECT id FROM rol WHERE nombre = 'PACIENTE'),
       (SELECT id FROM paciente WHERE ci = 'V-87654321'), TRUE,
       (SELECT id FROM usuario WHERE username = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'V-87654321');

-- ============================================
-- 5. PACIENTES (10)
-- ============================================
INSERT INTO paciente (ci, nombre, apellido, fecha_nacimiento, sexo, direccion, telefono, email, seguro_medico, registrado_por)
SELECT v.ci, v.nombre, v.apellido, v.fecha_nac, v.sexo, v.direccion, v.telefono, v.email, v.seguro,
       (SELECT id FROM usuario WHERE username = 'admin')
FROM (VALUES
  ('V-87654321', 'Maria',    'Garcia',      '1992-03-15'::DATE, 'F', 'Av. Libertador 1234, Caracas',      '0412-1111111', 'maria.garcia@email.com',     'Seguros Mercantil'),
  ('V-25123456', 'Jose',     'Hernandez',   '1968-07-22'::DATE, 'M', 'Calle 5, Edif. 8, Valencia',         '0414-2222222', 'jose.hernandez@email.com',   'Seguros La Previsora'),
  ('V-19876543', 'Ana',      'Lopez',       '2004-11-30'::DATE, 'F', 'Urb. El Parque, Caracas',            '0424-3333333', 'ana.lopez@email.com',        NULL),
  ('E-12345678', 'Pedro',    'Sanchez',     '2018-05-10'::DATE, 'M', 'Av. Bolivar 456, Maracaibo',         '0412-4444444', NULL,                         'Seguros Qualitas'),
  ('V-30000001', 'Carmen',   'Rodriguez',   '1959-01-25'::DATE, 'F', 'Calle Principal 789, Barquisimeto',   '0416-5555555', 'carmen.rodriguez@email.com', 'Seguros Mapfre'),
  ('V-28000001', 'Luis',     'Fernandez',   '1981-09-12'::DATE, 'M', 'Urb. Las Mercedes, Caracas',         '0418-6666666', 'luis.fernandez@email.com',   'Seguros Provincial'),
  ('V-12345001', 'Rosa',     'Martinez',    '1951-06-03'::DATE, 'F', 'Av. 5 de Julio, Valencia',           '0420-7777777', 'rosa.martinez@email.com',     'Seguros La Previsora'),
  ('V-27000001', 'Miguel',   'Torres',      '1996-02-18'::DATE, 'M', 'Calle Norte 321, Caracas',           '0422-8888888', 'miguel.torres@email.com',     'Seguros Mercantil'),
  ('V-29000001', 'Elena',    'Ramirez',     '1974-04-07'::DATE, 'F', 'Urb. San Bernardino, Caracas',        '0424-9999999', 'elena.ramirez@email.com',     'Seguros Mapfre'),
  ('V-31000001', 'Andres',   'Vargas',      '2007-08-20'::DATE, 'M', 'Av. Principal 654, Barinas',          '0412-0000000', 'andres.vargas@email.com',     NULL)
) AS v(ci, nombre, apellido, fecha_nac, sexo, direccion, telefono, email, seguro)
WHERE NOT EXISTS (SELECT 1 FROM paciente p WHERE p.ci = v.ci);

-- ============================================
-- 6. HISTORIAL CLINICO + ALERGIAS + ANTECEDENTES
-- ============================================

-- Un historial clinico por cada paciente
INSERT INTO historial_clinico (paciente_id)
SELECT p.id FROM paciente p
ON CONFLICT (paciente_id) DO NOTHING;

-- Alergias de Maria Garcia (paciente CI V-87654321)
INSERT INTO alergia (historial_id, sustancia, reaccion, severidad, usuario_id)
SELECT hc.id, 'Penicilina', 'Urticaria generalizada con dificultad respiratoria', 'GRAVE',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-87654321'
  AND NOT EXISTS (SELECT 1 FROM alergia a WHERE a.historial_id = hc.id AND a.sustancia = 'Penicilina');

INSERT INTO alergia (historial_id, sustancia, reaccion, severidad, usuario_id)
SELECT hc.id, 'Polen', 'Rinitis alergica estacional', 'LEVE',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-87654321'
  AND NOT EXISTS (SELECT 1 FROM alergia a WHERE a.historial_id = hc.id AND a.sustancia = 'Polen');

-- Alergias de Jose Hernandez (CI V-25123456)
INSERT INTO alergia (historial_id, sustancia, reaccion, severidad, usuario_id)
SELECT hc.id, 'Ibuprofeno', 'Dolor gastrico intenso y hemorragia digestiva leve', 'MODERADA',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-25123456'
  AND NOT EXISTS (SELECT 1 FROM alergia a WHERE a.historial_id = hc.id AND a.sustancia = 'Ibuprofeno');

-- Antecedentes de Maria Garcia
INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'QUIRURGICO', 'Apendicectomia laparoscopica (2015) sin complicaciones',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-87654321'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Apendicectomia%');

INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'PATOLOGICO', 'Asma infantil controlada, sin hospitalizaciones previas',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-87654321'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Asma%');

-- Antecedentes de Jose Hernandez
INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'PATOLOGICO', 'Diabetes tipo 2 diagnosticada en 2018, en tratamiento con Metformina 850mg',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-25123456'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Diabetes%');

-- Antecedentes de Carmen Rodriguez (CI V-30000001)
INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'CARDIOVASCULAR', 'Hipertension arterial diagnosticada en 2010, tratamiento con Losartan 50mg',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-30000001'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Hipertension%');

INSERT INTO antecedente (historial_id, tipo, descripcion, usuario_id)
SELECT hc.id, 'PATOLOGICO', 'Osteoporosis leve diagnosticada en 2022, suplementacion de calcio y vitamina D',
       (SELECT id FROM usuario WHERE username = 'dr_test')
FROM historial_clinico hc
JOIN paciente p ON hc.paciente_id = p.id
WHERE p.ci = 'V-30000001'
  AND NOT EXISTS (SELECT 1 FROM antecedente a WHERE a.historial_id = hc.id AND a.descripcion LIKE '%Osteoporosis%');

-- ============================================
-- 7. MEDICAMENTOS + PROVEEDORES + INVENTARIO
-- ============================================

-- Medicamentos (13: 10 base + 3 adicionales)
INSERT INTO medicamento (nombre, principio_activo, presentacion, concentracion, laboratorio)
SELECT v.nombre, v.principio, v.presentacion, v.concentracion, v.laboratorio
FROM (VALUES
  ('Paracetamol',     'Paracetamol',              'Comprimido',   '500mg',   'Laboratorios Venezolados'),
  ('Ibuprofeno',      'Ibuprofeno',               'Comprimido',   '400mg',   'Laboratorios Venezolados'),
  ('Amoxicilina',     'Amoxicilina',              'Capsula',      '500mg',   'Distribuidora Farmaceutica SA'),
  ('Metformina',      'Clorhidrato de metformina', 'Comprimido',  '850mg',   'Importadora Medica CA'),
  ('Omeprazol',       'Omeprazol',                'Capsula',      '20mg',    'Laboratorios Venezolados'),
  ('Losartan',        'Potasio de losartan',      'Comprimido',   '50mg',    'Importadora Medica CA'),
  ('Prednisona',      'Prednisona',               'Comprimido',   '5mg',     'Distribuidora Farmaceutica SA'),
  ('Naproxeno',       'Naproxeno sodico',         'Comprimido',   '250mg',   'Laboratorios Venezolados'),
  ('Diclofenaco',     'Diclofenaco sodico',       'Comprimido',   '50mg',    'Importadora Medica CA'),
  ('Azitromicina',    'Azitromicina',             'Comprimido',   '500mg',   'Distribuidora Farmaceutica SA'),
  ('Salbutamol',      'Salbutamol',               'Aerosol',      '100mcg',  'Distribuidora Farmaceutica SA'),
  ('Ranitidina',      'Ranitidina',               'Comprimido',   '150mg',   'Laboratorios Venezolados'),
  ('Ciprofloxacino',  'Ciprofloxacino',           'Comprimido',   '500mg',   'Importadora Medica CA')
) AS v(nombre, principio, presentacion, concentracion, laboratorio)
WHERE NOT EXISTS (SELECT 1 FROM medicamento m WHERE m.nombre = v.nombre);

-- Proveedores (3)
INSERT INTO proveedor (nombre, ruc, direccion, telefono, email)
SELECT v.nombre, v.ruc, v.direccion, v.telefono, v.email
FROM (VALUES
  ('Distribuidora Farmaceutica SA', 'J-40123456-7', 'Av. Principal, Edif. 5, Caracas',   '+58-212-5551234', 'ventas@disfarmaca.ve'),
  ('Laboratorios Venezolados',      'J-40987654-3', 'Zona Industrial, Nave 12, Valencia', '+58-241-5559876', 'pedidos@labven.ve'),
  ('Importadora Medica CA',         'J-40555111-9', 'Av. Libertador, Torre 3, Maracaibo', '+58-261-5554321', 'compras@imedica.ve')
) AS v(nombre, ruc, direccion, telefono, email)
ON CONFLICT (ruc) DO NOTHING;

-- Inventario (16 lotes: cantidades finales despues de dispensacion)
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario)
SELECT m.id, v.lote, v.cantidad, v.stock_min, v.fecha_ven, v.ubicacion, v.precio
FROM (VALUES
  -- Paracetamol: PARA-2024-A tuvo 200, se dispensaron 20 a Maria -> 180 restantes
  ('Paracetamol',    'PARA-2024-A', 180, 50, CURRENT_DATE + INTERVAL '18 months', 'Estante A1', 0.50),
  ('Paracetamol',    'PARA-2023-B', 30,  50, CURRENT_DATE - INTERVAL '6 months',  'Estante A1', 0.45),
  -- Ibuprofeno: lote bajo (stock < minimo) para alerta RN-06
  ('Ibuprofeno',     'IBU-2024-A',  8,   20, CURRENT_DATE + INTERVAL '18 months', 'Estante A2', 0.75),
  ('Ibuprofeno',     'IBU-2024-B',  150, 20, CURRENT_DATE + INTERVAL '12 months', 'Estante A2', 0.80),
  -- Amoxicilina: tuvo 100, se dispensaron 30 a Jose -> 70 restantes
  ('Amoxicilina',    'AMOX-2024-A', 70,  30, CURRENT_DATE + INTERVAL '6 months',  'Estante B1', 1.20),
  -- Metformina: stock bajo
  ('Metformina',     'METF-2024-A', 12,  25, CURRENT_DATE + INTERVAL '12 months', 'Estante B2', 1.50),
  -- Omeprazol: lote proximo a vencer (< 30 dias)
  ('Omeprazol',      'OMEP-2024-A', 80,  20, CURRENT_DATE + INTERVAL '15 days',  'Estante C1', 1.00),
  ('Omeprazol',      'OMEP-2023-B', 50,  20, CURRENT_DATE + INTERVAL '6 months',  'Estante C1', 0.90),
  -- Losartan: stock normal
  ('Losartan',       'LOSA-2024-A', 60,  15, CURRENT_DATE + INTERVAL '12 months', 'Estante C2', 2.00),
  -- Prednisona: lote vencido + lote bueno
  ('Prednisona',     'PRED-2023-A', 40,  10, CURRENT_DATE - INTERVAL '9 months',  'Estante D1', 0.60),
  ('Prednisona',     'PRED-2024-A', 90,  10, CURRENT_DATE + INTERVAL '12 months', 'Estante D1', 0.65),
  -- Diclofenaco: sin stock (para test NO DISPONIBLE)
  ('Diclofenaco',    'DICL-2024-A', 0,   15, CURRENT_DATE + INTERVAL '12 months', 'Estante E1', 0.90),
  -- Azitromicina: stock normal
  ('Azitromicina',   'AZIT-2024-A', 75,  20, CURRENT_DATE + INTERVAL '9 months',  'Estante E2', 3.00),
  -- Medicamentos adicionales
  ('Salbutamol',     'SALB-2024-A', 50,  10, CURRENT_DATE + INTERVAL '18 months', 'Estante F1', 4.50),
  ('Ranitidina',     'RANI-2024-A', 40,  10, CURRENT_DATE + INTERVAL '12 months', 'Estante F2', 1.20),
  ('Ciprofloxacino', 'CIPR-2024-A', 30,  10, CURRENT_DATE + INTERVAL '15 months', 'Estante F3', 2.80)
) AS v(med_nombre, lote, cantidad, stock_min, fecha_ven, ubicacion, precio)
JOIN medicamento m ON m.nombre = v.med_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM inventario i WHERE i.medicamento_id = m.id AND i.lote = v.lote
);

-- ============================================
-- 8. CAMAS ADICIONALES
-- ============================================
-- schema.sql crea 101-A, 101-B, UCI-01
INSERT INTO cama (numero_cama, piso, sala, tipo, estado)
SELECT v.numero, v.piso, v.sala, v.tipo, 'DISPONIBLE'
FROM (VALUES
  ('201-A', '2', 'Pediatria',   'PEDIATRIA'),
  ('201-B', '2', 'Pediatria',   'PEDIATRIA'),
  ('301-A', '3', 'Maternidad',  'MATERNIDAD'),
  ('301-B', '3', 'Maternidad',  'MATERNIDAD'),
  ('401-A', '4', 'Cirugia',     'CIRUGIA'),
  ('401-B', '4', 'Cirugia',     'CIRUGIA'),
  ('501-A', '5', 'UCI',         'UCI'),
  ('501-B', '5', 'UCI',         'UCI'),
  ('601-A', '6', 'Consultas',   'GENERAL'),
  ('601-B', '6', 'Consultas',   'GENERAL'),
  ('302-A', '3', 'Maternidad',  'MATERNIDAD'),
  ('502-A', '5', 'UCI',         'UCI')
) AS v(numero, piso, sala, tipo)
ON CONFLICT (numero_cama) DO NOTHING;

-- ============================================
-- 9. RECORRIDO 1: Maria Garcia — Consulta rutinaria
-- ============================================
-- Cita COMPLETADA -> Atencion CONSULTA -> Signos Vitales
-- -> Receta DISPENSADA (Paracetamol) -> Examen COMPLETADO con resultado
-- -> Factura PENDIENTE

-- 9.1 Cita completada (hace 7 dias)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE - INTERVAL '7 days', '09:00'::TIME,
       'COMPLETADA', 'NORMAL', 'NORMAL', 'Dolor de cabeza persistente desde hace 2 semanas',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-87654321' AND m.ci = 'V-11111111'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE - INTERVAL '7 days' AND c.hora = '09:00'::TIME
  );

-- 9.2 Atencion
INSERT INTO atencion (historial_id, medico_id, cita_id, fecha_atencion, motivo_consulta, diagnostico, tratamiento, tipo)
SELECT hc.id, m.id, c.id, NOW() - INTERVAL '7 days',
       'Dolor de cabeza persistente desde hace 2 semanas',
       'Cefalea tensional',
       'Paracetamol 500mg c/8h x 7d, reposo 48h',
       'CONSULTA'
FROM paciente p
JOIN historial_clinico hc ON hc.paciente_id = p.id
JOIN medico m ON m.ci = 'V-11111111'
JOIN cita c ON c.paciente_id = p.id AND c.medico_id = m.id
  AND c.fecha = CURRENT_DATE - INTERVAL '7 days' AND c.hora = '09:00'::TIME
WHERE p.ci = 'V-87654321'
  AND NOT EXISTS (SELECT 1 FROM atencion a WHERE a.cita_id = c.id);

-- 9.3 Signos vitales durante la atencion
INSERT INTO signos_vitales (atencion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
SELECT a.id, e.id, NOW() - INTERVAL '7 days',
       36.8, 120, 80, 72, 16, 98.0, 65.00, 165.00
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medico m ON c.medico_id = m.id
JOIN enfermera e ON e.ci = 'V-30111222'
WHERE p.ci = 'V-87654321' AND m.ci = 'V-11111111'
  AND c.fecha = CURRENT_DATE - INTERVAL '7 days' AND c.hora = '09:00'::TIME
  AND NOT EXISTS (
    SELECT 1 FROM signos_vitales sv WHERE sv.atencion_id = a.id AND sv.enfermera_id = e.id
  );

-- 9.4 Receta DISPENSADA
INSERT INTO receta (atencion_id, medico_id, fecha_emision, codigo_receta, estado, dispensado_por)
SELECT a.id, m.id, NOW() - INTERVAL '7 days',
       'REC-' || to_char(CURRENT_DATE - INTERVAL '7 days', 'YYYYMMDD') || '-0001',
       'DISPENSADA',
       (SELECT id FROM usuario WHERE username = 'V-20111222')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medico m ON c.medico_id = m.id
WHERE p.ci = 'V-87654321' AND m.ci = 'V-11111111'
  AND c.fecha = CURRENT_DATE - INTERVAL '7 days'
  AND NOT EXISTS (SELECT 1 FROM receta r WHERE r.atencion_id = a.id)
ON CONFLICT (codigo_receta) DO NOTHING;

-- 9.5 Detalle receta: Paracetamol 500mg x20
INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones)
SELECT r.id, med.id, '500mg', 'Cada 8 horas', '7 dias', 20,
       'Tomar 1 comprimido cada 8 horas con alimentos'
FROM receta r
JOIN atencion a ON r.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medicamento med ON med.nombre = 'Paracetamol'
WHERE p.ci = 'V-87654321'
  AND r.codigo_receta = 'REC-' || to_char(CURRENT_DATE - INTERVAL '7 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_receta dr WHERE dr.receta_id = r.id AND dr.medicamento_id = med.id
  );

-- 9.6 Examen: Hemograma Completo (COMPLETADO)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud, tecnico_id)
SELECT a.id, 'Hemograma Completo', 'COMPLETADO',
       'Sospecha de infeccion, solicitar hemograma completo',
       (SELECT id FROM usuario WHERE username = 'lab_test')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-87654321'
  AND c.fecha = CURRENT_DATE - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM examen_laboratorio el
    WHERE el.atencion_id = a.id AND el.tipo_examen = 'Hemograma Completo'
  );

-- 9.7 Resultado del examen
INSERT INTO resultado_laboratorio (examen_id, resultado, valores_referencia, observaciones, es_critico)
SELECT el.id,
       'Leucocitos 7500/mm3, Hemoglobina 14.2 g/dL, Plaquetas 250000/mm3',
       'Leucocitos 4000-11000, Hemoglobina 12-16 g/dL, Plaquetas 150000-400000',
       'Valores dentro de rangos normales. Sin hallazgos patologicos.',
       FALSE
FROM examen_laboratorio el
JOIN atencion a ON el.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-87654321' AND el.tipo_examen = 'Hemograma Completo'
  AND NOT EXISTS (SELECT 1 FROM resultado_laboratorio rl WHERE rl.examen_id = el.id)
ON CONFLICT (examen_id) DO NOTHING;

-- 9.8 Factura PENDIENTE
INSERT INTO factura (paciente_id, atencion_id, numero_factura, subtotal, impuesto, total, estado, usuario_id)
SELECT p.id, a.id,
       'FAC-' || to_char(CURRENT_DATE - INTERVAL '7 days', 'YYYYMMDD') || '-0001',
       50.00, 8.00, 58.00, 'PENDIENTE',
       (SELECT id FROM usuario WHERE username = 'fact_test')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-87654321'
  AND c.fecha = CURRENT_DATE - INTERVAL '7 days'
  AND NOT EXISTS (SELECT 1 FROM factura f WHERE f.atencion_id = a.id)
ON CONFLICT (numero_factura) DO NOTHING;

-- 9.9 Detalle factura
INSERT INTO detalle_factura (factura_id, descripcion, cantidad, precio_unitario, subtotal)
SELECT f.id, 'Consulta medica general - Cefalea tensional', 1, 50.00, 50.00
FROM factura f
WHERE f.numero_factura = 'FAC-' || to_char(CURRENT_DATE - INTERVAL '7 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_factura df WHERE df.factura_id = f.id
  );

-- ============================================
-- 10. RECORRIDO 2: Jose Hernandez — Emergencia + Hospitalizacion
-- ============================================
-- Cita URGENTE COMPLETADA -> Atencion EMERGENCIA -> Signos Vitales
-- -> Receta PARCIAL (Amoxicilina + Omeprazol)
-- -> Hospitalizacion ACTIVA (cama 201-A) -> Signos Vitales
-- -> Medicacion Administrada -> Cama OCUPADA
-- -> Examen SOLICITADO (pendiente)

-- 10.1 Cita urgente completada (hace 5 dias)
INSERT INTO cita (paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por)
SELECT p.id, m.id, CURRENT_DATE - INTERVAL '5 days', '14:00'::TIME,
       'COMPLETADA', 'EMERGENCIA', 'URGENTE', 'Fiebre alta y dificultad para respirar desde hace 3 dias',
       (SELECT id FROM usuario WHERE username = 'adm_test')
FROM paciente p, medico m
WHERE p.ci = 'V-25123456' AND m.ci = 'V-11111111'
  AND NOT EXISTS (
    SELECT 1 FROM cita c
    WHERE c.paciente_id = p.id AND c.medico_id = m.id
      AND c.fecha = CURRENT_DATE - INTERVAL '5 days' AND c.hora = '14:00'::TIME
  );

-- 10.2 Atencion de emergencia
INSERT INTO atencion (historial_id, medico_id, cita_id, fecha_atencion, motivo_consulta, diagnostico, tratamiento, tipo)
SELECT hc.id, m.id, c.id, NOW() - INTERVAL '5 days',
       'Fiebre alta (39.2C) y dificultad respiratoria desde hace 3 dias',
       'Neumonia adquirida en comunidad',
       'Amoxicilina 500mg c/8h x 10d + Omeprazol 20mg c/24h x 10d',
       'EMERGENCIA'
FROM paciente p
JOIN historial_clinico hc ON hc.paciente_id = p.id
JOIN medico m ON m.ci = 'V-11111111'
JOIN cita c ON c.paciente_id = p.id AND c.medico_id = m.id
  AND c.fecha = CURRENT_DATE - INTERVAL '5 days' AND c.hora = '14:00'::TIME
WHERE p.ci = 'V-25123456'
  AND NOT EXISTS (SELECT 1 FROM atencion a WHERE a.cita_id = c.id);

-- 10.3 Signos vitales durante la emergencia
INSERT INTO signos_vitales (atencion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
SELECT a.id, e.id, NOW() - INTERVAL '5 days',
       39.2, 135, 88, 102, 24, 93.0, 82.00, 175.00
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medico m ON c.medico_id = m.id
JOIN enfermera e ON e.ci = 'V-30111222'
WHERE p.ci = 'V-25123456' AND m.ci = 'V-11111111'
  AND c.fecha = CURRENT_DATE - INTERVAL '5 days' AND c.hora = '14:00'::TIME
  AND NOT EXISTS (
    SELECT 1 FROM signos_vitales sv WHERE sv.atencion_id = a.id AND sv.enfermera_id = e.id
  );

-- 10.4 Receta PARCIAL (solo Amoxicilina dispensada)
INSERT INTO receta (atencion_id, medico_id, fecha_emision, codigo_receta, estado, dispensado_por)
SELECT a.id, m.id, NOW() - INTERVAL '5 days',
       'REC-' || to_char(CURRENT_DATE - INTERVAL '5 days', 'YYYYMMDD') || '-0001',
       'PARCIAL',
       (SELECT id FROM usuario WHERE username = 'V-20111222')
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medico m ON c.medico_id = m.id
WHERE p.ci = 'V-25123456' AND m.ci = 'V-11111111'
  AND c.fecha = CURRENT_DATE - INTERVAL '5 days'
  AND NOT EXISTS (SELECT 1 FROM receta r WHERE r.atencion_id = a.id)
ON CONFLICT (codigo_receta) DO NOTHING;

-- 10.5 Detalle receta: Amoxicilina 500mg x30
INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones)
SELECT r.id, med.id, '500mg', 'Cada 8 horas', '10 dias', 30,
       'Tomar 1 capsula cada 8 horas con alimentos'
FROM receta r
JOIN atencion a ON r.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medicamento med ON med.nombre = 'Amoxicilina'
WHERE p.ci = 'V-25123456'
  AND r.codigo_receta = 'REC-' || to_char(CURRENT_DATE - INTERVAL '5 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_receta dr WHERE dr.receta_id = r.id AND dr.medicamento_id = med.id
  );

-- 10.6 Detalle receta: Omeprazol 20mg x10 (no dispensado)
INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones)
SELECT r.id, med.id, '20mg', 'Cada 24 horas', '10 dias', 10,
       'Tomar 1 capsula en ayunas, 30 minutos antes del desayuno'
FROM receta r
JOIN atencion a ON r.atencion_id = a.id
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
JOIN medicamento med ON med.nombre = 'Omeprazol'
WHERE p.ci = 'V-25123456'
  AND r.codigo_receta = 'REC-' || to_char(CURRENT_DATE - INTERVAL '5 days', 'YYYYMMDD') || '-0001'
  AND NOT EXISTS (
    SELECT 1 FROM detalle_receta dr WHERE dr.receta_id = r.id AND dr.medicamento_id = med.id
  );

-- 10.7 Examen SOLICITADO (pendiente de tomar)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud)
SELECT a.id, 'Quimica Sanguinea', 'SOLICITADO',
       'Control de glucosa y perfil lipidico'
FROM atencion a
JOIN cita c ON a.cita_id = c.id
JOIN paciente p ON c.paciente_id = p.id
WHERE p.ci = 'V-25123456'
  AND c.fecha = CURRENT_DATE - INTERVAL '5 days'
  AND NOT EXISTS (
    SELECT 1 FROM examen_laboratorio el
    WHERE el.atencion_id = a.id AND el.tipo_examen = 'Quimica Sanguinea'
  );

-- 10.8 Hospitalizacion ACTIVA (cama 201-A)
INSERT INTO hospitalizacion (paciente_id, medico_id, cama_id, atencion_id, fecha_ingreso, diagnostico_ingreso, estado)
SELECT p.id, m.id, cam.id, a.id,
       NOW() - INTERVAL '3 days',
       'Neumonia adquirida en comunidad — dificultad respiratoria persistente a pesar de antibioticoterapia oral',
       'ACTIVA'
FROM paciente p
JOIN medico m ON m.ci = 'V-11111111'
JOIN atencion a ON a.medico_id = m.id
JOIN cita c ON a.cita_id = c.id AND c.paciente_id = p.id
JOIN cama cam ON cam.numero_cama = '201-A'
WHERE p.ci = 'V-25123456'
  AND c.fecha = CURRENT_DATE - INTERVAL '5 days'
  AND NOT EXISTS (
    SELECT 1 FROM hospitalizacion h WHERE h.paciente_id = p.id AND h.estado = 'ACTIVA'
  );

-- 10.9 Cama 201-A -> OCUPADA
UPDATE cama SET estado = 'OCUPADA'
WHERE numero_cama = '201-A'
  AND EXISTS (
    SELECT 1 FROM hospitalizacion h
    JOIN cama c ON c.id = h.cama_id
    WHERE c.numero_cama = '201-A' AND h.estado = 'ACTIVA'
  )
  AND estado != 'OCUPADA';

-- 10.10 Signos vitales durante hospitalizacion (dia 2: aun enfermo)
INSERT INTO signos_vitales (hospitalizacion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
SELECT h.id, e.id, NOW() - INTERVAL '2 days',
       38.5, 130, 85, 95, 22, 94.0, 82.00, 175.00
FROM hospitalizacion h
JOIN paciente p ON h.paciente_id = p.id
JOIN enfermera e ON e.ci = 'V-30111222'
WHERE p.ci = 'V-25123456' AND h.estado = 'ACTIVA'
  AND NOT EXISTS (
    SELECT 1 FROM signos_vitales sv
    WHERE sv.hospitalizacion_id = h.id
      AND sv.fecha_hora::date = (NOW() - INTERVAL '2 days')::date
  );

-- 10.11 Signos vitales durante hospitalizacion (dia 3: mejorando)
INSERT INTO signos_vitales (hospitalizacion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
SELECT h.id, e.id, NOW() - INTERVAL '1 day',
       37.2, 122, 78, 82, 18, 97.0, 82.00, 175.00
FROM hospitalizacion h
JOIN paciente p ON h.paciente_id = p.id
JOIN enfermera e ON e.ci = 'V-30111222'
WHERE p.ci = 'V-25123456' AND h.estado = 'ACTIVA'
  AND NOT EXISTS (
    SELECT 1 FROM signos_vitales sv
    WHERE sv.hospitalizacion_id = h.id
      AND sv.fecha_hora::date = (NOW() - INTERVAL '1 day')::date
  );

-- 10.12 Medicion administrada: Amoxicilina IV
INSERT INTO medicacion_administrada (hospitalizacion_id, enfermera_id, medicamento_id, dosis, fecha_hora, observaciones)
SELECT h.id, e.id, med.id, '500mg cada 8 horas via oral',
       NOW() - INTERVAL '2 days',
       'Primera dosis hospitalaria — neumonia adquirida en comunidad'
FROM hospitalizacion h
JOIN paciente p ON h.paciente_id = p.id
JOIN enfermera e ON e.ci = 'V-30111222'
JOIN medicamento med ON med.nombre = 'Amoxicilina'
WHERE p.ci = 'V-25123456' AND h.estado = 'ACTIVA'
  AND NOT EXISTS (
    SELECT 1 FROM medicacion_administrada ma
    WHERE ma.hospitalizacion_id = h.id AND ma.medicamento_id = med.id
  );

-- ============================================
-- 11. NOTIFICACIONES
-- ============================================

-- Notificacion de cita completada para Maria Garcia (ya enviada)
INSERT INTO notificacion (paciente_id, cita_id, tipo, asunto, mensaje, estado, creado_en)
SELECT p.id, c.id, 'CITA', 'Cita completada',
       'Su cita con Dr. Carlos Rodriguez ha sido completada. Diagnostico: Cefalea tensional.',
       'ENVIADA', NOW() - INTERVAL '6 days'
FROM paciente p
JOIN cita c ON c.paciente_id = p.id
WHERE p.ci = 'V-87654321'
  AND c.fecha = CURRENT_DATE - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM notificacion n
    WHERE n.paciente_id = p.id AND n.cita_id = c.id AND n.tipo = 'CITA'
  );

-- Alerta de stock bajo (pendiente, para todos los farmaceuticos)
INSERT INTO notificacion (tipo, asunto, mensaje, rol_destino, estado, creado_en)
SELECT 'STOCK_BAJO', 'Stock bajo: Ibuprofeno',
       'El lote IBU-2024-A tiene 8 unidades (minimo: 20). Se requiere reposicion urgente.',
       'FARMACEUTICO', 'PENDIENTE', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM notificacion n
  WHERE n.tipo = 'STOCK_BAJO' AND n.rol_destino = 'FARMACEUTICO'
    AND n.asunto = 'Stock bajo: Ibuprofeno'
);

-- Notificacion de hospitalizacion activa para medicos (pendiente)
INSERT INTO notificacion (paciente_id, medico_id, tipo, asunto, mensaje, rol_destino, estado, creado_en)
SELECT p.id, h.medico_id, 'HOSPITALIZACION', 'Hospitalizacion activa',
       'El paciente Jose Hernandez se encuentra hospitalizado desde hace 3 dias. Evaluacion de alta pendiente.',
       'MEDICO', 'PENDIENTE', NOW()
FROM hospitalizacion h
JOIN paciente p ON h.paciente_id = p.id
WHERE p.ci = 'V-25123456' AND h.estado = 'ACTIVA'
  AND NOT EXISTS (
    SELECT 1 FROM notificacion n
    WHERE n.paciente_id = p.id AND n.tipo = 'HOSPITALIZACION' AND n.rol_destino = 'MEDICO'
  );
