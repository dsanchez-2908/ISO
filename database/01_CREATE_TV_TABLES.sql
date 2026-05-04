/* ============================================================
   SISTEMA DE GESTION DE CALIDAD - ISO
   Script: Tablas de Valores (TV_)
   Descripción: Tablas maestras con valores fijos del sistema
   Fecha: 2026-05-02
============================================================ */

USE ISO;
GO

-- ============================================================
-- TV_ESTADOS: Estados generales del sistema
-- ============================================================
IF OBJECT_ID('TV_ESTADOS', 'U') IS NOT NULL
    DROP TABLE TV_ESTADOS;
GO

CREATE TABLE TV_ESTADOS (
    cdEstado INT IDENTITY(1,1) PRIMARY KEY,
    dsEstado VARCHAR(50) NOT NULL,
    dsDescripcion VARCHAR(250),
    dsGrupo VARCHAR(50), -- Para agrupar estados por contexto
    nuOrden INT DEFAULT 0,
    snActivo BIT DEFAULT 1,
    CONSTRAINT UK_TV_ESTADOS_dsEstado UNIQUE (dsEstado, dsGrupo)
);
GO

-- ============================================================
-- TV_PAISES: Catálogo de países
-- ============================================================
IF OBJECT_ID('TV_PAISES', 'U') IS NOT NULL
    DROP TABLE TV_PAISES;
GO

CREATE TABLE TV_PAISES (
    cdPais INT IDENTITY(1,1) PRIMARY KEY,
    dsPais VARCHAR(100) NOT NULL,
    dsCodigoISO2 CHAR(2),
    dsCodigoISO3 CHAR(3),
    nuOrden INT DEFAULT 0,
    snActivo BIT DEFAULT 1,
    CONSTRAINT UK_TV_PAISES_dsPais UNIQUE (dsPais)
);
GO

-- ============================================================
-- TV_PROVINCIAS: Provincias/Estados por país
-- ============================================================
IF OBJECT_ID('TV_PROVINCIAS', 'U') IS NOT NULL
    DROP TABLE TV_PROVINCIAS;
GO

CREATE TABLE TV_PROVINCIAS (
    cdProvincia INT IDENTITY(1,1) PRIMARY KEY,
    cdPais INT NOT NULL,
    dsProvincia VARCHAR(100) NOT NULL,
    dsCodigo VARCHAR(10),
    nuOrden INT DEFAULT 0,
    snActivo BIT DEFAULT 1,
    CONSTRAINT FK_TV_PROVINCIAS_Pais FOREIGN KEY (cdPais) REFERENCES TV_PAISES(cdPais),
    CONSTRAINT UK_TV_PROVINCIAS_Provincia UNIQUE (cdPais, dsProvincia)
);
GO

-- ============================================================
-- TV_CONDICION_VENTA: Condiciones de venta
-- ============================================================
IF OBJECT_ID('TV_CONDICION_VENTA', 'U') IS NOT NULL
    DROP TABLE TV_CONDICION_VENTA;
GO

CREATE TABLE TV_CONDICION_VENTA (
    cdCondicionVenta INT IDENTITY(1,1) PRIMARY KEY,
    dsCondicionVenta VARCHAR(100) NOT NULL,
    dsDescripcion VARCHAR(250),
    nuDias INT DEFAULT 0,
    snActivo BIT DEFAULT 1,
    CONSTRAINT UK_TV_CONDICION_VENTA UNIQUE (dsCondicionVenta)
);
GO

-- ============================================================
-- TV_IVA: Condiciones de IVA
-- ============================================================
IF OBJECT_ID('TV_IVA', 'U') IS NOT NULL
    DROP TABLE TV_IVA;
GO

CREATE TABLE TV_IVA (
    cdIVA INT IDENTITY(1,1) PRIMARY KEY,
    dsIVA VARCHAR(100) NOT NULL,
    nuPorcentaje DECIMAL(5,2) DEFAULT 0,
    snActivo BIT DEFAULT 1,
    CONSTRAINT UK_TV_IVA UNIQUE (dsIVA)
);
GO

