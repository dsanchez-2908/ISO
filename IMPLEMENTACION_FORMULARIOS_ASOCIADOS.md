# Implementación de Asociación y Copia de Formularios entre Certificaciones

## Resumen de Cambios

Se ha implementado exitosamente la funcionalidad para asociar y copiar formularios entre requisitos de diferentes certificaciones (o la misma certificación).

## Características Implementadas

### 1. Base de Datos

**Nueva Tabla: `TR_REQUISITOS_REGISTROS_ASOCIADOS`**
- Gestiona las asociaciones de formularios entre requisitos
- Incluye información de origen (certificación, requisito, registro)
- Previene duplicados con índice único
- Script de migración: `database/20_MIGRATION_FORMULARIOS_ASOCIADOS.sql`

### 2. APIs Nuevas

#### `/api/admin/requisitos/[id]/registros`
- **GET**: Obtiene registros de un requisito agrupados por template
- Usado para los selectores en cascada de los modales

#### `/api/admin/requisitos/[id]/asociar-registro`
- **POST**: Crea una asociación entre un requisito y un registro existente
- No duplica datos, solo crea referencia

#### `/api/admin/requisitos/[id]/copiar-registro`
- **POST**: Copia completamente un registro (incluidos valores de campos)
- Crea un nuevo registro independiente

#### `/api/admin/requisitos/[id]/registros-asociados`
- **GET**: Obtiene todos los registros asociados a un requisito
- Incluye información completa de origen

#### `/api/admin/asociaciones/[id]`
- **DELETE**: Elimina una asociación (sin eliminar el registro original)

### 3. Componentes de UI

#### `AgregarRegistroDialog`
- Modal mejorado para agregar registros
- Incluye selector de formulario disponible para el requisito
- Campo de título del registro

#### `AsociarRegistroDialog`
- Modal con selectores en cascada:
  - Certificación → Requisito → Formulario → Título Formulario
- Muestra estado y fecha del registro a asociar
- Permite compartir registros entre certificaciones

#### `CopiarRegistroDialog`
- Similar a AsociarRegistroDialog con selectores en cascada
- Incluye campo adicional para nuevo nombre del formulario
- Copia completa incluyendo todos los valores de campos

### 4. Pantalla de Certificaciones Actualizada

**Nuevos Botones por Requisito:**
- **Agregar**: Crea un nuevo registro desde cero
- **Asociar**: Vincula un registro existente
- **Copiar**: Duplica un registro existente

**Visualización Mejorada:**

**Formularios Propios:**
- Nombre del formulario
- Fecha de última modificación
- Título del registro
- Estado (Activo/Borrador/Inactivo) con colores
- Botones: "Completar", "Cambiar Estado", "Eliminar"

**Formularios Asociados:**
- Fondo diferenciado (color púrpura claro)
- Muestra:
  - Certificación de origen
  - Requisito de origen
  - Formulario
  - Título del registro
- Botones: "Ver", "Quitar Asociación"

## Flujo de Uso

### Para Agregar un Registro Nuevo
1. Expandir requisito
2. Click en botón "Agregar"
3. Seleccionar formulario de la lista
4. Ingresar título del registro
5. Click en "Agregar Registro"

### Para Asociar un Formulario Existente
1. Expandir requisito
2. Click en botón "Asociar"
3. Seleccionar:
   - Certificación origen
   - Requisito origen
   - Formulario
   - Título del formulario (con estado y fecha)
4. Click en "Asociar Formulario"

### Para Copiar un Formulario
1. Expandir requisito
2. Click en botón "Copiar"
3. Seleccionar origen (igual que Asociar)
4. Modificar el nombre si es necesario
5. Click en "Copiar Formulario"

## Ventajas

1. **Reutilización de Información**: Los formularios pueden compartirse entre certificaciones
2. **Flexibilidad**: Opción de asociar (referencia) o copiar (independiente)
3. **Trazabilidad**: Los registros asociados muestran claramente su origen
4. **Eficiencia**: Evita duplicar trabajo al poder reutilizar formularios existentes

## Archivos Modificados/Creados

### Base de Datos
- `database/20_MIGRATION_FORMULARIOS_ASOCIADOS.sql` ✅

### APIs
- `app/api/admin/requisitos/[id]/registros/route.ts` ✅
- `app/api/admin/requisitos/[id]/asociar-registro/route.ts` ✅
- `app/api/admin/requisitos/[id]/copiar-registro/route.ts` ✅
- `app/api/admin/requisitos/[id]/registros-asociados/route.ts` ✅
- `app/api/admin/asociaciones/[id]/route.ts` ✅

### Componentes
- `components/admin/agregar-registro-dialog.tsx` ✅
- `components/admin/asociar-registro-dialog.tsx` ✅
- `components/admin/copiar-registro-dialog.tsx` ✅

### Páginas
- `app/dashboard/[tenant]/certificaciones/[id]/page.tsx` ✅ (modificado)

## Próximos Pasos Sugeridos

1. **Cambiar Estado**: Implementar modal para cambiar estado de registros
2. **Validaciones**: Agregar validaciones adicionales en backend
3. **Historial**: Considerar agregar log de asociaciones/copias
4. **Permisos**: Validar permisos de usuario para asociar/copiar entre clientes
5. **Testing**: Probar con casos de uso reales del cliente

## Estado: ✅ Completado

La implementación está lista para pruebas. La migración de base de datos se ha ejecutado exitosamente.
