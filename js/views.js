// ============================================================
// VIEWS - Todas las vistas
// ============================================================

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

    <div class="dash-grid-2">
        <div class="panel">
            <div class="panel-h"><h3>📊 Monto por cargo</h3></div>
            <div class="panel-body">
                ${exp.length ? (() => {
                    const porCargo = {};
                    exp.forEach(e => { porCargo[e.cargo] = (porCargo[e.cargo] || 0) + Number(e.monto || 0); });
                    const topCargos = Object.entries(porCargo).sort((a, b) => b[1] - a[1]).slice(0, 6);
                    const maxCargo = Math.max(1, ...topCargos.map(x => x[1]));
                    const colores = ['#1A4A5C', '#3A7A8F', '#B8862E', '#27AE60', '#C0392B', '#8E44AD'];
                    return topCargos.map(([cargo, monto], i) => `
                        <div class="chart-bar-row">
                            <span class="label" title="${esc(cargo)}">${esc(cargo.slice(0, 25))}${cargo.length>25?'…':''}</span>
                            <div class="track">
                                <div class="fill" style="width:${(monto/maxCargo*100)||0}%;background:${colores[i % colores.length]};"></div>
                            </div>
                            <span class="value">${bs(monto)}</span>
                        </div>
                    `).join('');
                })() : '<div style="color:var(--text-soft);font-size:13px;">Sin datos de experiencia aún.</div>'}
            </div>
        </div>
        <div class="panel">
            <div class="panel-h"><h3>📊 Licitaciones por estado</h3></div>
            <div class="panel-body">
                ${lic.length ? (() => {
                    const estados = [
                        { label: 'Presentada', key: 'presentada', color: '#5A5A5A' },
                        { label: 'En evaluación', key: 'evaluacion', color: '#F39C12' },
                        { label: 'Adjudicada', key: 'adjudicada', color: '#27AE60' },
                        { label: 'No adjudicada', key: 'no-adjudicada', color: '#C0392B' },
                        { label: 'En curso', key: 'en-curso', color: '#B8862E' }
                    ];
                    const counts = {};
                    lic.forEach(l => { counts[l.estado] = (counts[l.estado] || 0) + 1; });
                    const maxVal = Math.max(1, ...Object.values(counts));
                    return estados.map(e => `
                        <div class="chart-bar-row">
                            <span class="label">${e.label}</span>
                            <div class="track">
                                <div class="fill" style="width:${((counts[e.key]||0)/maxVal*100)||0}%;background:${e.color};"></div>
                            </div>
                            <span class="value">${counts[e.key]||0}</span>
                        </div>
                    `).join('');
                })() : '<div style="color:var(--text-soft);font-size:13px;">Sin licitaciones registradas aún.</div>'}
            </div>
        </div>
    </div>

    <div class="panel" style="margin-bottom:20px;">
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
                    </div>
                </div>
            `).join('') || '<div style="color:var(--text-soft);font-size:13px;">No hay cotizaciones aceptadas aún.</div>'}
        </div>
    </div>

    <div class="panel">
        <div class="panel-h"><h3>📋 Últimas licitaciones</h3></div>
        <div class="panel-body">
            ${lic.length ? lic.slice(0, 5).map(l => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
                    <div>
                        <div style="font-weight:600;">${esc(l.proyecto)}</div>
                        <div style="font-size:12px;color:var(--text-soft);">${esc(l.entidad)} · ${fmtDate(l.fecha)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span class="stamp ${l.estado}">${l.estado}</span>
                        ${l.monto ? `<span style="font-size:12px;font-weight:500;">${bs(l.monto)}</span>` : ''}
                    </div>
                </div>
            `).join('') : '<div style="color:var(--text-soft);font-size:13px;">Sin licitaciones registradas aún.</div>'}
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
                        <th onclick="toggleCotSort('estado')" class="${S.cotSort.column === 'estado' ? 'active' : ''}">Estado <span class="sort-icon">${S.cotSort.column === 'estado' ? (S.cotSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(c => `
                        <tr>
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(c.fecha)}</td>
                            <td><div style="font-weight:600;font-size:13px;">${esc(c.titulo)}</div><div style="font-size:11.5px;color:var(--text-soft);">${esc(c.proyecto)}</div></td>
                            <td>${esc(c.cliente)}</td>
                            <td class="tright tnum" style="font-weight:600;">${bs(cotTotal(c))}</td>
                            <td><span class="stamp ${c.estado}">${c.estado}</span></td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Exportar PDF" data-pdf="${c.id}">${ICONS.pdf}</button>
                                    <button class="iconbtn" title="Editar" data-edit-cot="${c.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Duplicar" data-dup-cot="${c.id}">${ICONS.copy}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-cot="${c.id}">${ICONS.trash}</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table></div>` : `<div class="empty">${ICONS.empty}<div>No hay cotizaciones que coincidan con los filtros.</div></div>`}
        </div>
    </div>`;
}

// ---- PAGOS ----
function viewPagos() {
    const rows = applyPagoFiltersAndSort(S.pagos || []);
    const estados = ['pendiente', 'parcial', 'pagado'];
    const clientesUnicos = [...new Set(S.pagos.map(p => p.cliente).filter(Boolean))].sort();

    return `
    <div class="page-head">
        <div><p class="eyebrow">Cobros</p><h1>Pagos por cobrar</h1><p>Registro de pagos con fechas, métodos y comprobantes.</p></div>
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
            ${rows.length ? `<div class="table-wrap"><table>
                <thead>
                    <tr>
                        <th onclick="togglePagoSort('fecha')" class="${S.pagoSort.column === 'fecha' ? 'active' : ''}">Fecha <span class="sort-icon">${S.pagoSort.column === 'fecha' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('descripcion')" class="${S.pagoSort.column === 'descripcion' ? 'active' : ''}">Descripción <span class="sort-icon">${S.pagoSort.column === 'descripcion' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
                        <th onclick="togglePagoSort('cliente')" class="${S.pagoSort.column === 'cliente' ? 'active' : ''}">Cliente <span class="sort-icon">${S.pagoSort.column === 'cliente' ? (S.pagoSort.direction === 'asc' ? '▲' : '▼') : '⇅'}</span></th>
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
                        return `<tr>
                            <td class="tnum" style="white-space:nowrap;">${fmtDate(p.fecha)}</td>
                            <td style="font-weight:500;">${esc(p.descripcion||'—')}</td>
                            <td>${esc(p.cliente||'—')}</td>
                            <td class="tright tnum">${bs(p.monto)}</td>
                            <td class="tright tnum">${bs(p.montoPagado||0)}</td>
                            <td class="tright tnum" style="font-weight:600;">${bs(saldo)}</td>
                            <td><span class="stamp ${pagoEstado(p)}">${pagoEstado(p)}</span></td>
                            <td>${p.metodoPago ? `<span class="metodo-pago-badge ${p.metodoPago}">${metodoPagoLabel(p.metodoPago)}</span>` : '—'}</td>
                            <td>
                                <div class="rowactions">
                                    <button class="iconbtn" title="Registrar pago parcial" data-register-pago="${p.id}">💰</button>
                                    <button class="iconbtn" title="Editar" data-edit-pago="${p.id}">${ICONS.edit}</button>
                                    <button class="iconbtn" title="Eliminar" data-del-pago="${p.id}">${ICONS.trash}</button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table></div>` : `<div class="empty">${ICONS.empty}<div>Sin pagos que coincidan con los filtros.</div></div>`}
        </div>
    </div>`;
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
                    <ul style="margin-top:4px;padding-left:20px;font-size:13px;">
                        ${S.formacion.map(f => `<li>${f.grado} — ${f.institucion} (${fmtDate(f.desde)} - ${fmtDate(f.hasta)})</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <strong>Cursos de especialización (${S.cursos.length} cursos):</strong>
                    <ul style="margin-top:4px;padding-left:20px;font-size:13px;">
                        ${S.cursos.slice(0, 5).map(c => `<li>${c.curso} — ${c.institucion} (${c.horas}h)</li>`).join('')}
                        ${S.cursos.length > 5 ? `<li style="color:var(--text-soft);">...y ${S.cursos.length - 5} cursos más</li>` : ''}
                    </ul>
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
        <div class="panel-body">
            ${renderGantt()}
        </div>
    </div>

    <div class="panel">
        <div class="panel-h">
            <h3>Lista de proyectos</h3>
        </div>
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
