// ============================================================
// GASTOS - Integración de navegación y dashboard
// ============================================================
(function(global){
    'use strict';
    function inject(){
        if(document.getElementById('gastos-nav-styles')) return;
        const s=document.createElement('style'); s.id='gastos-nav-styles'; s.textContent=`
            .gastos-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 18px}
            .gasto-kpi{padding:14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}
            .gasto-kpi span{display:block;font-size:11px;color:var(--text-soft);margin-bottom:5px}.gasto-kpi strong{font-size:18px;color:var(--primary)}
            @media(max-width:700px){.gastos-summary{grid-template-columns:1fr}.gasto-table-hide{display:none}}
        `; document.head.appendChild(s);
    }
    function dashboardCard(){
        if(typeof getGastosResumen!=='function') return;
        const main=document.getElementById('main'); if(!main||S.view!=='dashboard')return;
        const r=getGastosResumen();
        if(!r.cantidad)return;
        const old=document.getElementById('dashboard-gastos-summary'); if(old)old.remove();
        const panels=main.querySelectorAll('.panel'); const target=panels[panels.length-1];
        if(!target)return;
        const el=document.createElement('div'); el.id='dashboard-gastos-summary'; el.className='gastos-summary';
        el.innerHTML=`<div class="gasto-kpi"><span>Gastos registrados</span><strong>${typeof bs==='function'?bs(r.total):r.total+' Bs'}</strong></div><div class="gasto-kpi"><span>Gastos este mes</span><strong>${typeof bs==='function'?bs(r.actual):r.actual+' Bs'}</strong></div><div class="gasto-kpi"><span>Movimientos</span><strong>${r.cantidad}</strong></div>`;
        target.parentNode.insertBefore(el,target);
    }
    global.syncGastosDashboard=dashboardCard; inject();
})(window);
