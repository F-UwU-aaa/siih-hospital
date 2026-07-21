--
-- PostgreSQL database dump
--

\restrict 1AgwsMHZoamGo6bEabUStlUJInMdeLNGg0AQkaZdtlba0KtWRSddtkwA3on60x7

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admisionista; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admisionista (
    id integer NOT NULL,
    ci character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    telefono character varying(20),
    email character varying(100),
    activo boolean DEFAULT true
);


ALTER TABLE public.admisionista OWNER TO postgres;

--
-- Name: admisionista_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admisionista_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admisionista_id_seq OWNER TO postgres;

--
-- Name: admisionista_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admisionista_id_seq OWNED BY public.admisionista.id;


--
-- Name: alergia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alergia (
    id integer NOT NULL,
    historial_id integer NOT NULL,
    sustancia character varying(200) NOT NULL,
    reaccion text,
    severidad character varying(20),
    usuario_id integer,
    fecha_registro timestamp without time zone DEFAULT now()
);


ALTER TABLE public.alergia OWNER TO postgres;

--
-- Name: alergia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alergia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.alergia_id_seq OWNER TO postgres;

--
-- Name: alergia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alergia_id_seq OWNED BY public.alergia.id;


--
-- Name: antecedente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.antecedente (
    id integer NOT NULL,
    historial_id integer NOT NULL,
    tipo character varying(50),
    descripcion text NOT NULL,
    usuario_id integer,
    fecha_registro timestamp without time zone DEFAULT now()
);


ALTER TABLE public.antecedente OWNER TO postgres;

--
-- Name: antecedente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.antecedente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.antecedente_id_seq OWNER TO postgres;

--
-- Name: antecedente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.antecedente_id_seq OWNED BY public.antecedente.id;


--
-- Name: atencion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.atencion (
    id integer NOT NULL,
    historial_id integer NOT NULL,
    medico_id integer NOT NULL,
    cita_id integer,
    fecha_atencion timestamp without time zone DEFAULT now() NOT NULL,
    motivo_consulta text,
    diagnostico text,
    tratamiento text,
    observaciones text,
    tipo character varying(20) DEFAULT 'CONSULTA'::character varying
);


ALTER TABLE public.atencion OWNER TO postgres;

--
-- Name: atencion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.atencion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.atencion_id_seq OWNER TO postgres;

--
-- Name: atencion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.atencion_id_seq OWNED BY public.atencion.id;


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    tabla_afectada character varying(100) NOT NULL,
    accion character varying(30) NOT NULL,
    registro_id integer,
    detalle text,
    fecha_hora timestamp without time zone DEFAULT now() NOT NULL,
    ip_origen character varying(45)
);


ALTER TABLE public.auditoria OWNER TO postgres;

--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.auditoria_id_seq OWNER TO postgres;

--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- Name: cama; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cama (
    id integer NOT NULL,
    numero_cama character varying(20) NOT NULL,
    piso character varying(20),
    sala character varying(100),
    tipo character varying(50),
    estado character varying(30) DEFAULT 'DISPONIBLE'::character varying
);


ALTER TABLE public.cama OWNER TO postgres;

--
-- Name: cama_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cama_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cama_id_seq OWNER TO postgres;

--
-- Name: cama_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cama_id_seq OWNED BY public.cama.id;


--
-- Name: cita; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cita (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    medico_id integer NOT NULL,
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    tipo character varying(20) DEFAULT 'NORMAL'::character varying NOT NULL,
    prioridad character varying(20) DEFAULT 'NORMAL'::character varying,
    motivo text,
    creado_por integer
);


ALTER TABLE public.cita OWNER TO postgres;

--
-- Name: cita_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cita_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cita_id_seq OWNER TO postgres;

--
-- Name: cita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cita_id_seq OWNED BY public.cita.id;


--
-- Name: compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compra (
    id integer NOT NULL,
    proveedor_id integer NOT NULL,
    fecha_compra timestamp without time zone DEFAULT now() NOT NULL,
    total numeric(12,2) NOT NULL,
    estado character varying(30) DEFAULT 'PENDIENTE'::character varying,
    usuario_id integer NOT NULL
);


ALTER TABLE public.compra OWNER TO postgres;

--
-- Name: compra_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.compra_id_seq OWNER TO postgres;

--
-- Name: compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compra_id_seq OWNED BY public.compra.id;


--
-- Name: detalle_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_compra (
    id integer NOT NULL,
    compra_id integer NOT NULL,
    medicamento_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL
);


ALTER TABLE public.detalle_compra OWNER TO postgres;

--
-- Name: detalle_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.detalle_compra_id_seq OWNER TO postgres;

--
-- Name: detalle_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_compra_id_seq OWNED BY public.detalle_compra.id;


--
-- Name: detalle_factura; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_factura (
    id integer NOT NULL,
    factura_id integer NOT NULL,
    descripcion character varying(255) NOT NULL,
    cantidad integer DEFAULT 1,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL
);


ALTER TABLE public.detalle_factura OWNER TO postgres;

--
-- Name: detalle_factura_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_factura_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.detalle_factura_id_seq OWNER TO postgres;

--
-- Name: detalle_factura_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_factura_id_seq OWNED BY public.detalle_factura.id;


--
-- Name: detalle_receta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_receta (
    id integer NOT NULL,
    receta_id integer NOT NULL,
    medicamento_id integer NOT NULL,
    dosis character varying(100),
    frecuencia character varying(100),
    duracion character varying(100),
    cantidad integer NOT NULL,
    indicaciones text
);


ALTER TABLE public.detalle_receta OWNER TO postgres;

--
-- Name: detalle_receta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_receta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.detalle_receta_id_seq OWNER TO postgres;

--
-- Name: detalle_receta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_receta_id_seq OWNED BY public.detalle_receta.id;


--
-- Name: enfermera; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enfermera (
    id integer NOT NULL,
    ci character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    turno character varying(20),
    telefono character varying(20),
    activo boolean DEFAULT true
);


ALTER TABLE public.enfermera OWNER TO postgres;

--
-- Name: enfermera_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enfermera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.enfermera_id_seq OWNER TO postgres;

--
-- Name: enfermera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enfermera_id_seq OWNED BY public.enfermera.id;


--
-- Name: examen_laboratorio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.examen_laboratorio (
    id integer NOT NULL,
    atencion_id integer NOT NULL,
    tipo_examen character varying(200) NOT NULL,
    fecha_solicitud timestamp without time zone DEFAULT now() NOT NULL,
    estado character varying(30) DEFAULT 'SOLICITADO'::character varying,
    observaciones_solicitud text,
    tecnico_id integer
);


ALTER TABLE public.examen_laboratorio OWNER TO postgres;

--
-- Name: examen_laboratorio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.examen_laboratorio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.examen_laboratorio_id_seq OWNER TO postgres;

--
-- Name: examen_laboratorio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.examen_laboratorio_id_seq OWNED BY public.examen_laboratorio.id;


--
-- Name: factura; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factura (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    atencion_id integer,
    numero_factura character varying(50) NOT NULL,
    fecha_emision timestamp without time zone DEFAULT now() NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    impuesto numeric(12,2) DEFAULT 0,
    descuento numeric(12,2) DEFAULT 0,
    cobertura_seguro numeric(12,2) DEFAULT 0,
    total numeric(12,2) NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    tipo_pago character varying(30),
    usuario_id integer NOT NULL
);


ALTER TABLE public.factura OWNER TO postgres;

--
-- Name: factura_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.factura_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.factura_id_seq OWNER TO postgres;

--
-- Name: factura_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.factura_id_seq OWNED BY public.factura.id;


--
-- Name: facturador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facturador (
    id integer NOT NULL,
    ci character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    telefono character varying(20),
    email character varying(100),
    activo boolean DEFAULT true
);


ALTER TABLE public.facturador OWNER TO postgres;

--
-- Name: facturador_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.facturador_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.facturador_id_seq OWNER TO postgres;

--
-- Name: facturador_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.facturador_id_seq OWNED BY public.facturador.id;


--
-- Name: farmaceutico; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.farmaceutico (
    id integer NOT NULL,
    ci character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    telefono character varying(20),
    email character varying(100),
    activo boolean DEFAULT true
);


ALTER TABLE public.farmaceutico OWNER TO postgres;

--
-- Name: farmaceutico_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.farmaceutico_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.farmaceutico_id_seq OWNER TO postgres;

--
-- Name: farmaceutico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.farmaceutico_id_seq OWNED BY public.farmaceutico.id;


--
-- Name: historial_clinico; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_clinico (
    id integer NOT NULL,
    paciente_id integer NOT NULL
);


ALTER TABLE public.historial_clinico OWNER TO postgres;

--
-- Name: historial_clinico_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_clinico_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.historial_clinico_id_seq OWNER TO postgres;

--
-- Name: historial_clinico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_clinico_id_seq OWNED BY public.historial_clinico.id;


--
-- Name: hospitalizacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitalizacion (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    medico_id integer NOT NULL,
    cama_id integer NOT NULL,
    atencion_id integer,
    fecha_ingreso timestamp without time zone DEFAULT now() NOT NULL,
    fecha_alta timestamp without time zone,
    diagnostico_ingreso text,
    diagnostico_alta text,
    estado character varying(20) DEFAULT 'ACTIVA'::character varying
);


ALTER TABLE public.hospitalizacion OWNER TO postgres;

