import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/requisitos?cdNorma=X
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
    const cdNorma = searchParams.get('cdNorma');

    if (!cdNorma) {
      return NextResponse.json({ success: false, error: 'cdNorma es requerido' }, { status: 400 });
    }

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
      WHERE r.cdNorma = @cdNorma
      ORDER BY r.nuOrden, r.dsRequisito
    `, { cdNorma: parseInt(cdNorma) });

    return NextResponse.json({ success: true, data: requisitos });
  } catch (error: any) {
    console.error('Error al obtener requisitos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/requisitos
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
    const { cdNorma, cdCodigoRequisito, dsRequisito, dsDescripcion, nuOrden } = body;

    // Validar campos requeridos
    if (!cdNorma || !dsRequisito) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdNorma y dsRequisito' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO TD_REQUISITOS (
        cdNorma, cdCodigoRequisito, dsRequisito, dsDescripcion, nuOrden,
        cdEstado, feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdNorma, @cdCodigoRequisito, @dsRequisito, @dsDescripcion, @nuOrden,
        1, GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() AS cdRequisito;
    `, {
      cdNorma: parseInt(cdNorma),
      cdCodigoRequisito: cdCodigoRequisito || null,
      dsRequisito,
      dsDescripcion: dsDescripcion || null,
      nuOrden: nuOrden ? parseInt(nuOrden) : null,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    return NextResponse.json({ 
      success: true, 
      data: { cdRequisito: result[0]?.cdRequisito } 
    });
  } catch (error: any) {
    console.error('Error al crear requisito:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
