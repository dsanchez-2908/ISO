# Migración: Templates a Formularios Independientes

## 📋 Resumen de Cambios

Este cambio convierte los "Templates" en "Formularios" independientes que pueden ser asociados a múltiples requisitos, en lugar de estar vinculados directamente a un único requisito.

### Cambios Principales:

1. **Renombramiento de conceptos**: "Templates" ahora se llaman "Formularios"
2. **Nueva arquitectura**: Los formularios son entidades independientes asociadas a requisitos mediante una tabla de relación
3. **Reorganización de UI**: Nueva pestaña "Formularios" en configuración de normas
4. **Reutilización**: Un mismo formulario puede asociarse a múltiples requisitos

---

## 🗄️ Cambios en Base de Datos

### Nueva estructura:

- **TD_TEMPLATES_DOCUMENTOS**:
  - ✅ Nuevo campo `cdNorma` (NOT NULL) - Identifica a qué norma pertenece el formulario
  - ✅ Campo `cdRequisito` ahora es NULLABLE (por compatibilidad con datos antiguos)

- **Nueva tabla TR_REQUISITOS_TEMPLATES**:
  - Tabla de relación muchos-a-muchos entre requisitos y formularios
  - Permite asociar múltiples formularios a un requisito
  - Permite que un formulario se use en múltiples requisitos

### Script de Migración:

Ejecutar: `database/16_MIGRATION_FORMULARIOS_INDEPENDIENTES.sql`

**IMPORTANTE**: 
- ✅ Migra automáticamente los datos existentes a la nueva estructura
- ✅ Mantiene `cdRequisito` en TD_TEMPLATES_DOCUMENTOS por compatibilidad
- ✅ Los datos de TR_REQUISITOS_TEMPLATES se poblan con las relaciones actuales

---

## 🚀 Pasos para la Migración

### 1. Ejecutar Script de Base de Datos

```bash
# Conectarse a la base de datos SQL Server
sqlcmd -S [SERVIDOR] -d ISO -U [USUARIO] -P [PASSWORD] -i database/16_MIGRATION_FORMULARIOS_INDEPENDIENTES.sql
```

O ejecutar manualmente desde SQL Server Management Studio el archivo:
`database/16_MIGRATION_FORMULARIOS_INDEPENDIENTES.sql`

### 2. Reiniciar la Aplicación

```bash
# En desarrollo
npm run dev

# En producción
npm run build
npm start
```

### 3. Verificar el Funcionamiento

1. Ir a una norma existente: `http://localhost:3000/dashboard/1/normas/[ID]`
2. Verificar las 3 nuevas pestañas:
   - **Requisitos** (antes "Requisitos y Templates")
   - **Formularios** (nueva)
   - **Listas**
3. En la pestaña "Formularios":
   - Ver los formularios existentes (migrados automáticamente)
   - Crear nuevos formularios
4. En la pestaña "Requisitos":
   - Expandir un requisito
   - Ver formularios asociados
   - Usar "Asociar Formulario" para vincular formularios existentes

---

## 🎯 Nueva Funcionalidad

### Pestaña "Formularios"

Permite gestionar formularios de manera independiente:

- ✅ **Crear** nuevos formularios
- ✅ **Editar** formularios existentes
- ✅ **Desactivar/Reactivar** formularios
- ✅ **Configurar campos** de cada formulario
- ✅ Ver cuántos requisitos usan cada formulario

### Pestaña "Requisitos" (Actualizada)

Ahora permite asociar formularios en lugar de crearlos:

- ✅ Botón **"Asociar Formulario"** (antes "Nuevo Template")
- ✅ Modal con lista de formularios disponibles
- ✅ Selección múltiple de formularios
- ✅ Búsqueda por nombre o código
- ✅ Ver formularios ya asociados
- ✅ Desasociar formularios cuando sea necesario

---

## 📁 Archivos Modificados

### Base de Datos
- `database/16_MIGRATION_FORMULARIOS_INDEPENDIENTES.sql` (NUEVO)

### APIs Backend
- `app/api/admin/formularios/route.ts` (NUEVO)
- `app/api/admin/formularios/[id]/route.ts` (NUEVO)
- `app/api/admin/formularios/[id]/reactivar/route.ts` (NUEVO)
- `app/api/admin/requisitos/[id]/formularios/route.ts` (NUEVO)
- `app/api/admin/requisitos/[id]/templates/route.ts` (MODIFICADO)
- `app/api/admin/certificaciones/[id]/requisitos/route.ts` (MODIFICADO)

