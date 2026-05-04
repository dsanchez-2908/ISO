import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/clientes-usuarios?cdCliente=X
 * Obtener usuarios/empleados de un cliente
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cdCliente = searchParams.get('cdCliente');

    if (!cdCliente) {
      return NextResponse.json(
        { success: false, error: 'cdCliente es requerido' },
        { status: 400 }
      );
    }

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
      WHERE cu.cdCliente = @cdCliente
      ORDER BY cu.dsApellidoNombre
      `,
      { cdCliente: parseInt(cdCliente) }
    );

    return NextResponse.json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    console.error('Error al obtener usuarios de cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener usuarios de cliente' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/clientes-usuarios
 * Crear nuevo usuario/empleado de cliente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cdEmpresaConsultora,
      cdCliente,
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

    // Validaciones
    if (!cdEmpresaConsultora || !cdCliente || !dsApellidoNombre) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdEmpresaConsultora, cdCliente, dsApellidoNombre' },
        { status: 400 }
      );
    }

    // Insertar usuario de cliente
    await query(
      `
      INSERT INTO TD_CLIENTES_USUARIOS (
        cdEmpresaConsultora, cdCliente, dsApellidoNombre, cdPuesto, feNacimiento,
        dsCUIT, dsDNI, cdNacionalidad, dsCelularParticular, dsPersonaContacto,
        dsCelularContacto, dsDomicilioCalle, dsDomicilioEntreCalles, dsDomicilioNumero,
        dsDomicilioPiso, dsDomicilioDepartamento, cdDomicilioPais, cdDomicilioProvincia,
        dsDomicilioLocalidad, dsDomicilioCodigoPostal, dsObservaciones, dsImagenFirma,
        dsImagenUsuario, cdEstadoCivil, dsCV, dsSindicato, dsObraSocial, dsCBU,
        dsBanco, dsNumeroCuenta, dsPeriodoPrueba, feInicio, feCierre, dsResultado,
        dsCategoriaLaboral, nuSueldoIngreso, nuSueldoActual, feIngreso,
        dsActaMatrimonioConcubinato, dsEstudiosCursados, dsCertificadoAnalitico,
        dsFotocopiaDNI, dsServicio, dsExamenMedico, dsObservacionesGenerales,
        feBaja, dsMotivoDesvinculacion, cdEstado, feCreacion, cdUsuarioCreacion
      ) VALUES (
        @cdEmpresaConsultora, @cdCliente, @dsApellidoNombre, @cdPuesto, @feNacimiento,
        @dsCUIT, @dsDNI, @cdNacionalidad, @dsCelularParticular, @dsPersonaContacto,
        @dsCelularContacto, @dsDomicilioCalle, @dsDomicilioEntreCalles, @dsDomicilioNumero,
        @dsDomicilioPiso, @dsDomicilioDepartamento, @cdDomicilioPais, @cdDomicilioProvincia,
        @dsDomicilioLocalidad, @dsDomicilioCodigoPostal, @dsObservaciones, @dsImagenFirma,
        @dsImagenUsuario, @cdEstadoCivil, @dsCV, @dsSindicato, @dsObraSocial, @dsCBU,
        @dsBanco, @dsNumeroCuenta, @dsPeriodoPrueba, @feInicio, @feCierre, @dsResultado,
        @dsCategoriaLaboral, @nuSueldoIngreso, @nuSueldoActual, @feIngreso,
        @dsActaMatrimonioConcubinato, @dsEstudiosCursados, @dsCertificadoAnalitico,
        @dsFotocopiaDNI, @dsServicio, @dsExamenMedico, @dsObservacionesGenerales,
        @feBaja, @dsMotivoDesvinculacion, 1, GETDATE(), @cdUsuarioCreacion
      )
      `,
      {
        cdEmpresaConsultora: parseInt(cdEmpresaConsultora),
        cdCliente: parseInt(cdCliente),
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
        cdUsuarioCreacion: decoded.userId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Usuario de cliente creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear usuario de cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear usuario de cliente' },
      { status: 500 }
    );
  }
}
