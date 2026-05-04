# 🏢 Sistema de Gestión de Calidad ISO

Sistema completo multi-tenant para empresas consultoras dedicadas a la gestión de certificaciones de calidad ISO. Desarrollado con NextJS, TypeScript, SQL Server y Tailwind CSS.

## 📋 Descripción

Plataforma SaaS que permite a empresas consultoras gestionar sus clientes, normas, certificaciones y documentación de manera integral. Incluye generación automática de documentos Word, integración con gestor documental Aditus y sistema completo de roles y permisos.

## ✨ Características Principales

### 🔐 Multi-Tenant
- Arquitectura multi-tenant con aislamiento de datos
- Super administrador para gestión de empresas consultoras
- Login independiente por empresa consultora

### 📊 Gestión Completa
- **Normas**: Configuración de normas maestro con versionado (ISO 9001, ISO 14001, etc.)
- **Requisitos**: Definición de procesos y requisitos por norma
- **Templates**: Sistema parametrizable de formularios con campos dinámicos
- **Clientes**: CRUD completo con sectores, puestos y usuarios
- **Certificaciones**: Seguimiento de certificaciones con estados
- **Documentos**: Generación automática de documentos Word

### 👥 Usuarios y Seguridad
- Sistema de roles y permisos personalizables
- Usuarios internos (consultores) y externos (clientes)
- Autenticación con JWT y contraseñas encriptadas (bcrypt)
- Primer ingreso con cambio de contraseña obligatorio

### 📄 Gestión Documental
- Integración con Aditus DMS para almacenamiento
- Generación de documentos desde templates
- Visor de documentos integrado
- Soporte para logos y archivos base64

### 📈 Reportes y Consultas
- Consultas personalizadas
- Exportación a Excel
- Dashboard con KPIs por rol

## 🛠️ Tecnologías

- **Frontend**: NextJS 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: NextJS API Routes (Server Actions)
- **Base de Datos**: Microsoft SQL Server 2019+
- **Autenticación**: JWT + bcrypt
- **Gestión Documental**: Integración con Aditus DMS
- **Generación de Documentos**: docx (Word)
- **Exportación**: xlsx (Excel)

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ y npm
- SQL Server 2019+ o SQL Server Express
- Git

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd c:\Repo\ISO
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Base de Datos

#### Conectarse a SQL Server

```
Servidor: localhost\SQLEXPRESS
Usuario: sa
Contraseña: 123
```

#### Ejecutar Scripts

```bash
cd database
sqlcmd -S localhost\SQLEXPRESS -U sa -P 123 -C -i 00_MASTER_SCRIPT.sql
```

O desde SQL Server Management Studio (SSMS), ejecutar `00_MASTER_SCRIPT.sql`

### 4. Configurar Variables de Entorno

Copiar `.env.example` a `.env.local` y ajustar si es necesario:

```bash
cp .env.example .env.local
```

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔑 Accesos Iniciales

### Super Administrador
- **URL**: http://localhost:3000/login/0
- **Usuario**: `admin`
- **Contraseña**: `123`
- **Descripción**: Acceso completo al sistema para gestionar empresas consultoras

### Empresa Consultora: DC - Gestión & Estrategia
- **URL**: http://localhost:3000/login/1
- **Usuario**: `ISO`
- **Contraseña**: `123`
- **Descripción**: Usuario administrador de la empresa consultora de ejemplo

> ⚠️ **Importante**: Cambiar las contraseñas en producción

## 📁 Estructura del Proyecto

```
ISO/
├── app/                          # Aplicación NextJS (App Router)
│   ├── api/                     # API Routes
│   │   └── auth/                # Endpoints de autenticación
│   ├── login/[tenant]/          # Login multi-tenant
│   ├── admin/[tenant]/          # Módulo super admin
│   └── dashboard/[tenant]/      # Dashboard empresas consultoras
├── components/                   # Componentes React
│   ├── ui/                      # Componentes UI (shadcn)
│   └── auth/                    # Componentes de autenticación
├── lib/                         # Utilidades y lógica de negocio
│   ├── db.ts                    # Conexión a SQL Server
│   ├── auth.ts                  # Sistema de autenticación
│   ├── types.ts                 # Tipos TypeScript
│   └── utils.ts                 # Funciones utilitarias
├── database/                     # Scripts SQL
│   ├── 00_MASTER_SCRIPT.sql     # Script maestro
│   ├── 01_CREATE_TV_TABLES.sql  # Tablas de valores
│   ├── 02_CREATE_TD_TABLES.sql  # Tablas de datos
│   ├── 03_CREATE_TR_TABLES.sql  # Tablas de relación
│   ├── 04_INSERT_INITIAL_DATA.sql # Datos iniciales
│   └── README.md                 # Documentación de BD
└── public/                       # Archivos estáticos

```

## 🗃️ Base de Datos

