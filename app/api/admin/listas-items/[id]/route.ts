import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/listas-items/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const cdListaItem = parseInt(params.id);

    const items = await query(`
      SELECT 
        cdListaItem,
        cdLista,
        dsValor,
        dsDescripcion,
        nuOrden,
        snActivo,
        feCreacion,
        cdUsuarioCreacion
      FROM TD_LISTAS_ITEMS
      WHERE cdListaItem = @cdListaItem
    `, { cdListaItem });

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Item no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: items[0] });
  } catch (error: any) {
    console.error('Error al obtener item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/listas-items/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const cdListaItem = parseInt(params.id);
    const body = await request.json();
    const { dsValor, dsDescripcion, nuOrden, snActivo } = body;

    await query(`
      UPDATE TD_LISTAS_ITEMS
      SET dsValor = @dsValor,
          dsDescripcion = @dsDescripcion,
          nuOrden = @nuOrden,
          snActivo = @snActivo
      WHERE cdListaItem = @cdListaItem
    `, {
      cdListaItem,
      dsValor,
      dsDescripcion: dsDescripcion || null,
      nuOrden: nuOrden ? parseInt(nuOrden) : 0,
      snActivo: snActivo ? 1 : 0
    });

    return NextResponse.json({ success: true, data: { cdListaItem } });
  } catch (error: any) {
    console.error('Error al actualizar item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/listas-items/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const cdListaItem = parseInt(params.id);

    // Soft delete - cambiar snActivo a false
    await query(`
      UPDATE TD_LISTAS_ITEMS
      SET snActivo = 0
      WHERE cdListaItem = @cdListaItem
    `, { cdListaItem });

    return NextResponse.json({ success: true, data: { cdListaItem } });
  } catch (error: any) {
    console.error('Error al eliminar item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
