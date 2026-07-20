-- ============================================
-- SIIH - Seed de PERMISOS y ROL_PERMISO
-- Basado en la tabla de accesos por rol (sección 9)
-- ============================================

-- PERMISOS
INSERT INTO permiso (nombre, modulo, accion) VALUES
-- CITAS
('Citas - Consultar',     'CITAS',         'READ'),
('Citas - Gestionar',     'CITAS',         'WRITE'),
-- HISTORIAL CLÍNICO
('Historial - Consultar', 'HISTORIAL',     'READ'),
('Historial - Editar',    'HISTORIAL',     'WRITE'),
-- ATENCIÓN MÉDICA
('Atención - Consultar',  'ATENCION',      'READ'),
('Atención - Editar',     'ATENCION',      'WRITE'),
-- LABORATORIO
('Laboratorio - Consultar','LABORATORIO',  'READ'),
('Laboratorio - Gestionar','LABORATORIO',  'WRITE'),
-- FARMACIA
('Farmacia - Consultar',  'FARMACIA',      'READ'),
('Farmacia - Gestionar',  'FARMACIA',      'WRITE'),
-- HOSPITALIZACIÓN
('Hospitalización - Consultar', 'HOSPITALIZACION', 'READ'),
('Hospitalización - Gestionar', 'HOSPITALIZACION', 'WRITE'),
-- FACTURACIÓN
('Facturación - Consultar', 'FACTURACION', 'READ'),
('Facturación - Gestionar', 'FACTURACION', 'WRITE'),
-- COMPRAS
('Compras - Consultar',   'COMPRAS',       'READ'),
('Compras - Gestionar',   'COMPRAS',       'WRITE'),
-- REPORTES
('Reportes - Consultar',  'REPORTES',      'READ'),
-- SEGURIDAD (Usuarios/Roles)
('Seguridad - Consultar', 'SEGURIDAD',     'READ'),
('Seguridad - Gestionar', 'SEGURIDAD',     'WRITE'),
-- AUDITORÍA
('Auditoría - Consultar', 'AUDITORIA',     'READ'),
('Auditoría - Gestionar', 'AUDITORIA',     'WRITE');

-- ============================================
-- ROL_PERMISO — mapeo de la sección 9
-- ============================================

-- ADMIN: acceso total
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM rol r, permiso p
WHERE r.nombre = 'ADMIN';

-- DIRECTOR: R/W Citas, R Historial, R Atención, R/W Lab-procesar, R/W Farm-inv, R Hospital, R/W Facturación, R/W Compras, R Reportes, R Auditoría
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'DIRECTOR'
  AND (
    (p.modulo = 'CITAS' AND p.accion = 'READ')
    OR (p.modulo = 'CITAS' AND p.accion = 'WRITE')
    OR (p.modulo = 'HISTORIAL' AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION' AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO' AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO' AND p.accion = 'WRITE')
    OR (p.modulo = 'FARMACIA' AND p.accion = 'READ')
    OR (p.modulo = 'FARMACIA' AND p.accion = 'WRITE')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'WRITE')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'WRITE')
    OR (p.modulo = 'COMPRAS' AND p.accion = 'READ')
    OR (p.modulo = 'COMPRAS' AND p.accion = 'WRITE')
    OR (p.modulo = 'REPORTES' AND p.accion = 'READ')
    OR (p.modulo = 'AUDITORIA' AND p.accion = 'READ')
  );

-- MÉDICO: R Citas, R/W Historial, R/W Atención, W Lab-solicitar, R Lab-procesar, R Farm-inv
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'MEDICO'
  AND (
    (p.modulo = 'CITAS' AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL' AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL' AND p.accion = 'WRITE')
    OR (p.modulo = 'ATENCION' AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION' AND p.accion = 'WRITE')
    OR (p.modulo = 'LABORATORIO' AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO' AND p.accion = 'WRITE')
    OR (p.modulo = 'FARMACIA' AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'WRITE')
  );

-- ADMISIONISTA: R/W Citas, R Hospitalización
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'ADMISIONISTA'
  AND (
    (p.modulo = 'CITAS' AND p.accion = 'READ')
    OR (p.modulo = 'CITAS' AND p.accion = 'WRITE')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
  );

-- ENFERMERA: R Historial, R/W Atención (signos vitales), R Hospitalización
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'ENFERMERA'
  AND (
    (p.modulo = 'HISTORIAL' AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION' AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION' AND p.accion = 'WRITE')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'WRITE')
  );

-- FARMACÉUTICO: R/W Farmacia + R/W Compras
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'FARMACEUTICO'
  AND (
    (p.modulo = 'FARMACIA' AND p.accion = 'READ')
    OR (p.modulo = 'FARMACIA' AND p.accion = 'WRITE')
    OR (p.modulo = 'COMPRAS' AND p.accion = 'READ')
    OR (p.modulo = 'COMPRAS' AND p.accion = 'WRITE')
  );

-- TÉCNICO LAB: R/W Laboratorio
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'TECNICO_LAB'
  AND (
    (p.modulo = 'LABORATORIO' AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO' AND p.accion = 'WRITE')
  );

-- FACTURADOR: R/W Facturación
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'FACTURADOR'
  AND (
    (p.modulo = 'FACTURACION' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'WRITE')
  );

-- PACIENTE: R/W Citas (propias), R Historial (propio), R Farmacia (disponibilidad)
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'PACIENTE'
  AND (
    (p.modulo = 'CITAS' AND p.accion = 'READ')
    OR (p.modulo = 'CITAS' AND p.accion = 'WRITE')
    OR (p.modulo = 'HISTORIAL' AND p.accion = 'READ')
    OR (p.modulo = 'FARMACIA' AND p.accion = 'READ')
  );
