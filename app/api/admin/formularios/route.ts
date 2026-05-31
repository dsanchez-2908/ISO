import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/formularios?cdNorma=X
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

    const formularios = await query(`
      SELECT 
        t.cdTemplateDocumento,
        t.cdNorma,
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
        t.cdUsuarioModificacion,
        (SELECT COUNT(*) FROM TR_REQUISITOS_TEMPLATES rt WHERE rt.cdTemplateDocumento = t.cdTemplateDocumento) as nuRequisitosAsociados
      FROM TD_TEMPLATES_DOCUMENTOS t
      WHERE t.cdNorma = @cdNorma
      ORDER BY t.dsNombre
    `, { cdNorma: parseInt(cdNorma) });

    return NextResponse.json({ success: true, data: formularios });
  } catch (error: any) {
    console.error('Error al obtener formularios:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/formularios
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
      cdNorma,
      cdCodigo, 
      dsNombre, 
      cdTipoDocumento, 
      dsVersionTemplate,
      dsArchivoWord,
      dsNombreArchivo
    } = body;

    // Validar campos requeridos
    if (!cdNorma || !dsNombre) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdNorma y dsNombre' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO TD_TEMPLATES_DOCUMENTOS (
        cdNorma, cdRequisito, cdCodigo, dsNombre, cdTipoDocumento, dsVersionTemplate,
        dsArchivoWord, dsNombreArchivo, snActivo, feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdNorma, NULL, @cdCodigo, @dsNombre, @cdTipoDocumento, @dsVersionTemplate,
        @dsArchivoWord, @dsNombreArchivo, 1, GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() AS cdTemplateDocumento;
    `, {
      cdNorma: parseInt(cdNorma),
      cdCodigo: cdCodigo || null,
      dsNombre,
      cdTipoDocumento: cdTipoDocumento ? parseInt(cdTipoDocumento) : null,
      dsVersionTemplate: dsVersionTemplate || null,
      dsArchivoWord: dsArchivoWord || null,
      dsNombreArchivo: dsNombreArchivo || null,
      cdUsuarioCreacion: decoded.cdUsuario || null,
    });

    const newFormulario = await query(`
      SELECT 
        t.cdTemplateDocumento,
        t.cdNorma,
        t.cdRequisito,
        t.cdCodigo,
        t.dsNombre,
        t.cdTipoDocumento,
        t.dsVersionTemplate,
        t.dsArchivoWord,
        t.dsNombreArchivo,
        t.snActivo,
        t.feCreacion,
        t.cdUsuarioCreacion
      FROM TD_TEMPLATES_DOCUMENTOS t
      WHERE t.cdTemplateDocumento = @cdTemplateDocumento
    `, { cdTemplateDocumento: result[0].cdTemplateDocumento });

    return NextResponse.json({ 
      success: true, 
      data: newFormulario[0],
      message: 'Formulario creado correctamente' 
    });
  } catch (error: any) {
    console.error('Error al crear formulario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
