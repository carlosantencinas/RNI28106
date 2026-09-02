// ============================================================
// DASHBOARD FINANZAS - Vista financiera usando la fuente central
// de pagos (PagosService / pagos.js)
// ============================================================

(function (global) {
    'use strict';

    const previousRender = global.render;
    if (typeof previousRender !== 'function') return;

    function renderAvancePagosCentralizado() {
        const cots = Array.isArray(S.cotizaciones) ? S.cotizaciones : [];
        const aceptadas = cots.filter(c => c.estado === 'aceptada');

        const avance = aceptadas.map(c => {
            const resumen = getResumenCotizacion(c);
            const pagos = getPagosRegistradosByCotizacionId(c.id);
            const pagosOrdenados = getPagosOrdenados(pagos);

            return {
                ...c,
                ...resumen,
                pagos: pagosOrdenados
            };
        }).filter(item => item.saldoPendiente > 0.01);

        return avance;
    }

    function buildPanelContent(items) {
        if (!items.length) {
            return `<div class="empty" style="padding:20px;">${ICONS.empty}<div>🎉 No hay cotizaciones aceptadas pendientes de pago.</div></div>`;
        }

        return items.map(item => {
            const ultimoPago = item.pagos.length ? item.pagos[0] : null;
            const porcentaje = Math.min(100, Math.max(0, Number(item.porcentaje) || 0));

            return `
            <div style="margin-bottom:20px;padding:16px 18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                    <div style="flex:1;min-width:200px;">
                        <div style="font-weight:600;font-size:15px;color:var(--primary);">${esc(item.titulo || '')}</div>
                        <div style="font-size:12px;color:var(--text-soft);margin-top:2px;">
                            ${esc(item.cliente || '')} - ${esc(item.proyecto || '')}
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
                    <div style="height:100%;border-radius:4px;background:${porcentaje >= 80 ? 'var(--gantt-active)' : 'var(--accent)'};width:${porcentaje}%;transition:width 0.5s ease;"></div>
                </div>
                <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-success" onclick="openPagoFromCotizacion('${esc(item.id)}')">${ICONS.plus} Registrar pago</button>
                    <button class="btn btn-sm btn-ghost" onclick="S.view='pagos';render();">Ver todos los pagos</button>
                </div>
                ${item.pagos.length ? `
                    <div class="payment-history" style="margin-top:10px;">
                        ${item.pagos.slice(0, 3).map(p => `
                            <div class="entry">
                                <span>
                                    ${fmtDate(p.fecha)} - ${esc(p.descripcion || '')}
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
        }).join('');
    }

    function syncDashboardFinancialView() {
        if (S.view !== 'dashboard') return;

        const main = document.getElementById('main');
        if (!main) return;

        const heading = Array.from(main.querySelectorAll('.panel h3'))
            .find(el => (el.textContent || '').includes('Avance de pagos pendientes'));
        if (!heading) return;

        const panel = heading.closest('.panel');
        const body = panel?.querySelector('.panel-body');
        if (!body) return;

        const items = renderAvancePagosCentralizado();
        heading.textContent = `💰 Avance de pagos pendientes (${items.length})`;

        const header = heading.closest('.panel-h');
        const note = header?.querySelector('span');
        if (note) {
            const parciales = items.filter(p => p.porcentaje > 0).length;
            note.textContent = `${parciales} con pagos parciales`;
        }

        body.innerHTML = buildPanelContent(items);
    }

    function enhancedRenderWithFinancialSource() {
        previousRender();
        setTimeout(syncDashboardFinancialView, 0);
    }

    global.render = enhancedRenderWithFinancialSource;
    global.syncDashboardFinancialView = syncDashboardFinancialView;
})(window);
