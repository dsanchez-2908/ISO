import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/certificaciones/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    const cdCertificacion = parseInt(id);

    const certificaciones = await query(`
      SELECT 
        c.cdCertificacion,
        c.cdCliente,
        cl.dsRazonSocial as dsNombreCliente,
        c.cdNorma,
        n.dsNombre as dsNombreNorma,
        n.cdCodigo as cdCodigoNorma,
        c.cdEmpresaConsultora,
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
        c.cdUsuarioCreacion
      FROM TD_CERTIFICACIONES c
      INNER JOIN TD_CLIENTES cl ON c.cdCliente = cl.cdCliente
      INNER JOIN TD_NORMAS n ON c.cdNorma = n.cdNorma
      INNER JOIN TV_ESTADOS e ON c.cdEstado = e.cdEstado
      WHERE c.cdCertificacion = @cdCertificacion
    `, { cdCertificacion });

    if (!certificaciones || certificaciones.length === 0) {
      return NextResponse.json({ success: false, error: 'Certificación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: certificaciones[0] });
  } catch (error: any) {
    console.error('Error al obtener certificación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/certificaciones/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    const cdCertificacion = parseInt(id);
    const body = await request.json();
    const {
      dsCodigo,
      cdEstado,
      feInicio,
      feFin,
      feVencimiento,
      feCertificacion,
      dsAuditor,
      dsObservaciones
    } = body;

    await query(`
      UPDATE TD_CERTIFICACIONES
      SET dsCodigo = @dsCodigo,
          cdEstado = @cdEstado,
          feInicio = @feInicio,
          feFin = @feFin,
          feVencimiento = @feVencimiento,
          feCertificacion = @feCertificacion,
          dsAuditor = @dsAuditor,
          dsObservaciones = @dsObservaciones,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdCertificacion = @cdCertificacion
    `, {
      cdCertificacion,
      dsCodigo: dsCodigo || null,
      cdEstado: cdEstado ? parseInt(cdEstado) : 1,
      feInicio: feInicio || null,
      feFin: feFin || null,
      feVencimiento: feVencimiento || null,
      feCertificacion: feCertificacion || null,
      dsAuditor: dsAuditor || null,
      dsObservaciones: dsObservaciones || null,
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdCertificacion } });
  } catch (error: any) {
    console.error('Error al actualizar certificación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/certificaciones/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    const cdCertificacion = parseInt(id);

    // Soft delete: cambiar a estado "Eliminado" (cdEstado = 2)
    await query(`
      UPDATE TD_CERTIFICACIONES
      SET cdEstado = 2,
          feModificacion = GETDATE(),
          cdUsuarioModificacion = @cdUsuarioModificacion
      WHERE cdCertificacion = @cdCertificacion
    `, {
      cdCertificacion,
      cdUsuarioModificacion: decoded.cdUsuario
    });

    return NextResponse.json({ success: true, data: { cdCertificacion } });
  } catch (error: any) {
    console.error('Error al eliminar certificación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
