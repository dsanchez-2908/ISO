/* ============================================================
   SISTEMA DE GESTION DE CALIDAD - ISO
   Script: Migración - Crear tabla TR_CLIENTES_NORMAS
   Descripción: Relación muchos a muchos entre clientes y normas
   Fecha: 2026-05-02
============================================================ */

USE ISO;
GO

-- ============================================================
-- TR_CLIENTES_NORMAS: Relación entre clientes y normas ISO
-- ============================================================
IF OBJECT_ID('TR_CLIENTES_NORMAS', 'U') IS NOT NULL
BEGIN
    PRINT '⚠ La tabla TR_CLIENTES_NORMAS ya existe, se eliminará y recreará';
    DROP TABLE TR_CLIENTES_NORMAS;
END
GO

CREATE TABLE TR_CLIENTES_NORMAS (
    cdClienteNorma INT IDENTITY(1,1) PRIMARY KEY,
    cdCliente INT NOT NULL,
    cdNorma INT NOT NULL,
    cdEstado INT NOT NULL DEFAULT 1,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TR_CLIENTES_NORMAS_Cliente FOREIGN KEY (cdCliente) REFERENCES TD_CLIENTES(cdCliente),
    CONSTRAINT FK_TR_CLIENTES_NORMAS_Norma FOREIGN KEY (cdNorma) REFERENCES TD_NORMAS(cdNorma),
    CONSTRAINT FK_TR_CLIENTES_NORMAS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado),
    CONSTRAINT UK_TR_CLIENTES_NORMAS UNIQUE (cdCliente, cdNorma)
);
GO

PRINT '✓ Tabla TR_CLIENTES_NORMAS creada exitosamente';
GO
