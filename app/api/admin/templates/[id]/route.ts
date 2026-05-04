import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/templates/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const cdTemplateDocumento = parseInt(params.id);

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
      WHERE t.cdTemplateDocumento = @cdTemplateDocumento
    `, { cdTemplateDocumento });

    if (!templates || templates.length === 0) {
      return NextResponse.json({ success: false, error: 'Template no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: templates[0] });
  } catch (error: any) {
    console.error('Error al obtener template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/templates/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const cdTemplateDocumento = parseInt(params.id);
    const body = await request.json();
    const { 
      cdCodigo, 
      dsNombre, 
      cdTipoDocumento, 
      dsVersionTemplate,
      dsArchivoWord,
      dsNombreArchivo,
      snActivo
    } = body;

    await query(`
      UPDATE TD_TEMPLATES_DOCUMENTOS
      SET cdCodigo = @cdCodigo,
          dsNombre = @dsNombre,
          cdTipoDocumento = @cdTipoDocumento,
          dsVersionTemplate = @dsVersionTemplate,
          dsArchivoWord = @dsArchivoWord,
          dsNombreArchivo = @dsNombreArchivo,
          snActivo = @snActivo,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdTemplateDocumento = @cdTemplateDocumento
    `, {
      cdTemplateDocumento,
      cdCodigo: cdCodigo || null,
      dsNombre,
      cdTipoDocumento: cdTipoDocumento ? parseInt(cdTipoDocumento) : null,
      dsVersionTemplate: dsVersionTemplate || null,
      dsArchivoWord: dsArchivoWord || null,
      dsNombreArchivo: dsNombreArchivo || null,
      snActivo: snActivo !== undefined ? (snActivo ? 1 : 0) : 1,
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdTemplateDocumento } });
  } catch (error: any) {
    console.error('Error al actualizar template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/templates/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const cdTemplateDocumento = parseInt(params.id);

    // Soft delete - cambiar snActivo a false
    await query(`
      UPDATE TD_TEMPLATES_DOCUMENTOS
      SET snActivo = 0,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdTemplateDocumento = @cdTemplateDocumento
    `, {
      cdTemplateDocumento,
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdTemplateDocumento } });
  } catch (error: any) {
    console.error('Error al eliminar template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
