import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { sqlConfig } from '@/lib/db';
import { getAditusToken } from '@/lib/aditus/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cdEmpresaConsultora, documentId } = body;

    if (!cdEmpresaConsultora || !documentId) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Obtener configuración global de Aditus (URLs y credenciales)
    const pool = await sql.connect(sqlConfig);
    const configGlobal = await pool.request().query(`
      SELECT TOP 1
        dsURLTokenAditus,
        dsURLVisorAditus,
        dsUsuarioTokenAditus,
        dsClaveTokenAditus
      FROM TD_CONFIGURACION_GLOBAL
    `);

    if (configGlobal.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontró la configuración global de Aditus' },
        { status: 404 }
      );
    }

    // Obtener librería de la empresa
    const gestorDoc = await pool.request()
      .input('cdEmpresaConsultora', sql.Int, cdEmpresaConsultora)
      .query(`
        SELECT 
          dsCodigoLibreria
        FROM TD_EMPRESAS_GESTOR_DOCUMENTAL
        WHERE cdEmpresaConsultora = @cdEmpresaConsultora
      `);

    if (gestorDoc.recordset.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se encontró la configuración del gestor documental para esta empresa' 
        },
        { status: 404 }
      );
    }

    const globalConfig = configGlobal.recordset[0];
    const gestorConfig = gestorDoc.recordset[0];

    if (!globalConfig.dsURLTokenAditus || !globalConfig.dsURLVisorAditus ||
        !globalConfig.dsUsuarioTokenAditus || !globalConfig.dsClaveTokenAditus ||
        !gestorConfig.dsCodigoLibreria) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan parámetros de configuración de Aditus' 
        },
        { status: 500 }
      );
    }

    const config = {
      urlToken: globalConfig.dsURLTokenAditus,
      urlAgregarDocumento: '',
      urlVisor: globalConfig.dsURLVisorAditus,
      usuarioToken: globalConfig.dsUsuarioTokenAditus,
      claveToken: globalConfig.dsClaveTokenAditus,
      codigoLibreria: gestorConfig.dsCodigoLibreria,
      codigoClase: '',
    };

    // Obtener token de Aditus
    const token = await getAditusToken(config);

    // Construir URL del visor
    const visorUrl = `${config.urlVisor}?image="${documentId}"&library="${config.codigoLibreria}"&token="${token}"`;

    return NextResponse.json({
      success: true,
      data: {
        visorUrl: visorUrl,
      },
    });
  } catch (error) {
    console.error('Error al generar URL del visor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al generar URL del visor';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