-- ============================================================
-- TV_MODALIDAD_TRABAJO: Modalidades de trabajo
-- ============================================================
IF OBJECT_ID('TV_MODALIDAD_TRABAJO', 'U') IS NOT NULL
    DROP TABLE TV_MODALIDAD_TRABAJO;
GO

CREATE TABLE TV_MODALIDAD_TRABAJO (
    cdModalidadTrabajo INT IDENTITY(1,1) PRIMARY KEY,
    dsModalidadTrabajo VARCHAR(100) NOT NULL,
    dsDescripcion VARCHAR(250),
    snActivo BIT DEFAULT 1,
    CONSTRAINT UK_TV_MODALIDAD_TRABAJO UNIQUE (dsModalidadTrabajo)
);
GO

-- ============================================================
-- TV_TIPOS_SERVICIOS: Tipos de servicios
-- ============================================================
IF OBJECT_ID('TV_TIPOS_SERVICIOS', 'U') IS NOT NULL
    DROP TABLE TV_TIPOS_SERVICIOS;
GO

CREATE TABLE TV_TIPOS_SERVICIOS (
    cdTipoServicio INT IDENTITY(1,1) PRIMARY KEY,
    dsTipoServicio VARCHAR(100) NOT NULL,
    dsDescripcion VARCHAR(250),
    snActivo BIT DEFAULT 1,
    CONSTRAINT UK_TV_TIPOS_SERVICIOS UNIQUE (dsTipoServicio)
);
GO

-- ============================================================
-- TV_ESTADO_CIVIL: Estados civiles
-- ============================================================
IF OBJECT_ID('TV_ESTADO_CIVIL', 'U') IS NOT NULL
    DROP TABLE TV_ESTADO_CIVIL;
GO

CREATE TABLE TV_ESTADO_CIVIL (
    cdEstadoCivil INT IDENTITY(1,1) PRIMARY KEY,
    dsEstadoCivil VARCHAR(50) NOT NULL,
    snActivo BIT DEFAULT 1,
    CONSTRAINT UK_TV_ESTADO_CIVIL UNIQUE (dsEstadoCivil)
);
GO

-- ============================================================
-- TV_TIPOS_USUARIO: Tipos de usuario del sistema
-- ============================================================
IF OBJECT_ID('TV_TIPOS_USUARIO', 'U') IS NOT NULL
    DROP TABLE TV_TIPOS_USUARIO;
GO

CREATE TABLE TV_TIPOS_USUARIO (
    cdTipoUsuario INT IDENTITY(1,1) PRIMARY KEY,
    dsTipoUsuario VARCHAR(50) NOT NULL,
    dsDescripcion VARCHAR(250),
    CONSTRAINT UK_TV_TIPOS_USUARIO UNIQUE (dsTipoUsuario)
);
GO

-- ============================================================
-- TV_TIPOS_CAMPO: Tipos de campos para templates
-- ============================================================
IF OBJECT_ID('TV_TIPOS_CAMPO', 'U') IS NOT NULL
    DROP TABLE TV_TIPOS_CAMPO;
GO

CREATE TABLE TV_TIPOS_CAMPO (
    cdTipoCampo INT IDENTITY(1,1) PRIMARY KEY,
    dsTipoCampo VARCHAR(50) NOT NULL,
    dsDescripcion VARCHAR(250),
    CONSTRAINT UK_TV_TIPOS_CAMPO UNIQUE (dsTipoCampo)
);
GO

-- ============================================================
-- TV_TIPOS_DOCUMENTO: Tipos de documento para templates
-- ============================================================
IF OBJECT_ID('TV_TIPOS_DOCUMENTO', 'U') IS NOT NULL
    DROP TABLE TV_TIPOS_DOCUMENTO;
GO

CREATE TABLE TV_TIPOS_DOCUMENTO (
    cdTipoDocumento INT IDENTITY(1,1) PRIMARY KEY,
    dsTipoDocumento VARCHAR(50) NOT NULL,
    dsDescripcion VARCHAR(250),
    CONSTRAINT UK_TV_TIPOS_DOCUMENTO UNIQUE (dsTipoDocumento)
);
GO

PRINT '✓ Tablas de Valores (TV_) creadas exitosamente';
GO
