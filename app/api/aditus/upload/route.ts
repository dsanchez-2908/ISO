import { NextResponse } from 'next/server';
import sql from 'mssql';
import { sqlConfig } from '@/lib/db';
import { getAditusToken, uploadDocumentToAditus } from '@/lib/aditus/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cdEmpresaConsultora, fileContent, fileName, contentType } = body;

    if (!cdEmpresaConsultora || !fileContent || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Obtener configuración de Aditus de TD_PARAMETROS
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('cdEmpresaConsultora', sql.Int, cdEmpresaConsultora)
      .query(`
        SELECT 
          dsCodigoParametro,
          dsValorParametro
        FROM TD_PARAMETROS
        WHERE cdEmpresaConsultora = @cdEmpresaConsultora
          AND cdEstado = 1
          AND dsCodigoParametro IN (
            'URL_AGREGAR_DOCUMENTO',
            'URL_TOKEN',
            'USUARIO_TOKEN',
            'CLAVE_TOKEN',
            'CODIGO_LIBRERIA',
            'CODIGO_CLASE',
            'URL_VISOR'
          )
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontró la configuración de Aditus para esta empresa' },
        { status: 404 }
      );
    }

    // Convertir array de parámetros a objeto
    const params = result.recordset.reduce((acc, row) => {
      acc[row.dsCodigoParametro] = row.dsValorParametro;
      return acc;
    }, {} as Record<string, string>);

    // Validar que existan todos los parámetros necesarios
    const requiredParams = [
      'URL_AGREGAR_DOCUMENTO',
      'URL_TOKEN',
      'USUARIO_TOKEN',
      'CLAVE_TOKEN',
      'CODIGO_LIBRERIA',
      'CODIGO_CLASE'
    ];

    const missingParams = requiredParams.filter(param => !params[param]);
    if (missingParams.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Faltan parámetros de configuración de Aditus: ${missingParams.join(', ')}` 
        },
        { status: 500 }
      );
    }

    const config = {
      urlToken: params.URL_TOKEN,
      urlAgregarDocumento: params.URL_AGREGAR_DOCUMENTO,
      urlVisor: params.URL_VISOR || '',
      usuarioToken: params.USUARIO_TOKEN,
      claveToken: params.CLAVE_TOKEN,
      codigoLibreria: params.CODIGO_LIBRERIA,
      codigoClase: params.CODIGO_CLASE,
    };

    // Obtener token de Aditus
    const token = await getAditusToken(config);

    // Subir documento a Aditus
    const documentId = await uploadDocumentToAditus(
      config,
      token,
      fileContent,
      fileName,
      contentType || 'application/pdf'
    );

    return NextResponse.json({
      success: true,
      data: {
        documentId: documentId,
        fileName: fileName,
      },
    });
  } catch (error) {
    console.error('Error al subir documento a Aditus:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al subir documento a Aditus';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