--
-- Name: hospitalizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hospitalizacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hospitalizacion_id_seq OWNER TO postgres;

--
-- Name: hospitalizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitalizacion_id_seq OWNED BY public.hospitalizacion.id;


--
-- Name: inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventario (
    id integer NOT NULL,
    medicamento_id integer NOT NULL,
    lote character varying(100) NOT NULL,
    cantidad integer DEFAULT 0 NOT NULL,
    stock_minimo integer DEFAULT 10 NOT NULL,
    fecha_vencimiento date NOT NULL,
    ubicacion character varying(100),
    precio_unitario numeric(10,2)
);


ALTER TABLE public.inventario OWNER TO postgres;

--
-- Name: inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.inventario_id_seq OWNER TO postgres;

--
-- Name: inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventario_id_seq OWNED BY public.inventario.id;


--
-- Name: medicacion_administrada; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medicacion_administrada (
    id integer NOT NULL,
    hospitalizacion_id integer NOT NULL,
    enfermera_id integer NOT NULL,
    medicamento_id integer NOT NULL,
    dosis character varying(100),
    fecha_hora timestamp without time zone DEFAULT now() NOT NULL,
    observaciones text
);


ALTER TABLE public.medicacion_administrada OWNER TO postgres;

--
-- Name: medicacion_administrada_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medicacion_administrada_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.medicacion_administrada_id_seq OWNER TO postgres;

--
-- Name: medicacion_administrada_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medicacion_administrada_id_seq OWNED BY public.medicacion_administrada.id;


--
-- Name: medicamento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medicamento (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    principio_activo character varying(200),
    presentacion character varying(100),
    concentracion character varying(100),
    laboratorio character varying(200),
    activo boolean DEFAULT true
);


ALTER TABLE public.medicamento OWNER TO postgres;

--
-- Name: medicamento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medicamento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.medicamento_id_seq OWNER TO postgres;

--
-- Name: medicamento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medicamento_id_seq OWNED BY public.medicamento.id;


--
-- Name: medico; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medico (
    id integer NOT NULL,
    ci character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    especialidad character varying(100) NOT NULL,
    telefono character varying(20),
    email character varying(100),
    horario_atencion text,
    activo boolean DEFAULT true
);


ALTER TABLE public.medico OWNER TO postgres;

--
-- Name: medico_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medico_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.medico_id_seq OWNER TO postgres;

--
-- Name: medico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medico_id_seq OWNED BY public.medico.id;


--
-- Name: notificacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacion (
    id integer NOT NULL,
    paciente_id integer,
    medico_id integer,
    cita_id integer,
    tipo character varying(20) NOT NULL,
    asunto character varying(200),
    mensaje text NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    fecha_envio timestamp without time zone,
    rol_destino character varying(30),
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_notificacion_destinatario CHECK (((paciente_id IS NOT NULL) OR (medico_id IS NOT NULL) OR (rol_destino IS NOT NULL)))
);


ALTER TABLE public.notificacion OWNER TO postgres;

--
-- Name: notificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notificacion_id_seq OWNER TO postgres;

--
-- Name: notificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificacion_id_seq OWNED BY public.notificacion.id;


--
-- Name: paciente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paciente (
    id integer NOT NULL,
    ci character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    fecha_nacimiento date NOT NULL,
    sexo character(1),
    direccion character varying(255),
    telefono character varying(20),
    email character varying(100),
    seguro_medico character varying(100),
    registrado_por integer,
    huella_dactilar_ref text,
    foto_rostro_ref text,
    activo boolean DEFAULT true
);


ALTER TABLE public.paciente OWNER TO postgres;

--
-- Name: paciente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.paciente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.paciente_id_seq OWNER TO postgres;

--
-- Name: paciente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.paciente_id_seq OWNED BY public.paciente.id;


--
-- Name: permiso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permiso (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    modulo character varying(50),
    accion character varying(20)
);


ALTER TABLE public.permiso OWNER TO postgres;

--
-- Name: permiso_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permiso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permiso_id_seq OWNER TO postgres;

--
-- Name: permiso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permiso_id_seq OWNED BY public.permiso.id;


--
-- Name: proveedor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedor (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    ruc character varying(50),
    direccion character varying(255),
    telefono character varying(20),
    email character varying(100),
    activo boolean DEFAULT true
);


ALTER TABLE public.proveedor OWNER TO postgres;

--
-- Name: proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.proveedor_id_seq OWNER TO postgres;

--
-- Name: proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedor_id_seq OWNED BY public.proveedor.id;


--
-- Name: receta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receta (
    id integer NOT NULL,
    atencion_id integer NOT NULL,
    medico_id integer NOT NULL,
    fecha_emision timestamp without time zone DEFAULT now() NOT NULL,
    codigo_receta character varying(50) NOT NULL,
    estado character varying(20) DEFAULT 'EMITIDA'::character varying,
    dispensado_por integer
);


ALTER TABLE public.receta OWNER TO postgres;

--
-- Name: receta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.receta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.receta_id_seq OWNER TO postgres;

--
-- Name: receta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.receta_id_seq OWNED BY public.receta.id;


--
-- Name: resultado_laboratorio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultado_laboratorio (
    id integer NOT NULL,
    examen_id integer NOT NULL,
    resultado text NOT NULL,
    valores_referencia text,
    observaciones text,
    fecha_resultado timestamp without time zone DEFAULT now() NOT NULL,
    es_critico boolean DEFAULT false
);


ALTER TABLE public.resultado_laboratorio OWNER TO postgres;

--
-- Name: resultado_laboratorio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultado_laboratorio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resultado_laboratorio_id_seq OWNER TO postgres;

--
-- Name: resultado_laboratorio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultado_laboratorio_id_seq OWNED BY public.resultado_laboratorio.id;


