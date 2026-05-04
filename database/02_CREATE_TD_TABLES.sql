/* ============================================================
   SISTEMA DE GESTION DE CALIDAD - ISO
   Script: Tablas de Datos (TD_)
   Descripción: Tablas principales de datos del sistema
   Fecha: 2026-05-02
============================================================ */

USE ISO;
GO

-- ============================================================
-- TD_EMPRESAS_CONSULTORAS: Empresas consultoras (Multi-tenant)
-- ============================================================
IF OBJECT_ID('TD_EMPRESAS_CONSULTORAS', 'U') IS NOT NULL
    DROP TABLE TD_EMPRESAS_CONSULTORAS;
GO

CREATE TABLE TD_EMPRESAS_CONSULTORAS (
    cdEmpresaConsultora INT IDENTITY(1,1) PRIMARY KEY,
    dsNombreEmpresaConsultora VARCHAR(250) NOT NULL,
    dsCUIT VARCHAR(20),
    dsDomicilio VARCHAR(150),
    dsLocalidad VARCHAR(100),
    dsProvincia VARCHAR(100),
    dsCodigoPostal VARCHAR(15),
    dsPais VARCHAR(100),
    dsTelefono VARCHAR(50),
    dsMail VARCHAR(150),
    dsWeb VARCHAR(250),
    dsLogo NVARCHAR(MAX), -- Base64 del logo
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_EMPRESAS_CONSULTORAS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_PARAMETROS: Parámetros de configuración por empresa
-- ============================================================
IF OBJECT_ID('TD_PARAMETROS', 'U') IS NOT NULL
    DROP TABLE TD_PARAMETROS;
GO

CREATE TABLE TD_PARAMETROS (
    cdParametro INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT NOT NULL,
    dsCodigoParametro VARCHAR(100) NOT NULL,
    dsValorParametro NVARCHAR(MAX),
    dsDescripcion VARCHAR(250),
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_TD_PARAMETROS_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_PARAMETROS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado),
    CONSTRAINT UK_TD_PARAMETROS UNIQUE (cdEmpresaConsultora, dsCodigoParametro)
);
GO

-- ============================================================
-- TD_ROLES: Roles del sistema por empresa
-- ============================================================
IF OBJECT_ID('TD_ROLES', 'U') IS NOT NULL
    DROP TABLE TD_ROLES;
GO

CREATE TABLE TD_ROLES (
    cdRol INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT, -- NULL para roles de sistema
    dsRol VARCHAR(100) NOT NULL,
    dsDescripcion VARCHAR(250),
    snSistema BIT DEFAULT 0, -- Rol de sistema no modificable
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_ROLES_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_ROLES_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_PERMISOS: Permisos del sistema
-- ============================================================
IF OBJECT_ID('TD_PERMISOS', 'U') IS NOT NULL
    DROP TABLE TD_PERMISOS;
GO

CREATE TABLE TD_PERMISOS (
    cdPermiso INT IDENTITY(1,1) PRIMARY KEY,
    dsPermiso VARCHAR(100) NOT NULL,
    dsDescripcion VARCHAR(250),
    dsModulo VARCHAR(50), -- Para agrupar permisos por módulo
    dsAccion VARCHAR(50), -- CREATE, READ, UPDATE, DELETE, EXPORT, etc.
    CONSTRAINT UK_TD_PERMISOS UNIQUE (dsPermiso)
);
GO

-- ============================================================
-- TD_USUARIOS: Usuarios del sistema
-- ============================================================
IF OBJECT_ID('TD_USUARIOS', 'U') IS NOT NULL
    DROP TABLE TD_USUARIOS;
GO

CREATE TABLE TD_USUARIOS (
    cdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT, -- NULL para super admin
    dsUsuario VARCHAR(100) NOT NULL,
    dsClave NVARCHAR(250) NOT NULL, -- Encriptada
    dsNombreCompleto VARCHAR(250) NOT NULL,
    dsMail VARCHAR(150),
    cdTipoUsuario INT NOT NULL, -- Interno/Externo
    cdCliente INT NULL, -- Solo para usuarios externos
    cdClienteUsuario INT NULL, -- Solo para usuarios externos
    snClaveTemporal BIT DEFAULT 0,
    snPrimerIngreso BIT DEFAULT 1,
    feUltimoAcceso DATETIME,
    feAltaUsuario DATETIME DEFAULT GETDATE(),
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_USUARIOS_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_USUARIOS_TipoUsuario FOREIGN KEY (cdTipoUsuario) REFERENCES TV_TIPOS_USUARIO(cdTipoUsuario),
    CONSTRAINT FK_TD_USUARIOS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado),
    CONSTRAINT UK_TD_USUARIOS UNIQUE (dsUsuario, cdEmpresaConsultora)
);
GO

