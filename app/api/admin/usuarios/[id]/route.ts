import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/usuarios/[id]
 * Obtener detalle de un usuario
 */
export async function GET(
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
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener usuario
    const usuarios = await query(
      `
      SELECT 
        u.*,
        tu.dsTipoUsuario,
        e.dsEstado,
        c.dsRazonSocial as dsCliente
      FROM TD_USUARIOS u
      INNER JOIN TV_TIPOS_USUARIO tu ON u.cdTipoUsuario = tu.cdTipoUsuario
      INNER JOIN TV_ESTADOS e ON u.cdEstado = e.cdEstado
      LEFT JOIN TD_CLIENTES c ON u.cdCliente = c.cdCliente
      WHERE u.cdUsuario = @cdUsuario
      `,
      { cdUsuario }
    );

    if (usuarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener roles asignados
    const roles = await query(
      `
      SELECT r.cdRol, r.dsRol, r.dsDescripcion
      FROM TR_USUARIOS_ROLES ur
      INNER JOIN TD_ROLES r ON ur.cdRol = r.cdRol
      WHERE ur.cdUsuario = @cdUsuario
      `,
      { cdUsuario }
    );

    return NextResponse.json({
      success: true,
      data: {
        usuario: usuarios[0],
        roles,
      },
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/usuarios/[id]
 * Actualizar usuario
 */
export async function PUT(
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
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      dsNombreCompleto,
      dsMail,
      cdTipoUsuario,
      cdCliente,
      roles,
    } = body;

    // Actualizar usuario
    await query(
      `
      UPDATE TD_USUARIOS SET
        dsNombreCompleto = @dsNombreCompleto,
        dsMail = @dsMail,
        cdTipoUsuario = @cdTipoUsuario,
        cdCliente = @cdCliente,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdUsuario = @cdUsuario
      `,
      {
        cdUsuario,
        dsNombreCompleto,
        dsMail,
        cdTipoUsuario,
        cdCliente: cdCliente || null,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    // Actualizar roles si se proporcionaron
    if (roles && Array.isArray(roles)) {
      // Eliminar todos los roles actuales
      await query(
        `DELETE FROM TR_USUARIOS_ROLES WHERE cdUsuario = @cdUsuario`,
        { cdUsuario }
      );

      // Insertar nuevos roles
      for (const cdRol of roles) {
        await query(
          `
          INSERT INTO TR_USUARIOS_ROLES (cdUsuario, cdRol, feCreacion, cdUsuarioCreacion)
          VALUES (@cdUsuario, @cdRol, GETDATE(), @cdUsuarioCreacion)
          `,
          { cdUsuario, cdRol, cdUsuarioCreacion: decoded.cdUsuario }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/usuarios/[id]
 * Desactivar usuario
 */
export async function DELETE(
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
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // No permitir desactivar al propio usuario
    if (cdUsuario === decoded.cdUsuario) {
      return NextResponse.json(
        { success: false, error: 'No puede desactivar su propio usuario' },
        { status: 400 }
      );
    }

    // Desactivar usuario
    await query(
      `
      UPDATE TD_USUARIOS SET
        cdEstado = 0,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdUsuario = @cdUsuario
      `,
      {
        cdUsuario,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar usuario' },
      { status: 500 }
    );
  }
}
