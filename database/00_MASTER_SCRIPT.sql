/* ============================================================
   SISTEMA DE GESTION DE CALIDAD - ISO
   Script Maestro: Ejecuta todos los scripts en orden
   Descripción: Script principal para crear toda la base de datos
   Fecha: 2026-05-02
============================================================ */

USE master;
GO

-- ============================================================
-- Crear base de datos si no existe
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ISO')
BEGIN
    CREATE DATABASE ISO;
    PRINT '✓ Base de datos ISO creada';
END
ELSE
BEGIN
    PRINT '✓ Base de datos ISO ya existe';
END
GO

USE ISO;
GO

PRINT '';
PRINT '========================================';
PRINT 'INICIANDO CREACIÓN DE BASE DE DATOS';
PRINT 'Sistema de Gestión de Calidad - ISO';
PRINT '========================================';
PRINT '';

-- Script 1: Tablas de Valores (TV_)
PRINT 'Ejecutando: 01_CREATE_TV_TABLES.sql';
:r .\01_CREATE_TV_TABLES.sql
PRINT '';

-- Script 2: Tablas de Datos (TD_)
PRINT 'Ejecutando: 02_CREATE_TD_TABLES.sql';
:r .\02_CREATE_TD_TABLES.sql
PRINT '';

-- Script 3: Tablas de Relación (TR_)
PRINT 'Ejecutando: 03_CREATE_TR_TABLES.sql';
:r .\03_CREATE_TR_TABLES.sql
PRINT '';

-- Script 4: Datos Iniciales
PRINT 'Ejecutando: 04_INSERT_INITIAL_DATA.sql';
:r .\04_INSERT_INITIAL_DATA.sql
PRINT '';

PRINT '========================================';
PRINT 'BASE DE DATOS CREADA EXITOSAMENTE';
PRINT '========================================';
GO
