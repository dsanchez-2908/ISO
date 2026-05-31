import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/admin/formularios/[id]/reactivar
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

    await query(`
      UPDATE TD_TEMPLATES_DOCUMENTOS
      SET snActivo = 1,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdTemplateDocumento = @cdTemplateDocumento
    `, {
      cdTemplateDocumento,
      cdUsuarioModificacion: decoded.cdUsuario || null,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Formulario reactivado correctamente' 
    });
  } catch (error: any) {
    console.error('Error al reactivar formulario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
