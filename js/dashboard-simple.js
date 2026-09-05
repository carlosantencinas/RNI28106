// ============================================================
// DASHBOARD SIMPLE - Resumen ejecutivo
// Las gráficas detalladas viven en el apartado Análisis.
// ============================================================
function viewDashboard() {
    const cots = S.cotizaciones || [];
    const pagos = S.pagos || [];
    const exp = S.experiencia || [];
    const lic = S.licitaciones || [];
    const gastos = S.gastos || [];

    function calcularDiasNoSolapados(experiencias) {
        const intervalos = experiencias.filter(e => e.certificado === true && e.desde && e.hasta)
            .map(e => ({ desde:new Date(e.desde+'T00:00:00'), hasta:new Date(e.hasta+'T00:00:00') }))
            .filter(i => !isNaN(i.desde) && !isNaN(i.hasta))
            .sort((a,b) => a.desde-b.desde);
        if (!intervalos.length) return 0;
        const fusionados=[]; let actual={...intervalos[0]};
        for(let i=1;i<intervalos.length;i++){
            const sig=intervalos[i];
            if(sig.desde<=actual.hasta){if(sig.hasta>actual.hasta)actual.hasta=sig.hasta;}
            else{fusionados.push(actual);actual={...sig};}
        }
        fusionados.push(actual);
        return fusionados.reduce((sum,i)=>sum+Math.max(0,Math.ceil((i.hasta-i.desde)/86400000)),0);
    }

    const totalCotizado=cots.reduce((s,c)=>s+cotTotal(c),0);
    const totalAceptado=cots.filter(c=>c.estado==='aceptada').reduce((s,c)=>s+cotTotal(c),0);
    const totalCobrado=pagos.reduce((s,p)=>s+Number(p.montoPagado||0),0);
    const totalPorCobrar=pagos.reduce((s,p)=>s+Math.max(0,Number(p.monto||0)-Number(p.montoPagado||0)),0);
    const expYears=calcularDiasNoSolapados(exp)/365.25;
    const licAdjudicadas=lic.filter(l=>l.estado==='adjudicada').length;
    const gastosMes=gastos.filter(g=>String(g.fecha||'').slice(0,7)===new Date().toISOString().slice(0,7)).reduce((s,g)=>s+Number(g.monto||0),0);

    const pendientes = typeof getAcceptedDebtRows==='function' ? getAcceptedDebtRows().length : pagos.filter(p=>pagoEstado(p)!=='pagado').length;

    return `
    <div class="page-head">
        <div><p class="eyebrow">Inicio</p><h1>Dashboard</h1><p>Resumen ejecutivo de tu actividad profesional.</p></div>
        <button class="btn btn-ghost" onclick="S.view='analisis';render();">📊 Ver análisis</button>
    </div>

    <div class="kpi-grid dashboard-main-kpis">
        <div class="kpi danger"><div class="label">Por cobrar</div><div class="val">${bs(totalPorCobrar)}</div><div class="sub">${pendientes} pendientes</div></div>
        <div class="kpi success"><div class="label">Cobrado</div><div class="val">${bs(totalCobrado)}</div><div class="sub">${pagos.length} registros</div></div>
        <div class="kpi"><div class="label">Aceptado</div><div class="val">${bs(totalAceptado)}</div><div class="sub">${cots.filter(c=>c.estado==='aceptada').length} cotizaciones</div></div>
        <div class="kpi accent"><div class="label">Cotizado</div><div class="val">${bs(totalCotizado)}</div><div class="sub">${cots.length} cotizaciones</div></div>
        <div class="kpi"><div class="label">Experiencia</div><div class="val">${expYears.toFixed(1)} años</div><div class="sub">${exp.length} proyectos</div></div>
        <div class="kpi accent"><div class="label">Licitaciones</div><div class="val">${lic.length}</div><div class="sub">${licAdjudicadas} adjudicadas</div></div>
        <div class="kpi"><div class="label">Gastos del mes</div><div class="val">${bs(gastosMes)}</div><div class="sub">${gastos.length} registrados</div></div>
    </div>

    <div class="dashboard-quick-grid">
        <div class="panel dashboard-quick-card">
            <div class="panel-h"><div><h3>💰 Finanzas</h3><span>Situación actual</span></div><button class="btn btn-sm btn-ghost" onclick="S.view='finanzas';render();">Abrir</button></div>
            <div class="panel-body"><strong>${bs(totalPorCobrar)}</strong><span> pendientes por cobrar</span></div>
        </div>
        <div class="panel dashboard-quick-card">
            <div class="panel-h"><div><h3>📋 Cotizaciones</h3><span>Estado comercial</span></div><button class="btn btn-sm btn-ghost" onclick="S.view='cotizaciones';render();">Abrir</button></div>
            <div class="panel-body"><strong>${cots.filter(c=>c.estado==='aceptada').length}</strong><span> aceptadas de ${cots.length}</span></div>
        </div>
        <div class="panel dashboard-quick-card">
            <div class="panel-h"><div><h3>🏆 Licitaciones</h3><span>Resultado</span></div><button class="btn btn-sm btn-ghost" onclick="S.view='licitaciones';render();">Abrir</button></div>
            <div class="panel-body"><strong>${licAdjudicadas}</strong><span> adjudicadas de ${lic.length}</span></div>
        </div>
        <div class="panel dashboard-quick-card">
            <div class="panel-h"><div><h3>💸 Gastos</h3><span>Egresos no recurrentes</span></div><button class="btn btn-sm btn-ghost" onclick="S.view='gastos';render();">Abrir</button></div>
            <div class="panel-body"><strong>${bs(gastosMes)}</strong><span> este mes</span></div>
        </div>
    </div>

    <div class="dashboard-analysis-hint">
        <div><strong>📊 Análisis profesional</strong><span>Consulta una gráfica principal por cada área: finanzas, experiencia, licitaciones y gastos.</span></div>
        <button class="btn btn-primary" onclick="S.view='analisis';render();">Ver gráficas</button>
    </div>`;
}

(function(){
    if(document.getElementById('dashboard-simple-styles'))return;
    const style=document.createElement('style');style.id='dashboard-simple-styles';style.textContent=`
        .dashboard-main-kpis{margin-bottom:18px}.dashboard-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:18px}.dashboard-quick-card .panel-body{padding:14px 16px}.dashboard-quick-card .panel-body strong{font-size:22px;color:var(--primary)}.dashboard-quick-card .panel-body span{font-size:12px;color:var(--text-soft)}.dashboard-analysis-hint{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.dashboard-analysis-hint div{display:flex;flex-direction:column;gap:4px}.dashboard-analysis-hint strong{color:var(--primary);font-size:14px}.dashboard-analysis-hint span{font-size:12px;color:var(--text-soft)}
        @media(max-width:700px){.dashboard-quick-grid{grid-template-columns:1fr}.dashboard-analysis-hint{flex-direction:column;align-items:stretch}.dashboard-analysis-hint .btn{width:100%}}
    `;document.head.appendChild(style);
})();
