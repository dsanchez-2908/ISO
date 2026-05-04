import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/certificaciones?cdCliente=X
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
    const cdCliente = searchParams.get('cdCliente');

    if (!cdCliente) {
      return NextResponse.json({ success: false, error: 'cdCliente es requerido' }, { status: 400 });
    }

    const certificaciones = await query(`
      SELECT 
        c.cdCertificacion,
        c.cdCliente,
        c.cdNorma,
        n.dsNombre as dsNombreNorma,
        n.cdCodigo as cdCodigoNorma,
        c.dsCodigo,
        c.cdEstado,
        e.dsEstado,
        c.feInicio,
        c.feFin,
        c.feVencimiento,
        c.feCertificacion,
        c.dsAuditor,
        c.dsObservaciones,
        c.feCreacion,
        (SELECT COUNT(*) FROM TD_REGISTROS_DOCUMENTOS WHERE cdCertificacion = c.cdCertificacion) as nuTotalDocumentos,
        (SELECT COUNT(*) FROM TD_REGISTROS_DOCUMENTOS rd WHERE rd.cdCertificacion = c.cdCertificacion AND rd.cdEstadoDocumento = 3) as nuDocumentosCompletos
      FROM TD_CERTIFICACIONES c
      INNER JOIN TD_NORMAS n ON c.cdNorma = n.cdNorma
      INNER JOIN TV_ESTADOS e ON c.cdEstado = e.cdEstado
      WHERE c.cdCliente = @cdCliente
      ORDER BY c.feCreacion DESC
    `, { cdCliente: parseInt(cdCliente) });

    return NextResponse.json({ success: true, data: certificaciones });
  } catch (error: any) {
    console.error('Error al obtener certificaciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/certificaciones
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
    const {
      cdCliente,
      cdNorma,
      cdEmpresaConsultora,
      dsCodigo,
      cdEstado,
      feInicio,
      feFin,
      feVencimiento,
      feCertificacion,
      dsAuditor,
      dsObservaciones
    } = body;

    // Validar campos requeridos
    if (!cdCliente || !cdNorma || !cdEmpresaConsultora) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: cdCliente, cdNorma, cdEmpresaConsultora' },
        { status: 400 }
      );
    }

    // 1. Crear certificación
    const resultCert = await query(`
      INSERT INTO TD_CERTIFICACIONES (
        cdCliente, cdNorma, cdEmpresaConsultora, dsCodigo, cdEstado,
        feInicio, feFin, feVencimiento, feCertificacion, dsAuditor, dsObservaciones,
        feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdCliente, @cdNorma, @cdEmpresaConsultora, @dsCodigo, @cdEstado,
        @feInicio, @feFin, @feVencimiento, @feCertificacion, @dsAuditor, @dsObservaciones,
        GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() AS cdCertificacion;
    `, {
      cdCliente: parseInt(cdCliente),
      cdNorma: parseInt(cdNorma),
      cdEmpresaConsultora: parseInt(cdEmpresaConsultora),
      dsCodigo: dsCodigo || null,
      cdEstado: cdEstado ? parseInt(cdEstado) : 1,
      feInicio: feInicio || null,
      feFin: feFin || null,
      feVencimiento: feVencimiento || null,
      feCertificacion: feCertificacion || null,
      dsAuditor: dsAuditor || null,
      dsObservaciones: dsObservaciones || null,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    const cdCertificacion = resultCert[0]?.cdCertificacion;

    if (!cdCertificacion) {
      throw new Error('No se pudo obtener el ID de la certificación creada');
    }

    return NextResponse.json({
      success: true,
      data: { cdCertificacion }
    });
  } catch (error: any) {
    console.error('Error al crear certificación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
