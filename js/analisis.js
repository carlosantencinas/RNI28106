// ============================================================
// INDICADORES · ANÁLISIS — panel analítico profesional
// ============================================================
(function(){
    'use strict';

    const money=v=>typeof bs==='function'?bs(v):`${Number(v||0).toLocaleString('es-BO',{maximumFractionDigits:2})} Bs`;
    const safe=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const num=v=>Number(v||0);

    function icon(type){
        const paths={
            money:'<path d="M3 7h18v10H3z"/><path d="M7 7V5h10v2M12 10v4M9.5 12h5"/>',
            chart:'<path d="M4 19V5M4 19h17"/><path d="M7 15l3-4 3 2 5-7"/>',
            trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 13v5M8 20h8"/>',
            brief:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 6V4h8v2M3 11h18M10 11v2h4v-2"/>'
        };
        return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[type]||paths.chart}</svg>`;
    }

    function months6(){
        const out=[],now=new Date();
        for(let i=5;i>=0;i--){
            const d=new Date(now.getFullYear(),now.getMonth()-i,1);
            out.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:d.toLocaleDateString('es-BO',{month:'short'}).replace('.',''),cobrado:0,gasto:0});
        }
        return out;
    }

    function financeData(){
        const data=months6();
        (S.pagos||[]).forEach(p=>{const m=data.find(x=>x.key===String(p.fecha||'').slice(0,7));if(m)m.cobrado+=num(p.montoPagado);});
        (S.gastos||[]).forEach(g=>{const m=data.find(x=>x.key===String(g.fecha||'').slice(0,7));if(m)m.gasto+=num(g.monto);});
        return data;
    }

    function lineChart(){
        const data=financeData(), W=760,H=220,L=46,R=18,T=18,B=34, iw=W-L-R,ih=H-T-B;
        const max=Math.max(1,...data.flatMap(d=>[d.cobrado,d.gasto]));
        const x=i=>L+(iw*i/(data.length-1)), y=v=>T+ih-(v/max)*ih;
        const path=k=>data.map((d,i)=>`${i?'L':'M'} ${x(i).toFixed(1)} ${y(d[k]).toFixed(1)}`).join(' ');
        const grid=[0,.25,.5,.75,1].map(p=>{const yy=T+ih-p*ih;return `<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="a-grid"/><text x="${L-8}" y="${yy+4}" text-anchor="end" class="a-axis">${Math.round(max*p).toLocaleString('es-BO')}</text>`}).join('');
        const points=k=>data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d[k])}" r="3.5" class="a-point ${k}"/>`).join('');
        const labels=data.map((d,i)=>`<text x="${x(i)}" y="${H-10}" text-anchor="middle" class="a-label">${safe(d.label)}</text>`).join('');
        return `<div class="a-line-wrap"><div class="a-legend"><span><i class="c1"></i>Cobrado</span><span><i class="c2"></i>Gastos</span></div><svg class="a-line" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cobros y gastos de los últimos seis meses">${grid}<path d="${path('cobrado')}" class="a-line-path c1"/><path d="${path('gasto')}" class="a-line-path c2"/>${points('cobrado')}${points('gasto')}${labels}</svg></div>`;
    }

    function barsExperience(){
        const by={};
        (S.experiencia||[]).forEach(e=>{const k=e.cargo||'Sin cargo';by[k]=(by[k]||0)+num(e.monto);});
        const data=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,6);
        if(!data.length)return empty('No hay experiencia registrada.');
        const max=Math.max(1,...data.map(x=>x[1]));
        return `<div class="a-bars">${data.map(([k,v])=>`<div class="a-bar-row"><div class="a-bar-head"><span title="${safe(k)}">${safe(k)}</span><strong>${money(v)}</strong></div><div class="a-track"><div style="width:${v/max*100}%"></div></div></div>`).join('')}</div>`;
    }

    function tenderDonut(){
        const lic=S.licitaciones||[], total=lic.length;
        if(!total)return empty('No hay licitaciones registradas.');
        const states=[['adjudicada','Adjudicadas'],['evaluacion','En evaluación'],['no-adjudicada','No adjudicadas']];
        let offset=0;
        const circumference=2*Math.PI*46;
        const circles=states.map(([k])=>{const n=lic.filter(x=>x.estado===k).length,p=n/total,seg=`<circle class="donut ${k}" cx="60" cy="60" r="46" pathLength="100" stroke-dasharray="${p*100} ${100-p*100}" stroke-dashoffset="${-offset}"/>`;offset+=p*100;return seg;}).join('');
        return `<div class="a-donut-layout"><div class="a-donut"><svg viewBox="0 0 120 120"><circle class="donut-bg" cx="60" cy="60" r="46"/><g transform="rotate(-90 60 60)">${circles}</g></svg><div><strong>${total}</strong><span>Total</span></div></div><div class="a-state-list">${states.map(([k,l])=>{const n=lic.filter(x=>x.estado===k).length;return `<div><i class="dot ${k}"></i><span>${l}</span><strong>${n}<small>${Math.round(n/total*100)}%</small></strong></div>`}).join('')}</div></div>`;
    }

    function expenseBars(){
        const by={};
        (S.gastos||[]).forEach(g=>{const k=g.categoria||'Otros';by[k]=(by[k]||0)+num(g.monto);});
        const data=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,6);
        if(!data.length)return empty('No hay gastos registrados.');
        const total=data.reduce((s,x)=>s+x[1],0),max=Math.max(1,...data.map(x=>x[1]));
        return `<div class="a-expense-summary"><strong>${money(total)}</strong><span>Principales categorías</span></div><div class="a-bars compact">${data.map(([k,v])=>`<div class="a-bar-row"><div class="a-bar-head"><span>${safe(k)}</span><strong>${money(v)}</strong></div><div class="a-track"><div class="expense" style="width:${v/max*100}%"></div></div></div>`).join('')}</div>`;
    }

    function empty(text){return `<div class="a-empty"><span>○</span><p>${safe(text)}</p></div>`;}

    function kpis(){
        const gastos=(S.gastos||[]).reduce((s,g)=>s+num(g.monto),0);
        const pagos=(S.pagos||[]).reduce((s,p)=>s+num(p.montoPagado),0);
        const cot=S.cotizaciones||[], accepted=cot.filter(c=>String(c.estado||'').toLowerCase()==='aceptada').length;
        const lic=S.licitaciones||[], adjud=lic.filter(x=>x.estado==='adjudicada').length;
        return `<div class="a-kpis">
            <div class="a-kpi"><div class="a-kpi-icon money">${icon('money')}</div><div><span>Cobrado acumulado</span><strong>${money(pagos)}</strong></div></div>
            <div class="a-kpi"><div class="a-kpi-icon chart">${icon('chart')}</div><div><span>Cotizaciones</span><strong>${cot.length}</strong><small>${accepted} aceptadas</small></div></div>
            <div class="a-kpi"><div class="a-kpi-icon trophy">${icon('trophy')}</div><div><span>Licitaciones</span><strong>${lic.length}</strong><small>${adjud} adjudicadas</small></div></div>
            <div class="a-kpi"><div class="a-kpi-icon brief">${icon('brief')}</div><div><span>Gastos registrados</span><strong>${money(gastos)}</strong></div></div>
        </div>`;
    }

    function renderAnalisis(){
        return `<div class="page-head a-page-head"><div><p class="eyebrow">Indicadores</p><h1>Análisis</h1><p>Lectura visual de la actividad profesional, financiera y comercial.</p></div><button class="btn btn-ghost" onclick="S.view='dashboard';render();">← Dashboard</button></div>
        ${kpis()}
        <div class="a-grid">
            <section class="panel a-card a-wide"><div class="panel-h"><div><h3>Tendencia financiera</h3><span>Cobros frente a gastos · últimos 6 meses</span></div><span class="a-badge">6 meses</span></div><div class="panel-body">${lineChart()}</div></section>
            <section class="panel a-card"><div class="panel-h"><div><h3>Experiencia profesional</h3><span>Monto registrado por cargo</span></div></div><div class="panel-body">${barsExperience()}</div></section>
            <section class="panel a-card"><div class="panel-h"><div><h3>Resultado de licitaciones</h3><span>Distribución de convocatorias</span></div></div><div class="panel-body">${tenderDonut()}</div></section>
            <section class="panel a-card"><div class="panel-h"><div><h3>Estructura de gastos</h3><span>Principales categorías registradas</span></div></div><div class="panel-body">${expenseBars()}</div></section>
        </div>`;
    }

    window.renderAnalisis=renderAnalisis;
    const old=document.getElementById('analysis-styles');if(old)old.remove();
    const style=document.createElement('style');style.id='analysis-styles';style.textContent=`
        .a-page-head{margin-bottom:18px}.a-page-head h1{letter-spacing:-.035em}.a-page-head p:not(.eyebrow){max-width:650px}.a-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.a-kpi{display:flex;align-items:center;gap:12px;padding:16px 17px;border:1px solid var(--border);border-radius:14px;background:linear-gradient(145deg,var(--panel),rgba(255,255,255,.015));box-shadow:0 8px 24px rgba(0,0,0,.035)}.a-kpi-icon{width:39px;height:39px;border-radius:11px;display:grid;place-items:center;background:var(--gantt-bg);flex:0 0 auto}.a-kpi-icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.a-kpi-icon.money{color:var(--accent)}.a-kpi-icon.chart{color:#7b61a8}.a-kpi-icon.trophy{color:#b07b20}.a-kpi-icon.brief{color:var(--danger)}.a-kpi span{display:block;color:var(--text-soft);font-size:10px;text-transform:uppercase;letter-spacing:.06em}.a-kpi strong{display:block;margin-top:3px;font-size:19px;line-height:1.1;letter-spacing:-.02em}.a-kpi small{display:block;margin-top:3px;color:var(--text-soft);font-size:10px}.a-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.a-card{min-width:0;overflow:hidden}.a-wide{grid-column:1/-1}.a-card .panel-body{min-height:245px}.a-card .panel-h{align-items:center}.a-card .panel-h h3{margin-bottom:3px}.a-card .panel-h span{font-size:11px;color:var(--text-soft)}.a-badge{padding:5px 9px;border-radius:20px;background:var(--gantt-bg);font-size:10px!important;color:var(--text-soft)!important;white-space:nowrap}.a-line-wrap{padding:4px 2px 0}.a-legend{display:flex;justify-content:flex-end;gap:18px;font-size:10px;color:var(--text-soft);margin-bottom:3px}.a-legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}.a-legend .c1{background:var(--accent)}.a-legend .c2{background:var(--danger)}.a-line{width:100%;height:auto;display:block;overflow:visible}.a-grid{stroke:var(--border);stroke-width:1}.a-axis,.a-label{fill:var(--text-soft);font:10px Inter,system-ui,sans-serif}.a-line-path{fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.a-line-path.c1{stroke:var(--accent)}.a-line-path.c2{stroke:var(--danger)}.a-point{stroke:var(--panel);stroke-width:2}.a-point.cobrado{fill:var(--accent)}.a-point.gasto{fill:var(--danger)}.a-bars{display:grid;gap:18px;padding:7px 3px}.a-bars.compact{gap:14px}.a-bar-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px;font-size:11px}.a-bar-head span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.a-bar-head strong{font-size:11px;font-weight:600;white-space:nowrap}.a-track{height:9px;border-radius:8px;background:var(--gantt-bg);overflow:hidden}.a-track>div{height:100%;border-radius:8px;background:var(--accent);transition:width .3s ease}.a-track>div.expense{background:var(--danger)}.a-donut-layout{height:210px;display:flex;align-items:center;justify-content:center;gap:28px}.a-donut{position:relative;width:145px;height:145px;flex:0 0 auto}.a-donut svg{width:100%;height:100%}.donut-bg{fill:none;stroke:var(--gantt-bg);stroke-width:12}.donut{fill:none;stroke-width:12;stroke-linecap:butt}.donut.adjudicada{stroke:var(--success)}.donut.evaluacion{stroke:var(--accent)}.donut.no-adjudicada{stroke:var(--danger)}.a-donut>div{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.a-donut strong{font-size:26px;letter-spacing:-.04em}.a-donut span{font-size:10px;color:var(--text-soft);text-transform:uppercase;letter-spacing:.08em}.a-state-list{min-width:175px;display:grid;gap:13px}.a-state-list>div{display:grid;grid-template-columns:10px 1fr auto;gap:8px;align-items:center;font-size:11px}.a-state-list .dot{width:8px;height:8px;border-radius:50%}.a-state-list .dot.adjudicada{background:var(--success)}.a-state-list .dot.evaluacion{background:var(--accent)}.a-state-list .dot.no-adjudicada{background:var(--danger)}.a-state-list strong{font-size:12px}.a-state-list small{font-weight:400;color:var(--text-soft);margin-left:5px}.a-expense-summary{display:flex;align-items:baseline;gap:9px;padding:2px 3px 14px;border-bottom:1px solid var(--border);margin-bottom:14px}.a-expense-summary strong{font-size:22px;letter-spacing:-.03em}.a-expense-summary span{font-size:10px;color:var(--text-soft)}.a-empty{height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-soft);gap:8px}.a-empty span{font-size:26px;opacity:.45}.a-empty p{margin:0;font-size:12px}@media(max-width:900px){.a-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:800px){.a-grid{grid-template-columns:1fr}.a-wide{grid-column:auto}}@media(max-width:520px){.a-kpis{grid-template-columns:1fr 1fr;gap:8px}.a-kpi{padding:12px}.a-kpi-icon{width:34px;height:34px}.a-kpi strong{font-size:15px}.a-kpi span{font-size:9px}.a-card .panel-body{min-height:0}.a-donut-layout{gap:15px;justify-content:flex-start}.a-donut{width:125px;height:125px}.a-state-list{min-width:0;flex:1}.a-legend{justify-content:flex-start}.a-axis{display:none}}
    `;document.head.appendChild(style);
})();
