import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/admin/normas/[id]/reactivar
 * Reactivar una norma (cambiar cdEstado a 1)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdNorma = parseInt(id);

    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Reactivar norma (cambiar a estado Activo)
    await query(
      `
      UPDATE TD_NORMAS SET
        cdEstado = 1,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdNorma = @cdNorma
      `,
      {
        cdNorma,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error al reactivar norma:', error);
    return NextResponse.json(
      { success: false, error: 'Error al reactivar norma' },
      { status: 500 }
    );
  }
}
