import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

// GET /api/admin/super-usuarios - Listar usuarios super admin
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

    const usuarios = await query(`
      SELECT 
        u.cdUsuario,
        u.dsUsuario,
        u.dsNombreCompleto,
        u.dsMail,
        u.cdEstado,
        e.dsEstado,
        u.feCreacion,
        u.feUltimoAcceso
      FROM TD_USUARIOS u
      LEFT JOIN TV_ESTADOS e ON u.cdEstado = e.cdEstado
      WHERE u.cdTipoUsuario = 1
        AND u.cdEmpresaConsultora IS NULL
      ORDER BY u.dsUsuario
    `);

    return NextResponse.json({ success: true, data: usuarios });
  } catch (error: any) {
    console.error('Error al obtener super usuarios:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/super-usuarios - Crear usuario super admin
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
    const { dsUsuario, dsClave, dsNombreCompleto, dsMail } = body;

    // Validar que el usuario no exista
    const existingUser = await query(`
      SELECT cdUsuario FROM TD_USUARIOS WHERE dsUsuario = @dsUsuario
    `, { dsUsuario });

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'El nombre de usuario ya existe' 
      }, { status: 400 });
    }

    // Encriptar contraseña
    const hashedPassword = await hashPassword(dsClave);

    // Crear usuario
    await query(`
      INSERT INTO TD_USUARIOS (
        dsUsuario,
        dsClave,
        dsNombreCompleto,
        dsMail,
        cdTipoUsuario,
        cdEmpresaConsultora,
        cdEstado,
        snClaveTemporal,
        snPrimerIngreso,
        feCreacion,
        cdUsuarioCreacion
      )
      VALUES (
        @dsUsuario,
        @dsClave,
        @dsNombreCompleto,
        @dsMail,
        1,
        NULL,
        1,
        1,
        1,
        GETDATE(),
        @cdUsuarioCreacion
      )
    `, {
      dsUsuario,
      dsClave: hashedPassword,
      dsNombreCompleto,
      dsMail,
      cdUsuarioCreacion: decoded.cdUsuario,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario super administrador creado correctamente' 
    });
  } catch (error: any) {
    console.error('Error al crear super usuario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
