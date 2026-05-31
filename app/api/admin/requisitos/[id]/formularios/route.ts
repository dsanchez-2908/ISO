import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/requisitos/[id]/formularios - Obtener formularios asociados a un requisito
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

    const formularios = await query(`
      SELECT 
        t.cdTemplateDocumento,
        t.cdNorma,
        t.cdCodigo,
        t.dsNombre,
        t.cdTipoDocumento,
        t.dsVersionTemplate,
        t.dsArchivoWord,
        t.dsNombreArchivo,
        t.snActivo,
        rt.feCreacion as feAsociacion,
        rt.cdRequisitoTemplate
      FROM TR_REQUISITOS_TEMPLATES rt
      INNER JOIN TD_TEMPLATES_DOCUMENTOS t ON rt.cdTemplateDocumento = t.cdTemplateDocumento
      WHERE rt.cdRequisito = @cdRequisito
      ORDER BY t.dsNombre
    `, { cdRequisito });

    return NextResponse.json({ success: true, data: formularios });
  } catch (error: any) {
    console.error('Error al obtener formularios del requisito:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/requisitos/[id]/formularios - Asociar formulario a un requisito
export async function POST(
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
    const body = await request.json();
    const { cdTemplateDocumento } = body;

    if (!cdTemplateDocumento) {
      return NextResponse.json(
        { success: false, error: 'cdTemplateDocumento es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el formulario exista y esté activo
    const formulario = await query(`
      SELECT cdTemplateDocumento, snActivo FROM TD_TEMPLATES_DOCUMENTOS 
      WHERE cdTemplateDocumento = @cdTemplateDocumento
    `, { cdTemplateDocumento: parseInt(cdTemplateDocumento) });

    if (!formulario || formulario.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Formulario no encontrado' },
        { status: 404 }
      );
    }

    if (!formulario[0].snActivo) {
      return NextResponse.json(
        { success: false, error: 'No se puede asociar un formulario inactivo' },
        { status: 400 }
      );
    }

    // Verificar que no esté ya asociado
    const existing = await query(`
      SELECT cdRequisitoTemplate FROM TR_REQUISITOS_TEMPLATES 
      WHERE cdRequisito = @cdRequisito AND cdTemplateDocumento = @cdTemplateDocumento
    `, { 
      cdRequisito,
      cdTemplateDocumento: parseInt(cdTemplateDocumento)
    });

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'El formulario ya está asociado a este requisito' },
        { status: 400 }
      );
    }

    // Crear la asociación
    await query(`
      INSERT INTO TR_REQUISITOS_TEMPLATES (cdRequisito, cdTemplateDocumento, feCreacion, cdUsuarioCreacion)
      VALUES (@cdRequisito, @cdTemplateDocumento, GETDATE(), @cdUsuarioCreacion)
    `, {
      cdRequisito,
      cdTemplateDocumento: parseInt(cdTemplateDocumento),
      cdUsuarioCreacion: decoded.cdUsuario || null,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Formulario asociado correctamente al requisito' 
    });
  } catch (error: any) {
    console.error('Error al asociar formulario:', error);
    
    // Manejar error de duplicado por constraint único
    if (error.message && error.message.includes('UK_TR_REQUISITOS_TEMPLATES')) {
      return NextResponse.json(
        { success: false, error: 'El formulario ya está asociado a este requisito' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/requisitos/[id]/formularios?cdTemplateDocumento=X - Desasociar formulario de requisito
export async function DELETE(
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
    const cdTemplateDocumento = searchParams.get('cdTemplateDocumento');

    if (!cdTemplateDocumento) {
      return NextResponse.json(
        { success: false, error: 'cdTemplateDocumento es requerido' },
        { status: 400 }
      );
    }

    await query(`
      DELETE FROM TR_REQUISITOS_TEMPLATES
      WHERE cdRequisito = @cdRequisito AND cdTemplateDocumento = @cdTemplateDocumento
    `, {
      cdRequisito,
      cdTemplateDocumento: parseInt(cdTemplateDocumento),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Formulario desasociado correctamente del requisito' 
    });
  } catch (error: any) {
    console.error('Error al desasociar formulario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
