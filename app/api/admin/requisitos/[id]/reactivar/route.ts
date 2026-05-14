import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/admin/requisitos/[id]/reactivar
 * Reactivar un requisito (cambiar estado a Activo)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    const cdRequisito = parseInt(id);

    // Cambiar estado a activo (1)
    await query(`
      UPDATE TD_REQUISITOS
      SET cdEstado = 1,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdRequisito = @cdRequisito
    `, {
      cdRequisito,
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdRequisito } });
  } catch (error: any) {
    console.error('Error al reactivar requisito:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
