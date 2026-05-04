import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/requisitos/[id]/templates?cdCertificacion=X
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
    const { searchParams } = new URL(request.url);
    const cdCertificacion = searchParams.get('cdCertificacion');

    if (!cdCertificacion) {
      return NextResponse.json(
        { success: false, error: 'cdCertificacion es requerido' },
        { status: 400 }
      );
    }

    // Obtener templates del requisito con conteo de registros
    const templates = await query(`
      SELECT 
        td.cdTemplateDocumento,
        td.dsNombre,
        td.snActivo,
        (SELECT COUNT(*)
         FROM TD_REGISTROS_DOCUMENTOS rd
         WHERE rd.cdTemplateDocumento = td.cdTemplateDocumento
           AND rd.cdCertificacion = @cdCertificacion) as nuTotalRegistros,
        (SELECT COUNT(*)
         FROM TD_REGISTROS_DOCUMENTOS rd
         WHERE rd.cdTemplateDocumento = td.cdTemplateDocumento
           AND rd.cdCertificacion = @cdCertificacion
           AND rd.cdEstadoDocumento = 3) as nuRegistrosCompletos,
        (SELECT COUNT(*)
         FROM TD_TEMPLATES_CAMPOS tc
         WHERE tc.cdTemplateDocumento = td.cdTemplateDocumento
           AND tc.snEsTitulo = 0) as nuTotalCampos
      FROM TD_TEMPLATES_DOCUMENTOS td
      WHERE td.cdRequisito = @cdRequisito
        AND td.snActivo = 1
      ORDER BY td.dsNombre
    `, {
      cdRequisito: parseInt(id),
      cdCertificacion: parseInt(cdCertificacion)
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Error al obtener templates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
