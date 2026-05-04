import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/puestos?cdCliente=X
 * Obtener puestos de un cliente
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

    const puestos = await query(
      `
      SELECT 
        p.cdPuesto,
        p.cdEmpresaConsultora,
        p.cdCliente,
        p.dsPuesto,
        p.dsDescripcion,
        p.cdEstado,
        e.dsEstado,
        p.feCreacion,
        p.cdUsuarioCreacion
      FROM TD_PUESTOS p
      LEFT JOIN TV_ESTADOS e ON p.cdEstado = e.cdEstado
      WHERE p.cdCliente = @cdCliente
      ORDER BY p.dsPuesto
      `,
      { cdCliente: parseInt(cdCliente) }
    );

    return NextResponse.json({
      success: true,
      data: puestos,
    });
  } catch (error) {
    console.error('Error al obtener puestos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener puestos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/puestos
 * Crear nuevo puesto
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cdEmpresaConsultora,
      cdCliente,
      dsPuesto,
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
    if (!cdEmpresaConsultora || !cdCliente || !dsPuesto) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdEmpresaConsultora, cdCliente, dsPuesto' },
        { status: 400 }
      );
    }

    // Insertar puesto
    await query(
      `
      INSERT INTO TD_PUESTOS (
        cdEmpresaConsultora,
        cdCliente,
        dsPuesto,
        dsDescripcion,
        cdEstado,
        feCreacion,
        cdUsuarioCreacion
      ) VALUES (
        @cdEmpresaConsultora,
        @cdCliente,
        @dsPuesto,
        @dsDescripcion,
        1,
        GETDATE(),
        @cdUsuarioCreacion
      )
      `,
      {
        cdEmpresaConsultora: parseInt(cdEmpresaConsultora),
        cdCliente: parseInt(cdCliente),
        dsPuesto,
        dsDescripcion: dsDescripcion || null,
        cdUsuarioCreacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Puesto creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear puesto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear puesto' },
      { status: 500 }
    );
  }
}
