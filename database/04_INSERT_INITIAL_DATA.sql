/* ============================================================
   SISTEMA DE GESTION DE CALIDAD - ISO
   Script: Datos Iniciales
   Descripción: Carga de datos maestros y configuración inicial
   Fecha: 2026-05-02
============================================================ */

USE ISO;
GO

-- ============================================================
-- TV_ESTADOS: Estados del sistema
-- ============================================================
SET IDENTITY_INSERT TV_ESTADOS ON;
GO

INSERT INTO TV_ESTADOS (cdEstado, dsEstado, dsDescripcion, dsGrupo, nuOrden, snActivo) VALUES
-- Estados generales
(1, 'Activo', 'Registro activo en el sistema', 'GENERAL', 1, 1),
(2, 'Inactivo', 'Registro inactivo/deshabilitado', 'GENERAL', 2, 1),
(3, 'Eliminado', 'Registro eliminado (borrado lógico)', 'GENERAL', 3, 1),
-- Estados de certificaciones
(10, 'Borrador', 'Certificación en borrador', 'CERTIFICACION', 1, 1),
(11, 'En Proceso', 'Certificación en proceso', 'CERTIFICACION', 2, 1),
(12, 'Certificado', 'Certificación completada', 'CERTIFICACION', 3, 1),
(13, 'Suspendido', 'Certificación suspendida', 'CERTIFICACION', 4, 1),
-- Estados de documentos
(20, 'Pendiente', 'Documento pendiente de edición', 'DOCUMENTO', 1, 1),
(21, 'En Edición', 'Documento en proceso de edición', 'DOCUMENTO', 2, 1),
(22, 'Aprobado', 'Documento aprobado', 'DOCUMENTO', 3, 1),
(23, 'Rechazado', 'Documento rechazado', 'DOCUMENTO', 4, 1);

SET IDENTITY_INSERT TV_ESTADOS OFF;
GO

-- ============================================================
-- TV_TIPOS_USUARIO: Tipos de usuario
-- ============================================================
SET IDENTITY_INSERT TV_TIPOS_USUARIO ON;
GO

INSERT INTO TV_TIPOS_USUARIO (cdTipoUsuario, dsTipoUsuario, dsDescripcion) VALUES
(1, 'SuperAdmin', 'Super Administrador del sistema'),
(2, 'Interno', 'Usuario consultor de la empresa consultora'),
(3, 'Externo', 'Usuario cliente de una empresa certificada');

SET IDENTITY_INSERT TV_TIPOS_USUARIO OFF;
GO

-- ============================================================
-- TV_PAISES: Catálogo de países
-- ============================================================
SET IDENTITY_INSERT TV_PAISES ON;
GO

INSERT INTO TV_PAISES (cdPais, dsPais, dsCodigoISO2, dsCodigoISO3, nuOrden, snActivo) VALUES
(1, 'Argentina', 'AR', 'ARG', 1, 1),
(2, 'Uruguay', 'UY', 'URY', 2, 1),
(3, 'Chile', 'CL', 'CHL', 3, 1),
(4, 'Brasil', 'BR', 'BRA', 4, 1),
(5, 'Paraguay', 'PY', 'PRY', 5, 1),
(6, 'Bolivia', 'BO', 'BOL', 6, 1),
(7, 'Perú', 'PE', 'PER', 7, 1),
(8, 'Colombia', 'CO', 'COL', 8, 1),
(9, 'Ecuador', 'EC', 'ECU', 9, 1),
(10, 'Venezuela', 'VE', 'VEN', 10, 1),
(11, 'México', 'MX', 'MEX', 11, 1),
(12, 'España', 'ES', 'ESP', 12, 1),
(13, 'Estados Unidos', 'US', 'USA', 13, 1);

SET IDENTITY_INSERT TV_PAISES OFF;
GO

-- ============================================================
-- TV_PROVINCIAS: Provincias de Argentina
-- ============================================================
SET IDENTITY_INSERT TV_PROVINCIAS ON;
GO

