-- Verificar cuándo se creó el documento 20 y el campo 138
SELECT 
    'DOCUMENTO 20' AS Tipo,
    cdRegistroDocumento,
    cdTemplateDocumento,
    feCreacion
FROM TD_REGISTROS_DOCUMENTOS
WHERE cdRegistroDocumento = 20;

SELECT 
    'CAMPO 138' AS Tipo,
    cdTemplateCampo,
    cdTemplateDocumento,
    dsEtiqueta,
    cdTipoCampo,
    feCreacion
FROM TD_TEMPLATES_CAMPOS
WHERE cdTemplateCampo = 138;

-- Ver si existen registros de campos valores para el documento 20
SELECT 
    'VALORES DOCUMENTO 20' AS Tipo,
    COUNT(*) AS TotalCampos
FROM TD_REGISTROS_CAMPOS_VALORES
WHERE cdRegistroDocumento = 20;

-- Ver todos los campos del template del documento 20
SELECT 
    'CAMPOS DEL TEMPLATE' AS Tipo,
    tc.cdTemplateCampo,
    tc.dsEtiqueta,
    tc.cdTipoCampo,
    tip.dsTipoCampo,
    CASE WHEN rcv.cdRegistroCampoValor IS NULL THEN 'NO' ELSE 'SI' END AS TieneValor
FROM TD_REGISTROS_DOCUMENTOS rd
INNER JOIN TD_TEMPLATES_CAMPOS tc ON rd.cdTemplateDocumento = tc.cdTemplateDocumento
LEFT JOIN TV_TIPOS_CAMPO tip ON tc.cdTipoCampo = tip.cdTipoCampo
LEFT JOIN TD_REGISTROS_CAMPOS_VALORES rcv ON tc.cdTemplateCampo = rcv.cdTemplateCampo 
    AND rcv.cdRegistroDocumento = rd.cdRegistroDocumento
WHERE rd.cdRegistroDocumento = 20
ORDER BY tc.nuOrden;
