import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/registros-documentos/[id]
// Obtiene el documento con todos sus campos y valores actuales
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
    const cdRegistroDocumento = parseInt(id);

    // Obtener información del documento
    const documentos = await query(`
      SELECT 
        rd.cdRegistroDocumento,
        rd.cdCertificacion,
        rd.cdTemplateDocumento,
        td.dsNombre as dsNombreTemplate,
        rd.cdRequisito,
        r.cdCodigoRequisito,
        r.dsRequisito,
        rd.dsCodigoDocumento,
        rd.dsNombreDocumento,
        rd.cdEstadoDocumento,
        e.dsEstado as dsEstadoDocumento,
        rd.dsArchivoGenerado,
        rd.dsNombreArchivo,
        rd.cdDocumentoAditus,
        rd.dsObservaciones,
        rd.feCreacion,
        rd.feModificacion
      FROM TD_REGISTROS_DOCUMENTOS rd
      INNER JOIN TD_TEMPLATES_DOCUMENTOS td ON rd.cdTemplateDocumento = td.cdTemplateDocumento
      INNER JOIN TD_REQUISITOS r ON rd.cdRequisito = r.cdRequisito
      INNER JOIN TV_ESTADOS e ON rd.cdEstadoDocumento = e.cdEstado
      WHERE rd.cdRegistroDocumento = @cdRegistroDocumento
    `, { cdRegistroDocumento });

    if (!documentos || documentos.length === 0) {
      return NextResponse.json({ success: false, error: 'Documento no encontrado' }, { status: 404 });
    }

    const documento = documentos[0];

    // Obtener campos del template con sus valores actuales
    const campos = await query(`
      SELECT 
        tc.cdTemplateCampo,
        tc.snEsTitulo,
        tc.dsTitulo,
        tc.dsNombreCampo,
        tc.dsEtiqueta,
        tc.cdTipoCampo,
        tip.dsTipoCampo,
        tc.snObligatorio,
        tc.snOculto,
        tc.snSoloLectura,
        tc.dsTipoHerencia,
        tc.dsEntidadCliente,
        tc.cdLista,
        l.dsNombreLista,
        tc.nuOrden,
        rcv.cdRegistroCampoValor,
        rcv.dsValor,
        rcv.cdListaItem,
        li.dsValor as dsValorListaItem,
        rcv.cdEntidadCliente,
        rcv.dsEntidadTipo
      FROM TD_TEMPLATES_CAMPOS tc
      LEFT JOIN TV_TIPOS_CAMPO tip ON tc.cdTipoCampo = tip.cdTipoCampo
      LEFT JOIN TD_LISTAS l ON tc.cdLista = l.cdLista
      LEFT JOIN TD_REGISTROS_CAMPOS_VALORES rcv ON tc.cdTemplateCampo = rcv.cdTemplateCampo 
        AND rcv.cdRegistroDocumento = @cdRegistroDocumento
      LEFT JOIN TD_LISTAS_ITEMS li ON rcv.cdListaItem = li.cdListaItem
      WHERE tc.cdTemplateDocumento = @cdTemplateDocumento
      ORDER BY tc.nuOrden, tc.cdTemplateCampo
    `, {
      cdRegistroDocumento,
      cdTemplateDocumento: documento.cdTemplateDocumento
    });

    return NextResponse.json({
      success: true,
      data: {
        documento,
        campos
      }
    });
  } catch (error: any) {
    console.error('Error al obtener registro de documento:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/registros-documentos/[id]
// Actualiza metadatos del documento (no los valores de campos)
export async function PUT(
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
    const cdRegistroDocumento = parseInt(id);
    const body = await request.json();
    const {
      dsCodigoDocumento,
      dsNombreDocumento,
      cdEstadoDocumento,
      dsObservaciones
    } = body;

    await query(`
      UPDATE TD_REGISTROS_DOCUMENTOS
      SET dsCodigoDocumento = @dsCodigoDocumento,
          dsNombreDocumento = @dsNombreDocumento,
          cdEstadoDocumento = @cdEstadoDocumento,
          dsObservaciones = @dsObservaciones,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdRegistroDocumento = @cdRegistroDocumento
    `, {
      cdRegistroDocumento,
      dsCodigoDocumento: dsCodigoDocumento || null,
      dsNombreDocumento: dsNombreDocumento || null,
      cdEstadoDocumento: cdEstadoDocumento ? parseInt(cdEstadoDocumento) : 1,
      dsObservaciones: dsObservaciones || null,
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdRegistroDocumento } });
  } catch (error: any) {
    console.error('Error al actualizar registro de documento:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