INSERT INTO TV_PROVINCIAS (cdProvincia, cdPais, dsProvincia, dsCodigo, nuOrden, snActivo) VALUES
(1, 1, 'Buenos Aires', 'BA', 1, 1),
(2, 1, 'Ciudad Autónoma de Buenos Aires', 'CABA', 2, 1),
(3, 1, 'Catamarca', 'K', 3, 1),
(4, 1, 'Chaco', 'H', 4, 1),
(5, 1, 'Chubut', 'U', 5, 1),
(6, 1, 'Córdoba', 'X', 6, 1),
(7, 1, 'Corrientes', 'W', 7, 1),
(8, 1, 'Entre Ríos', 'E', 8, 1),
(9, 1, 'Formosa', 'P', 9, 1),
(10, 1, 'Jujuy', 'Y', 10, 1),
(11, 1, 'La Pampa', 'L', 11, 1),
(12, 1, 'La Rioja', 'F', 12, 1),
(13, 1, 'Mendoza', 'M', 13, 1),
(14, 1, 'Misiones', 'N', 14, 1),
(15, 1, 'Neuquén', 'Q', 15, 1),
(16, 1, 'Río Negro', 'R', 16, 1),
(17, 1, 'Salta', 'A', 17, 1),
(18, 1, 'San Juan', 'J', 18, 1),
(19, 1, 'San Luis', 'D', 19, 1),
(20, 1, 'Santa Cruz', 'Z', 20, 1),
(21, 1, 'Santa Fe', 'S', 21, 1),
(22, 1, 'Santiago del Estero', 'G', 22, 1),
(23, 1, 'Tierra del Fuego', 'V', 23, 1),
(24, 1, 'Tucumán', 'T', 24, 1);

SET IDENTITY_INSERT TV_PROVINCIAS OFF;
GO

-- ============================================================
-- TV_CONDICION_VENTA: Condiciones de venta
-- ============================================================
SET IDENTITY_INSERT TV_CONDICION_VENTA ON;
GO

INSERT INTO TV_CONDICION_VENTA (cdCondicionVenta, dsCondicionVenta, dsDescripcion, nuDias, snActivo) VALUES
(1, 'Contado', 'Pago al contado', 0, 1),
(2, '30 días', 'Pago a 30 días', 30, 1),
(3, '60 días', 'Pago a 60 días', 60, 1),
(4, '90 días', 'Pago a 90 días', 90, 1),
(5, '30-60 días', 'Pago en 2 cuotas: 30 y 60 días', 60, 1),
(6, '30-60-90 días', 'Pago en 3 cuotas: 30, 60 y 90 días', 90, 1);

SET IDENTITY_INSERT TV_CONDICION_VENTA OFF;
GO

-- ============================================================
-- TV_IVA: Condiciones de IVA
-- ============================================================
SET IDENTITY_INSERT TV_IVA ON;
GO

INSERT INTO TV_IVA (cdIVA, dsIVA, nuPorcentaje, snActivo) VALUES
(1, 'Responsable Inscripto', 21.00, 1),
(2, 'Monotributista', 0.00, 1),
(3, 'Exento', 0.00, 1),
(4, 'Consumidor Final', 21.00, 1),
(5, 'No Responsable', 0.00, 1);

SET IDENTITY_INSERT TV_IVA OFF;
GO

-- ============================================================
-- TV_MODALIDAD_TRABAJO: Modalidades de trabajo
-- ============================================================
SET IDENTITY_INSERT TV_MODALIDAD_TRABAJO ON;
GO

INSERT INTO TV_MODALIDAD_TRABAJO (cdModalidadTrabajo, dsModalidadTrabajo, dsDescripcion, snActivo) VALUES
(1, 'Presencial', 'Trabajo 100% presencial en oficinas del cliente', 1),
(2, 'Remoto', 'Trabajo 100% remoto', 1),
(3, 'Híbrido', 'Combinación de presencial y remoto', 1);

SET IDENTITY_INSERT TV_MODALIDAD_TRABAJO OFF;
GO

-- ============================================================
-- TV_TIPOS_SERVICIOS: Tipos de servicios
-- ============================================================
SET IDENTITY_INSERT TV_TIPOS_SERVICIOS ON;
GO

