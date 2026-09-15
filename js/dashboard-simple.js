// ============================================================
// DASHBOARD PRINCIPAL - RESUMEN EJECUTIVO
// Diseño visual, limpio y orientado a decisiones.
// Las gráficas detalladas viven en Análisis.
// ============================================================
function dashboardGreeting(date=new Date()) {
    const hour=date.getHours();
    if(hour>=5 && hour<12) return 'Buenos días';
    if(hour>=12 && hour<19) return 'Buenas tardes';
    return 'Buenas noches';
}

function viewDashboard() {
    const cots = S.cotizaciones || [], pagos = S.pagos || [], exp = S.experiencia || [];
    const lic = S.licitaciones || [], gastos = S.gastos || [];

    const money = n => bs(Number(n) || 0);
    const totalCotizado = cots.reduce((s,c)=>s+cotTotal(c),0);
    const aceptadas = cots.filter(c=>c.estado==='aceptada');
    const totalAceptado = aceptadas.reduce((s,c)=>s+cotTotal(c),0);
    const totalCobrado = pagos.reduce((s,p)=>s+Number(p.montoPagado||0),0);
    const totalPorCobrar = typeof getResumenPagos==='function' ? Number(getResumenPagos().totalPorCobrar||0) : pagos.reduce((s,p)=>s+Math.max(0,Number(p.monto||0)-Number(p.montoPagado||0)),0);
    const expYears = calcularExperienciaDashboard(exp)/365.25;
    const adjudicadas = lic.filter(l=>String(l.estado||'').toLowerCase()==='adjudicada').length;
    const evaluacion = lic.filter(l=>String(l.estado||'').toLowerCase()==='evaluacion').length;
    const mesActual = new Date().toISOString().slice(0,7);
    const gastosMes = gastos.filter(g=>String(g.fecha||'').slice(0,7)===mesActual).reduce((s,g)=>s+Number(g.monto||0),0);
    const clientes = S.clientes || [];
    const documentos = S.documentos || [];
    const pendientes = typeof getAcceptedDebtRows==='function' ? getAcceptedDebtRows() : [];
    const tasaAceptacion = cots.length ? Math.round(aceptadas.length/cots.length*100) : 0;
    const alertas = typeof buildDashboardAlerts==='function' ? buildDashboardAlerts() : [];
    const alertasUrgentes = alertas.filter(a=>a.level==='danger').length;
    const series = dashboardSeries(cots,pagos,gastos);

    function kpi(icon,label,value,sub,cls='',spark=[]) {
        return `<div class="dash-kpi ${cls}">
            <div class="dash-kpi-top"><span class="dash-icon">${icon}</span><span class="dash-kpi-label">${label}</span></div>
            <div class="dash-kpi-value">${value}</div>
            <div class="dash-kpi-sub">${sub}</div>
            ${spark.length ? `<div class="dash-spark">${renderSparkline(spark,cls)}</div>` : ''}
        </div>`;
    }
    function quick(icon,title,text,view,cls='') {
        return `<button class="dash-module ${cls}" onclick="S.view='${view}';render();"><span class="dash-module-icon">${icon}</span><span><strong>${title}</strong><small>${text}</small></span><b>›</b></button>`;
    }

    const principal = pendientes[0];
    const avancePrincipal = principal ? Math.min(100,Math.max(0,Number(principal.porcentaje)||0)) : 0;
    const maxTendencia = Math.max(1,...series.cobrado,...series.cotizado,...series.gastos);

    return `
    <div class="dash-hero">
        <div class="dash-hero-copy">
            <span class="dash-eyebrow">PANEL EJECUTIVO · RNI 28.106</span>
            <h1>${dashboardGreeting()}</h1>
            <p>Vista general de tu actividad profesional, financiera y comercial.</p>
        </div>
        <div class="dash-hero-actions">
            <button class="dash-action secondary" onclick="S.view='analisis';render();">▦ Análisis</button>
            <button class="dash-action primary" onclick="S.view='cotizaciones';render();">＋ Nueva cotización</button>
        </div>
    </div>

    <div class="dash-kpi-grid">
        ${kpi('↗','Por cobrar',money(totalPorCobrar),`${pendientes.length} pendientes`,'danger',series.cartera)}
        ${kpi('✓','Cobrado',money(totalCobrado),`${pagos.length} registros`,'success',series.cobrado)}
        ${kpi('◆','Aceptado',money(totalAceptado),`${aceptadas.length} cotizaciones`,'primary',series.aceptado)}
        ${kpi('◇','Cotizado',money(totalCotizado),`${cots.length} propuestas`,'neutral',series.cotizado)}
        ${kpi('⌁','Experiencia',`${expYears.toFixed(1)} años`,`${exp.length} proyectos`,'neutral')}
        ${kpi('★','Licitaciones',lic.length,`${adjudicadas} adjudicadas`,'accent',series.licitaciones)}
    </div>

    <div class="dash-content-grid">
        <section class="dash-card dash-status-card">
            <div class="dash-card-head"><div><span class="dash-section-label">SITUACIÓN</span><h3>Estado de tu actividad</h3></div><span class="dash-status-dot ${alertasUrgentes?'warning':'ok'}">● ${alertasUrgentes?'Requiere atención':'En orden'}</span></div>
            <div class="dash-status-list">
                <div class="dash-status-row"><span class="status-icon">💰</span><div><strong>Cartera</strong><small>${money(totalPorCobrar)} pendientes por cobrar</small></div><div class="status-bar"><i style="width:${totalPorCobrar>0?Math.max(8,Math.min(100,totalPorCobrar/Math.max(totalAceptado,1)*100)):0}%"></i></div></div>
                <div class="dash-status-row"><span class="status-icon">📋</span><div><strong>Conversión comercial</strong><small>${tasaAceptacion}% de cotizaciones aceptadas</small></div><div class="status-bar"><i style="width:${tasaAceptacion}%"></i></div></div>
                <div class="dash-status-row"><span class="status-icon">🏆</span><div><strong>Licitaciones</strong><small>${adjudicadas} adjudicadas · ${evaluacion} en evaluación</small></div><div class="status-bar"><i style="width:${lic.length?Math.min(100,adjudicadas/lic.length*100):0}%"></i></div></div>
            </div>
            <div class="dash-trend">
                <div class="dash-trend-head"><span>TENDENCIA · 6 MESES</span><small>Actividad financiera</small></div>
                <div class="dash-trend-chart">${renderTrendChart(series,maxTendencia)}</div>
                <div class="dash-trend-labels">${series.labels.map(x=>`<span>${x}</span>`).join('')}</div>
            </div>
        </section>

        <section class="dash-card dash-focus-card">
            <div class="dash-card-head"><div><span class="dash-section-label">PRÓXIMA ACCIÓN</span><h3>${principal?'Cobro pendiente':'Todo al día'}</h3></div><span class="dash-focus-mark">${principal?'$':'✓'}</span></div>
            ${principal ? `<div class="dash-focus-title">${esc(principal.titulo||'Cotización')}</div><div class="dash-focus-client">${esc(principal.cliente||'')} · saldo ${money(principal.saldoPendiente)}</div><div class="dash-progress"><i style="width:${avancePrincipal}%"></i></div><div class="dash-focus-foot"><span>${avancePrincipal.toFixed(0)}% cobrado</span><button onclick="S.view='finanzas';render();">Gestionar →</button></div>` : `<div class="dash-empty-focus">No tienes cuentas pendientes de atención inmediata.</div>`}
        </section>
    </div>

    <section class="dash-card dash-modules-card">
        <div class="dash-card-head"><div><span class="dash-section-label">ACCESO RÁPIDO</span><h3>Áreas de trabajo</h3></div><span class="dash-card-note">Abrir módulo</span></div>
        <div class="dash-module-grid">
            ${quick('₿','Finanzas',`${money(totalPorCobrar)} por cobrar`,'finanzas','finance')}
            ${quick('▤','Cotizaciones',`${aceptadas.length} aceptadas de ${cots.length}`,'cotizaciones','commercial')}
            ${quick('⌂','Experiencia',`${exp.length} proyectos registrados`,'experiencia','experience')}
            ${quick('★','Licitaciones',`${adjudicadas} adjudicadas`,'licitaciones','tenders')}
            ${quick('◈','Gastos',`${money(gastosMes)} este mes`,'gastos','expenses')}
            ${quick('●','Clientes',`${clientes.length} clientes`,'clientes','clients')}
        </div>
    </section>

    <div class="dash-bottom-grid">
        <section class="dash-mini-card"><span>DOCUMENTOS</span><strong>${documentos.length}</strong><small>registrados</small><button onclick="S.view='documentos';render();">Gestionar →</button></section>
        <section class="dash-mini-card"><span>GASTOS DEL MES</span><strong>${money(gastosMes)}</strong><small>${gastos.length} movimientos registrados</small><button onclick="S.view='gastos';render();">Ver gastos →</button></section>
        <section class="dash-mini-card"><span>ANÁLISIS</span><strong>4</strong><small>áreas con indicadores visuales</small><button onclick="S.view='analisis';render();">Abrir análisis →</button></section>
    </div>`;
}

