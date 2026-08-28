// ============================================================
// VIEWS - Todas las vistas
// ============================================================

// ---- FUNCIÓN PARA RENDERIZAR GANTT ----
function renderGantt() {
    const now = new Date();
    const ganttYears = S.ganttYears || 10;
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - ganttYears);

    const expFiltrada = S.experiencia.filter(e => new Date(e.desde + 'T00:00:00') >= startDate).sort((a, b) => (a.desde || '').localeCompare(b.desde || ''));
    const formacionFiltrada = S.formacion.filter(f => new Date(f.desde + 'T00:00:00') >= startDate).sort((a, b) => (a.desde || '').localeCompare(b.desde || ''));
    const cursosFiltrados = S.cursos.filter(c => new Date(c.desde + 'T00:00:00') >= startDate).sort((a, b) => (a.desde || '').localeCompare(b.desde || ''));

    let minDate = startDate;
    let maxDate = now;
    const allItems = [...expFiltrada, ...formacionFiltrada, ...cursosFiltrados];
    if (allItems.length) {
        const first = new Date(allItems[0].desde + 'T00:00:00');
        const last = new Date(allItems[allItems.length - 1].hasta + 'T00:00:00');
        if (first < minDate) minDate = first;
        if (last > maxDate) maxDate = last;
    }
    const rangeMs = Math.max(1, maxDate.getTime() - minDate.getTime());

    if (!allItems.length) {
        return '<p style="color:var(--text-soft);font-size:13px;">No hay elementos en el rango seleccionado.</p>';
    }

    let html = `
        <div class="gantt-legend">
            <span><span class="dot experiencia"></span> Proyectos completados</span>
            <span><span class="dot experiencia-active"></span> Proyectos en curso</span>
            <span><span class="dot experiencia-en-curso"></span> Proyectos "En curso"</span>
            ${S.ganttShowEducacion ? `<span><span class="dot educacion"></span> Formación</span>` : ''}
            ${S.ganttShowCursos ? `<span><span class="dot curso"></span> Cursos</span>` : ''}
            <span style="margin-left:auto;font-size:11px;color:var(--text-soft);">${allItems.length} elementos mostrados</span>
        </div>
        <div class="gantt-container">
    `;

    expFiltrada.forEach(e => {
        const desde = new Date(e.desde + 'T00:00:00');
        const hasta = e.enCurso ? new Date() : new Date(e.hasta + 'T00:00:00');
        const startPct = Math.max(0, ((desde.getTime() - minDate.getTime()) / rangeMs) * 100);
        const widthPct = Math.max(2, ((hasta.getTime() - desde.getTime()) / rangeMs) * 100);
        const isActive = hasta >= now;
        const isEnCurso = e.enCurso === true;
        const dias = e.enCurso ? 'En curso' : diffDays(e.desde, e.hasta) + 'd';
        html += `<div class="gantt-row">
            <div class="gantt-label">
                ${esc(e.objeto.slice(0, 30))}${e.objeto.length>30?'…':''}
                <span class="gantt-sub">${esc(e.entidad)} · ${esc(e.cargo)}</span>
            </div>
            <div class="gantt-track">
                <div class="gantt-bar experiencia ${isEnCurso ? 'en-curso' : (isActive ? 'active' : '')}" style="left:${startPct}%;width:${Math.min(widthPct, 100)}%;">
                    ${fmtDateShort(e.desde)} ${isEnCurso ? '→ En curso' : '— ' + fmtDateShort(e.hasta)}
                </div>
            </div>
            <div class="gantt-duration">${dias}</div>
        </div>`;
    });

    if (S.ganttShowEducacion) {
        formacionFiltrada.forEach(f => {
            const desde = new Date(f.desde + 'T00:00:00');
            const hasta = new Date(f.hasta + 'T00:00:00');
            const startPct = Math.max(0, ((desde.getTime() - minDate.getTime()) / rangeMs) * 100);
            const widthPct = Math.max(2, ((hasta.getTime() - desde.getTime()) / rangeMs) * 100);
            const dias = diffDays(f.desde, f.hasta);
            html += `<div class="gantt-row">
                <div class="gantt-label">
                    🎓 ${esc(f.grado.slice(0, 25))}${f.grado.length>25?'…':''}
                    <span class="gantt-sub">${esc(f.institucion)}</span>
                </div>
                <div class="gantt-track">
                    <div class="gantt-bar educacion" style="left:${startPct}%;width:${Math.min(widthPct, 100)}%;">
                        ${fmtDateShort(f.desde)} — ${fmtDateShort(f.hasta)}
                    </div>
                </div>
                <div class="gantt-duration">${dias}d</div>
            </div>`;
        });
    }

    if (S.ganttShowCursos) {
        cursosFiltrados.forEach(c => {
            const desde = new Date(c.desde + 'T00:00:00');
            const hasta = new Date(c.hasta + 'T00:00:00');
            const startPct = Math.max(0, ((desde.getTime() - minDate.getTime()) / rangeMs) * 100);
            const widthPct = Math.max(2, ((hasta.getTime() - desde.getTime()) / rangeMs) * 100);
            const dias = diffDays(c.desde, c.hasta);
            html += `<div class="gantt-row">
                <div class="gantt-label">
                    📚 ${esc(c.curso.slice(0, 25))}${c.curso.length>25?'…':''}
                    <span class="gantt-sub">${esc(c.institucion)} · ${c.horas}h</span>
                </div>
                <div class="gantt-track">
                    <div class="gantt-bar curso" style="left:${startPct}%;width:${Math.min(widthPct, 100)}%;">
                        ${fmtDateShort(c.desde)} — ${fmtDateShort(c.hasta)}
                    </div>
                </div>
                <div class="gantt-duration">${dias}d</div>
            </div>`;
        });
    }

    html += `</div>`;
    return html;
}

// ---- FUNCIÓN PARA RENDERIZAR TABLA DE EXPERIENCIA ----
function renderExperienciaTabla() {
    const rows = applyExpFiltersAndSort(S.experiencia || []);
    
    if (!rows.length) {
        return `<div class="empty">${ICONS.empty}<div>Sin proyectos que coincidan con los filtros.</div></div>`;
    }

    let html = `<div class="table-wrap"><table>
        <thead>
            <tr>
                <th onclick="toggleExpSort('entidad')" class="${S.expSort.column === 'entidad' ? 'active' : ''}">Entidad <span class="sort-icon">${S.expSort.column === 'entidad' ? (S.expSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                <th onclick="toggleExpSort('objeto')" class="${S.expSort.column === 'objeto' ? 'active' : ''}">Objeto <span class="sort-icon">${S.expSort.column === 'objeto' ? (S.expSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                <th onclick="toggleExpSort('monto')" class="${S.expSort.column === 'monto' ? 'active' : ''}" class="tright">Monto <span class="sort-icon">${S.expSort.column === 'monto' ? (S.expSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                <th onclick="toggleExpSort('cargo')" class="${S.expSort.column === 'cargo' ? 'active' : ''}">Cargo <span class="sort-icon">${S.expSort.column === 'cargo' ? (S.expSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                <th onclick="toggleExpSort('desde')" class="${S.expSort.column === 'desde' ? 'active' : ''}">Desde <span class="sort-icon">${S.expSort.column === 'desde' ? (S.expSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                <th onclick="toggleExpSort('hasta')" class="${S.expSort.column === 'hasta' ? 'active' : ''}">Hasta <span class="sort-icon">${S.expSort.column === 'hasta' ? (S.expSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            ${rows.map(e => `
                <tr>
                    <td style="font-weight:500;">${esc(e.entidad)}</td>
                    <td style="word-wrap:break-word;white-space:normal;">${esc(e.objeto)}</td>
                    <td class="tright tnum">${bs(e.monto)}</td>
                    <td style="font-size:12px;">${esc(e.cargo)}</td>
                    <td class="tnum" style="white-space:nowrap;">${fmtDate(e.desde)}</td>
                    <td class="tnum" style="white-space:nowrap;">${e.enCurso ? 'En curso' : fmtDate(e.hasta)}</td>
                    <td><span class="stamp ${e.enCurso ? 'en-curso' : (e.certificado ? 'certificado' : 'pendiente')}">${e.enCurso ? 'En curso' : (e.certificado ? 'Certificado' : 'Sin certificado')}</span></td>
                    <td>
                        <div class="rowactions">
                            <button class="iconbtn" title="Editar" data-edit-exp="${e.id}">${ICONS.edit}</button>
                            <button class="iconbtn" title="Eliminar" data-del-exp="${e.id}">${ICONS.trash}</button>
                        </div>
                    </td>
                </tr>`).join('')}
        </tbody>
    </table></div>`;
    
    return html;
}

