-- ============================================
-- SIIH - Seed de MÉDICOS de ejemplo
-- Ejecutar después de schema.sql y seed_permisos.sql
-- ============================================

INSERT INTO medico (ci, nombre, apellido, especialidad, telefono, email, horario_atencion) VALUES
('V-11111111', 'Carlos', 'Rodriguez', 'Medicina General', '0412-1234567', 'carlos.rodriguez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}'),
('V-22222222', 'Maria', 'Gonzalez', 'Pediatria', '0412-2345678', 'maria.gonzalez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}'),
('V-33333333', 'Roberto', 'Martinez', 'Cardiologia', '0412-3456789', 'roberto.martinez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}'),
('V-44444444', 'Ana', 'Lopez', 'Ginecologia', '0412-4567890', 'ana.lopez@siih.hospital',
 E'{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}')
ON CONFLICT (ci) DO NOTHING;
