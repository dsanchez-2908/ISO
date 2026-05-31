import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/certificaciones/[id]/requisitos
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

    // Obtener requisitos de la norma de esta certificación
    // Actualizado para usar TR_REQUISITOS_TEMPLATES en lugar de cdRequisito directo
    const requisitos = await query(`
      SELECT 
        r.cdRequisito,
        r.cdCodigoRequisito,
        r.dsRequisito,
        r.dsDescripcion,
        r.nuOrden,
        (SELECT COUNT(*) 
         FROM TR_REQUISITOS_TEMPLATES rt
         INNER JOIN TD_TEMPLATES_DOCUMENTOS td ON rt.cdTemplateDocumento = td.cdTemplateDocumento
         WHERE rt.cdRequisito = r.cdRequisito 
           AND td.snActivo = 1) as nuTotalTemplates,
        (SELECT COUNT(DISTINCT rt.cdTemplateDocumento)
         FROM TD_REGISTROS_DOCUMENTOS rd
         INNER JOIN TR_REQUISITOS_TEMPLATES rt ON rd.cdTemplateDocumento = rt.cdTemplateDocumento
         WHERE rd.cdCertificacion = @cdCertificacion
           AND rt.cdRequisito = r.cdRequisito) as nuTemplatesConRegistros,
        (SELECT COUNT(*)
         FROM TD_REGISTROS_DOCUMENTOS rd
         INNER JOIN TR_REQUISITOS_TEMPLATES rt ON rd.cdTemplateDocumento = rt.cdTemplateDocumento
         WHERE rd.cdCertificacion = @cdCertificacion
           AND rt.cdRequisito = r.cdRequisito) as nuTotalRegistros,
        (SELECT COUNT(*)
         FROM TD_REGISTROS_DOCUMENTOS rd
         INNER JOIN TR_REQUISITOS_TEMPLATES rt ON rd.cdTemplateDocumento = rt.cdTemplateDocumento
         WHERE rd.cdCertificacion = @cdCertificacion
           AND rt.cdRequisito = r.cdRequisito
           AND rd.cdEstadoDocumento = 3) as nuRegistrosCompletos
      FROM TD_REQUISITOS r
      INNER JOIN TD_CERTIFICACIONES c ON r.cdNorma = c.cdNorma
      WHERE c.cdCertificacion = @cdCertificacion
        AND r.cdEstado = 1
      ORDER BY r.nuOrden
    `, { cdCertificacion: parseInt(id) });

    return NextResponse.json({ success: true, data: requisitos });
  } catch (error: any) {
    console.error('Error al obtener requisitos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
