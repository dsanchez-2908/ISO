import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/normas/[id]
 * Obtener detalle de una norma
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdNorma = parseInt(id);

    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener norma
    const normas = await query(
      `
      SELECT 
        n.*,
        e.dsEstado
      FROM TD_NORMAS n
      INNER JOIN TV_ESTADOS e ON n.cdEstado = e.cdEstado
      WHERE n.cdNorma = @cdNorma
      `,
      { cdNorma }
    );

    if (normas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Norma no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: normas[0],
    });
  } catch (error) {
    console.error('Error al obtener norma:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener norma' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/normas/[id]
 * Actualizar norma
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdNorma = parseInt(id);

    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      cdCodigo,
      dsNombre,
      dsVersion,
      dsOrganismoEmisor,
      feVigenteDesde,
      dsDescripcion,
      cdNormaAnterior,
    } = body;

    // Validar campos requeridos
    if (!cdCodigo || !dsNombre) {
      return NextResponse.json(
        { success: false, error: 'Código y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que no exista otra norma con el mismo código y versión
    const normasExistentes = await query(
      `
      SELECT cdNorma 
      FROM TD_NORMAS
      WHERE cdNorma != @cdNorma
        AND cdCodigo = @cdCodigo
        AND dsVersion = @dsVersion
        AND cdEstado = 1
      `,
      { cdNorma, cdCodigo, dsVersion: dsVersion || '' }
    );

    if (normasExistentes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe otra norma con ese código y versión' },
        { status: 400 }
      );
    }

    // Actualizar norma
    await query(
      `
      UPDATE TD_NORMAS SET
        cdCodigo = @cdCodigo,
        dsNombre = @dsNombre,
        dsVersion = @dsVersion,
        dsOrganismoEmisor = @dsOrganismoEmisor,
        feVigenteDesde = @feVigenteDesde,
        dsDescripcion = @dsDescripcion,
        cdNormaAnterior = @cdNormaAnterior,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdNorma = @cdNorma
      `,
      {
        cdNorma,
        cdCodigo,
        dsNombre,
        dsVersion: dsVersion || null,
        dsOrganismoEmisor: dsOrganismoEmisor || null,
        feVigenteDesde: feVigenteDesde || null,
        dsDescripcion: dsDescripcion || null,
        cdNormaAnterior: cdNormaAnterior || null,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error al actualizar norma:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar norma' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/normas/[id]
 * Desactivar norma
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdNorma = parseInt(id);

    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar si la norma está en uso por algún cliente
    const clientesConNorma = await query(
      `
      SELECT COUNT(*) as total
      FROM TR_CLIENTES_NORMAS
      WHERE cdNorma = @cdNorma AND cdEstado = 1
      `,
      { cdNorma }
    );

    if (clientesConNorma[0].total > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede desactivar. La norma está asociada a clientes.' },
        { status: 400 }
      );
    }

    // Desactivar norma (cambiar a estado Inactivo)
    await query(
      `
      UPDATE TD_NORMAS SET
        cdEstado = 2,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdNorma = @cdNorma
      `,
      {
        cdNorma,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error al desactivar norma:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar norma' },
      { status: 500 }
    );
  }
}
