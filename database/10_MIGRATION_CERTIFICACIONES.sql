USE ISO;
GO

PRINT '=== MODULO DE CERTIFICACIONES ===';
PRINT 'Creando tablas para gestión de certificaciones de clientes...';
GO

-- =============================================
-- TABLA: TD_CERTIFICACIONES
-- Descripción: Procesos de certificación de clientes en normas ISO
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TD_CERTIFICACIONES]') AND type in (N'U'))
BEGIN
    CREATE TABLE TD_CERTIFICACIONES (
        cdCertificacion INT IDENTITY(1,1) PRIMARY KEY,
        cdCliente INT NOT NULL,
        cdNorma INT NOT NULL,
        cdEmpresaConsultora INT NOT NULL,
        dsCodigo VARCHAR(50) NULL,
        cdEstado INT NOT NULL DEFAULT 1, -- FK a TV_ESTADOS
        feInicio DATE NULL,
        feFin DATE NULL,
        feVencimiento DATE NULL,
        feCertificacion DATE NULL,
        dsAuditor VARCHAR(100) NULL, -- Por ahora nombre, después será cdAuditor
        dsObservaciones NVARCHAR(MAX) NULL,
        feCreacion DATETIME DEFAULT GETDATE(),
        cdUsuarioCreacion INT NULL,
        feModificacion DATETIME NULL,
        cdUsuarioModificacion INT NULL,
        CONSTRAINT FK_Certificaciones_Cliente FOREIGN KEY (cdCliente) REFERENCES TD_CLIENTES(cdCliente),
        CONSTRAINT FK_Certificaciones_Norma FOREIGN KEY (cdNorma) REFERENCES TD_NORMAS(cdNorma),
        CONSTRAINT FK_Certificaciones_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
        CONSTRAINT FK_Certificaciones_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
    );
    PRINT '✓ Tabla TD_CERTIFICACIONES creada';
END
ELSE
    PRINT '- Tabla TD_CERTIFICACIONES ya existe';
GO

-- =============================================
-- TABLA: TD_REGISTROS_DOCUMENTOS
-- Descripción: Instancias de templates de documentos completados para una certificación
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TD_REGISTROS_DOCUMENTOS]') AND type in (N'U'))
BEGIN
    CREATE TABLE TD_REGISTROS_DOCUMENTOS (
        cdRegistroDocumento INT IDENTITY(1,1) PRIMARY KEY,
        cdCertificacion INT NOT NULL,
        cdTemplateDocumento INT NOT NULL,
        cdRequisito INT NOT NULL,
        dsCodigoDocumento VARCHAR(50) NULL,
        dsNombreDocumento VARCHAR(255) NULL,
        cdEstadoDocumento INT NOT NULL DEFAULT 1, -- FK a TV_ESTADOS (Borrador, Completo, Aprobado, etc.)
        dsArchivoGenerado NVARCHAR(MAX) NULL, -- Base64 del documento Word generado
        dsNombreArchivo VARCHAR(255) NULL,
        cdDocumentoAditus INT NULL, -- ID del documento en Aditus DMS
        dsObservaciones NVARCHAR(MAX) NULL,
        feCreacion DATETIME DEFAULT GETDATE(),
        cdUsuarioCreacion INT NULL,
        feModificacion DATETIME NULL,
        cdUsuarioModificacion INT NULL,
        CONSTRAINT FK_RegistrosDoc_Certificacion FOREIGN KEY (cdCertificacion) REFERENCES TD_CERTIFICACIONES(cdCertificacion),
        CONSTRAINT FK_RegistrosDoc_Template FOREIGN KEY (cdTemplateDocumento) REFERENCES TD_TEMPLATES_DOCUMENTOS(cdTemplateDocumento),
        CONSTRAINT FK_RegistrosDoc_Requisito FOREIGN KEY (cdRequisito) REFERENCES TD_REQUISITOS(cdRequisito),
        CONSTRAINT FK_RegistrosDoc_Estado FOREIGN KEY (cdEstadoDocumento) REFERENCES TV_ESTADOS(cdEstado)
    );
    PRINT '✓ Tabla TD_REGISTROS_DOCUMENTOS creada';
