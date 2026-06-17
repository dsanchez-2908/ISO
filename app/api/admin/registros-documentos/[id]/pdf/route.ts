import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';

// Función auxiliar para dividir texto en líneas que caben en un ancho específico
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  
  // Limpiar el texto de caracteres no soportados por WinAnsi
  let cleanText = text
    .replace(/\t/g, '    ')  // Tabs a 4 espacios
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '') // Eliminar caracteres de control
    .replace(/[^\u0020-\u007E\u00A0-\u00FF\u0100-\u017F]/g, '') // Mantener solo caracteres básicos latinos
    .replace(/•/g, '* ') // Reemplazar bullets
    .replace(/–/g, '-') // Reemplazar guiones largos
    .replace(/—/g, '-')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'");
  
  // Primero dividir por saltos de línea explícitos
  const paragraphs = cleanText.split(/\r?\n/);
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push(''); // Preservar líneas vacías
      continue;
    }
    
    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        // Si una palabra es demasiado larga, la agregamos de todos modos
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

// Función para dibujar texto multilínea y retornar la nueva posición Y
function drawMultilineText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: any,
  maxWidth: number
): number {
  const lines = wrapText(text, font, size, maxWidth);
  let currentY = y;
  
  for (const line of lines) {
    if (line.trim()) { // Solo dibujar si la línea tiene contenido
      page.drawText(line, { x, y: currentY, size, font, color });
    }
    currentY -= size + 4; // Espaciado entre líneas (incluso para líneas vacías)
  }
  
  return currentY;
}

