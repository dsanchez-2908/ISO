import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/requisitos/[id]/registros-asociados?cdCertificacion=X
// Obtiene los registros asociados a un requisito
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
    const { searchParams } = new URL(request.url);
    const cdCertificacion = searchParams.get('cdCertificacion');

    if (!cdCertificacion) {
      return NextResponse.json({ 
        success: false, 
        error: 'cdCertificacion es requerido' 
      }, { status: 400 });
    }

    // Obtener registros asociados con información completa
    const asociados = await query(`
      SELECT 
        ra.cdAsociacion,
        rd.cdRegistroDocumento,
        rd.dsNombreDocumento,
        rd.cdEstadoDocumento,
        e.dsEstado as dsEstadoDocumento,
        rd.feModificacion,
        ra.cdCertificacionOrigen,
        certOrigen.dsCodigo as dsCodigoCertificacionOrigen,
        normaOrigen.dsNombre as dsNombreCertificacionOrigen,
        ra.cdRequisitoOrigen,
        reqOrigen.cdCodigoRequisito + ' - ' + reqOrigen.dsRequisito as dsRequisitoOrigen,
        rd.cdTemplateDocumento,
        td.dsNombre as dsNombreTemplate
      FROM TR_REQUISITOS_REGISTROS_ASOCIADOS ra
      INNER JOIN TD_REGISTROS_DOCUMENTOS rd ON ra.cdRegistroDocumentoOrigen = rd.cdRegistroDocumento
      INNER JOIN TV_ESTADOS e ON rd.cdEstadoDocumento = e.cdEstado
      INNER JOIN TD_CERTIFICACIONES certOrigen ON ra.cdCertificacionOrigen = certOrigen.cdCertificacion
      INNER JOIN TD_NORMAS normaOrigen ON certOrigen.cdNorma = normaOrigen.cdNorma
      INNER JOIN TD_REQUISITOS reqOrigen ON ra.cdRequisitoOrigen = reqOrigen.cdRequisito
      INNER JOIN TD_TEMPLATES_DOCUMENTOS td ON rd.cdTemplateDocumento = td.cdTemplateDocumento
      WHERE ra.cdRequisito = @cdRequisito
        AND ra.cdCertificacion = @cdCertificacion
      ORDER BY td.dsNombre, rd.dsNombreDocumento
    `, {
      cdRequisito,
      cdCertificacion: parseInt(cdCertificacion)
    });

    return NextResponse.json({ 
      success: true, 
      data: asociados
    });
  } catch (error: any) {
    console.error('Error al obtener registros asociados:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