function dashboardSeries(cots,pagos,gastos){
    const now=new Date();
    const months=[];
    for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:d.toLocaleDateString('es-BO',{month:'short'}).replace('.','')});}
    const sum=(items,valueFn)=>months.map(m=>items.filter(x=>String(x.fecha||'').slice(0,7)===m.key).reduce((s,x)=>s+(Number(valueFn(x))||0),0));
    const aceptado=sum(cots,x=>String(x.estado||'').toLowerCase()==='aceptada'?cotTotal(x):0);
    const cotizado=sum(cots,x=>cotTotal(x));
    const cobrado=sum(pagos,x=>x.montoPagado);
    const gasto=sum(gastos,x=>x.monto);
    let acumulado=0;
    const cartera=months.map(m=>{
        const nuevos=cots.filter(x=>String(x.fecha||'').slice(0,7)===m.key && String(x.estado||'').toLowerCase()==='aceptada').reduce((s,x)=>s+cotTotal(x),0);
        const cobrados=pagos.filter(x=>String(x.fecha||'').slice(0,7)===m.key).reduce((s,x)=>s+(Number(x.montoPagado)||0),0);
        acumulado=Math.max(0,acumulado+nuevos-cobrados);return acumulado;
    });
    const licMes=months.map(m=>cots.filter(x=>String(x.fecha||'').slice(0,7)===m.key).length);
    return {labels:months.map(m=>m.label),aceptado,cotizado,cobrado,gastos:gasto,cartera,licitaciones:licMes};
}

