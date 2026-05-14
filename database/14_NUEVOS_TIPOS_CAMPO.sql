-- ================================================
-- Migration: 14_NUEVOS_TIPOS_CAMPO
-- Description: Agregar nuevos tipos de campo: FechaHora y Decimal
-- Date: 2026-05-14
-- ================================================

USE ISO;
GO

-- Agregar tipo de campo: FechaHora (Fecha y Hora)
IF NOT EXISTS (SELECT 1 FROM TV_TIPOS_CAMPO WHERE dsTipoCampo = 'FechaHora')
BEGIN
    INSERT INTO TV_TIPOS_CAMPO (dsTipoCampo, dsDescripcion)
    VALUES ('FechaHora', 'Campo de fecha y hora');
    PRINT 'Tipo de campo FechaHora agregado correctamente';
END
ELSE
BEGIN
    PRINT 'Tipo de campo FechaHora ya existe';
END
GO

-- Agregar tipo de campo: Decimal (Número decimal o moneda)
IF NOT EXISTS (SELECT 1 FROM TV_TIPOS_CAMPO WHERE dsTipoCampo = 'Decimal')
BEGIN
    INSERT INTO TV_TIPOS_CAMPO (dsTipoCampo, dsDescripcion)
    VALUES ('Decimal', 'Campo numérico decimal o moneda');
    PRINT 'Tipo de campo Decimal agregado correctamente';
END
ELSE
BEGIN
    PRINT 'Tipo de campo Decimal ya existe';
END
GO

-- Verificar tipos de campo actuales
SELECT 
    cdTipoCampo,
    dsTipoCampo,
    dsDescripcion
FROM TV_TIPOS_CAMPO
ORDER BY cdTipoCampo;
GO

PRINT '================================================';
PRINT 'Migración completada exitosamente';
PRINT 'Nuevos tipos de campo agregados:';
PRINT '  - FechaHora (cdTipoCampo = 9)';
PRINT '  - Decimal (cdTipoCampo = 10)';
PRINT '================================================';
GO
