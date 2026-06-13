import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/requisitos/[id]/registros?cdCertificacion=X
// Obtiene los registros de un requisito para una certificación específica
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

    // Obtener registros del requisito agrupados por template
    const registros = await query(`
      SELECT 
        rd.cdRegistroDocumento,
        rd.cdTemplateDocumento,
        td.dsNombre as dsNombreTemplate,
        rd.dsNombreDocumento as dsTituloFormulario,
        rd.cdEstadoDocumento,
        e.dsEstado as dsEstadoDocumento,
        rd.feCreacion,
        rd.feModificacion
      FROM TD_REGISTROS_DOCUMENTOS rd
      INNER JOIN TD_TEMPLATES_DOCUMENTOS td ON rd.cdTemplateDocumento = td.cdTemplateDocumento
      INNER JOIN TV_ESTADOS e ON rd.cdEstadoDocumento = e.cdEstado
      WHERE rd.cdRequisito = @cdRequisito
        AND rd.cdCertificacion = @cdCertificacion
      ORDER BY td.dsNombre, rd.dsNombreDocumento
    `, {
      cdRequisito,
      cdCertificacion: parseInt(cdCertificacion)
    });

    // Agrupar por template
    const templates: any = {};
    registros.forEach((reg: any) => {
      if (!templates[reg.cdTemplateDocumento]) {
        templates[reg.cdTemplateDocumento] = {
          cdTemplateDocumento: reg.cdTemplateDocumento,
          dsNombreTemplate: reg.dsNombreTemplate,
          registros: []
        };
      }
      templates[reg.cdTemplateDocumento].registros.push({
        cdRegistroDocumento: reg.cdRegistroDocumento,
        dsTituloFormulario: reg.dsTituloFormulario,
        dsEstadoDocumento: reg.dsEstadoDocumento,
        feModificacion: reg.feModificacion || reg.feCreacion
      });
    });

    return NextResponse.json({ 
      success: true, 
      data: Object.values(templates)
    });
  } catch (error: any) {
    console.error('Error al obtener registros del requisito:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
