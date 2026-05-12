import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/empresas-gestor-documental?cdEmpresaConsultora=X
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

    const { searchParams } = new URL(request.url);
    const cdEmpresaConsultora = searchParams.get('cdEmpresaConsultora');

    if (!cdEmpresaConsultora) {
      return NextResponse.json({ 
        success: false, 
        error: 'cdEmpresaConsultora es requerido' 
      }, { status: 400 });
    }

    const gestorDoc = await query(`
      SELECT 
        cdEmpresaGestorDocumental,
        cdEmpresaConsultora,
        dsCodigoLibreria,
        dsCodigoClase,
        feCreacion,
        feModificacion
      FROM TD_EMPRESAS_GESTOR_DOCUMENTAL
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora
    `, { cdEmpresaConsultora: parseInt(cdEmpresaConsultora) });

    return NextResponse.json({ 
      success: true, 
      data: gestorDoc.length > 0 ? gestorDoc[0] : null 
    });
  } catch (error: any) {
    console.error('Error al obtener gestor documental:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/empresas-gestor-documental - Crear configuración
export async function POST(request: NextRequest) {
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
    const { cdEmpresaConsultora, dsCodigoLibreria, dsCodigoClase } = body;

    // Verificar si ya existe
    const existing = await query(`
      SELECT cdEmpresaGestorDocumental 
      FROM TD_EMPRESAS_GESTOR_DOCUMENTAL 
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora
    `, { cdEmpresaConsultora });

    if (existing && existing.length > 0) {
      // Actualizar
      await query(`
        UPDATE TD_EMPRESAS_GESTOR_DOCUMENTAL
        SET 
          dsCodigoLibreria = @dsCodigoLibreria,
          dsCodigoClase = @dsCodigoClase,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
        WHERE cdEmpresaConsultora = @cdEmpresaConsultora
      `, {
        cdEmpresaConsultora,
        dsCodigoLibreria,
        dsCodigoClase,
        cdUsuarioModificacion: decoded.cdUsuario,
      });
    } else {
      // Crear
      await query(`
        INSERT INTO TD_EMPRESAS_GESTOR_DOCUMENTAL (
          cdEmpresaConsultora,
          dsCodigoLibreria,
          dsCodigoClase,
          feCreacion,
          cdUsuarioCreacion
        )
        VALUES (
          @cdEmpresaConsultora,
          @dsCodigoLibreria,
          @dsCodigoClase,
          GETDATE(),
          @cdUsuarioCreacion
        )
      `, {
        cdEmpresaConsultora,
        dsCodigoLibreria,
        dsCodigoClase,
        cdUsuarioCreacion: decoded.cdUsuario,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración del gestor documental guardada correctamente' 
    });
  } catch (error: any) {
    console.error('Error al guardar gestor documental:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
