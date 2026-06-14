import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/normas
 * Obtener lista de normas de una empresa consultora
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
    if (!decoded || (decoded.cdTipoUsuario !== 1 && decoded.cdTipoUsuario !== 2)) {
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

    // Obtener normas con conteo de clientes asociados
    const normas = await query(
      `
      SELECT 
        n.cdNorma,
        n.cdCodigo,
        n.dsNombre,
        n.dsVersion,
        n.dsOrganismoEmisor,
        n.feVigenteDesde,
        n.dsDescripcion,
        n.cdEstado,
        e.dsEstado,
        n.feCreacion,
        n.feModificacion,
        n.cdNormaAnterior,
        na.dsNombre as dsNombreNormaAnterior,
        na.dsVersion as dsVersionNormaAnterior,
        (
          SELECT COUNT(*)
          FROM TR_CLIENTES_NORMAS cn
          WHERE cn.cdNorma = n.cdNorma AND cn.cdEstado = 1
        ) as nuClientesAsociados
      FROM TD_NORMAS n
      INNER JOIN TV_ESTADOS e ON n.cdEstado = e.cdEstado
      LEFT JOIN TD_NORMAS na ON n.cdNormaAnterior = na.cdNorma
      WHERE n.cdEmpresaConsultora = @empresaId
      ORDER BY n.cdCodigo, n.dsVersion DESC
      `,
      { empresaId }
    );

    return NextResponse.json({
      success: true,
      data: normas,
    });
  } catch (error) {
    console.error('Error al obtener normas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener normas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/normas
 * Crear nueva norma
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

    // Verificar que no exista la misma norma con la misma versión
    const normasExistentes = await query(
      `
      SELECT cdNorma 
      FROM TD_NORMAS
      WHERE cdEmpresaConsultora = @cdEmpresaConsultora
        AND cdCodigo = @cdCodigo
        AND dsVersion = @dsVersion
        AND cdEstado = 1
      `,
      { cdEmpresaConsultora, cdCodigo, dsVersion: dsVersion || '' }
    );

    if (normasExistentes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una norma con ese código y versión' },
        { status: 400 }
      );
    }

    // Insertar norma
    const result = await query(
      `
      INSERT INTO TD_NORMAS (
        cdEmpresaConsultora,
        cdCodigo,
        dsNombre,
        dsVersion,
        dsOrganismoEmisor,
        feVigenteDesde,
        dsDescripcion,
        cdNormaAnterior,
        cdEstado,
        feCreacion,
        cdUsuarioCreacion
      )
      VALUES (
        @cdEmpresaConsultora,
        @cdCodigo,
        @dsNombre,
        @dsVersion,
        @dsOrganismoEmisor,
        @feVigenteDesde,
        @dsDescripcion,
        @cdNormaAnterior,
        1,
        GETDATE(),
        @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() as cdNorma;
      `,
      {
        cdEmpresaConsultora,
        cdCodigo,
        dsNombre,
        dsVersion: dsVersion || null,
        dsOrganismoEmisor: dsOrganismoEmisor || null,
        feVigenteDesde: feVigenteDesde || null,
        dsDescripcion: dsDescripcion || null,
        cdNormaAnterior: cdNormaAnterior || null,
        cdUsuarioCreacion: decoded.cdUsuario,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        cdNorma: result[0].cdNorma,
      },
    });
  } catch (error) {
    console.error('Error al crear norma:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear norma' },
      { status: 500 }
    );
  }
}
