import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

/**
 * POST /api/admin/usuarios/[id]/cambiar-password
 * Cambiar contraseña de un usuario
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdUsuario = parseInt(id);

    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Permitir si es admin o si es el propio usuario
    const isAdmin = decoded.cdTipoUsuario === 1 || decoded.cdTipoUsuario === 2;
    const isSelf = decoded.cdUsuario === cdUsuario;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para cambiar esta contraseña' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nuevaClave, esClaveTemporal } = body;

    if (!nuevaClave) {
      return NextResponse.json(
        { success: false, error: 'La nueva contraseña es requerida' },
        { status: 400 }
      );
    }

    // Encriptar nueva contraseña
    const hashedPassword = await hashPassword(nuevaClave);

    // Actualizar contraseña
    await query(
      `
      UPDATE TD_USUARIOS SET
        dsClave = @dsClave,
        snClaveTemporal = @snClaveTemporal,
        snPrimerIngreso = 0,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdUsuario = @cdUsuario
      `,
      {
        cdUsuario,
        dsClave: hashedPassword,
        snClaveTemporal: esClaveTemporal ? 1 : 0,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cambiar contraseña' },
      { status: 500 }
    );
  }
}
