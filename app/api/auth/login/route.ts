import { NextRequest, NextResponse } from 'next/server';
import { authenticate, generateToken } from '@/lib/auth';
import { LoginCredentials } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    
    const { dsUsuario, dsClave, cdEmpresaConsultora } = body;

    // Validar campos requeridos
    if (!dsUsuario || !dsClave) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Autenticar usuario
    const user = await authenticate({
      dsUsuario,
      dsClave,
      cdEmpresaConsultora,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token
    const token = generateToken(user);

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user,
        token,
      },
    });

    // Establecer cookie con el token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
