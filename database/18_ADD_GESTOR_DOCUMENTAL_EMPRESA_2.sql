-- Agregar configuración de gestor documental para empresa 2 (SUPER ISO)
INSERT INTO TD_EMPRESAS_GESTOR_DOCUMENTAL (
    cdEmpresaConsultora,
    dsCodigoLibreria,
    dsCodigoClase,
    feCreacion,
    cdUsuarioCreacion
)
VALUES (
    2, -- Empresa SUPER ISO
    '32a76e80-1d2d-47fe-9b9d-d423cf644d73', -- Mismo código de librería que empresa 1
    '7a6f0e1e-51e1-4ea1-b34c-804a72cbc994', -- Mismo código de clase que empresa 1
    GETDATE(),
    3 -- Usuario admin_danisan
);

-- Verificar que se insertó correctamente
SELECT * FROM TD_EMPRESAS_GESTOR_DOCUMENTAL WHERE cdEmpresaConsultora = 2;
