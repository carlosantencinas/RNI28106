// ============================================================
// FINANZAS - Centro financiero + pagos personales/recurrentes
// ============================================================
(function (global) {
    'use strict';

    const STORAGE_KEY = 'pagosFijos';
    let loadedUid = null;
    let loading = false;

    const uid = () => S.user?.uid || null;
    const mesActual = () => new Date().toISOString().slice(0, 7);
    const escF = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const dinero = v => typeof bs === 'function' ? bs(Number(v) || 0) : `Bs ${Number(v || 0).toFixed(2)}`;
    const nuevoId = () => (global.crypto?.randomUUID ? crypto.randomUUID() : `pf_${Date.now()}_${Math.random().toString(36).slice(2)}`);

    async function loadPagosFijos(force = false) {
        const userId = uid();
        if (!userId) return [];
        if (!force && loadedUid === userId && Array.isArray(S.pagosFijos)) return S.pagosFijos;
        if (loading) return S.pagosFijos || [];
        loading = true;
        try {
            const raw = typeof cloudGet === 'function' ? await cloudGet(userId, STORAGE_KEY) : localStorage.getItem(`${STORAGE_KEY}_${userId}`);
            const data = typeof raw === 'string' ? JSON.parse(raw || '[]') : (Array.isArray(raw) ? raw : []);
            S.pagosFijos = Array.isArray(data) ? data : [];
            loadedUid = userId;
        } catch (e) {
            console.warn('No se pudieron cargar los pagos fijos:', e);
            S.pagosFijos = S.pagosFijos || [];
        } finally { loading = false; }
        return S.pagosFijos;
    }

    async function savePagosFijos() {
        const userId = uid();
        if (!userId) return false;
        const value = JSON.stringify(Array.isArray(S.pagosFijos) ? S.pagosFijos : []);
        try {
            if (typeof saveDataKey === 'function') await saveDataKey(userId, STORAGE_KEY, S.pagosFijos);
            else localStorage.setItem(`${STORAGE_KEY}_${userId}`, value);
            return true;
        } catch (e) { console.warn('No se pudieron guardar los pagos fijos:', e); return false; }
    }

    function normalizarPago(p) {
        return { id:p.id || nuevoId(), nombre:p.nombre || 'Pago', categoria:p.categoria || 'Hogar', monto:Number(p.monto)||0, dia:Number(p.dia)||1, pagadoMes:p.pagadoMes || '', fechaPago:p.fechaPago || '', notas:p.notas || '' };
    }

    function estaPagado(p) { return p.pagadoMes === mesActual(); }

    async function togglePagoFijo(id) {
        await loadPagosFijos();
        const p = S.pagosFijos.find(x => String(x.id) === String(id));
        if (!p) return;
        if (estaPagado(p)) { p.pagadoMes = ''; p.fechaPago = ''; }
        else { p.pagadoMes = mesActual(); p.fechaPago = new Date().toISOString().slice(0, 10); }
        await savePagosFijos();
        render();
    }

    async function agregarPagoFijo() {
        const nombre = prompt('¿Qué pago quieres controlar?\nEj.: Internet, Luz, Escuela');
        if (!nombre?.trim()) return;
        const categoria = prompt('Categoría (Hogar, Educación, Servicios, etc.)', 'Hogar') || 'General';
        const monto = Number(prompt('Monto aproximado en Bs', '0')) || 0;
        const dia = Math.min(31, Math.max(1, Number(prompt('Día habitual de pago (1-31)', '5')) || 1));
        await loadPagosFijos();
        S.pagosFijos.push(normalizarPago({ nombre:nombre.trim(), categoria:categoria.trim(), monto, dia }));
        await savePagosFijos();
        render();
    }

    async function editarPagoFijo(id) {
        await loadPagosFijos();
        const p = S.pagosFijos.find(x => String(x.id) === String(id));
        if (!p) return;
        const nombre = prompt('Nombre', p.nombre); if (!nombre?.trim()) return;
        const monto = Number(prompt('Monto aproximado en Bs', p.monto)) || 0;
        const dia = Math.min(31, Math.max(1, Number(prompt('Día habitual', p.dia)) || 1));
        p.nombre = nombre.trim(); p.monto = monto; p.dia = dia;
        await savePagosFijos(); render();
    }

    async function eliminarPagoFijo(id) {
        await loadPagosFijos();
        const p = S.pagosFijos.find(x => String(x.id) === String(id));
        if (!p || !confirm(`¿Eliminar el control de "${p.nombre}"?`)) return;
        S.pagosFijos = S.pagosFijos.filter(x => String(x.id) !== String(id));
        await savePagosFijos(); render();
    }

    function buildPagosFijos() {
        const rows = (S.pagosFijos || []).slice().sort((a,b) => Number(a.dia||99)-Number(b.dia||99));
        const pendientes = rows.filter(p => !estaPagado(p)).length;
        const total = rows.reduce((s,p) => s + Number(p.monto||0), 0);
        return `<div class="panel" id="pagos-fijos-panel" style="margin-top:18px;">
            <div class="panel-h"><div><h3>🧾 Pagos por hacer</h3><span>${pendientes} pendientes este mes · ${dinero(total)} estimados</span></div><button class="btn btn-sm btn-primary" onclick="agregarPagoFijo()">+ Agregar pago</button></div>
            <div class="panel-body">
                ${rows.length ? `<div style="display:grid;gap:8px;">${rows.map(p => {
                    const pagado = estaPagado(p);
                    return `<div style="display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:11px 4px;border-bottom:1px solid var(--border);">
                        <input type="checkbox" ${pagado ? 'checked' : ''} onchange="togglePagoFijo('${escF(p.id)}')" title="Marcar como pagado este mes" style="width:18px;height:18px;cursor:pointer;">
                        <div style="min-width:0;"><div style="font-weight:550;${pagado?'text-decoration:line-through;opacity:.6;':''}">${escF(p.nombre)}</div><div style="font-size:11px;color:var(--text-soft);">${escF(p.categoria)} · vence aprox. día ${Number(p.dia)||1}${p.fechaPago ? ` · pagado ${escF(p.fechaPago)}` : ''}</div></div>
                        <div style="font-size:13px;font-weight:600;white-space:nowrap;${pagado?'opacity:.55;':''}">${dinero(p.monto)}</div>
                        <div style="display:flex;gap:4px;"><button class="iconbtn" title="Editar" onclick="editarPagoFijo('${escF(p.id)}')">✎</button><button class="iconbtn" title="Eliminar" onclick="eliminarPagoFijo('${escF(p.id)}')">×</button></div>
                    </div>`;
                }).join('')}</div>` : `<div class="empty" style="padding:22px;">${ICONS.empty}<div>No tienes pagos recurrentes registrados.</div></div>`}
            </div></div>`;
    }

    function getFinancialSummarySafe() {
        return typeof getResumenPagos === 'function' ? getResumenPagos() : {totalCobrado:0,totalPorCobrar:0,deudasPendientes:0,deudasParciales:0,deudasPagadas:0};
    }

    function viewFinanzas() {
        const r = getFinancialSummarySafe();
        const cots = (S.cotizaciones || []).filter(c => c.estado === 'aceptada').map(c => ({...c,...getResumenCotizacion(c)})).filter(c => c.saldoPendiente > .01).sort((a,b) => b.saldoPendiente-a.saldoPendiente);
        return `<div class="page-head"><div><h1>💰 Finanzas</h1><p>Control de cobros profesionales y pagos personales</p></div><button class="btn btn-ghost" onclick="S.view='dashboard';render();">← Dashboard</button></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:18px;">
            ${[['💵','Cobrado',r.totalCobrado],['📥','Por cobrar',r.totalPorCobrar],['⏳','Pendientes',r.deudasPendientes],['🔄','Parciales',r.deudasParciales],['✅','Completados',r.deudasPagadas]].map(x=>`<div class="panel" style="padding:15px;margin:0;"><div style="font-size:11px;color:var(--text-soft);">${x[0]} ${x[1]}</div><div style="font-size:20px;font-weight:650;margin-top:5px;">${typeof x[2]==='number' ? (x[1].includes('ados')||x[1]==='Pendientes'||x[1]==='Parciales' ? x[2] : dinero(x[2])) : x[2]}</div></div>`).join('')}
        </div>${buildPagosFijos()}
        <div class="panel" style="margin-top:18px;"><div class="panel-h"><div><h3>📌 Cartera por cobrar</h3><span>Ordenada por mayor saldo</span></div></div><div class="panel-body">${cots.length ? `<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Proyecto</th><th>Total</th><th>Cobrado</th><th>Saldo</th><th>Avance</th></tr></thead><tbody>${cots.map(c=>`<tr><td>${escF(c.cliente||'')}</td><td>${escF(c.titulo||c.proyecto||'')}</td><td class="tright tnum">${dinero(c.montoTotal)}</td><td class="tright tnum">${dinero(c.totalPagado)}</td><td class="tright tnum"><strong>${dinero(c.saldoPendiente)}</strong></td><td>${Number(c.porcentaje||0).toFixed(0)}%</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty" style="padding:20px;">No hay deudas pendientes.</div>'}</div></div>`;
    }

    async function ensureData() { if (uid()) await loadPagosFijos(); }

    const previousRender = global.render;
    global.render = function () {
        previousRender();
        const main = document.getElementById('main');
        if (!main) return;
        if (S.view === 'finanzas') {
            main.innerHTML = viewFinanzas();
            ensureData().then(() => { if (S.view === 'finanzas') main.innerHTML = viewFinanzas(); });
        } else if (S.view === 'dashboard') {
            ensureData().then(() => { if (S.view === 'dashboard') { const old = document.getElementById('pagos-fijos-panel'); if (old) old.outerHTML = buildPagosFijos(); else { const panels = main.querySelectorAll('.panel'); const target = panels[panels.length-1]; if (target) target.insertAdjacentHTML('afterend', buildPagosFijos()); } } });
            main.querySelectorAll('button').forEach(b => { if ((b.textContent||'').trim().includes('Gestionar pagos')) b.onclick = () => { S.view='finanzas'; render(); }; });
        }
        const nav = document.getElementById('nav');
        if (nav && !nav.querySelector('[data-nav="finanzas"]')) {
            const b = document.createElement('button'); b.className = `nav-btn ${S.view==='finanzas'?'active':''}`; b.dataset.nav='finanzas'; b.innerHTML='💰<span>Finanzas</span>'; b.onclick=()=>{S.view='finanzas';render();}; nav.appendChild(b);
        }
    };
    global.togglePagoFijo = togglePagoFijo; global.agregarPagoFijo = agregarPagoFijo; global.editarPagoFijo = editarPagoFijo; global.eliminarPagoFijo = eliminarPagoFijo; global.viewFinanzas = viewFinanzas;
})(window);
