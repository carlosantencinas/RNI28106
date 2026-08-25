// ============================================================
// EXPORTACIONES - WORD, EXCEL, PDF
// ============================================================

// ---- EXPORTAR A WORD (A-5, A-7, PARTICIPACIÓN) ----
function generarHTMLWord(tipo) {
    const dp = S.datosPersonales || {};
    const config = S.config || {};
    const experiencia = S.experiencia || [];
    const formacion = S.formacion || [];
    const cursos = S.cursos || [];
    const referencias = S.referencias || [];
    const edad = calcularEdad(dp.fechaNacimiento);

    let añosDesdeTitulo = '';
    if (dp.fechaNacimiento) {
        const nac = new Date(dp.fechaNacimiento + 'T00:00:00');
        if (!isNaN(nac)) {
            const hoy = new Date();
            let edadCalc = hoy.getFullYear() - nac.getFullYear();
            añosDesdeTitulo = edadCalc + ' años';
        }
    }

    let titulo = '', subtitulo = '';
    if (tipo === 'a5') { titulo = 'FORMULARIO A-5'; subtitulo = 'HOJA DE VIDA DEL ESPECIALISTA'; }
    else if (tipo === 'a7') { titulo = 'FORMULARIO A-7'; subtitulo = 'EXPERIENCIA LABORAL DEL ESPECIALISTA'; }
    else if (tipo === 'participacion') { titulo = 'FORMULARIO DE PARTICIPACIÓN'; subtitulo = ''; }

    let html = `
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Times New Roman', Times, serif; margin: 30px; font-size: 10pt; line-height: 1.4; }
            h1 { text-align: center; font-size: 14pt; text-transform: uppercase; margin-bottom: 2px; }
            h2 { text-align: center; font-size: 11pt; font-weight: normal; margin-top: 0; margin-bottom: 16px; }
            h3 { font-size: 11pt; margin-top: 14px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9pt; }
            th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: middle; }
            th { background: #e8e8e8; font-weight: bold; text-align: center; }
            .label-cell { font-weight: bold; width: 30%; }
            .firma { margin-top: 25px; text-align: center; }
            .firma .linea { width: 200px; border-top: 1px solid #000; margin: 25px auto 6px; }
            .firma .cargo { font-size: 9pt; }
            .nota { font-size: 8pt; color: #555; margin-top: 10px; }
            .fecha-firma { text-align: right; font-size: 9pt; margin-top: 15px; }
        </style>
    </head>
    <body>
    `;

    if (tipo === 'a5') {
        html += `
        <h1>${titulo}</h1>
        <h2>${subtitulo}</h2>
        <h3>1. DATOS GENERALES</h3>
        <table>
            <tr><td class="label-cell">Nombre Completo</td><td>${esc(dp.nombre || config.nombre || '')}</td></tr>
            <tr><td class="label-cell">Cédula de Identidad</td><td>${esc(dp.ci || '')} - ${esc(dp.lugarExpedicion || '')}</td></tr>
            <tr><td class="label-cell">Edad</td><td>${edad || ''} años</td></tr>
            <tr><td class="label-cell">Nacionalidad</td><td>${esc(dp.nacionalidad || '')}</td></tr>
            <tr><td class="label-cell">Profesión</td><td>${esc(dp.profesion || '')}</td></tr>
            <tr><td class="label-cell">Número de Registro Profesional</td><td>${esc(dp.registroProfesional || config.rni || '')}</td></tr>
        </table>
        <h3>2. FORMACIÓN ACADÉMICA</h3>
        <table>
            <tr><th>Universidad / Institución</th><th>Fechas</th><th>Grado Académico</th><th>Título en Provisión Nacional</th></tr>
            ${formacion.length ? formacion.map(f => `
                <tr>
                    <td>${esc(f.institucion || '')}</td>
                    <td style="text-align:center;">${fmtDateWordShort(f.desde)} - ${fmtDateWordShort(f.hasta)}</td>
                    <td>${esc(f.grado || '')}</td>
                    <td style="text-align:center;">${esc(f.titulo || f.grado || '')}</td>
                </tr>
            `).join('') : '<tr><td colspan="4" style="text-align:center;">No registra formación académica</td></tr>'}
        </table>
        <h3>3. CURSOS DE ESPECIALIZACIÓN</h3>
        <table>
            <tr><th>Universidad / Institución</th><th>Fechas</th><th>Nombre del Curso</th><th>Duración en Horas</th></tr>
            ${cursos.length ? cursos.map(c => `
                <tr>
                    <td>${esc(c.institucion || '')}</td>
                    <td style="text-align:center;">${fmtDateWordShort(c.desde)} - ${fmtDateWordShort(c.hasta)}</td>
                    <td>${esc(c.curso || '')}</td>
                    <td style="text-align:center;">${esc(c.horas || '')}</td>
                </tr>
            `).join('') : '<tr><td colspan="4" style="text-align:center;">No registra cursos de especialización</td></tr>'}
        </table>
        <div class="firma">
            <div class="linea"></div>
            <div><strong>${esc(dp.nombre || config.nombre || '')}</strong></div>
            <div class="cargo">${esc(dp.profesion || '')}</div>
            <div class="cargo">${esc(dp.registroProfesional || config.rni || '')}</div>
        </div>
        `;
    } else if (tipo === 'a7') {
        // ... (igual que en el archivo original)
    } else if (tipo === 'participacion') {
        // ... (igual que en el archivo original)
    }

    html += `
        <div class="nota">Documento generado desde el Gestor de Licitaciones - Ing. Antequera</div>
    </body>
    </html>
    `;
    return html;
}

