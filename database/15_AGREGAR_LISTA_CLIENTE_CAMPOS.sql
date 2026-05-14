-- =============================================
-- Script: 15_AGREGAR_LISTA_CLIENTE_CAMPOS.sql
-- Descripción: Agregar columna cdListaCliente a TD_REGISTROS_CAMPOS_VALORES
-- para soportar listas configuradas del cliente
-- =============================================

USE ISO;
GO

-- Verificar si la columna ya existe
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'TD_REGISTROS_CAMPOS_VALORES' 
    AND COLUMN_NAME = 'cdListaCliente'
)
BEGIN
    PRINT 'Agregando columna cdListaCliente a TD_REGISTROS_CAMPOS_VALORES...';
    
    ALTER TABLE TD_REGISTROS_CAMPOS_VALORES
    ADD cdListaCliente INT NULL;
    
    PRINT 'Columna cdListaCliente agregada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La columna cdListaCliente ya existe en TD_REGISTROS_CAMPOS_VALORES.';
END
GO

-- Verificar el resultado
SELECT TOP 5
    cdRegistroCampoValor,
    cdRegistroDocumento,
    cdTemplateCampo,
    dsValor,
    cdListaItem,
    cdListaCliente,
    cdEntidadCliente,
    dsEntidadTipo
FROM TD_REGISTROS_CAMPOS_VALORES
ORDER BY cdRegistroCampoValor DESC;
GO

PRINT 'Script 15_AGREGAR_LISTA_CLIENTE_CAMPOS.sql completado exitosamente.';
GO
