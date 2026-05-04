import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/catalogos/modalidades-trabajo
 * Obtener catálogo de modalidades de trabajo
 */
export async function GET(request: NextRequest) {
  try {
    const modalidades = await query(
      `
      SELECT 
        cdModalidadTrabajo,
        dsModalidadTrabajo,
        dsDescripcion
      FROM TV_MODALIDAD_TRABAJO
      WHERE snActivo = 1
      ORDER BY cdModalidadTrabajo
      `,
      {}
    );

    return NextResponse.json({
      success: true,
      data: modalidades,
    });
  } catch (error) {
    console.error('Error al obtener modalidades de trabajo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener modalidades de trabajo' },
      { status: 500 }
    );
  }
}
