// ============================================================
// FICHA FINANCIERA INDIVIDUAL DEL CLIENTE
// ============================================================
(function (global) {
    'use strict';

    const escF = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
    const dinero = v => typeof bs === 'function' ? bs(Number(v) || 0) : `Bs ${(Number(v) || 0).toFixed(2)}`;
    const fecha = v => { if (!v) return '—'; try { return typeof fmtDate === 'function' ? fmtDate(v) : new Date(v).toLocaleDateString('es-BO'); } catch (_) { return String(v); } };
    const norm = v => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    function resumenCliente(nombre) {
        const key = norm(nombre);
        const cots = (S.cotizaciones || []).filter(c => norm(c.cliente) === key);
        const pagos = (S.pagos || []).filter(p => norm(p.cliente || p.entidad) === key);
        const cotIds = new Set(cots.map(c => String(c.id)));
        const trabajos = cots.map(c => {
            const r = typeof getResumenCotizacion === 'function' ? getResumenCotizacion(c) : { montoTotal: Number(c.montoTotal || c.total || c.monto || 0), totalPagado: 0, saldoPendiente: Number(c.montoTotal || c.total || c.monto || 0) };
            return { ...c, ...r };
        });
        const directos = pagos.filter(p => !p.cotizacionId || !cotIds.has(String(p.cotizacionId)));
        const movimientos = typeof global.getMovimientosCobro === 'function'
            ? global.getMovimientosCobro().filter(p => norm(p.cliente) === key || (p.cotizacionId && cotIds.has(String(p.cotizacionId))))
            : directos.filter(p => Number(p.montoPagado) > 0).map(p => ({ id:p.id, fecha:p.fecha || p.fechaCreacion, monto:Number(p.montoPagado)||0, cliente:nombre, descripcion:p.descripcion||p.concepto||'Cobro', metodo:p.metodoPago||'', comprobante:p.comprobante||'' }));
        const totalContratado = trabajos.reduce((s,c) => s + Number(c.montoTotal || 0), 0);
        const totalPagado = trabajos.reduce((s,c) => s + Number(c.totalPagado || 0), 0) + directos.reduce((s,p) => s + Number(p.montoPagado || 0), 0);
        const saldo = Math.max(0, totalContratado - trabajos.reduce((s,c) => s + Number(c.totalPagado || 0), 0));
        const pendientes = trabajos.filter(c => Number(c.totalPagado || 0) <= .01 && Number(c.saldoPendiente || 0) > .01).length;
        const parciales = trabajos.filter(c => Number(c.totalPagado || 0) > .01 && Number(c.saldoPendiente || 0) > .01).length;
        const completados = trabajos.filter(c => Number(c.saldoPendiente || 0) <= .01 && Number(c.montoTotal || 0) > 0).length;
        const proyectos = [...new Set([...(S.clientes || []).find(c => norm(c.nombre) === key)?.proyectos || [], ...cots.map(c => c.proyecto).filter(Boolean)])];
        const cliente = (S.clientes || []).find(c => norm(c.nombre) === key) || { nombre };
        return { nombre:cliente.nombre || nombre, cliente, trabajos, movimientos, proyectos, totalContratado, totalPagado, saldo, pendientes, parciales, completados };
    }

    function estadoCuenta(nombre) {
        const cargos = carteraCliente(nombre).map(c => ({ fecha:c.fecha || c.fechaAceptacion || c.createdAt || '', tipo:'Cargo', concepto:c.titulo || c.proyecto || 'Trabajo profesional', cargo:Number(c.montoTotal)||0, pago:0 }));
        const pagos = movimientosCliente(nombre).map(p => ({ fecha:p.fecha || '', tipo:'Cobro', concepto:p.descripcion || 'Pago recibido', cargo:0, pago:Number(p.monto)||0, metodo:p.metodo||'', comprobante:p.comprobante||'' }));
        const rows = [...cargos,...pagos].sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)) || (a.tipo==='Cargo'?-1:1));
        let saldo = 0; rows.forEach(r => { saldo += r.cargo-r.pago; r.saldo=saldo; }); return rows;
    }
    function carteraCliente(nombre) { const n=norm(nombre); const c=typeof getCarteraFinanciera==='function'?getCarteraFinanciera():[]; return c.filter(x=>norm(x.cliente)===n); }
    function movimientosCliente(nombre) { const n=norm(nombre); const r=typeof global.getMovimientosCobro==='function'?global.getMovimientosCobro():[]; return r.filter(x=>norm(x.cliente)===n); }

    function imprimirFicha(nombre) {
        const r=resumenCliente(nombre), estado=estadoCuenta(nombre), cliente=r.cliente||{};
        const porcentaje=r.totalContratado>0?Math.min(100,r.totalPagado/r.totalContratado*100):0;
        const win=window.open('', '_blank', 'width=1100,height=800');
        if(!win){ alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio.'); return; }
        const filasEstado=estado.map(x=>`<tr><td>${fecha(x.fecha)}</td><td>${escF(x.tipo)}</td><td>${escF(x.concepto)}${x.metodo?`<small>${escF(x.metodo)}${x.comprobante?' · '+escF(x.comprobante):''}</small>`:''}</td><td class="num">${x.cargo?dinero(x.cargo):'—'}</td><td class="num">${x.pago?dinero(x.pago):'—'}</td><td class="num"><b>${dinero(x.saldo)}</b></td></tr>`).join('');
        const filasTrabajos=r.trabajos.map(c=>{const e=Number(c.saldoPendiente||0)<=.01?'Pagado':Number(c.totalPagado||0)>.01?'Parcial':'Pendiente';return `<tr><td>${fecha(c.fecha||c.fechaAceptacion||c.createdAt)}</td><td>${escF(c.titulo||c.descripcion||'—')}</td><td>${escF(c.proyecto||'—')}</td><td>${e}</td><td class="num">${dinero(c.montoTotal)}</td><td class="num">${dinero(c.totalPagado)}</td><td class="num"><b>${dinero(c.saldoPendiente)}</b></td></tr>`;}).join('');
        win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Estado de cuenta - ${escF(r.nombre)}</title><style>body{font-family:Arial,sans-serif;color:#222;margin:32px;font-size:12px}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:24px 0 8px;border-bottom:1px solid #ccc;padding-bottom:6px}.muted{color:#666}.head{display:flex;justify-content:space-between;border-bottom:2px solid #222;padding-bottom:12px}.info{margin:14px 0;display:flex;gap:25px;flex-wrap:wrap}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.card{border:1px solid #ccc;padding:10px}.card small{display:block;color:#666;margin-bottom:5px}.card strong{font-size:16px}table{width:100%;border-collapse:collapse;margin-top:7px}th,td{border-bottom:1px solid #ddd;padding:7px 5px;text-align:left;vertical-align:top}th{background:#f2f2f2;font-size:11px}.num{text-align:right;white-space:nowrap}small{display:block;color:#666;margin-top:3px}.footer{margin-top:28px;padding-top:10px;border-top:1px solid #ccc;color:#666;font-size:10px}@media print{body{margin:15mm}.no-print{display:none}.cards{grid-template-columns:repeat(4,1fr)}}@media(max-width:700px){.cards{grid-template-columns:repeat(2,1fr)}}</style></head><body>
        <div class="head"><div><div class="muted">ESTADO DE CUENTA · FICHA FINANCIERA</div><h1>${escF(r.nombre)}</h1><div class="muted">Generado: ${fecha(new Date().toISOString().slice(0,10))}</div></div><div class="muted">RNI28106</div></div>
        <div class="info"><span>📞 ${escF(cliente.telefono||'Sin teléfono')}</span><span>✉️ ${escF(cliente.email||'Sin correo')}</span><span>🪪 ${escF(cliente.nit||cliente.documento||'Sin NIT/documento')}</span></div>
        <div class="cards"><div class="card"><small>Contratado</small><strong>${dinero(r.totalContratado)}</strong></div><div class="card"><small>Cobrado</small><strong>${dinero(r.totalPagado)}</strong></div><div class="card"><small>Saldo pendiente</small><strong>${dinero(r.saldo)}</strong></div><div class="card"><small>Cobranza</small><strong>${porcentaje.toFixed(0)}%</strong></div></div>
        <h2>Estado de cuenta</h2><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th class="num">Cargo</th><th class="num">Cobro</th><th class="num">Saldo</th></tr></thead><tbody>${filasEstado||'<tr><td colspan="6">Sin movimientos.</td></tr>'}</tbody></table>
        <h2>Trabajos y cuentas</h2><table><thead><tr><th>Fecha</th><th>Trabajo</th><th>Proyecto</th><th>Estado</th><th class="num">Total</th><th class="num">Cobrado</th><th class="num">Saldo</th></tr></thead><tbody>${filasTrabajos||'<tr><td colspan="7">Sin trabajos financieros.</td></tr>'}</tbody></table>
        <div class="footer">Documento generado desde RNI28106. La información corresponde a los registros financieros disponibles en el sistema.</div>
        <script>window.onload=function(){setTimeout(function(){window.print()},300)};<\/script></body></html>`);
        win.document.close();
    }

    function abrirFichaFinancieraCliente(nombre) {
        const r=resumenCliente(nombre), cliente=r.cliente||{}, estado=estadoCuenta(nombre), trabajos=r.trabajos, pagos=r.movimientos;
        const porcentaje=r.totalContratado>0?Math.min(100,r.totalPagado/r.totalContratado*100):0;
        const overlay=document.createElement('div'); overlay.className='overlay';
        overlay.innerHTML=`<div class="modal" style="max-width:1050px;width:calc(100% - 28px);max-height:90vh;"><div class="modal-h"><div><div style="font-size:10px;color:var(--text-soft);text-transform:uppercase;letter-spacing:.08em;">Ficha financiera</div><h3 style="margin-top:2px;">${escF(r.nombre)}</h3></div><button class="close" id="cf-close">&times;</button></div><div class="modal-body" style="overflow:auto;">
        <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:16px;padding:12px 14px;background:var(--surface-2,#f7f8f9);border:1px solid var(--border);border-radius:var(--radius);"><span>📞 ${escF(cliente.telefono||'Sin teléfono')}</span><span>✉️ ${escF(cliente.email||'Sin correo')}</span><span>🪪 ${escF(cliente.nit||cliente.documento||'Sin NIT/documento')}</span></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-bottom:18px;">${[['💼','Contratado',dinero(r.totalContratado)],['💵','Cobrado',dinero(r.totalPagado)],['📥','Saldo pendiente',dinero(r.saldo)],['📊','Cobranza',porcentaje.toFixed(0)+'%'],['⏳','Pendientes',r.pendientes],['🔄','Parciales',r.parciales],['✅','Completados',r.completados]].map(x=>`<div class="panel" style="padding:14px;margin:0;"><div style="font-size:11px;color:var(--text-soft);">${x[0]} ${x[1]}</div><strong style="font-size:19px;">${x[2]}</strong></div>`).join('')}</div>
        <div class="panel" style="margin-bottom:18px;"><div class="panel-h"><div><h3>📒 Estado de cuenta</h3><span>${estado.length} movimientos · saldo acumulado</span></div></div><div class="panel-body">${estado.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th class="tright">Cargo</th><th class="tright">Cobro</th><th class="tright">Saldo</th></tr></thead><tbody>${estado.map(x=>`<tr><td class="tnum">${fecha(x.fecha)}</td><td>${x.tipo}</td><td>${escF(x.concepto)}${x.metodo?`<div style="font-size:11px;color:var(--text-soft);">${escF(x.metodo)}${x.comprobante?' · '+escF(x.comprobante):''}</div>`:''}</td><td class="tright tnum">${x.cargo?dinero(x.cargo):'—'}</td><td class="tright tnum">${x.pago?dinero(x.pago):'—'}</td><td class="tright tnum"><strong>${dinero(x.saldo)}</strong></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty" style="padding:18px;">No existen movimientos financieros asociados a este cliente.</div>'}</div></div>
        <div class="panel"><div class="panel-h"><div><h3>📌 Trabajos</h3><span>${trabajos.length} registrados · ${pagos.length} cobros</span></div></div><div class="panel-body">${trabajos.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Trabajo</th><th>Proyecto</th><th>Estado</th><th class="tright">Total</th><th class="tright">Cobrado</th><th class="tright">Saldo</th></tr></thead><tbody>${trabajos.map(c=>`<tr><td>${fecha(c.fecha||c.fechaAceptacion||c.createdAt)}</td><td>${escF(c.titulo||'—')}</td><td>${escF(c.proyecto||'—')}</td><td>${Number(c.saldoPendiente||0)<=.01?'Pagado':Number(c.totalPagado||0)>.01?'Parcial':'Pendiente'}</td><td class="tright tnum">${dinero(c.montoTotal)}</td><td class="tright tnum">${dinero(c.totalPagado)}</td><td class="tright tnum"><strong>${dinero(c.saldoPendiente)}</strong></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty" style="padding:18px;">No hay trabajos financieros asociados.</div>'}</div></div>
        </div><div class="modal-foot"><button class="btn btn-ghost" id="cf-print">🖨️ Imprimir / PDF</button><button class="btn btn-ghost" id="cf-finanzas">💰 Ver Finanzas</button><button class="btn btn-primary" id="cf-close-2">Cerrar</button></div></div>`;
        document.body.appendChild(overlay);
        const close=()=>overlay.remove(); overlay.querySelector('#cf-close').onclick=close; overlay.querySelector('#cf-close-2').onclick=close; overlay.querySelector('#cf-print').onclick=()=>imprimirFicha(r.nombre); overlay.querySelector('#cf-finanzas').onclick=()=>{close();S.view='finanzas';render();}; overlay.addEventListener('mousedown',e=>{if(e.target===overlay)close();});
    }

    function enhanceClientesView() {
        if(S.view!=='clientes')return; const main=document.getElementById('main'); if(!main||main.dataset.fichaFinanciera==='1')return;
        const rows=main.querySelectorAll('.table-wrap tbody tr'); if(!rows.length)return;
        rows.forEach(row=>{const first=row.querySelector('td');if(!first)return;const nombre=first.textContent.trim();if(!nombre)return;const actions=row.querySelector('.rowactions');if(actions){const b=document.createElement('button');b.className='iconbtn';b.title='Ficha financiera';b.textContent='💰';b.onclick=()=>abrirFichaFinancieraCliente(nombre);actions.prepend(b);}else{const cell=row.insertCell(-1);cell.innerHTML='<button class="btn btn-sm btn-ghost">💰 Ficha financiera</button>';cell.querySelector('button').onclick=()=>abrirFichaFinancieraCliente(nombre);}});
        main.dataset.fichaFinanciera='1';
    }

    global.abrirFichaFinancieraCliente=abrirFichaFinancieraCliente; global.enhanceClientesView=enhanceClientesView;
})(window);
