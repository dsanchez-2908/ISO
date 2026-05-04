import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/templates-campos/[id]
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
    const cdTemplateCampo = parseInt(id);

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
        tc.dsTipoHerencia,
        tc.dsEntidadCliente,
        tc.cdLista,
        l.dsNombreLista,
        tc.cdValorDefaultLista,
        tc.nuOrden,
        tc.feCreacion,
        tc.cdUsuarioCreacion
      FROM TD_TEMPLATES_CAMPOS tc
      LEFT JOIN TV_TIPOS_CAMPO tip ON tc.cdTipoCampo = tip.cdTipoCampo
      LEFT JOIN TD_LISTAS l ON tc.cdLista = l.cdLista
      WHERE tc.cdTemplateCampo = @cdTemplateCampo
    `, { cdTemplateCampo });

    if (!campos || campos.length === 0) {
      return NextResponse.json({ success: false, error: 'Campo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campos[0] });
  } catch (error: any) {
    console.error('Error al obtener campo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/templates-campos/[id]
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
    const cdTemplateCampo = parseInt(id);
    const body = await request.json();
    const { 
      snEsTitulo,
      dsTitulo,
      dsNombreCampo, 
      dsEtiqueta, 
      cdTipoCampo,
      dsValorDefault,
      snObligatorio,
      snOculto,
      snSoloLectura,
      dsTipoHerencia,
      dsEntidadCliente,
      cdLista,
      cdValorDefaultLista,
      nuOrden
    } = body;

    await query(`
      UPDATE TD_TEMPLATES_CAMPOS
      SET snEsTitulo = @snEsTitulo,
          dsTitulo = @dsTitulo,
          dsNombreCampo = @dsNombreCampo,
          dsEtiqueta = @dsEtiqueta,
          cdTipoCampo = @cdTipoCampo,
          dsValorDefault = @dsValorDefault,
          snObligatorio = @snObligatorio,
          snOculto = @snOculto,
          snSoloLectura = @snSoloLectura,
          dsTipoHerencia = @dsTipoHerencia,
          dsEntidadCliente = @dsEntidadCliente,
          cdLista = @cdLista,
          cdValorDefaultLista = @cdValorDefaultLista,
          nuOrden = @nuOrden
      WHERE cdTemplateCampo = @cdTemplateCampo
    `, {
      cdTemplateCampo,
      snEsTitulo: snEsTitulo ? 1 : 0,
      dsTitulo: dsTitulo || null,
      dsNombreCampo: dsNombreCampo || null,
      dsEtiqueta: dsEtiqueta || null,
      cdTipoCampo: cdTipoCampo ? parseInt(cdTipoCampo) : null,
      dsValorDefault: dsValorDefault || null,
      snObligatorio: snObligatorio ? 1 : 0,
      snOculto: snOculto ? 1 : 0,
      snSoloLectura: snSoloLectura ? 1 : 0,
      dsTipoHerencia: dsTipoHerencia || null,
      dsEntidadCliente: dsEntidadCliente || null,
      cdLista: cdLista ? parseInt(cdLista) : null,
      cdValorDefaultLista: cdValorDefaultLista ? parseInt(cdValorDefaultLista) : null,
      nuOrden: nuOrden ? parseInt(nuOrden) : 0
    });

    return NextResponse.json({ success: true, data: { cdTemplateCampo } });
  } catch (error: any) {
    console.error('Error al actualizar campo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/templates-campos/[id]
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
    const cdTemplateCampo = parseInt(id);

    await query(`
      DELETE FROM TD_TEMPLATES_CAMPOS
      WHERE cdTemplateCampo = @cdTemplateCampo
    `, { cdTemplateCampo });

    return NextResponse.json({ success: true, data: { cdTemplateCampo } });
  } catch (error: any) {
    console.error('Error al eliminar campo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
