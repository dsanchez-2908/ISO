-- ============================================================
-- MIGRACION: Mejoras en Templates - Listas, Herencia, Titulos
-- Fecha: 2026-05-04
-- ============================================================

USE ISO;
GO

-- 1. Agregar campo cdNorma a TD_LISTAS para soportar listas a nivel norma
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TD_LISTAS' AND COLUMN_NAME = 'cdNorma')
BEGIN
    ALTER TABLE TD_LISTAS
    ADD cdNorma INT NULL;
    
    -- Agregar foreign key
    ALTER TABLE TD_LISTAS
    ADD CONSTRAINT FK_TD_LISTAS_Norma FOREIGN KEY (cdNorma) REFERENCES TD_NORMAS(cdNorma);
    
    PRINT 'Agregado cdNorma a TD_LISTAS';
END
ELSE
BEGIN
    PRINT 'cdNorma ya existe en TD_LISTAS';
END
GO

-- 2. Agregar campos de visibilidad y edición a TD_TEMPLATES_CAMPOS
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' AND COLUMN_NAME = 'snOculto')
BEGIN
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD snOculto BIT DEFAULT 0;
    
    PRINT 'Agregado snOculto a TD_TEMPLATES_CAMPOS';
END
ELSE
BEGIN
    PRINT 'snOculto ya existe en TD_TEMPLATES_CAMPOS';
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' AND COLUMN_NAME = 'snSoloLectura')
BEGIN
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD snSoloLectura BIT DEFAULT 0;
    
    PRINT 'Agregado snSoloLectura a TD_TEMPLATES_CAMPOS';
END
ELSE
BEGIN
    PRINT 'snSoloLectura ya existe en TD_TEMPLATES_CAMPOS';
END
GO

-- 3. Agregar campos para herencia de listas
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' AND COLUMN_NAME = 'dsTipoHerencia')
BEGIN
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD dsTipoHerencia VARCHAR(50) NULL; -- 'NORMA' o 'CLIENTE'
    
    PRINT 'Agregado dsTipoHerencia a TD_TEMPLATES_CAMPOS';
END
ELSE
BEGIN
    PRINT 'dsTipoHerencia ya existe en TD_TEMPLATES_CAMPOS';
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' AND COLUMN_NAME = 'dsEntidadCliente')
BEGIN
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD dsEntidadCliente VARCHAR(50) NULL; -- 'SECTORES', 'PUESTOS', 'EMPLEADOS'
    
    PRINT 'Agregado dsEntidadCliente a TD_TEMPLATES_CAMPOS';
END
ELSE
BEGIN
    PRINT 'dsEntidadCliente ya existe en TD_TEMPLATES_CAMPOS';
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' AND COLUMN_NAME = 'cdValorDefaultLista')
BEGIN
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD cdValorDefaultLista INT NULL;
    
    -- Agregar foreign key a TD_LISTAS_ITEMS
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD CONSTRAINT FK_TD_TEMPLATES_CAMPOS_ValorDefault FOREIGN KEY (cdValorDefaultLista) REFERENCES TD_LISTAS_ITEMS(cdListaItem);
    
    PRINT 'Agregado cdValorDefaultLista a TD_TEMPLATES_CAMPOS';
END
ELSE
BEGIN
    PRINT 'cdValorDefaultLista ya existe en TD_TEMPLATES_CAMPOS';
END
GO

-- 4. Agregar campo para identificar títulos de agrupación
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' AND COLUMN_NAME = 'snEsTitulo')
BEGIN
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD snEsTitulo BIT DEFAULT 0;
    
    PRINT 'Agregado snEsTitulo a TD_TEMPLATES_CAMPOS';
END
ELSE
BEGIN
    PRINT 'snEsTitulo ya existe en TD_TEMPLATES_CAMPOS';
END
GO

-- 5. Agregar campo para el texto del título
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TD_TEMPLATES_CAMPOS' AND COLUMN_NAME = 'dsTitulo')
BEGIN
    ALTER TABLE TD_TEMPLATES_CAMPOS
    ADD dsTitulo VARCHAR(250) NULL;
    
    PRINT 'Agregado dsTitulo a TD_TEMPLATES_CAMPOS';
END
ELSE
BEGIN
    PRINT 'dsTitulo ya existe en TD_TEMPLATES_CAMPOS';
END
GO

PRINT '';
PRINT '============================================================';
PRINT 'Migracion completada exitosamente';
PRINT '============================================================';
