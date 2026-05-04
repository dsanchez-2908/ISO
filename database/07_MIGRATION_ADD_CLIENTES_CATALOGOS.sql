/* ============================================================
   SISTEMA DE GESTION DE CALIDAD - ISO
   Script: Migración - Agregar tablas catalogo para clientes
   Descripción: TV_CONDICION_VENTA, TD_TIPOS_SERVICIOS, TV_MODALIDAD_TRABAJO
   Fecha: 2026-05-02
============================================================ */

USE ISO;
GO

-- ============================================================
-- TV_CONDICION_VENTA: Catálogo de condiciones de venta
-- ============================================================
IF OBJECT_ID('TV_CONDICION_VENTA', 'U') IS NOT NULL
BEGIN
    PRINT '⚠ La tabla TV_CONDICION_VENTA ya existe, se eliminará y recreará';
    DROP TABLE TV_CONDICION_VENTA;
END
GO

CREATE TABLE TV_CONDICION_VENTA (
    cdCondicionVenta INT IDENTITY(1,1) PRIMARY KEY,
    dsCondicionVenta VARCHAR(100) NOT NULL,
    snHabilitado VARCHAR(2) NOT NULL DEFAULT 'SI'
);
GO

-- Insertar datos iniciales
INSERT INTO TV_CONDICION_VENTA (dsCondicionVenta, snHabilitado) VALUES
('Condición de Venta 1', 'SI'),
('Condición de Venta 2', 'SI'),
('Condición de Venta 3', 'SI');
GO

PRINT '✓ Tabla TV_CONDICION_VENTA creada con 3 registros';
GO

-- ============================================================
-- TD_TIPOS_SERVICIOS: Catálogo de tipos de servicios
-- ============================================================
IF OBJECT_ID('TD_TIPOS_SERVICIOS', 'U') IS NOT NULL
BEGIN
    PRINT '⚠ La tabla TD_TIPOS_SERVICIOS ya existe, se eliminará y recreará';
    DROP TABLE TD_TIPOS_SERVICIOS;
END
GO

CREATE TABLE TD_TIPOS_SERVICIOS (
    cdTipoServicio INT IDENTITY(1,1) PRIMARY KEY,
    dsTipoServicio VARCHAR(100) NOT NULL,
    snHabilitado VARCHAR(2) NOT NULL DEFAULT 'SI'
);
GO

-- Insertar datos iniciales
INSERT INTO TD_TIPOS_SERVICIOS (dsTipoServicio, snHabilitado) VALUES
('IMPLEMENTACIÓN DE NORMAS ISO', 'SI'),
('PLANIFICACIÓN ESTRATÉGICA', 'SI'),
('GESTIÓN DE AUDITORIAS INTERNAS', 'SI'),
('AUDITORIA DE CUMPLIMIENTO DE SERVICIOS TERCERIZADOS/CONTRATISTAS', 'SI'),
('ENCUESTA DE SATISFACCION DE CLIENTES', 'SI'),
('ENCUESTA DE SATISFACCION DE PROVEEDORES CRÍTICOS', 'SI'),
('PROCESOS DE SELECCIÓN DE PERSONAL', 'SI'),
('PROGRAMAS DE SEGURIDAD', 'SI'),
('PROGRAMAS DE INTEGRIDAD', 'SI'),
('GESTIÓN POR PROCESOS Y OBJETIVOS', 'SI'),
('GESTIÓN DE RIESGOS', 'SI'),
('COACHING ONTOLÓGICO', 'SI'),
('LIDERAZGO', 'SI'),
('INSPECCIONES DE SEGURIDAD', 'SI'),
('CURSOS - CAPACITACION - ENTRENAMIENTO del PERSONAL', 'SI'),
('INVESTIGACION DE ACCIDENTES', 'SI'),
('MEDICIONES AMBIENTALES', 'SI'),
('PLANES DE EVACUACIÓN', 'SI'),
('SOFTWARE CALIDAD & GESTIÓN', 'SI');
GO

PRINT '✓ Tabla TD_TIPOS_SERVICIOS creada con 19 registros';
GO

-- ============================================================
-- TV_MODALIDAD_TRABAJO: Catálogo de modalidades de trabajo
-- ============================================================
IF OBJECT_ID('TV_MODALIDAD_TRABAJO', 'U') IS NOT NULL
BEGIN
    PRINT '⚠ La tabla TV_MODALIDAD_TRABAJO ya existe, se eliminará y recreará';
    DROP TABLE TV_MODALIDAD_TRABAJO;
END
GO

CREATE TABLE TV_MODALIDAD_TRABAJO (
    cdModalidadTrabajo INT IDENTITY(1,1) PRIMARY KEY,
    dsModalidadTrabajo VARCHAR(100) NOT NULL,
    snHabilitado VARCHAR(2) NOT NULL DEFAULT 'SI'
);
GO

-- Insertar datos iniciales
INSERT INTO TV_MODALIDAD_TRABAJO (dsModalidadTrabajo, snHabilitado) VALUES
('PRESENCIAL', 'SI'),
('REMOTA', 'SI'),
('HÍBRIDA', 'SI');
GO

PRINT '✓ Tabla TV_MODALIDAD_TRABAJO creada con 3 registros';
GO
