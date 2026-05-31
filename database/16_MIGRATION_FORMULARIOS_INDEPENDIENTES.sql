-- ============================================================
-- MIGRACION: Formularios Independientes
-- Descripción: Convertir Templates en Formularios independientes que se asocian a requisitos
-- Fecha: 2026-05-29
-- ============================================================

USE ISO;
GO

PRINT 'Iniciando migración: Formularios Independientes';
GO

-- ============================================================
-- 1. Agregar cdNorma a TD_TEMPLATES_DOCUMENTOS
-- ============================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'TD_TEMPLATES_DOCUMENTOS' AND COLUMN_NAME = 'cdNorma')
BEGIN
    ALTER TABLE TD_TEMPLATES_DOCUMENTOS
    ADD cdNorma INT NULL;
    
    -- Actualizar los registros existentes con el cdNorma del requisito
    UPDATE TD_TEMPLATES_DOCUMENTOS
    SET cdNorma = (SELECT cdNorma FROM TD_REQUISITOS WHERE TD_REQUISITOS.cdRequisito = TD_TEMPLATES_DOCUMENTOS.cdRequisito);
    
    -- Hacer cdNorma NOT NULL después de poblar los datos
    ALTER TABLE TD_TEMPLATES_DOCUMENTOS
    ALTER COLUMN cdNorma INT NOT NULL;
    
    -- Agregar foreign key
    ALTER TABLE TD_TEMPLATES_DOCUMENTOS
    ADD CONSTRAINT FK_TD_TEMPLATES_DOCUMENTOS_Norma FOREIGN KEY (cdNorma) REFERENCES TD_NORMAS(cdNorma);
    
    PRINT '✓ Agregado cdNorma a TD_TEMPLATES_DOCUMENTOS';
END
ELSE
BEGIN
    PRINT '  cdNorma ya existe en TD_TEMPLATES_DOCUMENTOS';
END
GO

-- ============================================================
-- 2. Hacer cdRequisito NULLABLE en TD_TEMPLATES_DOCUMENTOS
-- ============================================================
-- Primero verificar si existe el constraint
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
           WHERE CONSTRAINT_NAME = 'FK_TD_TEMPLATES_DOCUMENTOS_Requisito')
BEGIN
    ALTER TABLE TD_TEMPLATES_DOCUMENTOS
    DROP CONSTRAINT FK_TD_TEMPLATES_DOCUMENTOS_Requisito;
    
    PRINT '✓ Eliminado constraint FK_TD_TEMPLATES_DOCUMENTOS_Requisito';
END
GO

-- Hacer cdRequisito nullable
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'TD_TEMPLATES_DOCUMENTOS' AND COLUMN_NAME = 'cdRequisito' 
           AND IS_NULLABLE = 'NO')
BEGIN
    ALTER TABLE TD_TEMPLATES_DOCUMENTOS
    ALTER COLUMN cdRequisito INT NULL;
    
    PRINT '✓ cdRequisito ahora es NULLABLE en TD_TEMPLATES_DOCUMENTOS';
END
ELSE
BEGIN
    PRINT '  cdRequisito ya es NULLABLE en TD_TEMPLATES_DOCUMENTOS';
END
GO

-- Recrear el foreign key pero ahora nullable
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
               WHERE CONSTRAINT_NAME = 'FK_TD_TEMPLATES_DOCUMENTOS_Requisito')
BEGIN
    ALTER TABLE TD_TEMPLATES_DOCUMENTOS
    ADD CONSTRAINT FK_TD_TEMPLATES_DOCUMENTOS_Requisito FOREIGN KEY (cdRequisito) REFERENCES TD_REQUISITOS(cdRequisito);
    
    PRINT '✓ Recreado constraint FK_TD_TEMPLATES_DOCUMENTOS_Requisito (nullable)';
END
GO

