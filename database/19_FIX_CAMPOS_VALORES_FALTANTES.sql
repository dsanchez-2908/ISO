-- Script para crear registros de campos valores faltantes
-- Para documentos que se crearon antes de que se agregaran nuevos campos al template

-- Insertar registros faltantes en TD_REGISTROS_CAMPOS_VALORES
INSERT INTO TD_REGISTROS_CAMPOS_VALORES (
    cdRegistroDocumento,
    cdTemplateCampo,
    dsValor,
    cdListaItem,
    cdListaCliente,
    cdEntidadCliente,
    dsEntidadTipo,
    dsAditusDocId,
    dsNombreArchivo,
    cdRegistroVinculado,
    feCreacion,
    cdUsuarioCreacion
)
SELECT 
    rd.cdRegistroDocumento,
    tc.cdTemplateCampo,
    NULL, -- dsValor
    NULL, -- cdListaItem
    NULL, -- cdListaCliente
    NULL, -- cdEntidadCliente
    NULL, -- dsEntidadTipo
    NULL, -- dsAditusDocId
    NULL, -- dsNombreArchivo
    NULL, -- cdRegistroVinculado
    GETDATE(),
    1 -- Usuario sistema
FROM TD_REGISTROS_DOCUMENTOS rd
INNER JOIN TD_TEMPLATES_CAMPOS tc ON rd.cdTemplateDocumento = tc.cdTemplateDocumento
WHERE tc.snEsTitulo = 0 -- Solo campos, no títulos
  AND NOT EXISTS (
    -- Solo insertar si no existe ya un registro
    SELECT 1 
    FROM TD_REGISTROS_CAMPOS_VALORES rcv 
    WHERE rcv.cdRegistroDocumento = rd.cdRegistroDocumento 
      AND rcv.cdTemplateCampo = tc.cdTemplateCampo
  );

-- Mostrar registros creados
SELECT 
    'REGISTROS CREADOS' AS Info,
    @@ROWCOUNT AS NumeroDeRegistros;

-- Verificar documento 20 después del fix
SELECT 
    'DOCUMENTO 20 DESPUÉS DEL FIX' AS Info,
    tc.cdTemplateCampo,
    tc.dsEtiqueta,
    tc.cdTipoCampo,
    tip.dsTipoCampo,
    CASE WHEN rcv.cdRegistroCampoValor IS NULL THEN 'NO' ELSE 'SI' END AS TieneValor,
    rcv.cdRegistroCampoValor
FROM TD_REGISTROS_DOCUMENTOS rd
INNER JOIN TD_TEMPLATES_CAMPOS tc ON rd.cdTemplateDocumento = tc.cdTemplateDocumento
LEFT JOIN TV_TIPOS_CAMPO tip ON tc.cdTipoCampo = tip.cdTipoCampo
LEFT JOIN TD_REGISTROS_CAMPOS_VALORES rcv ON tc.cdTemplateCampo = rcv.cdTemplateCampo 
    AND rcv.cdRegistroDocumento = rd.cdRegistroDocumento
WHERE rd.cdRegistroDocumento = 20
ORDER BY tc.nuOrden;
