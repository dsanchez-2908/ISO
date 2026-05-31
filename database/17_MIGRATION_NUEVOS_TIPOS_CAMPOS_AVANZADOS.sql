-- ============================================================
-- MIGRACION: Nuevos Tipos de Campos Avanzados
-- Descripción: Agregar tipos Archivo, Hipervínculo y Formulario
-- Fecha: 2026-05-30
-- ============================================================

USE ISO;
GO

PRINT 'Iniciando migración: Nuevos Tipos de Campos Avanzados';
GO

-- ============================================================
-- 1. Agregar nuevos tipos de campo
-- ============================================================

-- Tipo: Archivo
IF NOT EXISTS (SELECT 1 FROM TV_TIPOS_CAMPO WHERE dsTipoCampo = 'Archivo')
BEGIN
    INSERT INTO TV_TIPOS_CAMPO (dsTipoCampo, dsDescripcion)
    VALUES ('Archivo', 'Campo para subir archivos al gestor documental');
    PRINT '✓ Tipo de campo Archivo agregado';
END
ELSE
BEGIN
    PRINT '  Tipo de campo Archivo ya existe';
END
GO

-- Tipo: Hipervínculo
IF NOT EXISTS (SELECT 1 FROM TV_TIPOS_CAMPO WHERE dsTipoCampo = 'Hipervinculo')
BEGIN
    INSERT INTO TV_TIPOS_CAMPO (dsTipoCampo, dsDescripcion)
    VALUES ('Hipervinculo', 'Campo para vincular otro registro de formulario');
    PRINT '✓ Tipo de campo Hipervinculo agregado';
END
ELSE
BEGIN
    PRINT '  Tipo de campo Hipervinculo ya existe';
END
GO

-- Tipo: Formulario
IF NOT EXISTS (SELECT 1 FROM TV_TIPOS_CAMPO WHERE dsTipoCampo = 'Formulario')
BEGIN
    INSERT INTO TV_TIPOS_CAMPO (dsTipoCampo, dsDescripcion)
    VALUES ('Formulario', 'Campo que asocia un formulario hijo para carga de datos');
    PRINT '✓ Tipo de campo Formulario agregado';
END
ELSE
BEGIN
    PRINT '  Tipo de campo Formulario ya existe';
END
GO

-- ============================================================
-- 2. Agregar campos adicionales a TD_TEMPLATES_CAMPOS
-- ============================================================

-- Campo para almacenar el ID del formulario asociado (para tipo Formulario)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' AND COLUMN_NAME = 'cdFormularioAsociado')
BEGIN
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD cdFormularioAsociado INT NULL;
    
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD CONSTRAINT FK_TD_TEMPLATES_CAMPOS_FormularioAsociado 
        FOREIGN KEY (cdFormularioAsociado) REFERENCES TD_TEMPLATES_DOCUMENTOS(cdTemplateDocumento);
    
    PRINT '✓ Campo cdFormularioAsociado agregado a TD_TEMPLATES_CAMPOS';
END
ELSE
BEGIN
    PRINT '  Campo cdFormularioAsociado ya existe en TD_TEMPLATES_CAMPOS';
END
GO

-- ============================================================
-- 3. Agregar campos a TD_REGISTROS_CAMPOS_VALORES para nuevos tipos
-- ============================================================

-- Campo para almacenar ID de documento de Aditus (para tipo Archivo)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'TD_REGISTROS_CAMPOS_VALORES' AND COLUMN_NAME = 'dsAditusDocId')
BEGIN
    ALTER TABLE TD_REGISTROS_CAMPOS_VALORES
    ADD dsAditusDocId VARCHAR(100) NULL;
    
    PRINT '✓ Campo dsAditusDocId agregado a TD_REGISTROS_CAMPOS_VALORES';
END
ELSE
BEGIN
    PRINT '  Campo dsAditusDocId ya existe en TD_REGISTROS_CAMPOS_VALORES';
END
GO

-- Campo para almacenar nombre de archivo (para tipo Archivo)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'TD_REGISTROS_CAMPOS_VALORES' AND COLUMN_NAME = 'dsNombreArchivo')
BEGIN
    ALTER TABLE TD_REGISTROS_CAMPOS_VALORES
    ADD dsNombreArchivo VARCHAR(255) NULL;
    
    PRINT '✓ Campo dsNombreArchivo agregado a TD_REGISTROS_CAMPOS_VALORES';