-- ============================================================
-- 3. Crear tabla TR_REQUISITOS_TEMPLATES (relación muchos a muchos)
-- ============================================================
IF OBJECT_ID('TR_REQUISITOS_TEMPLATES', 'U') IS NULL
BEGIN
    CREATE TABLE TR_REQUISITOS_TEMPLATES (
        cdRequisitoTemplate INT IDENTITY(1,1) PRIMARY KEY,
        cdRequisito INT NOT NULL,
        cdTemplateDocumento INT NOT NULL,
        feCreacion DATETIME DEFAULT GETDATE(),
        cdUsuarioCreacion INT,
        CONSTRAINT FK_TR_REQUISITOS_TEMPLATES_Requisito FOREIGN KEY (cdRequisito) REFERENCES TD_REQUISITOS(cdRequisito),
        CONSTRAINT FK_TR_REQUISITOS_TEMPLATES_Template FOREIGN KEY (cdTemplateDocumento) REFERENCES TD_TEMPLATES_DOCUMENTOS(cdTemplateDocumento),
        CONSTRAINT UK_TR_REQUISITOS_TEMPLATES UNIQUE (cdRequisito, cdTemplateDocumento)
    );
    
    PRINT '✓ Creada tabla TR_REQUISITOS_TEMPLATES';
END
ELSE
BEGIN
    PRINT '  Tabla TR_REQUISITOS_TEMPLATES ya existe';
END
GO

-- ============================================================
-- 4. Migrar datos existentes a TR_REQUISITOS_TEMPLATES
-- ============================================================
-- Solo migrar si la tabla está vacía y hay datos en TD_TEMPLATES_DOCUMENTOS
IF NOT EXISTS (SELECT 1 FROM TR_REQUISITOS_TEMPLATES)
   AND EXISTS (SELECT 1 FROM TD_TEMPLATES_DOCUMENTOS WHERE cdRequisito IS NOT NULL)
BEGIN
    INSERT INTO TR_REQUISITOS_TEMPLATES (cdRequisito, cdTemplateDocumento, feCreacion)
    SELECT 
        cdRequisito,
        cdTemplateDocumento,
        feCreacion
    FROM TD_TEMPLATES_DOCUMENTOS
    WHERE cdRequisito IS NOT NULL;
    
    DECLARE @migratedCount INT = @@ROWCOUNT;
    PRINT '✓ Migrados ' + CAST(@migratedCount AS VARCHAR(10)) + ' registros a TR_REQUISITOS_TEMPLATES';
END
ELSE
BEGIN
    PRINT '  Datos ya migrados a TR_REQUISITOS_TEMPLATES o no hay datos para migrar';
END
GO

-- ============================================================
-- 5. Opcional: Limpiar cdRequisito de TD_TEMPLATES_DOCUMENTOS
-- ============================================================
-- Comentado por si se necesita reversión. Descomentar si se desea limpiar completamente
/*
UPDATE TD_TEMPLATES_DOCUMENTOS
SET cdRequisito = NULL
WHERE cdRequisito IS NOT NULL;

PRINT '✓ Limpiado campo cdRequisito de TD_TEMPLATES_DOCUMENTOS';
GO
*/

PRINT '====================================';
PRINT 'Migración completada exitosamente';
PRINT '====================================';
PRINT 'Resumen de cambios:';
PRINT '- TD_TEMPLATES_DOCUMENTOS ahora tiene cdNorma (NOT NULL)';
PRINT '- TD_TEMPLATES_DOCUMENTOS.cdRequisito ahora es NULLABLE';
PRINT '- Nueva tabla TR_REQUISITOS_TEMPLATES para asociaciones';
PRINT '- Datos existentes migrados a TR_REQUISITOS_TEMPLATES';
PRINT '';
PRINT 'NOTA: El campo cdRequisito se mantiene en TD_TEMPLATES_DOCUMENTOS por compatibilidad.';
PRINT '      Se recomienda usar TR_REQUISITOS_TEMPLATES para las nuevas asociaciones.';
GO
