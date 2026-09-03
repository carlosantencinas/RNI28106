// ============================================================
// FICHA FINANCIERA INDIVIDUAL DEL CLIENTE
// Estado de cuenta: cargos, cobros y saldo acumulado.
// ============================================================
(function (global) {
    'use strict';
    const escF = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
    const dinero = v => typeof bs === 'function' ? bs(Number(v) || 0) : `Bs ${(Number(v) || 0).toFixed(2)}`;
    const fecha = v => { if (!v) return '—'; try { return typeof fmtDate === 'function' ? fmtDate(v) : new Date(v).toLocaleDateString('es-BO'); } catch (_) { return String(v); } };
    const norm = v => String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    function carteraCliente(nombre) { const n=norm(nombre); const c=typeof getCarteraFinanciera==='function'?getCarteraFinanciera():[]; return c.filter(x=>norm(x.cliente)===n); }
    function movimientosCliente(nombre) { const n=norm(nombre); const r=typeof global.getMovimientosCobro==='function'?global.getMovimientosCobro():[]; return r.filter(x=>norm(x.cliente)===n); }
    function resumen(nombre) { const rows=carteraCliente(nombre); const total=rows.reduce((s,c)=>s+Number(c.montoTotal||0),0), cobrado=rows.reduce((s,c)=>s+Number(c.totalPagado||0),0), saldo=rows.reduce((s,c)=>s+Number(c.saldoPendiente||0),0); return {total,cobrado,saldo,porcentaje:total?Math.min(100,cobrado/total*100):0}; }
    function estadoCuenta(nombre) {
        const cargos=carteraCliente(nombre).map(c=>({fecha:c.fecha||c.fechaAceptacion||c.createdAt||'',tipo:'Cargo',concepto:c.titulo||c.proyecto||'Trabajo profesional',cargo:Number(c.montoTotal)||0,pago:0}));
        const pagos=movimientosCliente(nombre).map(p=>({fecha:p.fecha||'',tipo:'Cobro',concepto:p.descripcion||'Pago recibido',cargo:0,pago:Number(p.monto)||0,metodo:p.metodo||'',comprobante:p.comprobante||''}));
        const rows=[...cargos,...pagos].sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))||(a.tipo==='Cargo'?-1:1)); let saldo=0;
        rows.forEach(r=>{saldo+=r.cargo-r.pago;r.saldo=saldo;}); return rows;
    }
    function abrirFicha(nombre) {
        const r=resumen(nombre), estado=estadoCuenta(nombre), trabajos=carteraCliente(nombre), pagos=movimientosCliente(nombre);
        const cliente=(S.clientes||[]).find(c=>norm(c.nombre)===norm(nombre))||{};
        const overlay=document.createElement('div'); overlay.className='overlay';
        overlay.innerHTML=`<div class="modal" style="max-width:1000px;width:95vw;max-height:90vh;"><div class="modal-h"><div><h3>💰 Ficha financiera</h3><div style="font-size:12px;color:var(--text-soft);">${escF(nombre)}</div></div><button class="close" id="ficha-close">&times;</button></div><div class="modal-body" style="overflow:auto;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px;">${[['💼','Contratado',r.total],['💵','Cobrado',r.cobrado],['📥','Saldo',r.saldo],['📊','Cobranza',r.porcentaje.toFixed(0)+'%']].map(x=>`<div class="panel" style="padding:14px;margin:0;"><div style="font-size:11px;color:var(--text-soft);">${x[0]} ${x[1]}</div><strong style="font-size:20px;">${typeof x[2]==='string'?x[2]:dinero(x[2])}</strong></div>`).join('')}</div>
        <div class="panel" style="margin-bottom:16px;"><div class="panel-h"><h3>👤 Datos del cliente</h3></div><div class="panel-body" style="font-size:13px;display:flex;gap:20px;flex-wrap:wrap;"><span>📞 ${escF(cliente.telefono||'Sin teléfono')}</span><span>✉️ ${escF(cliente.email||'Sin correo')}</span><span>🪪 ${escF(cliente.nit||cliente.ci||'Sin NIT/CI')}</span></div></div>
        <div class="panel" style="margin-bottom:16px;"><div class="panel-h"><div><h3>📒 Estado de cuenta</h3><span>${estado.length} movimientos · saldo acumulado</span></div></div><div class="panel-body">${estado.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th class="tright">Cargo</th><th class="tright">Cobro</th><th class="tright">Saldo</th></tr></thead><tbody>${estado.map(x=>`<tr><td class="tnum">${fecha(x.fecha)}</td><td>${x.tipo}</td><td>${escF(x.concepto)}${x.metodo?`<div style="font-size:11px;color:var(--text-soft);">${escF(x.metodo)}${x.comprobante?' · '+escF(x.comprobante):''}</div>`:''}</td><td class="tright tnum">${x.cargo?dinero(x.cargo):'—'}</td><td class="tright tnum">${x.pago?dinero(x.pago):'—'}</td><td class="tright tnum"><strong>${dinero(x.saldo)}</strong></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty" style="padding:20px;">No existen movimientos financieros asociados a este cliente.</div>'}</div></div>
        <div class="panel"><div class="panel-h"><div><h3>📌 Trabajos</h3><span>${trabajos.length} registrados · ${pagos.length} cobros</span></div></div><div class="panel-body">${trabajos.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Trabajo</th><th>Proyecto</th><th>Estado</th><th class="tright">Total</th><th class="tright">Cobrado</th><th class="tright">Saldo</th></tr></thead><tbody>${trabajos.map(c=>`<tr><td>${fecha(c.fecha||c.fechaAceptacion||c.createdAt)}</td><td>${escF(c.titulo||'—')}</td><td>${escF(c.proyecto||'—')}</td><td>${Number(c.saldoPendiente||0)<=.01?'Pagado':Number(c.totalPagado||0)>.01?'Parcial':'Pendiente'}</td><td class="tright tnum">${dinero(c.montoTotal)}</td><td class="tright tnum">${dinero(c.totalPagado)}</td><td class="tright tnum"><strong>${dinero(c.saldoPendiente)}</strong></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty" style="padding:20px;">No hay trabajos financieros asociados.</div>'}</div></div>
        </div><div class="modal-foot"><button class="btn btn-ghost" id="ficha-cancel">Cerrar</button></div></div>`;
        document.body.appendChild(overlay); const close=()=>overlay.remove(); overlay.querySelector('#ficha-close').onclick=close; overlay.querySelector('#ficha-cancel').onclick=close; overlay.addEventListener('mousedown',e=>{if(e.target===overlay)close();});
    }
    function enhanceClientes() {
        if(S.view!=='clientes')return; const main=document.getElementById('main'); if(!main||document.getElementById('ficha-financiera-clientes'))return;
        const clientes=[...(S.clientes||[])].sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre))); if(!clientes.length)return;
        const panel=document.createElement('div'); panel.id='ficha-financiera-clientes'; panel.className='panel'; panel.style.marginBottom='18px';
        panel.innerHTML=`<div class="panel-h"><div><h3>💰 Fichas financieras</h3><span>Estado de cuenta individual por cliente</span></div></div><div class="panel-body"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;">${clientes.map(c=>{const r=resumen(c.nombre);return `<div style="border:1px solid var(--border);border-radius:var(--radius);padding:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;"><div style="min-width:0;"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escF(c.nombre)}</div><div style="font-size:11px;color:var(--text-soft);">Saldo: <strong>${dinero(r.saldo)}</strong> · ${r.porcentaje.toFixed(0)}% cobrado</div></div><button class="btn btn-sm btn-ghost" data-ficha-cliente="${escF(c.nombre)}">Ver ficha</button></div>`;}).join('')}</div></div>`;
        const target=main.querySelector('.page-head'); if(target)target.insertAdjacentElement('afterend',panel); else main.prepend(panel); panel.querySelectorAll('[data-ficha-cliente]').forEach(b=>b.onclick=()=>abrirFicha(b.dataset.fichaCliente));
    }
    global.abrirFichaFinancieraCliente=abrirFicha; global.enhanceClientesFinancial=enhanceClientes;
})(window);
