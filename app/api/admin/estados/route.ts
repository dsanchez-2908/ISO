import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/estados
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

    const estados = await query(`
      SELECT 
        cdEstado,
        dsEstado,
        dsDescripcion
      FROM TV_ESTADOS
      ORDER BY cdEstado
    `);

    return NextResponse.json({ success: true, data: estados });
  } catch (error: any) {
    console.error('Error al obtener estados:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
