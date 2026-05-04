import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/sectores?cdCliente=X
 * Obtener sectores de un cliente
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cdCliente = searchParams.get('cdCliente');

    if (!cdCliente) {
      return NextResponse.json(
        { success: false, error: 'cdCliente es requerido' },
        { status: 400 }
      );
    }

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

    const sectores = await query(
      `
      SELECT 
        s.cdSector,
        s.cdEmpresaConsultora,
        s.cdCliente,
        s.dsSector,
        s.dsDescripcion,
        s.cdEstado,
        e.dsEstado,
        s.feCreacion,
        s.cdUsuarioCreacion
      FROM TD_SECTORES s
      LEFT JOIN TV_ESTADOS e ON s.cdEstado = e.cdEstado
      WHERE s.cdCliente = @cdCliente
      ORDER BY s.dsSector
      `,
      { cdCliente: parseInt(cdCliente) }
    );

    return NextResponse.json({
      success: true,
      data: sectores,
    });
  } catch (error) {
    console.error('Error al obtener sectores:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener sectores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sectores
 * Crear nuevo sector
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cdEmpresaConsultora,
      cdCliente,
      dsSector,
      dsDescripcion,
    } = body;

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

    // Validaciones
    if (!cdEmpresaConsultora || !cdCliente || !dsSector) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdEmpresaConsultora, cdCliente, dsSector' },
        { status: 400 }
      );
    }

    // Insertar sector
    await query(
      `
      INSERT INTO TD_SECTORES (
        cdEmpresaConsultora,
        cdCliente,
        dsSector,
        dsDescripcion,
        cdEstado,
        feCreacion,
        cdUsuarioCreacion
      ) VALUES (
        @cdEmpresaConsultora,
        @cdCliente,
        @dsSector,
        @dsDescripcion,
        1,
        GETDATE(),
        @cdUsuarioCreacion
      )
      `,
      {
        cdEmpresaConsultora: parseInt(cdEmpresaConsultora),
        cdCliente: parseInt(cdCliente),
        dsSector,
        dsDescripcion: dsDescripcion || null,
        cdUsuarioCreacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Sector creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear sector:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear sector' },
      { status: 500 }
    );
  }
}