### Nomenclatura de Tablas
- **TV_** Tablas de Valores (catálogos)
- **TD_** Tablas de Datos (datos principales)
- **TR_** Tablas de Relación (muchos a muchos)

### Nomenclatura de Campos
- **cd** Campos ID/Código
- **ds** Campos texto/descripción
- **fe** Campos fecha
- **nu** Campos numéricos
- **sn** Campos booleanos (Si/No)

### Tablas Principales

#### Multi-tenant y Seguridad
- `TD_EMPRESAS_CONSULTORAS` - Empresas consultoras
- `TD_PARAMETROS` - Configuración por empresa
- `TD_USUARIOS` - Usuarios del sistema
- `TD_ROLES` - Roles personalizables
- `TD_PERMISOS` - Permisos del sistema
- `TR_USUARIOS_ROLES` - Relación usuario-rol
- `TR_ROLES_PERMISOS` - Relación rol-permiso

#### Gestión de Clientes
- `TD_CLIENTES` - Clientes
- `TD_SECTORES` - Sectores del cliente
- `TD_PUESTOS` - Puestos de trabajo
- `TD_CLIENTES_USUARIOS` - Empleados del cliente
- `TD_PRESUPUESTOS` - Presupuestos

#### Normas y Templates
- `TD_NORMAS` - Normas maestro
- `TD_REQUISITOS` - Requisitos/Procesos
- `TD_TEMPLATES_DOCUMENTOS` - Templates documentales
- `TD_TEMPLATES_SECCIONES` - Secciones de templates
- `TD_TEMPLATES_CAMPOS` - Campos parametrizables
- `TD_LISTAS` - Listas dinámicas
- `TD_LISTAS_ITEMS` - Items de listas

#### Certificaciones
- `TD_CERTIFICACIONES` - Certificaciones de clientes
- `TD_CERTIFICACIONES_DOCUMENTOS` - Documentos
- `TD_CERTIFICACIONES_SECCIONES` - Secciones editadas
- `TD_CERTIFICACIONES_CAMPOS_VALORES` - Valores de campos

## 🔧 Configuración Aditus DMS

Los parámetros de integración con Aditus se configuran en `TD_PARAMETROS`:

- `URL_AGREGAR_DOCUMENTO` - Endpoint para subir documentos
- `URL_MODIFICAR_DOCUMENTO` - Endpoint para modificar
- `URL_VISOR` - URL del visor de documentos
- `URL_TOKEN` - Endpoint de autenticación
- `USUARIO_TOKEN` - Usuario de servicio
- `CLAVE_TOKEN` - Contraseña de servicio
- `CODIGO_LIBRERIA` - ID de librería en Aditus
- `CODIGO_CLASE` - ID de clase de documento

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Compila para producción
npm run start        # Inicia servidor de producción

# Calidad de Código
npm run lint         # Ejecuta ESLint
```

## 🗺️ Roadmap

### ✅ Fase 1: Fundamentos (Completado)
- [x] Base de datos completa
- [x] Sistema de autenticación multi-tenant
- [x] Login super admin y empresas consultoras
- [x] Estructura NextJS con TypeScript
- [x] Configuración UI (Tailwind + shadcn)

### 🚧 Fase 2: Módulos Principales (En Desarrollo)
- [ ] CRUD Empresas Consultoras (Super Admin)
- [ ] Gestión de Usuarios y Roles
- [ ] Configuración de Normas
- [ ] CRUD Clientes
- [ ] Dashboard con KPIs

### 📋 Fase 3: Certificaciones
- [ ] Vista de Clientes
- [ ] Gestión de Certificaciones
- [ ] Documentos de Certificación
- [ ] Generación de documentos Word
- [ ] Integración completa con Aditus

### 📊 Fase 4: Reportes y Consultas
- [ ] Motor de consultas personalizadas
- [ ] Exportación a Excel
- [ ] Reportes por cliente
- [ ] Reportes por consultora
- [ ] Dashboard avanzado con gráficos

### 🔔 Fase 5: Funcionalidades Avanzadas
- [ ] Sistema de notificaciones
- [ ] Envío de emails automáticos
- [ ] Historial de cambios
- [ ] Logs de auditoría
- [ ] Integración con Keycloak

## 🤝 Contribución

Este es un proyecto privado. Para contribuir, contactar al equipo de desarrollo.

## 📄 Licencia

Propiedad privada. Todos los derechos reservados.

## 👨‍💻 Equipo de Desarrollo

- **Cliente**: DC - Gestión & Estrategia
- **Desarrollo**: Sistema ISO Quality Management

## 📞 Soporte

Para soporte técnico o consultas:
- Email: info@dcgestion.com.ar
- Teléfono: +54 11 5907-7702
- Web: https://dcgestion.com.ar/

---

**Versión**: 1.0.0  
**Última Actualización**: Mayo 2026  
**Estado**: En Desarrollo Activo
