import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/catalogos/tipos-servicios
 * Obtener catálogo de tipos de servicios
 */
export async function GET(request: NextRequest) {
  try {
    const tiposServicios = await query(
      `
      SELECT 
        cdTipoServicio,
        dsTipoServicio
      FROM TV_TIPOS_SERVICIOS
      WHERE snActivo = 1
      ORDER BY dsTipoServicio
      `,
      {}
    );

    return NextResponse.json({
      success: true,
      data: tiposServicios,
    });
  } catch (error) {
    console.error('Error al obtener tipos de servicios:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de servicios' },
      { status: 500 }
    );
  }
}