END
ELSE
BEGIN
    PRINT '  Campo dsNombreArchivo ya existe en TD_REGISTROS_CAMPOS_VALORES';
END
GO

-- Campo para almacenar ID de registro vinculado (para tipo Hipervínculo)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'TD_REGISTROS_CAMPOS_VALORES' AND COLUMN_NAME = 'cdRegistroVinculado')
BEGIN
    ALTER TABLE TD_REGISTROS_CAMPOS_VALORES
    ADD cdRegistroVinculado INT NULL;
    
    ALTER TABLE TD_REGISTROS_CAMPOS_VALORES
    ADD CONSTRAINT FK_TD_REGISTROS_CAMPOS_VALORES_RegistroVinculado 
        FOREIGN KEY (cdRegistroVinculado) REFERENCES TD_REGISTROS_DOCUMENTOS(cdRegistroDocumento);
    
    PRINT '✓ Campo cdRegistroVinculado agregado a TD_REGISTROS_CAMPOS_VALORES';
END
ELSE
BEGIN
    PRINT '  Campo cdRegistroVinculado ya existe en TD_REGISTROS_CAMPOS_VALORES';
END
GO

-- ============================================================
-- 4. Crear tabla para registros hijos de formularios
-- ============================================================

-- Esta tabla vincula registros padre-hijo cuando un campo es de tipo "Formulario"
IF OBJECT_ID('TR_REGISTROS_FORMULARIOS_HIJOS', 'U') IS NULL
BEGIN
    CREATE TABLE TR_REGISTROS_FORMULARIOS_HIJOS (
        cdRegistroFormularioHijo INT IDENTITY(1,1) PRIMARY KEY,
        cdRegistroPadre INT NOT NULL, -- Registro principal (padre)
        cdTemplateCampo INT NOT NULL, -- Campo del tipo Formulario en el registro padre
        cdRegistroHijo INT NOT NULL, -- Registro del formulario hijo creado
        feCreacion DATETIME DEFAULT GETDATE(),
        cdUsuarioCreacion INT,
        CONSTRAINT FK_TR_REGISTROS_FORMULARIOS_HIJOS_Padre 
            FOREIGN KEY (cdRegistroPadre) REFERENCES TD_REGISTROS_DOCUMENTOS(cdRegistroDocumento),
        CONSTRAINT FK_TR_REGISTROS_FORMULARIOS_HIJOS_Campo 
            FOREIGN KEY (cdTemplateCampo) REFERENCES TD_TEMPLATES_CAMPOS(cdTemplateCampo),
        CONSTRAINT FK_TR_REGISTROS_FORMULARIOS_HIJOS_Hijo 
            FOREIGN KEY (cdRegistroHijo) REFERENCES TD_REGISTROS_DOCUMENTOS(cdRegistroDocumento)
    );
    
    PRINT '✓ Tabla TR_REGISTROS_FORMULARIOS_HIJOS creada';
END
ELSE
BEGIN
    PRINT '  Tabla TR_REGISTROS_FORMULARIOS_HIJOS ya existe';
END
GO

-- ============================================================
-- 5. Verificar tipos de campo actuales
-- ============================================================

SELECT 
    cdTipoCampo,
    dsTipoCampo,
    dsDescripcion
FROM TV_TIPOS_CAMPO
ORDER BY cdTipoCampo;
GO

PRINT '====================================';
PRINT 'Migración completada exitosamente';
PRINT '====================================';
PRINT 'Nuevos tipos de campo agregados:';
PRINT '  - Archivo: Para subir archivos al gestor documental Aditus';
PRINT '  - Hipervínculo: Para vincular otros registros de formularios';
PRINT '  - Formulario: Para asociar formularios hijos';
PRINT '';
PRINT 'Nuevas estructuras de BD:';
PRINT '  - TD_TEMPLATES_CAMPOS.cdFormularioAsociado';
PRINT '  - TD_REGISTROS_CAMPOS_VALORES.dsAditusDocId';
PRINT '  - TD_REGISTROS_CAMPOS_VALORES.dsNombreArchivo';
PRINT '  - TD_REGISTROS_CAMPOS_VALORES.cdRegistroVinculado';
PRINT '  - TR_REGISTROS_FORMULARIOS_HIJOS (nueva tabla)';
GO
