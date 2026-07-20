-- ============================================
-- SIIH - Seed de Farmacia (Etapa 5)
-- Medicamentos, proveedores, inventario, farmacéuticos
-- Ejecutar después de schema.sql y seed_permisos.sql
-- ============================================

-- ============================================
-- 1. MEDICAMENTOS (10)
-- ============================================
INSERT INTO medicamento (nombre, principio_activo, presentacion, concentracion, laboratorio) VALUES
('Paracetamol',     'Paracetamol',       'Comprimido',   '500mg',   'Laboratorios Venezolados'),
('Ibuprofeno',      'Ibuprofeno',        'Comprimido',   '400mg',   'Laboratorios Venezolados'),
('Amoxicilina',     'Amoxicilina',       'Cápsula',      '500mg',   'Distribuidora Farmacéutica SA'),
('Metformina',      'Clorhidrato de metformina', 'Comprimido', '850mg', 'Importadora Médica CA'),
('Omeprazol',       'Omeprazol',         'Cápsula',      '20mg',    'Laboratorios Venezolados'),
('Losartan',        'Potasio de losartán', 'Comprimido', '50mg',    'Importadora Médica CA'),
('Prednisona',      'Prednisona',        'Comprimido',   '5mg',     'Distribuidora Farmacéutica SA'),
('Naproxeno',       'Naproxeno sódico',  'Comprimido',   '250mg',   'Laboratorios Venezolados'),
('Diclofenaco',     'Diclofenaco sódico', 'Comprimido',  '50mg',    'Importadora Médica CA'),
('Azitromicina',    'Azitromicina',      'Comprimido',   '500mg',   'Distribuidora Farmacéutica SA');

-- ============================================
-- 2. PROVEEDORES (3)
-- ============================================
INSERT INTO proveedor (nombre, ruc, direccion, telefono, email) VALUES
('Distribuidora Farmacéutica SA', 'J-40123456-7', 'Av. Principal, Edif. 5, Caracas',  '+58-212-5551234', 'ventas@disfarmaca.ve'),
('Laboratorios Venezolados',      'J-40987654-3', 'Zona Industrial, Nave 12, Valencia','+58-241-5559876', 'pedidos@labven.ve'),
('Importadora Médica CA',         'J-40555111-9', 'Av. Libertador, Torre 3, Maracaibo','+58-261-5554321', 'compras@imedica.ve');

-- ============================================
-- 3. FARMACÉUTICOS (3) + USUARIOS
-- ============================================
INSERT INTO farmaceutico (ci, nombre, apellido, telefono, email) VALUES
('V-20111222', 'Pedro',   'Rodríguez', '+58-412-5551111', 'pedro.rodriguez@hospital.com'),
('V-20333444', 'Laura',   'Fernández', '+58-414-5552222', 'laura.fernandez@hospital.com'),
('V-20555666', 'Carlos',  'Mendoza',   '+58-416-5553333', 'carlos.mendoza@hospital.com');

-- Crear usuarios farmacéuticos (rol FARMACEUTICO = id 5)
INSERT INTO usuario (username, password_hash, rol_id, farmaceutico_id, creado_por, activo)
SELECT
  f.ci,
  crypt('farm123', gen_salt('bf')),
  (SELECT id FROM rol WHERE nombre = 'FARMACEUTICO'),
  f.id,
  (SELECT id FROM usuario WHERE username = 'admin'),
  TRUE
FROM farmaceutico f;

-- ============================================
-- 4. INVENTARIO — lotes con diferentes escenarios de prueba
-- ============================================
-- Cada medicamento tiene al menos un lote.
-- Escenarios clave:
--   - Lote con stock BAJO (<= stock_minimo) para test RN-06
--   - Lote PRÓXIMO A VENCER (< 30 días) para test alerta
--   - Lote VENCIDO para test exclusion en FEFO
--   - Lote con stock SUFICIENTE para dispensación completa
--   - Lote con stock INSUFICIENTE para dispensación parcial
-- ============================================

-- Paracetamol: lote bueno + lote vencido (no debe usarse en FEFO)
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(1, 'PARA-2024-A', 200, 50, '2027-06-15', 'Estante A1', 0.50),
(1, 'PARA-2023-B', 30,  50, '2025-12-01', 'Estante A1', 0.45);

-- Ibuprofeno: stock bajo (para alerta RN-06) + lote bueno
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(2, 'IBU-2024-A', 8,  20, '2027-03-20', 'Estante A2', 0.75),
(2, 'IBU-2024-B', 150, 20, '2027-09-10', 'Estante A2', 0.80);

-- Amoxicilina: stock suficiente
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(3, 'AMOX-2024-A', 100, 30, '2027-01-15', 'Estante B1', 1.20);

-- Metformina: stock bajo
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(4, 'METF-2024-A', 12, 25, '2027-08-20', 'Estante B2', 1.50);

-- Omeprazol: lote pronto a vencer (< 30 días desde hoy)
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(5, 'OMEP-2024-A', 80, 20, CURRENT_DATE + INTERVAL '15 days', 'Estante C1', 1.00),
(5, 'OMEP-2023-B', 50, 20, '2026-11-30', 'Estante C1', 0.90);

-- Losartan: stock normal
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(6, 'LOSA-2024-A', 60, 15, '2027-05-10', 'Estante C2', 2.00);

-- Prednisona: lote vencido (no dispensar)
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(7, 'PRED-2023-A', 40, 10, '2025-10-01', 'Estante D1', 0.60),
(7, 'PRED-2024-A', 90, 10, '2027-12-20', 'Estante D1', 0.65);

-- Naproxeno: sin stock (para test NO DISPONIBLE)
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(9, 'DICL-2024-A', 0, 15, '2027-07-15', 'Estante E1', 0.90);

-- Azitromicina: stock normal
INSERT INTO inventario (medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) VALUES
(10, 'AZIT-2024-A', 75, 20, '2027-04-01', 'Estante E2', 3.00);

-- ============================================
-- 5. RECETAS DE PRUEBA (EMITIDAS para test dispensación)
-- ============================================
-- Receta #1: Atención #1 (ya completada, paciente Maria Garcia)
--   Paracetamol 500mg x 20 comprimidos — FEFO debe usar PARA-2024-A (vence 2027-06-15)
-- Receta #2: Atención #2 (ya completada, paciente temporal)
--   Ibuprofeno 400mg x 50 comprimidos — stock insuficiente (8 en lote bajo)
-- ============================================
INSERT INTO receta (atencion_id, medico_id, fecha_emision, codigo_receta, estado) VALUES
(1, 1, NOW(), 'REC-20260720-0001', 'EMITIDA'),
(2, 1, NOW(), 'REC-20260720-0002', 'EMITIDA');

-- Detalle receta #1
INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones) VALUES
(1, 1, '500mg', 'Cada 8 horas', '7 días', 20, 'Tomar 1 comprimido cada 8 horas con alimentos');

-- Detalle receta #2
INSERT INTO detalle_receta (receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones) VALUES
(2, 2, '400mg', 'Cada 12 horas', '5 días', 50, 'Tomar 1 comprimido cada 12 horas después de comer');
