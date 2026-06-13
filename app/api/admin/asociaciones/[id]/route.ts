import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// DELETE /api/admin/asociaciones/[id]
// Elimina una asociación de registro
export async function DELETE(
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
    const cdAsociacion = parseInt(id);

    // Eliminar la asociación
    await query(`
      DELETE FROM TR_REQUISITOS_REGISTROS_ASOCIADOS
      WHERE cdAsociacion = @cdAsociacion
    `, {
      cdAsociacion
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Asociación eliminada correctamente' 
    });
  } catch (error: any) {
    console.error('Error al eliminar asociación:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
