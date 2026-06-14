import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/admin/normas/[id]/copiar
 * Copiar norma completa con todas sus dependencias
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cdNormaOrigen = parseInt(id);

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

    // Verificar que la norma origen existe
    const normaOrigen = await query(
      'SELECT cdNorma FROM TD_NORMAS WHERE cdNorma = @cdNormaOrigen',
      { cdNormaOrigen }
    );

    if (normaOrigen.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Norma origen no encontrada' },
        { status: 404 }
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

    // 1. CREAR NUEVA NORMA
    const resultNorma = await query(
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

    const cdNormaNueva = resultNorma[0].cdNorma;

    // 2. COPIAR LISTAS DE LA NORMA
    const listasOrigen = await query(
      `
      SELECT * FROM TD_LISTAS
      WHERE cdNorma = @cdNormaOrigen AND cdEstado = 1
      `,
      { cdNormaOrigen }
    );

    const mapeoListas: { [key: number]: number } = {};

    for (const lista of listasOrigen) {
      const resultLista = await query(
        `
        INSERT INTO TD_LISTAS (
          cdEmpresaConsultora,
          cdCliente,
          cdNorma,
          dsNombreLista,
          dsDescripcion,
          dsTipo,
          cdEstado,
          feCreacion,
          cdUsuarioCreacion
        )
        VALUES (
          @cdEmpresaConsultora,
          @cdCliente,
          @cdNorma,
          @dsNombreLista,
          @dsDescripcion,
          @dsTipo,
          1,
          GETDATE(),
          @cdUsuarioCreacion
        );
        SELECT SCOPE_IDENTITY() as cdLista;
        `,
        {
          cdEmpresaConsultora: lista.cdEmpresaConsultora,
          cdCliente: lista.cdCliente,
          cdNorma: cdNormaNueva,
          dsNombreLista: lista.dsNombreLista,
          dsDescripcion: lista.dsDescripcion,
          dsTipo: lista.dsTipo,
          cdUsuarioCreacion: decoded.cdUsuario,
        }
      );

      const cdListaNueva = resultLista[0].cdLista;
      mapeoListas[lista.cdLista] = cdListaNueva;

      // Copiar items de la lista
      const itemsLista = await query(
        'SELECT * FROM TD_LISTAS_ITEMS WHERE cdLista = @cdLista',
        { cdLista: lista.cdLista }
      );

      for (const item of itemsLista) {
        await query(
          `
          INSERT INTO TD_LISTAS_ITEMS (
            cdLista,
            dsValor,
            dsDescripcion,
            nuOrden,
            snActivo,
            feCreacion,
            cdUsuarioCreacion
          )
          VALUES (
            @cdLista,
            @dsValor,
            @dsDescripcion,
            @nuOrden,
            @snActivo,
            GETDATE(),
            @cdUsuarioCreacion
          )
          `,
          {
            cdLista: cdListaNueva,
            dsValor: item.dsValor,
            dsDescripcion: item.dsDescripcion,
            nuOrden: item.nuOrden,
            snActivo: item.snActivo,
            cdUsuarioCreacion: decoded.cdUsuario,
          }
        );
      }
    }

    // 3. COPIAR REQUISITOS
    const requisitosOrigen = await query(
      `
      SELECT * FROM TD_REQUISITOS
      WHERE cdNorma = @cdNormaOrigen AND cdEstado = 1
      ORDER BY nuOrden
      `,
      { cdNormaOrigen }
    );

    const mapeoRequisitos: { [key: number]: number } = {};
    const mapeoTemplates: { [key: number]: number } = {};

    for (const requisito of requisitosOrigen) {
      const resultRequisito = await query(
        `
        INSERT INTO TD_REQUISITOS (
          cdNorma,
          cdCodigoRequisito,
          dsRequisito,
          dsDescripcion,
          nuOrden,
          cdEstado,
          feCreacion,
          cdUsuarioCreacion
        )
        VALUES (
          @cdNorma,
          @cdCodigoRequisito,
          @dsRequisito,
          @dsDescripcion,
          @nuOrden,
          1,
          GETDATE(),
          @cdUsuarioCreacion
        );
        SELECT SCOPE_IDENTITY() as cdRequisito;
        `,
        {
          cdNorma: cdNormaNueva,
          cdCodigoRequisito: requisito.cdCodigoRequisito,
          dsRequisito: requisito.dsRequisito,
          dsDescripcion: requisito.dsDescripcion,
          nuOrden: requisito.nuOrden,
          cdUsuarioCreacion: decoded.cdUsuario,
        }
      );

      const cdRequisitoNuevo = resultRequisito[0].cdRequisito;
      mapeoRequisitos[requisito.cdRequisito] = cdRequisitoNuevo;

      // 4. COPIAR TEMPLATES DEL REQUISITO
      const templatesOrigen = await query(
        `
        SELECT * FROM TD_TEMPLATES_DOCUMENTOS
        WHERE cdRequisito = @cdRequisito AND snActivo = 1
        `,
        { cdRequisito: requisito.cdRequisito }
      );

      for (const template of templatesOrigen) {
        const resultTemplate = await query(
          `
          INSERT INTO TD_TEMPLATES_DOCUMENTOS (
            cdNorma,
            cdRequisito,
            cdCodigo,
            dsNombre,
            cdTipoDocumento,
            dsVersionTemplate,
            dsArchivoWord,
            dsNombreArchivo,
            snActivo,
            feCreacion,
            cdUsuarioCreacion
          )
          VALUES (
            @cdNorma,
            @cdRequisito,
            @cdCodigo,
            @dsNombre,
            @cdTipoDocumento,
            @dsVersionTemplate,
            @dsArchivoWord,
            @dsNombreArchivo,
            1,
            GETDATE(),
            @cdUsuarioCreacion
          );
          SELECT SCOPE_IDENTITY() as cdTemplateDocumento;
          `,
          {
            cdNorma: cdNormaNueva,
            cdRequisito: cdRequisitoNuevo,
            cdCodigo: template.cdCodigo,
            dsNombre: template.dsNombre,
            cdTipoDocumento: template.cdTipoDocumento,
            dsVersionTemplate: template.dsVersionTemplate,
            dsArchivoWord: template.dsArchivoWord,
            dsNombreArchivo: template.dsNombreArchivo,
            cdUsuarioCreacion: decoded.cdUsuario,
          }
        );

        const cdTemplateNuevo = resultTemplate[0].cdTemplateDocumento;
        mapeoTemplates[template.cdTemplateDocumento] = cdTemplateNuevo;

        // 5. COPIAR CAMPOS DEL TEMPLATE
        const camposOrigen = await query(
          `
          SELECT * FROM TD_TEMPLATES_CAMPOS
          WHERE cdTemplateDocumento = @cdTemplateDocumento
          ORDER BY nuOrden
          `,
          { cdTemplateDocumento: template.cdTemplateDocumento }
        );

        for (const campo of camposOrigen) {
          // Si el campo tiene una lista, mapear a la nueva lista
          const cdListaNueva = campo.cdLista ? mapeoListas[campo.cdLista] : null;

          await query(
            `
            INSERT INTO TD_TEMPLATES_CAMPOS (
              cdTemplateDocumento,
              dsNombreCampo,
              dsEtiqueta,
              cdTipoCampo,
              dsValorDefault,
              snHeredaCliente,
              snObligatorio,
              cdLista,
              nuOrden,
              feCreacion,
              cdUsuarioCreacion
            )
            VALUES (
              @cdTemplateDocumento,
              @dsNombreCampo,
              @dsEtiqueta,
              @cdTipoCampo,
              @dsValorDefault,
              @snHeredaCliente,
              @snObligatorio,
              @cdLista,
              @nuOrden,
              GETDATE(),
              @cdUsuarioCreacion
            )
            `,
            {
              cdTemplateDocumento: cdTemplateNuevo,
              dsNombreCampo: campo.dsNombreCampo,
              dsEtiqueta: campo.dsEtiqueta,
              cdTipoCampo: campo.cdTipoCampo,
              dsValorDefault: campo.dsValorDefault,
              snHeredaCliente: campo.snHeredaCliente,
              snObligatorio: campo.snObligatorio,
              cdLista: cdListaNueva,
              nuOrden: campo.nuOrden,
              cdUsuarioCreacion: decoded.cdUsuario,
            }
          );
        }

        // 6. COPIAR SECCIONES DEL TEMPLATE (si existen)
        const seccionesOrigen = await query(
          `
          SELECT * FROM TD_TEMPLATES_SECCIONES
          WHERE cdTemplateDocumento = @cdTemplateDocumento
          ORDER BY nuOrden
          `,
          { cdTemplateDocumento: template.cdTemplateDocumento }
        );

        for (const seccion of seccionesOrigen) {
          await query(
            `
            INSERT INTO TD_TEMPLATES_SECCIONES (
              cdTemplateDocumento,
              nuOrden,
              dsTitulo,
              dsContenidoBase,
              feCreacion,
              cdUsuarioCreacion
            )
            VALUES (
              @cdTemplateDocumento,
              @nuOrden,
              @dsTitulo,
              @dsContenidoBase,
              GETDATE(),
              @cdUsuarioCreacion
            )
            `,
            {
              cdTemplateDocumento: cdTemplateNuevo,
              nuOrden: seccion.nuOrden,
              dsTitulo: seccion.dsTitulo,
              dsContenidoBase: seccion.dsContenidoBase,
              cdUsuarioCreacion: decoded.cdUsuario,
            }
          );
        }
      }
    }

    // 7. COPIAR FORMULARIOS INDEPENDIENTES (sin requisito asociado)
    const formulariosIndependientes = await query(
      `
      SELECT * FROM TD_TEMPLATES_DOCUMENTOS
      WHERE cdNorma = @cdNormaOrigen AND cdRequisito IS NULL AND snActivo = 1
      `,
      { cdNormaOrigen }
    );

    for (const template of formulariosIndependientes) {
      const resultTemplate = await query(
        `
        INSERT INTO TD_TEMPLATES_DOCUMENTOS (
          cdNorma,
          cdRequisito,
          cdCodigo,
          dsNombre,
          cdTipoDocumento,
          dsVersionTemplate,
          dsArchivoWord,
          dsNombreArchivo,
          snActivo,
          feCreacion,
          cdUsuarioCreacion
        )
        VALUES (
          @cdNorma,
          NULL,
          @cdCodigo,
          @dsNombre,
          @cdTipoDocumento,
          @dsVersionTemplate,
          @dsArchivoWord,
          @dsNombreArchivo,
          1,
          GETDATE(),
          @cdUsuarioCreacion
        );
        SELECT SCOPE_IDENTITY() as cdTemplateDocumento;
        `,
        {
          cdNorma: cdNormaNueva,
          cdCodigo: template.cdCodigo,
          dsNombre: template.dsNombre,
          cdTipoDocumento: template.cdTipoDocumento,
          dsVersionTemplate: template.dsVersionTemplate,
          dsArchivoWord: template.dsArchivoWord,
          dsNombreArchivo: template.dsNombreArchivo,
          cdUsuarioCreacion: decoded.cdUsuario,
        }
      );

      const cdTemplateNuevo = resultTemplate[0].cdTemplateDocumento;
      mapeoTemplates[template.cdTemplateDocumento] = cdTemplateNuevo;

      // Copiar campos del template independiente
      const camposOrigen = await query(
        `
        SELECT * FROM TD_TEMPLATES_CAMPOS
        WHERE cdTemplateDocumento = @cdTemplateDocumento
        ORDER BY nuOrden
        `,
        { cdTemplateDocumento: template.cdTemplateDocumento }
      );

      for (const campo of camposOrigen) {
        const cdListaNueva = campo.cdLista ? mapeoListas[campo.cdLista] : null;

        await query(
          `
          INSERT INTO TD_TEMPLATES_CAMPOS (
            cdTemplateDocumento,
            dsNombreCampo,
            dsEtiqueta,
            cdTipoCampo,
            dsValorDefault,
            snHeredaCliente,
            snObligatorio,
            cdLista,
            nuOrden,
            feCreacion,
            cdUsuarioCreacion
          )
          VALUES (
            @cdTemplateDocumento,
            @dsNombreCampo,
            @dsEtiqueta,
            @cdTipoCampo,
            @dsValorDefault,
            @snHeredaCliente,
            @snObligatorio,
            @cdLista,
            @nuOrden,
            GETDATE(),
            @cdUsuarioCreacion
          )
          `,
          {
            cdTemplateDocumento: cdTemplateNuevo,
            dsNombreCampo: campo.dsNombreCampo,
            dsEtiqueta: campo.dsEtiqueta,
            cdTipoCampo: campo.cdTipoCampo,
            dsValorDefault: campo.dsValorDefault,
            snHeredaCliente: campo.snHeredaCliente,
            snObligatorio: campo.snObligatorio,
            cdLista: cdListaNueva,
            nuOrden: campo.nuOrden,
            cdUsuarioCreacion: decoded.cdUsuario,
          }
        );
      }

      // Copiar secciones del template independiente
      const seccionesOrigen = await query(
        `
        SELECT * FROM TD_TEMPLATES_SECCIONES
        WHERE cdTemplateDocumento = @cdTemplateDocumento
        ORDER BY nuOrden
        `,
        { cdTemplateDocumento: template.cdTemplateDocumento }
      );

      for (const seccion of seccionesOrigen) {
        await query(
          `
          INSERT INTO TD_TEMPLATES_SECCIONES (
            cdTemplateDocumento,
            nuOrden,
            dsTitulo,
            dsContenidoBase,
            feCreacion,
            cdUsuarioCreacion
          )
          VALUES (
            @cdTemplateDocumento,
            @nuOrden,
            @dsTitulo,
            @dsContenidoBase,
            GETDATE(),
            @cdUsuarioCreacion
          )
          `,
          {
            cdTemplateDocumento: cdTemplateNuevo,
            nuOrden: seccion.nuOrden,
            dsTitulo: seccion.dsTitulo,
            dsContenidoBase: seccion.dsContenidoBase,
            cdUsuarioCreacion: decoded.cdUsuario,
          }
        );
      }
    }

    // 8. COPIAR RELACIONES DE REQUISITOS CON TEMPLATES (TR_REQUISITOS_TEMPLATES)
    const relacionesOrigen = await query(
      `
      SELECT rt.* 
      FROM TR_REQUISITOS_TEMPLATES rt
      INNER JOIN TD_REQUISITOS r ON rt.cdRequisito = r.cdRequisito
      WHERE r.cdNorma = @cdNormaOrigen
      `,
      { cdNormaOrigen }
    );

    for (const relacion of relacionesOrigen) {
      const cdRequisitoNuevo = mapeoRequisitos[relacion.cdRequisito];
      const cdTemplateNuevo = mapeoTemplates[relacion.cdTemplateDocumento];

      // Solo insertar si ambos IDs fueron mapeados correctamente
      if (cdRequisitoNuevo && cdTemplateNuevo) {
        await query(
          `
          INSERT INTO TR_REQUISITOS_TEMPLATES (cdRequisito, cdTemplateDocumento, feCreacion)
          VALUES (@cdRequisito, @cdTemplateDocumento, GETDATE())
          `,
          {
            cdRequisito: cdRequisitoNuevo,
            cdTemplateDocumento: cdTemplateNuevo,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        cdNorma: cdNormaNueva,
        listasCopiadas: Object.keys(mapeoListas).length,
        requisitosCopiados: Object.keys(mapeoRequisitos).length,
        templatesCopiados: Object.keys(mapeoTemplates).length,
      },
    });
  } catch (error) {
    console.error('Error al copiar norma:', error);
    return NextResponse.json(
      { success: false, error: 'Error al copiar norma' },
      { status: 500 }
    );
  }
}
