import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/roles
 * Obtener lista de roles de una empresa consultora
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
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Si es super admin, puede ver todos los roles o de una empresa específica
    // Si es admin empresa, solo ve roles de su empresa
    const empresaId = decoded.cdTipoUsuario === 1
      ? (cdEmpresaConsultora ? parseInt(cdEmpresaConsultora) : null)
      : decoded.cdEmpresaConsultora;

    let roles;
    if (empresaId) {
      // Roles de una empresa específica + roles de sistema (excepto SuperAdministrador)
      roles = await query(
        `
        SELECT cdRol, dsRol, dsDescripcion, snSistema
        FROM TD_ROLES
        WHERE (cdEmpresaConsultora = @empresaId OR snSistema = 1)
          AND cdEstado = 1
          AND cdRol != 1
        ORDER BY dsRol
        `,
        { empresaId }
      );
    } else {
      // Solo roles de sistema (para super admin sin empresa específica)
      roles = await query(
        `
        SELECT cdRol, dsRol, dsDescripcion, snSistema
        FROM TD_ROLES
        WHERE snSistema = 1 AND cdEstado = 1
        ORDER BY dsRol
        `
      );
    }

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener roles' },
      { status: 500 }
    );
  }
}
