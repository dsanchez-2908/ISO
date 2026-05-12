-- =============================================
-- Script: 13_CONFIGURACION_GLOBAL.sql
-- Descripción: Tabla de configuración global del sistema
-- Fecha: 2026-05-08
-- =============================================

USE ISO;
GO

-- Tabla de configuración global
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TD_CONFIGURACION_GLOBAL')
BEGIN
    CREATE TABLE TD_CONFIGURACION_GLOBAL (
        cdConfiguracion INT IDENTITY(1,1) PRIMARY KEY,
        dsURLBase NVARCHAR(500) NULL,
        dsLogoBase64 NVARCHAR(MAX) NULL,
        dsUsuarioTokenAditus NVARCHAR(200) NULL,
        dsClaveTokenAditus NVARCHAR(200) NULL,
        dsURLTokenAditus NVARCHAR(500) NULL,
        dsURLAgregarDocumentoAditus NVARCHAR(500) NULL,
        dsURLModificarDocumentoAditus NVARCHAR(500) NULL,
        dsURLVisorAditus NVARCHAR(500) NULL,
        feCreacion DATETIME DEFAULT GETDATE(),
        cdUsuarioCreacion INT NULL,
        feModificacion DATETIME NULL,
        cdUsuarioModificacion INT NULL
    );
    
    PRINT 'Tabla TD_CONFIGURACION_GLOBAL creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla TD_CONFIGURACION_GLOBAL ya existe';
END
GO

-- Insertar registro inicial de configuración
IF NOT EXISTS (SELECT * FROM TD_CONFIGURACION_GLOBAL)
BEGIN
    INSERT INTO TD_CONFIGURACION_GLOBAL (dsURLBase)
    VALUES ('http://localhost:3000/login/');
    
    PRINT 'Registro inicial de configuración creado';
END
GO

-- Tabla de configuración de gestor documental por empresa
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TD_EMPRESAS_GESTOR_DOCUMENTAL')
BEGIN
    CREATE TABLE TD_EMPRESAS_GESTOR_DOCUMENTAL (
        cdEmpresaGestorDocumental INT IDENTITY(1,1) PRIMARY KEY,
        cdEmpresaConsultora INT NOT NULL,
        dsCodigoLibreria NVARCHAR(100) NULL,
        dsCodigoClase NVARCHAR(100) NULL,
        feCreacion DATETIME DEFAULT GETDATE(),
        cdUsuarioCreacion INT NULL,
        feModificacion DATETIME NULL,
        cdUsuarioModificacion INT NULL,
        CONSTRAINT FK_EMPRESAS_GESTOR_DOCUMENTAL_EMPRESA FOREIGN KEY (cdEmpresaConsultora) 
            REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora)
    );
    
    PRINT 'Tabla TD_EMPRESAS_GESTOR_DOCUMENTAL creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla TD_EMPRESAS_GESTOR_DOCUMENTAL ya existe';
END
GO

-- Índices
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EMPRESAS_GESTOR_DOCUMENTAL_EMPRESA')
BEGIN
    CREATE INDEX IX_EMPRESAS_GESTOR_DOCUMENTAL_EMPRESA 
    ON TD_EMPRESAS_GESTOR_DOCUMENTAL(cdEmpresaConsultora);
    
    PRINT 'Índice IX_EMPRESAS_GESTOR_DOCUMENTAL_EMPRESA creado';
END
GO

PRINT 'Script 13_CONFIGURACION_GLOBAL.sql ejecutado exitosamente';
GO
