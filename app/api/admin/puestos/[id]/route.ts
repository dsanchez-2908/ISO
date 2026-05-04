import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/puestos/[id]
 * Obtener información de un puesto específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdPuesto = parseInt(id);

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
        p.*,
        e.dsEstado
      FROM TD_PUESTOS p
      LEFT JOIN TV_ESTADOS e ON p.cdEstado = e.cdEstado
      WHERE p.cdPuesto = @cdPuesto
      `,
      { cdPuesto }
    );

    if (puestos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Puesto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: puestos[0],
    });
  } catch (error) {
    console.error('Error al obtener puesto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener puesto' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/puestos/[id]
 * Actualizar puesto
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdPuesto = parseInt(id);
    const body = await request.json();
    const { dsPuesto, dsDescripcion, cdEstado } = body;

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

    // Actualizar puesto
    await query(
      `
      UPDATE TD_PUESTOS
      SET 
        dsPuesto = @dsPuesto,
        dsDescripcion = @dsDescripcion,
        cdEstado = @cdEstado,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdPuesto = @cdPuesto
      `,
      {
        cdPuesto,
        dsPuesto,
        dsDescripcion: dsDescripcion || null,
        cdEstado: cdEstado || 1,
        cdUsuarioModificacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Puesto actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar puesto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar puesto' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/puestos/[id]
 * Eliminar puesto (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdPuesto = parseInt(id);

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
      UPDATE TD_PUESTOS
      SET 
        cdEstado = 2,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdPuesto = @cdPuesto
      `,
      {
        cdPuesto,
        cdUsuarioModificacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Puesto eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar puesto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar puesto' },
      { status: 500 }
    );
  }
}
