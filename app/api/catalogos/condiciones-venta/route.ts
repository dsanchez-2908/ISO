import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/catalogos/condiciones-venta
 * Obtener catálogo de condiciones de venta
 */
export async function GET(request: NextRequest) {
  try {
    const condiciones = await query(
      `
      SELECT 
        cdCondicionVenta,
        dsCondicionVenta,
        dsDescripcion,
        nuDias
      FROM TV_CONDICION_VENTA
      WHERE snActivo = 1
      ORDER BY nuDias
      `,
      {}
    );

    return NextResponse.json({
      success: true,
      data: condiciones,
    });
  } catch (error) {
    console.error('Error al obtener condiciones de venta:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener condiciones de venta' },
      { status: 500 }
    );
  }
}
