import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PUT /api/admin/registros-documentos/[id]/campos
// Actualiza los valores de todos los campos del documento
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
    const cdRegistroDocumento = parseInt(id);
    const body = await request.json();
    const { campos } = body; // Array de { cdRegistroCampoValor, dsValor, cdListaItem, cdListaCliente, cdEntidadCliente, dsEntidadTipo }

    if (!Array.isArray(campos)) {
      return NextResponse.json(
        { success: false, error: 'Se esperaba un array de campos' },
        { status: 400 }
      );
    }

    // Actualizar cada campo
    for (const campo of campos) {
      const {
        cdRegistroCampoValor,
        dsValor,
        cdListaItem,
        cdListaCliente,
        cdEntidadCliente,
        dsEntidadTipo
      } = campo;

      if (cdRegistroCampoValor) {
        await query(`
          UPDATE TD_REGISTROS_CAMPOS_VALORES
          SET dsValor = @dsValor,
              cdListaItem = @cdListaItem,
              cdListaCliente = @cdListaCliente,
              cdEntidadCliente = @cdEntidadCliente,
              dsEntidadTipo = @dsEntidadTipo,
              feModificacion = GETDATE(),
              cdUsuarioModificacion = @cdUsuarioModificacion
          WHERE cdRegistroCampoValor = @cdRegistroCampoValor
        `, {
          cdRegistroCampoValor,
          dsValor: dsValor || null,
          cdListaItem: cdListaItem || null,
          cdListaCliente: cdListaCliente || null,
          cdEntidadCliente: cdEntidadCliente || null,
          dsEntidadTipo: dsEntidadTipo || null,
          cdUsuarioModificacion: decoded.cdUsuario
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        cdRegistroDocumento,
        nuCamposActualizados: campos.length
      }
    });
  } catch (error: any) {
    console.error('Error al actualizar campos del documento:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
