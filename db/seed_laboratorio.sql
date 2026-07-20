-- ============================================
-- SIIH - Seed de Laboratorio (Etapa 6)
-- Técnico + exámenes de prueba
-- ============================================

-- Técnico de Laboratorio (actor)
INSERT INTO tecnico_laboratorio (ci, nombre, apellido, telefono, email)
VALUES ('V-20150999', 'Pedro', 'Torres', '0414-5551234', 'pedro.torres@hospital.com');

-- Usuario vinculado al técnico, rol TECNICO_LAB
INSERT INTO usuario (username, password_hash, email, rol_id, tecnico_lab_id, creado_por)
VALUES ('lab_test', crypt('lab123', gen_salt('bf')), 'pedro.torres@hospital.com', 6, 1, 1);

-- Exámenes de prueba (atencion #1 = Juan Perez / Dr. Rodriguez medico_id=1)
-- atencion #2 = Maria Garcia / Dr. Rodriguez medico_id=1

-- Examen 1: SOLICITADO (pendiente de tomar)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud)
VALUES (1, 'Hemograma Completo', 'SOLICITADO', 'Sospecha de infeccion, solicitar hemograma completo');

-- Examen 2: SOLICITADO (pendiente de tomar)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud)
VALUES (2, 'Quimica Sanguinea', 'SOLICITADO', 'Control de glucosa y perfil lipidico');

-- Examen 3: EN_PROCESO (ya tomado por el tecnico, pendiente de resultado)
-- tecnico_id = 9 es el usuario_id de lab_test (insertado arriba)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud, tecnico_id)
VALUES (1, 'Uroanalisis', 'EN_PROCESO', 'Estudio de rutina', 9);

-- Examen 4: COMPLETADO con resultado (para verificar en historial)
INSERT INTO examen_laboratorio (atencion_id, tipo_examen, estado, observaciones_solicitud, tecnico_id)
VALUES (2, 'Examen General de Orina', 'COMPLETADO', 'Control rutinario', 9);

INSERT INTO resultado_laboratorio (examen_id, resultado, valores_referencia, observaciones, es_critico)
VALUES (4,
  'Proteinas +1, Glucosa negativa, Leucocitos 5-10/campo',
  'Proteinas negativa, Glucosa negativa, Leucocitos 0-5/campo',
  'Ligera proteinuria, sugiere seguimiento',
  FALSE
);
