import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { EmpresaConsultora, Parametro } from '@/lib/types';

/**
 * GET /api/admin/empresas/[id]
 * Obtener detalle de una empresa consultora
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdEmpresaConsultora = parseInt(id);

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

    // Obtener empresa
    const empresas = await query<EmpresaConsultora>(
      `
      SELECT * FROM TD_EMPRESAS_CONSULTORAS
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora
      `,
      { cdEmpresaConsultora }
    );

    if (empresas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Obtener parámetros de Aditus
    const parametros = await query<Parametro>(
      `
      SELECT * FROM TD_PARAMETROS
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora
      ORDER BY dsCodigoParametro
      `,
      { cdEmpresaConsultora }
    );

    return NextResponse.json({
      success: true,
      data: {
        empresa: empresas[0],
        parametros,
      },
    });
  } catch (error) {
    console.error('Error al obtener empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener empresa' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/empresas/[id]
 * Actualizar empresa consultora
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdEmpresaConsultora = parseInt(id);

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
      parametros,
    } = body;

    // Actualizar empresa
    await query(
      `
      UPDATE TD_EMPRESAS_CONSULTORAS SET
        dsNombreEmpresaConsultora = @dsNombreEmpresaConsultora,
        dsCUIT = @dsCUIT,
        dsDomicilio = @dsDomicilio,
        dsCodigoPostal = @dsCodigoPostal,
        dsLocalidad = @dsLocalidad,
        dsProvincia = @dsProvincia,
        dsPais = @dsPais,
        dsTelefono = @dsTelefono,
        dsMail = @dsMail,
        dsLogo = @dsLogo,
        dsContactoNombre = @dsContactoNombre,
        dsContactoTelefono = @dsContactoTelefono,
        dsContactoEmail = @dsContactoEmail,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora
      `,
      {
        cdEmpresaConsultora,
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
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    // Actualizar parámetros si se enviaron
    if (parametros && Array.isArray(parametros)) {
      for (const param of parametros) {
        await query(
          `
          UPDATE TD_PARAMETROS 
          SET dsValorParametro = @dsValorParametro
          WHERE cdEmpresaConsultora = @cdEmpresaConsultora 
            AND dsCodigoParametro = @dsCodigoParametro
          `,
          {
            cdEmpresaConsultora,
            dsCodigoParametro: param.dsCodigoParametro,
            dsValorParametro: param.dsValorParametro || '',
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Empresa actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar empresa' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/empresas/[id]
 * Desactivar empresa consultora (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdEmpresaConsultora = parseInt(id);

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

    // Cambiar estado a Inactivo (2)
    await query(
      `
      UPDATE TD_EMPRESAS_CONSULTORAS 
      SET cdEstado = 2,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora
      `,
      {
        cdEmpresaConsultora,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Empresa desactivada exitosamente',
    });
  } catch (error) {
    console.error('Error al desactivar empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar empresa' },
      { status: 500 }
    );
  }
}