INSERT INTO TV_TIPOS_SERVICIOS (cdTipoServicio, dsTipoServicio, dsDescripcion, snActivo) VALUES
(1, 'Consultoría', 'Servicios de consultoría y asesoramiento', 1),
(2, 'Auditoría', 'Servicios de auditoría y verificación', 1),
(3, 'Capacitación', 'Servicios de capacitación y formación', 1),
(4, 'Implementación', 'Servicios de implementación de sistemas', 1),
(5, 'Mantenimiento', 'Servicios de mantenimiento de certificaciones', 1);

SET IDENTITY_INSERT TV_TIPOS_SERVICIOS OFF;
GO

-- ============================================================
-- TV_ESTADO_CIVIL: Estados civiles
-- ============================================================
SET IDENTITY_INSERT TV_ESTADO_CIVIL ON;
GO

INSERT INTO TV_ESTADO_CIVIL (cdEstadoCivil, dsEstadoCivil, snActivo) VALUES
(1, 'Soltero/a', 1),
(2, 'Casado/a', 1),
(3, 'Divorciado/a', 1),
(4, 'Viudo/a', 1),
(5, 'Unión Convivencial', 1);

SET IDENTITY_INSERT TV_ESTADO_CIVIL OFF;
GO

-- ============================================================
-- TV_TIPOS_CAMPO: Tipos de campo para templates
-- ============================================================
SET IDENTITY_INSERT TV_TIPOS_CAMPO ON;
GO

INSERT INTO TV_TIPOS_CAMPO (cdTipoCampo, dsTipoCampo, dsDescripcion) VALUES
(1, 'Texto', 'Campo de texto libre'),
(2, 'Numero', 'Campo numérico'),
(3, 'Fecha', 'Campo de fecha'),
(4, 'Lista', 'Campo de selección de lista'),
(5, 'TextoLargo', 'Campo de texto extenso (textarea)'),
(6, 'Email', 'Campo de correo electrónico'),
(7, 'Telefono', 'Campo de teléfono'),
(8, 'Booleano', 'Campo Si/No');

SET IDENTITY_INSERT TV_TIPOS_CAMPO OFF;
GO

-- ============================================================
-- TV_TIPOS_DOCUMENTO: Tipos de documento para templates
-- ============================================================
SET IDENTITY_INSERT TV_TIPOS_DOCUMENTO ON;
GO

INSERT INTO TV_TIPOS_DOCUMENTO (cdTipoDocumento, dsTipoDocumento, dsDescripcion) VALUES
(1, 'Procedimiento', 'Documento de procedimiento'),
(2, 'Política', 'Documento de política'),
(3, 'Registro', 'Documento de registro'),
(4, 'Instructivo', 'Documento instructivo'),
(5, 'Manual', 'Manual de sistema');

SET IDENTITY_INSERT TV_TIPOS_DOCUMENTO OFF;
GO

-- ============================================================
-- TD_PERMISOS: Permisos del sistema
-- ============================================================
SET IDENTITY_INSERT TD_PERMISOS ON;
GO