-- ============================================================
-- TD_CLIENTES: Clientes de las empresas consultoras
-- ============================================================
IF OBJECT_ID('TD_CLIENTES', 'U') IS NOT NULL
    DROP TABLE TD_CLIENTES;
GO

CREATE TABLE TD_CLIENTES (
    cdCliente INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT NOT NULL,
    cdCodigoInternoCliente VARCHAR(50),
    dsRazonSocial VARCHAR(250) NOT NULL,
    dsCUIT VARCHAR(20),
    dsDomicilio VARCHAR(150),
    dsLocalidad VARCHAR(100),
    dsCodigoPostal VARCHAR(15),
    cdProvincia INT,
    cdPais INT,
    cdCondicionVenta INT,
    cdIVA INT,
    dsConstanciaInscripcion VARCHAR(100), -- ID Aditus
    dsTelefono VARCHAR(50),
    dsMail VARCHAR(150),
    dsContacto1 VARCHAR(150),
    dsMail1 VARCHAR(150),
    dsCelular1 VARCHAR(50),
    dsContacto2 VARCHAR(150),
    dsMail2 VARCHAR(150),
    dsCelular2 VARCHAR(50),
    dsWeb VARCHAR(250),
    dsObservaciones NVARCHAR(MAX),
    dsLogo NVARCHAR(MAX), -- Base64
    feInicioActividades DATE,
    dsASCESI VARCHAR(150),
    dsReferidoPor VARCHAR(150),
    dsNecesidadEspecifica NVARCHAR(MAX),
    cdTipoServicio INT,
    cdModalidadTrabajo INT,
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_CLIENTES_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_CLIENTES_Provincia FOREIGN KEY (cdProvincia) REFERENCES TV_PROVINCIAS(cdProvincia),
    CONSTRAINT FK_TD_CLIENTES_Pais FOREIGN KEY (cdPais) REFERENCES TV_PAISES(cdPais),
    CONSTRAINT FK_TD_CLIENTES_CondicionVenta FOREIGN KEY (cdCondicionVenta) REFERENCES TV_CONDICION_VENTA(cdCondicionVenta),
    CONSTRAINT FK_TD_CLIENTES_IVA FOREIGN KEY (cdIVA) REFERENCES TV_IVA(cdIVA),
    CONSTRAINT FK_TD_CLIENTES_TipoServicio FOREIGN KEY (cdTipoServicio) REFERENCES TV_TIPOS_SERVICIOS(cdTipoServicio),
    CONSTRAINT FK_TD_CLIENTES_ModalidadTrabajo FOREIGN KEY (cdModalidadTrabajo) REFERENCES TV_MODALIDAD_TRABAJO(cdModalidadTrabajo),
    CONSTRAINT FK_TD_CLIENTES_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_SECTORES: Sectores de los clientes
-- ============================================================
IF OBJECT_ID('TD_SECTORES', 'U') IS NOT NULL
    DROP TABLE TD_SECTORES;
GO

CREATE TABLE TD_SECTORES (
    cdSector INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT NOT NULL,
    cdCliente INT NOT NULL,
    dsSector VARCHAR(150) NOT NULL,
    dsDescripcion VARCHAR(250),
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TD_SECTORES_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_SECTORES_Cliente FOREIGN KEY (cdCliente) REFERENCES TD_CLIENTES(cdCliente),
    CONSTRAINT FK_TD_SECTORES_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_PUESTOS: Puestos de trabajo de los clientes
-- ============================================================
IF OBJECT_ID('TD_PUESTOS', 'U') IS NOT NULL
    DROP TABLE TD_PUESTOS;
GO

CREATE TABLE TD_PUESTOS (
    cdPuesto INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT NOT NULL,
    cdCliente INT NOT NULL,
    dsPuesto VARCHAR(150) NOT NULL,
    dsDescripcion VARCHAR(250),
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TD_PUESTOS_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_PUESTOS_Cliente FOREIGN KEY (cdCliente) REFERENCES TD_CLIENTES(cdCliente),
    CONSTRAINT FK_TD_PUESTOS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_PRESUPUESTOS: Presupuestos de clientes
-- ============================================================
IF OBJECT_ID('TD_PRESUPUESTOS', 'U') IS NOT NULL
    DROP TABLE TD_PRESUPUESTOS;
GO

CREATE TABLE TD_PRESUPUESTOS (
    cdPresupuesto INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT NOT NULL,
    cdCliente INT NOT NULL,
    fePresupuesto DATE NOT NULL,
    dsDescripcion VARCHAR(250),
    dsPresupuesto VARCHAR(100), -- ID Aditus
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TD_PRESUPUESTOS_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_PRESUPUESTOS_Cliente FOREIGN KEY (cdCliente) REFERENCES TD_CLIENTES(cdCliente),
    CONSTRAINT FK_TD_PRESUPUESTOS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_CLIENTES_USUARIOS: Usuarios/Empleados de los clientes
-- ============================================================
IF OBJECT_ID('TD_CLIENTES_USUARIOS', 'U') IS NOT NULL
    DROP TABLE TD_CLIENTES_USUARIOS;
GO

CREATE TABLE TD_CLIENTES_USUARIOS (
    cdClienteUsuario INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT NOT NULL,
    cdCliente INT NOT NULL,
    dsApellidoNombre VARCHAR(250) NOT NULL,
    cdPuesto INT,
    feNacimiento DATE,
    dsCUIT VARCHAR(20),
    dsDNI VARCHAR(20),
    cdNacionalidad INT,
    dsCelularParticular VARCHAR(50),
    dsPersonaContacto VARCHAR(150),
    dsCelularContacto VARCHAR(50),
    dsDomicilioCalle VARCHAR(150),
    dsDomicilioEntreCalles VARCHAR(250),
    dsDomicilioNumero VARCHAR(10),
    dsDomicilioPiso VARCHAR(5),
    dsDomicilioDepartamento VARCHAR(10),
    cdDomicilioPais INT,
    cdDomicilioProvincia INT,
    dsDomicilioLocalidad VARCHAR(100),
    dsDomicilioCodigoPostal VARCHAR(25),
    dsObservaciones NVARCHAR(MAX),
    dsImagenFirma NVARCHAR(MAX), -- Base64
    dsImagenUsuario VARCHAR(100), -- ID Aditus
    cdEstadoCivil INT,
    dsCV VARCHAR(100), -- ID Aditus
    dsSindicato VARCHAR(100),
    dsObraSocial VARCHAR(100),
    dsCBU VARCHAR(30),
    dsBanco VARCHAR(100),
    dsNumeroCuenta VARCHAR(25),
    dsPeriodoPrueba VARCHAR(100),
    feInicio DATETIME,
    feCierre DATETIME,
    dsResultado VARCHAR(100),
    dsCategoriaLaboral VARCHAR(100),
    nuSueldoIngreso MONEY,
    nuSueldoActual MONEY,
    feIngreso DATE,
    dsActaMatrimonioConcubinato VARCHAR(100), -- ID Aditus
    dsEstudiosCursados NVARCHAR(MAX),
    dsCertificadoAnalitico VARCHAR(100), -- ID Aditus
    dsFotocopiaDNI VARCHAR(100), -- ID Aditus
    dsServicio VARCHAR(100), -- ID Aditus
    dsExamenMedico VARCHAR(100), -- ID Aditus
    dsObservacionesGenerales NVARCHAR(MAX),
    feBaja DATETIME,
    dsMotivoDesvinculacion NVARCHAR(MAX),
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_CLIENTES_USUARIOS_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_CLIENTES_USUARIOS_Cliente FOREIGN KEY (cdCliente) REFERENCES TD_CLIENTES(cdCliente),
    CONSTRAINT FK_TD_CLIENTES_USUARIOS_Puesto FOREIGN KEY (cdPuesto) REFERENCES TD_PUESTOS(cdPuesto),
    CONSTRAINT FK_TD_CLIENTES_USUARIOS_Nacionalidad FOREIGN KEY (cdNacionalidad) REFERENCES TV_PAISES(cdPais),
    CONSTRAINT FK_TD_CLIENTES_USUARIOS_DomicilioPais FOREIGN KEY (cdDomicilioPais) REFERENCES TV_PAISES(cdPais),
    CONSTRAINT FK_TD_CLIENTES_USUARIOS_DomicilioProvincia FOREIGN KEY (cdDomicilioProvincia) REFERENCES TV_PROVINCIAS(cdProvincia),
    CONSTRAINT FK_TD_CLIENTES_USUARIOS_EstadoCivil FOREIGN KEY (cdEstadoCivil) REFERENCES TV_ESTADO_CIVIL(cdEstadoCivil),
    CONSTRAINT FK_TD_CLIENTES_USUARIOS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_CLIENTES_USUARIOS_SANCIONES: Sanciones de usuarios clientes
-- ============================================================
IF OBJECT_ID('TD_CLIENTES_USUARIOS_SANCIONES', 'U') IS NOT NULL
    DROP TABLE TD_CLIENTES_USUARIOS_SANCIONES;
GO

CREATE TABLE TD_CLIENTES_USUARIOS_SANCIONES (
    cdClienteUsuarioSancion INT IDENTITY(1,1) PRIMARY KEY,
    cdClienteUsuario INT NOT NULL,
    feSancionSuspension DATETIME NOT NULL,
    dsSancionSuspension NVARCHAR(MAX),
    dsMotivo NVARCHAR(MAX),
    dsDescargo NVARCHAR(MAX),
    dsDescargoArchivo VARCHAR(100), -- ID Aditus
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TD_SANCIONES_ClienteUsuario FOREIGN KEY (cdClienteUsuario) REFERENCES TD_CLIENTES_USUARIOS(cdClienteUsuario)
);
GO

-- ============================================================
-- TD_NORMAS: Normas maestro por empresa consultora
-- ============================================================
IF OBJECT_ID('TD_NORMAS', 'U') IS NOT NULL
    DROP TABLE TD_NORMAS;
GO

CREATE TABLE TD_NORMAS (
    cdNorma INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT NOT NULL,
    cdCodigo VARCHAR(50) NOT NULL,
    dsNombre VARCHAR(250) NOT NULL,
    dsVersion VARCHAR(50),
    dsOrganismoEmisor VARCHAR(250),
    feVigenteDesde DATE,
    dsDescripcion NVARCHAR(MAX),
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_NORMAS_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_NORMAS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado),
    CONSTRAINT UK_TD_NORMAS UNIQUE (cdEmpresaConsultora, cdCodigo, dsVersion)
);
GO

-- ============================================================
-- TD_REQUISITOS: Requisitos/Procesos de las normas
-- ============================================================
IF OBJECT_ID('TD_REQUISITOS', 'U') IS NOT NULL
    DROP TABLE TD_REQUISITOS;
GO

CREATE TABLE TD_REQUISITOS (
    cdRequisito INT IDENTITY(1,1) PRIMARY KEY,
    cdNorma INT NOT NULL,
    cdCodigoRequisito VARCHAR(50),
    dsRequisito VARCHAR(250) NOT NULL,
    dsDescripcion NVARCHAR(MAX),
    nuOrden INT DEFAULT 0,
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_REQUISITOS_Norma FOREIGN KEY (cdNorma) REFERENCES TD_NORMAS(cdNorma),
    CONSTRAINT FK_TD_REQUISITOS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_LISTAS: Listas dinámicas para campos de templates
-- ============================================================
IF OBJECT_ID('TD_LISTAS', 'U') IS NOT NULL
    DROP TABLE TD_LISTAS;
GO

CREATE TABLE TD_LISTAS (
    cdLista INT IDENTITY(1,1) PRIMARY KEY,
    cdEmpresaConsultora INT NOT NULL,
    cdCliente INT NULL, -- NULL = lista de consultora
    dsNombreLista VARCHAR(150) NOT NULL,
    dsDescripcion VARCHAR(250),
    dsTipo VARCHAR(50), -- 'SISTEMA' (sectores, puestos), 'CUSTOM' (definida por usuario)
    cdEstado INT NOT NULL,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TD_LISTAS_Empresa FOREIGN KEY (cdEmpresaConsultora) REFERENCES TD_EMPRESAS_CONSULTORAS(cdEmpresaConsultora),
    CONSTRAINT FK_TD_LISTAS_Cliente FOREIGN KEY (cdCliente) REFERENCES TD_CLIENTES(cdCliente),
    CONSTRAINT FK_TD_LISTAS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_LISTAS_ITEMS: Items de las listas dinámicas
-- ============================================================
IF OBJECT_ID('TD_LISTAS_ITEMS', 'U') IS NOT NULL
    DROP TABLE TD_LISTAS_ITEMS;
GO

CREATE TABLE TD_LISTAS_ITEMS (
    cdListaItem INT IDENTITY(1,1) PRIMARY KEY,
    cdLista INT NOT NULL,
    dsValor VARCHAR(250) NOT NULL,
    dsDescripcion VARCHAR(250),
    nuOrden INT DEFAULT 0,
    snActivo BIT DEFAULT 1,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TD_LISTAS_ITEMS_Lista FOREIGN KEY (cdLista) REFERENCES TD_LISTAS(cdLista)
);
GO

-- ============================================================
-- TD_TEMPLATES_DOCUMENTOS: Templates documentales por requisito
-- ============================================================
IF OBJECT_ID('TD_TEMPLATES_DOCUMENTOS', 'U') IS NOT NULL
    DROP TABLE TD_TEMPLATES_DOCUMENTOS;
GO

CREATE TABLE TD_TEMPLATES_DOCUMENTOS (
    cdTemplateDocumento INT IDENTITY(1,1) PRIMARY KEY,
    cdRequisito INT NOT NULL,
    cdCodigo VARCHAR(50),
    dsNombre VARCHAR(250) NOT NULL,
    cdTipoDocumento INT, -- Procedimiento/Política/Registro
    dsVersionTemplate VARCHAR(50),
    dsArchivoWord NVARCHAR(MAX), -- Base64 del template Word
    dsNombreArchivo VARCHAR(250),
    snActivo BIT DEFAULT 1,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_TEMPLATES_DOCUMENTOS_Requisito FOREIGN KEY (cdRequisito) REFERENCES TD_REQUISITOS(cdRequisito),
    CONSTRAINT FK_TD_TEMPLATES_DOCUMENTOS_TipoDocumento FOREIGN KEY (cdTipoDocumento) REFERENCES TV_TIPOS_DOCUMENTO(cdTipoDocumento)
);
GO

-- ============================================================
-- TD_TEMPLATES_SECCIONES: Secciones de los templates
-- ============================================================
IF OBJECT_ID('TD_TEMPLATES_SECCIONES', 'U') IS NOT NULL
    DROP TABLE TD_TEMPLATES_SECCIONES;
GO

CREATE TABLE TD_TEMPLATES_SECCIONES (
    cdTemplateSeccion INT IDENTITY(1,1) PRIMARY KEY,
    cdTemplateDocumento INT NOT NULL,
    nuOrden INT NOT NULL,
    dsTitulo VARCHAR(250),
    dsContenidoBase NVARCHAR(MAX), -- Admite variables {{variable}}
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TD_TEMPLATES_SECCIONES_Template FOREIGN KEY (cdTemplateDocumento) REFERENCES TD_TEMPLATES_DOCUMENTOS(cdTemplateDocumento)
);
GO

-- ============================================================
-- TD_TEMPLATES_CAMPOS: Campos de los templates
-- ============================================================
IF OBJECT_ID('TD_TEMPLATES_CAMPOS', 'U') IS NOT NULL
    DROP TABLE TD_TEMPLATES_CAMPOS;
GO

CREATE TABLE TD_TEMPLATES_CAMPOS (
    cdTemplateCampo INT IDENTITY(1,1) PRIMARY KEY,
    cdTemplateDocumento INT NOT NULL,
    dsNombreCampo VARCHAR(100) NOT NULL,
    dsEtiqueta VARCHAR(250),
    cdTipoCampo INT NOT NULL, -- texto, numero, fecha, lista
    dsValorDefault NVARCHAR(MAX),
    snHeredaCliente BIT DEFAULT 0,
    snObligatorio BIT DEFAULT 0,
    cdLista INT NULL, -- Si es tipo lista
    nuOrden INT DEFAULT 0,
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    CONSTRAINT FK_TD_TEMPLATES_CAMPOS_Template FOREIGN KEY (cdTemplateDocumento) REFERENCES TD_TEMPLATES_DOCUMENTOS(cdTemplateDocumento),
    CONSTRAINT FK_TD_TEMPLATES_CAMPOS_TipoCampo FOREIGN KEY (cdTipoCampo) REFERENCES TV_TIPOS_CAMPO(cdTipoCampo),
    CONSTRAINT FK_TD_TEMPLATES_CAMPOS_Lista FOREIGN KEY (cdLista) REFERENCES TD_LISTAS(cdLista)
);
GO

-- ============================================================
-- TD_CERTIFICACIONES: Certificaciones de clientes
-- ============================================================
IF OBJECT_ID('TD_CERTIFICACIONES', 'U') IS NOT NULL
    DROP TABLE TD_CERTIFICACIONES;
GO

CREATE TABLE TD_CERTIFICACIONES (
    cdCertificacion INT IDENTITY(1,1) PRIMARY KEY,
    cdCliente INT NOT NULL,
    cdNorma INT NOT NULL,
    cdCodigo VARCHAR(50),
    dsDescripcion VARCHAR(250),
    cdEstado INT NOT NULL, -- Borrador/En Proceso/Certificado
    feInicio DATE,
    feObjetivo DATE,
    feCertificacion DATE NULL,
    dsObservaciones NVARCHAR(MAX),
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_CERTIFICACIONES_Cliente FOREIGN KEY (cdCliente) REFERENCES TD_CLIENTES(cdCliente),
    CONSTRAINT FK_TD_CERTIFICACIONES_Norma FOREIGN KEY (cdNorma) REFERENCES TD_NORMAS(cdNorma),
    CONSTRAINT FK_TD_CERTIFICACIONES_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_CERTIFICACIONES_DOCUMENTOS: Documentos de certificaciones
-- ============================================================
IF OBJECT_ID('TD_CERTIFICACIONES_DOCUMENTOS', 'U') IS NOT NULL
    DROP TABLE TD_CERTIFICACIONES_DOCUMENTOS;
GO

CREATE TABLE TD_CERTIFICACIONES_DOCUMENTOS (
    cdCertificacionDocumento INT IDENTITY(1,1) PRIMARY KEY,
    cdCertificacion INT NOT NULL,
    cdTemplateDocumento INT NOT NULL,
    dsNombreDocumento VARCHAR(250),
    cdEstado INT NOT NULL, -- Pendiente/En Edición/Aprobado
    nuVersionDocumento INT DEFAULT 1,
    dsDocumentoGenerado VARCHAR(100), -- ID Aditus del documento generado
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_CERT_DOCUMENTOS_Certificacion FOREIGN KEY (cdCertificacion) REFERENCES TD_CERTIFICACIONES(cdCertificacion),
    CONSTRAINT FK_TD_CERT_DOCUMENTOS_Template FOREIGN KEY (cdTemplateDocumento) REFERENCES TD_TEMPLATES_DOCUMENTOS(cdTemplateDocumento),
    CONSTRAINT FK_TD_CERT_DOCUMENTOS_Estado FOREIGN KEY (cdEstado) REFERENCES TV_ESTADOS(cdEstado)
);
GO

-- ============================================================
-- TD_CERTIFICACIONES_SECCIONES: Secciones editadas de documentos
-- ============================================================
IF OBJECT_ID('TD_CERTIFICACIONES_SECCIONES', 'U') IS NOT NULL
    DROP TABLE TD_CERTIFICACIONES_SECCIONES;
GO

CREATE TABLE TD_CERTIFICACIONES_SECCIONES (
    cdCertificacionSeccion INT IDENTITY(1,1) PRIMARY KEY,
    cdCertificacionDocumento INT NOT NULL,
    nuOrden INT,
    dsTitulo VARCHAR(250),
    dsContenidoEditado NVARCHAR(MAX),
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_CERT_SECCIONES_Documento FOREIGN KEY (cdCertificacionDocumento) REFERENCES TD_CERTIFICACIONES_DOCUMENTOS(cdCertificacionDocumento)
);
GO

-- ============================================================
-- TD_CERTIFICACIONES_CAMPOS_VALORES: Valores de campos de documentos
-- ============================================================
IF OBJECT_ID('TD_CERTIFICACIONES_CAMPOS_VALORES', 'U') IS NOT NULL
    DROP TABLE TD_CERTIFICACIONES_CAMPOS_VALORES;
GO

CREATE TABLE TD_CERTIFICACIONES_CAMPOS_VALORES (
    cdCampoValor INT IDENTITY(1,1) PRIMARY KEY,
    cdCertificacionDocumento INT NOT NULL,
    dsNombreCampo VARCHAR(100) NOT NULL,
    dsValor NVARCHAR(MAX),
    feCreacion DATETIME DEFAULT GETDATE(),
    cdUsuarioCreacion INT,
    feModificacion DATETIME,
    cdUsuarioModificacion INT,
    CONSTRAINT FK_TD_CERT_CAMPOS_VALORES_Documento FOREIGN KEY (cdCertificacionDocumento) REFERENCES TD_CERTIFICACIONES_DOCUMENTOS(cdCertificacionDocumento)
);
GO

PRINT '✓ Tablas de Datos (TD_) creadas exitosamente';
GO
