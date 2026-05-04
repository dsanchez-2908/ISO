USE ISO;
GO

PRINT 'Agregando columna dsAuditor a TD_CERTIFICACIONES...';

-- Verificar si la columna ya existe
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID(N'TD_CERTIFICACIONES') 
               AND name = 'dsAuditor')
BEGIN
    ALTER TABLE TD_CERTIFICACIONES
    ADD dsAuditor VARCHAR(100) NULL;
    
    PRINT '✓ Columna dsAuditor agregada correctamente';
END
ELSE
BEGIN
    PRINT '- Columna dsAuditor ya existe';
END

GO

PRINT 'Migracion completada exitosamente';
GO
