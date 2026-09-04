// ============================================================
// DASHBOARD CHARTS - Gráficas nativas SVG/HTML
// Sin dependencias externas. Solo renderiza cuando S.view=dashboard.
// ============================================================
(function (global) {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';

    function money(v) {
        return typeof bs === 'function' ? bs(v) : `${Number(v || 0).toLocaleString('es-BO', { maximumFractionDigits: 2 })} Bs`;
    }

    function escHtml(v) {
        return typeof esc === 'function' ? esc(String(v ?? '')) : String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    function svgEl(tag, attrs = {}, text = '') {
        const el = document.createElementNS(NS, tag);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
        if (text) el.textContent = text;
        return el;
    }

    function empty(message) {
        return `<div class="dash-chart-empty">${escHtml(message)}</div>`;
    }

    function monthlyPayments() {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('es-BO', { month: 'short' }).replace('.', ''),
                value: 0
            });
        }
        const rows = [];
        (S.cotizaciones || []).forEach(c => {
            const regs = typeof getPagosRegistradosByCotizacionId === 'function' ? getPagosRegistradosByCotizacionId(c.id) : [];
            if (regs.length) regs.forEach(p => rows.push(p));
            else {
                const principal = typeof getPagoPrincipalByCotizacionId === 'function' ? getPagoPrincipalByCotizacionId(c.id) : null;
                if (principal && Number(principal.montoPagado || 0) > 0) rows.push(principal);
            }
        });
        rows.forEach(p => {
            const key = String(p.fecha || '').slice(0, 7);
            const m = months.find(x => x.key === key);
            if (m) m.value += Number(p.montoPagado || 0);
        });
        return months;
    }

    function renderPaymentBars() {
        const data = monthlyPayments();
        const max = Math.max(1, ...data.map(d => d.value));
        const width = 520, height = 220, left = 42, right = 12, top = 18, bottom = 34;
        const chartW = width - left - right, chartH = height - top - bottom;
        const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Cobros por mes' });
        [0, .5, 1].forEach(t => {
            const y = top + chartH - t * chartH;
            svg.appendChild(svgEl('line', { x1:left, x2:width-right, y1:y, y2:y, class:'dash-grid-line' }));
            svg.appendChild(svgEl('text', { x:left-7, y:y+4, 'text-anchor':'end', class:'dash-axis-label' }, money(max*t).replace(' Bs','')));
        });
        const gap = 14, barW = Math.min(48, (chartW - gap * (data.length - 1)) / data.length);
        data.forEach((d, i) => {
            const x = left + i * (barW + gap);
            const h = (d.value / max) * chartH;
            svg.appendChild(svgEl('rect', { x, y:top+chartH-h, width:barW, height:Math.max(2,h), rx:4, class:'dash-bar' }));
            svg.appendChild(svgEl('text', { x:x+barW/2, y:height-10, 'text-anchor':'middle', class:'dash-axis-label' }, d.label));
            if (d.value > 0) svg.appendChild(svgEl('text', { x:x+barW/2, y:top+chartH-h-6, 'text-anchor':'middle', class:'dash-value-label' }, money(d.value).replace(' Bs','')));
        });
        return svg.outerHTML;
    }

    function renderQuoteDonut() {
        const cots = S.cotizaciones || [];
        if (!cots.length) return empty('Sin cotizaciones registradas.');
        const counts = { aceptada:0, enviada:0, borrador:0, rechazada:0 };
        cots.forEach(c => { if (counts[c.estado] !== undefined) counts[c.estado]++; });
        const total = Object.values(counts).reduce((a,b)=>a+b,0);
        if (!total) return empty('Sin estados disponibles.');
        const cx=92, cy=92, r=62, stroke=25, circ=2*Math.PI*r;
        let offset=0;
        const parts = [
            ['aceptada','Aceptadas'],['enviada','Enviadas'],['borrador','Borradores'],['rechazada','Rechazadas']
        ];
        let svg = `<svg viewBox="0 0 184 184" class="dash-donut" role="img" aria-label="Estados de cotizaciones"><circle cx="92" cy="92" r="62" class="dash-donut-bg"/>`;
        parts.forEach(([key,label]) => {
            const n=counts[key]; if(!n)return;
            const len=circ*n/total;
            svg += `<circle cx="${cx}" cy="${cy}" r="${r}" class="dash-donut-segment ${key}" stroke-dasharray="${len} ${circ-len}" stroke-dashoffset="${-offset}"/>`;
            offset += len;
        });
        svg += `<text x="92" y="88" text-anchor="middle" class="dash-donut-total">${total}</text><text x="92" y="106" text-anchor="middle" class="dash-donut-caption">cotizaciones</text></svg>`;
        const legend = parts.map(([key,label]) => `<div class="dash-legend-row"><span class="dash-legend-dot ${key}"></span><span>${label}</span><strong>${counts[key]}</strong></div>`).join('');
        return `<div class="dash-donut-wrap">${svg}<div class="dash-legend">${legend}</div></div>`;
    }

    function renderTenderBars() {
        const lic = S.licitaciones || [];
        if (!lic.length) return empty('Sin licitaciones registradas.');
        const labels = { adjudicada:'Adjudicadas', evaluacion:'En evaluación', 'no-adjudicada':'No adjudicadas' };
        const counts = Object.keys(labels).map(k => [k, lic.filter(x=>x.estado===k).length]);
        const max = Math.max(1, ...counts.map(x=>x[1]));
        return counts.map(([key,n]) => `<div class="dash-hbar"><div class="dash-hbar-head"><span>${labels[key]}</span><strong>${n}</strong></div><div class="dash-hbar-track"><div class="dash-hbar-fill ${key}" style="width:${(n/max)*100}%"></div></div></div>`).join('');
    }

    function renderClientDebtBars() {
        const rows = typeof getAcceptedDebtRows === 'function' ? getAcceptedDebtRows() : [];
        if (!rows.length) return empty('No hay cartera pendiente.');
        const byClient = {};
        rows.forEach(r => { const k=r.cliente || 'Sin cliente'; byClient[k]=(byClient[k]||0)+Number(r.saldoPendiente||0); });
        const data=Object.entries(byClient).sort((a,b)=>b[1]-a[1]).slice(0,5), max=Math.max(1,...data.map(x=>x[1]));
        return data.map(([client,value])=>`<div class="dash-hbar"><div class="dash-hbar-head"><span title="${escHtml(client)}">${escHtml(client)}</span><strong>${money(value)}</strong></div><div class="dash-hbar-track"><div class="dash-hbar-fill deuda" style="width:${(value/max)*100}%"></div></div></div>`).join('');
    }

    function mount() {
        if (typeof S === 'undefined' || S.view !== 'dashboard') return;
        const main=document.getElementById('main'); if(!main)return;
        const old=document.getElementById('dashboard-charts'); if(old)old.remove();
        const host=document.createElement('section'); host.id='dashboard-charts'; host.className='dashboard-charts';
        host.innerHTML=`
            <div class="dash-chart-card dash-chart-wide"><div class="dash-chart-head"><div><h3>💵 Cobros por mes</h3><span>Últimos 6 meses registrados</span></div></div><div class="dash-chart-body">${renderPaymentBars()}</div></div>
            <div class="dash-chart-card"><div class="dash-chart-head"><div><h3>📊 Estado de cotizaciones</h3><span>Distribución actual</span></div></div><div class="dash-chart-body">${renderQuoteDonut()}</div></div>
            <div class="dash-chart-card"><div class="dash-chart-head"><div><h3>🏆 Resultado de licitaciones</h3><span>Distribución por estado</span></div></div><div class="dash-chart-body dash-bars-body">${renderTenderBars()}</div></div>
            <div class="dash-chart-card dash-chart-wide"><div class="dash-chart-head"><div><h3>👤 Cartera por cliente</h3><span>Saldo pendiente, ordenado de mayor a menor</span></div></div><div class="dash-chart-body dash-bars-body">${renderClientDebtBars()}</div></div>
        `;
        main.appendChild(host);
    }

    function injectStyles() {
        if(document.getElementById('dashboard-chart-styles'))return;
        const style=document.createElement('style');style.id='dashboard-chart-styles';style.textContent=`
            .dashboard-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:18px;margin-bottom:20px}
            .dash-chart-card{min-width:0;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);overflow:hidden}
            .dash-chart-wide{grid-column:span 1}
            .dash-chart-head{padding:15px 17px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start}
            .dash-chart-head h3{margin:0;font-size:14px;color:var(--primary)}
            .dash-chart-head span{display:block;margin-top:3px;font-size:11px;color:var(--text-soft)}
            .dash-chart-body{padding:12px 15px;min-height:220px;box-sizing:border-box}
            .dash-bars-body{padding-top:18px}
            .dash-grid-line{stroke:var(--border);stroke-width:1}
            .dash-axis-label{fill:var(--text-soft);font-size:10px;font-family:Inter,sans-serif}
            .dash-value-label{fill:var(--text);font-size:9px;font-family:JetBrains Mono,monospace}
            .dash-bar{fill:var(--accent);opacity:.9}
            .dash-chart-empty{min-height:190px;display:flex;align-items:center;justify-content:center;color:var(--text-soft);font-size:13px;text-align:center}
            .dash-donut-wrap{display:grid;grid-template-columns:190px minmax(0,1fr);align-items:center;gap:8px;min-height:190px}
            .dash-donut{width:190px;height:190px}
            .dash-donut-bg{fill:none;stroke:var(--gantt-bg);stroke-width:25}
            .dash-donut-segment{fill:none;stroke-width:25;transform:rotate(-90deg);transform-origin:92px 92px}
            .dash-donut-segment.aceptada,.dash-legend-dot.aceptada{stroke:var(--success);background:var(--success)}
            .dash-donut-segment.enviada,.dash-legend-dot.enviada{stroke:var(--accent);background:var(--accent)}
            .dash-donut-segment.borrador,.dash-legend-dot.borrador{stroke:var(--primary);background:var(--primary)}
            .dash-donut-segment.rechazada,.dash-legend-dot.rechazada{stroke:var(--danger);background:var(--danger)}
            .dash-donut-total{font-size:27px;font-weight:700;fill:var(--primary)}
            .dash-donut-caption{font-size:10px;fill:var(--text-soft)}
            .dash-legend{display:grid;gap:10px}
            .dash-legend-row{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:8px;align-items:center;font-size:12px}
            .dash-legend-dot{width:9px;height:9px;border-radius:50%}
            .dash-hbar{margin-bottom:18px}.dash-hbar:last-child{margin-bottom:0}
            .dash-hbar-head{display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:6px}.dash-hbar-head span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dash-hbar-head strong{font-family:JetBrains Mono,monospace;font-size:11px;font-weight:500}
            .dash-hbar-track{height:12px;background:var(--gantt-bg);border-radius:6px;overflow:hidden}.dash-hbar-fill{height:100%;border-radius:6px;background:var(--accent)}
            .dash-hbar-fill.adjudicada{background:var(--success)}.dash-hbar-fill.evaluacion{background:var(--accent)}.dash-hbar-fill.no-adjudicada{background:var(--danger)}.dash-hbar-fill.deuda{background:var(--danger)}
            @media(max-width:900px){.dashboard-charts{grid-template-columns:1fr}.dash-chart-wide{grid-column:span 1}}
            @media(max-width:480px){.dash-donut-wrap{grid-template-columns:1fr}.dash-donut{margin:auto}.dash-chart-body{min-height:0}.dashboard-charts{gap:12px}}
        `;document.head.appendChild(style);
    }

    injectStyles();
    global.renderDashboardCharts=mount;
})(window);
