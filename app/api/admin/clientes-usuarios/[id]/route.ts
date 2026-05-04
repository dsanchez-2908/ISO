import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/clientes-usuarios/[id]
 * Obtener información de un usuario de cliente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdClienteUsuario = parseInt(id);

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

    const usuarios = await query(
      `
      SELECT 
        cu.*,
        e.dsEstado,
        p.dsPuesto,
        ec.dsEstadoCivil
      FROM TD_CLIENTES_USUARIOS cu
      LEFT JOIN TV_ESTADOS e ON cu.cdEstado = e.cdEstado
      LEFT JOIN TD_PUESTOS p ON cu.cdPuesto = p.cdPuesto
      LEFT JOIN TV_ESTADO_CIVIL ec ON cu.cdEstadoCivil = ec.cdEstadoCivil
      WHERE cu.cdClienteUsuario = @cdClienteUsuario
      `,
      { cdClienteUsuario }
    );

    if (usuarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario de cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: usuarios[0],
    });
  } catch (error) {
    console.error('Error al obtener usuario de cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuario de cliente' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/clientes-usuarios/[id]
 * Actualizar usuario de cliente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdClienteUsuario = parseInt(id);
    const body = await request.json();
    const {
      dsApellidoNombre,
      cdPuesto,
      feNacimiento,
      dsCUIT,
      dsDNI,
      cdNacionalidad,
      dsCelularParticular,
      dsPersonaContacto,
      dsCelularContacto,
      dsDomicilioCalle,
      dsDomicilioEntreCalles,
      dsDomicilioNumero,
      dsDomicilioPiso,
      dsDomicilioDepartamento,
      cdDomicilioPais,
      cdDomicilioProvincia,
      dsDomicilioLocalidad,
      dsDomicilioCodigoPostal,
      dsObservaciones,
      dsImagenFirma,
      dsImagenUsuario,
      cdEstadoCivil,
      dsCV,
      dsSindicato,
      dsObraSocial,
      dsCBU,
      dsBanco,
      dsNumeroCuenta,
      dsPeriodoPrueba,
      feInicio,
      feCierre,
      dsResultado,
      dsCategoriaLaboral,
      nuSueldoIngreso,
      nuSueldoActual,
      feIngreso,
      dsActaMatrimonioConcubinato,
      dsEstudiosCursados,
      dsCertificadoAnalitico,
      dsFotocopiaDNI,
      dsServicio,
      dsExamenMedico,
      dsObservacionesGenerales,
      feBaja,
      dsMotivoDesvinculacion,
      cdEstado,
    } = body;

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

    // Actualizar usuario de cliente
    await query(
      `
      UPDATE TD_CLIENTES_USUARIOS
      SET 
        dsApellidoNombre = @dsApellidoNombre,
        cdPuesto = @cdPuesto,
        feNacimiento = @feNacimiento,
        dsCUIT = @dsCUIT,
        dsDNI = @dsDNI,
        cdNacionalidad = @cdNacionalidad,
        dsCelularParticular = @dsCelularParticular,
        dsPersonaContacto = @dsPersonaContacto,
        dsCelularContacto = @dsCelularContacto,
        dsDomicilioCalle = @dsDomicilioCalle,
        dsDomicilioEntreCalles = @dsDomicilioEntreCalles,
        dsDomicilioNumero = @dsDomicilioNumero,
        dsDomicilioPiso = @dsDomicilioPiso,
        dsDomicilioDepartamento = @dsDomicilioDepartamento,
        cdDomicilioPais = @cdDomicilioPais,
        cdDomicilioProvincia = @cdDomicilioProvincia,
        dsDomicilioLocalidad = @dsDomicilioLocalidad,
        dsDomicilioCodigoPostal = @dsDomicilioCodigoPostal,
        dsObservaciones = @dsObservaciones,
        dsImagenFirma = @dsImagenFirma,
        dsImagenUsuario = @dsImagenUsuario,
        cdEstadoCivil = @cdEstadoCivil,
        dsCV = @dsCV,
        dsSindicato = @dsSindicato,
        dsObraSocial = @dsObraSocial,
        dsCBU = @dsCBU,
        dsBanco = @dsBanco,
        dsNumeroCuenta = @dsNumeroCuenta,
        dsPeriodoPrueba = @dsPeriodoPrueba,
        feInicio = @feInicio,
        feCierre = @feCierre,
        dsResultado = @dsResultado,
        dsCategoriaLaboral = @dsCategoriaLaboral,
        nuSueldoIngreso = @nuSueldoIngreso,
        nuSueldoActual = @nuSueldoActual,
        feIngreso = @feIngreso,
        dsActaMatrimonioConcubinato = @dsActaMatrimonioConcubinato,
        dsEstudiosCursados = @dsEstudiosCursados,
        dsCertificadoAnalitico = @dsCertificadoAnalitico,
        dsFotocopiaDNI = @dsFotocopiaDNI,
        dsServicio = @dsServicio,
        dsExamenMedico = @dsExamenMedico,
        dsObservacionesGenerales = @dsObservacionesGenerales,
        feBaja = @feBaja,
        dsMotivoDesvinculacion = @dsMotivoDesvinculacion,
        cdEstado = @cdEstado,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdClienteUsuario = @cdClienteUsuario
      `,
      {
        cdClienteUsuario,
        dsApellidoNombre,
        cdPuesto: cdPuesto ? parseInt(cdPuesto) : null,
        feNacimiento: feNacimiento || null,
        dsCUIT: dsCUIT || null,
        dsDNI: dsDNI || null,
        cdNacionalidad: cdNacionalidad ? parseInt(cdNacionalidad) : null,
        dsCelularParticular: dsCelularParticular || null,
        dsPersonaContacto: dsPersonaContacto || null,
        dsCelularContacto: dsCelularContacto || null,
        dsDomicilioCalle: dsDomicilioCalle || null,
        dsDomicilioEntreCalles: dsDomicilioEntreCalles || null,
        dsDomicilioNumero: dsDomicilioNumero || null,
        dsDomicilioPiso: dsDomicilioPiso || null,
        dsDomicilioDepartamento: dsDomicilioDepartamento || null,
        cdDomicilioPais: cdDomicilioPais ? parseInt(cdDomicilioPais) : null,
        cdDomicilioProvincia: cdDomicilioProvincia ? parseInt(cdDomicilioProvincia) : null,
        dsDomicilioLocalidad: dsDomicilioLocalidad || null,
        dsDomicilioCodigoPostal: dsDomicilioCodigoPostal || null,
        dsObservaciones: dsObservaciones || null,
        dsImagenFirma: dsImagenFirma || null,
        dsImagenUsuario: dsImagenUsuario || null,
        cdEstadoCivil: cdEstadoCivil ? parseInt(cdEstadoCivil) : null,
        dsCV: dsCV || null,
        dsSindicato: dsSindicato || null,
        dsObraSocial: dsObraSocial || null,
        dsCBU: dsCBU || null,
        dsBanco: dsBanco || null,
        dsNumeroCuenta: dsNumeroCuenta || null,
        dsPeriodoPrueba: dsPeriodoPrueba || null,
        feInicio: feInicio || null,
        feCierre: feCierre || null,
        dsResultado: dsResultado || null,
        dsCategoriaLaboral: dsCategoriaLaboral || null,
        nuSueldoIngreso: nuSueldoIngreso ? parseFloat(nuSueldoIngreso) : null,
        nuSueldoActual: nuSueldoActual ? parseFloat(nuSueldoActual) : null,
        feIngreso: feIngreso || null,
        dsActaMatrimonioConcubinato: dsActaMatrimonioConcubinato || null,
        dsEstudiosCursados: dsEstudiosCursados || null,
        dsCertificadoAnalitico: dsCertificadoAnalitico || null,
        dsFotocopiaDNI: dsFotocopiaDNI || null,
        dsServicio: dsServicio || null,
        dsExamenMedico: dsExamenMedico || null,
        dsObservacionesGenerales: dsObservacionesGenerales || null,
        feBaja: feBaja || null,
        dsMotivoDesvinculacion: dsMotivoDesvinculacion || null,
        cdEstado: cdEstado || 1,
        cdUsuarioModificacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Usuario de cliente actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar usuario de cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar usuario de cliente' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clientes-usuarios/[id]
 * Eliminar usuario de cliente (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdClienteUsuario = parseInt(id);

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

    // Soft delete - cambiar estado a inactivo (cdEstado = 2)
    await query(
      `
      UPDATE TD_CLIENTES_USUARIOS
      SET 
        cdEstado = 2,
        feModificacion = GETDATE(),
        cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdClienteUsuario = @cdClienteUsuario
      `,
      {
        cdClienteUsuario,
        cdUsuarioModificacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Usuario de cliente eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar usuario de cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar usuario de cliente' },
      { status: 500 }
    );
  }
}
