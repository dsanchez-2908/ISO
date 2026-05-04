import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/presupuestos?cdCliente=X
 * Obtener presupuestos de un cliente
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

    const presupuestos = await query(
      `
      SELECT 
        p.cdPresupuesto,
        p.cdEmpresaConsultora,
        p.cdCliente,
        p.fePresupuesto,
        p.dsDescripcion,
        p.dsPresupuesto,
        p.cdEstado,
        e.dsEstado,
        p.feCreacion,
        p.cdUsuarioCreacion
      FROM TD_PRESUPUESTOS p
      LEFT JOIN TV_ESTADOS e ON p.cdEstado = e.cdEstado
      WHERE p.cdCliente = @cdCliente
      ORDER BY p.fePresupuesto DESC
      `,
      { cdCliente: parseInt(cdCliente) }
    );

    return NextResponse.json({
      success: true,
      data: presupuestos,
    });
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener presupuestos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/presupuestos
 * Crear nuevo presupuesto
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cdEmpresaConsultora,
      cdCliente,
      fePresupuesto,
      dsDescripcion,
      dsPresupuesto,
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
    if (!cdEmpresaConsultora || !cdCliente || !fePresupuesto) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdEmpresaConsultora, cdCliente, fePresupuesto' },
        { status: 400 }
      );
    }

    // Insertar presupuesto
    await query(
      `
      INSERT INTO TD_PRESUPUESTOS (
        cdEmpresaConsultora,
        cdCliente,
        fePresupuesto,
        dsDescripcion,
        dsPresupuesto,
        cdEstado,
        feCreacion,
        cdUsuarioCreacion
      ) VALUES (
        @cdEmpresaConsultora,
        @cdCliente,
        @fePresupuesto,
        @dsDescripcion,
        @dsPresupuesto,
        1,
        GETDATE(),
        @cdUsuarioCreacion
      )
      `,
      {
        cdEmpresaConsultora: parseInt(cdEmpresaConsultora),
        cdCliente: parseInt(cdCliente),
        fePresupuesto,
        dsDescripcion: dsDescripcion || null,
        dsPresupuesto: dsPresupuesto || null,
        cdUsuarioCreacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Presupuesto creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear presupuesto' },
      { status: 500 }
    );
  }
}
