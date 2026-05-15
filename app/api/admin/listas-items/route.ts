import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/listas-items?cdLista=X
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cdLista = searchParams.get('cdLista');
    const soloActivos = searchParams.get('soloActivos'); // Filtrar solo items activos (snActivo = 1)

    if (!cdLista) {
      return NextResponse.json({ success: false, error: 'cdLista es requerido' }, { status: 400 });
    }

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
      WHERE cdLista = @cdLista
      ${soloActivos === '1' ? 'AND snActivo = 1' : ''}
      ORDER BY nuOrden, dsValor
    `, { cdLista: parseInt(cdLista) });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error al obtener items:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/listas-items
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { cdLista, dsValor, dsDescripcion, nuOrden } = body;

    // Validar campos requeridos
    if (!cdLista || !dsValor) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdLista y dsValor' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO TD_LISTAS_ITEMS (
        cdLista, dsValor, dsDescripcion, nuOrden, snActivo,
        feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdLista, @dsValor, @dsDescripcion, @nuOrden, 1,
        GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() AS cdListaItem;
    `, {
      cdLista: parseInt(cdLista),
      dsValor,
      dsDescripcion: dsDescripcion || null,
      nuOrden: nuOrden ? parseInt(nuOrden) : 0,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    return NextResponse.json({ 
      success: true, 
      data: { cdListaItem: result[0]?.cdListaItem } 
    });
  } catch (error: any) {
    console.error('Error al crear item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
