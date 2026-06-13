USE ISO;
GO

PRINT '=== MIGRACION: Formularios Asociados entre Certificaciones ===';
PRINT 'Creando estructura para asociar formularios entre certificaciones...';
GO

-- =============================================
-- TABLA: TR_REQUISITOS_REGISTROS_ASOCIADOS
-- Descripción: Relaciona registros de documentos asociados entre requisitos de diferentes certificaciones
-- Permite que un registro de un requisito pueda ser compartido/asociado con otro requisito
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_REQUISITOS_REGISTROS_ASOCIADOS]') AND type in (N'U'))
BEGIN
    CREATE TABLE TR_REQUISITOS_REGISTROS_ASOCIADOS (
        cdAsociacion INT IDENTITY(1,1) PRIMARY KEY,
        cdRequisito INT NOT NULL, -- Requisito que tiene la asociación
        cdCertificacion INT NOT NULL, -- Certificación del requisito
        cdRegistroDocumentoOrigen INT NOT NULL, -- Registro original que se está asociando
        cdCertificacionOrigen INT NOT NULL, -- Certificación de origen del registro
        cdRequisitoOrigen INT NOT NULL, -- Requisito de origen del registro
        feCreacion DATETIME DEFAULT GETDATE(),
        cdUsuarioCreacion INT NULL,
        CONSTRAINT FK_RegAsociados_Requisito FOREIGN KEY (cdRequisito) REFERENCES TD_REQUISITOS(cdRequisito),
        CONSTRAINT FK_RegAsociados_Certificacion FOREIGN KEY (cdCertificacion) REFERENCES TD_CERTIFICACIONES(cdCertificacion),
        CONSTRAINT FK_RegAsociados_RegistroOrigen FOREIGN KEY (cdRegistroDocumentoOrigen) REFERENCES TD_REGISTROS_DOCUMENTOS(cdRegistroDocumento),
        CONSTRAINT FK_RegAsociados_CertificacionOrigen FOREIGN KEY (cdCertificacionOrigen) REFERENCES TD_CERTIFICACIONES(cdCertificacion),
        CONSTRAINT FK_RegAsociados_RequisitoOrigen FOREIGN KEY (cdRequisitoOrigen) REFERENCES TD_REQUISITOS(cdRequisito)
    );
    PRINT '✓ Tabla TR_REQUISITOS_REGISTROS_ASOCIADOS creada';
END
ELSE
    PRINT '- Tabla TR_REQUISITOS_REGISTROS_ASOCIADOS ya existe';
GO

-- =============================================
-- ÍNDICES para mejor rendimiento
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_RegAsociados_Requisito' AND object_id = OBJECT_ID('TR_REQUISITOS_REGISTROS_ASOCIADOS'))
BEGIN
    CREATE INDEX IDX_RegAsociados_Requisito ON TR_REQUISITOS_REGISTROS_ASOCIADOS(cdRequisito, cdCertificacion);
    PRINT '✓ Índice IDX_RegAsociados_Requisito creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_RegAsociados_RegistroOrigen' AND object_id = OBJECT_ID('TR_REQUISITOS_REGISTROS_ASOCIADOS'))
BEGIN
    CREATE INDEX IDX_RegAsociados_RegistroOrigen ON TR_REQUISITOS_REGISTROS_ASOCIADOS(cdRegistroDocumentoOrigen);
    PRINT '✓ Índice IDX_RegAsociados_RegistroOrigen creado';
END

-- =============================================
-- Restricción para evitar duplicados
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_RegAsociados_Requisito_Registro' AND object_id = OBJECT_ID('TR_REQUISITOS_REGISTROS_ASOCIADOS'))
BEGIN
    CREATE UNIQUE INDEX UQ_RegAsociados_Requisito_Registro 
    ON TR_REQUISITOS_REGISTROS_ASOCIADOS(cdRequisito, cdCertificacion, cdRegistroDocumentoOrigen);
    PRINT '✓ Índice único UQ_RegAsociados_Requisito_Registro creado';
END

PRINT '';
PRINT '=== MIGRACION COMPLETADA ===';
PRINT 'La estructura para formularios asociados ha sido creada exitosamente.';
GO
