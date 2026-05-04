import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/clientes
 * Obtener lista de clientes de una empresa consultora
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cdEmpresaConsultora = searchParams.get('cdEmpresaConsultora');

    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2 && decoded.cdTipoUsuario !== 3)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Determinar empresa
    const empresaId = decoded.cdTipoUsuario === 1
      ? (cdEmpresaConsultora ? parseInt(cdEmpresaConsultora) : null)
      : decoded.cdEmpresaConsultora;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar una empresa' },
        { status: 400 }
      );
    }

    // Obtener clientes con conteo de normas asociadas
    const clientes = await query(
      `
      SELECT 
        c.cdCliente,
        c.cdCodigoInternoCliente,
        c.dsRazonSocial,
        c.dsCUIT,
        c.dsDomicilio,
        c.dsLocalidad,
        c.dsCodigoPostal,
        c.dsTelefono,
        c.dsMail,
        c.dsContacto1,
        c.dsMail1,
        c.dsCelular1,
        c.dsWeb,
        c.cdEstado,
        e.dsEstado,
        c.feCreacion,
        c.feModificacion,
        (
          SELECT COUNT(*)
          FROM TR_CLIENTES_NORMAS cn
          WHERE cn.cdCliente = c.cdCliente AND cn.cdEstado = 1
        ) as nuNormasAsociadas,
        (
          SELECT COUNT(*)
          FROM TD_USUARIOS u
          WHERE u.cdCliente = c.cdCliente AND u.cdEstado = 1
        ) as nuUsuarios
      FROM TD_CLIENTES c
      INNER JOIN TV_ESTADOS e ON c.cdEstado = e.cdEstado
      WHERE c.cdEmpresaConsultora = @empresaId
      ORDER BY c.dsRazonSocial
      `,
      { empresaId }
    );

    return NextResponse.json({
      success: true,
      data: clientes,
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/clientes
 * Crear nuevo cliente
 */
export async function POST(request: NextRequest) {
  try {
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
      cdEmpresaConsultora,
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
    if (!cdEmpresaConsultora || !dsRazonSocial) {
      return NextResponse.json(
        { success: false, error: 'Razón social es requerida' },
        { status: 400 }
      );
    }

    // Validar que el usuario pertenezca a la empresa (si no es super admin)
    if (decoded.cdTipoUsuario !== 1 && decoded.cdEmpresaConsultora !== cdEmpresaConsultora) {
      return NextResponse.json(
        { success: false, error: 'No puede crear clientes para otra empresa' },
        { status: 403 }
      );
    }

    // Insertar cliente
    const result = await query(
      `
      INSERT INTO TD_CLIENTES (
        cdEmpresaConsultora,
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
        cdEstado,
        feCreacion,
        cdUsuarioCreacion
      ) VALUES (
        @cdEmpresaConsultora,
        @cdCodigoInternoCliente,
        @dsRazonSocial,
        @dsCUIT,
        @dsDomicilio,
        @dsLocalidad,
        @dsCodigoPostal,
        @dsTelefono,
        @dsMail,
        @dsContacto1,
        @dsMail1,
        @dsCelular1,
        @dsContacto2,
        @dsMail2,
        @dsCelular2,
        @dsWeb,
        @dsObservaciones,
        @cdCondicionVenta,
        @cdIVA,
        @dsConstanciaInscripcion,
        @dsLogo,
        @feInicioActividades,
        @dsASCESI,
        @dsReferidoPor,
        @dsNecesidadEspecifica,
        @cdTipoServicio,
        @cdModalidadTrabajo,
        1,
        GETDATE(),
        @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() as cdCliente;
      `,
      {
        cdEmpresaConsultora,
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
        cdUsuarioCreacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
      data: { cdCliente: result[0].cdCliente },
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