// ---- DASHBOARD ----
function viewDashboard() {
    const cots = S.cotizaciones;
    const pagos = S.pagos;
    const exp = S.experiencia;
    const lic = S.licitaciones || [];

    function calcularDiasNoSolapados(experiencias) {
        const certificadas = experiencias.filter(e => e.certificado === true && e.desde && e.hasta);
        if (certificadas.length === 0) return { totalDias: 0, years: 0 };
        const intervalos = certificadas.map(e => ({
            desde: new Date(e.desde + 'T00:00:00'),
            hasta: new Date(e.hasta + 'T00:00:00'),
            enCurso: e.enCurso || false
        })).filter(i => !isNaN(i.desde) && !isNaN(i.hasta))
          .sort((a, b) => a.desde - b.desde);
        if (intervalos.length === 0) return { totalDias: 0, years: 0 };
        const fusionados = [];
        let actual = { ...intervalos[0] };
        for (let i = 1; i < intervalos.length; i++) {
            const siguiente = intervalos[i];
            if (siguiente.desde <= actual.hasta) {
                if (siguiente.hasta > actual.hasta) {
                    actual.hasta = siguiente.hasta;
                }
            } else {
                fusionados.push(actual);
                actual = { ...siguiente };
            }
        }
        fusionados.push(actual);
        let totalDias = 0;
        fusionados.forEach(intervalo => {
            const diff = Math.ceil((intervalo.hasta - intervalo.desde) / (1000 * 60 * 60 * 24));
            totalDias += Math.max(0, diff);
        });
        const years = totalDias / 365.25;
        return { totalDias, years };
    }

    const { totalDias: totalExpDays, years: yearsExp } = calcularDiasNoSolapados(S.experiencia);
    const formacionConGrado = S.formacion || [];
    const maestrias = formacionConGrado.filter(f => f.grado && f.grado.toLowerCase().includes('maestría')).length;
    const totalPostgrados = formacionConGrado.length;

    const totalCotizado = cots.reduce((s, c) => s + cotTotal(c), 0);
    const totalAceptado = cots.filter(c => c.estado === 'aceptada').reduce((s, c) => s + cotTotal(c), 0);
    const totalCobrado = pagos.reduce((s, p) => s + Number(p.montoPagado || 0), 0);
    const totalPorCobrar = pagos.reduce((s, p) => s + Math.max(0, Number(p.monto) - Number(p.montoPagado || 0)), 0);
    const totalExperiencia = exp.reduce((s, e) => s + Number(e.monto || 0), 0);
    const edad = calcularEdad(S.datosPersonales.fechaNacimiento);

    const adjudicadas = lic.filter(l => l.estado === 'adjudicada').length;
    const evaluacion = lic.filter(l => l.estado === 'evaluacion').length;
    const noAdjudicadas = lic.filter(l => l.estado === 'no-adjudicada').length;
    const totalLicitaciones = lic.length;

    // ---- AVANCE DE PAGOS PENDIENTES ----
    const cotizacionesAceptadas = cots.filter(c => c.estado === 'aceptada');
    const avancePagos = cotizacionesAceptadas.map(c => {
        const montoTotal = cotTotal(c);
        const pagosRelacionados = pagos.filter(p => p.cotizacionId === c.id);
        const totalPagado = pagosRelacionados.reduce((s, p) => s + Number(p.montoPagado || 0), 0);
        const porcentaje = montoTotal > 0 ? (totalPagado / montoTotal) * 100 : 0;
        const saldoPendiente = montoTotal - totalPagado;
        return {
            ...c,
            montoTotal,
            totalPagado,
            saldoPendiente,
            porcentaje: Math.min(100, porcentaje),
            pagos: pagosRelacionados,
            estaPagado: saldoPendiente <= 0.01
        };
    }).filter(item => !item.estaPagado);

    function renderAvancePagos() {
        if (!avancePagos.length) {
            return `<div class="empty" style="padding:20px;">${ICONS.empty}<div>🎉 No hay cotizaciones aceptadas pendientes de pago.</div></div>`;
        }

        let html = '';
        avancePagos.forEach(item => {
            const ultimoPago = item.pagos.length > 0 ? item.pagos[item.pagos.length - 1] : null;
            
            html += `
            <div style="margin-bottom:20px;padding:16px 18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div style="flex:1;min-width:200px;">
                        <div style="font-weight:600;font-size:15px;color:var(--primary);">${esc(item.titulo)}</div>
                        <div style="font-size:12px;color:var(--text-soft);margin-top:2px;">
                            ${esc(item.cliente)} - ${esc(item.proyecto || '')}
                        </div>
                        ${ultimoPago ? `
                            <div style="font-size:12px;color:var(--text-soft);margin-top:4px;">
                                ${fmtDate(ultimoPago.fecha)} - ${esc(ultimoPago.descripcion || '')}
                                ${ultimoPago.metodoPago ? ` · <span class="metodo-pago-badge ${ultimoPago.metodoPago}">${metodoPagoLabel(ultimoPago.metodoPago)}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div style="text-align:right;min-width:120px;">
                        <div style="font-weight:600;font-size:16px;color:var(--primary);">
                            ${bs(item.totalPagado)} / ${bs(item.montoTotal)}
                        </div>
                        <div style="font-size:12px;color:var(--text-soft);">
                            Saldo: <strong>${bs(item.saldoPendiente)}</strong>
                        </div>
                    </div>
                </div>
                <div style="margin-top:10px;height:6px;background:var(--gantt-bg);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;border-radius:4px;background:${item.porcentaje >= 80 ? 'var(--gantt-active)' : 'var(--accent)'};width:${item.porcentaje}%;transition:width 0.5s ease;"></div>
                </div>
                <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-success" onclick="openPagoFromCotizacion('${item.id}')">${ICONS.plus} Registrar pago</button>
                    <button class="btn btn-sm btn-ghost" onclick="S.view='pagos';render();">Ver todos los pagos</button>
                </div>
                ${item.pagos.length > 1 ? `
                    <div class="payment-history" style="margin-top:10px;">
                        ${item.pagos.slice(0, 3).map(p => `
                            <div class="entry">
                                <span>
                                    ${fmtDate(p.fecha)} - ${esc(p.descripcion)}
                                    ${p.metodoPago ? `<span class="metodo-pago-badge ${p.metodoPago}">${metodoPagoLabel(p.metodoPago)}</span>` : ''}
                                    ${p.comprobante ? `<span class="comprobante-num">#${esc(p.comprobante)}</span>` : ''}
                                </span>
                                <span style="font-weight:500;">${bs(p.montoPagado)}</span>
                            </div>
                        `).join('')}
                        ${item.pagos.length > 3 ? `<div class="entry" style="color:var(--text-soft);font-style:italic;">...y ${item.pagos.length - 3} pagos más</div>` : ''}
                    </div>
                ` : ''}
            </div>`;
        });
        return html;
    }

    function renderCargosChart() {
        if (!exp.length) {
            return '<div style="color:var(--text-soft);font-size:13px;">Sin datos de experiencia aún.</div>';
        }
        
        const porCargo = {};
        exp.forEach(e => { 
            const cargo = e.cargo || 'Sin cargo';
            porCargo[cargo] = (porCargo[cargo] || 0) + Number(e.monto || 0); 
        });
        
        const topCargos = Object.entries(porCargo).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const maxCargo = Math.max(1, ...topCargos.map(x => x[1]));
        const colores = ['#1A4A5C', '#3A7A8F', '#B8862E', '#27AE60', '#C0392B', '#8E44AD'];
        
        return topCargos.map(([cargo, monto], i) => {
            const montoFormateado = bs(monto);
            const porcentaje = (monto / maxCargo * 100) || 0;
            
            return `
                <div class="chart-bar-row">
                    <span class="label" title="${esc(cargo)}">${esc(cargo.slice(0, 25))}${cargo.length>25?'…':''}</span>
                    <div class="track">
                        <div class="fill" style="width:${porcentaje}%;background:${colores[i % colores.length]};"></div>
                    </div>
                    <span class="value" style="font-size:11px;min-width:90px;">${montoFormateado}</span>
                </div>
            `;
        }).join('');
    }

    function renderEntidadesChart() {
        if (!exp.length) {
            return '<div style="color:var(--text-soft);font-size:13px;">Sin datos de experiencia aún.</div>';
        }
        
        const porEntidad = {};
        exp.forEach(e => { 
            const entidad = e.entidad || 'Sin entidad';
            porEntidad[entidad] = (porEntidad[entidad] || 0) + Number(e.monto || 0); 
        });
        
        const topEntidades = Object.entries(porEntidad).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const maxEntidad = Math.max(1, ...topEntidades.map(x => x[1]));
        const colores = ['#1A4A5C', '#3A7A8F', '#B8862E', '#27AE60', '#C0392B', '#8E44AD'];
        
        return topEntidades.map(([entidad, monto], i) => {
            const montoFormateado = bs(monto);
            const porcentaje = (monto / maxEntidad * 100) || 0;
            
            return `
                <div class="chart-bar-row">
                    <span class="label" title="${esc(entidad)}">${esc(entidad.slice(0, 20))}${entidad.length>20?'…':''}</span>
                    <div class="track">
                        <div class="fill" style="width:${porcentaje}%;background:${colores[(i+2) % colores.length]};"></div>
                    </div>
                    <span class="value" style="font-size:11px;min-width:90px;">${montoFormateado}</span>
                </div>
            `;
        }).join('');
    }

    return `
    <div class="page-head">
        <div><p class="eyebrow">Panel general</p><h1>Dashboard</h1><p>Resumen de cotizaciones, cobros, experiencia y licitaciones.</p></div>
    </div>

    <div class="kpi-grid">
        <div class="kpi"><div class="label">Total cotizado</div><div class="val">${bs(totalCotizado)}</div><div class="sub">${cots.length} cotizaciones</div></div>
        <div class="kpi success"><div class="label">Total aceptado</div><div class="val">${bs(totalAceptado)}</div><div class="sub">${cots.filter(c => c.estado === 'aceptada').length} aceptadas</div></div>
        <div class="kpi accent"><div class="label">Cobrado a la fecha</div><div class="val">${bs(totalCobrado)}</div><div class="sub">${pagos.length} registros</div></div>
        <div class="kpi danger"><div class="label">Por cobrar</div><div class="val">${bs(totalPorCobrar)}</div><div class="sub">${S.pagos.filter(p => pagoEstado(p) !== 'pagado').length} pendientes</div></div>
        <div class="kpi"><div class="label">Años de experiencia</div><div class="val">${yearsExp.toFixed(1)}</div><div class="sub">${totalExpDays.toLocaleString()} días certificados</div></div>
        <div class="kpi success"><div class="label">Postgrados</div><div class="val">${totalPostgrados}</div><div class="sub">${maestrias > 0 ? `🎓 ${maestrias} Maestría(s)` : 'Sin maestrías'}</div></div>
        <div class="kpi accent"><div class="label">Licitaciones</div><div class="val">${totalLicitaciones}</div><div class="sub">${adjudicadas} adjudicadas · ${evaluacion} en evaluación</div></div>
        <div class="kpi danger"><div class="label">No adjudicadas</div><div class="val">${noAdjudicadas}</div><div class="sub">${totalLicitaciones > 0 ? Math.round(noAdjudicadas/totalLicitaciones*100) : 0}% del total</div></div>
    </div>

    <div class="kpi-grid" style="margin-top:-10px;">
        <div class="kpi" style="grid-column: span 2;">
            <div class="label">💰 Monto total de experiencia</div>
            <div class="val" style="font-size:28px;">${bs(totalExperiencia)}</div>
            <div class="sub">${exp.length} proyectos registrados</div>
        </div>
    </div>

    <div class="dash-grid-2">
        <div class="panel">
            <div class="panel-h"><h3>📊 Monto por cargo</h3></div>
            <div class="panel-body">
                ${renderCargosChart()}
            </div>
        </div>
        <div class="panel">
            <div class="panel-h"><h3>🏢 Monto por entidad</h3></div>
            <div class="panel-body">
                ${renderEntidadesChart()}
            </div>
        </div>
    </div>

    <div class="panel" style="margin-bottom:20px;">
        <div class="panel-h">
            <h3>💰 Avance de pagos pendientes (${avancePagos.length})</h3>
            <span style="font-size:12px;color:var(--text-soft);">${avancePagos.filter(p => p.porcentaje > 0).length} con pagos parciales</span>
        </div>
        <div class="panel-body">
            ${renderAvancePagos()}
        </div>
    </div>

    <div class="panel" style="margin-top:20px;">
        <div class="panel-h"><h3>📋 Últimas cotizaciones aceptadas</h3></div>
        <div class="panel-body">
            ${cots.filter(c => c.estado === 'aceptada').slice(0, 5).map(c => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
                    <div>
                        <div style="font-weight:600;">${esc(c.titulo)}</div>
                        <div style="font-size:12px;color:var(--text-soft);">${esc(c.cliente)} · ${fmtDate(c.fecha)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-weight:600;">${bs(cotTotal(c))}</span>
                        <span class="stamp aceptada">Aceptada</span>
                        <button class="btn btn-sm btn-success" onclick="openPagoFromCotizacion('${c.id}')">💰</button>
                    </div>
                </div>
            `).join('') || '<div style="color:var(--text-soft);font-size:13px;">No hay cotizaciones aceptadas aún.</div>'}
        </div>
    </div>`;
}

// ---- COTIZACIONES ----
function viewCotizaciones() {
    const rows = applyCotFiltersAndSort(S.cotizaciones || []);
    const estados = ['borrador', 'enviada', 'aceptada', 'rechazada'];

    return `
    <div class="page-head">
        <div><p class="eyebrow">Documentos</p><h1>Cotizaciones</h1><p>Crea, edita y exporta tus cotizaciones a PDF.</p></div>
        <div class="page-actions">
            <button class="btn btn-primary" id="btn-new-cot">${ICONS.plus} Nueva cotización</button>
        </div>
    </div>
    <div class="panel">
        <div class="panel-body">
            <div class="filter-bar cot-filter-bar">
                <label>🔍 Filtros:</label>
                <input type="date" id="cot-filter-fecha" value="${S.cotFilters.fecha}" placeholder="Fecha">
                <input id="cot-filter-cliente" placeholder="Cliente..." value="${S.cotFilters.cliente}">
                <select id="cot-filter-estado">
                    <option value="">Todos</option>
                    ${estados.map(e => `<option value="${e}" ${S.cotFilters.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-ghost" id="cot-filter-apply">Aplicar</button>
                <span class="filter-clear" id="cot-filter-clear">Limpiar</span>
            </div>
            ${rows.length ? `<div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th onclick="toggleCotSort('fecha')" class="${S.cotSort.column === 'fecha' ? 'active' : ''}">Fecha <span class="sort-icon">${S.cotSort.column === 'fecha' ? (S.cotSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleCotSort('titulo')" class="${S.cotSort.column === 'titulo' ? 'active' : ''}">Título <span class="sort-icon">${S.cotSort.column === 'titulo' ? (S.cotSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleCotSort('cliente')" class="${S.cotSort.column === 'cliente' ? 'active' : ''}">Cliente <span class="sort-icon">${S.cotSort.column === 'cliente' ? (S.cotSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleCotSort('total')" class="${S.cotSort.column === 'total' ? 'active' : ''}" class="tright">Total <span class="sort-icon">${S.cotSort.column === 'total' ? (S.cotSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleCotSort('plazoDias')" class="${S.cotSort.column === 'plazoDias' ? 'active' : ''}" style="text-align:center;">Plazo <span class="sort-icon">${S.cotSort.column === 'plazoDias' ? (S.cotSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleCotSort('estado')" class="${S.cotSort.column === 'estado' ? 'active' : ''}">Estado <span class="sort-icon">${S.cotSort.column === 'estado' ? (S.cotSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(c => {
                        const plazoTotal = c.items ? c.items.reduce((sum, item) => sum + (Number(item.plazo) || 0), 0) : 0;
                        return `<tr>
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(c.fecha)}</td>
                            <td><div style="font-weight:600;font-size:13px;">${esc(c.titulo)}</div><div style="font-size:11.5px;color:var(--text-soft);">${esc(c.proyecto)}</div></td>
                            <td>${esc(c.cliente)}</td>
                            <td class="tright tnum" style="font-weight:600;">${bs(cotTotal(c))}</td>
                            <td style="text-align:center;font-size:12px;">${plazoTotal > 0 ? plazoTotal + ' días' : '—'}</td>
                            <td><span class="stamp ${c.estado}">${c.estado}</span></td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Exportar PDF" data-pdf="${c.id}">${ICONS.pdf}</button>
                                    <button class="iconbtn" title="Editar" data-edit-cot="${c.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Duplicar" data-dup-cot="${c.id}">${ICONS.copy}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-cot="${c.id}">${ICONS.trash}</button>
                                    ${c.estado === 'aceptada' ? `<button class="iconbtn" title="Registrar pago" onclick="openPagoFromCotizacion('${c.id}')">💰</button>` : ''}
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table></div>` : `<div class="empty">${ICONS.empty}<div>No hay cotizaciones que coincidan con los filtros.</div></div>`}
        </div>
    </div>`;
}

// ============================================================
// VIEW - ADMINISTRATIVO (Nuevo apartado)
// ============================================================

function viewAdministrativo() {
    // ========== DATOS FINANCIEROS ==========
    const costoActividades = typeof obtenerCostoTotalCobrado === 'function' ? obtenerCostoTotalCobrado() : 0;
    const detalleCostos = typeof obtenerDetalleCostosPorProyecto === 'function' ? obtenerDetalleCostosPorProyecto() : {};
    
    const pagosPendientes = S.pagos.filter(p => {
        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
        return saldo > 0.01;
    });
    
    const pagosCerrados = S.pagos.filter(p => {
        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
        return saldo <= 0.01 && Number(p.monto) > 0;
    });
    
    const totalDeuda = pagosPendientes.reduce((s, p) => s + (Number(p.monto) - Number(p.montoPagado || 0)), 0);
    const totalCobrado = S.pagos.reduce((s, p) => s + Number(p.montoPagado || 0), 0);
    const totalFacturado = S.pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
    
    // ========== DOCUMENTOS ==========
    const docs = S.documentos || [];
    const tiposDoc = Object.keys(TIPOS_DOCUMENTOS);
    
    const hoy = new Date().toISOString().slice(0, 10);
    const docsVigentes = S.documentos.filter(d => !d.fechaVencimiento || d.fechaVencimiento >= hoy);
    const docsVencidos = S.documentos.filter(d => d.fechaVencimiento && d.fechaVencimiento < hoy);
    const docsFiltrados = applyDocFiltersAndSort(S.documentos || []);

    return `
    <div class="page-head">
        <div>
            <p class="eyebrow">Gestión</p>
            <h1>Administrativo</h1>
            <p>Panel financiero y documentos de la empresa.</p>
        </div>
        <div class="page-actions">
            <button class="btn btn-primary" id="btn-new-doc">📄 + Nuevo documento</button>
            <button class="btn btn-primary" id="btn-new-pago">${ICONS.plus} Nuevo registro de pago</button>
        </div>
    </div>

    <!-- ========== KPI FINANCIEROS ========== -->
    <div class="kpi-grid">
        <div class="kpi danger"><div class="label">💰 Deuda total</div><div class="val">${bs(totalDeuda)}</div><div class="sub">${pagosPendientes.length} pagos pendientes</div></div>
        <div class="kpi success"><div class="label">✅ Cobrado a la fecha</div><div class="val">${bs(totalCobrado)}</div><div class="sub">${S.pagos.length} registros</div></div>
        <div class="kpi accent"><div class="label">📊 Facturado total</div><div class="val">${bs(totalFacturado)}</div><div class="sub">${S.pagos.length} facturas</div></div>
        ${costoActividades > 0 ? `
            <div class="kpi accent"><div class="label">📋 Costo de actividades</div><div class="val">${bs(costoActividades)}</div><div class="sub">${Object.keys(detalleCostos).length} proyectos</div></div>
        ` : ''}
        <div class="kpi"><div class="label">📄 Documentos</div><div class="val">${S.documentos.length}</div><div class="sub">${docsVigentes.length} vigentes · ${docsVencidos.length} vencidos</div></div>
    </div>

    <!-- ========== SECCIÓN: DOCUMENTOS DE LA EMPRESA ========== -->
    <div class="panel" style="margin-bottom:20px;">
        <div class="panel-h">
            <h3>📄 Documentos de la empresa</h3>
            <span style="font-size:12px;color:var(--text-soft);">${docsVigentes.length} vigentes · ${docsVencidos.length} vencidos</span>
        </div>
        <div class="panel-body">
            <div class="filter-bar doc-filter-bar">
                <label>🔍 Filtros:</label>
                <select id="doc-filter-tipo">
                    <option value="">Todos</option>
                    ${Object.entries(TIPOS_DOCUMENTOS).map(([key, val]) => 
                        `<option value="${key}" ${S.docFilters.tipo === key ? 'selected' : ''}>${val.label}</option>`
                    ).join('')}
                </select>
                <select id="doc-filter-vigente">
                    <option value="">Todos</option>
                    <option value="vigente" ${S.docFilters.vigente === 'vigente' ? 'selected' : ''}>✅ Vigentes</option>
                    <option value="vencido" ${S.docFilters.vigente === 'vencido' ? 'selected' : ''}>❌ Vencidos</option>
                </select>
                <button class="btn btn-sm btn-ghost" id="doc-filter-apply">Aplicar</button>
                <span class="filter-clear" id="doc-filter-clear">Limpiar</span>
            </div>
            
            ${docsFiltrados.length ? `
            <div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th onclick="toggleDocSort('tipo')" class="${S.docSort.column === 'tipo' ? 'active' : ''}">Tipo <span class="sort-icon">${S.docSort.column === 'tipo' ? (S.docSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleDocSort('nombre')" class="${S.docSort.column === 'nombre' ? 'active' : ''}">Nombre <span class="sort-icon">${S.docSort.column === 'nombre' ? (S.docSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleDocSort('numero')" class="${S.docSort.column === 'numero' ? 'active' : ''}">Número <span class="sort-icon">${S.docSort.column === 'numero' ? (S.docSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleDocSort('fechaEmision')" class="${S.docSort.column === 'fechaEmision' ? 'active' : ''}">Emisión <span class="sort-icon">${S.docSort.column === 'fechaEmision' ? (S.docSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleDocSort('fechaVencimiento')" class="${S.docSort.column === 'fechaVencimiento' ? 'active' : ''}">Vencimiento <span class="sort-icon">${S.docSort.column === 'fechaVencimiento' ? (S.docSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th>Estado</th>
                        <th>Archivo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${docsFiltrados.map(d => {
                        const tipoInfo = TIPOS_DOCUMENTOS[d.tipo] || TIPOS_DOCUMENTOS.otro;
                        const estaVigente = !d.fechaVencimiento || d.fechaVencimiento >= hoy;
                        const diasRestantes = d.fechaVencimiento ? Math.ceil((new Date(d.fechaVencimiento + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24)) : null;
                        let estadoColor = 'var(--success)';
                        let estadoTexto = '✅ Vigente';
                        if (d.fechaVencimiento && d.fechaVencimiento < hoy) {
                            estadoColor = 'var(--danger)';
                            estadoTexto = '❌ Vencido';
                        } else if (diasRestantes !== null && diasRestantes <= 30) {
                            estadoColor = 'var(--warning)';
                            estadoTexto = `⚠️ Vence en ${diasRestantes} días`;
                        }
                        return `<tr>
                            <td><span style="color:${tipoInfo.color};">${tipoInfo.icon} ${tipoInfo.label}</span></td>
                            <td style="font-weight:500;">${esc(d.nombre)}</td>
                            <td>${esc(d.numero||'—')}</td>
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(d.fechaEmision)}</td>
                            <td class="tnum" style="white-space:nowrap;color:${d.fechaVencimiento && d.fechaVencimiento < hoy ? 'var(--danger)' : 'var(--text)'}">${fmtDate(d.fechaVencimiento)}</td>
                            <td><span style="color:${estadoColor};font-weight:600;">${estadoTexto}</span></td>
                            <td>
                                ${d.archivo ? `<button class="iconbtn" title="Ver archivo" data-ver-doc="${d.id}">📄</button>` : '—'}
                            </td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Editar" data-edit-doc="${d.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-doc="${d.id}">${ICONS.trash}</button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table></div>` : `
            <div class="empty" style="padding:30px;">
                <div style="font-size:40px;margin-bottom:10px;">📄</div>
                <div>No hay documentos registrados.</div>
                <div style="font-size:13px;color:var(--text-soft);margin-top:4px;">Sube tus documentos SEPREC, NIT, RNI, etc.</div>
                <button class="btn btn-primary btn-sm" style="margin-top:12px;" id="btn-new-doc-empty">+ Agregar documento</button>
            </div>`}
        </div>
    </div>

    <!-- ========== SECCIÓN: PAGOS POR COBRAR ========== -->
    <div class="panel" style="margin-bottom:20px;">
        <div class="panel-h">
            <h3>💰 Pagos por cobrar (${pagosPendientes.length})</h3>
            <span style="font-size:12px;color:var(--text-soft);">Total: ${bs(totalDeuda)}</span>
        </div>
        <div class="panel-body">
            ${pagosPendientes.length ? `
            <div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Cliente</th>
                        <th>Proyecto</th>
                        <th class="tright">Monto</th>
                        <th class="tright">Pagado</th>
                        <th class="tright">Saldo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pagosPendientes.slice(0, 10).map(p => {
                        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
                        let proyecto = '—';
                        if (p.cotizacionId) {
                            const cot = S.cotizaciones.find(c => c.id === p.cotizacionId);
                            if (cot) proyecto = cot.proyecto || '—';
                        }
                        return `<tr>
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(p.fecha)}</td>
                            <td>${esc(p.descripcion||'—')}</td>
                            <td>${esc(p.cliente||'—')}</td>
                            <td>${esc(proyecto)}</td>
                            <td class="tright tnum">${bs(p.monto)}</td>
                            <td class="tright tnum">${bs(p.montoPagado||0)}</td>
                            <td class="tright tnum" style="font-weight:600;color:var(--danger);">${bs(saldo)}</td>
                            <td><span class="stamp ${pagoEstado(p)}">${pagoEstado(p)}</span></td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Registrar pago" data-register-pago="${p.id}">💰</button>
                                    <button class="iconbtn" title="Editar" data-edit-pago="${p.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-pago="${p.id}">${ICONS.trash}</button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                    ${pagosPendientes.length > 10 ? `<tr><td colspan="9" style="text-align:center;color:var(--text-soft);font-style:italic;">...y ${pagosPendientes.length - 10} pagos más</td></tr>` : ''}
                </tbody>
            </table></div>
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-sm btn-ghost" onclick="S.view='pagos';render();">Ver todos los pagos</button>
            </div>` : `<div style="color:var(--text-soft);font-size:13px;padding:12px 0;">🎉 No hay pagos pendientes.</div>`}
        </div>
    </div>

    <!-- ========== SECCIÓN: COSTOS DE ACTIVIDADES ========== -->
    ${costoActividades > 0 ? `
    <div class="panel">
        <div class="panel-h"><h3>📋 Costos de actividades por proyecto</h3></div>
        <div class="panel-body">
            ${Object.entries(detalleCostos).map(([proyecto, info]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
                    <div>
                        <span style="font-weight:500;">${esc(proyecto)}</span>
                        <span style="font-size:11px;color:var(--text-soft);margin-left:8px;">
                            ${info.actividades.length} actividades · 
                            ${info.gratuitas} gratuitas · 
                            ${info.gratuitasRestantes > 0 ? `🎁 ${info.gratuitasRestantes} restantes` : '⚠️ Sin gratuitas'}
                        </span>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:600;">${bs(info.cobradas)}</div>
                        <div style="font-size:10px;color:var(--text-soft);">Total: ${bs(info.total)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>` : ''}

    <!-- ========== HISTORIAL DE PAGOS CERRADOS ========== -->
    ${pagosCerrados.length > 0 ? `
    <div class="panel" style="margin-top:20px;">
        <div class="panel-h">
            <h3 style="color:var(--success);">✅ Historial de pagos cerrados (${pagosCerrados.length})</h3>
            <span style="font-size:12px;color:var(--text-soft);">Total: ${bs(pagosCerrados.reduce((s, p) => s + Number(p.monto), 0))}</span>
        </div>
        <div class="panel-body">
            <div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Descripción</th>
                        <th>Cliente</th>
                        <th>Proyecto</th>
                        <th class="tright">Monto</th>
                        <th class="tright">Pagado</th>
                        <th>Método</th>
                    </tr>
                </thead>
                <tbody>
                    ${pagosCerrados.slice(0, 10).map(p => {
                        let proyecto = '—';
                        if (p.cotizacionId) {
                            const cot = S.cotizaciones.find(c => c.id === p.cotizacionId);
                            if (cot) proyecto = cot.proyecto || '—';
                        }
                        return `<tr style="color:var(--text-soft);">
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(p.fecha)}</td>
                            <td>${esc(p.descripcion||'—')}</td>
                            <td>${esc(p.cliente||'—')}</td>
                            <td>${esc(proyecto)}</td>
                            <td class="tright tnum">${bs(p.monto)}</td>
                            <td class="tright tnum" style="color:var(--success);">${bs(p.montoPagado||0)}</td>
                            <td>${p.metodoPago ? `<span class="metodo-pago-badge ${p.metodoPago}" style="font-size:9px;">${metodoPagoLabel(p.metodoPago)}</span>` : '—'}</td>
                        </tr>`;
                    }).join('')}
                    ${pagosCerrados.length > 10 ? `<tr><td colspan="7" style="text-align:center;color:var(--text-soft);font-style:italic;">...y ${pagosCerrados.length - 10} pagos más</td></tr>` : ''}
                </tbody>
            </table></div>
        </div>
    </div>` : ''}
    `;
}

// ---- PAGOS POR COBRAR (vista detallada) ----
function viewPagos() {
    const costoActividades = typeof obtenerCostoTotalCobrado === 'function' ? obtenerCostoTotalCobrado() : 0;
    const detalleCostos = typeof obtenerDetalleCostosPorProyecto === 'function' ? obtenerDetalleCostosPorProyecto() : {};
    
    const rows = applyPagoFiltersAndSort(S.pagos.filter(p => {
        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
        return saldo > 0.01;
    }) || []);
    
    const pagosCerrados = S.pagos.filter(p => {
        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
        return saldo <= 0.01 && Number(p.monto) > 0;
    });
    
    const estados = ['pendiente', 'parcial', 'pagado'];
    const clientesUnicos = [...new Set(S.pagos.map(p => p.cliente).filter(Boolean))].sort();

    const allVisibleSelected = rows.length > 0 && rows.every(p => S.selectedDebts.has(p.id));
    const selectedCount = rows.filter(p => S.selectedDebts.has(p.id)).length;
    const validSelected = rows
        .filter(p => S.selectedDebts.has(p.id))
        .filter(p => (Number(p.monto) - Number(p.montoPagado || 0)) > 0.01);
    const validCount = validSelected.length;

    let tableHtml = '';
    if (rows.length) {
        tableHtml = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
                <div class="debt-select-all">
                    <input type="checkbox" id="select-all-debts" ${allVisibleSelected ? 'checked' : ''}>
                    <label for="select-all-debts">Seleccionar todos (${rows.length} registros)</label>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <span style="font-size:12px;color:var(--text-soft);">${selectedCount} seleccionados</span>
                    <button class="btn btn-sm btn-success" id="btn-export-debts" ${validCount === 0 ? 'disabled' : ''}>
                        📤 Exportar todas
                    </button>
                    <button class="btn btn-sm btn-primary" id="btn-select-columns" ${validCount === 0 ? 'disabled' : ''}>
                        ⚙️ Elegir columnas
                    </button>
                    <button class="btn btn-sm btn-ghost" id="btn-clear-selection">Limpiar selección</button>
                </div>
            </div>
            <div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th style="width:32px;text-align:center;">✓</th>
                        <th onclick="togglePagoSort('fecha')" class="${S.pagoSort.column === 'fecha' ? 'active' : ''}">Fecha <span class="sort-icon">${S.pagoSort.column === 'fecha' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('descripcion')" class="${S.pagoSort.column === 'descripcion' ? 'active' : ''}">Descripción <span class="sort-icon">${S.pagoSort.column === 'descripcion' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('cliente')" class="${S.pagoSort.column === 'cliente' ? 'active' : ''}">Cliente <span class="sort-icon">${S.pagoSort.column === 'cliente' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('proyecto')" class="${S.pagoSort.column === 'proyecto' ? 'active' : ''}">Proyecto <span class="sort-icon">${S.pagoSort.column === 'proyecto' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('monto')" class="${S.pagoSort.column === 'monto' ? 'active' : ''}" class="tright">Monto <span class="sort-icon">${S.pagoSort.column === 'monto' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('montoPagado')" class="${S.pagoSort.column === 'montoPagado' ? 'active' : ''}" class="tright">Pagado <span class="sort-icon">${S.pagoSort.column === 'montoPagado' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('saldo')" class="${S.pagoSort.column === 'saldo' ? 'active' : ''}" class="tright">Saldo <span class="sort-icon">${S.pagoSort.column === 'saldo' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('estado')" class="${S.pagoSort.column === 'estado' ? 'active' : ''}">Estado <span class="sort-icon">${S.pagoSort.column === 'estado' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th>Método</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(p => {
                        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
                        const isSelected = S.selectedDebts.has(p.id);
                        let proyecto = '—';
                        let cot = null;
                        if (p.cotizacionId) {
                            cot = S.cotizaciones.find(c => c.id === p.cotizacionId);
                            if (cot) proyecto = cot.proyecto || '—';
                        }
                        return `<tr>
                            <td style="text-align:center;">
                                <input type="checkbox" class="debt-checkbox" data-id="${p.id}" ${isSelected ? 'checked' : ''}>
                            </td>
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(p.fecha)}</td>
                            <td style="font-weight:500;">
                                ${esc(p.descripcion||'—')}
                                <button class="iconbtn" style="margin-left:6px;padding:2px 6px;font-size:11px;" onclick="togglePagoDetalle('${p.id}')" title="Ver detalle">
                                    ${S.expandedPagoId === p.id ? '▲' : '▼'}
                                </button>
                            </td>
                            <td>${esc(p.cliente||'—')}</td>
                            <td>${esc(proyecto)}</td>
                            <td class="tright tnum">${bs(p.monto)}</td>
                            <td class="tright tnum">${bs(p.montoPagado||0)}</td>
                            <td class="tright tnum" style="font-weight:600;">${bs(saldo)}</td>
                            <td><span class="stamp ${pagoEstado(p)}">${pagoEstado(p)}</span></td>
                            <td>
                                ${p.metodoPago ? `<span class="metodo-pago-badge ${p.metodoPago}">${metodoPagoLabel(p.metodoPago)}</span>` : '—'}
                                ${p.comprobante ? `<div class="comprobante-num" style="margin-top:2px;">#${esc(p.comprobante)}</div>` : ''}
                            </td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Registrar pago parcial" data-register-pago="${p.id}">💰</button>
                                    <button class="iconbtn" title="Editar" data-edit-pago="${p.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-pago="${p.id}">${ICONS.trash}</button>
                                </div>
                            </td>
                        </tr>
                        ${S.expandedPagoId === p.id ? `
                        <tr>
                            <td colspan="11" style="padding:0;background:var(--surface-hover);">
                                <div style="padding:16px 20px;border-top:2px solid var(--primary);border-bottom:1px solid var(--border);">
                                    ${renderPagoDetalle(p, cot, [])}
                                </div>
                            </td>
                        </tr>
                        ` : ''}`;
                    }).join('')}
                </tbody>
            </table></div>`;
    } else {
        tableHtml = `<div class="empty">${ICONS.empty}<div>🎉 No hay pagos pendientes.</div></div>`;
    }

    let historialHtml = '';
    if (pagosCerrados.length > 0) {
        const cerradosOrdenados = pagosCerrados.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        historialHtml = `
            <div style="margin-top:24px;border-top:2px solid var(--border);padding-top:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 style="font-size:15px;font-weight:600;color:var(--success);margin:0;">✅ Historial de pagos cerrados (${cerradosOrdenados.length})</h3>
                    <span style="font-size:12px;color:var(--text-soft);">Total: ${bs(cerradosOrdenados.reduce((s, p) => s + Number(p.monto), 0))}</span>
                </div>
                <div class="table-wrap"><table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th>Cliente</th>
                            <th>Proyecto</th>
                            <th class="tright">Monto</th>
                            <th class="tright">Pagado</th>
                            <th>Método</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cerradosOrdenados.slice(0, 20).map(p => {
                            let proyecto = '—';
                            if (p.cotizacionId) {
                                const cot = S.cotizaciones.find(c => c.id === p.cotizacionId);
                                if (cot) proyecto = cot.proyecto || '—';
                            }
                            return `<tr style="color:var(--text-soft);">
                                <td class="tnum" style="white-space:nowrap;">${fmtDate(p.fecha)}</td>
                                <td>${esc(p.descripcion||'—')}</td>
                                <td>${esc(p.cliente||'—')}</td>
                                <td>${esc(proyecto)}</td>
                                <td class="tright tnum">${bs(p.monto)}</td>
                                <td class="tright tnum" style="color:var(--success);">${bs(p.montoPagado||0)}</td>
                                <td>${p.metodoPago ? `<span class="metodo-pago-badge ${p.metodoPago}" style="font-size:9px;">${metodoPagoLabel(p.metodoPago)}</span>` : '—'}</td>
                            </tr>`;
                        }).join('')}
                        ${cerradosOrdenados.length > 20 ? `<tr><td colspan="7" style="text-align:center;color:var(--text-soft);font-style:italic;">...y ${cerradosOrdenados.length - 20} pagos más</td></tr>` : ''}
                    </tbody>
                </table></div>
            </div>
        `;
    }

    const headerCostoActividades = (costoActividades > 0) ? `
        <div style="margin-top:6px;padding:6px 14px;background:#FFF3E0;border-radius:var(--radius);border-left:4px solid var(--accent);font-size:13px;">
            <strong>💰 Costo de actividades por cobrar:</strong> ${bs(costoActividades)}
            <span style="font-size:11px;color:var(--text-soft);margin-left:8px;">
                (${Object.keys(detalleCostos).length} proyectos con actividades)
            </span>
        </div>
    ` : '';

    return `
    <div class="page-head">
        <div>
            <p class="eyebrow">Cobros</p>
            <h1>Pagos por cobrar</h1>
            <p>Registro de pagos con fechas, métodos y comprobantes.</p>
            ${headerCostoActividades}
        </div>
        <div class="page-actions">
            <button class="btn btn-primary" id="btn-new-pago">${ICONS.plus} Nuevo registro</button>
        </div>
    </div>
    <div class="panel">
        <div class="panel-body">
            <div class="filter-bar pago-filter-bar">
                <label>🔍 Filtros:</label>
                <input type="date" id="pago-filter-fecha" value="${S.pagoFilters.fecha}">
                <input id="pago-filter-cliente" list="clientes-pago-list" placeholder="Cliente..." value="${S.pagoFilters.cliente}">
                <datalist id="clientes-pago-list">${clientesUnicos.map(c => `<option value="${c}">`).join('')}</datalist>
                <select id="pago-filter-estado">
                    <option value="">Todos</option>
                    ${estados.map(e => `<option value="${e}" ${S.pagoFilters.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-ghost" id="pago-filter-apply">Aplicar</button>
                <span class="filter-clear" id="pago-filter-clear">Limpiar</span>
            </div>
            ${tableHtml}
            ${historialHtml}
        </div>
    </div>`;
}

// ---- FUNCIÓN PARA RENDERIZAR DETALLE DE PAGO ----
function renderPagoDetalle(pago, cot, historialPagos) {
    const saldo = Number(pago.monto) - Number(pago.montoPagado || 0);
    const esCompletamentePagado = saldo <= 0.01;

    let todosLosPagos = [];
    
    if (pago.cotizacionId) {
        todosLosPagos = S.pagos.filter(p => 
            p.cotizacionId === pago.cotizacionId && 
            p.id !== pago.id &&
            Number(p.montoPagado || 0) > 0
        );
    }
    
    if (todosLosPagos.length === 0 && pago.cliente) {
        todosLosPagos = S.pagos.filter(p => 
            p.cliente === pago.cliente && 
            p.id !== pago.id && 
            Number(p.montoPagado || 0) > 0 &&
            p.descripcion && p.descripcion.includes('Pago parcial')
        );
    }

    todosLosPagos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    const totalHistorial = todosLosPagos.reduce((s, p) => s + Number(p.montoPagado || 0), 0);

    const pagoId = pago.id;
    const cotId = cot ? cot.id : '';

    return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
                <div style="font-weight:600;font-size:14px;color:var(--primary);margin-bottom:8px;">📋 Información del trabajo</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:13px;">
                    <div><strong>Descripción:</strong></div>
                    <div>${esc(pago.descripcion||'—')}</div>
                    <div><strong>Cliente:</strong></div>
                    <div>${esc(pago.cliente||'—')}</div>
                    <div><strong>Proyecto:</strong></div>
                    <div>${cot ? esc(cot.proyecto || '—') : '—'}</div>
                    <div><strong>Fecha registro:</strong></div>
                    <div>${fmtDate(pago.fecha)}</div>
                    <div><strong>Monto total:</strong></div>
                    <div style="font-weight:600;">${bs(pago.monto)}</div>
                    <div><strong>Pagado:</strong></div>
                    <div style="color:var(--success);font-weight:600;">${bs(pago.montoPagado||0)}</div>
                    <div><strong>Saldo pendiente:</strong></div>
                    <div style="color:${saldo > 0 ? 'var(--danger)' : 'var(--success)'};font-weight:600;">${bs(saldo)}</div>
                    <div><strong>Estado:</strong></div>
                    <div><span class="stamp ${pagoEstado(pago)}">${pagoEstado(pago)}</span></div>
                    ${pago.metodoPago ? `
                        <div><strong>Método de pago:</strong></div>
                        <div><span class="metodo-pago-badge ${pago.metodoPago}">${metodoPagoLabel(pago.metodoPago)}</span></div>
                    ` : ''}
                    ${pago.comprobante ? `
                        <div><strong>Comprobante:</strong></div>
                        <div><span class="comprobante-num">#${esc(pago.comprobante)}</span></div>
                    ` : ''}
                    ${pago.notas ? `
                        <div><strong>Notas:</strong></div>
                        <div style="grid-column:span 2;font-size:12px;color:var(--text-soft);padding:4px 8px;background:var(--gantt-bg);border-radius:4px;white-space:pre-wrap;max-height:100px;overflow-y:auto;">${esc(pago.notas)}</div>
                    ` : ''}
                </div>
            </div>
            <div>
                <div style="font-weight:600;font-size:14px;color:var(--primary);margin-bottom:8px;">💰 Registro de pagos (${todosLosPagos.length})</div>
                ${todosLosPagos.length > 0 ? `
                    <div class="payment-history" style="max-height:300px;margin-bottom:12px;overflow-y:auto;">
                        ${todosLosPagos.map(p => `
                            <div class="entry" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
                                <div style="flex:1;min-width:0;">
                                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                        <span style="font-weight:500;white-space:nowrap;">${fmtDate(p.fecha)}</span>
                                        <span style="font-size:12px;word-break:break-word;">${esc(p.descripcion || 'Pago parcial')}</span>
                                        ${p.metodoPago ? `<span class="metodo-pago-badge ${p.metodoPago}" style="font-size:9px;">${metodoPagoLabel(p.metodoPago)}</span>` : ''}
                                        ${p.comprobante ? `<span class="comprobante-num" style="font-size:9px;">#${esc(p.comprobante)}</span>` : ''}
                                    </div>
                                    ${p.notas ? `<div style="font-size:11px;color:var(--text-soft);margin-top:2px;word-break:break-word;">${esc(p.notas)}</div>` : ''}
                                </div>
                                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:8px;">
                                    <span style="font-weight:600;font-size:13px;white-space:nowrap;">${bs(p.montoPagado)}</span>
                                    <button class="iconbtn" style="padding:2px 5px;font-size:11px;color:var(--primary);border-color:var(--primary);" 
                                        onclick="editarPagoHistorial('${p.id}')" title="Editar este pago">✏️</button>
                                    <button class="iconbtn" style="padding:2px 5px;font-size:11px;color:var(--danger);border-color:var(--danger);" 
                                        onclick="eliminarPagoHistorial('${p.id}')" title="Eliminar este pago">✕</button>
                                </div>
                            </div>
                        `).join('')}
                        <div class="entry" style="font-weight:600;border-top:2px solid var(--border);padding-top:6px;margin-top:4px;display:flex;justify-content:space-between;">
                            <span>Total pagado</span>
                            <span>${bs(totalHistorial)}</span>
                        </div>
                    </div>
                ` : `
                    <div style="font-size:13px;color:var(--text-soft);padding:12px;background:var(--gantt-bg);border-radius:4px;margin-bottom:12px;text-align:center;">
                        No hay pagos registrados para este trabajo.
                    </div>
                `}
                <div style="margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-soft);margin-bottom:4px;">
                        <span>Progreso de pago</span>
                        <span>${Math.round((Number(pago.montoPagado||0) / Number(pago.monto)) * 100)}%</span>
                    </div>
                    <div style="height:8px;background:var(--gantt-bg);border-radius:4px;overflow:hidden;">
                        <div style="height:100%;border-radius:4px;background:${(Number(pago.montoPagado||0) / Number(pago.monto)) >= 0.8 ? 'var(--success)' : 'var(--accent)'};width:${Math.min(100, (Number(pago.montoPagado||0) / Number(pago.monto)) * 100)}%;transition:width 0.5s ease;"></div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${!esCompletamentePagado ? `
                        <button class="btn btn-sm btn-success" onclick="openRegisterPagoModalFromDetalle('${pagoId}')">
                            ${ICONS.plus} Registrar pago
                        </button>
                    ` : `
                        <span style="font-size:13px;color:var(--success);font-weight:600;">✅ Completamente pagado</span>
                    `}
                    ${cot ? `
                        <button class="btn btn-sm btn-ghost" onclick="abrirCotizacion('${cotId}')">📄 Ver cotización</button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="eliminarPagoPrincipal('${pagoId}')" style="border-color:var(--danger);color:var(--danger);">🗑️ Eliminar deuda</button>
                </div>
            </div>
        </div>
    `;
}

// ---- FUNCIÓN PARA ABRIR COTIZACIÓN ----
function abrirCotizacion(cotId) {
    if (!cotId) {
        toast('⚠️ No hay cotización asociada.');
        return;
    }
    S.view = 'cotizaciones';
    render();
    setTimeout(() => {
        const editBtn = document.querySelector(`[data-edit-cot="${cotId}"]`);
        if (editBtn) {
            editBtn.click();
        } else {
            toast('⚠️ No se encontró la cotización para editar.');
        }
    }, 200);
}

// ---- FUNCIÓN PARA ALTERNAR DETALLE DE PAGO ----
function togglePagoDetalle(pagoId) {
    if (S.expandedPagoId === pagoId) {
        S.expandedPagoId = null;
    } else {
        S.expandedPagoId = pagoId;
    }
    render();
}

// ---- FUNCIÓN PARA REGISTRAR PAGO DESDE EL DETALLE ----
function openRegisterPagoModalFromDetalle(pagoId) {
    const pago = S.pagos.find(p => p.id === pagoId);
    if (!pago) {
        toast('⚠️ No se encontró el pago.');
        return;
    }
    openRegisterPagoModal(pago);
}

// ---- CLIENTES ----
function viewClientes() {
    const list = [...S.clientes].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return `
    <div class="page-head">
        <div><p class="eyebrow">Memoria</p><h1>Clientes y proyectos</h1><p>Se guardan automáticamente al registrar cotizaciones o pagos.</p></div>
    </div>
    <div class="panel"><div class="panel-body">
        <div style="display:flex;gap:8px;margin-bottom:18px;">
            <input id="new-cliente-nombre" placeholder="Nombre de un nuevo cliente…" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;">
            <button class="btn btn-accent" id="btn-add-cliente">${ICONS.plus} Agregar</button>
        </div>
        ${list.length ? list.map(cl => `
            <div style="border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:12px;background:#fff;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;">
                    <span style="font-weight:600;font-size:14.5px;color:var(--primary);">${esc(cl.nombre)}</span>
                    <button class="iconbtn" title="Eliminar cliente" data-del-cliente="${cl.id}">${ICONS.trash}</button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px;">
                    ${cl.proyectos.length ? cl.proyectos.map(p => `<span style="display:inline-flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);border-radius:20px;padding:4px 6px 4px 11px;font-size:12px;">${esc(p)}<button data-del-proy="${cl.id}::${esc(p).replace(/"/g,'&quot;')}" style="background:none;border:none;cursor:pointer;color:var(--text-soft);font-size:14px;padding:0 3px;">&times;</button></span>`).join('') : '<span style="font-size:12px;color:var(--text-soft);">Sin proyectos registrados aún.</span>'}
                </div>
                <div style="display:flex;gap:8px;">
                    <input placeholder="Agregar proyecto…" data-new-proy-input="${cl.id}" style="flex:1;padding:7px 10px;border:1px solid var(--border);border-radius:3px;font-size:12.5px;">
                    <button class="btn btn-ghost btn-sm" data-add-proy="${cl.id}">Agregar</button>
                </div>
            </div>`).join('') : `<div class="empty">${ICONS.empty}<div>Aún no hay clientes guardados.</div></div>`}
    </div></div>`;
}

// ---- EXPERIENCIA ----
function viewExperiencia() {
    const exp = S.experiencia || [];
    const formacion = S.formacion || [];
    const cursos = S.cursos || [];
    const dp = S.datosPersonales || {};
    const edad = calcularEdad(dp.fechaNacimiento);

    let totalYears = 0;
    exp.forEach(e => {
        const desde = e.desde || e.fechaInicio;
        const hasta = e.hasta || e.fechaFin;
        if (desde && hasta && !e.enCurso) {
            const years = diffYears(desde, hasta);
            if (years > 0) totalYears += years;
        }
    });
    exp.forEach(e => {
        if (e.enCurso) {
            const desde = e.desde || e.fechaInicio;
            if (desde) {
                const hoy = new Date().toISOString().slice(0, 10);
                const years = diffYears(desde, hoy);
                if (years > 0) totalYears += years;
            }
        }
    });

    return `
    <div class="page-head">
        <div><p class="eyebrow">Perfil profesional</p><h1>Experiencia</h1><p>Datos personales, formación y experiencia profesional.</p></div>
        <div class="page-actions">
            <button class="btn btn-word" id="btn-word-a5">📄 Exportar A-5</button>
            <button class="btn btn-word" id="btn-word-a7">📄 Exportar A-7</button>
            <button class="btn btn-word" id="btn-word-participacion">📄 Exportar Participación</button>
            <button class="btn btn-success" id="btn-export-excel">${ICONS.excel} Exportar hoja de vida</button>
            <button class="btn btn-primary" id="btn-import-excel">${ICONS.upload} Importar Excel</button>
            <button class="btn btn-primary" id="btn-edit-cv">${ICONS.edit} Editar hoja de vida</button>
            <button class="btn btn-primary" id="btn-new-exp">${ICONS.plus} Agregar proyecto</button>
        </div>
    </div>
    <div class="panel" style="margin-bottom:20px;">
        <div class="panel-h">
            <h3>📋 Hoja de vida — ${S.editingCV ? 'Editando' : 'Resumen'}</h3>
            ${S.editingCV ? `<button class="btn btn-sm btn-success" id="btn-save-cv">💾 Guardar cambios</button>` : ''}
        </div>
        <div class="panel-body">
            ${S.editingCV ? `
                <div class="cv-section-title">📌 Datos personales</div>
                <div class="cv-edit-grid">
                    <div class="field"><label>Nombre completo</label><input id="cv-nombre" value="${attr(S.datosPersonales.nombre)}"></div>
                    <div class="field"><label>CI</label><input id="cv-ci" value="${attr(S.datosPersonales.ci)}"></div>
                    <div class="field"><label>Lugar expedición</label><input id="cv-lugar" value="${attr(S.datosPersonales.lugarExpedicion)}"></div>
                    <div class="field"><label>Fecha de nacimiento</label><input type="date" id="cv-fecha-nac" value="${attr(S.datosPersonales.fechaNacimiento)}" onchange="document.getElementById('cv-edad').value=calcularEdad(this.value)"></div>
                    <div class="field"><label>Edad (calculada)</label><input id="cv-edad" value="${edad}" disabled style="background:#f5f5f5;"></div>
                    <div class="field"><label>Nacionalidad</label><input id="cv-nacionalidad" value="${attr(S.datosPersonales.nacionalidad)}"></div>
                    <div class="field"><label>Profesión</label><input id="cv-profesion" value="${attr(S.datosPersonales.profesion)}"></div>
                    <div class="field"><label>Registro profesional (RNI)</label><input id="cv-rni" value="${attr(S.datosPersonales.registroProfesional)}"></div>
                </div>
                <div class="cv-section-title">🎓 Formación académica</div>
                <div id="cv-formacion-container">
                    ${S.formacion.map((f, i) => `
                        <div class="row4" style="margin-bottom:8px;align-items:center;" data-f-idx="${i}">
                            <input value="${attr(f.institucion)}" placeholder="Institución" class="cv-f-institucion">
                            <input type="date" value="${attr(f.desde)}" class="cv-f-desde">
                            <input type="date" value="${attr(f.hasta)}" class="cv-f-hasta">
                            <input value="${attr(f.grado)}" placeholder="Grado" class="cv-f-grado">
                            <button class="btn btn-sm btn-danger cv-f-remove" style="padding:4px 8px;">✕</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-ghost" id="cv-add-formacion">+ Agregar formación</button>
                <div class="cv-section-title">📚 Cursos de especialización</div>
                <div id="cv-cursos-container">
                    ${S.cursos.map((c, i) => `
                        <div class="row4" style="margin-bottom:8px;align-items:center;" data-c-idx="${i}">
                            <input value="${attr(c.institucion)}" placeholder="Institución" class="cv-c-institucion">
                            <input type="date" value="${attr(c.desde)}" class="cv-c-desde">
                            <input type="date" value="${attr(c.hasta)}" class="cv-c-hasta">
                            <input value="${attr(c.curso)}" placeholder="Curso" class="cv-c-curso">
                            <input type="number" value="${c.horas}" placeholder="Horas" class="cv-c-horas" style="width:70px;">
                            <button class="btn btn-sm btn-danger cv-c-remove" style="padding:4px 8px;">✕</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-ghost" id="cv-add-curso">+ Agregar curso</button>
            ` : `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:16px;">
                    <div><strong>Nombre:</strong> ${S.datosPersonales.nombre || '—'}</div>
                    <div><strong>CI:</strong> ${S.datosPersonales.ci || '—'} (${S.datosPersonales.lugarExpedicion || '—'})</div>
                    <div><strong>Edad:</strong> ${edad || '—'}</div>
                    <div><strong>Nacionalidad:</strong> ${S.datosPersonales.nacionalidad || '—'}</div>
                    <div><strong>Profesión:</strong> ${S.datosPersonales.profesion || '—'}</div>
                    <div><strong>RNI:</strong> ${S.datosPersonales.registroProfesional || '—'}</div>
                </div>
                <div style="margin-bottom:12px;">
                    <strong>Formación académica (${S.formacion.length} títulos):</strong>
                    <ul style="margin-top:4px;padding-left:20px;font-size:13px;">${S.formacion.map(f => `<li>${f.grado} — ${f.institucion} (${fmtDate(f.desde)} - ${fmtDate(f.hasta)})</li>`).join('')}</ul>
                </div>
                <div>
                    <strong>Cursos de especialización (${S.cursos.length} cursos):</strong>
                    <ul style="margin-top:4px;padding-left:20px;font-size:13px;">${S.cursos.slice(0, 5).map(c => `<li>${c.curso} — ${c.institucion} (${c.horas}h)</li>`).join('')}${S.cursos.length > 5 ? `<li style="color:var(--text-soft);">...y ${S.cursos.length - 5} cursos más</li>` : ''}</ul>
                </div>
            `}
        </div>
    </div>
    <div class="panel" style="margin-bottom:20px;">
        <div class="panel-h">
            <h3>📊 Diagrama de Gantt</h3>
            <div class="gantt-controls">
                <label>Últimos</label>
                <input type="number" id="gantt-years" value="${S.ganttYears}" min="1" max="30">
                <label>años</label>
                <button class="btn btn-sm btn-ghost" id="btn-update-gantt">Actualizar</button>
                <div class="gantt-toggle">
                    <label><input type="checkbox" id="gantt-show-educ" ${S.ganttShowEducacion ? 'checked' : ''}> 🎓 Formación</label>
                    <label><input type="checkbox" id="gantt-show-cursos" ${S.ganttShowCursos ? 'checked' : ''}> 📚 Cursos</label>
                </div>
            </div>
        </div>
        <div class="panel-body">${renderGantt()}</div>
    </div>
    <div class="panel">
        <div class="panel-h"><h3>Lista de proyectos (${S.experiencia.length} totales)</h3></div>
        <div class="panel-body">
            <div class="filter-bar exp-filter-bar">
                <label>🔍 Filtros:</label>
                <input id="exp-filter-entidad" placeholder="Entidad..." value="${S.expFilters.entidad}" style="min-width:130px;">
                <input id="exp-filter-objeto" placeholder="Objeto..." value="${S.expFilters.objeto}" style="min-width:150px;">
                <input id="exp-filter-cargo" placeholder="Cargo..." value="${S.expFilters.cargo}" style="min-width:120px;">
                <input type="date" id="exp-filter-desde" value="${S.expFilters.desde}" style="width:130px;">
                <input type="date" id="exp-filter-hasta" value="${S.expFilters.hasta}" style="width:130px;">
                <button class="btn btn-sm btn-ghost" id="exp-filter-apply">Aplicar</button>
                <span class="filter-clear" id="exp-filter-clear">Limpiar</span>
            </div>
            ${renderExperienciaTabla()}
        </div>
    </div>`;
}

// ---- LICITACIONES ----
function viewLicitaciones() {
    const rows = applyLicFiltersAndSort(S.licitaciones || []);
    const estados = ['presentada', 'evaluacion', 'adjudicada', 'no-adjudicada', 'en-curso'];

    return `
    <div class="page-head">
        <div><p class="eyebrow">Propuestas</p><h1>Licitaciones</h1><p>Registro de propuestas presentadas.</p></div>
        <div class="page-actions">
            <button class="btn btn-success" id="btn-export-lic-excel">${ICONS.excel} Exportar Excel</button>
            <button class="btn btn-primary" id="btn-new-lic">${ICONS.plus} Nueva licitación</button>
        </div>
    </div>
    <div class="panel">
        <div class="panel-body">
            <div class="filter-bar lic-filter-bar">
                <label>🔍 Filtros:</label>
                <input id="lic-filter-convocatoria" placeholder="Convocatoria..." value="${S.licFilters.convocatoria}">
                <input id="lic-filter-proyecto" placeholder="Proyecto..." value="${S.licFilters.proyecto}">
                <input id="lic-filter-entidad" placeholder="Entidad..." value="${S.licFilters.entidad}">
                <select id="lic-filter-estado">
                    <option value="">Todos</option>
                    ${estados.map(e => `<option value="${e}" ${S.licFilters.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-ghost" id="lic-filter-apply">Aplicar</button>
                <span class="filter-clear" id="lic-filter-clear">Limpiar</span>
            </div>
            ${rows.length ? `<div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th onclick="toggleLicSort('convocatoria')" class="${S.licSort.column === 'convocatoria' ? 'active' : ''}">Convocatoria <span class="sort-icon">${S.licSort.column === 'convocatoria' ? (S.licSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleLicSort('proyecto')" class="${S.licSort.column === 'proyecto' ? 'active' : ''}">Proyecto <span class="sort-icon">${S.licSort.column === 'proyecto' ? (S.licSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleLicSort('entidad')" class="${S.licSort.column === 'entidad' ? 'active' : ''}">Entidad <span class="sort-icon">${S.licSort.column === 'entidad' ? (S.licSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleLicSort('fecha')" class="${S.licSort.column === 'fecha' ? 'active' : ''}">Fecha <span class="sort-icon">${S.licSort.column === 'fecha' ? (S.licSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleLicSort('monto')" class="${S.licSort.column === 'monto' ? 'active' : ''}" class="tright">Monto <span class="sort-icon">${S.licSort.column === 'monto' ? (S.licSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleLicSort('estado')" class="${S.licSort.column === 'estado' ? 'active' : ''}">Estado <span class="sort-icon">${S.licSort.column === 'estado' ? (S.licSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th>Contacto</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(l => {
                        const contacto = S.contactos.find(c => c.id === l.contactoId);
                        return `<tr>
                            <td>${esc(l.convocatoria)}</td>
                            <td style="font-weight:500;">${esc(l.proyecto)}</td>
                            <td>${esc(l.entidad)}</td>
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(l.fecha)}</td>
                            <td class="tright tnum">${l.monto ? bs(l.monto) : '—'}</td>
                            <td><span class="stamp ${l.estado}">${l.estado}</span></td>
                            <td>${contacto ? esc(contacto.nombre) : '—'}</td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Editar" data-edit-lic="${l.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-lic="${l.id}">${ICONS.trash}</button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table></div>` : `<div class="empty">${ICONS.empty}<div>Sin licitaciones que coincidan con los filtros.</div></div>`}
        </div>
    </div>`;
}

// ---- CONTACTOS ----
function viewContactos() {
    const rows = applyContFiltersAndSort(S.contactos || []);

    return `
    <div class="page-head">
        <div><p class="eyebrow">Contactos</p><h1>Contactos</h1><p>Personas a quienes firmas propuestas.</p></div>
        <div class="page-actions">
            <button class="btn btn-success" id="btn-export-cont-excel">${ICONS.excel} Exportar Excel</button>
            <button class="btn btn-primary" id="btn-new-cont">${ICONS.plus} Nuevo contacto</button>
        </div>
    </div>
    <div class="panel">
        <div class="panel-body">
            <div class="filter-bar cont-filter-bar">
                <label>🔍 Filtros:</label>
                <input id="cont-filter-nombre" placeholder="Nombre..." value="${S.contFilters.nombre}">
                <input id="cont-filter-empresa" placeholder="Empresa..." value="${S.contFilters.empresa}">
                <input id="cont-filter-cargo" placeholder="Cargo..." value="${S.contFilters.cargo}">
                <button class="btn btn-sm btn-ghost" id="cont-filter-apply">Aplicar</button>
                <span class="filter-clear" id="cont-filter-clear">Limpiar</span>
            </div>
            ${rows.length ? `<div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th onclick="toggleContSort('nombre')" class="${S.contSort.column === 'nombre' ? 'active' : ''}">Nombre <span class="sort-icon">${S.contSort.column === 'nombre' ? (S.contSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleContSort('empresa')" class="${S.contSort.column === 'empresa' ? 'active' : ''}">Empresa <span class="sort-icon">${S.contSort.column === 'empresa' ? (S.contSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleContSort('cargo')" class="${S.contSort.column === 'cargo' ? 'active' : ''}">Cargo <span class="sort-icon">${S.contSort.column === 'cargo' ? (S.contSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleContSort('telefono')" class="${S.contSort.column === 'telefono' ? 'active' : ''}">Teléfono <span class="sort-icon">${S.contSort.column === 'telefono' ? (S.contSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleContSort('email')" class="${S.contSort.column === 'email' ? 'active' : ''}">Correo <span class="sort-icon">${S.contSort.column === 'email' ? (S.contSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(c => `
                        <tr>
                            <td style="font-weight:500;">${esc(c.nombre)}</td>
                            <td>${esc(c.empresa)}</td>
                            <td>${esc(c.cargo)}</td>
                            <td>${esc(c.telefono)}</td>
                            <td>${esc(c.email)}</td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Editar" data-edit-cont="${c.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-cont="${c.id}">${ICONS.trash}</button>
                                </div>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table></div>` : `<div class="empty">${ICONS.empty}<div>Sin contactos registrados.</div></div>`}
        </div>
    </div>`;
}

// ---- CONFIG ----
function viewConfig() {
    const hasConfig = getSavedFirebaseConfig() !== null;
    return `
    <div class="page-head"><div><p class="eyebrow">Ajustes</p><h1>Configuración</h1><p>Personaliza tu marca y conecta Firebase.</p></div></div>
    <div class="panel"><div class="panel-body">
        <div style="margin-bottom:24px;">
            <h4 style="font-size:13.5px;color:var(--primary);margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border);">Conexión a Firebase</h4>
            ${hasConfig && S.user ? `
                <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    <span style="display:inline-flex;align-items:center;gap:6px;color:#27AE60;font-weight:500;">● Conectado como ${S.user.email}</span>
                    <button class="btn btn-danger btn-sm" id="btn-disconnect-firebase">Desconectar</button>
                </div>
            ` : `
                <div class="field"><label>Configuración de Firebase (JSON)</label>
                    <textarea id="firebase-config-input" rows="6" placeholder='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}' style="font-family:'JetBrains Mono',monospace;font-size:12px;"></textarea>
                    <div style="margin-top:8px;display:flex;gap:8px;">
                        <button class="btn btn-primary" id="btn-connect-firebase">Conectar</button>
                    </div>
                    <div style="margin-top:8px;font-size:12px;color:var(--text-soft);">
                        💡 Obtén esta configuración en Firebase Console → Configuración del proyecto → Tus aplicaciones → Configuración del SDK
                    </div>
                </div>
            `}
        </div>
        <div style="margin-bottom:24px;">
            <h4 style="font-size:13.5px;color:var(--primary);margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border);">Firma para el PDF</h4>
            <div class="field"><label>Nombre / firma</label><input id="cfg-nombre" value="${attr(S.config.nombre)}"></div>
            <div class="field"><label>Credencial (RNI)</label><input id="cfg-rni" value="${attr(S.config.rni)}"></div>
        </div>
        <div style="margin-bottom:24px;">
            <h4 style="font-size:13.5px;color:var(--primary);margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border);">Logo</h4>
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;">
                <div style="width:64px;height:64px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;flex-shrink:0;" id="logo-preview">
                    ${S.config.logo ? `<img src="${S.config.logo}" style="width:100%;height:100%;object-fit:cover;">` : '—'}
                </div>
                <div>
                    <input type="file" id="cfg-logo-file" accept="image/*">
                    <div style="font-size:11.5px;color:var(--text-soft);margin-top:4px;">Se incluye en el encabezado del PDF.</div>
                    <button class="btn btn-ghost btn-sm" id="btn-remove-logo" style="margin-top:6px;">Quitar logo</button>
                </div>
            </div>
        </div>
        <button class="btn btn-primary" id="btn-save-cfg">Guardar configuración</button>
    </div></div>`;
}

// ---- ACTIVIDADES ----
function viewActividades() {
    const rows = applyActFiltersAndSort(S.actividades || []);
    const clientesUnicos = [...new Set(S.actividades.map(a => a.cliente).filter(Boolean))].sort();

    return `
    <div class="page-head">
        <div><p class="eyebrow">Registro</p><h1>Actividades</h1><p>Registro de viajes, reuniones y visitas técnicas.</p></div>
        <div class="page-actions">
            <button class="btn btn-primary" id="btn-new-actividad">${ICONS.plus} Nueva actividad</button>
        </div>
    </div>
    <div class="panel">
        <div class="panel-body">
            <div class="filter-bar act-filter-bar">
                <label>🔍 Filtros:</label>
                <select id="act-filter-tipo">
                    <option value="">Todos</option>
                    ${Object.entries(TIPOS_ACTIVIDAD).map(([key, val]) => 
                        `<option value="${key}" ${S.actFilters.tipo === key ? 'selected' : ''}>${val.label}</option>`
                    ).join('')}
                </select>
                <input type="date" id="act-filter-fecha" value="${S.actFilters.fecha}">
                <input id="act-filter-cliente" list="clientes-act-list" placeholder="Cliente..." value="${S.actFilters.cliente}">
                <datalist id="clientes-act-list">${clientesUnicos.map(c => `<option value="${c}">`).join('')}</datalist>
                <input id="act-filter-proyecto" placeholder="Proyecto..." value="${S.actFilters.proyecto}">
                <button class="btn btn-sm btn-ghost" id="act-filter-apply">Aplicar</button>
                <span class="filter-clear" id="act-filter-clear">Limpiar</span>
            </div>
            ${rows.length ? `
            <div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th onclick="toggleActSort('fecha')" class="${S.actSort.column === 'fecha' ? 'active' : ''}">Fecha <span class="sort-icon">${S.actSort.column === 'fecha' ? (S.actSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleActSort('tipo')" class="${S.actSort.column === 'tipo' ? 'active' : ''}">Tipo <span class="sort-icon">${S.actSort.column === 'tipo' ? (S.actSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleActSort('titulo')" class="${S.actSort.column === 'titulo' ? 'active' : ''}">Título <span class="sort-icon">${S.actSort.column === 'titulo' ? (S.actSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleActSort('cliente')" class="${S.actSort.column === 'cliente' ? 'active' : ''}">Cliente <span class="sort-icon">${S.actSort.column === 'cliente' ? (S.actSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="toggleActSort('proyecto')" class="${S.actSort.column === 'proyecto' ? 'active' : ''}">Proyecto <span class="sort-icon">${S.actSort.column === 'proyecto' ? (S.actSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th>Ubicación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(a => {
                        const tipoInfo = TIPOS_ACTIVIDAD[a.tipo] || TIPOS_ACTIVIDAD.otro;
                        return `<tr>
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(a.fecha)}</td>
                            <td><span style="color:${tipoInfo.color};">${tipoInfo.icon} ${tipoInfo.label}</span></td>
                            <td style="font-weight:500;">${esc(a.titulo)}</td>
                            <td>${esc(a.cliente||'—')}</td>
                            <td>${esc(a.proyecto||'—')}</td>
                            <td style="font-size:12px;color:var(--text-soft);">${esc(a.ubicacion||'—')}</td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Ver detalle" data-ver-act="${a.id}">📋</button>
                                    <button class="iconbtn" title="Editar" data-edit-act="${a.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-act="${a.id}">${ICONS.trash}</button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table></div>` : `<div class="empty">${ICONS.empty}<div>Sin actividades registradas.</div></div>`}
        </div>
    </div>`;
}

// ---- FUNCIÓN PARA ELIMINAR UN PAGO DEL HISTORIAL ----
async function eliminarPagoHistorial(pagoId) {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar este pago registrado?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const pagoIndex = S.pagos.findIndex(p => p.id === pagoId);
        if (pagoIndex === -1) {
            toast('⚠️ No se encontró el pago.');
            return;
        }
        
        const pagoEliminado = S.pagos[pagoIndex];
        const montoEliminado = Number(pagoEliminado.montoPagado || 0);
        
        let pagoPrincipal = null;
        let pagoPrincipalIndex = -1;
        
        if (pagoEliminado.cotizacionId) {
            pagoPrincipalIndex = S.pagos.findIndex(p => 
                p.cotizacionId === pagoEliminado.cotizacionId && 
                p.id !== pagoId &&
                Number(p.monto) > 0
            );
            if (pagoPrincipalIndex !== -1) {
                pagoPrincipal = S.pagos[pagoPrincipalIndex];
            }
        }
        
        S.pagos.splice(pagoIndex, 1);
        
        if (pagoPrincipal && pagoPrincipalIndex !== -1) {
            const nuevoMontoPagado = Math.max(0, (Number(pagoPrincipal.montoPagado || 0) - montoEliminado));
            pagoPrincipal.montoPagado = nuevoMontoPagado;
            const notaEliminacion = `❌ Pago de ${bs(montoEliminado)} eliminado (${fmtDate(new Date().toISOString())})`;
            pagoPrincipal.notas = pagoPrincipal.notas ? pagoPrincipal.notas + '\n' + notaEliminacion : notaEliminacion;
            S.pagos[pagoPrincipalIndex] = pagoPrincipal;
        }
        
        await savePagos(S.user?.uid);
        
        if (S.expandedPagoId === pagoEliminado.cotizacionId || S.expandedPagoId === pagoId) {
            const principal = S.pagos.find(p => 
                p.cotizacionId === pagoEliminado.cotizacionId && 
                Number(p.monto) > 0
            );
            S.expandedPagoId = principal ? principal.id : null;
        }
        
        toast('✅ Pago eliminado correctamente.');
        render();
    } catch (error) {
        console.error('Error al eliminar pago:', error);
        toast('❌ Error al eliminar el pago.');
    }
}

// ---- FUNCIÓN PARA ELIMINAR LA DEUDA PRINCIPAL ----
async function eliminarPagoPrincipal(pagoId) {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar esta deuda y todos sus pagos asociados?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const pagoIndex = S.pagos.findIndex(p => p.id === pagoId);
        if (pagoIndex === -1) {
            toast('⚠️ No se encontró la deuda.');
            return;
        }
        
        const pagoEliminado = S.pagos[pagoIndex];
        const pagosAsociados = S.pagos.filter(p => p.cotizacionId === pagoEliminado.cotizacionId && p.id !== pagoId);
        const idsAEliminar = pagosAsociados.map(p => p.id);
        
        S.pagos = S.pagos.filter(p => p.id !== pagoId && !idsAEliminar.includes(p.id));
        await savePagos(S.user?.uid);
        
        toast('✅ Deuda y pagos asociados eliminados correctamente.');
        S.expandedPagoId = null;
        render();
    } catch (error) {
        console.error('Error al eliminar deuda:', error);
        toast('❌ Error al eliminar la deuda.');
    }
}

// ---- EXPORTAR FUNCIONES PARA USO GLOBAL ----
window.abrirCotizacion = abrirCotizacion;
window.togglePagoDetalle = togglePagoDetalle;
window.openRegisterPagoModalFromDetalle = openRegisterPagoModalFromDetalle;
window.eliminarPagoHistorial = eliminarPagoHistorial;
window.eliminarPagoPrincipal = eliminarPagoPrincipal;
window.verActividadDetalle = verActividadDetalle;
window.viewAdministrativo = viewAdministrativo;