### Componentes Frontend
- `components/admin/formularios-list.tsx` (NUEVO)
- `components/admin/requisito-formularios.tsx` (NUEVO)
- `components/admin/requisitos-templates.tsx` (MODIFICADO)
- `app/dashboard/[tenant]/normas/[id]/page.tsx` (MODIFICADO)

---

## 🔍 Casos de Uso

### Caso 1: Crear un Formulario Reutilizable

1. Ir a norma → pestaña "Formularios"
2. Click en "Nuevo Formulario"
3. Completar datos (código, nombre, versión)
4. Configurar campos del formulario
5. El formulario estará disponible para asociar a cualquier requisito

### Caso 2: Asociar un Formulario a Múltiples Requisitos

1. Ir a norma → pestaña "Requisitos"
2. Expandir requisito A → "Asociar Formulario" → Seleccionar "Formulario X"
3. Expandir requisito B → "Asociar Formulario" → Seleccionar "Formulario X"
4. Ahora el mismo formulario está en ambos requisitos

### Caso 3: Modificar un Formulario Usado en Varios Requisitos

1. Ir a norma → pestaña "Formularios"
2. Editar el formulario
3. Los cambios se reflejan automáticamente en todos los requisitos que lo usan

---

## ⚠️ Consideraciones Importantes

### Compatibilidad con Datos Existentes

- ✅ Los templates existentes se migran automáticamente a formularios
- ✅ Las asociaciones requisito-template se mantienen mediante TR_REQUISITOS_TEMPLATES
- ✅ Los registros de certificaciones siguen funcionando sin cambios

### Certificaciones

- ✅ La pantalla de certificaciones funciona igual que antes
- ✅ Los registros de documentos siguen vinculados a templates/formularios por `cdTemplateDocumento`
- ✅ No se requiere ninguna acción adicional para certificaciones existentes

### Campos de Formularios

- ✅ Los campos configurados en TD_TEMPLATES_CAMPOS se mantienen sin cambios
- ✅ Cualquier cambio en los campos afecta a todos los requisitos donde esté asociado el formulario

---

## 🐛 Troubleshooting

### Error: "Formularios no se muestran en requisitos"

**Solución**: Verificar que se ejecutó el script de migración y que TR_REQUISITOS_TEMPLATES tiene datos.

```sql
-- Verificar datos migrados
SELECT COUNT(*) FROM TR_REQUISITOS_TEMPLATES;
```

### Error: "No se pueden asociar formularios"

**Solución**: Verificar que existen formularios activos en la norma.

```sql
-- Ver formularios de una norma
SELECT * FROM TD_TEMPLATES_DOCUMENTOS WHERE cdNorma = [ID_NORMA] AND snActivo = 1;
```

### Los templates antiguos no aparecen

**Solución**: Verificar que el campo cdNorma se pobló correctamente.

```sql
-- Actualizar cdNorma si es NULL
UPDATE TD_TEMPLATES_DOCUMENTOS
SET cdNorma = (SELECT cdNorma FROM TD_REQUISITOS WHERE TD_REQUISITOS.cdRequisito = TD_TEMPLATES_DOCUMENTOS.cdRequisito)
WHERE cdNorma IS NULL AND cdRequisito IS NOT NULL;
```

---

## 📞 Soporte

Si encuentras algún problema durante la migración o tienes dudas sobre el nuevo funcionamiento, documenta:

1. Error específico (mensaje completo)
2. Pasos para reproducir
3. Datos de ejemplo (IDs de norma, requisito, formulario)
4. Resultado esperado vs resultado obtenido

---

## ✅ Checklist de Migración

- [ ] Backup de la base de datos realizado
- [ ] Script 16_MIGRATION_FORMULARIOS_INDEPENDIENTES.sql ejecutado exitosamente
- [ ] Verificado que TR_REQUISITOS_TEMPLATES tiene datos
- [ ] Verificado que TD_TEMPLATES_DOCUMENTOS tiene cdNorma poblado
- [ ] Aplicación reiniciada
- [ ] Verificado que las 3 pestañas aparecen en configuración de norma
- [ ] Probado crear un nuevo formulario
- [ ] Probado asociar un formulario a un requisito
- [ ] Verificado que certificaciones existentes siguen funcionando
- [ ] Probado crear un nuevo registro en una certificación

---

## 📚 Documentación Adicional

Para más información sobre la arquitectura y decisiones de diseño, consultar:

- `database/README.md` - Estructura completa de base de datos
- `PROYECTO_ESTADO.md` - Estado general del proyecto
