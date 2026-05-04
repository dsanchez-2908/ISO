import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/admin/clientes/[id]/normas
 * Asociar/desasociar normas a un cliente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdCliente = parseInt(id);

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
    const { normasIds } = body; // Array de cdNorma

    if (!Array.isArray(normasIds)) {
      return NextResponse.json(
        { success: false, error: 'normasIds debe ser un array' },
        { status: 400 }
      );
    }

    // Desactivar todas las asociaciones actuales
    await query(
      `
      UPDATE TR_CLIENTES_NORMAS SET
        cdEstado = 0,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdCliente = @cdCliente
      `,
      {
        cdCliente,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    // Insertar o reactivar las nuevas asociaciones
    for (const cdNorma of normasIds) {
      // Verificar si ya existe la asociación
      const existing = await query(
        `
        SELECT cdClienteNorma, cdEstado
        FROM TR_CLIENTES_NORMAS
        WHERE cdCliente = @cdCliente AND cdNorma = @cdNorma
        `,
        { cdCliente, cdNorma }
      );

      if (existing.length > 0) {
        // Reactivar asociación existente
        await query(
          `
          UPDATE TR_CLIENTES_NORMAS SET
            cdEstado = 1,
            feModificacion = GETDATE(),
            cdUsuarioModificacion = @cdUsuarioModificacion
          WHERE cdCliente = @cdCliente AND cdNorma = @cdNorma
          `,
          {
            cdCliente,
            cdNorma,
            cdUsuarioModificacion: decoded.cdUsuario,
          }
        );
      } else {
        // Crear nueva asociación
        await query(
          `
          INSERT INTO TR_CLIENTES_NORMAS (
            cdCliente,
            cdNorma,
            cdEstado,
            feCreacion,
            cdUsuarioCreacion
          ) VALUES (
            @cdCliente,
            @cdNorma,
            1,
            GETDATE(),
            @cdUsuarioCreacion
          )
          `,
          {
            cdCliente,
            cdNorma,
            cdUsuarioCreacion: decoded.cdUsuario,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Normas asociadas exitosamente',
    });
  } catch (error) {
    console.error('Error al asociar normas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al asociar normas' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/clientes/[id]/normas
 * Obtener normas disponibles y asociadas al cliente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdCliente = parseInt(id);

    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener empresa del cliente
    const clienteData = await query(
      `SELECT cdEmpresaConsultora FROM TD_CLIENTES WHERE cdCliente = @cdCliente`,
      { cdCliente }
    );

    if (clienteData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const cdEmpresaConsultora = clienteData[0].cdEmpresaConsultora;

    // Obtener todas las normas de la empresa con indicador de asociación
    const normas = await query(
      `
      SELECT 
        n.cdNorma,
        n.cdCodigo,
        n.dsNombre,
        n.dsVersion,
        n.dsOrganismoEmisor,
        n.cdEstado,
        e.dsEstado,
        CASE WHEN cn.cdClienteNorma IS NOT NULL AND cn.cdEstado = 1 THEN 1 ELSE 0 END AS snAsociada
      FROM TD_NORMAS n
      INNER JOIN TV_ESTADOS e ON n.cdEstado = e.cdEstado
      LEFT JOIN TR_CLIENTES_NORMAS cn ON n.cdNorma = cn.cdNorma AND cn.cdCliente = @cdCliente AND cn.cdEstado = 1
      WHERE n.cdEmpresaConsultora = @cdEmpresaConsultora AND n.cdEstado = 1
      ORDER BY n.cdCodigo, n.dsVersion DESC
      `,
      {
        cdCliente,
        cdEmpresaConsultora,
      }
    );

    return NextResponse.json({
      success: true,
      data: normas,
    });
  } catch (error) {
    console.error('Error al obtener normas del cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener normas' },
      { status: 500 }
    );
  }
}
