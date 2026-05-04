import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

/**
 * GET /api/admin/usuarios
 * Obtener lista de usuarios de una empresa consultora
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cdEmpresaConsultora = searchParams.get('cdEmpresaConsultora');

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

    // Si es super admin, debe especificar empresa. Si es admin empresa, usar su empresa
    const empresaId = decoded.cdTipoUsuario === 1 
      ? (cdEmpresaConsultora ? parseInt(cdEmpresaConsultora) : null)
      : decoded.cdEmpresaConsultora;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar una empresa' },
        { status: 400 }
      );
    }

    // Obtener usuarios con información de roles
    const usuarios = await query(
      `
      SELECT 
        u.cdUsuario,
        u.cdEmpresaConsultora,
        u.dsUsuario,
        u.dsNombreCompleto,
        u.dsMail,
        u.cdTipoUsuario,
        tu.dsTipoUsuario,
        u.cdCliente,
        c.dsRazonSocial as dsCliente,
        u.snClaveTemporal,
        u.snPrimerIngreso,
        u.feUltimoAcceso,
        u.feAltaUsuario,
        u.cdEstado,
        e.dsEstado,
        (
          SELECT STRING_AGG(r.dsRol, ', ')
          FROM TR_USUARIOS_ROLES ur
          INNER JOIN TD_ROLES r ON ur.cdRol = r.cdRol
          WHERE ur.cdUsuario = u.cdUsuario
        ) as dsRoles
      FROM TD_USUARIOS u
      INNER JOIN TV_TIPOS_USUARIO tu ON u.cdTipoUsuario = tu.cdTipoUsuario
      INNER JOIN TV_ESTADOS e ON u.cdEstado = e.cdEstado
      LEFT JOIN TD_CLIENTES c ON u.cdCliente = c.cdCliente
      WHERE u.cdEmpresaConsultora = @empresaId
      ORDER BY u.feAltaUsuario DESC
      `,
      { empresaId }
    );

    return NextResponse.json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/usuarios
 * Crear nuevo usuario
 */
export async function POST(request: NextRequest) {
  try {
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
      cdEmpresaConsultora,
      dsUsuario,
      dsNombreCompleto,
      dsMail,
      dsClave,
      cdTipoUsuario,
      cdCliente,
      snClaveTemporal,
      roles,
    } = body;

    // Validar campos requeridos
    if (!dsUsuario || !dsNombreCompleto || !dsMail || !dsClave || !cdTipoUsuario) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Si es usuario externo, debe tener cliente asignado
    if (cdTipoUsuario === 3 && !cdCliente) {
      return NextResponse.json(
        { success: false, error: 'Usuario externo debe tener cliente asignado' },
        { status: 400 }
      );
    }

    // Verificar que el usuario no exista
    const usuariosExistentes = await query(
      `
      SELECT cdUsuario FROM TD_USUARIOS
      WHERE dsUsuario = @dsUsuario AND cdEmpresaConsultora = @cdEmpresaConsultora
      `,
      { dsUsuario, cdEmpresaConsultora }
    );

    if (usuariosExistentes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'El usuario ya existe' },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await hashPassword(dsClave);

    // Insertar usuario
    const result = await query(
      `
      INSERT INTO TD_USUARIOS (
        cdEmpresaConsultora, dsUsuario, dsClave, dsNombreCompleto, dsMail,
        cdTipoUsuario, cdCliente, snClaveTemporal, snPrimerIngreso,
        cdEstado, feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdEmpresaConsultora, @dsUsuario, @dsClave, @dsNombreCompleto, @dsMail,
        @cdTipoUsuario, @cdCliente, @snClaveTemporal, 1,
        1, GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() as cdUsuario;
      `,
      {
        cdEmpresaConsultora,
        dsUsuario,
        dsClave: hashedPassword,
        dsNombreCompleto,
        dsMail,
        cdTipoUsuario,
        cdCliente: cdCliente || null,
        snClaveTemporal: snClaveTemporal ? 1 : 0,
        cdUsuarioCreacion: decoded.cdUsuario,
      }
    );

    const cdUsuario = result[0].cdUsuario;

    // Asignar roles si se proporcionaron
    if (roles && Array.isArray(roles) && roles.length > 0) {
      for (const cdRol of roles) {
        await query(
          `
          INSERT INTO TR_USUARIOS_ROLES (cdUsuario, cdRol, feCreacion, cdUsuarioCreacion)
          VALUES (@cdUsuario, @cdRol, GETDATE(), @cdUsuarioCreacion)
          `,
          {
            cdUsuario,
            cdRol,
            cdUsuarioCreacion: decoded.cdUsuario,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { cdUsuario },
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
