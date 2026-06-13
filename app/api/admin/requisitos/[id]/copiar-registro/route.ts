import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/admin/requisitos/[id]/copiar-registro
// Copia un registro existente como uno nuevo en el requisito destino
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
    const {
      cdCertificacion, // Certificación destino
      cdRegistroDocumentoOrigen, // Registro a copiar
      dsNuevoNombre // Nuevo nombre para el registro copiado
    } = body;

    // Validar campos requeridos
    if (!cdCertificacion || !cdRegistroDocumentoOrigen || !dsNuevoNombre) {
      return NextResponse.json({ 
        success: false, 
        error: 'Todos los campos son requeridos' 
      }, { status: 400 });
    }

    // Obtener el registro original
    const registroOriginal = await query(`
      SELECT 
        rd.cdTemplateDocumento,
        rd.dsCodigoDocumento,
        rd.cdEstadoDocumento,
        rd.dsObservaciones
      FROM TD_REGISTROS_DOCUMENTOS rd
      WHERE rd.cdRegistroDocumento = @cdRegistroDocumentoOrigen
    `, {
      cdRegistroDocumentoOrigen
    });

    if (registroOriginal.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Registro original no encontrado' 
      }, { status: 404 });
    }

    const original = registroOriginal[0];

    // Crear el nuevo registro
    const resultado = await query(`
      INSERT INTO TD_REGISTROS_DOCUMENTOS (
        cdCertificacion,
        cdTemplateDocumento,
        cdRequisito,
        dsCodigoDocumento,
        dsNombreDocumento,
        cdEstadoDocumento,
        dsObservaciones,
        cdUsuarioCreacion
      ) 
      OUTPUT INSERTED.cdRegistroDocumento
      VALUES (
        @cdCertificacion,
        @cdTemplateDocumento,
        @cdRequisito,
        @dsCodigoDocumento,
        @dsNombreDocumento,
        @cdEstadoDocumento,
        @dsObservaciones,
        @cdUsuario
      )
    `, {
      cdCertificacion,
      cdTemplateDocumento: original.cdTemplateDocumento,
      cdRequisito,
      dsCodigoDocumento: `${original.dsCodigoDocumento}-COPIA-${Date.now()}`,
      dsNombreDocumento: dsNuevoNombre,
      cdEstadoDocumento: original.cdEstadoDocumento,
      dsObservaciones: original.dsObservaciones,
      cdUsuario: decoded.cdUsuario
    });

    const cdNuevoRegistro = resultado[0].cdRegistroDocumento;

    // Copiar los valores de los campos
    const camposOriginales = await query(`
      SELECT 
        cdTemplateCampo,
        dsValor,
        cdListaItem,
        cdEntidadCliente,
        dsEntidadTipo
      FROM TD_REGISTROS_CAMPOS_VALORES
      WHERE cdRegistroDocumento = @cdRegistroDocumentoOrigen
    `, {
      cdRegistroDocumentoOrigen
    });

    // Insertar los valores copiados
    for (const campo of camposOriginales) {
      await query(`
        INSERT INTO TD_REGISTROS_CAMPOS_VALORES (
          cdRegistroDocumento,
          cdTemplateCampo,
          dsValor,
          cdListaItem,
          cdEntidadCliente,
          dsEntidadTipo,
          cdUsuarioCreacion
        ) VALUES (
          @cdRegistroDocumento,
          @cdTemplateCampo,
          @dsValor,
          @cdListaItem,
          @cdEntidadCliente,
          @dsEntidadTipo,
          @cdUsuario
        )
      `, {
        cdRegistroDocumento: cdNuevoRegistro,
        cdTemplateCampo: campo.cdTemplateCampo,
        dsValor: campo.dsValor,
        cdListaItem: campo.cdListaItem,
        cdEntidadCliente: campo.cdEntidadCliente,
        dsEntidadTipo: campo.dsEntidadTipo,
        cdUsuario: decoded.cdUsuario
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Formulario copiado correctamente',
      data: { cdRegistroDocumento: cdNuevoRegistro }
    });
  } catch (error: any) {
    console.error('Error al copiar registro:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
