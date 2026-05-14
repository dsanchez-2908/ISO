import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/admin/templates/[id]/reactivar
 * Reactivar un template (cambiar snActivo a true)
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
    const cdTemplateDocumento = parseInt(id);

    // Cambiar snActivo a true (1)
    await query(`
      UPDATE TD_TEMPLATES_DOCUMENTOS
      SET snActivo = 1,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdTemplateDocumento = @cdTemplateDocumento
    `, {
      cdTemplateDocumento,
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdTemplateDocumento } });
  } catch (error: any) {
    console.error('Error al reactivar template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
