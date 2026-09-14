// ============================================================
// UI - AUDITORÍA DE INDICADORES FINANCIEROS
// Solo lectura, salvo el botón de reparación controlada Yamparaez.
// Este módulo también corrige la agregación financiera para que
// pagos parciales antiguos no se cuenten como deudas independientes.
// ============================================================
(function (global) {
    'use strict';

    const money = v => typeof bs === 'function' ? bs(Number(v) || 0) : `Bs ${(Number(v) || 0).toFixed(2)}`;
    const safe = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '');

    function isPartialRecord(p) {
        const d = String(p?.descripcion || '').trim().toLowerCase();
        return !!p?.pagoPrincipalId || /^pago parcial\s*-/.test(d);
    }

    // Una fila financiera representa una deuda real, no cada movimiento.
    // Los pagos parciales se contabilizan dentro de su principal y nunca
    // como una segunda deuda/facturación independiente.
    function buildFinancialRows(includePaid = true) {
        const cotizaciones = Array.isArray(S.cotizaciones) ? S.cotizaciones : [];
        const pagos = Array.isArray(S.pagos) ? S.pagos : [];
        const cotIds = new Set(cotizaciones.map(c => String(c?.id)));
        const rows = [];

        cotizaciones.forEach(cotizacion => {
            const resumen = typeof getResumenCotizacion === 'function'
                ? getResumenCotizacion(cotizacion)
                : { montoTotal: Number(cotizacion?.montoTotal || cotizacion?.total || 0), totalPagado: 0, saldoPendiente: 0, porcentaje: 0, estado: 'pendiente' };
            if (Number(resumen.montoTotal) <= 0) return;
            if (!includePaid && Number(resumen.saldoPendiente) <= 0.01) return;
            const principal = typeof getPagoPrincipalByCotizacionId === 'function'
                ? getPagoPrincipalByCotizacionId(cotizacion.id)
                : null;
            rows.push({
                ...cotizacion,
                ...resumen,
                origen: principal ? 'pago-administrativo' : 'cotizacion',
                pagoPrincipalId: principal?.id || null
            });
        });

        pagos.forEach(p => {
            if (Number(p?.monto) <= 0) return;
            if (isPartialRecord(p)) return;
            const cotizacionId = p?.cotizacionId;
            if (cotizacionId && cotIds.has(String(cotizacionId))) return;

            const montoTotal = Number(p.monto) || 0;
            const totalPagado = Number(p.montoPagado) || 0;
            const saldoPendiente = Math.max(0, montoTotal - totalPagado);
            if (!includePaid && saldoPendiente <= 0.01) return;

            rows.push({
                ...p,
                id: p.cotizacionId || `pago-${p.id}`,
                cliente: p.cliente || p.entidad || '',
                titulo: p.descripcion || p.concepto || p.nombre || 'Pago por cobrar',
                proyecto: p.proyecto || '',
                fecha: p.fecha || p.fechaCreacion || '',
                montoTotal,
                totalPagado,
                saldoPendiente,
                porcentaje: montoTotal > 0 ? Math.min(100, (totalPagado / montoTotal) * 100) : 0,
                estado: saldoPendiente <= 0.01 ? 'pagado' : totalPagado > 0 ? 'parcial' : 'pendiente',
                origen: 'pago'
            });
        });

        return rows.sort((a, b) => Number(b.saldoPendiente || 0) - Number(a.saldoPendiente || 0));
    }

    function getDebtRows() {
        return buildFinancialRows(false);
    }

    function getFacturadoRows() {
        return buildFinancialRows(true);
    }

    function getCobradoRows() {
        return buildFinancialRows(true).filter(p => Number(p.totalPagado || 0) > 0);
    }

    function getCarteraFinancieraSafe() {
        return getDebtRows();
    }

    function getResumenPagosSafe() {
        const rows = buildFinancialRows(true);
        let totalFacturado = 0;
        let totalCobrado = 0;
        let totalPorCobrar = 0;
        let deudasPendientes = 0;
        let deudasParciales = 0;
        let deudasPagadas = 0;

        rows.forEach(row => {
            const monto = Number(row.montoTotal) || 0;
            const pagado = Number(row.totalPagado) || 0;
            const saldo = Math.max(0, Number(row.saldoPendiente) || 0);
            totalFacturado += monto;
            totalCobrado += pagado;
            if (saldo > 0.01) {
                totalPorCobrar += saldo;
                if (pagado > 0) deudasParciales++;
                else deudasPendientes++;
            } else if (monto > 0) {
                deudasPagadas++;
            }
        });

        return {
            totalFacturado,
            totalCobrado,
            totalPorCobrar,
            deudasPendientes,
            deudasParciales,
            deudasPagadas,
            cartera: getDebtRows()
        };
    }

    // Reemplazo seguro de las funciones globales de agregación.
    global.getCarteraFinanciera = getCarteraFinancieraSafe;
    global.getResumenPagos = getResumenPagosSafe;
    global.getAcceptedDebtRows = getDebtRows;

    function showAudit(title, rows, type) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        const total = rows.reduce((s, p) => type === 'deuda'
            ? s + Number(p.saldoPendiente || 0)
            : type === 'cobrado'
                ? s + Number(p.totalPagado || 0)
                : s + Number(p.montoTotal || 0), 0);

        overlay.innerHTML = `
        <div class="modal" style="max-width:1000px;width:94vw;">
            <div class="modal-h"><h3>🔎 ${safe(title)}</h3><button class="close" id="audit-close">&times;</button></div>
            <div class="modal-body">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px;padding:10px 12px;background:var(--gantt-bg);border-radius:var(--radius);">
                    <strong>${rows.length} registros considerados</strong><strong style="color:var(--primary);">Total: ${money(total)}</strong>
                </div>
                <div style="font-size:11px;color:var(--text-soft);margin-bottom:12px;">Los pagos parciales se contabilizan dentro de su deuda principal y no como una deuda independiente.</div>
                ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Cliente</th><th>Proyecto</th><th class="tright">Monto</th><th class="tright">Pagado</th><th class="tright">Saldo</th><th>Origen</th></tr></thead><tbody>${rows.map(p => {
                    const monto = Number(p.montoTotal ?? p.monto ?? 0);
                    const pagado = Number(p.totalPagado ?? p.montoPagado ?? 0);
                    const saldo = Math.max(0, Number(p.saldoPendiente ?? (monto - pagado)));
                    let proyecto = p.proyecto || '';
                    if (!proyecto && p.cotizacionId) {
                        const cot = (S.cotizaciones || []).find(c => String(c.id) === String(p.cotizacionId));
                        proyecto = cot?.proyecto || '';
                    }
                    return `<tr><td class="tnum" style="white-space:nowrap;">${typeof fmtDate === 'function' ? fmtDate(p.fecha || p.fechaCreacion || '') : '—'}</td><td>${safe(p.titulo || p.descripcion || p.concepto || p.nombre || '—')}</td><td>${safe(p.cliente || p.entidad || '—')}</td><td>${safe(proyecto || '—')}</td><td class="tright tnum">${money(monto)}</td><td class="tright tnum" style="color:var(--success);">${money(pagado)}</td><td class="tright tnum" style="color:${saldo > 0 ? 'var(--danger)' : 'var(--success)'};">${money(saldo)}</td><td>${safe(p.origen || (p.cotizacionId ? 'Cotización' : 'Administrativo'))}</td></tr>`;
                }).join('')}</tbody></table></div>` : '<div class="empty">No hay registros considerados.</div>'}
            </div>
            <div class="modal-foot"><button class="btn btn-ghost" id="audit-close-btn">Cerrar</button></div>
        </div>`;
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        overlay.querySelector('#audit-close').onclick = close;
        overlay.querySelector('#audit-close-btn').onclick = close;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
    }

    function hasYamparaezTestData() {
        return (Array.isArray(S.pagos) ? S.pagos : []).some(p => {
            const d = String(p?.descripcion || '').toLowerCase();
            return String(p?.cliente || '').toLowerCase().includes('juan pablo diaz') && d.includes('prestamo documento') && d.includes('yamparaez') && d.includes('pago parcial');
        });
    }

    function enhance() {
        if (S.view !== 'administrativo') return;
        const main = document.getElementById('main');
        if (!main) return;
        const kpis = Array.from(main.querySelectorAll('.kpi'));
        const defs = [
            { match: 'Deuda total', label: 'Ver registros', type: 'deuda', get: getDebtRows },
            { match: 'Cobrado a la fecha', label: 'Ver registros', type: 'cobrado', get: getCobradoRows },
            { match: 'Facturado total', label: 'Ver registros', type: 'facturado', get: getFacturadoRows }
        ];
        defs.forEach(def => {
            const kpi = kpis.find(k => (k.querySelector('.label')?.textContent || '').includes(def.match));
            if (!kpi || kpi.querySelector('.finance-audit-btn')) return;
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-ghost finance-audit-btn';
            btn.textContent = '🔎 ' + def.label;
            btn.style.cssText = 'margin-top:8px;font-size:11px;padding:4px 8px;';
            btn.onclick = () => showAudit(def.match, def.get(), def.type);
            const sub = kpi.querySelector('.sub');
            (sub?.parentNode || kpi).appendChild(btn);
        });

        const headActions = main.querySelector('.page-actions');
        if (headActions && global.repararYamparaezPruebas && hasYamparaezTestData() && !headActions.querySelector('.yamparaez-repair-btn')) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-ghost yamparaez-repair-btn';
            btn.textContent = '🛠️ Restaurar Yamparaez de prueba';
            btn.title = 'Restaura la deuda de Bs 2.500 y elimina solo los pagos de prueba Yamparaez';
            btn.onclick = global.repararYamparaezPruebas;
            headActions.appendChild(btn);
        }
    }

    global.enhanceAdminFinanceAudit = enhance;
    const observer = new MutationObserver(() => { if (S.view === 'administrativo') setTimeout(enhance, 0); });
    observer.observe(document.body, { childList: true, subtree: true });
})(window);
