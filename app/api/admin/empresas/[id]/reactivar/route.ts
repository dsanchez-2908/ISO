import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/admin/empresas/[id]/reactivar
 * Reactivar una empresa consultora (cambiar estado de 2 a 1)
 */
export async function POST(
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

    // Reactivar empresa
    await query(
      `
      UPDATE TD_EMPRESAS_CONSULTORAS 
      SET cdEstado = 1,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora
        AND cdEstado = 2
      `,
      {
        cdEmpresaConsultora,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Empresa reactivada correctamente',
    });
  } catch (error) {
    console.error('Error al reactivar empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Error al reactivar empresa' },
      { status: 500 }
    );
  }
}