--
-- Name: rol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rol (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.rol OWNER TO postgres;

--
-- Name: rol_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rol_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rol_id_seq OWNER TO postgres;

--
-- Name: rol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rol_id_seq OWNED BY public.rol.id;


--
-- Name: rol_permiso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rol_permiso (
    rol_id integer NOT NULL,
    permiso_id integer NOT NULL
);


ALTER TABLE public.rol_permiso OWNER TO postgres;

--
-- Name: signos_vitales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.signos_vitales (
    id integer NOT NULL,
    atencion_id integer,
    hospitalizacion_id integer,
    enfermera_id integer,
    fecha_hora timestamp without time zone DEFAULT now() NOT NULL,
    temperatura numeric(4,1),
    presion_sistolica integer,
    presion_diastolica integer,
    frecuencia_cardiaca integer,
    frecuencia_resp integer,
    saturacion_oxigeno numeric(4,1),
    peso numeric(5,2),
    talla numeric(5,2),
    CONSTRAINT chk_signos_origen CHECK (((atencion_id IS NOT NULL) OR (hospitalizacion_id IS NOT NULL)))
);


ALTER TABLE public.signos_vitales OWNER TO postgres;

--
-- Name: signos_vitales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.signos_vitales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.signos_vitales_id_seq OWNER TO postgres;

--
-- Name: signos_vitales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.signos_vitales_id_seq OWNED BY public.signos_vitales.id;


--
-- Name: tarifa_servicio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarifa_servicio (
    id integer NOT NULL,
    tipo_servicio character varying(50) NOT NULL,
    descripcion character varying(200) NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.tarifa_servicio OWNER TO postgres;

--
-- Name: tarifa_servicio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tarifa_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tarifa_servicio_id_seq OWNER TO postgres;

--
-- Name: tarifa_servicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tarifa_servicio_id_seq OWNED BY public.tarifa_servicio.id;


--
-- Name: tecnico_laboratorio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tecnico_laboratorio (
    id integer NOT NULL,
    ci character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    telefono character varying(20),
    email character varying(100),
    activo boolean DEFAULT true
);


ALTER TABLE public.tecnico_laboratorio OWNER TO postgres;

--
-- Name: tecnico_laboratorio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tecnico_laboratorio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tecnico_laboratorio_id_seq OWNER TO postgres;

--
-- Name: tecnico_laboratorio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tecnico_laboratorio_id_seq OWNED BY public.tecnico_laboratorio.id;


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(100),
    ultimo_acceso timestamp without time zone,
    activo boolean DEFAULT true,
    creado_por integer,
    rol_id integer NOT NULL,
    paciente_id integer,
    medico_id integer,
    enfermera_id integer,
    farmaceutico_id integer,
    tecnico_lab_id integer,
    admisionista_id integer,
    facturador_id integer
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuario_id_seq OWNER TO postgres;

--
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_seq OWNED BY public.usuario.id;


--
-- Name: admisionista id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admisionista ALTER COLUMN id SET DEFAULT nextval('public.admisionista_id_seq'::regclass);


--
-- Name: alergia id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alergia ALTER COLUMN id SET DEFAULT nextval('public.alergia_id_seq'::regclass);


--
-- Name: antecedente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.antecedente ALTER COLUMN id SET DEFAULT nextval('public.antecedente_id_seq'::regclass);


--
-- Name: atencion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atencion ALTER COLUMN id SET DEFAULT nextval('public.atencion_id_seq'::regclass);


--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- Name: cama id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cama ALTER COLUMN id SET DEFAULT nextval('public.cama_id_seq'::regclass);


--
-- Name: cita id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita ALTER COLUMN id SET DEFAULT nextval('public.cita_id_seq'::regclass);


--
-- Name: compra id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra ALTER COLUMN id SET DEFAULT nextval('public.compra_id_seq'::regclass);


--
-- Name: detalle_compra id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra ALTER COLUMN id SET DEFAULT nextval('public.detalle_compra_id_seq'::regclass);


--
-- Name: detalle_factura id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_factura ALTER COLUMN id SET DEFAULT nextval('public.detalle_factura_id_seq'::regclass);


--
-- Name: detalle_receta id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_receta ALTER COLUMN id SET DEFAULT nextval('public.detalle_receta_id_seq'::regclass);


--
-- Name: enfermera id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enfermera ALTER COLUMN id SET DEFAULT nextval('public.enfermera_id_seq'::regclass);


--
-- Name: examen_laboratorio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.examen_laboratorio ALTER COLUMN id SET DEFAULT nextval('public.examen_laboratorio_id_seq'::regclass);


--
-- Name: factura id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura ALTER COLUMN id SET DEFAULT nextval('public.factura_id_seq'::regclass);


--
-- Name: facturador id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturador ALTER COLUMN id SET DEFAULT nextval('public.facturador_id_seq'::regclass);


--
-- Name: farmaceutico id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farmaceutico ALTER COLUMN id SET DEFAULT nextval('public.farmaceutico_id_seq'::regclass);


--
-- Name: historial_clinico id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_clinico ALTER COLUMN id SET DEFAULT nextval('public.historial_clinico_id_seq'::regclass);


--
-- Name: hospitalizacion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitalizacion ALTER COLUMN id SET DEFAULT nextval('public.hospitalizacion_id_seq'::regclass);


--
-- Name: inventario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario ALTER COLUMN id SET DEFAULT nextval('public.inventario_id_seq'::regclass);


--
-- Name: medicacion_administrada id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicacion_administrada ALTER COLUMN id SET DEFAULT nextval('public.medicacion_administrada_id_seq'::regclass);


--
-- Name: medicamento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicamento ALTER COLUMN id SET DEFAULT nextval('public.medicamento_id_seq'::regclass);


--
-- Name: medico id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medico ALTER COLUMN id SET DEFAULT nextval('public.medico_id_seq'::regclass);


--
-- Name: notificacion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion ALTER COLUMN id SET DEFAULT nextval('public.notificacion_id_seq'::regclass);


--
-- Name: paciente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paciente ALTER COLUMN id SET DEFAULT nextval('public.paciente_id_seq'::regclass);


--
-- Name: permiso id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso ALTER COLUMN id SET DEFAULT nextval('public.permiso_id_seq'::regclass);


--
-- Name: proveedor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedor ALTER COLUMN id SET DEFAULT nextval('public.proveedor_id_seq'::regclass);


--
-- Name: receta id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receta ALTER COLUMN id SET DEFAULT nextval('public.receta_id_seq'::regclass);


--
-- Name: resultado_laboratorio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultado_laboratorio ALTER COLUMN id SET DEFAULT nextval('public.resultado_laboratorio_id_seq'::regclass);


--
-- Name: rol id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol ALTER COLUMN id SET DEFAULT nextval('public.rol_id_seq'::regclass);


--
-- Name: signos_vitales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signos_vitales ALTER COLUMN id SET DEFAULT nextval('public.signos_vitales_id_seq'::regclass);


--
-- Name: tarifa_servicio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarifa_servicio ALTER COLUMN id SET DEFAULT nextval('public.tarifa_servicio_id_seq'::regclass);


--
-- Name: tecnico_laboratorio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tecnico_laboratorio ALTER COLUMN id SET DEFAULT nextval('public.tecnico_laboratorio_id_seq'::regclass);


--
-- Name: usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id SET DEFAULT nextval('public.usuario_id_seq'::regclass);


--
-- Data for Name: admisionista; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admisionista (id, ci, nombre, apellido, telefono, email, activo) FROM stdin;
1	V-60000001	Diego	Torres	0412-9998877	diego.torres@hospital.com	t
\.


--
-- Data for Name: alergia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alergia (id, historial_id, sustancia, reaccion, severidad, usuario_id, fecha_registro) FROM stdin;
1	1	Penicilina	Urticaria generalizada con dificultad respiratoria	GRAVE	3	2026-07-20 13:12:56.065495
2	1	Polen	Rinitis alergica estacional	LEVE	3	2026-07-20 13:12:56.067323
3	2	Ibuprofeno	Dolor gastrico intenso y hemorragia digestiva leve	MODERADA	3	2026-07-20 13:12:56.06792
\.


--
-- Data for Name: antecedente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.antecedente (id, historial_id, tipo, descripcion, usuario_id, fecha_registro) FROM stdin;
1	1	QUIRURGICO	Apendicectomia laparoscopica (2015) sin complicaciones	3	2026-07-20 13:12:56.068548
2	1	PATOLOGICO	Asma infantil controlada, sin hospitalizaciones previas	3	2026-07-20 13:12:56.070005
3	2	PATOLOGICO	Diabetes tipo 2 diagnosticada en 2018, en tratamiento con Metformina 850mg	3	2026-07-20 13:12:56.070666
4	5	CARDIOVASCULAR	Hipertension arterial diagnosticada en 2010, tratamiento con Losartan 50mg	3	2026-07-20 13:12:56.071325
5	5	PATOLOGICO	Osteoporosis leve diagnosticada en 2022, suplementacion de calcio y vitamina D	3	2026-07-20 13:12:56.071889
\.


--
-- Data for Name: atencion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.atencion (id, historial_id, medico_id, cita_id, fecha_atencion, motivo_consulta, diagnostico, tratamiento, observaciones, tipo) FROM stdin;
1	1	1	1	2026-07-13 13:12:56.080363	Dolor de cabeza persistente desde hace 2 semanas	Cefalea tensional	Paracetamol 500mg c/8h x 7d, reposo 48h	\N	CONSULTA
2	2	1	2	2026-07-15 13:12:56.097052	Fiebre alta (39.2C) y dificultad respiratoria desde hace 3 dias	Neumonia adquirida en comunidad	Amoxicilina 500mg c/8h x 10d + Omeprazol 20mg c/24h x 10d	\N	EMERGENCIA
3	21	1	3	2026-07-20 18:42:24.790545	\N	\N	\N	\N	EMERGENCIA
4	21	1	3	2026-07-20 18:46:20.744206	\N	\N	\N	\N	CONSULTA
5	24	1	11	2026-07-20 23:32:58.214993	\N	\N	\N	\N	EMERGENCIA
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, usuario_id, tabla_afectada, accion, registro_id, detalle, fecha_hora, ip_origen) FROM stdin;
1	3	atencion	INSERT	3	Atención EMERGENCIA creada (cita #3, paciente #11)	2026-07-20 18:42:24.863418	\N
2	1	atencion	INSERT	4	Atención CONSULTA creada para cita #3	2026-07-20 18:46:20.816147	\N
3	1	compra	INSERT	1	Compra #1 a proveedor #1, total: 144	2026-07-20 18:47:25.711052	\N
4	1	inventario	INSERT	\N	Compra #1 recibida: +12 unidades lote LOTE-1-1	2026-07-20 18:47:34.977302	\N
5	1	compra	UPDATE	1	Compra #1 RECIBIDA — 1 items入库	2026-07-20 18:47:34.987481	\N
6	1	paciente	UPDATE	11	Paciente DESCONOCIDO DESCONOCIDO desactivado	2026-07-20 19:23:19.559721	\N
7	3	paciente	UPDATE	6	Paciente Luis Fernandez desactivado	2026-07-20 20:25:15.003382	\N
8	3	paciente	UPDATE	6	Paciente Luis Fernandez activado	2026-07-20 20:25:22.428724	\N
9	10	paciente	UPDATE	12	Paciente Test Admisionista desactivado	2026-07-20 21:59:28.157742	\N
10	10	paciente	UPDATE	12	Paciente Test Admisionista activado	2026-07-20 21:59:28.362389	\N
11	10	cita	INSERT	7	Cita #7 creada — paciente Maria Garcia, Dr(a). Rodriguez, 2026-07-21 23:40	2026-07-20 22:10:43.486136	\N
12	10	cita	UPDATE	7	Cita #7 actualizada — estado: PENDIENTE → EN_ESPERA	2026-07-20 22:10:43.691246	\N
13	10	paciente	INSERT	13	Paciente Audit Paciente (CI: V-77777777) registrado	2026-07-20 22:10:44.627081	\N
14	11	factura	INSERT	2	Factura FAC-20260721-0001 creada — paciente #1, total $89	2026-07-20 22:32:02.391348	\N
15	11	factura	UPDATE	2	Factura #2 (FAC-20260721-0001) marcada como PAGADA — descuento: $0.00, cobertura: $0.00	2026-07-20 22:32:02.680468	\N
16	12	cita	INSERT	8	Cita #8 creada — paciente Maria Garcia, Dr(a). Martinez, 2026-12-25 10:00	2026-07-20 22:54:38.68958	\N
17	12	cita	INSERT	9	Cita #9 creada — paciente Maria Garcia, Dr(a). Martinez, 2026-12-26 11:00	2026-07-20 23:01:02.454423	\N
18	12	cita	INSERT	10	Cita #10 creada — paciente Maria Garcia, Dr(a). Martinez, 2026-12-26 11:00	2026-07-20 23:01:53.869024	\N
19	3	atencion	INSERT	5	Atención EMERGENCIA creada (cita #11, paciente #15)	2026-07-20 23:32:58.297443	\N
20	3	examen_laboratorio	INSERT	3	Examen solicitado: Ecografia General para atencion #5	2026-07-20 23:33:13.355177	\N
21	3	hospitalizacion	INSERT	2	Hospitalizacion #2 creada: paciente_id=15, cama=12, atencion #5	2026-07-20 23:33:23.980682	\N
22	10	paciente	INSERT	16	Paciente Test Wizard (CI: V-99999999) registrado	2026-07-20 23:38:04.485084	\N
23	10	cita	INSERT	12	Cita #12 creada — paciente Test Wizard, Dr(a). Martinez, 2026-12-27 09:00	2026-07-20 23:38:05.000341	\N
24	10	cita	UPDATE	12	Cita #12 actualizada — estado: PENDIENTE → CANCELADA	2026-07-20 23:38:05.190698	\N
25	10	cita	INSERT	13	Cita #13 creada — paciente Luis Fernandez, Dr(a). Martinez, 2026-12-28 10:00	2026-07-21 00:05:39.643659	\N
26	10	cita	UPDATE	13	Cita #13 actualizada — estado: PENDIENTE → CANCELADA	2026-07-21 00:05:39.807454	\N
27	12	cita	INSERT	14	Cita #14 creada — paciente Maria Garcia, Dr(a). Rodriguez, 2026-12-29 11:00	2026-07-21 00:18:38.917818	\N
28	12	cita	UPDATE	14	Cita #14 actualizada — estado: PENDIENTE → CANCELADA	2026-07-21 00:18:39.508913	\N
29	10	cita	INSERT	15	Cita #15 creada — paciente Maria Garcia, Dr(a). Rodriguez, 2026-12-29 14:00	2026-07-21 00:18:39.709983	\N
30	10	cita	UPDATE	15	Cita #15 actualizada — estado: PENDIENTE → CANCELADA	2026-07-21 00:18:39.848273	\N
31	12	cita	INSERT	16	Cita #16 creada — paciente Maria Garcia, Dr(a). Martinez, 2000-12-12 14:30	2026-07-21 00:20:09.04952	\N
\.


--
-- Data for Name: cama; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cama (id, numero_cama, piso, sala, tipo, estado) FROM stdin;
1	101-A	1	General	GENERAL	DISPONIBLE
2	101-B	1	General	GENERAL	DISPONIBLE
3	UCI-01	2	UCI	UCI	DISPONIBLE
5	201-B	2	Pediatria	PEDIATRIA	DISPONIBLE
6	301-A	3	Maternidad	MATERNIDAD	DISPONIBLE
7	301-B	3	Maternidad	MATERNIDAD	DISPONIBLE
8	401-A	4	Cirugia	CIRUGIA	DISPONIBLE
9	401-B	4	Cirugia	CIRUGIA	DISPONIBLE
10	501-A	5	UCI	UCI	DISPONIBLE
11	501-B	5	UCI	UCI	DISPONIBLE
13	601-B	6	Consultas	GENERAL	DISPONIBLE
14	302-A	3	Maternidad	MATERNIDAD	DISPONIBLE
15	502-A	5	UCI	UCI	DISPONIBLE
4	201-A	2	Pediatria	PEDIATRIA	OCUPADA
12	601-A	6	Consultas	GENERAL	OCUPADA
\.


--
-- Data for Name: cita; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cita (id, paciente_id, medico_id, fecha, hora, estado, tipo, prioridad, motivo, creado_por) FROM stdin;
1	1	1	2026-07-13	09:00:00	COMPLETADA	NORMAL	NORMAL	Dolor de cabeza persistente desde hace 2 semanas	10
2	2	1	2026-07-15	14:00:00	COMPLETADA	EMERGENCIA	URGENTE	Fiebre alta y dificultad para respirar desde hace 3 dias	10
3	11	1	2026-07-20	18:42:00	EN_ESPERA	EMERGENCIA	ALTA	Emergencia médica	3
10	1	3	2026-12-26	11:00:00	PENDIENTE	NORMAL	NORMAL	Test override	12
11	15	1	2026-07-21	23:32:00	CONFIRMADA	EMERGENCIA	ALTA	Emergencia médica	3
12	16	3	2026-12-27	09:00:00	CANCELADA	NORMAL	NORMAL	Cita desde wizard inline	10
13	6	3	2026-12-28	10:00:00	CANCELADA	NORMAL	NORMAL	Cita desde selector de lista	10
14	1	1	2026-12-29	11:00:00	CANCELADA	NORMAL	NORMAL	Cita desde wizard PACIENTE	12
15	1	1	2026-12-29	14:00:00	CANCELADA	NORMAL	NORMAL	Cita normal Admisionista	10
16	1	3	2000-12-12	14:30:00	PENDIENTE	NORMAL	NORMAL	\N	12
\.


--
-- Data for Name: compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compra (id, proveedor_id, fecha_compra, total, estado, usuario_id) FROM stdin;
1	1	2026-07-20 18:47:25.616258	144.00	RECIBIDA	1
\.


--
-- Data for Name: detalle_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_compra (id, compra_id, medicamento_id, cantidad, precio_unitario) FROM stdin;
1	1	13	12	12.00
\.


--
-- Data for Name: detalle_factura; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_factura (id, factura_id, descripcion, cantidad, precio_unitario, subtotal) FROM stdin;
1	1	Consulta medica general - Cefalea tensional	1	50.00	50.00
2	2	Consulta medica (Atencion #1)	1	50.00	50.00
3	2	Medicamento: Paracetamol (Receta #1)	20	0.45	9.00
4	2	Examen: Hemograma Completo (Examen #1)	1	30.00	30.00
\.


--
-- Data for Name: detalle_receta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_receta (id, receta_id, medicamento_id, dosis, frecuencia, duracion, cantidad, indicaciones) FROM stdin;
1	1	1	500mg	Cada 8 horas	7 dias	20	Tomar 1 comprimido cada 8 horas con alimentos
2	2	3	500mg	Cada 8 horas	10 dias	30	Tomar 1 capsula cada 8 horas con alimentos
3	2	5	20mg	Cada 24 horas	10 dias	10	Tomar 1 capsula en ayunas, 30 minutos antes del desayuno
\.


--
-- Data for Name: enfermera; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enfermera (id, ci, nombre, apellido, turno, telefono, activo) FROM stdin;
1	V-30111222	Ana	Martinez	MANANA	0414-1112233	t
2	V-30222333	Lucia	Hernandez	TARDE	0414-2223344	t
\.


--
-- Data for Name: examen_laboratorio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.examen_laboratorio (id, atencion_id, tipo_examen, fecha_solicitud, estado, observaciones_solicitud, tecnico_id) FROM stdin;
1	1	Hemograma Completo	2026-07-20 13:12:56.089283	COMPLETADO	Sospecha de infeccion, solicitar hemograma completo	9
2	2	Quimica Sanguinea	2026-07-20 13:12:56.10301	SOLICITADO	Control de glucosa y perfil lipidico	\N
3	5	Ecografia General	2026-07-20 23:33:13.349889	SOLICITADO	NECESITA AYUDA	\N
\.


--
-- Data for Name: factura; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factura (id, paciente_id, atencion_id, numero_factura, fecha_emision, subtotal, impuesto, descuento, cobertura_seguro, total, estado, tipo_pago, usuario_id) FROM stdin;
1	1	1	FAC-20260713-0001	2026-07-20 13:12:56.09289	50.00	8.00	0.00	0.00	58.00	PENDIENTE	\N	11
2	1	\N	FAC-20260721-0001	2026-07-20 22:32:02.299076	89.00	0.00	0.00	0.00	89.00	PAGADA	\N	11
3	2	\N	FAC-TEST-OTHER-001	2026-07-20 23:01:42.479026	100.00	16.00	0.00	0.00	116.00	PENDIENTE	\N	1
\.


--
-- Data for Name: facturador; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facturador (id, ci, nombre, apellido, telefono, email, activo) FROM stdin;
1	V-30000000	Maria Lopez	Garcia	0412-1234567	maria.lopez@hospital.com	t
\.


--
-- Data for Name: farmaceutico; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.farmaceutico (id, ci, nombre, apellido, telefono, email, activo) FROM stdin;
1	V-20111222	Pedro	Rodriguez	+58-412-5551111	pedro.rodriguez@hospital.com	t
2	V-20333444	Laura	Fernandez	+58-414-5552222	laura.fernandez@hospital.com	t
3	V-20555666	Carlos	Mendoza	+58-416-5553333	carlos.mendoza@hospital.com	t
\.


--
-- Data for Name: historial_clinico; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_clinico (id, paciente_id) FROM stdin;
1	1
2	2
3	3
4	4
5	5
6	6
7	7
8	8
9	9
10	10
21	11
24	15
25	16
\.


--
-- Data for Name: hospitalizacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitalizacion (id, paciente_id, medico_id, cama_id, atencion_id, fecha_ingreso, fecha_alta, diagnostico_ingreso, diagnostico_alta, estado) FROM stdin;
1	2	1	4	2	2026-07-17 13:12:56.103657	\N	Neumonia adquirida en comunidad — dificultad respiratoria persistente a pesar de antibioticoterapia oral	\N	ACTIVA
2	15	1	12	5	2026-07-20 23:33:23.914149	\N	dwada	\N	ACTIVA
\.


--
-- Data for Name: inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventario (id, medicamento_id, lote, cantidad, stock_minimo, fecha_vencimiento, ubicacion, precio_unitario) FROM stdin;
1	1	PARA-2023-B	30	50	2026-01-20	Estante A1	0.45
2	1	PARA-2024-A	180	50	2028-01-20	Estante A1	0.50
3	2	IBU-2024-B	150	20	2027-07-20	Estante A2	0.80
4	2	IBU-2024-A	8	20	2028-01-20	Estante A2	0.75
5	3	AMOX-2024-A	70	30	2027-01-20	Estante B1	1.20
6	4	METF-2024-A	12	25	2027-07-20	Estante B2	1.50
7	5	OMEP-2023-B	50	20	2027-01-20	Estante C1	0.90
8	5	OMEP-2024-A	80	20	2026-08-04	Estante C1	1.00
9	6	LOSA-2024-A	60	15	2027-07-20	Estante C2	2.00
10	7	PRED-2024-A	90	10	2027-07-20	Estante D1	0.65
11	7	PRED-2023-A	40	10	2025-10-20	Estante D1	0.60
12	9	DICL-2024-A	0	15	2027-07-20	Estante E1	0.90
13	10	AZIT-2024-A	75	20	2027-04-20	Estante E2	3.00
14	11	SALB-2024-A	50	10	2028-01-20	Estante F1	4.50
15	12	RANI-2024-A	40	10	2027-07-20	Estante F2	1.20
16	13	CIPR-2024-A	30	10	2027-10-20	Estante F3	2.80
17	13	LOTE-1-1	12	10	2027-07-20	\N	12.00
\.


--
-- Data for Name: medicacion_administrada; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medicacion_administrada (id, hospitalizacion_id, enfermera_id, medicamento_id, dosis, fecha_hora, observaciones) FROM stdin;
1	1	1	3	500mg cada 8 horas via oral	2026-07-18 13:12:56.108669	Primera dosis hospitalaria — neumonia adquirida en comunidad
\.


--
-- Data for Name: medicamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medicamento (id, nombre, principio_activo, presentacion, concentracion, laboratorio, activo) FROM stdin;
1	Paracetamol	Paracetamol	Comprimido	500mg	Laboratorios Venezolados	t
2	Ibuprofeno	Ibuprofeno	Comprimido	400mg	Laboratorios Venezolados	t
3	Amoxicilina	Amoxicilina	Capsula	500mg	Distribuidora Farmaceutica SA	t
4	Metformina	Clorhidrato de metformina	Comprimido	850mg	Importadora Medica CA	t
5	Omeprazol	Omeprazol	Capsula	20mg	Laboratorios Venezolados	t
6	Losartan	Potasio de losartan	Comprimido	50mg	Importadora Medica CA	t
7	Prednisona	Prednisona	Comprimido	5mg	Distribuidora Farmaceutica SA	t
8	Naproxeno	Naproxeno sodico	Comprimido	250mg	Laboratorios Venezolados	t
9	Diclofenaco	Diclofenaco sodico	Comprimido	50mg	Importadora Medica CA	t
10	Azitromicina	Azitromicina	Comprimido	500mg	Distribuidora Farmaceutica SA	t
11	Salbutamol	Salbutamol	Aerosol	100mcg	Distribuidora Farmaceutica SA	t
12	Ranitidina	Ranitidina	Comprimido	150mg	Laboratorios Venezolados	t
13	Ciprofloxacino	Ciprofloxacino	Comprimido	500mg	Importadora Medica CA	t
\.


--
-- Data for Name: medico; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medico (id, ci, nombre, apellido, especialidad, telefono, email, horario_atencion, activo) FROM stdin;
1	V-11111111	Carlos	Rodriguez	Medicina General	0412-1234567	carlos.rodriguez@siih.hospital	{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}	t
2	V-22222222	Maria	Gonzalez	Pediatria	0412-2345678	maria.gonzalez@siih.hospital	{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}	t
3	V-33333333	Roberto	Martinez	Cardiologia	0412-3456789	roberto.martinez@siih.hospital	{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}	t
4	V-44444444	Ana	Lopez	Ginecologia	0412-4567890	ana.lopez@siih.hospital	{"lunes":["08:00-12:00","14:00-18:00"],"martes":["08:00-12:00","14:00-18:00"],"miercoles":["08:00-12:00","14:00-18:00"],"jueves":["08:00-12:00","14:00-18:00"],"viernes":["08:00-12:00","14:00-18:00"]}	t
\.


--
-- Data for Name: notificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificacion (id, paciente_id, medico_id, cita_id, tipo, asunto, mensaje, estado, fecha_envio, rol_destino, creado_en) FROM stdin;
1	1	\N	1	CITA	Cita completada	Su cita con Dr. Carlos Rodriguez ha sido completada. Diagnostico: Cefalea tensional.	ENVIADA	\N	\N	2026-07-14 13:12:56.110434
3	2	1	\N	HOSPITALIZACION	Hospitalizacion activa	El paciente Jose Hernandez se encuentra hospitalizado desde hace 3 dias. Evaluacion de alta pendiente.	PENDIENTE	\N	MEDICO	2026-07-20 13:12:56.11239
2	\N	\N	\N	STOCK_BAJO	Stock bajo: Ibuprofeno	El lote IBU-2024-A tiene 8 unidades (minimo: 20). Se requiere reposicion urgente.	ENVIADA	2026-07-20 21:28:24.937766	FARMACEUTICO	2026-07-20 13:12:56.111958
8	1	\N	\N	SISTEMA	Factura pagada	Su factura FAC-20260713-0001 ha sido pagada.	PENDIENTE	\N	\N	2026-07-20 22:30:26.251342
9	1	\N	\N	SISTEMA	Factura pagada	Su factura FAC-20260713-0001 ha sido pagada.	PENDIENTE	\N	\N	2026-07-20 22:30:26.786842
10	1	\N	\N	SISTEMA	Factura pagada	Su factura FAC-20260721-0001 ha sido pagada.	PENDIENTE	\N	\N	2026-07-20 22:32:02.67082
13	1	3	10	CITA	Cita NORMAL - 2026-12-26 11:00	Su cita con Dr(a). Martinez ha sido programada para el 2026-12-26 a las 11:00.	PENDIENTE	\N	\N	2026-07-20 23:01:53.866863
14	16	3	12	CITA	Cita NORMAL - 2026-12-27 09:00	Su cita con Dr(a). Martinez ha sido programada para el 2026-12-27 a las 09:00.	PENDIENTE	\N	\N	2026-07-20 23:38:04.997755
15	16	3	12	CANCELACION	Cita cancelada - Sun Dec 27 2026 00:00:00 GMT-0400 (hora de Bolivia) 09:00:00	Su cita del Sun Dec 27 2026 00:00:00 GMT-0400 (hora de Bolivia) a las 09:00:00 ha sido cancelada.	PENDIENTE	\N	\N	2026-07-20 23:38:05.189107
16	6	3	13	CITA	Cita NORMAL - 2026-12-28 10:00	Su cita con Dr(a). Martinez ha sido programada para el 2026-12-28 a las 10:00.	PENDIENTE	\N	\N	2026-07-21 00:05:39.64064
17	6	3	13	CANCELACION	Cita cancelada - Mon Dec 28 2026 00:00:00 GMT-0400 (hora de Bolivia) 10:00:00	Su cita del Mon Dec 28 2026 00:00:00 GMT-0400 (hora de Bolivia) a las 10:00:00 ha sido cancelada.	PENDIENTE	\N	\N	2026-07-21 00:05:39.804368
18	1	1	14	CITA	Cita NORMAL - 2026-12-29 11:00	Su cita con Dr(a). Rodriguez ha sido programada para el 2026-12-29 a las 11:00.	PENDIENTE	\N	\N	2026-07-21 00:18:38.914263
19	1	1	14	CANCELACION	Cita cancelada - Tue Dec 29 2026 00:00:00 GMT-0400 (hora de Bolivia) 11:00:00	Su cita del Tue Dec 29 2026 00:00:00 GMT-0400 (hora de Bolivia) a las 11:00:00 ha sido cancelada.	PENDIENTE	\N	\N	2026-07-21 00:18:39.507154
20	1	1	15	CITA	Cita NORMAL - 2026-12-29 14:00	Su cita con Dr(a). Rodriguez ha sido programada para el 2026-12-29 a las 14:00.	PENDIENTE	\N	\N	2026-07-21 00:18:39.708648
21	1	1	15	CANCELACION	Cita cancelada - Tue Dec 29 2026 00:00:00 GMT-0400 (hora de Bolivia) 14:00:00	Su cita del Tue Dec 29 2026 00:00:00 GMT-0400 (hora de Bolivia) a las 14:00:00 ha sido cancelada.	PENDIENTE	\N	\N	2026-07-21 00:18:39.846495
22	1	3	16	CITA	Cita NORMAL - 2000-12-12 14:30	Su cita con Dr(a). Martinez ha sido programada para el 2000-12-12 a las 14:30.	PENDIENTE	\N	\N	2026-07-21 00:20:09.046299
\.


--
-- Data for Name: paciente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paciente (id, ci, nombre, apellido, fecha_nacimiento, sexo, direccion, telefono, email, seguro_medico, registrado_por, huella_dactilar_ref, foto_rostro_ref, activo) FROM stdin;
1	V-87654321	Maria	Garcia	1992-03-15	F	Av. Libertador 1234, Caracas	0412-1111111	maria.garcia@email.com	Seguros Mercantil	1	\N	\N	t
2	V-25123456	Jose	Hernandez	1968-07-22	M	Calle 5, Edif. 8, Valencia	0414-2222222	jose.hernandez@email.com	Seguros La Previsora	1	\N	\N	t
3	V-19876543	Ana	Lopez	2004-11-30	F	Urb. El Parque, Caracas	0424-3333333	ana.lopez@email.com	\N	1	\N	\N	t
4	E-12345678	Pedro	Sanchez	2018-05-10	M	Av. Bolivar 456, Maracaibo	0412-4444444	\N	Seguros Qualitas	1	\N	\N	t
5	V-30000001	Carmen	Rodriguez	1959-01-25	F	Calle Principal 789, Barquisimeto	0416-5555555	carmen.rodriguez@email.com	Seguros Mapfre	1	\N	\N	t
7	V-12345001	Rosa	Martinez	1951-06-03	F	Av. 5 de Julio, Valencia	0420-7777777	rosa.martinez@email.com	Seguros La Previsora	1	\N	\N	t
8	V-27000001	Miguel	Torres	1996-02-18	M	Calle Norte 321, Caracas	0422-8888888	miguel.torres@email.com	Seguros Mercantil	1	\N	\N	t
9	V-29000001	Elena	Ramirez	1974-04-07	F	Urb. San Bernardino, Caracas	0424-9999999	elena.ramirez@email.com	Seguros Mapfre	1	\N	\N	t
10	V-31000001	Andres	Vargas	2007-08-20	M	Av. Principal 654, Barinas	0412-0000000	andres.vargas@email.com	\N	1	\N	\N	t
11	TEMP-1784587344797	DESCONOCIDO	DESCONOCIDO	1900-01-01	\N	\N	\N	\N	\N	3	\N	\N	f
6	V-28000001	Luis	Fernandez	1981-09-12	M	Urb. Las Mercedes, Caracas	0418-6666666	luis.fernandez@email.com	Seguros Provincial	1	\N	\N	t
15	TEMP-1784604778216	DESCONOCIDO	DESCONOCIDO	1900-01-01	\N	\N	\N	\N	\N	3	\N	\N	t
16	V-99999999	Test	Wizard	1995-06-15	M	\N	0412-9999999	\N	\N	10	\N	\N	t
\.


--
-- Data for Name: permiso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permiso (id, nombre, modulo, accion) FROM stdin;
1	Citas - Consultar	CITAS	READ
2	Citas - Gestionar	CITAS	WRITE
3	Historial - Consultar	HISTORIAL	READ
4	Historial - Editar	HISTORIAL	WRITE
5	Atencion - Consultar	ATENCION	READ
6	Atencion - Editar	ATENCION	WRITE
7	Laboratorio - Consultar	LABORATORIO	READ
8	Laboratorio - Gestionar	LABORATORIO	WRITE
9	Farmacia - Consultar	FARMACIA	READ
10	Farmacia - Gestionar	FARMACIA	WRITE
11	Hospitalizacion - Consultar	HOSPITALIZACION	READ
12	Hospitalizacion - Gestionar	HOSPITALIZACION	WRITE
13	Facturacion - Consultar	FACTURACION	READ
14	Facturacion - Gestionar	FACTURACION	WRITE
15	Compras - Consultar	COMPRAS	READ
16	Compras - Gestionar	COMPRAS	WRITE
17	Reportes - Consultar	REPORTES	READ
18	Seguridad - Consultar	SEGURIDAD	READ
19	Seguridad - Gestionar	SEGURIDAD	WRITE
20	Auditoria - Consultar	AUDITORIA	READ
21	Auditoria - Gestionar	AUDITORIA	WRITE
\.


--
-- Data for Name: proveedor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedor (id, nombre, ruc, direccion, telefono, email, activo) FROM stdin;
1	Distribuidora Farmaceutica SA	J-40123456-7	Av. Principal, Edif. 5, Caracas	+58-212-5551234	ventas@disfarmaca.ve	t
2	Laboratorios Venezolados	J-40987654-3	Zona Industrial, Nave 12, Valencia	+58-241-5559876	pedidos@labven.ve	t
3	Importadora Medica CA	J-40555111-9	Av. Libertador, Torre 3, Maracaibo	+58-261-5554321	compras@imedica.ve	t
\.


--
-- Data for Name: receta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.receta (id, atencion_id, medico_id, fecha_emision, codigo_receta, estado, dispensado_por) FROM stdin;
1	1	1	2026-07-13 13:12:56.084173	REC-20260713-0001	DISPENSADA	6
2	2	1	2026-07-15 13:12:56.098942	REC-20260715-0001	PARCIAL	6
\.


--
-- Data for Name: resultado_laboratorio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultado_laboratorio (id, examen_id, resultado, valores_referencia, observaciones, fecha_resultado, es_critico) FROM stdin;
1	1	Leucocitos 7500/mm3, Hemoglobina 14.2 g/dL, Plaquetas 250000/mm3	Leucocitos 4000-11000, Hemoglobina 12-16 g/dL, Plaquetas 150000-400000	Valores dentro de rangos normales. Sin hallazgos patologicos.	2026-07-20 13:12:56.090926	f
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rol (id, nombre, descripcion) FROM stdin;
1	ADMIN	Administrador del sistema
2	DIRECTOR	Director / Gerencia
3	MEDICO	Médico
4	ENFERMERA	Enfermera
5	FARMACEUTICO	Farmacéutico
6	TECNICO_LAB	Técnico de laboratorio
7	ADMISIONISTA	Admisionista
8	FACTURADOR	Facturador
9	PACIENTE	Paciente
\.


--
-- Data for Name: rol_permiso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rol_permiso (rol_id, permiso_id) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
1	10
1	11
1	12
1	13
1	14
1	15
1	16
1	17
1	18
1	19
1	20
1	21
2	1
2	3
2	5
2	7
2	9
2	11
2	13
2	14
2	15
2	16
2	17
2	20
3	1
3	3
3	4
3	5
3	6
3	7
3	8
3	9
3	11
3	12
7	1
7	2
7	11
4	3
4	5
4	6
4	11
4	12
5	9
5	10
5	15
5	16
6	7
6	8
8	13
8	14
9	1
9	2
9	3
9	9
9	13
4	9
7	3
7	4
7	5
9	7
\.


--
-- Data for Name: signos_vitales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.signos_vitales (id, atencion_id, hospitalizacion_id, enfermera_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_resp, saturacion_oxigeno, peso, talla) FROM stdin;
1	1	\N	1	2026-07-13 13:12:56.082164	36.8	120	80	72	16	98.0	65.00	165.00
2	2	\N	1	2026-07-15 13:12:56.09792	39.2	135	88	102	24	93.0	82.00	175.00
3	\N	1	1	2026-07-18 13:12:56.107225	38.5	130	85	95	22	94.0	82.00	175.00
4	\N	1	1	2026-07-19 13:12:56.107978	37.2	122	78	82	18	97.0	82.00	175.00
\.


--
-- Data for Name: tarifa_servicio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tarifa_servicio (id, tipo_servicio, descripcion, precio_unitario, activo) FROM stdin;
1	CONSULTA	Consulta medica general	50.00	t
2	EMERGENCIA	Atencion de emergencia	150.00	t
3	EXAMEN_LABORATORIO	Examen de laboratorio (por examen)	30.00	t
4	HOSPITALIZACION_DIA	Dia de hospitalizacion	200.00	t
\.


--
-- Data for Name: tecnico_laboratorio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tecnico_laboratorio (id, ci, nombre, apellido, telefono, email, activo) FROM stdin;
1	V-20150999	Pedro	Torres	0414-5551234	pedro.torres@hospital.com	t
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id, username, password_hash, email, ultimo_acceso, activo, creado_por, rol_id, paciente_id, medico_id, enfermera_id, farmaceutico_id, tecnico_lab_id, admisionista_id, facturador_id) FROM stdin;
3	dr_test	$2a$06$Q.OVduvWLyayZsZL74pQP.H1eBsk0esmKmfwAAyRUuEpjA1APwlpK	dr.rodriguez@hospital.com	2026-07-21 00:04:58.538148	t	1	3	\N	1	\N	\N	\N	\N	\N
4	nurse_test	$2a$06$OmNLt9AWInmuDs0kVJX2L.tbKXfafH8lTxjXsDbcPo4drxNPat8NW	ana.martinez@hospital.com	2026-07-20 13:15:50.596202	t	1	4	\N	\N	1	\N	\N	\N	\N
7	V-20333444	$2a$06$EXKkpXSbrCxfxUTHBV8VR.TWDEdi1HaS7MHdC0OiBcKtIHYij1WUS	laura.fern@hospital.com	2026-07-20 13:15:50.792548	t	1	5	\N	\N	\N	2	\N	\N	\N
8	V-20555666	$2a$06$MFzRhVvBA8FgOeUGjH3XS.CztEed21ZSxbyJ6jwISATOSWaYV5twu	carlos.mend@hospital.com	2026-07-20 13:15:50.891654	t	1	5	\N	\N	\N	3	\N	\N	\N
1	admin	$2a$06$T.SMxFXMI6XOhLyHCa2b8.oKfJF7kD7tSczkqbHFW25BH3sYRBj3K	\N	2026-07-21 00:08:01.499792	t	\N	1	\N	\N	\N	\N	\N	\N	\N
12	V-87654321	$2a$06$UqLMTfErP4YLyjQ4xIwxs.Ou27qVlOkh3YxYXdgt0DcDf1p.Ebt5C	maria.garcia@email.com	2026-07-21 00:18:38.12178	t	1	9	1	\N	\N	\N	\N	\N	\N
10	adm_test	$2a$06$TtX50M2UyaBciws0svvOReDQ8QyeSUTa/utR4mkgJIajQ6ogjfxOm	diego.torres@hospital.com	2026-07-21 00:18:38.257189	t	1	7	\N	\N	\N	\N	\N	1	\N
13	NUEVO ADMIN	$2b$10$q87ueLnC5gqlL3BiODCKseNGWQt6zoWPzlQgEekDW4NPTs4CQH4/G	ADMIN@GMAIL.COM	2026-07-20 22:25:11.219091	t	1	1	\N	\N	\N	\N	\N	\N	\N
5	nurse2_test	$2a$06$/QgXAgsdE/ATQP3aU92k6.bS4wU3t1c0OVgp5LV02f/ElTcqkIpvS	lucia.hernandez@hospital.com	2026-07-20 18:38:08.397595	t	1	4	\N	\N	2	\N	\N	\N	\N
11	fact_test	$2a$06$FqagyXcwR8smOUSIzux.4ec6swLS7oY8C9lRWIjQ5laU/m7K0Pd5e	maria.lopez@hospital.com	2026-07-20 22:35:51.402799	t	1	8	\N	\N	\N	\N	\N	\N	1
6	V-20111222	$2a$06$Zu8iCduxOw.uIqb/YKMDp.7hQ01IrNanC9uJTFkAr0ZfE23HNAE6W	pedro.rod@hospital.com	2026-07-20 21:27:42.600999	t	1	5	\N	\N	\N	1	\N	\N	\N
2	director_test	$2a$06$Bj9YDj38T1ciQDEcg/lXeuW1KUsiXIAMxAqqG3y5VLYzIXi5UIlNi	director@siih.hospital	2026-07-20 23:30:48.749822	t	1	2	\N	\N	\N	\N	\N	\N	\N
9	lab_test	$2a$06$7rgWzBquGu4rhc1ZHqky9.6ZbYtCqLLjn9dp8lB5b5PkFKdEPHtSe	pedro.torres@hospital.com	2026-07-20 23:33:47.105296	t	1	6	\N	\N	\N	\N	1	\N	\N
\.


--
-- Name: admisionista_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admisionista_id_seq', 2, true);


--
-- Name: alergia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alergia_id_seq', 3, true);


--
-- Name: antecedente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.antecedente_id_seq', 5, true);


--
-- Name: atencion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.atencion_id_seq', 5, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 31, true);


--
-- Name: cama_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cama_id_seq', 27, true);


--
-- Name: cita_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cita_id_seq', 16, true);


--
-- Name: compra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compra_id_seq', 1, true);


--
-- Name: detalle_compra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_compra_id_seq', 1, true);


--
-- Name: detalle_factura_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_factura_id_seq', 4, true);


--
-- Name: detalle_receta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_receta_id_seq', 3, true);


--
-- Name: enfermera_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enfermera_id_seq', 4, true);


--
-- Name: examen_laboratorio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.examen_laboratorio_id_seq', 3, true);


--
-- Name: factura_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.factura_id_seq', 3, true);


--
-- Name: facturador_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.facturador_id_seq', 2, true);


--
-- Name: farmaceutico_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.farmaceutico_id_seq', 6, true);


--
-- Name: historial_clinico_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_clinico_id_seq', 25, true);


--
-- Name: hospitalizacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospitalizacion_id_seq', 2, true);


--
-- Name: inventario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventario_id_seq', 17, true);


--
-- Name: medicacion_administrada_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medicacion_administrada_id_seq', 1, true);


--
-- Name: medicamento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medicamento_id_seq', 13, true);


--
-- Name: medico_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medico_id_seq', 8, true);


--
-- Name: notificacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notificacion_id_seq', 22, true);


--
-- Name: paciente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paciente_id_seq', 16, true);


--
-- Name: permiso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permiso_id_seq', 21, true);


--
-- Name: proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedor_id_seq', 6, true);


--
-- Name: receta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.receta_id_seq', 2, true);


--
-- Name: resultado_laboratorio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultado_laboratorio_id_seq', 1, true);


--
-- Name: rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rol_id_seq', 9, true);


--
-- Name: signos_vitales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.signos_vitales_id_seq', 4, true);


--
-- Name: tarifa_servicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tarifa_servicio_id_seq', 4, true);


--
-- Name: tecnico_laboratorio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tecnico_laboratorio_id_seq', 2, true);


--
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_id_seq', 13, true);


--
-- Name: admisionista admisionista_ci_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admisionista
    ADD CONSTRAINT admisionista_ci_key UNIQUE (ci);


--
-- Name: admisionista admisionista_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admisionista
    ADD CONSTRAINT admisionista_pkey PRIMARY KEY (id);


--
-- Name: alergia alergia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alergia
    ADD CONSTRAINT alergia_pkey PRIMARY KEY (id);


--
-- Name: antecedente antecedente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.antecedente
    ADD CONSTRAINT antecedente_pkey PRIMARY KEY (id);


--
-- Name: atencion atencion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atencion
    ADD CONSTRAINT atencion_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: cama cama_numero_cama_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cama
    ADD CONSTRAINT cama_numero_cama_key UNIQUE (numero_cama);


--
-- Name: cama cama_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cama
    ADD CONSTRAINT cama_pkey PRIMARY KEY (id);


--
-- Name: cita cita_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_pkey PRIMARY KEY (id);


--
-- Name: compra compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_pkey PRIMARY KEY (id);


--
-- Name: detalle_compra detalle_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT detalle_compra_pkey PRIMARY KEY (id);


--
-- Name: detalle_factura detalle_factura_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_factura
    ADD CONSTRAINT detalle_factura_pkey PRIMARY KEY (id);


--
-- Name: detalle_receta detalle_receta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_receta
    ADD CONSTRAINT detalle_receta_pkey PRIMARY KEY (id);


--
-- Name: enfermera enfermera_ci_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enfermera
    ADD CONSTRAINT enfermera_ci_key UNIQUE (ci);


--
-- Name: enfermera enfermera_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enfermera
    ADD CONSTRAINT enfermera_pkey PRIMARY KEY (id);


--
-- Name: examen_laboratorio examen_laboratorio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.examen_laboratorio
    ADD CONSTRAINT examen_laboratorio_pkey PRIMARY KEY (id);


--
-- Name: factura factura_numero_factura_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_numero_factura_key UNIQUE (numero_factura);


--
-- Name: factura factura_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_pkey PRIMARY KEY (id);


--
-- Name: facturador facturador_ci_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturador
    ADD CONSTRAINT facturador_ci_key UNIQUE (ci);


--
-- Name: facturador facturador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturador
    ADD CONSTRAINT facturador_pkey PRIMARY KEY (id);


--
-- Name: farmaceutico farmaceutico_ci_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farmaceutico
    ADD CONSTRAINT farmaceutico_ci_key UNIQUE (ci);


--
-- Name: farmaceutico farmaceutico_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farmaceutico
    ADD CONSTRAINT farmaceutico_pkey PRIMARY KEY (id);


--
-- Name: historial_clinico historial_clinico_paciente_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_clinico
    ADD CONSTRAINT historial_clinico_paciente_id_key UNIQUE (paciente_id);


--
-- Name: historial_clinico historial_clinico_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_clinico
    ADD CONSTRAINT historial_clinico_pkey PRIMARY KEY (id);


--
-- Name: hospitalizacion hospitalizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitalizacion
    ADD CONSTRAINT hospitalizacion_pkey PRIMARY KEY (id);


--
-- Name: inventario inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (id);


--
-- Name: medicacion_administrada medicacion_administrada_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicacion_administrada
    ADD CONSTRAINT medicacion_administrada_pkey PRIMARY KEY (id);


--
-- Name: medicamento medicamento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicamento
    ADD CONSTRAINT medicamento_pkey PRIMARY KEY (id);


--
-- Name: medico medico_ci_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medico
    ADD CONSTRAINT medico_ci_key UNIQUE (ci);


--
-- Name: medico medico_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medico
    ADD CONSTRAINT medico_pkey PRIMARY KEY (id);


--
-- Name: notificacion notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_pkey PRIMARY KEY (id);


--
-- Name: paciente paciente_ci_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_ci_key UNIQUE (ci);


--
-- Name: paciente paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_pkey PRIMARY KEY (id);


--
-- Name: permiso permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permiso
    ADD CONSTRAINT permiso_pkey PRIMARY KEY (id);


--
-- Name: proveedor proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_pkey PRIMARY KEY (id);


--
-- Name: proveedor proveedor_ruc_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_ruc_key UNIQUE (ruc);


--
-- Name: receta receta_codigo_receta_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receta
    ADD CONSTRAINT receta_codigo_receta_key UNIQUE (codigo_receta);


--
-- Name: receta receta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receta
    ADD CONSTRAINT receta_pkey PRIMARY KEY (id);


--
-- Name: resultado_laboratorio resultado_laboratorio_examen_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultado_laboratorio
    ADD CONSTRAINT resultado_laboratorio_examen_id_key UNIQUE (examen_id);


--
-- Name: resultado_laboratorio resultado_laboratorio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultado_laboratorio
    ADD CONSTRAINT resultado_laboratorio_pkey PRIMARY KEY (id);


--
-- Name: rol rol_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_nombre_key UNIQUE (nombre);


--
-- Name: rol_permiso rol_permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_pkey PRIMARY KEY (rol_id, permiso_id);


--
-- Name: rol rol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT rol_pkey PRIMARY KEY (id);


--
-- Name: signos_vitales signos_vitales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signos_vitales
    ADD CONSTRAINT signos_vitales_pkey PRIMARY KEY (id);


--
-- Name: tarifa_servicio tarifa_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarifa_servicio
    ADD CONSTRAINT tarifa_servicio_pkey PRIMARY KEY (id);


--
-- Name: tarifa_servicio tarifa_servicio_tipo_servicio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarifa_servicio
    ADD CONSTRAINT tarifa_servicio_tipo_servicio_key UNIQUE (tipo_servicio);


--
-- Name: tecnico_laboratorio tecnico_laboratorio_ci_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tecnico_laboratorio
    ADD CONSTRAINT tecnico_laboratorio_ci_key UNIQUE (ci);


--
-- Name: tecnico_laboratorio tecnico_laboratorio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tecnico_laboratorio
    ADD CONSTRAINT tecnico_laboratorio_pkey PRIMARY KEY (id);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: usuario usuario_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_username_key UNIQUE (username);


--
-- Name: alergia alergia_historial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alergia
    ADD CONSTRAINT alergia_historial_id_fkey FOREIGN KEY (historial_id) REFERENCES public.historial_clinico(id);


--
-- Name: alergia alergia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alergia
    ADD CONSTRAINT alergia_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: antecedente antecedente_historial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.antecedente
    ADD CONSTRAINT antecedente_historial_id_fkey FOREIGN KEY (historial_id) REFERENCES public.historial_clinico(id);


--
-- Name: antecedente antecedente_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.antecedente
    ADD CONSTRAINT antecedente_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: atencion atencion_cita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atencion
    ADD CONSTRAINT atencion_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES public.cita(id);


--
-- Name: atencion atencion_historial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atencion
    ADD CONSTRAINT atencion_historial_id_fkey FOREIGN KEY (historial_id) REFERENCES public.historial_clinico(id);


--
-- Name: atencion atencion_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.atencion
    ADD CONSTRAINT atencion_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.medico(id);


--
-- Name: auditoria auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: cita cita_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuario(id);


--
-- Name: cita cita_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.medico(id);


--
-- Name: cita cita_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id);


--
-- Name: compra compra_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedor(id);


--
-- Name: compra compra_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: detalle_compra detalle_compra_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT detalle_compra_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compra(id);


--
-- Name: detalle_compra detalle_compra_medicamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT detalle_compra_medicamento_id_fkey FOREIGN KEY (medicamento_id) REFERENCES public.medicamento(id);


--
-- Name: detalle_factura detalle_factura_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_factura
    ADD CONSTRAINT detalle_factura_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.factura(id);


--
-- Name: detalle_receta detalle_receta_medicamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_receta
    ADD CONSTRAINT detalle_receta_medicamento_id_fkey FOREIGN KEY (medicamento_id) REFERENCES public.medicamento(id);


--
-- Name: detalle_receta detalle_receta_receta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_receta
    ADD CONSTRAINT detalle_receta_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES public.receta(id);


--
-- Name: examen_laboratorio examen_laboratorio_atencion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.examen_laboratorio
    ADD CONSTRAINT examen_laboratorio_atencion_id_fkey FOREIGN KEY (atencion_id) REFERENCES public.atencion(id);


--
-- Name: examen_laboratorio examen_laboratorio_tecnico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.examen_laboratorio
    ADD CONSTRAINT examen_laboratorio_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.usuario(id);


--
-- Name: factura factura_atencion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_atencion_id_fkey FOREIGN KEY (atencion_id) REFERENCES public.atencion(id);


--
-- Name: factura factura_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id);


--
-- Name: factura factura_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura
    ADD CONSTRAINT factura_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- Name: paciente fk_paciente_registrado_por; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT fk_paciente_registrado_por FOREIGN KEY (registrado_por) REFERENCES public.usuario(id);


--
-- Name: historial_clinico historial_clinico_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_clinico
    ADD CONSTRAINT historial_clinico_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id);


--
-- Name: hospitalizacion hospitalizacion_atencion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitalizacion
    ADD CONSTRAINT hospitalizacion_atencion_id_fkey FOREIGN KEY (atencion_id) REFERENCES public.atencion(id);


--
-- Name: hospitalizacion hospitalizacion_cama_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitalizacion
    ADD CONSTRAINT hospitalizacion_cama_id_fkey FOREIGN KEY (cama_id) REFERENCES public.cama(id);


--
-- Name: hospitalizacion hospitalizacion_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitalizacion
    ADD CONSTRAINT hospitalizacion_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.medico(id);


--
-- Name: hospitalizacion hospitalizacion_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitalizacion
    ADD CONSTRAINT hospitalizacion_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id);


--
-- Name: inventario inventario_medicamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_medicamento_id_fkey FOREIGN KEY (medicamento_id) REFERENCES public.medicamento(id);


--
-- Name: medicacion_administrada medicacion_administrada_enfermera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicacion_administrada
    ADD CONSTRAINT medicacion_administrada_enfermera_id_fkey FOREIGN KEY (enfermera_id) REFERENCES public.enfermera(id);


--
-- Name: medicacion_administrada medicacion_administrada_hospitalizacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicacion_administrada
    ADD CONSTRAINT medicacion_administrada_hospitalizacion_id_fkey FOREIGN KEY (hospitalizacion_id) REFERENCES public.hospitalizacion(id);


--
-- Name: medicacion_administrada medicacion_administrada_medicamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicacion_administrada
    ADD CONSTRAINT medicacion_administrada_medicamento_id_fkey FOREIGN KEY (medicamento_id) REFERENCES public.medicamento(id);


--
-- Name: notificacion notificacion_cita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES public.cita(id);


--
-- Name: notificacion notificacion_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.medico(id);


--
-- Name: notificacion notificacion_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id);