function renderSparkline(values,cls=''){
    if(!values||values.length<2)return '';
    const w=120,h=28,p=2,min=Math.min(...values),max=Math.max(...values),range=max-min||1;
    const pts=values.map((v,i)=>`${p+i*(w-p*2)/(values.length-1)},${h-p-2-((v-min)/range)*(h-p*2)}`).join(' ');
    const area=`${p},${h-2} ${pts} ${w-p},${h-2}`;
    const color=cls==='danger'?'#C95C5C':cls==='success'?'#3F9B72':cls==='accent'?'#B8862E':'#2F7890';
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polygon points="${area}" fill="${color}" opacity=".08"></polygon><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>`;
}

function renderTrendChart(s,maxValue){
    const w=520,h=92,p=8;
    const x=i=>p+i*(w-p*2)/(s.labels.length-1);
    const y=v=>h-p-((v/maxValue)*(h-p*2));
    const line=arr=>arr.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="dash-trend-svg" aria-label="Tendencia de los últimos seis meses">
        <line x1="${p}" y1="${h-18}" x2="${w-p}" y2="${h-18}" stroke="#E7ECEF" stroke-width="1"/>
        <line x1="${p}" y1="${h/2}" x2="${w-p}" y2="${h/2}" stroke="#EEF2F4" stroke-width="1" stroke-dasharray="3 4"/>
        <polyline points="${line(s.cotizado)}" fill="none" stroke="#2F7890" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${line(s.cobrado)}" fill="none" stroke="#3F9B72" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${line(s.gastos)}" fill="none" stroke="#B8862E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        ${s.labels.map((_,i)=>`<circle cx="${x(i)}" cy="${y(s.cobrado[i])}" r="2.5" fill="#fff" stroke="#3F9B72" stroke-width="1.5"/>`).join('')}
    </svg>`;
}