function exportWord(tipo) {
    const htmlContent = generarHTMLWord(tipo);
    const fecha = new Date().toISOString().slice(0,10);
    const filename = `Ing_Antequera_${tipo.toUpperCase()}_${fecha}.doc`;
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast('✅ Documento Word exportado: ' + filename);
}

// ---- EXPORTAR EXCEL - LICITACIONES ----
function exportLicitacionesExcel() {
    if (!S.licitaciones.length) { toast('No hay licitaciones para exportar.'); return; }
    const data = S.licitaciones.map(l => ({
        'Convocatoria': l.convocatoria || '',
        'Proyecto': l.proyecto || '',
        'Entidad': l.entidad || '',
        'Fecha': fmtDateExcel(l.fecha),
        'Estado': l.estado || '',
        'Monto (Bs)': Number(l.monto || 0),
        'Observaciones': l.observaciones || ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Licitaciones');
    XLSX.writeFile(wb, `Licitaciones_Ing_Antequera_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast('✅ Excel exportado.');
}

// ---- EXPORTAR EXCEL - CONTACTOS ----
function exportContactosExcel() {
    if (!S.contactos.length) { toast('No hay contactos para exportar.'); return; }
    const data = S.contactos.map(c => ({
        'Nombre': c.nombre || '',
        'Empresa': c.empresa || '',
        'Cargo': c.cargo || '',
        'Teléfono': c.telefono || '',
        'Correo': c.email || '',
        'Notas': c.notas || ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
    XLSX.writeFile(wb, `Contactos_Ing_Antequera_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast('✅ Excel exportado.');
}

// ---- EXPORTAR PDF - COTIZACIONES ----
function exportPDF(c) {
    if (!c) { toast('No se encontró la cotización.'); return; }
    if (!window.jspdf) { toast('La librería de PDF aún está cargando.'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const primary = [26, 74, 92];
    let y = 18;

    if (S.config.logo) {
        try { doc.addImage(S.config.logo, 'PNG', 15, 10, 16, 16); } catch (e) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...primary);
    doc.text('COTIZACIÓN', pageW / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(12);
    doc.setTextColor(30, 36, 41);
    const titleLines = doc.splitTextToSize(c.titulo || '', 170);
    doc.text(titleLines, pageW / 2, y, { align: 'center' });
    y += titleLines.length * 6 + 4;

    doc.setDrawColor(...primary);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Proyecto:', 15, y);
    doc.setFont('helvetica', 'normal');
    const projLines = doc.splitTextToSize(c.proyecto || '—', 150);
    doc.text(projLines, 38, y);
    y += Math.max(5, projLines.length * 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(c.cliente || '—', 38, y);
    y += 8;

    doc.autoTable({
        startY: y,
        head: [['Nº', 'Actividad', 'P.U. [Bs]', 'Unidad', 'Cant.', 'Total [Bs]']],
        body: c.items.map((it, i) => [
            String(i + 1),
            it.actividad || '',
            (Number(it.pu) || 0).toFixed(2),
            it.unidad || '',
            String(it.cantidad || 0),
            ((Number(it.pu) || 0) * (Number(it.cantidad) || 0)).toFixed(2)
        ]),
        styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'top', textColor: [30, 36, 41] },
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 244, 238] },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 90 },
            2: { cellWidth: 22, halign: 'right' },
            3: { cellWidth: 28 },
            4: { cellWidth: 14, halign: 'center' },
            5: { cellWidth: 22, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
    });
    y = doc.lastAutoTable.finalY + 8;

    const subtotal = cotSubtotal(c);
    const total = cotTotal(c);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 66, 71);
    doc.text(`Subtotal [Bs]: ${subtotal.toFixed(2)}`, pageW - 15, y, { align: 'right' });
    y += 6;
    if (Number(c.descuento) > 0) {
        doc.text(`Descuento / anticipo [Bs]: ${Number(c.descuento).toFixed(2)}`, pageW - 15, y, { align: 'right' });
        y += 6;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text(`Monto final [Bs]: ${total.toFixed(2)}`, pageW - 15, y, { align: 'right' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 36, 41);
    doc.text(`Plazo a partir del anticipo: ${c.plazoDias||0} días`, 15, y);
    y += 10;

    if (c.entregables) {
        if (y > 245) { doc.addPage();
            y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 36, 41);
        doc.text('Producto a presentar', 15, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 66, 71);
        const delLines = doc.splitTextToSize(c.entregables, pageW - 30);
        doc.text(delLines, 15, y);
        y += delLines.length * 4 + 6;
    }

    if (c.nota) {
        if (y > 255) { doc.addPage();
            y = 20; }
        doc.setFontSize(8);
        doc.setTextColor(100, 105, 110);
        const noteLines = doc.splitTextToSize(`Nota: ${c.nota}`, pageW - 30);
        doc.text(noteLines, 15, y);
        y += noteLines.length * 4 + 10;
    }

    if (y > 255) { doc.addPage();
        y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(30, 36, 41);
    doc.text(`Fecha: ${fmtDate(c.fecha)}`, 15, y);
    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.text(S.config.nombre || '', 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(S.config.rni || '', 15, y);

    const safeName = (c.proyecto || 'cotizacion').replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
    doc.save(`Cotizacion_${safeName}_${c.fecha}.pdf`);
    toast('📄 PDF generado correctamente.');
}

// ---- EXPORTAR HOJA DE VIDA (EXCEL) ----
function exportHojaVida() {
    try {
        const wb = XLSX.utils.book_new();

        const dpData = [
            ['HOJA DE VIDA ESPECIALISTA HIDRÓLOGO'],
            [''],
            ['1. DATOS GENERALES'],
            [''],
            ['Nombre Completo', S.datosPersonales.nombre || ''],
            ['Cédula de Identidad', S.datosPersonales.ci || ''],
            ['Lugar de Expedición', S.datosPersonales.lugarExpedicion || ''],
            ['Fecha de Nacimiento', S.datosPersonales.fechaNacimiento ? fmtDateExcel(S.datosPersonales.fechaNacimiento) : ''],
            ['Edad', calcularEdad(S.datosPersonales.fechaNacimiento) || ''],
            ['Nacionalidad', S.datosPersonales.nacionalidad || ''],
            ['Profesión', S.datosPersonales.profesion || ''],
            ['Número de Registro Profesional', S.datosPersonales.registroProfesional || '']
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(dpData);
        ws1['!cols'] = [{ wch: 32 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Datos Generales');

        const faData = [
            ['2. FORMACIÓN ACADÉMICA'],
            [''],
            ['Universidad / Institución', 'Desde', 'Hasta', 'Grado Académico']
        ];
        S.formacion.forEach(f => {
            faData.push([f.institucion, fmtDateExcel(f.desde), fmtDateExcel(f.hasta), f.grado]);
        });
        const ws2 = XLSX.utils.aoa_to_sheet(faData);
        ws2['!cols'] = [{ wch: 50 }, { wch: 16 }, { wch: 16 }, { wch: 55 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Formación Académica');

        const ceData = [
            ['3. CURSOS DE ESPECIALIZACIÓN'],
            [''],
            ['Universidad / Institución', 'Desde', 'Hasta', 'Nombre del Curso', 'Duración (Horas)']
        ];
        S.cursos.forEach(c => {
            ceData.push([c.institucion, fmtDateExcel(c.desde), fmtDateExcel(c.hasta), c.curso, c.horas]);
        });
        const ws3 = XLSX.utils.aoa_to_sheet(ceData);
        ws3['!cols'] = [{ wch: 48 }, { wch: 16 }, { wch: 16 }, { wch: 55 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Cursos Especialización');

        const expData = [
            ['4. EXPERIENCIA GENERAL'],
            [''],
            ['N°', 'Entidad / Empresa', 'Objeto', 'Monto (Bs)', 'Cargo', 'Desde', 'Hasta', 'Estado', 'Certificado']
        ];
        S.experiencia.sort((a, b) => (a.desde || '').localeCompare(b.desde || ''));
        S.experiencia.forEach((e, i) => {
            expData.push([
                i + 1,
                e.entidad,
                e.objeto,
                Number(e.monto).toFixed(2),
                e.cargo,
                fmtDateExcel(e.desde),
                e.enCurso ? 'En curso' : fmtDateExcel(e.hasta),
                e.enCurso ? 'En curso' : (e.certificado ? 'Certificado' : 'Sin certificado'),
                e.certificado ? 'Sí' : 'No'
            ]);
        });
        const ws4 = XLSX.utils.aoa_to_sheet(expData);
        ws4['!cols'] = [{ wch: 6 }, { wch: 34 }, { wch: 55 }, { wch: 18 }, { wch: 34 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Experiencia');

        const fileName = `Hoja_Vida_Ing_Antequera_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast('✅ Hoja de vida exportada a Excel con todas las secciones.');
    } catch (e) {
        console.error(e);
        toast('Error al exportar: ' + e.message);
    }
}