INSERT INTO TD_PERMISOS (cdPermiso, dsPermiso, dsDescripcion, dsModulo, dsAccion) VALUES
-- Super Admin
(1, 'SUPERADMIN_ALL', 'Acceso total al módulo super admin', 'SUPERADMIN', 'ALL'),
-- Empresas Consultoras
(10, 'EMPRESA_CREATE', 'Crear empresas consultoras', 'EMPRESAS', 'CREATE'),
(11, 'EMPRESA_READ', 'Ver empresas consultoras', 'EMPRESAS', 'READ'),
(12, 'EMPRESA_UPDATE', 'Modificar empresas consultoras', 'EMPRESAS', 'UPDATE'),
(13, 'EMPRESA_DELETE', 'Eliminar empresas consultoras', 'EMPRESAS', 'DELETE'),
-- Usuarios
(20, 'USUARIO_CREATE', 'Crear usuarios', 'USUARIOS', 'CREATE'),
(21, 'USUARIO_READ', 'Ver usuarios', 'USUARIOS', 'READ'),
(22, 'USUARIO_UPDATE', 'Modificar usuarios', 'USUARIOS', 'UPDATE'),
(23, 'USUARIO_DELETE', 'Eliminar usuarios', 'USUARIOS', 'DELETE'),
-- Roles
(30, 'ROL_CREATE', 'Crear roles', 'ROLES', 'CREATE'),
(31, 'ROL_READ', 'Ver roles', 'ROLES', 'READ'),
(32, 'ROL_UPDATE', 'Modificar roles', 'ROLES', 'UPDATE'),
(33, 'ROL_DELETE', 'Eliminar roles', 'ROLES', 'DELETE'),
-- Normas
(40, 'NORMA_CREATE', 'Crear normas', 'NORMAS', 'CREATE'),
(41, 'NORMA_READ', 'Ver normas', 'NORMAS', 'READ'),
(42, 'NORMA_UPDATE', 'Modificar normas', 'NORMAS', 'UPDATE'),
(43, 'NORMA_DELETE', 'Eliminar normas', 'NORMAS', 'DELETE'),
-- Clientes
(50, 'CLIENTE_CREATE', 'Crear clientes', 'CLIENTES', 'CREATE'),
(51, 'CLIENTE_READ', 'Ver clientes', 'CLIENTES', 'READ'),
(52, 'CLIENTE_UPDATE', 'Modificar clientes', 'CLIENTES', 'UPDATE'),
(53, 'CLIENTE_DELETE', 'Eliminar clientes', 'CLIENTES', 'DELETE'),
-- Certificaciones
(60, 'CERTIFICACION_CREATE', 'Crear certificaciones', 'CERTIFICACIONES', 'CREATE'),
(61, 'CERTIFICACION_READ', 'Ver certificaciones', 'CERTIFICACIONES', 'READ'),
(62, 'CERTIFICACION_UPDATE', 'Modificar certificaciones', 'CERTIFICACIONES', 'UPDATE'),
(63, 'CERTIFICACION_DELETE', 'Eliminar certificaciones', 'CERTIFICACIONES', 'DELETE'),
-- Documentos
(70, 'DOCUMENTO_CREATE', 'Crear documentos', 'DOCUMENTOS', 'CREATE'),
(71, 'DOCUMENTO_READ', 'Ver documentos', 'DOCUMENTOS', 'READ'),
(72, 'DOCUMENTO_UPDATE', 'Modificar documentos', 'DOCUMENTOS', 'UPDATE'),
(73, 'DOCUMENTO_DELETE', 'Eliminar documentos', 'DOCUMENTOS', 'DELETE'),
(74, 'DOCUMENTO_GENERATE', 'Generar documentos Word', 'DOCUMENTOS', 'GENERATE'),
-- Reportes
(80, 'REPORTE_READ', 'Ver reportes', 'REPORTES', 'READ'),
(81, 'REPORTE_EXPORT', 'Exportar reportes', 'REPORTES', 'EXPORT'),
-- Dashboard
(90, 'DASHBOARD_READ', 'Ver dashboard', 'DASHBOARD', 'READ');

SET IDENTITY_INSERT TD_PERMISOS OFF;
GO

-- ============================================================
-- TD_ROLES: Roles del sistema
-- ============================================================
SET IDENTITY_INSERT TD_ROLES ON;
GO

INSERT INTO TD_ROLES (cdRol, cdEmpresaConsultora, dsRol, dsDescripcion, snSistema, cdEstado, feCreacion, cdUsuarioCreacion) VALUES
(1, NULL, 'SuperAdministrador', 'Super Administrador del sistema', 1, 1, GETDATE(), 1),
(2, NULL, 'Administrador', 'Administrador de empresa consultora', 1, 1, GETDATE(), 1),
(3, NULL, 'Consultor', 'Consultor de empresa consultora', 1, 1, GETDATE(), 1),
(4, NULL, 'Cliente', 'Usuario cliente externo', 1, 1, GETDATE(), 1);

SET IDENTITY_INSERT TD_ROLES OFF;
GO

-- ============================================================
-- TR_ROLES_PERMISOS: Asignación de permisos a roles de sistema
-- ============================================================

