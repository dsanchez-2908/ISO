import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/tipos-campo
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

    const tipos = await query(`
      SELECT 
        cdTipoCampo,
        dsTipoCampo,
        dsDescripcion
      FROM TV_TIPOS_CAMPO
      ORDER BY cdTipoCampo
    `);

    return NextResponse.json({ success: true, data: tipos });
  } catch (error: any) {
    console.error('Error al obtener tipos de campo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
