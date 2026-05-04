USE ISO;
GO

PRINT 'Agregando columnas faltantes a TD_CERTIFICACIONES...';

-- Agregar cdEmpresaConsultora
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID(N'TD_CERTIFICACIONES') 
               AND name = 'cdEmpresaConsultora')
BEGIN
    ALTER TABLE TD_CERTIFICACIONES
    ADD cdEmpresaConsultora INT NULL;
    
    -- Llenar con el valor de cdEmpresaConsultora del cliente
    UPDATE TD_CERTIFICACIONES
    SET cdEmpresaConsultora = (SELECT cdEmpresaConsultora FROM TD_CLIENTES WHERE cdCliente = TD_CERTIFICACIONES.cdCliente);
    
    -- Agregar FK
    ALTER TABLE TD_CERTIFICACIONES
    ADD CONSTRAINT FK_Certificaciones_Empresa FOREIGN KEY (cdEmpresaConsultora) 
    REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora);
    
    PRINT '✓ Columna cdEmpresaConsultora agregada';
END
ELSE
BEGIN
    PRINT '- Columna cdEmpresaConsultora ya existe';
END

-- Agregar dsCodigo (adicional a cdCodigo que ya existe)
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID(N'TD_CERTIFICACIONES') 
               AND name = 'dsCodigo')
BEGIN
    ALTER TABLE TD_CERTIFICACIONES
    ADD dsCodigo VARCHAR(50) NULL;
    
    -- Copiar valores de cdCodigo a dsCodigo
    UPDATE TD_CERTIFICACIONES
    SET dsCodigo = cdCodigo;
    
    PRINT '✓ Columna dsCodigo agregada';
END
ELSE
BEGIN
    PRINT '- Columna dsCodigo ya existe';
END

-- Agregar feFin
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID(N'TD_CERTIFICACIONES') 
               AND name = 'feFin')
BEGIN
    ALTER TABLE TD_CERTIFICACIONES
    ADD feFin DATE NULL;
    
    PRINT '✓ Columna feFin agregada';
END
ELSE
BEGIN
    PRINT '- Columna feFin ya existe';
END

-- Agregar feVencimiento
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID(N'TD_CERTIFICACIONES') 
               AND name = 'feVencimiento')
BEGIN
    ALTER TABLE TD_CERTIFICACIONES
    ADD feVencimiento DATE NULL;
    
    -- Copiar valores de feObjetivo a feVencimiento si existe
    UPDATE TD_CERTIFICACIONES
    SET feVencimiento = feObjetivo;
    
    PRINT '✓ Columna feVencimiento agregada';
END
ELSE
BEGIN
    PRINT '- Columna feVencimiento ya existe';
END

GO

PRINT '';
PRINT 'Migracion completada exitosamente';
PRINT 'Columnas agregadas: cdEmpresaConsultora, dsCodigo, feFin, feVencimiento';
GO
