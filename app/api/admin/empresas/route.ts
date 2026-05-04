import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { EmpresaConsultora } from '@/lib/types';

/**
 * GET /api/admin/empresas
 * Listar todas las empresas consultoras (solo super admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.cdTipoUsuario !== 1) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener todas las empresas con información adicional
    const empresas = await query<EmpresaConsultora & { 
      dsEstado: string;
      nuUsuarios: number;
      nuClientes: number;
    }>(
      `
      SELECT 
        ec.*,
        e.dsEstado,
        (SELECT COUNT(*) FROM TD_USUARIOS WHERE cdEmpresaConsultora = ec.cdEmpresaConsultora AND cdEstado = 1) as nuUsuarios,
        (SELECT COUNT(*) FROM TD_CLIENTES WHERE cdEmpresaConsultora = ec.cdEmpresaConsultora AND cdEstado = 1) as nuClientes
      FROM TD_EMPRESAS_CONSULTORAS ec
      INNER JOIN TV_ESTADOS e ON ec.cdEstado = e.cdEstado
      WHERE ec.cdEstado IN (1, 2)
      ORDER BY ec.dsNombreEmpresaConsultora
      `
    );

    return NextResponse.json({
      success: true,
      data: empresas,
    });
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener empresas' },
      { status: 500 }
      );
  }
}

/**
 * POST /api/admin/empresas
 * Crear nueva empresa consultora (solo super admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.cdTipoUsuario !== 1) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      dsNombreEmpresaConsultora,
      dsCUIT,
      dsDomicilio,
      dsCodigoPostal,
      dsLocalidad,
      dsProvincia,
      dsPais,
      dsTelefono,
      dsMail,
      dsLogo,
      dsContactoNombre,
      dsContactoTelefono,
      dsContactoEmail,
    } = body;

    // Validar campos requeridos
    if (!dsNombreEmpresaConsultora || !dsCUIT || !dsMail) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Insertar nueva empresa
    const result = await query(
      `
      INSERT INTO TD_EMPRESAS_CONSULTORAS (
        dsNombreEmpresaConsultora, dsCUIT, dsDomicilio, dsCodigoPostal, dsLocalidad,
        dsProvincia, dsPais, dsTelefono, dsMail, dsLogo,
        dsContactoNombre, dsContactoTelefono, dsContactoEmail,
        cdEstado, feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @dsNombreEmpresaConsultora, @dsCUIT, @dsDomicilio, @dsCodigoPostal, @dsLocalidad,
        @dsProvincia, @dsPais, @dsTelefono, @dsMail, @dsLogo,
        @dsContactoNombre, @dsContactoTelefono, @dsContactoEmail,
        1, GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() as cdEmpresaConsultora;
      `,
      {
        dsNombreEmpresaConsultora,
        dsCUIT,
        dsDomicilio: dsDomicilio || null,
        dsCodigoPostal: dsCodigoPostal || null,
        dsLocalidad: dsLocalidad || null,
        dsProvincia: dsProvincia || null,
        dsPais: dsPais || null,
        dsTelefono: dsTelefono || null,
        dsMail,
        dsLogo: dsLogo || null,
        dsContactoNombre: dsContactoNombre || null,
        dsContactoTelefono: dsContactoTelefono || null,
        dsContactoEmail: dsContactoEmail || null,
        cdUsuarioCreacion: decoded.cdUsuario,
      }
    );

    const cdEmpresaConsultora = result[0].cdEmpresaConsultora;

    // Insertar parámetros de Aditus (valores por defecto)
    const parametros = [
      { dsCodigoParametro: 'URL_AGREGAR_DOCUMENTO', dsValorParametro: '' },
      { dsCodigoParametro: 'URL_TOKEN', dsValorParametro: '' },
      { dsCodigoParametro: 'USUARIO_TOKEN', dsValorParametro: '' },
      { dsCodigoParametro: 'CLAVE_TOKEN', dsValorParametro: '' },
      { dsCodigoParametro: 'CODIGO_LIBRERIA', dsValorParametro: '' },
      { dsCodigoParametro: 'CODIGO_CLASE', dsValorParametro: '' },
      { dsCodigoParametro: 'URL_VISOR', dsValorParametro: '' },
      { dsCodigoParametro: 'CLIENT_ID', dsValorParametro: '' },
    ];

    for (const param of parametros) {
      await query(
        `
        INSERT INTO TD_PARAMETROS (cdEmpresaConsultora, dsCodigoParametro, dsValorParametro, cdEstado)
        VALUES (@cdEmpresaConsultora, @dsCodigoParametro, @dsValorParametro, 1)
        `,
        {
          cdEmpresaConsultora,
          dsCodigoParametro: param.dsCodigoParametro,
          dsValorParametro: param.dsValorParametro,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: { cdEmpresaConsultora },
      message: 'Empresa creada exitosamente',
    });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear empresa' },
      { status: 500 }
    );
  }
}
