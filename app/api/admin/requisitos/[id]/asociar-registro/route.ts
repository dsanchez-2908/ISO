import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/admin/requisitos/[id]/asociar-registro
// Asocia un registro existente de otro requisito/certificación
export async function POST(
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
    const cdRequisito = parseInt(id);
    const body = await request.json();
    const {
      cdCertificacion, // Certificación destino
      cdRegistroDocumentoOrigen, // Registro a asociar
      cdCertificacionOrigen, // Certificación origen del registro
      cdRequisitoOrigen // Requisito origen del registro
    } = body;

    // Validar campos requeridos
    if (!cdCertificacion || !cdRegistroDocumentoOrigen || !cdCertificacionOrigen || !cdRequisitoOrigen) {
      return NextResponse.json({ 
        success: false, 
        error: 'Todos los campos son requeridos' 
      }, { status: 400 });
    }

    // Verificar que no exista ya la asociación
    const existente = await query(`
      SELECT cdAsociacion 
      FROM TR_REQUISITOS_REGISTROS_ASOCIADOS
      WHERE cdRequisito = @cdRequisito 
        AND cdCertificacion = @cdCertificacion
        AND cdRegistroDocumentoOrigen = @cdRegistroDocumentoOrigen
    `, {
      cdRequisito,
      cdCertificacion,
      cdRegistroDocumentoOrigen
    });

    if (existente.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Este formulario ya está asociado a este requisito' 
      }, { status: 400 });
    }

    // Crear la asociación
    await query(`
      INSERT INTO TR_REQUISITOS_REGISTROS_ASOCIADOS (
        cdRequisito,
        cdCertificacion,
        cdRegistroDocumentoOrigen,
        cdCertificacionOrigen,
        cdRequisitoOrigen,
        cdUsuarioCreacion
      ) VALUES (
        @cdRequisito,
        @cdCertificacion,
        @cdRegistroDocumentoOrigen,
        @cdCertificacionOrigen,
        @cdRequisitoOrigen,
        @cdUsuario
      )
    `, {
      cdRequisito,
      cdCertificacion,
      cdRegistroDocumentoOrigen,
      cdCertificacionOrigen,
      cdRequisitoOrigen,
      cdUsuario: decoded.cdUsuario
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Formulario asociado correctamente' 
    });
  } catch (error: any) {
    console.error('Error al asociar registro:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
