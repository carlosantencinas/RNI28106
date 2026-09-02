// ============================================================
// CENTRO DE ALERTAS - DASHBOARD
// No modifica datos; solo informa al usuario.
// ============================================================
(function (global) {
    'use strict';
    const ALERT_DAYS = 30;
    function parseDate(value) { if (!value) return null; const d=new Date(String(value).length===10?`${value}T00:00:00`:value); return Number.isNaN(d.getTime())?null:d; }
    function daysUntil(value) { const d=parseDate(value); if(!d)return null; const t=new Date();t.setHours(0,0,0,0);return Math.ceil((d-t)/86400000); }
    function getDocumentExpiry(doc) { return doc?.fechaVencimiento||doc?.vencimiento||doc?.fechaExpiracion||doc?.vence||null; }
    function buildAlerts() {
        const alerts=[], documentos=Array.isArray(S.documentos)?S.documentos:[], cotizaciones=Array.isArray(S.cotizaciones)?S.cotizaciones:[], licitaciones=Array.isArray(S.licitaciones)?S.licitaciones:[];
        documentos.forEach(doc=>{const days=daysUntil(getDocumentExpiry(doc));if(days===null)return;const nombre=doc.nombre||doc.tipo||'Documento';if(days<0)alerts.push({level:'danger',icon:'🔴',title:'Documento vencido',text:`${nombre} venció hace ${Math.abs(days)} día${Math.abs(days)===1?'':'s'}.`,action:'documentos'});else if(days<=ALERT_DAYS)alerts.push({level:'warning',icon:'🟠',title:'Documento por vencer',text:`${nombre} vence en ${days} día${days===1?'':'s'}.`,action:'documentos'});});
        cotizaciones.forEach(cot=>{if(typeof getResumenCotizacion!=='function')return;const r=getResumenCotizacion(cot);if(r.saldoPendiente>.01)alerts.push({level:r.totalPagado>0?'warning':'danger',icon:r.totalPagado>0?'🟠':'🔴',title:r.totalPagado>0?'Pago parcial pendiente':'Pago pendiente',text:`${cot.titulo||'Cotización'} · saldo ${bs(r.saldoPendiente)}.`,action:'finanzas'});});
        licitaciones.forEach(lic=>{if(String(lic.estado||'').toLowerCase()==='evaluacion')alerts.push({level:'info',icon:'🔵',title:'Licitación en evaluación',text:lic.proyecto||lic.convocatoria||'Hay una licitación en evaluación.',action:'licitaciones'});});
        return alerts;
    }
    function renderDashboardAlerts() {
        const main=document.getElementById('main'); if(!main||S.view!=='dashboard'||main.querySelector('[data-alert-center]'))return;
        const alerts=buildAlerts(),panel=document.createElement('div');panel.dataset.alertCenter='true';panel.className='panel';panel.style.marginBottom='20px';
        panel.innerHTML=alerts.length?`<div class="panel-h"><h3>🔔 Centro de alertas</h3><span style="font-size:12px;color:var(--text-soft);">${alerts.length} alerta${alerts.length===1?'':'s'}</span></div><div class="panel-body">${alerts.slice(0,8).map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);"><span>${a.icon}</span><div style="flex:1"><div style="font-weight:600;font-size:13px;">${esc(a.title)}</div><div style="font-size:12px;color:var(--text-soft);">${esc(a.text)}</div></div><button class="btn btn-sm btn-ghost" data-alert-action="${a.action}">Ver</button></div>`).join('')}${alerts.length>8?`<div style="padding-top:10px;font-size:12px;color:var(--text-soft);">...y ${alerts.length-8} alertas más.</div>`:''}</div>`:`<div class="panel-h"><h3>🔔 Centro de alertas</h3><span style="font-size:12px;color:var(--success);">Todo en orden</span></div><div class="panel-body"><div style="padding:8px 0;color:var(--text-soft);font-size:13px;">No hay alertas que requieran atención inmediata.</div></div>`;
        const first=main.querySelector('.kpi-grid')?.nextElementSibling;if(first)main.insertBefore(panel,first);else main.appendChild(panel);
        panel.querySelectorAll('[data-alert-action]').forEach(b=>b.onclick=()=>{S.view=b.dataset.alertAction;render();});
    }
    global.buildDashboardAlerts=buildAlerts; global.renderDashboardAlerts=renderDashboardAlerts;
})(window);