--
-- Name: receta receta_atencion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receta
    ADD CONSTRAINT receta_atencion_id_fkey FOREIGN KEY (atencion_id) REFERENCES public.atencion(id);


--
-- Name: receta receta_dispensado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receta
    ADD CONSTRAINT receta_dispensado_por_fkey FOREIGN KEY (dispensado_por) REFERENCES public.usuario(id);


--
-- Name: receta receta_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receta
    ADD CONSTRAINT receta_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.medico(id);


--
-- Name: resultado_laboratorio resultado_laboratorio_examen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultado_laboratorio
    ADD CONSTRAINT resultado_laboratorio_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES public.examen_laboratorio(id);


--
-- Name: rol_permiso rol_permiso_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permiso(id);


--
-- Name: rol_permiso rol_permiso_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT rol_permiso_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.rol(id);


--
-- Name: signos_vitales signos_vitales_atencion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signos_vitales
    ADD CONSTRAINT signos_vitales_atencion_id_fkey FOREIGN KEY (atencion_id) REFERENCES public.atencion(id);


--
-- Name: signos_vitales signos_vitales_enfermera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signos_vitales
    ADD CONSTRAINT signos_vitales_enfermera_id_fkey FOREIGN KEY (enfermera_id) REFERENCES public.enfermera(id);


