import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/presupuestos/[id]
 * Obtener información de un presupuesto específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdPresupuesto = parseInt(id);

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
        p.*,
        e.dsEstado
      FROM TD_PRESUPUESTOS p
      LEFT JOIN TV_ESTADOS e ON p.cdEstado = e.cdEstado
      WHERE p.cdPresupuesto = @cdPresupuesto
      `,
      { cdPresupuesto }
    );

    if (presupuestos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: presupuestos[0],
    });
  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener presupuesto' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/presupuestos/[id]
 * Actualizar presupuesto
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdPresupuesto = parseInt(id);
    const body = await request.json();
    const { fePresupuesto, dsDescripcion, dsPresupuesto, cdEstado } = body;

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

    // Actualizar presupuesto
    await query(
      `
      UPDATE TD_PRESUPUESTOS
      SET 
        fePresupuesto = @fePresupuesto,
        dsDescripcion = @dsDescripcion,
        dsPresupuesto = @dsPresupuesto,
        cdEstado = @cdEstado,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdPresupuesto = @cdPresupuesto
      `,
      {
        cdPresupuesto,
        fePresupuesto,
        dsDescripcion: dsDescripcion || null,
        dsPresupuesto: dsPresupuesto || null,
        cdEstado: cdEstado || 1,
        cdUsuarioModificacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Presupuesto actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar presupuesto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar presupuesto' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/presupuestos/[id]
 * Eliminar presupuesto (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdPresupuesto = parseInt(id);

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

    // Soft delete - cambiar estado a inactivo (cdEstado = 2)
    await query(
      `
      UPDATE TD_PRESUPUESTOS
      SET 
        cdEstado = 2,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdPresupuesto = @cdPresupuesto
      `,
      {
        cdPresupuesto,
        cdUsuarioModificacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Presupuesto eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar presupuesto' },
      { status: 500 }
    );
  }
}
