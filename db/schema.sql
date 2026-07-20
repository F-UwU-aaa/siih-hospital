-- ============================================
-- SIIH - Schema completo (33 tablas)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE rol (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT
);

CREATE TABLE permiso (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  modulo VARCHAR(50),
  accion VARCHAR(20)
);

CREATE TABLE rol_permiso (
  rol_id INTEGER NOT NULL REFERENCES rol(id),
  permiso_id INTEGER NOT NULL REFERENCES permiso(id),
  PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE medico (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  horario_atencion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE enfermera (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  turno VARCHAR(20),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE farmaceutico (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE tecnico_laboratorio (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE admisionista (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE facturador (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE paciente (
  id SERIAL PRIMARY KEY,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo CHAR(1),
  direccion VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(100),
  seguro_medico VARCHAR(100),
  registrado_por INTEGER,
  huella_dactilar_ref TEXT,
  foto_rostro_ref TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  ultimo_acceso TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  creado_por INTEGER REFERENCES usuario(id),
  rol_id INTEGER NOT NULL REFERENCES rol(id),
  paciente_id INTEGER REFERENCES paciente(id),
  medico_id INTEGER REFERENCES medico(id),
  enfermera_id INTEGER REFERENCES enfermera(id),
  farmaceutico_id INTEGER REFERENCES farmaceutico(id),
  tecnico_lab_id INTEGER REFERENCES tecnico_laboratorio(id),
  admisionista_id INTEGER REFERENCES admisionista(id),
  facturador_id INTEGER REFERENCES facturador(id)
);

ALTER TABLE paciente
  ADD CONSTRAINT fk_paciente_registrado_por
  FOREIGN KEY (registrado_por) REFERENCES usuario(id);

CREATE TABLE historial_clinico (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER UNIQUE NOT NULL REFERENCES paciente(id)
);

CREATE TABLE cita (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES paciente(id),
  medico_id INTEGER NOT NULL REFERENCES medico(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  tipo VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  prioridad VARCHAR(20) DEFAULT 'NORMAL',
  motivo TEXT,
  creado_por INTEGER REFERENCES usuario(id)
);

CREATE TABLE alergia (
  id SERIAL PRIMARY KEY,
  historial_id INTEGER NOT NULL REFERENCES historial_clinico(id),
  sustancia VARCHAR(200) NOT NULL,
  reaccion TEXT,
  severidad VARCHAR(20),
  usuario_id INTEGER REFERENCES usuario(id),
  fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE antecedente (
  id SERIAL PRIMARY KEY,
  historial_id INTEGER NOT NULL REFERENCES historial_clinico(id),
  tipo VARCHAR(50),
  descripcion TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuario(id),
  fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE atencion (
  id SERIAL PRIMARY KEY,
  historial_id INTEGER NOT NULL REFERENCES historial_clinico(id),
  medico_id INTEGER NOT NULL REFERENCES medico(id),
  cita_id INTEGER REFERENCES cita(id),
  fecha_atencion TIMESTAMP NOT NULL DEFAULT NOW(),
  motivo_consulta TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  observaciones TEXT,
  tipo VARCHAR(20) DEFAULT 'CONSULTA'
);

CREATE TABLE cama (
  id SERIAL PRIMARY KEY,
  numero_cama VARCHAR(20) UNIQUE NOT NULL,
  piso VARCHAR(20),
  sala VARCHAR(100),
  tipo VARCHAR(50),
  estado VARCHAR(30) DEFAULT 'DISPONIBLE'
);

CREATE TABLE hospitalizacion (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES paciente(id),
  medico_id INTEGER NOT NULL REFERENCES medico(id),
  cama_id INTEGER NOT NULL REFERENCES cama(id),
  atencion_id INTEGER REFERENCES atencion(id),
  fecha_ingreso TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_alta TIMESTAMP,
  diagnostico_ingreso TEXT,
  diagnostico_alta TEXT,
  estado VARCHAR(20) DEFAULT 'ACTIVA'
);

CREATE TABLE signos_vitales (
  id SERIAL PRIMARY KEY,
  atencion_id INTEGER REFERENCES atencion(id),
  hospitalizacion_id INTEGER REFERENCES hospitalizacion(id),
  enfermera_id INTEGER REFERENCES enfermera(id),
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  temperatura DECIMAL(4,1),
  presion_sistolica INTEGER,
  presion_diastolica INTEGER,
  frecuencia_cardiaca INTEGER,
  frecuencia_resp INTEGER,
  saturacion_oxigeno DECIMAL(4,1),
  peso DECIMAL(5,2),
  talla DECIMAL(5,2),
  CONSTRAINT chk_signos_origen CHECK (atencion_id IS NOT NULL OR hospitalizacion_id IS NOT NULL)
);

CREATE TABLE medicamento (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  principio_activo VARCHAR(200),
  presentacion VARCHAR(100),
  concentracion VARCHAR(100),
  laboratorio VARCHAR(200),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE receta (
  id SERIAL PRIMARY KEY,
  atencion_id INTEGER NOT NULL REFERENCES atencion(id),
  medico_id INTEGER NOT NULL REFERENCES medico(id),
  fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
  codigo_receta VARCHAR(50) UNIQUE NOT NULL,
  estado VARCHAR(20) DEFAULT 'EMITIDA',
  dispensado_por INTEGER REFERENCES usuario(id)
);

CREATE TABLE detalle_receta (
  id SERIAL PRIMARY KEY,
  receta_id INTEGER NOT NULL REFERENCES receta(id),
  medicamento_id INTEGER NOT NULL REFERENCES medicamento(id),
  dosis VARCHAR(100),
  frecuencia VARCHAR(100),
  duracion VARCHAR(100),
  cantidad INTEGER NOT NULL,
  indicaciones TEXT
);

CREATE TABLE inventario (
  id SERIAL PRIMARY KEY,
  medicamento_id INTEGER NOT NULL REFERENCES medicamento(id),
  lote VARCHAR(100) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 10,
  fecha_vencimiento DATE NOT NULL,
  ubicacion VARCHAR(100),
  precio_unitario DECIMAL(10,2)
);

CREATE TABLE medicacion_administrada (
  id SERIAL PRIMARY KEY,
  hospitalizacion_id INTEGER NOT NULL REFERENCES hospitalizacion(id),
  enfermera_id INTEGER NOT NULL REFERENCES enfermera(id),
  medicamento_id INTEGER NOT NULL REFERENCES medicamento(id),
  dosis VARCHAR(100),
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  observaciones TEXT
);

CREATE TABLE examen_laboratorio (
  id SERIAL PRIMARY KEY,
  atencion_id INTEGER NOT NULL REFERENCES atencion(id),
  tipo_examen VARCHAR(200) NOT NULL,
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
  estado VARCHAR(30) DEFAULT 'SOLICITADO',
  observaciones_solicitud TEXT,
  tecnico_id INTEGER REFERENCES usuario(id)
);

CREATE TABLE resultado_laboratorio (
  id SERIAL PRIMARY KEY,
  examen_id INTEGER UNIQUE NOT NULL REFERENCES examen_laboratorio(id),
  resultado TEXT NOT NULL,
  valores_referencia TEXT,
  observaciones TEXT,
  fecha_resultado TIMESTAMP NOT NULL DEFAULT NOW(),
  es_critico BOOLEAN DEFAULT FALSE
);

CREATE TABLE factura (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES paciente(id),
  atencion_id INTEGER REFERENCES atencion(id),
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
  subtotal DECIMAL(12,2) NOT NULL,
  impuesto DECIMAL(12,2) DEFAULT 0,
  descuento DECIMAL(12,2) DEFAULT 0,
  cobertura_seguro DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  tipo_pago VARCHAR(30),
  usuario_id INTEGER NOT NULL REFERENCES usuario(id)
);

CREATE TABLE detalle_factura (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER NOT NULL REFERENCES factura(id),
  descripcion VARCHAR(255) NOT NULL,
  cantidad INTEGER DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);

CREATE TABLE proveedor (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  ruc VARCHAR(50) UNIQUE,
  direccion VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE compra (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER NOT NULL REFERENCES proveedor(id),
  fecha_compra TIMESTAMP NOT NULL DEFAULT NOW(),
  total DECIMAL(12,2) NOT NULL,
  estado VARCHAR(30) DEFAULT 'PENDIENTE',
  usuario_id INTEGER NOT NULL REFERENCES usuario(id)
);

CREATE TABLE detalle_compra (
  id SERIAL PRIMARY KEY,
  compra_id INTEGER NOT NULL REFERENCES compra(id),
  medicamento_id INTEGER NOT NULL REFERENCES medicamento(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id),
  tabla_afectada VARCHAR(100) NOT NULL,
  accion VARCHAR(30) NOT NULL,
  registro_id INTEGER,
  detalle TEXT,
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_origen VARCHAR(45)
);

CREATE TABLE notificacion (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES paciente(id),
  medico_id INTEGER REFERENCES medico(id),
  cita_id INTEGER REFERENCES cita(id),
  tipo VARCHAR(20) NOT NULL,
  asunto VARCHAR(200),
  mensaje TEXT NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  fecha_envio TIMESTAMP,
  rol_destino VARCHAR(30),
  creado_en TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_notificacion_destinatario CHECK (
    paciente_id IS NOT NULL OR medico_id IS NOT NULL OR rol_destino IS NOT NULL
  )
);

-- ============================================
-- TARIFAS DE SERVICIO
-- ============================================

CREATE TABLE tarifa_servicio (
  id SERIAL PRIMARY KEY,
  tipo_servicio VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

INSERT INTO tarifa_servicio (tipo_servicio, descripcion, precio_unitario) VALUES
  ('CONSULTA', 'Consulta medica general', 50.00),
  ('EMERGENCIA', 'Atencion de emergencia', 150.00),
  ('EXAMEN_LABORATORIO', 'Examen de laboratorio (por examen)', 30.00),
  ('HOSPITALIZACION_DIA', 'Dia de hospitalizacion', 200.00)
ON CONFLICT (tipo_servicio) DO NOTHING;

-- ============================================
-- DATOS SEMILLA (necesarios para poder arrancar)
-- ============================================

INSERT INTO rol (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema'),
('DIRECTOR', 'Director / Gerencia'),
('MEDICO', 'Médico'),
('ENFERMERA', 'Enfermera'),
('FARMACEUTICO', 'Farmacéutico'),
('TECNICO_LAB', 'Técnico de laboratorio'),
('ADMISIONISTA', 'Admisionista'),
('FACTURADOR', 'Facturador'),
('PACIENTE', 'Paciente');

-- Usuario admin inicial: username = admin / password = admin123
-- (CAMBIA esta contraseña luego desde el sistema una vez que puedas entrar)
INSERT INTO usuario (username, password_hash, rol_id, activo)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  (SELECT id FROM rol WHERE nombre = 'ADMIN'),
  TRUE
);

-- Un par de camas de ejemplo para poder probar hospitalización
INSERT INTO cama (numero_cama, piso, sala, tipo, estado) VALUES
('101-A', '1', 'General', 'GENERAL', 'DISPONIBLE'),
('101-B', '1', 'General', 'GENERAL', 'DISPONIBLE'),
('UCI-01', '2', 'UCI', 'UCI', 'DISPONIBLE');
