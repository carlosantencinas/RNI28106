// ============================================================
// FINANZAS - Historial, flujo mensual y exportación
// Post-procesado de la vista financiera. No modifica render().
// ============================================================
(function (global) {
    'use strict';

    const escF = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const dinero = v => typeof bs === 'function' ? bs(Number(v) || 0) : `Bs ${(Number(v) || 0).toFixed(2)}`;
    const fecha = v => {
        if (!v) return '—';
        try { return typeof fmtDate === 'function' ? fmtDate(v) : new Date(v).toLocaleDateString('es-BO'); }
        catch (_) { return String(v); }
    };

    function pagoEsPrincipal(p) { return Number(p?.monto) > 0; }

    function getMovimientosCobro() {
        const pagos = Array.isArray(S.pagos) ? S.pagos : [];
        const movimientos = [];
        const principales = pagos.filter(pagoEsPrincipal);
        const idsConParciales = new Set();

        pagos.filter(p => !pagoEsPrincipal(p) && Number(p?.montoPagado) > 0).forEach(p => {
            if (p?.cotizacionId) idsConParciales.add(String(p.cotizacionId));
            movimientos.push({
                id: p.id, fecha: p.fecha || p.fechaCreacion || '', monto: Number(p.montoPagado) || 0,
                cliente: p.cliente || '', descripcion: p.descripcion || p.concepto || 'Pago parcial',
                metodo: p.metodoPago || '', comprobante: p.comprobante || '', cotizacionId: p.cotizacionId || ''
            });
        });

        principales.forEach(p => {
            if (p?.cotizacionId && idsConParciales.has(String(p.cotizacionId))) return;
            const monto = Number(p.montoPagado) || 0;
            if (monto <= 0) return;
            movimientos.push({
                id: `principal-${p.id}`, fecha: p.fecha || p.fechaCreacion || '', monto,
                cliente: p.cliente || p.entidad || '', descripcion: p.descripcion || p.concepto || 'Cobro',
                metodo: p.metodoPago || '', comprobante: p.comprobante || '', cotizacionId: p.cotizacionId || ''
            });
        });
        return movimientos.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    }

    function getMovimientosFiltrados() {
        const f = S.finanzasFilters || {year:'all', month:'all', status:'all'};
        return getMovimientosCobro().filter(p => {
            const ym = String(p.fecha || '').slice(0, 7);
            if (f.year !== 'all' && ym.slice(0,4) !== f.year) return false;
            if (f.month !== 'all' && ym.slice(5,7) !== f.month) return false;
            return true;
        });
    }

    function getMonthlyFlow() {
        const rows = getMovimientosCobro();
        const map = new Map();
        rows.forEach(p => {
            const ym = String(p.fecha || '').slice(0,7);
            if (!/^\d{4}-\d{2}$/.test(ym)) return;
            map.set(ym, (map.get(ym) || 0) + Number(p.monto || 0));
        });
        const now = new Date();
        const out = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            const label = d.toLocaleDateString('es-BO', {month:'short'}).replace('.', '');
            out.push({ym, label: label.charAt(0).toUpperCase()+label.slice(1), monto: map.get(ym) || 0});
        }
        return out;
    }

    function buildMonthlyChart() {
        const rows = getMonthlyFlow();
        const max = Math.max(...rows.map(r => r.monto), 1);
        return `<div class="panel" style="margin-top:18px;"><div class="panel-h"><div><h3>📈 Cobros por mes</h3><span>Movimientos reales registrados · últimos 6 meses</span></div></div><div class="panel-body"><div style="display:grid;grid-template-columns:repeat(6,minmax(45px,1fr));gap:12px;align-items:end;height:190px;padding:10px 4px 0;">${rows.map(r => {const h=r.monto>0?Math.max(8,Math.round((r.monto/max)*130)):3;return `<div style="height:160px;display:flex;flex-direction:column;justify-content:end;align-items:center;gap:7px;"><div style="font-size:11px;font-weight:600;white-space:nowrap;">${r.monto>0?dinero(r.monto):'—'}</div><div title="${escF(r.label)}: ${dinero(r.monto)}" style="width:min(42px,70%);height:${h}px;border-radius:5px 5px 2px 2px;background:var(--accent,#1A4A5C);opacity:.82;"></div><div style="font-size:11px;color:var(--text-soft);text-transform:capitalize;">${escF(r.label)}</div></div>`;}).join('')}</div></div></div>`;
    }

    function buildHistory() {
        const rows = getMovimientosFiltrados();
        const total = rows.reduce((s,p) => s + Number(p.monto || 0), 0);
        return `<div class="panel" style="margin-top:18px;"><div class="panel-h"><div><h3>🧾 Historial de cobros</h3><span>${rows.length} movimiento${rows.length===1?'':'s'} · Total ${dinero(total)}</span></div><button class="btn btn-sm btn-ghost" onclick="exportFinanceHistory()">📤 Exportar Excel</button></div><div class="panel-body">${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Concepto</th><th>Método</th><th>Comprobante</th><th class="tright">Monto</th></tr></thead><tbody>${rows.map(p => `<tr><td>${fecha(p.fecha)}</td><td>${escF(p.cliente || '—')}</td><td>${escF(p.descripcion || '—')}</td><td>${escF(p.metodo || '—')}</td><td>${escF(p.comprobante || '—')}</td><td class="tright tnum"><strong>${dinero(p.monto)}</strong></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty" style="padding:20px;">No hay cobros registrados para los filtros actuales.</div>'}</div></div>`;
    }

    function updateFilteredKpis() {
        const rows = typeof getCarteraFinanciera === 'function' ? getCarteraFinanciera() : [];
        const f = S.finanzasFilters || {year:'all',month:'all',status:'all'};
        const filtered = rows.filter(c => {
            const ym = String(c.fecha || c.fechaAceptacion || c.createdAt || '').slice(0,7);
            if ((f.year !== 'all' || f.month !== 'all') && !ym) return false;
            if (f.year !== 'all' && ym.slice(0,4) !== f.year) return false;
            if (f.month !== 'all' && ym.slice(5,7) !== f.month) return false;
            if (f.status === 'pendiente' && Number(c.totalPagado||0) > .01) return false;
            if (f.status === 'parcial' && !(Number(c.totalPagado||0) > .01 && Number(c.saldoPendiente||0) > .01)) return false;
            return true;
        });
        const total = filtered.reduce((s,c)=>s+Number(c.montoTotal||0),0);
        const cobrado = filtered.reduce((s,c)=>s+Number(c.totalPagado||0),0);
        const saldo = filtered.reduce((s,c)=>s+Number(c.saldoPendiente||0),0);
        const pendientes = filtered.filter(c=>Number(c.totalPagado||0)<=.01).length;
        const parciales = filtered.filter(c=>Number(c.totalPagado||0)>.01&&Number(c.saldoPendiente||0)>.01).length;
        const pagados = filtered.filter(c=>Number(c.saldoPendiente||0)<=.01&&Number(c.montoTotal||0)>0).length;
        const values = [dinero(cobrado),dinero(saldo),pendientes,parciales,pagados];
        document.querySelectorAll('#main > div > div:nth-of-type(2) > .panel').forEach((card,i)=>{const v=card.querySelector('div[style*="font-size:20px"]');if(v&&values[i]!==undefined)v.textContent=values[i];});
        return {total,cobrado,saldo,pendientes,parciales,pagados};
    }

    function exportFinanceHistory() {
        const rows = getMovimientosFiltrados();
        if (!rows.length) { if (typeof toast === 'function') toast('⚠️ No hay movimientos para exportar.'); return; }
        if (!global.XLSX) { if (typeof toast === 'function') toast('⚠️ La librería de Excel aún está cargando.'); return; }
        const data = rows.map(p => ({Fecha:p.fecha||'',Cliente:p.cliente||'',Concepto:p.descripcion||'','Método de pago':p.metodo||'',Comprobante:p.comprobante||'',Monto_Bs:Number(p.monto)||0}));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Historial de cobros');
        ws['!cols'] = [{wch:14},{wch:28},{wch:48},{wch:18},{wch:18},{wch:14}];
        XLSX.writeFile(wb, `Historial_Cobros_${new Date().toISOString().slice(0,10)}.xlsx`);
        if (typeof toast === 'function') toast(`📊 Historial exportado (${rows.length} movimientos).`);
    }

    function enhanceFinanceView() {
        if (S.view !== 'finanzas') return;
        const main = document.getElementById('main');
        if (!main || document.getElementById('finanzas-enhanced-history')) return;
        const marker = document.createElement('div');
        marker.id = 'finanzas-enhanced-history';
        marker.innerHTML = buildMonthlyChart() + buildHistory();
        main.appendChild(marker);
        updateFilteredKpis();
    }

    // Carga diferida del módulo de historial mensual de pagos recurrentes.
    // Así evitamos agregar otro <script> al HTML y mantenemos el render limpio.
    let pagosFijosLoader = null;
    global.syncPagosFijosEnhanced = async function () {
        if (typeof global.__syncPagosFijosEnhancedReal === 'function') return global.__syncPagosFijosEnhancedReal();
        if (!pagosFijosLoader) {
            pagosFijosLoader = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'js/pagos-fijos-enhancements.js';
                s.onload = () => resolve();
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        try { await pagosFijosLoader; if (typeof global.__syncPagosFijosEnhancedReal === 'function') return global.__syncPagosFijosEnhancedReal(); }
        catch (e) { console.warn('No se pudo cargar el historial de pagos recurrentes:', e); }
    };

    global.enhanceFinanceView = enhanceFinanceView;
    global.exportFinanceHistory = exportFinanceHistory;
    global.getMovimientosCobro = getMovimientosCobro;
})(window);
