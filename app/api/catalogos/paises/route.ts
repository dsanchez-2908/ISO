import { NextResponse } from 'next/server';
import sql from 'mssql';
import { sqlConfig } from '@/lib/db';

export async function GET() {
  try {
    const pool = await sql.connect(sqlConfig);
    
    const result = await pool.request().query(`
      SELECT 
        cdPais,
        dsPais,
        dsCodigoISO2,
        dsCodigoISO3,
        nuOrden
      FROM TV_PAISES
      WHERE snActivo = 1
      ORDER BY nuOrden, dsPais
    `);

    return NextResponse.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error al obtener países:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener países';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