// GET /api/admin/registros-documentos/[id]/pdf
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

    // Obtener información del registro
    const registrosResult = await query(`
      SELECT 
        r.cdRegistroDocumento,
        r.dsNombreDocumento,
        r.feCreacion,
        r.feModificacion,
        t.dsNombre as dsNombreTemplate,
        e.dsEstado,
        req.dsRequisito,
        n.dsNombre as dsCertificacion,
        c.dsRazonSocial as dsCliente
      FROM TD_REGISTROS_DOCUMENTOS r
      INNER JOIN TD_TEMPLATES_DOCUMENTOS t ON r.cdTemplateDocumento = t.cdTemplateDocumento
      INNER JOIN TV_ESTADOS e ON r.cdEstadoDocumento = e.cdEstado
      LEFT JOIN TD_REQUISITOS req ON r.cdRequisito = req.cdRequisito
      LEFT JOIN TD_CERTIFICACIONES cert ON r.cdCertificacion = cert.cdCertificacion
      LEFT JOIN TD_NORMAS n ON cert.cdNorma = n.cdNorma
      LEFT JOIN TD_CLIENTES c ON cert.cdCliente = c.cdCliente
      WHERE r.cdRegistroDocumento = @p0
    `, { p0: id });

    if (!registrosResult || registrosResult.length === 0) {
      return NextResponse.json({ success: false, error: 'Registro no encontrado' }, { status: 404 });
    }

    const registro = registrosResult[0];

    // Obtener los campos y valores del registro
    const camposResult = await query(`
      SELECT 
        tc.snEsTitulo,
        tc.dsTitulo,
        tc.dsNombreCampo,
        tc.dsEtiqueta,
        tc.nuOrden,
        tc.snNoVistaImpresion,
        tv.dsTipoCampo,
        rcv.dsValor,
        li.dsValor as dsListaItemNombre,
        rcv.dsEntidadTipo,
        rcv.cdEntidadCliente
      FROM TD_TEMPLATES_CAMPOS tc
      LEFT JOIN TD_REGISTROS_CAMPOS_VALORES rcv ON tc.cdTemplateCampo = rcv.cdTemplateCampo AND rcv.cdRegistroDocumento = @p0
      LEFT JOIN TV_TIPOS_CAMPO tv ON tc.cdTipoCampo = tv.cdTipoCampo
      LEFT JOIN TD_LISTAS_ITEMS li ON rcv.cdListaItem = li.cdListaItem
      WHERE tc.cdTemplateDocumento = (SELECT cdTemplateDocumento FROM TD_REGISTROS_DOCUMENTOS WHERE cdRegistroDocumento = @p0)
        AND (tc.snOculto IS NULL OR tc.snOculto = 0)
        AND (tc.snNoVistaImpresion IS NULL OR tc.snNoVistaImpresion = 0)
      ORDER BY tc.nuOrden
    `, { p0: id });

    console.log('=== DEBUG PDF ===');
    console.log('Total campos recuperados:', camposResult.length);
    console.log('Campos tipo Lista:', camposResult.filter(c => c.dsTipoCampo === 'Lista').length);
    console.log('Detalle campos Lista:', camposResult.filter(c => c.dsTipoCampo === 'Lista').map(c => ({
      orden: c.nuOrden,
      nombre: c.dsEtiqueta || c.dsNombreCampo,
      esTitulo: c.snEsTitulo,
      dsValor: c.dsValor,
      dsListaItemNombre: c.dsListaItemNombre,
      noVistaImpresion: c.snNoVistaImpresion
    })));
    console.log('=== FIN DEBUG ===');

    // Crear el documento PDF con pdf-lib
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Tamaño A4: 595 x 842 puntos
    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    let yPosition = height - 50;
    
    // Colores
    const blueColor = rgb(0.12, 0.25, 0.69); // #1e40af
    const grayColor = rgb(0.39, 0.46, 0.53); // #64748b
    const darkGrayColor = rgb(0.28, 0.33, 0.41); // #475569
    const lightGrayBg = rgb(0.95, 0.96, 0.97); // #f1f5f9
    const textColor = rgb(0.12, 0.16, 0.23); // #1e293b

    // ===== HEADER =====
    page.drawText(registro.dsNombreDocumento, {
      x: 50,
      y: yPosition,
      size: 20,
      font: timesRomanBoldFont,
      color: blueColor,
    });
    yPosition -= 25;
    
    page.drawText(registro.dsNombreTemplate, {
      x: 50,
      y: yPosition,
      size: 12,
      font: timesRomanFont,
      color: grayColor,
    });
    yPosition -= 20;
    
    // Línea separadora
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 545, y: yPosition },
      thickness: 2,
      color: blueColor,
    });
    yPosition -= 20;

    // ===== METADATA SECTION =====
    // Fondo gris para metadata
    page.drawRectangle({
      x: 50,
      y: yPosition - 120,
      width: 495,
      height: 120,
      color: lightGrayBg,
    });
    
    yPosition -= 15;
    
    const metadata: Array<{ label: string; value: string }> = [];
    if (registro.dsCliente) metadata.push({ label: 'Cliente:', value: registro.dsCliente });
    if (registro.dsCertificacion) metadata.push({ label: 'Certificación:', value: registro.dsCertificacion });
    if (registro.dsRequisito) metadata.push({ label: 'Requisito:', value: registro.dsRequisito });
    metadata.push({ label: 'Estado:', value: registro.dsEstado });
    metadata.push({ 
      label: 'Fecha de Creación:', 
      value: new Date(registro.feCreacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
    if (registro.feModificacion) {
      metadata.push({ 
        label: 'Última Modificación:', 
        value: new Date(registro.feModificacion).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    }
    
    for (const item of metadata) {
      page.drawText(item.label, {
        x: 60,
        y: yPosition,
        size: 10,
        font: timesRomanBoldFont,
        color: darkGrayColor,
      });
      page.drawText(item.value, {
        x: 180,
        y: yPosition,
        size: 10,
        font: timesRomanFont,
        color: textColor,
      });
      yPosition -= 15;
    }
    
    yPosition -= 20;

    // ===== CAMPOS, TÍTULOS Y VALORES =====
    if (camposResult && camposResult.length > 0) {
      // Iterar sobre los elementos (campos y títulos) según el orden
      for (const elemento of camposResult) {
        // Si es un título (H Titulo)
        if (elemento.snEsTitulo) {
          // Verificar si necesitamos una nueva página
          if (yPosition < 150) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
          }
          
          // Título de sección
          page.drawText(elemento.dsTitulo || 'Sin título', {
            x: 50,
            y: yPosition,
            size: 14,
            font: timesRomanBoldFont,
            color: blueColor,
          });
          yPosition -= 5;
          
          // Línea bajo el título
          page.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: 545, y: yPosition },
            thickness: 1,
            color: rgb(0.8, 0.84, 0.88),
          });
          yPosition -= 20;
        } else {
          // Es un campo regular
          let displayValue = elemento.dsValor;
          
          // Formatear valores según el tipo de campo
          if (elemento.dsTipoCampo === 'Lista' && elemento.dsListaItemNombre) {
            displayValue = elemento.dsListaItemNombre;
          } else if (elemento.dsTipoCampo === 'Fecha' && elemento.dsValor) {
            try {
              displayValue = new Date(elemento.dsValor).toLocaleDateString('es-ES');
            } catch (e) {
              displayValue = elemento.dsValor;
            }
          } else if (elemento.dsTipoCampo === 'FechaHora' && elemento.dsValor) {
            try {
              displayValue = new Date(elemento.dsValor).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });
            } catch (e) {
              displayValue = elemento.dsValor;
            }
          } else if (elemento.dsTipoCampo === 'Booleano') {
            displayValue = elemento.dsValor === '1' || elemento.dsValor === 'true' ? 'Sí' : 'No';
          }
          
          // Saltar campos sin valor para hacer el PDF más limpio
          if (!displayValue || displayValue.trim() === '') {
            continue;
          }
          
          // Verificar si necesitamos una nueva página antes de escribir el campo
          if (yPosition < 150) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
          }
          
          // Etiqueta del campo
          page.drawText(`${elemento.dsEtiqueta || elemento.dsNombreCampo}:`, {
            x: 60,
            y: yPosition,
            size: 10,
            font: timesRomanBoldFont,
            color: darkGrayColor,
          });
          yPosition -= 15;
          
          // Valor del campo (con soporte multilínea)
          const valueText = displayValue;
          const valueColor = textColor;
          
          // Verificar si hay espacio suficiente, si no, crear nueva página
          const estimatedLines = Math.ceil(valueText.length / 80); // Estimación aproximada
          const estimatedHeight = estimatedLines * 14;
          
          if (yPosition - estimatedHeight < 80) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
          }
          
          // Dibujar texto con soporte multilínea
          yPosition = drawMultilineText(
            page,
            valueText,
            70,
            yPosition,
            timesRomanFont,
            10,
            valueColor,
            465 // maxWidth (545 - 70 - margen derecho)
          );
          
          yPosition -= 10; // Espaciado extra entre campos
        }
      }
    }

    // ===== FOOTER en todas las páginas =====
    const pages = pdfDoc.getPages();
    const footerText = `Documento generado el ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    for (const currentPage of pages) {
      // Línea superior del footer
      currentPage.drawLine({
        start: { x: 50, y: 50 },
        end: { x: 545, y: 50 },
        thickness: 1,
        color: rgb(0.89, 0.91, 0.94),
      });
      
      // Texto del footer centrado
      const textWidth = timesRomanFont.widthOfTextAtSize(footerText, 8);
      currentPage.drawText(footerText, {
        x: (width - textWidth) / 2,
        y: 35,
        size: 8,
        font: timesRomanFont,
        color: rgb(0.58, 0.64, 0.73),
      });
    }

    // Generar el PDF como bytes
    const pdfBytes = await pdfDoc.save();

    // Retornar el PDF como respuesta (convertir Uint8Array a Buffer para compatibilidad con NextResponse)
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${registro.dsNombreDocumento.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Error al generar PDF:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
