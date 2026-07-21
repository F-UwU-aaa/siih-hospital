-- Migración: Agregar HISTORIAL:READ, HISTORIAL:WRITE y ATENCION:READ al rol ADMISIONISTA
-- HISTORIAL:READ  — necesario para buscar pacientes existentes por CI
-- HISTORIAL:WRITE — necesario para registrar pacientes nuevos, editar y activar/desactivar
-- ATENCION:READ   — necesario para acceder a /atencion (confirmar llegada, sala de espera)

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'ADMISIONISTA'
  AND (
    (p.modulo = 'HISTORIAL' AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL' AND p.accion = 'WRITE')
    OR (p.modulo = 'ATENCION' AND p.accion = 'READ')
  );