-- Super Administrador: Todos los permisos
INSERT INTO TR_ROLES_PERMISOS (cdRol, cdPermiso, feCreacion, cdUsuarioCreacion)
SELECT 1, cdPermiso, GETDATE(), 1
FROM TD_PERMISOS;

-- Administrador de empresa: Todos menos super admin
INSERT INTO TR_ROLES_PERMISOS (cdRol, cdPermiso, feCreacion, cdUsuarioCreacion)
SELECT 2, cdPermiso, GETDATE(), 1
FROM TD_PERMISOS
WHERE cdPermiso <> 1;

-- Consultor: Permisos de lectura y ejecución
INSERT INTO TR_ROLES_PERMISOS (cdRol, cdPermiso, feCreacion, cdUsuarioCreacion)
VALUES
(3, 21, GETDATE(), 1), -- USUARIO_READ
(3, 31, GETDATE(), 1), -- ROL_READ
(3, 40, GETDATE(), 1), -- NORMA_CREATE
(3, 41, GETDATE(), 1), -- NORMA_READ
(3, 42, GETDATE(), 1), -- NORMA_UPDATE
(3, 50, GETDATE(), 1), -- CLIENTE_CREATE
(3, 51, GETDATE(), 1), -- CLIENTE_READ
(3, 52, GETDATE(), 1), -- CLIENTE_UPDATE
(3, 60, GETDATE(), 1), -- CERTIFICACION_CREATE
(3, 61, GETDATE(), 1), -- CERTIFICACION_READ
(3, 62, GETDATE(), 1), -- CERTIFICACION_UPDATE
(3, 70, GETDATE(), 1), -- DOCUMENTO_CREATE
(3, 71, GETDATE(), 1), -- DOCUMENTO_READ
(3, 72, GETDATE(), 1), -- DOCUMENTO_UPDATE
(3, 74, GETDATE(), 1), -- DOCUMENTO_GENERATE
(3, 80, GETDATE(), 1), -- REPORTE_READ
(3, 81, GETDATE(), 1), -- REPORTE_EXPORT
(3, 90, GETDATE(), 1); -- DASHBOARD_READ

-- Cliente externo: Solo lectura limitada
INSERT INTO TR_ROLES_PERMISOS (cdRol, cdPermiso, feCreacion, cdUsuarioCreacion)
VALUES
(4, 61, GETDATE(), 1), -- CERTIFICACION_READ
(4, 71, GETDATE(), 1), -- DOCUMENTO_READ
(4, 90, GETDATE(), 1); -- DASHBOARD_READ

GO

-- ============================================================
-- TD_USUARIOS: Usuario Super Admin
-- ============================================================
SET IDENTITY_INSERT TD_USUARIOS ON;
GO

-- Contraseña: 123 (hash MD5 para desarrollo: 202cb962ac59075b964b07152d234b70)
-- En producción usar bcrypt o similar
INSERT INTO TD_USUARIOS (cdUsuario, cdEmpresaConsultora, dsUsuario, dsClave, dsNombreCompleto, dsMail, cdTipoUsuario, cdCliente, cdClienteUsuario, snClaveTemporal, snPrimerIngreso, feAltaUsuario, cdEstado, feCreacion, cdUsuarioCreacion)
VALUES (1, NULL, 'admin', '202cb962ac59075b964b07152d234b70', 'Super Administrador', 'admin@sistema.com', 1, NULL, NULL, 0, 0, GETDATE(), 1, GETDATE(), 1);

SET IDENTITY_INSERT TD_USUARIOS OFF;
GO

-- Asignar rol Super Administrador
INSERT INTO TR_USUARIOS_ROLES (cdUsuario, cdRol, feCreacion, cdUsuarioCreacion)
VALUES (1, 1, GETDATE(), 1);
GO

-- ============================================================
-- TD_EMPRESAS_CONSULTORAS: Empresa de ejemplo
-- ============================================================
SET IDENTITY_INSERT TD_EMPRESAS_CONSULTORAS ON;
GO

