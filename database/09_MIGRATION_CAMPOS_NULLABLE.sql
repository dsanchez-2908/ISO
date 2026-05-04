USE ISO;
GO

-- Hacer campos nullable cuando son para Títulos (solo dsNombreCampo y cdTipoCampo son obligatorios solo para campos)
PRINT 'Modificando columnas para permitir NULL cuando son Títulos...';

-- dsNombreCampo debe permitir NULL (solo obligatorio para campos)
ALTER TABLE TD_TEMPLATES_CAMPOS
ALTER COLUMN dsNombreCampo NVARCHAR(100) NULL;
PRINT 'dsNombreCampo ahora permite NULL';

-- cdTipoCampo debe permitir NULL (solo obligatorio para campos)  
ALTER TABLE TD_TEMPLATES_CAMPOS
ALTER COLUMN cdTipoCampo INT NULL;
PRINT 'cdTipoCampo ahora permite NULL';

PRINT 'Migracion completada exitosamente';
GO
