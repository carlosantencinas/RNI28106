// ============================================================
// UI - AUDITORÍA DE INDICADORES FINANCIEROS
// Solo lectura, salvo el botón de reparación controlada Yamparaez.
// ============================================================
(function (global) {
    'use strict';

    const money = v => typeof bs === 'function' ? bs(Number(v) || 0) : `Bs ${(Number(v) || 0).toFixed(2)}`;
    const safe = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '');

    function getDebtRows() { return typeof getCarteraFinanciera === 'function' ? getCarteraFinanciera() : []; }
    function getFacturadoRows() { return (Array.isArray(S.pagos) ? S.pagos : []).filter(p => Number(p?.monto || 0) > 0); }
    function getCobradoRows() { return (Array.isArray(S.pagos) ? S.pagos : []).filter(p => Number(p?.montoPagado || 0) > 0 || Number(p?.monto || 0) > 0); }

    function showAudit(title, rows, type) {
        const overlay = document.createElement('div'); overlay.className = 'overlay';
        const total = rows.reduce((s, p) => type === 'deuda' ? s + Number(p.saldoPendiente || 0) : type === 'cobrado' ? s + Number(p.montoPagado || 0) : s + Number(p.monto || 0), 0);
        overlay.innerHTML = `
        <div class="modal" style="max-width:1000px;width:94vw;">
            <div class="modal-h"><h3>🔎 ${safe(title)}</h3><button class="close" id="audit-close">&times;</button></div>
            <div class="modal-body">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding:10px 12px;background:var(--gantt-bg);border-radius:var(--radius);"><strong>${rows.length} registros considerados</strong><strong style="color:var(--primary);">Total: ${money(total)}</strong></div>
                ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Cliente</th><th>Proyecto</th><th class="tright">Monto</th><th class="tright">Pagado</th><th class="tright">Saldo</th><th>Origen</th></tr></thead><tbody>${rows.map(p => {
                    const monto = Number(p.montoTotal ?? p.monto ?? 0), pagado = Number(p.totalPagado ?? p.montoPagado ?? 0), saldo = Math.max(0, Number(p.saldoPendiente ?? (monto - pagado)));
                    let proyecto = p.proyecto || ''; if (!proyecto && p.cotizacionId) { const cot = (S.cotizaciones || []).find(c => String(c.id) === String(p.cotizacionId)); proyecto = cot?.proyecto || ''; }
                    return `<tr><td class="tnum" style="white-space:nowrap;">${typeof fmtDate==='function'?fmtDate(p.fecha||p.fechaCreacion||''):'—'}</td><td>${safe(p.titulo || p.descripcion || p.concepto || p.nombre || '—')}</td><td>${safe(p.cliente || p.entidad || '—')}</td><td>${safe(proyecto || '—')}</td><td class="tright tnum">${money(monto)}</td><td class="tright tnum" style="color:var(--success);">${money(pagado)}</td><td class="tright tnum" style="color:${saldo>0?'var(--danger)':'var(--success)'};">${money(saldo)}</td><td>${safe(p.origen || (p.cotizacionId ? 'Cotización' : 'Administrativo'))}</td></tr>`;
                }).join('')}</tbody></table></div>` : '<div class="empty">No hay registros considerados.</div>'}
            </div>
            <div class="modal-foot"><button class="btn btn-ghost" id="audit-close-btn">Cerrar</button></div>
        </div>`;
        document.body.appendChild(overlay);
        const close = () => overlay.remove(); overlay.querySelector('#audit-close').onclick = close; overlay.querySelector('#audit-close-btn').onclick = close;
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
        const main = document.getElementById('main'); if (!main) return;
        const kpis = Array.from(main.querySelectorAll('.kpi'));
        const defs = [
            { match: 'Deuda total', label: 'Ver registros', type: 'deuda', get: getDebtRows },
            { match: 'Cobrado a la fecha', label: 'Ver registros', type: 'cobrado', get: getCobradoRows },
            { match: 'Facturado total', label: 'Ver registros', type: 'facturado', get: getFacturadoRows }
        ];
        defs.forEach(def => {
            const kpi = kpis.find(k => (k.querySelector('.label')?.textContent || '').includes(def.match)); if (!kpi || kpi.querySelector('.finance-audit-btn')) return;
            const btn = document.createElement('button'); btn.className = 'btn btn-sm btn-ghost finance-audit-btn'; btn.textContent = '🔎 ' + def.label; btn.style.cssText = 'margin-top:8px;font-size:11px;padding:4px 8px;'; btn.onclick = () => showAudit(def.match, def.get(), def.type);
            const sub = kpi.querySelector('.sub'); (sub?.parentNode || kpi).appendChild(btn);
        });

        const headActions = main.querySelector('.page-actions');
        if (headActions && global.repararYamparaezPruebas && hasYamparaezTestData() && !headActions.querySelector('.yamparaez-repair-btn')) {
            const btn = document.createElement('button'); btn.className = 'btn btn-sm btn-ghost yamparaez-repair-btn'; btn.textContent = '🛠️ Restaurar Yamparaez de prueba'; btn.title = 'Restaura la deuda de Bs 2.500 y elimina solo los pagos de prueba Yamparaez'; btn.onclick = global.repararYamparaezPruebas; headActions.appendChild(btn);
        }
    }

    global.enhanceAdminFinanceAudit = enhance;
    const observer = new MutationObserver(() => { if (S.view === 'administrativo') setTimeout(enhance, 0); });
    observer.observe(document.body, { childList: true, subtree: true });
})(window);
