-- Etapa 8: Facturacion — tarifa_servicio + facturador user

-- Tabla de tarifas
CREATE TABLE IF NOT EXISTS tarifa_servicio (
  id SERIAL PRIMARY KEY,
  tipo_servicio VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

-- Tarifas base
INSERT INTO tarifa_servicio (tipo_servicio, descripcion, precio_unitario) VALUES
  ('CONSULTA', 'Consulta medica general', 50.00),
  ('EMERGENCIA', 'Atencion de emergencia', 150.00),
  ('EXAMEN_LABORATORIO', 'Examen de laboratorio (por examen)', 30.00),
  ('HOSPITALIZACION_DIA', 'Dia de hospitalizacion', 200.00)
ON CONFLICT (tipo_servicio) DO NOTHING;

-- Facturador staff record
INSERT INTO facturador (ci, nombre, apellido, telefono, email)
VALUES ('V-30000000', 'Maria Lopez', 'Garcia', '0412-1234567', 'maria.lopez@hospital.com')
ON CONFLICT (ci) DO NOTHING;

-- Facturador user account (password: fact123)
INSERT INTO usuario (username, password_hash, rol_id, activo, facturador_id, email, creado_por)
SELECT 'fact_test',
       crypt('fact123', gen_salt('bf')),
       (SELECT id FROM rol WHERE nombre = 'FACTURADOR'),
       TRUE,
       (SELECT id FROM facturador WHERE ci = 'V-30000000'),
       'maria.lopez@hospital.com',
       1
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'fact_test');
