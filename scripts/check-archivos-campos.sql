-- Script para verificar campos tipo Archivo con archivos asociados

-- Ver campos tipo 11 (Archivo) en los templates
SELECT 
    'CAMPOS TIPO ARCHIVO EN TEMPLATES' AS Info,
    tc.cdTemplateCampo,
    tc.dsEtiqueta,
    td.dsNombre AS NombreFormulario,
    tc.cdTipoCampo
FROM TD_TEMPLATES_CAMPOS tc
INNER JOIN TD_TEMPLATES_DOCUMENTOS td ON tc.cdTemplateDocumento = td.cdTemplateDocumento
WHERE tc.cdTipoCampo = 11
ORDER BY td.dsNombre, tc.nuOrden;

-- Ver valores guardados en campos tipo Archivo
SELECT 
    'VALORES DE CAMPOS TIPO ARCHIVO' AS Info,
    rcv.cdRegistroCampoValor,
    rcv.cdRegistroDocumento,
    tc.dsEtiqueta AS NombreCampo,
    rcv.dsAditusDocId,
    rcv.dsNombreArchivo,
    rcv.feCreacion,
    rcv.feModificacion
FROM TD_REGISTROS_CAMPOS_VALORES rcv
INNER JOIN TD_TEMPLATES_CAMPOS tc ON rcv.cdTemplateCampo = tc.cdTemplateCampo
WHERE tc.cdTipoCampo = 11
ORDER BY rcv.feModificacion DESC;

-- Ver detalle del registro documento 20 (el que mencionó el usuario)
SELECT 
    'DOCUMENTO 20 - CAMPOS TIPO ARCHIVO' AS Info,
    tc.cdTemplateCampo,
    tc.dsEtiqueta,
    rcv.cdRegistroCampoValor,
    rcv.dsAditusDocId,
    rcv.dsNombreArchivo,
    rcv.feModificacion
FROM TD_REGISTROS_DOCUMENTOS rd
INNER JOIN TD_TEMPLATES_CAMPOS tc ON rd.cdTemplateDocumento = tc.cdTemplateDocumento
LEFT JOIN TD_REGISTROS_CAMPOS_VALORES rcv ON tc.cdTemplateCampo = rcv.cdTemplateCampo 
    AND rcv.cdRegistroDocumento = rd.cdRegistroDocumento
WHERE rd.cdRegistroDocumento = 20
  AND tc.cdTipoCampo = 11
ORDER BY tc.nuOrden;
