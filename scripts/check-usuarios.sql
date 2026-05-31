-- Verificar qué usuarios existen y a qué empresa consultora pertenecen
SELECT 
    u.cdUsuario,
    u.dsUsuario,
    u.dsNombreCompleto,
    u.cdEmpresaConsultora,
    ec.dsNombreEmpresaConsultora,
    tu.dsTipoUsuario,
    CASE WHEN gd.cdEmpresaGestorDocumental IS NOT NULL THEN 'SI' ELSE 'NO' END AS TieneGestorDocumental
FROM TD_USUARIOS u
LEFT JOIN TD_EMPRESAS_CONSULTORAS ec ON u.cdEmpresaConsultora = ec.cdEmpresaConsultora
LEFT JOIN TV_TIPOS_USUARIO tu ON u.cdTipoUsuario = tu.cdTipoUsuario
LEFT JOIN TD_EMPRESAS_GESTOR_DOCUMENTAL gd ON ec.cdEmpresaConsultora = gd.cdEmpresaConsultora
WHERE u.cdEstado = 1
ORDER BY u.cdUsuario;
