import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/formularios-hijos?cdRegistroDocumentoPadre=X&cdTemplateCampo=Y
// Obtiene todos los registros hijos de un campo tipo Formulario
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
    const cdRegistroDocumentoPadre = searchParams.get('cdRegistroDocumentoPadre');
    const cdTemplateCampo = searchParams.get('cdTemplateCampo');

    if (!cdRegistroDocumentoPadre || !cdTemplateCampo) {
      return NextResponse.json({ 
        success: false, 
        error: 'cdRegistroDocumentoPadre y cdTemplateCampo son requeridos' 
      }, { status: 400 });
    }

    // Obtener registros hijos
    const registrosHijos = await query(`
      SELECT 
        rd.cdRegistroDocumento as cdRegistroDocumentoHijo,
        rd.cdTemplateDocumento,
        td.dsNombre as dsNombreFormulario,
        rd.dsCodigoDocumento,
        rd.dsNombreDocumento,
        rd.feCreacion,
        rd.feModificacion,
        rfh.cdTemplateCampo
      FROM TR_REGISTROS_FORMULARIOS_HIJOS rfh
      INNER JOIN TD_REGISTROS_DOCUMENTOS rd ON rfh.cdRegistroHijo = rd.cdRegistroDocumento
      INNER JOIN TD_TEMPLATES_DOCUMENTOS td ON rd.cdTemplateDocumento = td.cdTemplateDocumento
      WHERE rfh.cdRegistroPadre = @cdRegistroDocumentoPadre
        AND rfh.cdTemplateCampo = @cdTemplateCampo
      ORDER BY rd.feCreacion DESC
    `, { 
      cdRegistroDocumentoPadre: parseInt(cdRegistroDocumentoPadre),
      cdTemplateCampo: parseInt(cdTemplateCampo)
    });

    return NextResponse.json({ 
      success: true, 
      data: registrosHijos 
    });
  } catch (error: any) {
    console.error('Error al obtener registros hijos:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// POST /api/admin/formularios-hijos
// Crea un nuevo registro hijo y su relación
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
      cdRegistroDocumentoPadre,
      cdTemplateCampo,
      cdTemplateDocumento,
      valores,
      listasClienteSeleccionadas = {}
    } = body;

    if (!cdRegistroDocumentoPadre || !cdTemplateCampo || !cdTemplateDocumento || !valores) {
      return NextResponse.json({ 
        success: false, 
        error: 'Faltan datos requeridos' 
      }, { status: 400 });
    }

    // Obtener certificación y requisito del padre
    const documentoPadre = await query(`
      SELECT cdCertificacion, cdRequisito 
      FROM TD_REGISTROS_DOCUMENTOS 
      WHERE cdRegistroDocumento = @cdRegistroDocumentoPadre
    `, { cdRegistroDocumentoPadre });

    if (documentoPadre.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Documento padre no encontrado' 
      }, { status: 404 });
    }

    const { cdCertificacion, cdRequisito } = documentoPadre[0];

    // 1. Crear registro documento hijo
    const resultDocumento = await query(`
      INSERT INTO TD_REGISTROS_DOCUMENTOS (
        cdCertificacion,
        cdTemplateDocumento,
        cdRequisito,
        dsCodigoDocumento,
        dsNombreDocumento,
        cdEstadoDocumento,
        feCreacion,
        cdUsuarioCreacion
      )
      OUTPUT INSERTED.cdRegistroDocumento
      VALUES (
        @cdCertificacion,
        @cdTemplateDocumento,
        @cdRequisito,
        'AUTO',
        'Registro hijo',
        20,
        GETDATE(),
        @cdUsuarioCreacion
      )
    `, {
      cdCertificacion,
      cdTemplateDocumento,
      cdRequisito,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    const cdRegistroDocumentoHijo = resultDocumento[0].cdRegistroDocumento;

    // 2. Obtener campos del template y crear valores
    const campos = await query(`
      SELECT 
        tc.cdTemplateCampo, 
        tc.snEsTitulo,
        tc.cdTipoCampo,
        tc.dsTipoHerencia,
        tc.dsEntidadCliente
      FROM TD_TEMPLATES_CAMPOS tc
      WHERE tc.cdTemplateDocumento = @cdTemplateDocumento
      ORDER BY tc.nuOrden
    `, { cdTemplateDocumento });

    // 3. Crear registros de valores para cada campo
    for (const campo of campos) {
      if (!campo.snEsTitulo) {
        const valor = valores[campo.cdTemplateCampo];
        const cdTipoCampo = campo.cdTipoCampo;
        
        let dsValor = null;
        let cdListaItem = null;
        let cdListaCliente = null;

        // Determinar cómo guardar según el tipo de campo
        if (cdTipoCampo === 4) {
          // Lista
          cdListaItem = valor ? parseInt(valor) : null;
          // Si es herencia CLIENTE con LISTAS_CONFIGURADAS, guardar la lista seleccionada
          if (campo.dsTipoHerencia === 'CLIENTE' && campo.dsEntidadCliente === 'LISTAS_CONFIGURADAS') {
            cdListaCliente = listasClienteSeleccionadas[campo.cdTemplateCampo] || null;
          }
        } else if (cdTipoCampo === 8) {
          // Booleano
          dsValor = (valor === true || valor === '1') ? '1' : '0';
        } else {
          // Otros tipos: texto, número, fecha, etc.
          dsValor = valor ? valor.toString() : null;
        }
        
        await query(`
          INSERT INTO TD_REGISTROS_CAMPOS_VALORES (
            cdRegistroDocumento,
            cdTemplateCampo,
            dsValor,
            cdListaItem,
            cdListaCliente,
            feCreacion,
            cdUsuarioCreacion
          )
          VALUES (
            @cdRegistroDocumento,
            @cdTemplateCampo,
            @dsValor,
            @cdListaItem,
            @cdListaCliente,
            GETDATE(),
            @cdUsuarioCreacion
          )
        `, {
          cdRegistroDocumento: cdRegistroDocumentoHijo,
          cdTemplateCampo: campo.cdTemplateCampo,
          dsValor,
          cdListaItem,
          cdListaCliente,
          cdUsuarioCreacion: decoded.cdUsuario
        });
      }
    }

    // 4. Crear relación padre-hijo
    await query(`
      INSERT INTO TR_REGISTROS_FORMULARIOS_HIJOS (
        cdRegistroPadre,
        cdRegistroHijo,
        cdTemplateCampo,
        feCreacion,
        cdUsuarioCreacion
      )
      VALUES (
        @cdRegistroDocumentoPadre,
        @cdRegistroDocumentoHijo,
        @cdTemplateCampo,
        GETDATE(),
        @cdUsuarioCreacion
      )
    `, {
      cdRegistroDocumentoPadre,
      cdRegistroDocumentoHijo,
      cdTemplateCampo,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        cdRegistroDocumentoHijo,
        nuCamposCreados: campos.filter((c: any) => !c.snEsTitulo).length
      } 
    });
  } catch (error: any) {
    console.error('Error al crear registro hijo:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
