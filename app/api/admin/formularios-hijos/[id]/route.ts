import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PUT /api/admin/formularios-hijos/[id]
// Actualiza los valores de un registro hijo existente
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
    const cdRegistroDocumentoHijo = parseInt(id);
    const body = await request.json();
    const { valores, listasClienteSeleccionadas = {} } = body;

    if (!valores) {
      return NextResponse.json({ 
        success: false, 
        error: 'valores es requerido' 
      }, { status: 400 });
    }

    // Obtener información de los campos para saber cómo guardarlos
    const campos = await query(`
      SELECT 
        tc.cdTemplateCampo,
        tc.cdTipoCampo,
        tc.dsTipoHerencia,
        tc.dsEntidadCliente
      FROM TD_REGISTROS_DOCUMENTOS rd
      INNER JOIN TD_TEMPLATES_CAMPOS tc ON rd.cdTemplateDocumento = tc.cdTemplateDocumento
      WHERE rd.cdRegistroDocumento = @cdRegistroDocumento
    `, { cdRegistroDocumento: cdRegistroDocumentoHijo });

    const camposMap = campos.reduce((map: any, campo: any) => {
      map[campo.cdTemplateCampo] = campo;
      return map;
    }, {});

    // Actualizar cada valor de campo
    for (const [cdTemplateCampoStr, valor] of Object.entries(valores)) {
      const cdTemplateCampo = parseInt(cdTemplateCampoStr);
      const campo = camposMap[cdTemplateCampo];
      
      if (!campo) continue;

      let dsValor = null;
      let cdListaItem = null;
      let cdListaCliente = null;

      // Determinar cómo guardar según el tipo de campo
      if (campo.cdTipoCampo === 4) {
        // Lista
        cdListaItem = valor ? parseInt(valor as string) : null;
        // Si es herencia CLIENTE con LISTAS_CONFIGURADAS, guardar la lista seleccionada
        if (campo.dsTipoHerencia === 'CLIENTE' && campo.dsEntidadCliente === 'LISTAS_CONFIGURADAS') {
          cdListaCliente = listasClienteSeleccionadas[cdTemplateCampo] || null;
        }
      } else if (campo.cdTipoCampo === 8) {
        // Booleano
        dsValor = (valor === true || valor === '1') ? '1' : '0';
      } else {
        // Otros tipos
        dsValor = valor ? valor.toString() : null;
      }

      await query(`
        UPDATE TD_REGISTROS_CAMPOS_VALORES
        SET dsValor = @dsValor,
            cdListaItem = @cdListaItem,
            cdListaCliente = @cdListaCliente,
            feModificacion = GETDATE(),
            cdUsuarioModificacion = @cdUsuarioModificacion
        WHERE cdRegistroDocumento = @cdRegistroDocumento
          AND cdTemplateCampo = @cdTemplateCampo
      `, {
        cdRegistroDocumento: cdRegistroDocumentoHijo,
        cdTemplateCampo,
        dsValor,
        cdListaItem,
        cdListaCliente,
        cdUsuarioModificacion: decoded.cdUsuario
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: { cdRegistroDocumentoHijo } 
    });
  } catch (error: any) {
    console.error('Error al actualizar registro hijo:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE /api/admin/formularios-hijos/[id]
// Elimina un registro hijo y su relación
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
    const cdRegistroDocumentoHijo = parseInt(id);

    // 1. Eliminar valores de campos
    await query(`
      DELETE FROM TD_REGISTROS_CAMPOS_VALORES
      WHERE cdRegistroDocumento = @cdRegistroDocumentoHijo
    `, { cdRegistroDocumentoHijo });

    // 2. Eliminar relación padre-hijo
    await query(`
      DELETE FROM TR_REGISTROS_FORMULARIOS_HIJOS
      WHERE cdRegistroHijo = @cdRegistroDocumentoHijo
    `, { cdRegistroDocumentoHijo });

    // 3. Eliminar registro documento
    await query(`
      DELETE FROM TD_REGISTROS_DOCUMENTOS
      WHERE cdRegistroDocumento = @cdRegistroDocumentoHijo
    `, { cdRegistroDocumentoHijo });

    return NextResponse.json({ 
      success: true, 
      message: 'Registro hijo eliminado correctamente' 
    });
  } catch (error: any) {
    console.error('Error al eliminar registro hijo:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
