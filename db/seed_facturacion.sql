-- Etapa 8: Facturacion — facturador user
-- (tarifa_servicio table is now in schema.sql)

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
