import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/templates?cdRequisito=X
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
      return NextResponse.json({ success: false, error: 'cdRequisito es requerido' }, { status: 400 });
    }

    const templates = await query(`
      SELECT 
        t.cdTemplateDocumento,
        t.cdRequisito,
        t.cdCodigo,
        t.dsNombre,
        t.cdTipoDocumento,
        t.dsVersionTemplate,
        t.dsArchivoWord,
        t.dsNombreArchivo,
        t.snActivo,
        t.feCreacion,
        t.cdUsuarioCreacion,
        t.feModificacion,
        t.cdUsuarioModificacion
      FROM TD_TEMPLATES_DOCUMENTOS t
      WHERE t.cdRequisito = @cdRequisito
      ORDER BY t.dsNombre
    `, { cdRequisito: parseInt(cdRequisito) });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Error al obtener templates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/templates
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
    const { 
      cdRequisito, 
      cdCodigo, 
      dsNombre, 
      cdTipoDocumento, 
      dsVersionTemplate,
      dsArchivoWord,
      dsNombreArchivo
    } = body;

    // Validar campos requeridos
    if (!cdRequisito || !dsNombre) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdRequisito y dsNombre' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO TD_TEMPLATES_DOCUMENTOS (
        cdRequisito, cdCodigo, dsNombre, cdTipoDocumento, dsVersionTemplate,
        dsArchivoWord, dsNombreArchivo, snActivo, feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdRequisito, @cdCodigo, @dsNombre, @cdTipoDocumento, @dsVersionTemplate,
        @dsArchivoWord, @dsNombreArchivo, 1, GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() AS cdTemplateDocumento;
    `, {
      cdRequisito: parseInt(cdRequisito),
      cdCodigo: cdCodigo || null,
      dsNombre,
      cdTipoDocumento: cdTipoDocumento ? parseInt(cdTipoDocumento) : null,
      dsVersionTemplate: dsVersionTemplate || null,
      dsArchivoWord: dsArchivoWord || null,
      dsNombreArchivo: dsNombreArchivo || null,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    return NextResponse.json({ 
      success: true, 
      data: { cdTemplateDocumento: result[0]?.cdTemplateDocumento } 
    });
  } catch (error: any) {
    console.error('Error al crear template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
