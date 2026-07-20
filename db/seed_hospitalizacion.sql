-- ============================================
-- SIIH - Seed de Hospitalizacion (Etapa 7)
-- Enfermeras, camas, hospitalizacion de prueba
-- ============================================

-- 2 Enfermeras (actores)
INSERT INTO enfermera (ci, nombre, apellido, turno, telefono)
VALUES
  ('V-30111222', 'Ana', 'Martinez', 'MANANA', '0414-1112233'),
  ('V-30222333', 'Lucia', 'Hernandez', 'TARDE', '0414-2223344');

-- Usuarios vinculados, rol ENFERMERA
INSERT INTO usuario (username, password_hash, email, rol_id, enfermera_id, creado_por)
VALUES
  ('nurse_test', crypt('nurse123', gen_salt('bf')), 'ana.martinez@hospital.com', 4, 1, 1),
  ('nurse2_test', crypt('nurse123', gen_salt('bf')), 'lucia.hernandez@hospital.com', 4, 2, 1);

-- 8 camas adicionales (ya existen 3: 101-A, 101-B, UCI-01)
INSERT INTO cama (numero_cama, piso, sala, tipo, estado) VALUES
  ('201-A', '2', 'Pediatria',   'PEDIATRIA',  'DISPONIBLE'),
  ('201-B', '2', 'Pediatria',   'PEDIATRIA',  'DISPONIBLE'),
  ('301-A', '3', 'Maternidad',  'MATERNIDAD', 'DISPONIBLE'),
  ('301-B', '3', 'Maternidad',  'MATERNIDAD', 'DISPONIBLE'),
  ('401-A', '4', 'Cirugia',     'CIRUGIA',    'DISPONIBLE'),
  ('401-B', '4', 'Cirugia',     'CIRUGIA',    'DISPONIBLE'),
  ('501-A', '5', 'UCI',         'UCI',        'DISPONIBLE'),
  ('501-B', '5', 'UCI',         'UCI',        'DISPONIBLE');

-- ============================================
-- Hospitalizacion de prueba:
-- Juan Perez (paciente_id=3) hospitalizado en UCI-01
-- desde atencion #1 (medico_id=1 / dr_test)
-- ============================================
INSERT INTO hospitalizacion
  (paciente_id, medico_id, cama_id, atencion_id, fecha_ingreso, diagnostico_ingreso, estado)
VALUES
  (3, 1, 3, 1, NOW() - INTERVAL '3 days', 'Neumonia severa - dificultad respiratoria', 'ACTIVA');

-- Cama UCI-01 pasa a OCUPADA
UPDATE cama SET estado = 'OCUPADA' WHERE id = 3;

-- 2 registros de signos vitales durante esta hospitalizacion
INSERT INTO signos_vitales
  (hospitalizacion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla)
VALUES
  (1, 1, NOW() - INTERVAL '2 days', 38.5, 130, 85, 95, 22, 94.0, 78.50, 172.00),
  (1, 1, NOW() - INTERVAL '1 day',  37.8, 125, 80, 88, 20, 96.5, 78.50, 172.00);

-- 1 medicion administrada: Amoxicilina (inventario id=5, lote AMOX-2024-A, 100 unidades)
-- FEFO: descontamos 10 unidades
INSERT INTO medicacion_administrada
  (hospitalizacion_id, enfermera_id, medicamento_id, dosis, fecha_hora, observaciones)
VALUES
  (1, 1, 5, '500mg cada 8 horas', NOW() - INTERVAL '2 days', 'Primera dosis - tratamiento neumonia');

-- Descontar del inventario (FEFO)
UPDATE inventario SET cantidad = 90 WHERE id = 5;
