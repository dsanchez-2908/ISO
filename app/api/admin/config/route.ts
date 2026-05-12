import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/config - Obtener configuración global
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.cdTipoUsuario !== 1) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const config = await query(`
      SELECT 
        cdConfiguracion,
        dsURLBase,
        dsLogoBase64,
        dsUsuarioTokenAditus,
        dsClaveTokenAditus,
        dsURLTokenAditus,
        dsURLAgregarDocumentoAditus,
        dsURLModificarDocumentoAditus,
        dsURLVisorAditus,
        feCreacion,
        feModificacion
      FROM TD_CONFIGURACION_GLOBAL
      WHERE cdConfiguracion = 1
    `);

    if (!config || config.length === 0) {
      // Si no existe, crear registro inicial
      await query(`
        INSERT INTO TD_CONFIGURACION_GLOBAL (dsURLBase)
        VALUES ('http://localhost:3000/login/')
      `);
      
      const newConfig = await query(`
        SELECT * FROM TD_CONFIGURACION_GLOBAL WHERE cdConfiguracion = 1
      `);
      
      return NextResponse.json({ success: true, data: newConfig[0] });
    }

    return NextResponse.json({ success: true, data: config[0] });
  } catch (error: any) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/config - Actualizar configuración global
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.cdTipoUsuario !== 1) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      dsURLBase,
      dsLogoBase64,
      dsUsuarioTokenAditus,
      dsClaveTokenAditus,
      dsURLTokenAditus,
      dsURLAgregarDocumentoAditus,
      dsURLModificarDocumentoAditus,
      dsURLVisorAditus,
    } = body;

    await query(`
      UPDATE TD_CONFIGURACION_GLOBAL
      SET 
        dsURLBase = @dsURLBase,
        dsLogoBase64 = @dsLogoBase64,
        dsUsuarioTokenAditus = @dsUsuarioTokenAditus,
        dsClaveTokenAditus = @dsClaveTokenAditus,
        dsURLTokenAditus = @dsURLTokenAditus,
        dsURLAgregarDocumentoAditus = @dsURLAgregarDocumentoAditus,
        dsURLModificarDocumentoAditus = @dsURLModificarDocumentoAditus,
        dsURLVisorAditus = @dsURLVisorAditus,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuario
      WHERE cdConfiguracion = 1
    `, {
      dsURLBase,
      dsLogoBase64,
      dsUsuarioTokenAditus,
      dsClaveTokenAditus,
      dsURLTokenAditus,
      dsURLAgregarDocumentoAditus,
      dsURLModificarDocumentoAditus,
      dsURLVisorAditus,
      cdUsuario: decoded.cdUsuario,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración actualizada correctamente' 
    });
  } catch (error: any) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
