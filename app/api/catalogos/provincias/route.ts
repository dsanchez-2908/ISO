import { NextResponse } from 'next/server';
import sql from 'mssql';
import { sqlConfig } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cdPais = searchParams.get('cdPais');

    const pool = await sql.connect(sqlConfig);
    
    let query = `
      SELECT 
        cdProvincia,
        cdPais,
        dsProvincia,
        dsCodigo,
        nuOrden
      FROM TV_PROVINCIAS
      WHERE snActivo = 1
    `;

    // Filtrar por país si se especifica
    if (cdPais) {
      query += ` AND cdPais = @cdPais`;
    }

    query += ` ORDER BY nuOrden, dsProvincia`;

    const sqlRequest = pool.request();
    if (cdPais) {
      sqlRequest.input('cdPais', sql.Int, parseInt(cdPais));
    }

    const result = await sqlRequest.query(query);

    return NextResponse.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Error al obtener provincias:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener provincias';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
