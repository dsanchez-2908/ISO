import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

// PUT /api/admin/super-usuarios/[id] - Actualizar o cambiar clave
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
    if (!decoded || decoded.cdTipoUsuario !== 1) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const cdUsuario = parseInt(id);
    const body = await request.json();

    // Cambio de contraseña
    const { dsClave, snClaveTemporal } = body;
    
    if (!dsClave) {
      return NextResponse.json({ 
        success: false, 
        error: 'La contraseña es obligatoria' 
      }, { status: 400 });
    }

    const hashedPassword = await hashPassword(dsClave);
    
    await query(`
      UPDATE TD_USUARIOS
      SET 
        dsClave = @dsClave,
        snClaveTemporal = @snClaveTemporal,
        snPrimerIngreso = 0,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdUsuario = @cdUsuario
        AND cdTipoUsuario = 1
    `, {
      cdUsuario,
      dsClave: hashedPassword,
      snClaveTemporal: snClaveTemporal || 0,
      cdUsuarioModificacion: decoded.cdUsuario,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    });
  } catch (error: any) {
    console.error('Error al actualizar super usuario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/super-usuarios/[id] - Desactivar usuario
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
    if (!decoded || decoded.cdTipoUsuario !== 1) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const cdUsuario = parseInt(id);

    // No permitir que se desactive a sí mismo
    if (cdUsuario === decoded.cdUsuario) {
      return NextResponse.json({ 
        success: false, 
        error: 'No puede desactivar su propia cuenta' 
      }, { status: 400 });
    }

    await query(`
      UPDATE TD_USUARIOS
      SET 
        cdEstado = 2,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdUsuario = @cdUsuario
        AND cdTipoUsuario = 1
    `, {
      cdUsuario,
      cdUsuarioModificacion: decoded.cdUsuario,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario desactivado correctamente' 
    });
  } catch (error: any) {
    console.error('Error al desactivar super usuario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
