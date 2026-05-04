# Base de Datos - Sistema de Gestión de Calidad ISO

## 📋 Descripción

Base de datos SQL Server para el sistema de gestión de certificaciones de calidad ISO.
Arquitectura multi-tenant con soporte completo para empresas consultoras, clientes, normas, certificaciones y generación documental.

## 🗄️ Estructura de Archivos

```
database/
├── 00_MASTER_SCRIPT.sql          # Script maestro que ejecuta todos en orden
├── 01_CREATE_TV_TABLES.sql       # Tablas de Valores (TV_) - Catálogos
├── 02_CREATE_TD_TABLES.sql       # Tablas de Datos (TD_) - Datos principales
├── 03_CREATE_TR_TABLES.sql       # Tablas de Relación (TR_) - Muchos a muchos
└── 04_INSERT_INITIAL_DATA.sql    # Datos iniciales y configuración
```

## 🚀 Instalación

### Requisitos Previos
- SQL Server 2019+ o SQL Server Express
- SQL Server Management Studio (SSMS) o Azure Data Studio

### Conexión
```
Servidor: localhost\SQLEXPRESS
Usuario: sa
Contraseña: 123
Base de Datos: ISO
```

### Ejecución

**Opción 1: Script Maestro (Recomendado)**
```sql
-- Desde SSMS, abrir y ejecutar:
00_MASTER_SCRIPT.sql
```

**Opción 2: PowerShell**
```powershell
cd c:\Repo\ISO\database
sqlcmd -S localhost\SQLEXPRESS -U sa -P 123 -i 00_MASTER_SCRIPT.sql
```

**Opción 3: Scripts Individuales**
```sql
-- Ejecutar en orden:
1. 01_CREATE_TV_TABLES.sql
2. 02_CREATE_TD_TABLES.sql
3. 03_CREATE_TR_TABLES.sql
4. 04_INSERT_INITIAL_DATA.sql
```

## 👥 Usuarios Creados

### Super Administrador (Sistema Global)
- **Usuario:** `admin`
- **Contraseña:** `123`
- **URL:** http://localhost:3000/login/0
- **Descripción:** Administrador del sistema multi-tenant

### Empresa Consultora: DC - Gestión & Estrategia
- **Usuario:** `ISO`
- **Contraseña:** `123`
- **URL:** http://localhost:3000/login/1
- **Descripción:** Administrador de la empresa consultora

> ⚠️ **Nota de Seguridad:** Las contraseñas están en MD5 solo para desarrollo. En producción usar bcrypt.

## 📊 Estructura de Datos

### Nomenclatura de Tablas
- **TV_** Tablas de Valores (catálogos fijos)
- **TD_** Tablas de Datos (datos principales)
- **TR_** Tablas de Relación (muchos a muchos)
- **TMP_** Tablas Temporales (si se necesitan)

### Nomenclatura de Campos
- **cd** Campos ID/Código
- **ds** Campos de texto/descripción
- **fe** Campos de fecha
- **nu** Campos numéricos
- **sn** Campos booleanos (Si/No)

### Tablas Principales

#### Multi-tenant
- `TD_EMPRESAS_CONSULTORAS` - Empresas consultoras
- `TD_PARAMETROS` - Configuración por empresa

#### Seguridad
- `TD_USUARIOS` - Usuarios del sistema
- `TD_ROLES` - Roles personalizables
- `TD_PERMISOS` - Permisos del sistema
- `TR_USUARIOS_ROLES` - Asignación usuario-rol
- `TR_ROLES_PERMISOS` - Asignación rol-permiso

#### Gestión de Clientes
- `TD_CLIENTES` - Clientes de las consultoras
- `TD_SECTORES` - Sectores/Áreas del cliente
- `TD_PUESTOS` - Puestos de trabajo
- `TD_CLIENTES_USUARIOS` - Empleados del cliente
- `TD_PRESUPUESTOS` - Presupuestos

#### Configuración de Normas
- `TD_NORMAS` - Normas maestro (ISO 9001, etc.)
- `TD_REQUISITOS` - Requisitos/Procesos de cada norma
- `TD_TEMPLATES_DOCUMENTOS` - Templates documentales
- `TD_TEMPLATES_SECCIONES` - Secciones de templates
- `TD_TEMPLATES_CAMPOS` - Campos parametrizables
- `TD_LISTAS` - Listas dinámicas
- `TD_LISTAS_ITEMS` - Items de listas

#### Certificaciones
- `TD_CERTIFICACIONES` - Certificaciones de clientes
- `TD_CERTIFICACIONES_DOCUMENTOS` - Documentos de certificación
- `TD_CERTIFICACIONES_SECCIONES` - Secciones editadas
- `TD_CERTIFICACIONES_CAMPOS_VALORES` - Valores de campos

