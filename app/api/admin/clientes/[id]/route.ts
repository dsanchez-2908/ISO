import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/clientes/[id]
 * Obtener información de un cliente específico
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

    // Obtener cliente
    const clientes = await query(
      `
      SELECT 
        c.*,
        e.dsEstado
      FROM TD_CLIENTES c
      INNER JOIN TV_ESTADOS e ON c.cdEstado = e.cdEstado
      WHERE c.cdCliente = @cdCliente
      `,
      { cdCliente }
    );

    if (clientes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Obtener normas asociadas
    const normas = await query(
      `
      SELECT 
        cn.cdClienteNorma,
        cn.cdNorma,
        n.cdCodigo,
        n.dsNombre,
        n.dsVersion,
        n.dsOrganismoEmisor,
        cn.cdEstado,
        e.dsEstado
      FROM TR_CLIENTES_NORMAS cn
      INNER JOIN TD_NORMAS n ON cn.cdNorma = n.cdNorma
      INNER JOIN TV_ESTADOS e ON cn.cdEstado = e.cdEstado
      WHERE cn.cdCliente = @cdCliente AND cn.cdEstado = 1
      ORDER BY n.cdCodigo, n.dsVersion DESC
      `,
      { cdCliente }
    );

    return NextResponse.json({
      success: true,
      data: {
        cliente: clientes[0],
        normas,
      },
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/clientes/[id]
 * Actualizar información de un cliente
 */
export async function PUT(
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
    const {
      cdCodigoInternoCliente,
      dsRazonSocial,
      dsCUIT,
      dsDomicilio,
      dsLocalidad,
      dsCodigoPostal,
      dsTelefono,
      dsMail,
      dsContacto1,
      dsMail1,
      dsCelular1,
      dsContacto2,
      dsMail2,
      dsCelular2,
      dsWeb,
      dsObservaciones,
      cdCondicionVenta,
      cdIVA,
      dsConstanciaInscripcion,
      dsLogo,
      feInicioActividades,
      dsASCESI,
      dsReferidoPor,
      dsNecesidadEspecifica,
      cdTipoServicio,
      cdModalidadTrabajo,
    } = body;

    // Validar campos requeridos
    if (!dsRazonSocial) {
      return NextResponse.json(
        { success: false, error: 'Razón social es requerida' },
        { status: 400 }
      );
    }

    // Actualizar cliente
    await query(
      `
      UPDATE TD_CLIENTES SET
        cdCodigoInternoCliente = @cdCodigoInternoCliente,
        dsRazonSocial = @dsRazonSocial,
        dsCUIT = @dsCUIT,
        dsDomicilio = @dsDomicilio,
        dsLocalidad = @dsLocalidad,
        dsCodigoPostal = @dsCodigoPostal,
        dsTelefono = @dsTelefono,
        dsMail = @dsMail,
        dsContacto1 = @dsContacto1,
        dsMail1 = @dsMail1,
        dsCelular1 = @dsCelular1,
        dsContacto2 = @dsContacto2,
        dsMail2 = @dsMail2,
        dsCelular2 = @dsCelular2,
        dsWeb = @dsWeb,
        dsObservaciones = @dsObservaciones,
        cdCondicionVenta = @cdCondicionVenta,
        cdIVA = @cdIVA,
        dsConstanciaInscripcion = @dsConstanciaInscripcion,
        dsLogo = @dsLogo,
        feInicioActividades = @feInicioActividades,
        dsASCESI = @dsASCESI,
        dsReferidoPor = @dsReferidoPor,
        dsNecesidadEspecifica = @dsNecesidadEspecifica,
        cdTipoServicio = @cdTipoServicio,
        cdModalidadTrabajo = @cdModalidadTrabajo,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdCliente = @cdCliente
      `,
      {
        cdCliente,
        cdCodigoInternoCliente: cdCodigoInternoCliente || null,
        dsRazonSocial,
        dsCUIT: dsCUIT || null,
        dsDomicilio: dsDomicilio || null,
        dsLocalidad: dsLocalidad || null,
        dsCodigoPostal: dsCodigoPostal || null,
        dsTelefono: dsTelefono || null,
        dsMail: dsMail || null,
        dsContacto1: dsContacto1 || null,
        dsMail1: dsMail1 || null,
        dsCelular1: dsCelular1 || null,
        dsContacto2: dsContacto2 || null,
        dsMail2: dsMail2 || null,
        dsCelular2: dsCelular2 || null,
        dsWeb: dsWeb || null,
        dsObservaciones: dsObservaciones || null,
        cdCondicionVenta: cdCondicionVenta || null,
        cdIVA: cdIVA || null,
        dsConstanciaInscripcion: dsConstanciaInscripcion || null,
        dsLogo: dsLogo || null,
        feInicioActividades: feInicioActividades || null,
        dsASCESI: dsASCESI || null,
        dsReferidoPor: dsReferidoPor || null,
        dsNecesidadEspecifica: dsNecesidadEspecifica || null,
        cdTipoServicio: cdTipoServicio || null,
        cdModalidadTrabajo: cdModalidadTrabajo || null,
        cdUsuarioModificacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clientes/[id]
 * Desactivar cliente (soft delete)
 */
export async function DELETE(
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

    // Desactivar cliente
    await query(
      `
      UPDATE TD_CLIENTES SET
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

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error al desactivar cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar cliente' },
      { status: 500 }
    );
  }
}