--
-- Name: signos_vitales signos_vitales_hospitalizacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.signos_vitales
    ADD CONSTRAINT signos_vitales_hospitalizacion_id_fkey FOREIGN KEY (hospitalizacion_id) REFERENCES public.hospitalizacion(id);


--
-- Name: usuario usuario_admisionista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_admisionista_id_fkey FOREIGN KEY (admisionista_id) REFERENCES public.admisionista(id);


--
-- Name: usuario usuario_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuario(id);


--
-- Name: usuario usuario_enfermera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_enfermera_id_fkey FOREIGN KEY (enfermera_id) REFERENCES public.enfermera(id);


--
-- Name: usuario usuario_facturador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_facturador_id_fkey FOREIGN KEY (facturador_id) REFERENCES public.facturador(id);


--
-- Name: usuario usuario_farmaceutico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_farmaceutico_id_fkey FOREIGN KEY (farmaceutico_id) REFERENCES public.farmaceutico(id);


--
-- Name: usuario usuario_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.medico(id);


--
-- Name: usuario usuario_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.paciente(id);


--
-- Name: usuario usuario_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.rol(id);


--
-- Name: usuario usuario_tecnico_lab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_tecnico_lab_id_fkey FOREIGN KEY (tecnico_lab_id) REFERENCES public.tecnico_laboratorio(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 1AgwsMHZoamGo6bEabUStlUJInMdeLNGg0AQkaZdtlba0KtWRSddtkwA3on60x7

