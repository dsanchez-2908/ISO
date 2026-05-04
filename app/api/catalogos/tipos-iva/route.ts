import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/catalogos/tipos-iva
 * Obtener catálogo de tipos de IVA
 */
export async function GET(request: NextRequest) {
  try {
    const tiposIva = await query(
      `
      SELECT 
        cdIVA,
        dsIVA,
        nuPorcentaje
      FROM TV_IVA
      WHERE snActivo = 1
      ORDER BY dsIVA
      `,
      {}
    );

    return NextResponse.json({
      success: true,
      data: tiposIva,
    });
  } catch (error) {
    console.error('Error al obtener tipos de IVA:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tipos de IVA' },
      { status: 500 }
    );
  }
}
