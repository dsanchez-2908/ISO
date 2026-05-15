import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/listas?cdNorma=X o ?cdCliente=Y
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
    const cdNorma = searchParams.get('cdNorma');
    const cdCliente = searchParams.get('cdCliente');
    const soloActivos = searchParams.get('soloActivos'); // Filtrar solo listas activas (cdEstado = 1)

    if (!cdNorma && !cdCliente) {
      return NextResponse.json({ success: false, error: 'cdNorma o cdCliente es requerido' }, { status: 400 });
    }

    let listas;
    if (cdNorma) {
      listas = await query(`
        SELECT 
          l.cdLista,
          l.cdEmpresaConsultora,
          l.cdNorma,
          l.cdCliente,
          l.dsNombreLista,
          l.dsDescripcion,
          l.dsTipo,
          l.cdEstado,
          e.dsEstado,
          l.feCreacion,
          l.cdUsuarioCreacion,
          (SELECT COUNT(*) FROM TD_LISTAS_ITEMS WHERE cdLista = l.cdLista AND snActivo = 1) as nuItems
        FROM TD_LISTAS l
        LEFT JOIN TV_ESTADOS e ON l.cdEstado = e.cdEstado
        WHERE l.cdNorma = @cdNorma
        ${soloActivos === '1' ? 'AND l.cdEstado = 1' : ''}
        ORDER BY l.dsNombreLista
      `, { cdNorma: parseInt(cdNorma) });
    } else {
      listas = await query(`
        SELECT 
          l.cdLista,
          l.cdEmpresaConsultora,
          l.cdNorma,
          l.cdCliente,
          l.dsNombreLista,
          l.dsDescripcion,
          l.dsTipo,
          l.cdEstado,
          e.dsEstado,
          l.feCreacion,
          l.cdUsuarioCreacion,
          (SELECT COUNT(*) FROM TD_LISTAS_ITEMS WHERE cdLista = l.cdLista AND snActivo = 1) as nuItems
        FROM TD_LISTAS l
        LEFT JOIN TV_ESTADOS e ON l.cdEstado = e.cdEstado
        WHERE l.cdCliente = @cdCliente
        ${soloActivos === '1' ? 'AND l.cdEstado = 1' : ''}
        ORDER BY l.dsNombreLista
      `, { cdCliente: parseInt(cdCliente!) });
    }

    return NextResponse.json({ success: true, data: listas });
  } catch (error: any) {
    console.error('Error al obtener listas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/listas
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { cdNorma, cdCliente, cdEmpresaConsultora, dsNombreLista, dsDescripcion } = body;

    // Validar campos requeridos
    if ((!cdNorma && !cdCliente) || !cdEmpresaConsultora || !dsNombreLista) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: (cdNorma o cdCliente), cdEmpresaConsultora y dsNombreLista' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO TD_LISTAS (
        cdEmpresaConsultora, cdNorma, cdCliente, dsNombreLista, dsDescripcion,
        dsTipo, cdEstado, feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdEmpresaConsultora, @cdNorma, @cdCliente, @dsNombreLista, @dsDescripcion,
        'CUSTOM', 1, GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() AS cdLista;
    `, {
      cdEmpresaConsultora: parseInt(cdEmpresaConsultora),
      cdNorma: cdNorma ? parseInt(cdNorma) : null,
      cdCliente: cdCliente ? parseInt(cdCliente) : null,
      dsNombreLista,
      dsDescripcion: dsDescripcion || null,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    return NextResponse.json({ 
      success: true, 
      data: { cdLista: result[0]?.cdLista } 
    });
  } catch (error: any) {
    console.error('Error al crear lista:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
