import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/sectores/[id]
 * Obtener información de un sector específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdSector = parseInt(id);

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
        s.*,
        e.dsEstado
      FROM TD_SECTORES s
      LEFT JOIN TV_ESTADOS e ON s.cdEstado = e.cdEstado
      WHERE s.cdSector = @cdSector
      `,
      { cdSector }
    );

    if (sectores.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sector no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sectores[0],
    });
  } catch (error) {
    console.error('Error al obtener sector:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener sector' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sectores/[id]
 * Actualizar sector
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdSector = parseInt(id);
    const body = await request.json();
    const { dsSector, dsDescripcion, cdEstado } = body;

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

    // Actualizar sector
    await query(
      `
      UPDATE TD_SECTORES
      SET 
        dsSector = @dsSector,
        dsDescripcion = @dsDescripcion,
        cdEstado = @cdEstado,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdSector = @cdSector
      `,
      {
        cdSector,
        dsSector,
        dsDescripcion: dsDescripcion || null,
        cdEstado: cdEstado || 1,
        cdUsuarioModificacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Sector actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar sector:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar sector' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sectores/[id]
 * Eliminar sector (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdSector = parseInt(id);

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
      UPDATE TD_SECTORES
      SET 
        cdEstado = 2,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdSector = @cdSector
      `,
      {
        cdSector,
        cdUsuarioModificacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Sector eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar sector:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar sector' },
      { status: 500 }
    );
  }
}
