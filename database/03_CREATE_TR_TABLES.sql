/* ============================================================
   SISTEMA DE GESTION DE CALIDAD - ISO
   Script: Tablas de Relación (TR_)
   Descripción: Tablas de relaciones muchos a muchos
   Fecha: 2026-05-02
============================================================ */

USE ISO;
GO

-- ============================================================
-- TR_ROLES_PERMISOS: Relación entre roles y permisos
-- ============================================================
IF OBJECT_ID('TR_ROLES_PERMISOS', 'U') IS NOT NULL
    DROP TABLE TR_ROLES_PERMISOS;
GO

CREATE TABLE TR_ROLES_PERMISOS (
    cdRolPermiso INT IDENTITY(1,1) PRIMARY KEY,
    cdRol INT NOT NULL,
    cdPermiso INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TR_ROLES_PERMISOS_Rol FOREIGN KEY (cdRol) REFERENCES TD_ROLES(cdRol),
    CONSTRAINT FK_TR_ROLES_PERMISOS_Permiso FOREIGN KEY (cdPermiso) REFERENCES TD_PERMISOS(cdPermiso),
    CONSTRAINT UK_TR_ROLES_PERMISOS UNIQUE (cdRol, cdPermiso)
);
GO

-- ============================================================
-- TR_USUARIOS_ROLES: Relación entre usuarios y roles
-- ============================================================
IF OBJECT_ID('TR_USUARIOS_ROLES', 'U') IS NOT NULL
    DROP TABLE TR_USUARIOS_ROLES;
GO

CREATE TABLE TR_USUARIOS_ROLES (
    cdUsuarioRol INT IDENTITY(1,1) PRIMARY KEY,
    cdUsuario INT NOT NULL,
    cdRol INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TR_USUARIOS_ROLES_Usuario FOREIGN KEY (cdUsuario) REFERENCES TD_USUARIOS(cdUsuario),
    CONSTRAINT FK_TR_USUARIOS_ROLES_Rol FOREIGN KEY (cdRol) REFERENCES TD_ROLES(cdRol),
    CONSTRAINT UK_TR_USUARIOS_ROLES UNIQUE (cdUsuario, cdRol)
);
GO

PRINT '✓ Tablas de Relación (TR_) creadas exitosamente';
GO
