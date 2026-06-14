-- =============================================
-- Script: 21_MIGRATION_ADD_NORMA_ANTERIOR.sql
-- Descripción: Agregar campo cdNormaAnterior a TD_NORMAS para relacionar normas nuevas con sus versiones anteriores
-- Fecha: 2026-06-14
-- =============================================

USE ISO;
GO

PRINT '================================================';
PRINT 'Iniciando migración: Agregar Norma Anterior';
PRINT '================================================';
PRINT '';

-- =============================================
-- 1. Agregar columna cdNormaAnterior a TD_NORMAS
-- =============================================
IF NOT EXISTS (
    SELECT * 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TD_NORMAS' 
    AND COLUMN_NAME = 'cdNormaAnterior'
)
BEGIN
    ALTER TABLE TD_NORMAS
    ADD cdNormaAnterior INT NULL;
    
    PRINT '✓ Columna cdNormaAnterior agregada a TD_NORMAS';
END
ELSE
BEGIN
    PRINT '- Columna cdNormaAnterior ya existe en TD_NORMAS';
END
GO

-- =============================================
-- 2. Agregar Foreign Key para cdNormaAnterior
-- =============================================
IF NOT EXISTS (
    SELECT * 
    FROM sys.foreign_keys 
    WHERE name = 'FK_TD_NORMAS_NormaAnterior'
)
BEGIN
    ALTER TABLE TD_NORMAS
    ADD CONSTRAINT FK_TD_NORMAS_NormaAnterior 
    FOREIGN KEY (cdNormaAnterior) REFERENCES TD_NORMAS(cdNorma);
    
    PRINT '✓ Foreign Key FK_TD_NORMAS_NormaAnterior creada';
END
ELSE
BEGIN
    PRINT '- Foreign Key FK_TD_NORMAS_NormaAnterior ya existe';
END
GO

-- =============================================
-- 3. Crear índice para mejorar consultas de normas relacionadas
-- =============================================
IF NOT EXISTS (
    SELECT * 
    FROM sys.indexes 
    WHERE name = 'IDX_TD_NORMAS_NormaAnterior'
)
BEGIN
    CREATE INDEX IDX_TD_NORMAS_NormaAnterior 
    ON TD_NORMAS(cdNormaAnterior);
    
    PRINT '✓ Índice IDX_TD_NORMAS_NormaAnterior creado';
END
ELSE
BEGIN
    PRINT '- Índice IDX_TD_NORMAS_NormaAnterior ya existe';
END
GO

PRINT '';
PRINT '================================================';
PRINT 'Migración completada exitosamente';
PRINT '================================================';
GO
