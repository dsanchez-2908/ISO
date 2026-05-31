import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/registros-documentos?cdCertificacion=X&cdRequisito=Y&cdTemplateDocumento=Z
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
    const cdCertificacion = searchParams.get('cdCertificacion');
    const cdRequisito = searchParams.get('cdRequisito');
    const cdTemplateDocumento = searchParams.get('cdTemplateDocumento');

    if (!cdCertificacion) {
      return NextResponse.json({ success: false, error: 'cdCertificacion es requerido' }, { status: 400 });
    }

    // Construir WHERE dinámico
    let whereClause = 'WHERE rd.cdCertificacion = @cdCertificacion';
    const params: any = { cdCertificacion: parseInt(cdCertificacion) };

    if (cdRequisito) {
      whereClause += ' AND rd.cdRequisito = @cdRequisito';
      params.cdRequisito = parseInt(cdRequisito);
    }

    if (cdTemplateDocumento) {
      whereClause += ' AND rd.cdTemplateDocumento = @cdTemplateDocumento';
      params.cdTemplateDocumento = parseInt(cdTemplateDocumento);
    }

    const registros = await query(`
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
        rd.dsNombreArchivo,
        rd.cdDocumentoAditus,
        rd.dsObservaciones,
        rd.feCreacion,
        rd.feModificacion,
        (SELECT COUNT(*) FROM TD_REGISTROS_CAMPOS_VALORES WHERE cdRegistroDocumento = rd.cdRegistroDocumento) as nuCamposTotal,
        (SELECT COUNT(*) FROM TD_REGISTROS_CAMPOS_VALORES WHERE cdRegistroDocumento = rd.cdRegistroDocumento AND dsValor IS NOT NULL AND dsValor != '') as nuCamposCompletos
      FROM TD_REGISTROS_DOCUMENTOS rd
      INNER JOIN TD_TEMPLATES_DOCUMENTOS td ON rd.cdTemplateDocumento = td.cdTemplateDocumento
      INNER JOIN TD_REQUISITOS r ON rd.cdRequisito = r.cdRequisito
      INNER JOIN TV_ESTADOS e ON rd.cdEstadoDocumento = e.cdEstado
      ${whereClause}
      ORDER BY r.nuOrden, r.cdCodigoRequisito, td.dsNombre
    `, params);

    return NextResponse.json({ success: true, data: registros });
  } catch (error: any) {
    console.error('Error al obtener registros de documentos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/registros-documentos
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
      cdCertificacion,
      cdTemplateDocumento,
      cdRequisito,
      dsCodigoDocumento,
      dsNombreDocumento,
      dsObservaciones
    } = body;

    // Validar campos requeridos
    if (!cdCertificacion || !cdTemplateDocumento || !cdRequisito) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdCertificacion, cdTemplateDocumento, cdRequisito' },
        { status: 400 }
      );
    }

    // 1. Crear registro de documento
    const resultDoc = await query(`
      INSERT INTO TD_REGISTROS_DOCUMENTOS (
        cdCertificacion, cdTemplateDocumento, cdRequisito,
        dsCodigoDocumento, dsNombreDocumento, cdEstadoDocumento, dsObservaciones,
        feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdCertificacion, @cdTemplateDocumento, @cdRequisito,
        @dsCodigoDocumento, @dsNombreDocumento, @cdEstadoDocumento, @dsObservaciones,
        GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() AS cdRegistroDocumento;
    `, {
      cdCertificacion: parseInt(cdCertificacion),
      cdTemplateDocumento: parseInt(cdTemplateDocumento),
      cdRequisito: parseInt(cdRequisito),
      dsCodigoDocumento: dsCodigoDocumento || null,
      dsNombreDocumento: dsNombreDocumento || null,
      cdEstadoDocumento: 1, // Borrador
      dsObservaciones: dsObservaciones || null,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    const cdRegistroDocumento = resultDoc[0]?.cdRegistroDocumento;

    if (!cdRegistroDocumento) {
      throw new Error('No se pudo obtener el ID del registro creado');
    }

    // 2. Obtener campos del template y crear valores vacíos
    const campos = await query(`
      SELECT 
        cdTemplateCampo,
        dsValorDefault,
        cdValorDefaultLista,
        snEsTitulo
      FROM TD_TEMPLATES_CAMPOS
      WHERE cdTemplateDocumento = @cdTemplateDocumento
      ORDER BY nuOrden
    `, { cdTemplateDocumento: parseInt(cdTemplateDocumento) });

    // 3. Crear registro de valor para cada campo (excepto títulos)
    for (const campo of campos) {
      if (!campo.snEsTitulo) {
        await query(`
          INSERT INTO TD_REGISTROS_CAMPOS_VALORES (
            cdRegistroDocumento, cdTemplateCampo, dsValor, cdListaItem,
            feCreacion, cdUsuarioCreacion
          )
          VALUES (
            @cdRegistroDocumento, @cdTemplateCampo, @dsValor, @cdListaItem,
            GETDATE(), @cdUsuarioCreacion
          )
        `, {
          cdRegistroDocumento,
          cdTemplateCampo: campo.cdTemplateCampo,
          dsValor: campo.dsValorDefault || null,
          cdListaItem: campo.cdValorDefaultLista || null,
          cdUsuarioCreacion: decoded.cdUsuario
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { 
        cdRegistroDocumento,
        nuCamposCreados: campos.filter((c: any) => !c.snEsTitulo).length
      }
    });
  } catch (error: any) {
    console.error('Error al crear registro de documento:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
