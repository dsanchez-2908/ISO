import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/templates-campos?cdTemplateDocumento=X
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
    const cdTemplateDocumento = searchParams.get('cdTemplateDocumento');

    if (!cdTemplateDocumento) {
      return NextResponse.json({ success: false, error: 'cdTemplateDocumento es requerido' }, { status: 400 });
    }

    const campos = await query(`
      SELECT 
        tc.cdTemplateCampo,
        tc.cdTemplateDocumento,
        tc.snEsTitulo,
        tc.dsTitulo,
        tc.dsNombreCampo,
        tc.dsEtiqueta,
        tc.cdTipoCampo,
        tip.dsTipoCampo,
        tc.dsValorDefault,
        tc.snObligatorio,
        tc.snOculto,
        tc.snSoloLectura,
        tc.snNoVistaImpresion,
        tc.dsTipoHerencia,
        tc.dsEntidadCliente,
        tc.cdLista,
        l.dsNombreLista,
        tc.cdValorDefaultLista,
        tc.cdFormularioAsociado,
        td.dsNombre AS dsNombreFormularioAsociado,
        tc.nuOrden,
        tc.feCreacion,
        tc.cdUsuarioCreacion
      FROM TD_TEMPLATES_CAMPOS tc
      LEFT JOIN TV_TIPOS_CAMPO tip ON tc.cdTipoCampo = tip.cdTipoCampo
      LEFT JOIN TD_LISTAS l ON tc.cdLista = l.cdLista
      LEFT JOIN TD_TEMPLATES_DOCUMENTOS td ON tc.cdFormularioAsociado = td.cdTemplateDocumento
      WHERE tc.cdTemplateDocumento = @cdTemplateDocumento
      ORDER BY tc.nuOrden, tc.cdTemplateCampo
    `, { cdTemplateDocumento: parseInt(cdTemplateDocumento) });

    return NextResponse.json({ success: true, data: campos });
  } catch (error: any) {
    console.error('Error al obtener campos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/templates-campos
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
      cdTemplateDocumento,
      snEsTitulo,
      dsTitulo,
      dsNombreCampo, 
      dsEtiqueta, 
      cdTipoCampo,
      dsValorDefault,
      snObligatorio,
      snOculto,
      snSoloLectura,
      snNoVistaImpresion,
      dsTipoHerencia,
      dsEntidadCliente,
      cdLista,
      cdValorDefaultLista,
      cdFormularioAsociado,
      nuOrden
    } = body;

    // Validar campos requeridos
    if (!cdTemplateDocumento) {
      return NextResponse.json(
        { success: false, error: 'cdTemplateDocumento es requerido' },
        { status: 400 }
      );
    }

    // Si es título, validar dsTitulo, si es campo validar dsNombreCampo
    if (snEsTitulo && !dsTitulo) {
      return NextResponse.json(
        { success: false, error: 'dsTitulo es requerido para títulos' },
        { status: 400 }
      );
    }

    if (!snEsTitulo && (!dsNombreCampo || !cdTipoCampo)) {
      return NextResponse.json(
        { success: false, error: 'dsNombreCampo y cdTipoCampo son requeridos para campos' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO TD_TEMPLATES_CAMPOS (
        cdTemplateDocumento, snEsTitulo, dsTitulo, dsNombreCampo, dsEtiqueta, cdTipoCampo,
        dsValorDefault, snObligatorio, snOculto, snSoloLectura, snNoVistaImpresion,
        dsTipoHerencia, dsEntidadCliente, cdLista, cdValorDefaultLista, cdFormularioAsociado, nuOrden,
        feCreacion, cdUsuarioCreacion
      )
      VALUES (
        @cdTemplateDocumento, @snEsTitulo, @dsTitulo, @dsNombreCampo, @dsEtiqueta, @cdTipoCampo,
        @dsValorDefault, @snObligatorio, @snOculto, @snSoloLectura, @snNoVistaImpresion,
        @dsTipoHerencia, @dsEntidadCliente, @cdLista, @cdValorDefaultLista, @cdFormularioAsociado, @nuOrden,
        GETDATE(), @cdUsuarioCreacion
      );
      SELECT SCOPE_IDENTITY() AS cdTemplateCampo;
    `, {
      cdTemplateDocumento: parseInt(cdTemplateDocumento),
      snEsTitulo: snEsTitulo ? 1 : 0,
      dsTitulo: dsTitulo || null,
      dsNombreCampo: dsNombreCampo || null,
      dsEtiqueta: dsEtiqueta || null,
      cdTipoCampo: cdTipoCampo ? parseInt(cdTipoCampo) : null,
      dsValorDefault: dsValorDefault || null,
      snObligatorio: snObligatorio ? 1 : 0,
      snOculto: snOculto ? 1 : 0,
      snSoloLectura: snSoloLectura ? 1 : 0,
      snNoVistaImpresion: snNoVistaImpresion ? 1 : 0,
      dsTipoHerencia: dsTipoHerencia || null,
      dsEntidadCliente: dsEntidadCliente || null,
      cdLista: cdLista ? parseInt(cdLista) : null,
      cdValorDefaultLista: cdValorDefaultLista ? parseInt(cdValorDefaultLista) : null,
      cdFormularioAsociado: cdFormularioAsociado ? parseInt(cdFormularioAsociado) : null,
      nuOrden: nuOrden ? parseInt(nuOrden) : 0,
      cdUsuarioCreacion: decoded.cdUsuario
    });

    return NextResponse.json({ 
      success: true, 
      data: { cdTemplateCampo: result[0]?.cdTemplateCampo } 
    });
  } catch (error: any) {
    console.error('Error al crear campo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
