/* ============================================================
   SISTEMA DE GESTION DE CALIDAD - ISO
   Script: Migración - Agregar campos de contacto a empresas
   Descripción: Agrega campos faltantes a TD_EMPRESAS_CONSULTORAS
   Fecha: 2026-05-02
============================================================ */

USE ISO;
GO

-- Verificar que la tabla existe
IF OBJECT_ID('TD_EMPRESAS_CONSULTORAS', 'U') IS NOT NULL
BEGIN
    PRINT 'Agregando columnas a TD_EMPRESAS_CONSULTORAS...'
    
    -- Agregar dsContactoNombre si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('TD_EMPRESAS_CONSULTORAS') 
                   AND name = 'dsContactoNombre')
    BEGIN
        ALTER TABLE TD_EMPRESAS_CONSULTORAS
        ADD dsContactoNombre VARCHAR(150) NULL;
        
        PRINT '✓ Columna dsContactoNombre agregada'
    END
    ELSE
        PRINT '• Columna dsContactoNombre ya existe'
    
    -- Agregar dsContactoTelefono si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('TD_EMPRESAS_CONSULTORAS') 
                   AND name = 'dsContactoTelefono')
    BEGIN
        ALTER TABLE TD_EMPRESAS_CONSULTORAS
        ADD dsContactoTelefono VARCHAR(50) NULL;
        
        PRINT '✓ Columna dsContactoTelefono agregada'
    END
    ELSE
        PRINT '• Columna dsContactoTelefono ya existe'
    
    -- Agregar dsContactoEmail si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('TD_EMPRESAS_CONSULTORAS') 
                   AND name = 'dsContactoEmail')
    BEGIN
        ALTER TABLE TD_EMPRESAS_CONSULTORAS
        ADD dsContactoEmail VARCHAR(150) NULL;
        
        PRINT '✓ Columna dsContactoEmail agregada'
    END
    ELSE
        PRINT '• Columna dsContactoEmail ya existe'
    
    PRINT ''
    PRINT '✅ Migración completada exitosamente'
    PRINT ''
    
    -- Mostrar estructura actualizada
    SELECT 
        COLUMN_NAME as 'Columna',
        DATA_TYPE as 'Tipo',
        CHARACTER_MAXIMUM_LENGTH as 'Longitud',
        IS_NULLABLE as 'Nullable'
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'TD_EMPRESAS_CONSULTORAS'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '❌ Error: La tabla TD_EMPRESAS_CONSULTORAS no existe'
END
GO
