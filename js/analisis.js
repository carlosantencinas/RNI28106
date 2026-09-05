// ============================================================
// ANÁLISIS - Una gráfica principal por cada área
// ============================================================
(function(){
    'use strict';

    const money=v=>typeof bs==='function'?bs(v):`${Number(v||0).toLocaleString('es-BO',{maximumFractionDigits:2})} Bs`;
    const safe=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    function financeChart(){
        const months=[]; const now=new Date();
        for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:d.toLocaleDateString('es-BO',{month:'short'}).replace('.',''),cobrado:0,gasto:0});}
        (S.pagos||[]).forEach(p=>{const m=months.find(x=>x.key===String(p.fecha||'').slice(0,7));if(m)m.cobrado+=Number(p.montoPagado||0);});
        (S.gastos||[]).forEach(g=>{const m=months.find(x=>x.key===String(g.fecha||'').slice(0,7));if(m)m.gasto+=Number(g.monto||0);});
        const max=Math.max(1,...months.flatMap(m=>[m.cobrado,m.gasto]));
        return `<div class="analysis-chart"><div class="analysis-legend"><span><i class="cobro"></i>Cobrado</span><span><i class="gasto"></i>Gastos</span></div><div class="analysis-bars">${months.map(m=>`<div class="analysis-month"><div class="analysis-columns"><div class="analysis-bar cobro" style="height:${Math.max(3,m.cobrado/max*150)}px" title="Cobrado: ${money(m.cobrado)}"></div><div class="analysis-bar gasto" style="height:${Math.max(3,m.gasto/max*150)}px" title="Gastos: ${money(m.gasto)}"></div></div><span>${m.label}</span></div>`).join('')}</div></div>`;
    }

    function experienceChart(){
        const byCargo={};
        (S.experiencia||[]).forEach(e=>{const k=e.cargo||'Sin cargo';byCargo[k]=(byCargo[k]||0)+Number(e.monto||0);});
        const data=Object.entries(byCargo).sort((a,b)=>b[1]-a[1]).slice(0,7);
        if(!data.length)return '<div class="analysis-empty">Sin datos de experiencia.</div>';
        const max=Math.max(1,...data.map(x=>x[1]));
        return `<div class="analysis-hbars">${data.map(([k,v])=>`<div class="analysis-hrow"><div><span title="${safe(k)}">${safe(k)}</span><strong>${money(v)}</strong></div><div class="analysis-track"><div style="width:${v/max*100}%"></div></div></div>`).join('')}</div>`;
    }

    function tenderChart(){
        const lic=S.licitaciones||[]; const states=[['adjudicada','Adjudicadas'],['evaluacion','En evaluación'],['no-adjudicada','No adjudicadas']];
        const total=Math.max(1,lic.length);
        return `<div class="analysis-hbars">${states.map(([k,l])=>{const n=lic.filter(x=>x.estado===k).length;return `<div class="analysis-hrow"><div><span>${l}</span><strong>${n} · ${Math.round(n/total*100)}%</strong></div><div class="analysis-track"><div class="${k}" style="width:${n/total*100}%"></div></div></div>`;}).join('')}</div>`;
    }

    function expenseChart(){
        const byCat={};
        (S.gastos||[]).forEach(g=>{const k=g.categoria||'Otros';byCat[k]=(byCat[k]||0)+Number(g.monto||0);});
        const data=Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,7);
        if(!data.length)return '<div class="analysis-empty">Sin gastos registrados.</div>';
        const max=Math.max(1,...data.map(x=>x[1]));
        return `<div class="analysis-hbars">${data.map(([k,v])=>`<div class="analysis-hrow"><div><span>${safe(k)}</span><strong>${money(v)}</strong></div><div class="analysis-track"><div class="gasto" style="width:${v/max*100}%"></div></div></div>`).join('')}</div>`;
    }

    function renderAnalisis(){
        return `<div class="page-head"><div><p class="eyebrow">Indicadores</p><h1>Análisis</h1><p>Una gráfica principal para cada área de la suite.</p></div><button class="btn btn-ghost" onclick="S.view='dashboard';render();">← Dashboard</button></div>
        <div class="analysis-grid">
            <section class="panel analysis-card"><div class="panel-h"><div><h3>💰 Finanzas</h3><span>Cobros y gastos de los últimos 6 meses</span></div></div><div class="panel-body">${financeChart()}</div></section>
            <section class="panel analysis-card"><div class="panel-h"><div><h3>📊 Experiencia</h3><span>Monto registrado por cargo</span></div></div><div class="panel-body">${experienceChart()}</div></section>
            <section class="panel analysis-card"><div class="panel-h"><div><h3>🏆 Licitaciones</h3><span>Resultado de las convocatorias registradas</span></div></div><div class="panel-body">${tenderChart()}</div></section>
            <section class="panel analysis-card"><div class="panel-h"><div><h3>💸 Gastos</h3><span>Distribución por categoría</span></div></div><div class="panel-body">${expenseChart()}</div></section>
        </div>`;
    }

    window.renderAnalisis=renderAnalisis;
    const style=document.createElement('style');style.id='analysis-styles';style.textContent=`
        .analysis-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.analysis-card{min-width:0}.analysis-card .panel-body{min-height:230px}.analysis-chart{padding:8px 4px}.analysis-legend{display:flex;gap:18px;justify-content:flex-end;font-size:11px;color:var(--text-soft);margin-bottom:12px}.analysis-legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}.analysis-legend .cobro{background:var(--accent)}.analysis-legend .gasto{background:var(--danger)}.analysis-bars{height:185px;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;border-bottom:1px solid var(--border)}.analysis-month{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px;font-size:10px;color:var(--text-soft);min-width:38px}.analysis-columns{height:155px;display:flex;align-items:flex-end;gap:4px}.analysis-bar{width:18px;min-height:3px;border-radius:4px 4px 0 0}.analysis-bar.cobro{background:var(--accent)}.analysis-bar.gasto{background:var(--danger)}.analysis-hbars{display:grid;gap:18px;padding:8px 2px}.analysis-hrow>div:first-child{display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:7px}.analysis-hrow span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.analysis-hrow strong{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;white-space:nowrap}.analysis-track{height:12px;background:var(--gantt-bg);border-radius:6px;overflow:hidden}.analysis-track>div{height:100%;border-radius:6px;background:var(--accent)}.analysis-track>div.adjudicada{background:var(--success)}.analysis-track>div.evaluacion{background:var(--accent)}.analysis-track>div.no-adjudicada{background:var(--danger)}.analysis-track>div.gasto{background:var(--danger)}.analysis-empty{height:190px;display:flex;align-items:center;justify-content:center;color:var(--text-soft);font-size:13px}
        @media(max-width:800px){.analysis-grid{grid-template-columns:1fr}}@media(max-width:480px){.analysis-card .panel-body{min-height:0}.analysis-bar{width:14px}.analysis-columns{gap:3px}.analysis-legend{justify-content:flex-start}}
    `;document.head.appendChild(style);
})();
