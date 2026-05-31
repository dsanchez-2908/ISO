import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/requisitos-certificacion?cdCertificacion=X
// Obtiene los requisitos asociados a una certificación
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
    const cdCertificacion = searchParams.get('cdCertificacion');

    if (!cdCertificacion) {
      return NextResponse.json({ 
        success: false, 
        error: 'cdCertificacion es requerido' 
      }, { status: 400 });
    }

    // Obtener certificación para verificar la norma
    const certificaciones = await query(`
      SELECT cdNorma FROM TD_CERTIFICACIONES WHERE cdCertificacion = @cdCertificacion
    `, { cdCertificacion: parseInt(cdCertificacion) });

    if (certificaciones.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Certificación no encontrada' 
      }, { status: 404 });
    }

    const cdNorma = certificaciones[0].cdNorma;

    // Obtener requisitos de la norma
    const requisitos = await query(`
      SELECT 
        r.cdRequisito,
        r.cdCodigoRequisito,
        r.dsRequisito,
        r.dsDescripcion,
        r.nuOrden,
        r.cdEstado
      FROM TD_REQUISITOS r
      WHERE r.cdNorma = @cdNorma
        AND r.cdEstado = 1
      ORDER BY r.nuOrden, r.cdCodigoRequisito
    `, { cdNorma });

    return NextResponse.json({ 
      success: true, 
      data: requisitos 
    });
  } catch (error: any) {
    console.error('Error al obtener requisitos de certificación:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
