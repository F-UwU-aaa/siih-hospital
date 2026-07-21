-- Migración: Agregar FARMACIA:READ al rol ENFERMERA
-- Necesario para que ENFERMERA pueda cargar la lista de medicamentos
-- al registrar medicación en hospitalización.

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'ENFERMERA'
  AND p.modulo = 'FARMACIA' AND p.accion = 'READ';
