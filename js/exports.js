// ============================================================
// EXPORTACIONES - WORD, EXCEL, PDF
// ============================================================

// ---- CONFIGURACIÓN DE COLUMNAS PARA EXPORTAR ----
const DEBT_COLUMNS = {
    fecha: { label: 'Fecha', default: true },
    descripcion: { label: 'Descripción', default: true },
    cliente: { label: 'Cliente', default: true },
    proyecto: { label: 'Proyecto', default: true },
    monto: { label: 'Monto', default: true },
    pagado: { label: 'Pagado', default: true },
    saldo: { label: 'Saldo', default: true },
    metodo: { label: 'Método de pago', default: false },
    comprobante: { label: 'Comprobante', default: false },
    notas: { label: 'Notas', default: false }
};

// ---- OBTENER COLUMNAS SELECCIONADAS ----
function getSelectedDebtColumns() {
    const selected = [];
    for (const [key, col] of Object.entries(DEBT_COLUMNS)) {
        const checkbox = document.getElementById(`col-${key}`);
        if (checkbox && checkbox.checked) {
            selected.push(key);
        }
    }
    return selected;
}

// ---- EXPORTAR DEUDAS CON SELECCIÓN DE COLUMNAS ----
function exportDebtsWithColumns(selectedIds, columns) {
    if (!selectedIds || selectedIds.length === 0) {
        toast('⚠️ No hay deudas seleccionadas.');
        return;
    }

    const selectedPagos = S.pagos.filter(p => selectedIds.includes(p.id));
    if (selectedPagos.length === 0) {
        toast('⚠️ No se encontraron los pagos seleccionados.');
        return;
    }

    const debtsWithBalance = selectedPagos.filter(p => {
        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
        return saldo > 0.01;
    });

    if (debtsWithBalance.length === 0) {
        toast('⚠️ Los registros seleccionados no tienen saldo pendiente.');
        return;
    }

    if (!window.jspdf) {
        toast('La librería de PDF aún está cargando.');
        return;
    }

    // Definir cabeceras según columnas seleccionadas
    const columnMap = {
        fecha: { header: 'Fecha', get: p => fmtDate(p.fecha) },
        descripcion: { header: 'Descripción', get: p => p.descripcion || '—' },
        cliente: { header: 'Cliente', get: p => p.cliente || '—' },
        proyecto: { header: 'Proyecto', get: p => {
            if (p.cotizacionId) {
                const cot = S.cotizaciones.find(c => c.id === p.cotizacionId);
                return cot ? cot.proyecto || '—' : '—';
            }
            return '—';
        }},
        monto: { header: 'Monto', get: p => bs(p.monto) },
        pagado: { header: 'Pagado', get: p => bs(p.montoPagado || 0) },
        saldo: { header: 'Saldo', get: p => bs(Number(p.monto) - Number(p.montoPagado || 0)) },
        metodo: { header: 'Método de pago', get: p => p.metodoPago ? metodoPagoLabel(p.metodoPago) : '—' },
        comprobante: { header: 'Comprobante', get: p => p.comprobante || '—' },
        notas: { header: 'Notas', get: p => p.notas || '—' }
    };

    const selectedColumns = columns || getSelectedDebtColumns();
    if (selectedColumns.length === 0) {
        toast('⚠️ Selecciona al menos una columna para exportar.');
        return;
    }

    // Generar cabeceras
    const headers = selectedColumns.map(col => columnMap[col].header);
    
    // Generar datos
    const tableData = debtsWithBalance.map(p => {
        return selectedColumns.map(col => columnMap[col].get(p));
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const primary = [26, 74, 92];
    let y = 18;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...primary);
    doc.text('REPORTE DE DEUDAS PENDIENTES', pageW / 2, y, { align: 'center' });
    y += 8;

    // Subtítulo
    doc.setFontSize(11);
    doc.setTextColor(60, 66, 71);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ing. Antequera — ${S.config.nombre || 'Consultoría Hidráulica'}`, pageW / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW / 2, y, { align: 'center' });
    y += 10;

    // Línea separadora
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    // Resumen
    const totalDeuda = debtsWithBalance.reduce((s, p) => s + (Number(p.monto) - Number(p.montoPagado || 0)), 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text(`Total de deuda seleccionada: ${bs(totalDeuda)}`, 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 66, 71);
    doc.text(`Número de registros: ${debtsWithBalance.length}`, 15, y);
    y += 10;

    // Definir anchos de columnas según cantidad
    const colCount = headers.length;
    let colWidths = {};
    if (colCount <= 5) {
        // Columnas más anchas
        const width = Math.floor(170 / colCount);
        headers.forEach((h, i) => {
            colWidths[i] = width;
        });
    } else {
        // Columnas más estrechas
        const width = Math.floor(160 / colCount);
        headers.forEach((h, i) => {
            colWidths[i] = Math.max(15, width);
        });
    }

    doc.autoTable({
        startY: y,
        head: [headers],
        body: tableData,
        styles: { 
            fontSize: Math.min(9, Math.max(6, 10 - Math.floor(colCount / 2))), 
            cellPadding: 2, 
            valign: 'middle', 
            textColor: [30, 36, 41] 
        },
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: Math.min(10, Math.max(7, 11 - Math.floor(colCount / 2))) },
        alternateRowStyles: { fillColor: [245, 244, 238] },
        columnStyles: colWidths,
        margin: { left: 12, right: 12 }
    });

    y = doc.lastAutoTable.finalY + 10;

    // Pie de página
    if (y > 250) { doc.addPage();
        y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(100, 105, 110);
    doc.setFont('helvetica', 'italic');
    doc.text('Este reporte incluye únicamente las deudas seleccionadas. Para mayor detalle, contactar al Ing. Antequera.', 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(S.config.rni || 'RNI: 28.106', 15, y);

    // Guardar PDF
    const fileName = `Reporte_Deudas_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
    toast(`📄 Reporte de deudas exportado (${debtsWithBalance.length} registros).`);
}

// ---- VERSIÓN ANTERIOR PARA COMPATIBILIDAD ----
function exportDebts(selectedIds) {
    // Usar todas las columnas por defecto
    const allColumns = Object.keys(DEBT_COLUMNS);
    exportDebtsWithColumns(selectedIds, allColumns);
}

// ---- MODAL PARA SELECCIONAR COLUMNAS ----
function openColumnSelectorModal() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:500px;">
            <div class="modal-h">
                <h3>📋 Seleccionar columnas a exportar</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <p style="font-size:13px;color:var(--text-soft);margin-bottom:16px;">
                    Selecciona las columnas que deseas incluir en el reporte de deudas.
                </p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    ${Object.entries(DEBT_COLUMNS).map(([key, col]) => `
                        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:6px 8px;border-radius:4px;border:1px solid var(--border);background:var(--surface);">
                            <input type="checkbox" id="col-${key}" ${col.default ? 'checked' : ''}>
                            ${col.label}
                        </label>
                    `).join('')}
                </div>
                <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-ghost" id="select-all-columns">Seleccionar todas</button>
                    <button class="btn btn-sm btn-ghost" id="deselect-all-columns">Deseleccionar todas</button>
                    <button class="btn btn-sm btn-ghost" id="reset-default-columns">Restaurar predeterminadas</button>
                </div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-success" id="m-export">📤 Exportar con columnas seleccionadas</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    // Select all
    overlay.querySelector('#select-all-columns').onclick = () => {
        overlay.querySelectorAll('[id^="col-"]').forEach(cb => cb.checked = true);
    };

    // Deselect all
    overlay.querySelector('#deselect-all-columns').onclick = () => {
        overlay.querySelectorAll('[id^="col-"]').forEach(cb => cb.checked = false);
    };

    // Reset to defaults
    overlay.querySelector('#reset-default-columns').onclick = () => {
        Object.entries(DEBT_COLUMNS).forEach(([key, col]) => {
            const cb = overlay.querySelector(`#col-${key}`);
            if (cb) cb.checked = col.default;
        });
    };

    // Export
    overlay.querySelector('#m-export').onclick = () => {
        const selectedIds = Array.from(S.selectedDebts);
        if (selectedIds.length === 0) {
            toast('⚠️ No hay deudas seleccionadas.');
            return;
        }
        
        // Obtener columnas seleccionadas
        const selectedColumns = [];
        overlay.querySelectorAll('[id^="col-"]').forEach(cb => {
            if (cb.checked) {
                const key = cb.id.replace('col-', '');
                selectedColumns.push(key);
            }
        });

        if (selectedColumns.length === 0) {
            toast('⚠️ Selecciona al menos una columna para exportar.');
            return;
        }

        closeModal();
        exportDebtsWithColumns(selectedIds, selectedColumns);
    };
}

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
        <h3>2. EXPERIENCIA EN CONSULTORÍAS EN GENERAL</h3>
        <table>
            <tr><th style="width:5%;">N°</th><th style="width:20%;">Entidad / Empresa</th><th style="width:30%;">Objeto de la Consultoría</th><th style="width:15%;">Monto (Bs.)</th><th style="width:15%;">Cargo</th><th style="width:15%;">Fecha (día/mes/año)</th></tr>
            ${experiencia.length ? experiencia.map((e, i) => `
                <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td>${esc(e.entidad || '')}</td>
                    <td>${esc(e.objeto || '')}</td>
                    <td style="text-align:right;">${Number(e.monto || 0).toFixed(2)}</td>
                    <td>${esc(e.cargo || '')}</td>
                    <td style="text-align:center;">${fmtDateWordShort(e.desde)} - ${fmtDateWordShort(e.hasta)}</td>
                </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center;">No registra experiencia en consultorías</td></tr>'}
        </table>
        <h3>3. EXPERIENCIA EN EL CARGO EN CONSULTORÍAS ESPECÍFICAS</h3>
        <table>
            <tr><th style="width:5%;">N°</th><th style="width:20%;">Entidad / Empresa</th><th style="width:30%;">Objeto de la Consultoría</th><th style="width:15%;">Monto (Bs.)</th><th style="width:15%;">Cargo</th><th style="width:15%;">Fecha (día/mes/año)</th></tr>
            ${experiencia.length ? experiencia.slice(0, 15).map((e, i) => `
                <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td>${esc(e.entidad || '')}</td>
                    <td>${esc(e.objeto || '')}</td>
                    <td style="text-align:right;">${Number(e.monto || 0).toFixed(2)}</td>
                    <td>${esc(e.cargo || '')}</td>
                    <td style="text-align:center;">${fmtDateWordShort(e.desde)} - ${fmtDateWordShort(e.hasta)}</td>
                </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center;">No registra experiencia en el cargo</td></tr>'}
        </table>
        <h3>4. REFERENCIAS LABORALES</h3>
        <table>
            <tr><th>Contratante</th><th>Nombre del Supervisor</th><th>Cargo</th><th>Correo Electrónico</th><th>Teléfono</th></tr>
            ${referencias.length ? referencias.map(r => `
                <tr>
                    <td>${esc(r.contratante || '')}</td>
                    <td>${esc(r.supervisor || '')}</td>
                    <td>${esc(r.cargo || '')}</td>
                    <td>${esc(r.email || '--')}</td>
                    <td>${esc(r.telefono || '')}</td>
                </tr>
            `).join('') : '<tr><td colspan="5" style="text-align:center;">No registra referencias laborales</td></tr>'}
        </table>
        <div class="firma">
            <div class="linea"></div>
            <div><strong>${esc(dp.nombre || config.nombre || '')}</strong></div>
            <div class="cargo">${esc(dp.profesion || '')}</div>
            <div class="cargo">${esc(dp.registroProfesional || config.rni || '')}</div>
        </div>
        `;
    } else if (tipo === 'participacion') {
        html += `
        <h1>${titulo}</h1>
        <p style="text-align:justify;font-size:10pt;margin-bottom:12px;">
            Luego de examinar la documentación de la invitación, la cual declaro aceptar y conocer, presento mi participación para realizar el servicio de consultoría de acuerdo con las características, requerimientos y plazos detallados en los Términos de Referencia.
        </p>
        <p style="text-align:justify;font-size:10pt;margin-bottom:12px;">
            Para el efecto presento mi hoja de vida <strong>debidamente firmada y fechada</strong>.
        </p>
        <table style="border:none;">
            <tr><td style="border:none;width:40%;font-weight:bold;">Nombre completo:</td><td style="border:none;">${esc(dp.nombre || config.nombre || '')}</td></tr>
            <tr><td style="border:none;font-weight:bold;">Lugar y fecha de nacimiento:</td><td style="border:none;">${esc(dp.lugarExpedicion || '')}, ${fmtDateWord(dp.fechaNacimiento)}</td></tr>
            <tr><td style="border:none;font-weight:bold;">Nacionalidad:</td><td style="border:none;">${esc(dp.nacionalidad || '')}</td></tr>
            <tr><td style="border:none;font-weight:bold;">N° Cédula de Identidad y lugar de expedición:</td><td style="border:none;">${esc(dp.ci || '')} ${dp.lugarExpedicion ? esc(dp.lugarExpedicion) : ''}</td></tr>
            <tr><td style="border:none;font-weight:bold;">País de residencia:</td><td style="border:none;">Bolivia</td></tr>
            <tr><td style="border:none;font-weight:bold;">Dirección:</td><td style="border:none;">${esc(dp.direccion || '')}</td></tr>
            <tr><td style="border:none;font-weight:bold;">Teléfono:</td><td style="border:none;">${esc(dp.telefono || '')}</td></tr>
            <tr><td style="border:none;font-weight:bold;">Correo electrónico:</td><td style="border:none;">${esc(dp.email || '')}</td></tr>
        </table>
        <h3 style="margin-top:16px;">1. FORMACIÓN PROFESIONAL</h3>
        <table>
            <tr><th style="width:22%;">Estudios realizados</th><th style="width:18%;">Especialidad o área</th><th style="width:20%;">Entidad educativa / Universidad</th><th style="width:15%;">Fecha de emisión del título</th><th style="width:25%;">Aspectos detallados</th></tr>
            ${formacion.length ? formacion.map(f => `
                <tr>
                    <td>${esc(f.grado || '')}</td>
                    <td>${esc(f.especialidad || '')}</td>
                    <td>${esc(f.institucion || '')}</td>
                    <td style="text-align:center;">${fmtDateWordShort(f.fechaTitulo || f.hasta)}</td>
                    <td>${esc(f.detalles || '')}</td>
                </tr>
            `).join('') : '<tr><td colspan="5" style="text-align:center;">No registra formación profesional</td></tr>'}
        </table>
        <h3>CURSOS DE ESPECIALIZACIÓN</h3>
        <table>
            <tr><th style="width:25%;">Universidad / Institución</th><th style="width:15%;">Desde</th><th style="width:15%;">Hasta</th><th style="width:30%;">Nombre del Curso</th><th style="width:15%;">Duración en Horas</th></tr>
            ${cursos.length ? cursos.map(c => `
                <tr>
                    <td>${esc(c.institucion || '')}</td>
                    <td style="text-align:center;">${fmtDateWordShort(c.desde)}</td>
                    <td style="text-align:center;">${fmtDateWordShort(c.hasta)}</td>
                    <td>${esc(c.curso || '')}</td>
                    <td style="text-align:center;">${esc(c.horas || '')}</td>
                </tr>
            `).join('') : '<tr><td colspan="5" style="text-align:center;">No registra cursos de especialización</td></tr>'}
        </table>
        <h3>2. EXPERIENCIA PROFESIONAL</h3>
        <h4 style="font-size:10pt;margin:6px 0;font-weight:bold;">Experiencia Profesional General</h4>
        <table>
            <tr><th style="width:20%;">Fecha de emisión del título</th><th style="width:20%;">Tiempo desde la emisión</th><th style="width:60%;">Aspectos detallados</th></tr>
            <tr>
                <td style="text-align:center;">${formacion.length > 0 ? fmtDateWordShort(formacion[0].fechaTitulo || formacion[0].hasta) : ''}</td>
                <td style="text-align:center;">${añosDesdeTitulo}</td>
                <td>${añosDesdeTitulo} de la obtención del título académico y en provisión nacional como ${esc(dp.profesion || '')}</td>
            </tr>
        </table>
        <h4 style="font-size:10pt;margin:6px 0;font-weight:bold;">Experiencia Profesional Específica</h4>
        <table>
            <tr><th style="width:18%;">Contratante o entidad</th><th style="width:25%;">Objeto de la consultoría</th><th style="width:15%;">Cargo en el proyecto</th><th style="width:22%;">Descripción del trabajo realizado</th><th style="width:10%;">Desde</th><th style="width:10%;">Hasta</th></tr>
            ${experiencia.length ? experiencia.slice(0, 15).map(e => `
                <tr>
                    <td>${esc(e.entidad || '')}</td>
                    <td>${esc(e.objeto || '')}</td>
                    <td>${esc(e.cargo || '')}</td>
                    <td>${esc(e.descripcion || '')}</td>
                    <td style="text-align:center;">${fmtDateWordShort(e.desde)}</td>
                    <td style="text-align:center;">${e.enCurso ? 'En curso' : fmtDateWordShort(e.hasta)}</td>
                </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center;">No registra experiencia profesional específica</td></tr>'}
        </table>
        <div style="margin-top:12px;padding:8px 10px;border:1px solid #ccc;font-size:9pt;">
            <strong>Experiencia específica de ${añosDesdeTitulo || '4'} años, contabilizados a partir de la obtención del primer título académico, en trabajos relacionados a:</strong>
            <p style="margin:4px 0;">Estudios hidrológicos o hidrogeológicos, Modelación hidrológica, Balances hídricos, Calidad de agua, Gestión integrada de recursos hídricos, o Manejo integral de cuencas.</p>
        </div>
        <h3>3. REFERENCIAS LABORALES</h3>
        <table>
            <tr><th style="width:20%;">Contratante</th><th style="width:25%;">Nombre del supervisor</th><th style="width:20%;">Cargo</th><th style="width:20%;">Correo electrónico</th><th style="width:15%;">Teléfono</th></tr>
            ${referencias.length ? referencias.slice(0, 3).map(r => `
                <tr>
                    <td>${esc(r.contratante || '')}</td>
                    <td>${esc(r.supervisor || '')}</td>
                    <td>${esc(r.cargo || '')}</td>
                    <td>${esc(r.email || '--')}</td>
                    <td>${esc(r.telefono || '')}</td>
                </tr>
            `).join('') : '<tr><td colspan="5" style="text-align:center;">No registra referencias laborales</td></tr>'}
        </table>
        <div style="margin-top:20px;font-size:9pt;text-align:justify;">
            <p>Entiendo y reconozco que el Contratante no está obligado a aceptar la presente participación y que la selección del Consultor para el presente servicio de consultoría se basará en la mejor calificación de antecedentes académicos y de experiencia.</p>
        </div>
        <div class="firma">
            <div class="linea"></div>
            <div><strong>${esc(dp.nombre || config.nombre || '')}</strong></div>
            <div class="cargo">${esc(dp.profesion || '')}</div>
            <div class="cargo">${esc(dp.registroProfesional || config.rni || '')}</div>
            <div class="cargo">NIT: ${esc(dp.nit || '')}</div>
            <div class="fecha-firma">Fecha: ${new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
        `;
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
// ---- EXPORTAR PDF - COTIZACIONES (CON PLAZO) ----
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

    // TABLA DE ÍTEMS CON PLAZO
    doc.autoTable({
        startY: y,
        head: [['Nº', 'Actividad', 'P.U. [Bs]', 'Unidad', 'Cant.', 'Plazo (días)', 'Total [Bs]']],
        body: c.items.map((it, i) => [
            String(i + 1),
            it.actividad || '',
            (Number(it.pu) || 0).toFixed(2),
            it.unidad || '',
            String(it.cantidad || 0),
            String(it.plazo || 0),
            ((Number(it.pu) || 0) * (Number(it.cantidad) || 0)).toFixed(2)
        ]),
        styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'top', textColor: [30, 36, 41] },
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 244, 238] },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 75 },
            2: { cellWidth: 20, halign: 'right' },
            3: { cellWidth: 22 },
            4: { cellWidth: 14, halign: 'center' },
            5: { cellWidth: 18, halign: 'center' },
            6: { cellWidth: 20, halign: 'right' }
        },
        margin: { left: 15, right: 15 }
    });
    y = doc.lastAutoTable.finalY + 8;

    const subtotal = cotSubtotal(c);
    const total = cotTotal(c);
    const plazoTotal = c.items ? c.items.reduce((sum, item) => sum + (Number(item.plazo) || 0), 0) : 0;

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
    y += 6;
    
    // MOSTRAR PLAZO TOTAL
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 36, 41);
    doc.text(`Plazo total: ${plazoTotal} días`, pageW - 15, y, { align: 'right' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 36, 41);
    doc.text(`Plazo a partir del anticipo: ${plazoTotal} días`, 15, y);
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
