// ============================================================
// FICHA FINANCIERA INDIVIDUAL DEL CLIENTE
// ============================================================
(function (global) {
    'use strict';

    const escF = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
    const dinero = v => typeof bs === 'function' ? bs(Number(v) || 0) : `Bs ${(Number(v) || 0).toFixed(2)}`;
    const fecha = v => {
        if (!v) return '—';
        try { return typeof fmtDate === 'function' ? fmtDate(v) : new Date(v).toLocaleDateString('es-BO'); }
        catch (_) { return String(v); }
    };
    const norm = v => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    function resumenCliente(nombre) {
        const key = norm(nombre);
        const cots = (S.cotizaciones || []).filter(c => norm(c.cliente) === key);
        const pagos = (S.pagos || []).filter(p => norm(p.cliente || p.entidad) === key);
        const cotIds = new Set(cots.map(c => String(c.id)));

        const trabajos = cots.map(c => {
            const r = typeof getResumenCotizacion === 'function'
                ? getResumenCotizacion(c)
                : { montoTotal: Number(c.montoTotal || c.total || c.monto || 0), totalPagado: 0, saldoPendiente: Number(c.montoTotal || c.total || c.monto || 0), porcentaje: 0 };
            return { ...c, ...r };
        });

        // Pagos directos que no están vinculados a una cotización.
        const directos = pagos.filter(p => !p.cotizacionId || !cotIds.has(String(p.cotizacionId)));
        const movimientos = typeof getMovimientosCobro === 'function'
            ? getMovimientosCobro().filter(p => norm(p.cliente) === key || (p.cotizacionId && cotIds.has(String(p.cotizacionId))))
            : directos.filter(p => Number(p.montoPagado) > 0).map(p => ({
                id: p.id, fecha: p.fecha || p.fechaCreacion, monto: Number(p.montoPagado) || 0,
                cliente: nombre, descripcion: p.descripcion || p.concepto || 'Cobro', metodo: p.metodoPago || '', comprobante: p.comprobante || ''
            }));

        const totalContratado = trabajos.reduce((s, c) => s + Number(c.montoTotal || 0), 0);
        const totalPagado = trabajos.reduce((s, c) => s + Number(c.totalPagado || 0), 0)
            + directos.reduce((s, p) => s + Number(p.montoPagado || 0), 0);
        const saldo = Math.max(0, totalContratado - trabajos.reduce((s, c) => s + Number(c.totalPagado || 0), 0));
        const pendientes = trabajos.filter(c => Number(c.totalPagado || 0) <= .01 && Number(c.saldoPendiente || 0) > .01).length;
        const parciales = trabajos.filter(c => Number(c.totalPagado || 0) > .01 && Number(c.saldoPendiente || 0) > .01).length;
        const completados = trabajos.filter(c => Number(c.saldoPendiente || 0) <= .01 && Number(c.montoTotal || 0) > 0).length;
        const proyectos = [...new Set([
            ...(S.clientes || []).find(c => norm(c.nombre) === key)?.proyectos || [],
            ...cots.map(c => c.proyecto).filter(Boolean)
        ])];
        const cliente = (S.clientes || []).find(c => norm(c.nombre) === key) || { nombre };

        return { nombre: cliente.nombre || nombre, cliente, trabajos, movimientos, proyectos, totalContratado, totalPagado, saldo, pendientes, parciales, completados };
    }

    function card(icon, label, value, extra='') {
        return `<div class="panel" style="padding:14px;margin:0;min-width:0;"><div style="font-size:11px;color:var(--text-soft);">${icon} ${label}</div><div style="font-size:19px;font-weight:650;margin-top:5px;white-space:nowrap;">${value}</div>${extra ? `<div style="font-size:10px;color:var(--text-soft);margin-top:3px;">${extra}</div>` : ''}</div>`;
    }

    function abrirFichaFinancieraCliente(nombre) {
        const r = resumenCliente(nombre);
        const cliente = r.cliente || {};
        const porcentaje = r.totalContratado > 0 ? Math.min(100, (r.totalPagado / r.totalContratado) * 100) : 0;
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="modal" style="max-width:1050px;width:calc(100% - 28px);max-height:90vh;">
                <div class="modal-h">
                    <div>
                        <div style="font-size:10px;color:var(--text-soft);text-transform:uppercase;letter-spacing:.08em;">Ficha financiera</div>
                        <h3 style="margin-top:2px;">${escF(r.nombre)}</h3>
                    </div>
                    <button class="close" id="cf-close">&times;</button>
                </div>
                <div class="modal-body" style="overflow:auto;">
                    <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:16px;padding:12px 14px;background:var(--surface-2,#f7f8f9);border:1px solid var(--border);border-radius:var(--radius);">
                        <span>📞 ${escF(cliente.telefono || 'Sin teléfono')}</span>
                        <span>✉️ ${escF(cliente.email || 'Sin correo')}</span>
                        <span>🪪 ${escF(cliente.nit || cliente.documento || 'Sin NIT/documento')}</span>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-bottom:18px;">
                        ${card('💼','Contratado',dinero(r.totalContratado))}
                        ${card('💵','Cobrado',dinero(r.totalPagado), `${porcentaje.toFixed(0)}% del contratado`)}
                        ${card('📥','Saldo pendiente',dinero(r.saldo))}
                        ${card('⏳','Pendientes',r.pendientes)}
                        ${card('🔄','Parciales',r.parciales)}
                        ${card('✅','Completados',r.completados)}
                    </div>

                    <div class="panel" style="margin-bottom:18px;">
                        <div class="panel-h"><div><h3>📌 Trabajos y cuentas</h3><span>${r.trabajos.length} registro${r.trabajos.length === 1 ? '' : 's'}</span></div></div>
                        <div class="panel-body">
                            ${r.trabajos.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Trabajo</th><th>Proyecto</th><th>Estado</th><th class="tright">Total</th><th class="tright">Cobrado</th><th class="tright">Saldo</th></tr></thead><tbody>${r.trabajos.sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||''))).map(c => {
                                const estado = Number(c.saldoPendiente || 0) <= .01 ? 'Pagado' : Number(c.totalPagado || 0) > .01 ? 'Parcial' : 'Pendiente';
                                return `<tr><td class="tnum" style="white-space:nowrap;">${fecha(c.fecha)}</td><td>${escF(c.titulo || c.descripcion || '—')}</td><td>${escF(c.proyecto || '—')}</td><td><span class="stamp ${estado==='Pagado'?'certificado':estado==='Parcial'?'en-curso':'pendiente'}">${estado}</span></td><td class="tright tnum">${dinero(c.montoTotal)}</td><td class="tright tnum">${dinero(c.totalPagado)}</td><td class="tright tnum"><strong>${dinero(c.saldoPendiente)}</strong></td></tr>`;
                            }).join('')}</tbody></table></div>` : '<div class="empty" style="padding:18px;">No hay cotizaciones registradas para este cliente.</div>'}
                        </div>
                    </div>

                    <div class="panel" style="margin-bottom:18px;">
                        <div class="panel-h"><div><h3>🧾 Historial de cobros</h3><span>${r.movimientos.length} movimiento${r.movimientos.length === 1 ? '' : 's'}</span></div></div>
                        <div class="panel-body">
                            ${r.movimientos.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Método</th><th>Comprobante</th><th class="tright">Monto</th></tr></thead><tbody>${r.movimientos.map(p => `<tr><td class="tnum" style="white-space:nowrap;">${fecha(p.fecha)}</td><td>${escF(p.descripcion || 'Cobro')}</td><td>${escF(p.metodo || '—')}</td><td>${escF(p.comprobante || '—')}</td><td class="tright tnum"><strong>${dinero(p.monto)}</strong></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty" style="padding:18px;">No hay cobros registrados para este cliente.</div>'}
                        </div>
                    </div>

                    <div class="panel">
                        <div class="panel-h"><div><h3>📂 Proyectos asociados</h3></div></div>
                        <div class="panel-body">${r.proyectos.length ? r.proyectos.map(p => `<span style="display:inline-block;padding:7px 10px;margin:3px;border:1px solid var(--border);border-radius:999px;font-size:12px;">${escF(p)}</span>`).join('') : '<span style="color:var(--text-soft);font-size:12px;">Sin proyectos asociados.</span>'}</div>
                    </div>
                </div>
                <div class="modal-foot">
                    <button class="btn btn-ghost" id="cf-finanzas">💰 Ver Finanzas</button>
                    <button class="btn btn-primary" id="cf-close-2">Cerrar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#cf-close').onclick = close;
        overlay.querySelector('#cf-close-2').onclick = close;
        overlay.querySelector('#cf-finanzas').onclick = () => { close(); S.view = 'finanzas'; render(); };
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
    }

    function enhanceClientesView() {
        if (S.view !== 'clientes') return;
        const main = document.getElementById('main');
        if (!main || main.dataset.fichaFinanciera === '1') return;
        const rows = main.querySelectorAll('.table-wrap tbody tr');
        if (!rows.length) return;
        rows.forEach(row => {
            const first = row.querySelector('td');
            if (!first) return;
            const nombre = first.textContent.trim();
            if (!nombre) return;
            const actions = row.querySelector('.rowactions');
            if (actions) {
                const b = document.createElement('button');
                b.className = 'iconbtn'; b.title = 'Ficha financiera'; b.textContent = '💰';
                b.onclick = () => abrirFichaFinancieraCliente(nombre);
                actions.prepend(b);
            } else {
                const cell = row.insertCell(-1);
                cell.innerHTML = `<button class="btn btn-sm btn-ghost">💰 Ficha financiera</button>`;
                cell.querySelector('button').onclick = () => abrirFichaFinancieraCliente(nombre);
            }
        });
        main.dataset.fichaFinanciera = '1';
    }

    global.abrirFichaFinancieraCliente = abrirFichaFinancieraCliente;
    global.enhanceClientesView = enhanceClientesView;
})(window);
