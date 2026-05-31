import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/templates-requisito?cdRequisito=X
// Obtiene los templates asociados a un requisito (via TR_REQUISITOS_TEMPLATES)
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
    const cdRequisito = searchParams.get('cdRequisito');

    if (!cdRequisito) {
      return NextResponse.json({ 
        success: false, 
        error: 'cdRequisito es requerido' 
      }, { status: 400 });
    }

    const templates = await query(`
      SELECT 
        td.cdTemplateDocumento,
        td.dsNombre,
        td.cdCodigo,
        td.snActivo
      FROM TR_REQUISITOS_TEMPLATES rt
      INNER JOIN TD_TEMPLATES_DOCUMENTOS td ON rt.cdTemplateDocumento = td.cdTemplateDocumento
      WHERE rt.cdRequisito = @cdRequisito
        AND td.snActivo = 1
      ORDER BY td.dsNombre
    `, { cdRequisito: parseInt(cdRequisito) });

    return NextResponse.json({ 
      success: true, 
      data: templates 
    });
  } catch (error: any) {
    console.error('Error al obtener templates de requisito:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
