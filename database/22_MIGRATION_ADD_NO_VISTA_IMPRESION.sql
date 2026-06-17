-- =============================================
-- Migration 22: Agregar campo snNoVistaImpresion
-- Fecha: 2026-06-17
-- Descripción: 
--   Agrega el campo snNoVistaImpresion a TD_TEMPLATES_CAMPOS
--   para controlar qué campos se muestran en la vista de impresión PDF
-- =============================================

USE ISO;
GO

-- Verificar si la columna ya existe
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' 
    AND COLUMN_NAME = 'snNoVistaImpresion'
)
BEGIN
    PRINT 'Agregando columna snNoVistaImpresion a TD_TEMPLATES_CAMPOS...';
    
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD snNoVistaImpresion BIT NOT NULL DEFAULT 0;
    
    PRINT 'Columna snNoVistaImpresion agregada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La columna snNoVistaImpresion ya existe en TD_TEMPLATES_CAMPOS.';
END
GO

PRINT 'Migration 22 completada.';
GO
