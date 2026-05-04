import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

/**
 * POST /api/admin/empresas/[id]/usuario-admin
 * Crear usuario administrador para una empresa consultora
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdEmpresaConsultora = parseInt(id);

    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.cdTipoUsuario !== 1) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      dsUsuario,
      dsNombreCompleto,
      dsMail,
      dsClaveTemporal,
    } = body;

    // Validar campos requeridos
    if (!dsUsuario || !dsNombreCompleto || !dsMail || !dsClaveTemporal) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario no exista
    const usuariosExistentes = await query(
      `
      SELECT cdUsuario FROM TD_USUARIOS
      WHERE dsUsuario = @dsUsuario
      `,
      { dsUsuario }
    );

    if (usuariosExistentes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'El usuario ya existe' },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await hashPassword(dsClaveTemporal);

    // Insertar usuario
    const result = await query(
      `
      INSERT INTO TD_USUARIOS (
        dsUsuario, dsClave, dsNombreCompleto, dsMail,
        cdTipoUsuario, cdEmpresaConsultora, 
        snClaveTemporal, snPrimerIngreso,
        cdEstado, feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @dsUsuario, @dsClave, @dsNombreCompleto, @dsMail,
        2, @cdEmpresaConsultora,
        1, 1,
        1, GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() as cdUsuario;
      `,
      {
        dsUsuario,
        dsClave: hashedPassword,
        dsNombreCompleto,
        dsMail,
        cdEmpresaConsultora,
        cdUsuarioCreacion: decoded.cdUsuario,
      }
    );

    const cdUsuario = result[0].cdUsuario;

    // Asignar rol de Administrador (cdRol = 2)
    await query(
      `
      INSERT INTO TR_USUARIOS_ROLES (cdUsuario, cdRol)
      VALUES (@cdUsuario, 2)
      `,
      { cdUsuario }
    );

    return NextResponse.json({
      success: true,
      data: { cdUsuario },
      message: 'Usuario administrador creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario administrador' },
      { status: 500 }
    );
  }
}
