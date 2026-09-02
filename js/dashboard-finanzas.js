// ============================================================
// DASHBOARD FINANZAS - Centro Financiero
// Fuente única: pagos.js / PagosService
// ============================================================

(function (global) {
    'use strict';

    const previousRender = global.render;
    if (typeof previousRender !== 'function') return;

    function getFinancialSummary() {
        return typeof getResumenPagos === 'function'
            ? getResumenPagos()
            : { totalFacturado: 0, totalCobrado: 0, totalPorCobrar: 0, deudasPendientes: 0, deudasParciales: 0, deudasPagadas: 0 };
    }

    // IMPORTANTE: la vista de Pagos por cobrar no debe depender del texto
    // exacto del estado de la cotización. La deuda se determina por su
    // resumen financiero. Así también aparecen registros antiguos o que
    // tengan estado "Aceptada" / "aceptada" / equivalente.
    function getAcceptedDebtRows() {
        const cots = Array.isArray(S.cotizaciones) ? S.cotizaciones : [];
        return cots
            .map(c => ({
                ...c,
                ...(typeof getResumenCotizacion === 'function'
                    ? getResumenCotizacion(c)
                    : { montoTotal: cotTotal(c), totalPagado: 0, saldoPendiente: cotTotal(c), porcentaje: 0, estado: 'pendiente', pagos: [] })
            }))
            .filter(c => Number(c.montoTotal) > 0 && Number(c.saldoPendiente) > 0.01)
            .sort((a, b) => Number(b.saldoPendiente) - Number(a.saldoPendiente));
    }

    function getPaymentTransactions() {
        const cots = Array.isArray(S.cotizaciones) ? S.cotizaciones : [];
        const transactions = [];

        cots.forEach(c => {
            const principal = typeof getPagoPrincipalByCotizacionId === 'function'
                ? getPagoPrincipalByCotizacionId(c.id) : null;
            const registrados = typeof getPagosRegistradosByCotizacionId === 'function'
                ? getPagosRegistradosByCotizacionId(c.id) : [];

            if (registrados.length) {
                registrados.forEach(p => {
                    const monto = Number(p.montoPagado || 0);
                    if (monto > 0) transactions.push({ ...p, montoPagado: monto, cotizacion: c });
                });
                return;
            }

            if (principal && Number(principal.montoPagado || 0) > 0) {
                transactions.push({ ...principal, montoPagado: Number(principal.montoPagado || 0), cotizacion: c });
            }
        });

        return transactions.filter(p => p.fecha).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    }

    function renderAvancePagosCentralizado() { return getAcceptedDebtRows(); }

    function buildPanelContent(items) {
        if (!items.length) {
            return `<div class="empty" style="padding:20px;">${ICONS.empty}<div>🎉 No hay pagos pendientes por cobrar.</div></div>`;
        }

        return items.map(item => {
            const pagos = typeof getPagosOrdenados === 'function'
                ? getPagosOrdenados(getPagosRegistradosByCotizacionId(item.id)) : [];
            const ultimoPago = pagos.length ? pagos[0] : null;
            const porcentaje = Math.min(100, Math.max(0, Number(item.porcentaje) || 0));

            return `
            <div style="margin-bottom:20px;padding:16px 18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div style="flex:1;min-width:200px;">
                        <div style="font-weight:600;font-size:15px;color:var(--primary);">${esc(item.titulo || '')}</div>
                        <div style="font-size:12px;color:var(--text-soft);margin-top:2px;">${esc(item.cliente || '')} - ${esc(item.proyecto || '')}</div>
                        ${ultimoPago ? `<div style="font-size:12px;color:var(--text-soft);margin-top:4px;">${fmtDate(ultimoPago.fecha)} - ${esc(ultimoPago.descripcion || '')}</div>` : ''}
                    </div>
                    <div style="text-align:right;min-width:120px;">
                        <div style="font-weight:600;font-size:16px;color:var(--primary);">${bs(item.totalPagado)} / ${bs(item.montoTotal)}</div>
                        <div style="font-size:12px;color:var(--text-soft);">Saldo: <strong>${bs(item.saldoPendiente)}</strong></div>
                    </div>
                </div>
                <div style="margin-top:10px;height:6px;background:var(--gantt-bg);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;border-radius:4px;background:${porcentaje >= 80 ? 'var(--gantt-active)' : 'var(--accent)'};width:${porcentaje}%;transition:width 0.5s ease;"></div>
                </div>
                <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-success" onclick="openPagoFromCotizacion('${esc(item.id)}')">${ICONS.plus} Registrar pago</button>
                    <button class="btn btn-sm btn-ghost" onclick="S.view='finanzas';render();">Gestionar pagos</button>
                </div>
                ${pagos.length ? `<div class="payment-history" style="margin-top:10px;">
                    ${pagos.slice(0, 3).map(p => `<div class="entry"><span>${fmtDate(p.fecha)} - ${esc(p.descripcion || '')}${p.metodoPago ? ` <span class="metodo-pago-badge ${p.metodoPago}">${metodoPagoLabel(p.metodoPago)}</span>` : ''}${p.comprobante ? ` <span class="comprobante-num">#${esc(p.comprobante)}</span>` : ''}</span><span style="font-weight:500;">${bs(p.montoPagado)}</span></div>`).join('')}
                    ${pagos.length > 3 ? `<div class="entry" style="color:var(--text-soft);font-style:italic;">...y ${pagos.length - 3} pagos más</div>` : ''}
                </div>` : ''}
            </div>`;
        }).join('');
    }

    function buildFinancialCenter() {
        const summary = getFinancialSummary();
        const cartera = getAcceptedDebtRows();
        const transactions = getPaymentTransactions();
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('es-BO', { month: 'short' }), total: 0 });
        }
        transactions.forEach(p => {
            const month = months.find(m => m.key === String(p.fecha).slice(0, 7));
            if (month) month.total += Number(p.montoPagado || 0);
        });
        const maxMonth = Math.max(1, ...months.map(m => m.total));
        const kpi = (icon, label, value, note) => `<div style="padding:14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);min-width:0;"><div style="font-size:11px;color:var(--text-soft);text-transform:uppercase;letter-spacing:.04em;">${icon} ${label}</div><div style="font-size:20px;font-weight:650;color:var(--primary);margin-top:5px;">${value}</div><div style="font-size:11px;color:var(--text-soft);margin-top:3px;">${note}</div></div>`;
        const carteraHtml = cartera.length ? cartera.slice(0, 8).map(c => `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:center;"><div style="min-width:0;"><div style="font-size:13px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(c.titulo || 'Sin título')}</div><div style="font-size:11px;color:var(--text-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(c.cliente || '')} · ${Number(c.porcentaje || 0).toFixed(0)}% cobrado</div></div><div style="text-align:right;font-size:13px;font-weight:600;">${bs(c.saldoPendiente)}</div></div>`).join('') : `<div style="padding:16px 0;color:var(--text-soft);font-size:13px;">No hay cartera pendiente.</div>`;

        return `<div class="panel" id="centro-financiero" style="margin-top:18px;"><div class="panel-h"><div><h3>💰 Centro Financiero</h3><span>Resumen de cartera y comportamiento de cobros</span></div><button class="btn btn-sm btn-ghost" onclick="S.view='finanzas';render();">Gestionar pagos</button></div><div class="panel-body"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px;">${kpi('💵','Cobrado acumulado',bs(summary.totalCobrado),`${transactions.length} registros de cobro`)}${kpi('📥','Por cobrar',bs(summary.totalPorCobrar),`${cartera.length} deudas pendientes`)}${kpi('⏳','Deudas pendientes',summary.deudasPendientes,'Sin pagos registrados')}${kpi('🔄','Pagos parciales',summary.deudasParciales,'Cotizaciones con saldo')}${kpi('✅','Pagos completados',summary.deudasPagadas,'Sin saldo pendiente')}</div><div style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:18px;align-items:start;"><div><div style="font-size:13px;font-weight:600;margin-bottom:6px;">📌 Cartera pendiente</div>${carteraHtml}${cartera.length > 8 ? `<div style="font-size:11px;color:var(--text-soft);padding-top:8px;">Mostrando las 8 deudas con mayor saldo.</div>` : ''}</div><div><div style="font-size:13px;font-weight:600;margin-bottom:10px;">📈 Cobros por mes</div><div style="display:flex;align-items:flex-end;gap:8px;height:130px;padding:5px 2px 0;">${months.map(m => `<div style="flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;min-width:0;"><div title="${m.label}: ${bs(m.total)}" style="width:100%;max-width:42px;height:${Math.max(3,(m.total/maxMonth)*100)}px;border-radius:4px 4px 0 0;background:var(--accent);"></div><span style="font-size:10px;color:var(--text-soft);text-transform:capitalize;">${m.label}</span></div>`).join('')}</div></div></div></div></div>`;
    }

    function syncDashboardFinancialView() {
        if (S.view !== 'dashboard') return;
        const main = document.getElementById('main');
        if (!main) return;
        const heading = Array.from(main.querySelectorAll('.panel h3')).find(el => (el.textContent || '').includes('Avance de pagos pendientes'));
        if (heading) {
            const panel = heading.closest('.panel');
            const body = panel?.querySelector('.panel-body');
            if (body) {
                const items = renderAvancePagosCentralizado();
                heading.textContent = `💰 Avance de pagos pendientes (${items.length})`;
                const header = heading.closest('.panel-h');
                const note = header?.querySelector('span');
                if (note) note.textContent = `${items.filter(p => p.porcentaje > 0).length} con pagos parciales`;
                body.innerHTML = buildPanelContent(items);
            }
        }
        const existing = document.getElementById('centro-financiero');
        if (existing) existing.outerHTML = buildFinancialCenter();
        else {
            const panels = main.querySelectorAll('.panel');
            const target = Array.from(panels).find(p => (p.textContent || '').includes('Avance de pagos pendientes')) || panels[panels.length - 1];
            if (target) target.insertAdjacentHTML('afterend', buildFinancialCenter());
        }
    }

    function enhancedRenderWithFinancialSource() { previousRender(); setTimeout(syncDashboardFinancialView, 0); }
    global.render = enhancedRenderWithFinancialSource;
    global.syncDashboardFinancialView = syncDashboardFinancialView;
})(window);