#### Catálogos (TV_)
- `TV_ESTADOS` - Estados del sistema
- `TV_PAISES` - Catálogo de países
- `TV_PROVINCIAS` - Provincias/Estados
- `TV_CONDICION_VENTA` - Condiciones de venta
- `TV_IVA` - Condiciones de IVA
- `TV_MODALIDAD_TRABAJO` - Modalidades de trabajo
- `TV_TIPOS_SERVICIOS` - Tipos de servicios
- `TV_ESTADO_CIVIL` - Estados civiles
- `TV_TIPOS_USUARIO` - Tipos de usuario
- `TV_TIPOS_CAMPO` - Tipos de campo para templates
- `TV_TIPOS_DOCUMENTO` - Tipos de documento

## 🔐 Roles y Permisos

### Roles Predefinidos
1. **SuperAdministrador** - Acceso total al sistema
2. **Administrador** - Administrador de empresa consultora
3. **Consultor** - Consultor con permisos operativos
4. **Cliente** - Usuario externo (solo lectura limitada)

### Módulos de Permisos
- SUPERADMIN - Gestión de empresas consultoras
- EMPRESAS - Gestión de empresas
- USUARIOS - Gestión de usuarios
- ROLES - Gestión de roles
- NORMAS - Configuración de normas
- CLIENTES - Gestión de clientes
- CERTIFICACIONES - Gestión de certificaciones
- DOCUMENTOS - Gestión y generación de documentos
- REPORTES - Consultas y reportes
- DASHBOARD - Visualización de dashboard

## 🔄 Estados del Sistema

### Estados Generales (GENERAL)
- **Activo** - Registro activo
- **Inactivo** - Registro deshabilitado
- **Eliminado** - Borrado lógico

### Estados de Certificación (CERTIFICACION)
- **Borrador** - En preparación
- **En Proceso** - En ejecución
- **Certificado** - Completado
- **Suspendido** - Suspendido temporalmente

### Estados de Documento (DOCUMENTO)
- **Pendiente** - Sin editar
- **En Edición** - Siendo editado
- **Aprobado** - Aprobado
- **Rechazado** - Rechazado

## 🔗 Integración con Aditus DMS

Los parámetros de conexión con el gestor documental Aditus se almacenan en `TD_PARAMETROS`:

- `URL_AGREGAR_DOCUMENTO` - Endpoint para subir documentos
- `URL_MODIFICAR_DOCUMENTO` - Endpoint para modificar
- `URL_VISOR` - URL del visor
- `URL_TOKEN` - Endpoint de autenticación
- `USUARIO_TOKEN` - Usuario de servicio
- `CLAVE_TOKEN` - Contraseña de servicio
- `CODIGO_LIBRERIA` - ID de librería
- `CODIGO_CLASE` - ID de clase de documento

## 📝 Auditoría

Todas las tablas principales incluyen campos de auditoría:
- `feCreacion` - Fecha de creación
- `cdUsuarioCreacion` - Usuario que creó
- `feModificacion` - Fecha de última modificación
- `cdUsuarioModificacion` - Usuario que modificó

## 🗑️ Borrado Lógico

El sistema implementa borrado lógico usando:
- Campo `cdEstado` apuntando a TV_ESTADOS
- Estado "Eliminado" (cdEstado = 3)
- Campo `feBaja` en algunas tablas

## 📊 Diagramas

### Estructura Multi-tenant
```
TD_EMPRESAS_CONSULTORAS (1)
    ├── TD_USUARIOS (N)
    ├── TD_PARAMETROS (N)
    ├── TD_ROLES (N)
    ├── TD_NORMAS (N)
    │   └── TD_REQUISITOS (N)
    │       └── TD_TEMPLATES_DOCUMENTOS (N)
    └── TD_CLIENTES (N)
        ├── TD_SECTORES (N)
        ├── TD_PUESTOS (N)
        ├── TD_CLIENTES_USUARIOS (N)
        └── TD_CERTIFICACIONES (N)
            └── TD_CERTIFICACIONES_DOCUMENTOS (N)
```

## 🛠️ Mantenimiento

### Backup
```sql
BACKUP DATABASE ISO
TO DISK = 'C:\Backups\ISO_backup.bak'
WITH FORMAT, MEDIANAME = 'ISO_Backup', NAME = 'Full Backup of ISO';
```

### Restore
```sql
RESTORE DATABASE ISO
FROM DISK = 'C:\Backups\ISO_backup.bak'
WITH REPLACE;
```

### Verificar Integridad
```sql
USE ISO;
DBCC CHECKDB('ISO');
```

## 📞 Soporte

Para problemas o consultas sobre la base de datos, contactar al equipo de desarrollo.

---

**Fecha de Creación:** 2026-05-02  
**Versión:** 1.0.0  
**Autor:** Sistema de Gestión de Calidad ISO
