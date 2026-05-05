import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/listas/[id]
export async function GET(
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
    const cdLista = parseInt(id);

    const listas = await query(`
      SELECT 
        l.cdLista,
        l.cdEmpresaConsultora,
        l.cdNorma,
        l.dsNombreLista,
        l.dsDescripcion,
        l.dsTipo,
        l.cdEstado,
        e.dsEstado,
        l.feCreacion,
        l.cdUsuarioCreacion
      FROM TD_LISTAS l
      LEFT JOIN TV_ESTADOS e ON l.cdEstado = e.cdEstado
      WHERE l.cdLista = @cdLista
    `, { cdLista });

    if (!listas || listas.length === 0) {
      return NextResponse.json({ success: false, error: 'Lista no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: listas[0] });
  } catch (error: any) {
    console.error('Error al obtener lista:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/listas/[id]
export async function PUT(
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
    const cdLista = parseInt(id);
    const body = await request.json();
    const { dsNombreLista, dsDescripcion, cdEstado } = body;

    await query(`
      UPDATE TD_LISTAS
      SET dsNombreLista = @dsNombreLista,
          dsDescripcion = @dsDescripcion,
          cdEstado = @cdEstado
      WHERE cdLista = @cdLista
    `, {
      cdLista,
      dsNombreLista,
      dsDescripcion: dsDescripcion || null,
      cdEstado: parseInt(cdEstado)
    });

    return NextResponse.json({ success: true, data: { cdLista } });
  } catch (error: any) {
    console.error('Error al actualizar lista:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/listas/[id]
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
    const cdLista = parseInt(id);

    // Soft delete - cambiar estado a inactivo (2)
    await query(`
      UPDATE TD_LISTAS
      SET cdEstado = 2
      WHERE cdLista = @cdLista
    `, { cdLista });

    return NextResponse.json({ success: true, data: { cdLista } });
  } catch (error: any) {
    console.error('Error al eliminar lista:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
