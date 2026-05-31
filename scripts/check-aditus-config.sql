-- Script para verificar la configuración de Aditus

-- 1. Verificar configuración global
SELECT 
    'CONFIGURACION GLOBAL' AS Tipo,
    dsURLTokenAditus,
    dsURLAgregarDocumentoAditus,
    dsURLVisorAditus,
    dsUsuarioTokenAditus,
    CASE WHEN dsClaveTokenAditus IS NOT NULL THEN '***CONFIGURADA***' ELSE 'NO CONFIGURADA' END AS Clave
FROM TD_CONFIGURACION_GLOBAL;

-- 2. Verificar configuración de empresas consultoras
SELECT 
    'EMPRESAS CONSULTORAS' AS Tipo,
    ec.cdEmpresaConsultora,
    ec.dsNombreEmpresaConsultora
FROM TD_EMPRESAS_CONSULTORAS ec
WHERE ec.cdEstado = 1;

-- 3. Verificar configuración del gestor documental por empresa
SELECT 
    'GESTOR DOCUMENTAL' AS Tipo,
    gd.cdEmpresaGestorDocumental,
    gd.cdEmpresaConsultora,
    ec.dsNombreEmpresaConsultora,
    gd.dsCodigoLibreria,
    gd.dsCodigoClase,
    gd.feCreacion,
    gd.feModificacion
FROM TD_EMPRESAS_GESTOR_DOCUMENTAL gd
INNER JOIN TD_EMPRESAS_CONSULTORAS ec ON gd.cdEmpresaConsultora = ec.cdEmpresaConsultora;

-- 4. Mostrar empresas SIN configuración de gestor documental
SELECT 
    'SIN GESTOR DOCUMENTAL' AS Tipo,
    ec.cdEmpresaConsultora,
    ec.dsNombreEmpresaConsultora
FROM TD_EMPRESAS_CONSULTORAS ec
WHERE ec.cdEstado = 1
  AND NOT EXISTS (
    SELECT 1 
    FROM TD_EMPRESAS_GESTOR_DOCUMENTAL gd 
    WHERE gd.cdEmpresaConsultora = ec.cdEmpresaConsultora
  );