END
ELSE
    PRINT '- Tabla TD_REGISTROS_DOCUMENTOS ya existe';
GO

-- =============================================
-- TABLA: TD_REGISTROS_CAMPOS_VALORES
-- Descripción: Valores de los campos dinámicos de cada registro de documento
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TD_REGISTROS_CAMPOS_VALORES]') AND type in (N'U'))
BEGIN
    CREATE TABLE TD_REGISTROS_CAMPOS_VALORES (
        cdRegistroCampoValor INT IDENTITY(1,1) PRIMARY KEY,
        cdRegistroDocumento INT NOT NULL,
        cdTemplateCampo INT NOT NULL,
        dsValor NVARCHAR(MAX) NULL, -- Valor del campo (texto, número, fecha, etc.)
        cdListaItem INT NULL, -- Si es campo tipo Lista con herencia NORMA
        cdEntidadCliente INT NULL, -- ID de la entidad del cliente (sector, puesto, empleado)
        dsEntidadTipo VARCHAR(50) NULL, -- 'SECTORES', 'PUESTOS', 'EMPLEADOS'
        feCreacion DATETIME DEFAULT GETDATE(),
        cdUsuarioCreacion INT NULL,
        feModificacion DATETIME NULL,
        cdUsuarioModificacion INT NULL,
        CONSTRAINT FK_RegCamposVal_RegistroDoc FOREIGN KEY (cdRegistroDocumento) REFERENCES TD_REGISTROS_DOCUMENTOS(cdRegistroDocumento),
        CONSTRAINT FK_RegCamposVal_TemplateCampo FOREIGN KEY (cdTemplateCampo) REFERENCES TD_TEMPLATES_CAMPOS(cdTemplateCampo),
        CONSTRAINT FK_RegCamposVal_ListaItem FOREIGN KEY (cdListaItem) REFERENCES TD_LISTAS_ITEMS(cdListaItem)
    );
    PRINT '✓ Tabla TD_REGISTROS_CAMPOS_VALORES creada';
END
ELSE
    PRINT '- Tabla TD_REGISTROS_CAMPOS_VALORES ya existe';
GO

-- =============================================
-- ÍNDICES para mejor rendimiento
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Certificaciones_Cliente' AND object_id = OBJECT_ID('TD_CERTIFICACIONES'))
BEGIN
    CREATE INDEX IDX_Certificaciones_Cliente ON TD_CERTIFICACIONES(cdCliente);
    PRINT '✓ Índice IDX_Certificaciones_Cliente creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Certificaciones_Norma' AND object_id = OBJECT_ID('TD_CERTIFICACIONES'))
BEGIN
    CREATE INDEX IDX_Certificaciones_Norma ON TD_CERTIFICACIONES(cdNorma);
    PRINT '✓ Índice IDX_Certificaciones_Norma creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_RegistrosDoc_Certificacion' AND object_id = OBJECT_ID('TD_REGISTROS_DOCUMENTOS'))
BEGIN
    CREATE INDEX IDX_RegistrosDoc_Certificacion ON TD_REGISTROS_DOCUMENTOS(cdCertificacion);
    PRINT '✓ Índice IDX_RegistrosDoc_Certificacion creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_RegCamposVal_RegistroDoc' AND object_id = OBJECT_ID('TD_REGISTROS_CAMPOS_VALORES'))
BEGIN
    CREATE INDEX IDX_RegCamposVal_RegistroDoc ON TD_REGISTROS_CAMPOS_VALORES(cdRegistroDocumento);
    PRINT '✓ Índice IDX_RegCamposVal_RegistroDoc creado';
END

GO

PRINT '';
PRINT '=== MIGRACION COMPLETADA EXITOSAMENTE ===';
PRINT 'Tablas creadas: 3 (TD_CERTIFICACIONES, TD_REGISTROS_DOCUMENTOS, TD_REGISTROS_CAMPOS_VALORES)';
PRINT 'Índices creados: 4';
GO
