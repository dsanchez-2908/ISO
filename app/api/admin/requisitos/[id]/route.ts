import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/requisitos/[id]
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
    const cdRequisito = parseInt(id);

    const requisitos = await query(`
      SELECT 
        r.cdRequisito,
        r.cdNorma,
        r.cdCodigoRequisito,
        r.dsRequisito,
        r.dsDescripcion,
        r.nuOrden,
        r.cdEstado,
        e.dsEstado,
        r.feCreacion,
        r.cdUsuarioCreacion,
        r.feModificacion,
        r.cdUsuarioModificacion
      FROM TD_REQUISITOS r
      LEFT JOIN TV_ESTADOS e ON r.cdEstado = e.cdEstado
      WHERE r.cdRequisito = @cdRequisito
    `, { cdRequisito });

    if (!requisitos || requisitos.length === 0) {
      return NextResponse.json({ success: false, error: 'Requisito no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: requisitos[0] });
  } catch (error: any) {
    console.error('Error al obtener requisito:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/requisitos/[id]
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
    const cdRequisito = parseInt(id);
    const body = await request.json();
    const { cdCodigoRequisito, dsRequisito, dsDescripcion, nuOrden, cdEstado } = body;

    await query(`
      UPDATE TD_REQUISITOS
      SET cdCodigoRequisito = @cdCodigoRequisito,
          dsRequisito = @dsRequisito,
          dsDescripcion = @dsDescripcion,
          nuOrden = @nuOrden,
          cdEstado = @cdEstado,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdRequisito = @cdRequisito
    `, {
      cdRequisito,
      cdCodigoRequisito: cdCodigoRequisito || null,
      dsRequisito,
      dsDescripcion: dsDescripcion || null,
      nuOrden: nuOrden ? parseInt(nuOrden) : null,
      cdEstado: parseInt(cdEstado),
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdRequisito } });
  } catch (error: any) {
    console.error('Error al actualizar requisito:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/requisitos/[id]
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
    const cdRequisito = parseInt(id);

    // Soft delete - cambiar estado a inactivo (2)
    await query(`
      UPDATE TD_REQUISITOS
      SET cdEstado = 2,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdRequisito = @cdRequisito
    `, {
      cdRequisito,
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdRequisito } });
  } catch (error: any) {
    console.error('Error al eliminar requisito:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