function calcularExperienciaDashboard(experiencias){
    const ints=(experiencias||[]).filter(e=>e.certificado===true&&e.desde&&e.hasta).map(e=>({a:new Date(e.desde+'T00:00:00'),b:new Date(e.hasta+'T00:00:00')})).filter(x=>!isNaN(x.a)&&!isNaN(x.b)).sort((a,b)=>a.a-b.a);
    if(!ints.length)return 0;
    const merged=[]; let cur={...ints[0]};
    for(const x of ints){if(x.a<=cur.b){if(x.b>cur.b)cur.b=x.b;}else{merged.push(cur);cur={...x};}} merged.push(cur);
    return merged.reduce((s,x)=>s+Math.max(0,Math.ceil((x.b-x.a)/86400000)),0);
}

(function(){
    if(document.getElementById('dashboard-main-styles'))return;
    const style=document.createElement('style');style.id='dashboard-main-styles';style.textContent=`
    #main.dashboard-compact{background:linear-gradient(145deg,#f5f8fa 0%,#eef3f6 100%)}
    .dash-hero{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:26px 28px;margin-bottom:18px;border-radius:18px;background:linear-gradient(135deg,#102F3A 0%,#1A4A5C 62%,#21677a 100%);color:#fff;box-shadow:0 10px 28px rgba(16,47,58,.16)}
    .dash-eyebrow{font-size:10px;font-weight:700;letter-spacing:.14em;opacity:.72}.dash-hero h1{font-size:28px;margin:7px 0 4px;letter-spacing:-.03em}.dash-hero p{margin:0;font-size:12px;opacity:.78}.dash-hero-actions{display:flex;gap:8px;flex-wrap:wrap}.dash-action{border:1px solid rgba(255,255,255,.24);border-radius:9px;padding:9px 13px;font-size:11px;font-weight:700;cursor:pointer}.dash-action.secondary{background:rgba(255,255,255,.08);color:#fff}.dash-action.primary{background:#fff;color:#153744;border-color:#fff}.dash-kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:18px}.dash-kpi{position:relative;min-width:0;padding:15px;border:1px solid var(--border);border-radius:12px;background:var(--panel);box-shadow:var(--shadow-sm);overflow:hidden}.dash-kpi-top{display:flex;align-items:center;gap:7px}.dash-icon{font-size:15px}.dash-kpi-label{font-size:10px;color:var(--text-soft);font-weight:600}.dash-kpi-value{font-size:20px;font-weight:750;margin-top:7px;letter-spacing:-.02em}.dash-kpi-sub{font-size:10px;color:var(--text-soft);margin-top:3px}.dash-spark{height:28px;margin-top:6px}.dash-spark svg{width:100%;height:28px}.dash-kpi.danger .dash-kpi-value{color:#C95C5C}.dash-kpi.success .dash-kpi-value{color:#3F9B72}.dash-kpi.primary .dash-kpi-value{color:#2F7890}.dash-kpi.accent .dash-kpi-value{color:#B8862E}.dash-content-grid{display:grid;grid-template-columns:1.55fr .9fr;gap:14px;margin-bottom:14px}.dash-card{border:1px solid var(--border);border-radius:13px;background:var(--panel);box-shadow:var(--shadow-sm);overflow:hidden}.dash-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:16px 17px 12px}.dash-card-head h3{margin:3px 0 0;font-size:14px}.dash-section-label{font-size:9px;font-weight:800;letter-spacing:.12em;color:var(--text-soft)}.dash-status-dot{font-size:10px;font-weight:700}.dash-status-dot.ok{color:#3F9B72}.dash-status-dot.warning{color:#B8862E}.dash-status-list{padding:0 17px 12px}.dash-status-row{display:grid;grid-template-columns:24px minmax(0,1fr) 34%;gap:9px;align-items:center;padding:10px 0;border-top:1px solid var(--border)}.status-icon{font-size:15px}.dash-status-row strong{display:block;font-size:11px}.dash-status-row small{display:block;font-size:9px;color:var(--text-soft);margin-top:2px}.status-bar{height:5px;border-radius:5px;background:var(--gantt-bg);overflow:hidden}.status-bar i{display:block;height:100%;border-radius:5px;background:var(--primary)}.dash-trend{padding:12px 17px 15px;border-top:1px solid var(--border)}.dash-trend-head{display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:var(--text-soft)}.dash-trend-head small{font-size:9px;font-weight:500}.dash-trend-chart{height:92px;margin-top:7px}.dash-trend-svg{width:100%;height:100%}.dash-trend-labels{display:flex;justify-content:space-between;font-size:9px;color:var(--text-soft)}.dash-focus-card{min-height:100%}.dash-focus-mark{font-size:20px;color:var(--primary)}.dash-focus-title{padding:6px 17px 0;font-size:13px;font-weight:700}.dash-focus-client{padding:4px 17px 12px;font-size:10px;color:var(--text-soft)}.dash-progress{height:8px;background:var(--gantt-bg);margin:0 17px;border-radius:8px;overflow:hidden}.dash-progress i{display:block;height:100%;background:var(--primary);border-radius:8px}.dash-focus-foot{display:flex;justify-content:space-between;align-items:center;padding:12px 17px;font-size:10px;color:var(--text-soft)}.dash-focus-foot button{border:0;background:none;color:var(--primary);font-size:10px;font-weight:700;cursor:pointer}.dash-empty-focus{padding:30px 17px;color:var(--text-soft);font-size:11px}.dash-modules-card{margin-bottom:14px}.dash-module-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:0 17px 17px}.dash-module{display:flex;align-items:center;gap:10px;text-align:left;padding:11px;border:1px solid var(--border);border-radius:9px;background:var(--surface);cursor:pointer;color:var(--text)}.dash-module:hover{border-color:var(--primary);transform:translateY(-1px)}.dash-module-icon{font-size:17px}.dash-module span:nth-child(2){min-width:0;flex:1}.dash-module strong{display:block;font-size:11px}.dash-module small{display:block;color:var(--text-soft);font-size:9px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dash-module b{font-size:18px;color:var(--text-soft)}.dash-bottom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.dash-mini-card{padding:14px 16px;border:1px solid var(--border);border-radius:11px;background:var(--panel);box-shadow:var(--shadow-sm)}.dash-mini-card span{display:block;font-size:9px;font-weight:800;letter-spacing:.1em;color:var(--text-soft)}.dash-mini-card strong{display:block;font-size:20px;margin:5px 0 2px}.dash-mini-card small{display:block;font-size:9px;color:var(--text-soft)}.dash-mini-card button{margin-top:9px;border:0;background:none;padding:0;color:var(--primary);font-size:10px;font-weight:700;cursor:pointer}@media(max-width:1100px){.dash-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.dash-hero{align-items:flex-start;flex-direction:column;padding:20px}.dash-content-grid{grid-template-columns:1fr}.dash-module-grid,.dash-bottom-grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.dash-kpi-grid{grid-template-columns:1fr 1fr}.dash-module-grid,.dash-bottom-grid{grid-template-columns:1fr}.dash-hero h1{font-size:24px}.dash-hero-actions{width:100%}.dash-action{flex:1}}
    `;document.head.appendChild(style);
})();