INSERT INTO TD_EMPRESAS_CONSULTORAS (cdEmpresaConsultora, dsNombreEmpresaConsultora, dsCUIT, dsDomicilio, dsLocalidad, dsProvincia, dsCodigoPostal, dsPais, dsTelefono, dsMail, dsWeb, dsLogo, cdEstado, feCreacion, cdUsuarioCreacion)
VALUES (1, 'DC - Gestión & Estrategia', '30123456789-2', 'Beruti 123', 'San Fernando', 'Buenos Aires', '1882', 'Argentina', '1159077702', 'info@dcgestion.com.ar', 'https://dcgestion.com.ar/', NULL, 1, GETDATE(), 1);

SET IDENTITY_INSERT TD_EMPRESAS_CONSULTORAS OFF;
GO

-- ============================================================
-- TD_PARAMETROS: Parámetros de Aditus para la empresa
-- ============================================================
INSERT INTO TD_PARAMETROS (cdEmpresaConsultora, dsCodigoParametro, dsValorParametro, dsDescripcion, cdEstado, feCreacion)
VALUES
(1, 'URL_AGREGAR_DOCUMENTO', 'http://172.16.16.60:8093/documents/base64', 'URL para agregar documentos en Aditus', 1, GETDATE()),
(1, 'URL_MODIFICAR_DOCUMENTO', 'http://172.16.16.60:8093/documents', 'URL para modificar documentos en Aditus', 1, GETDATE()),
(1, 'URL_VISOR', 'http://172.16.16.60:6095/LPAViewer/virtualviewer', 'URL del visor de documentos Aditus', 1, GETDATE()),
(1, 'URL_TOKEN', 'http://172.16.16.60:8981/realms/aditus/protocol/openid-connect/token', 'URL para obtener token de Aditus', 1, GETDATE()),
(1, 'USUARIO_TOKEN', 'dsanchez', 'Usuario para autenticación en Aditus', 1, GETDATE()),
(1, 'CLAVE_TOKEN', '12345', 'Clave para autenticación en Aditus', 1, GETDATE()),
(1, 'CODIGO_LIBRERIA', '32a76e80-1d2d-47fe-9b9d-d423cf644d73', 'Código de librería en Aditus', 1, GETDATE()),
(1, 'CODIGO_CLASE', '7a6f0e1e-51e1-4ea1-b34c-804a72cbc994', 'Código de clase de documento en Aditus', 1, GETDATE());

GO

-- ============================================================
-- TD_USUARIOS: Usuario Admin de la empresa consultora
-- ============================================================
SET IDENTITY_INSERT TD_USUARIOS ON;
GO

-- Usuario: ISO, Contraseña: 123 (hash MD5: 202cb962ac59075b964b07152d234b70)
INSERT INTO TD_USUARIOS (cdUsuario, cdEmpresaConsultora, dsUsuario, dsClave, dsNombreCompleto, dsMail, cdTipoUsuario, cdCliente, cdClienteUsuario, snClaveTemporal, snPrimerIngreso, feAltaUsuario, cdEstado, feCreacion, cdUsuarioCreacion)
VALUES (2, 1, 'ISO', '202cb962ac59075b964b07152d234b70', 'Administrador DC Gestión', 'admin@dcgestion.com.ar', 2, NULL, NULL, 0, 0, GETDATE(), 1, GETDATE(), 1);

SET IDENTITY_INSERT TD_USUARIOS OFF;
GO

-- Asignar rol Administrador
INSERT INTO TR_USUARIOS_ROLES (cdUsuario, cdRol, feCreacion, cdUsuarioCreacion)
VALUES (2, 2, GETDATE(), 1);
GO

PRINT '✓ Datos iniciales cargados exitosamente';
PRINT '';
PRINT '========================================';
PRINT 'USUARIOS CREADOS:';
PRINT '========================================';
PRINT 'Super Admin:';
PRINT '  Usuario: admin';
PRINT '  Clave: 123';
PRINT '  URL: http://localhost:3000/login/0';
PRINT '';
PRINT 'Empresa Consultora: DC - Gestión & Estrategia';
PRINT '  Usuario: ISO';
PRINT '  Clave: 123';
PRINT '  URL: http://localhost:3000/login/1';
PRINT '========================================';
GO
