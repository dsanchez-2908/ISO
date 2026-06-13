import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/catalogos/estados?tipo=DOCUMENTO
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    // Obtener estados
    // Si se especifica tipo, filtrar por contexto (aunque por ahora no filtramos en BD)
    const estados = await query(`
      SELECT 
        cdEstado,
        dsEstado,
        dsDescripcion
      FROM TV_ESTADOS
      WHERE snActivo = 1
      ORDER BY cdEstado
    `);

    return NextResponse.json({ success: true, data: estados });
  } catch (error: any) {
    console.error('Error al obtener estados:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
