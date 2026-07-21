-- ============================================
-- SIIH - Seed de PERMISOS y ROL_PERMISO
-- Basado en la tabla de accesos por rol (sección 9)
-- ============================================

-- PERMISOS
INSERT INTO permiso (nombre, modulo, accion) VALUES
-- PACIENTES (datos demográficos, registro de pacientes — dominio de admisión, no clínico)
('Pacientes - Consultar', 'PACIENTES',     'READ'),
('Pacientes - Registrar', 'PACIENTES',     'WRITE'),
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

-- DIRECTOR: R Pacientes, R Citas, R Historial, R Atención, R Lab, R Farmacia, R Hospital, R/W Facturación, R/W Compras, R Reportes, R Auditoría
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'DIRECTOR'
  AND (
    (p.modulo = 'PACIENTES' AND p.accion = 'READ')
    OR (p.modulo = 'CITAS' AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL' AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION' AND p.accion = 'READ')
    OR (p.modulo = 'LABORATORIO' AND p.accion = 'READ')
    OR (p.modulo = 'FARMACIA' AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'WRITE')
    OR (p.modulo = 'COMPRAS' AND p.accion = 'READ')
    OR (p.modulo = 'COMPRAS' AND p.accion = 'WRITE')
    OR (p.modulo = 'REPORTES' AND p.accion = 'READ')
    OR (p.modulo = 'AUDITORIA' AND p.accion = 'READ')
  );

-- MÉDICO: R Pacientes, R Citas, R/W Historial, R/W Atención, W Lab-solicitar, R Lab-procesar, R Farm-inv
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'MEDICO'
  AND (
    (p.modulo = 'PACIENTES' AND p.accion = 'READ')
    OR (p.modulo = 'CITAS' AND p.accion = 'READ')
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

-- ADMISIONISTA: R/W Pacientes, R/W Citas, R Hospitalización
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'ADMISIONISTA'
  AND (
    (p.modulo = 'PACIENTES' AND p.accion = 'READ')
    OR (p.modulo = 'PACIENTES' AND p.accion = 'WRITE')
    OR (p.modulo = 'CITAS' AND p.accion = 'READ')
    OR (p.modulo = 'CITAS' AND p.accion = 'WRITE')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
  );

-- ENFERMERA: R Pacientes, R Historial, R/W Atención (signos vitales), R Hospitalización, R Farmacia (listar medicamentos)
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'ENFERMERA'
  AND (
    (p.modulo = 'PACIENTES' AND p.accion = 'READ')
    OR (p.modulo = 'HISTORIAL' AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION' AND p.accion = 'READ')
    OR (p.modulo = 'ATENCION' AND p.accion = 'WRITE')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'READ')
    OR (p.modulo = 'HOSPITALIZACION' AND p.accion = 'WRITE')
    OR (p.modulo = 'FARMACIA' AND p.accion = 'READ')
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

-- FACTURADOR: R Pacientes (para identificar al paciente en la factura), R/W Facturación
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'FACTURADOR'
  AND (
    (p.modulo = 'PACIENTES' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'WRITE')
  );

-- PACIENTE: R Pacientes (propio), R/W Citas (propias), R Historial (propio), R Farmacia (disponibilidad), R Facturación (propias)
-- El scope "solo los propios" se refuerza en la capa de aplicación, no solo en permisos.
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r, permiso p
WHERE r.nombre = 'PACIENTE'
  AND (
    (p.modulo = 'PACIENTES' AND p.accion = 'READ')
    OR (p.modulo = 'CITAS' AND p.accion = 'READ')
    OR (p.modulo = 'CITAS' AND p.accion = 'WRITE')
    OR (p.modulo = 'HISTORIAL' AND p.accion = 'READ')
    OR (p.modulo = 'FARMACIA' AND p.accion = 'READ')
    OR (p.modulo = 'FACTURACION' AND p.accion = 'READ')
  );
