// ============================================================
// PAGOS RECURRENTES - Historial mensual
// Mantiene compatibilidad con el formato anterior pagadoMes.
// ============================================================
(function (global) {
    'use strict';

    const KEY = 'pagosFijos';
    const uid = () => S.user?.uid || null;
    const mesActual = () => new Date().toISOString().slice(0, 7);
    const fechaActual = () => new Date().toISOString().slice(0, 10);
    const escF = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const dinero = v => typeof bs === 'function' ? bs(Number(v) || 0) : `Bs ${(Number(v) || 0).toFixed(2)}`;

    function normalizar(p) {
        const historial = (p && p.historial && typeof p.historial === 'object') ? {...p.historial} : {};
        // Migración transparente del único registro antiguo.
        if (p?.pagadoMes && !historial[p.pagadoMes]) {
            historial[p.pagadoMes] = { pagado: true, fechaPago: p.fechaPago || p.pagadoMes };
        }
        return {
            ...p,
            historial,
            pagadoMes: undefined,
            fechaPago: undefined
        };
    }

    function estaPagado(p, mes = mesActual()) {
        return !!p?.historial?.[mes]?.pagado;
    }

    function getMesesConHistorial(p) {
        return Object.keys(p?.historial || {})
            .filter(m => /^\d{4}-\d{2}$/.test(m))
            .sort()
            .reverse();
    }

    async function cargar() {
        if (typeof loadPagosFijos === 'function') await loadPagosFijos();
        S.pagosFijos = (Array.isArray(S.pagosFijos) ? S.pagosFijos : []).map(normalizar);
        return S.pagosFijos;
    }

    async function guardar() {
        if (typeof savePagosFijos === 'function') return savePagosFijos();
        return false;
    }

    async function toggle(id, mes = mesActual()) {
        await cargar();
        const p = S.pagosFijos.find(x => String(x.id) === String(id));
        if (!p) return;
        p.historial = p.historial || {};
        if (estaPagado(p, mes)) {
            delete p.historial[mes];
        } else {
            p.historial[mes] = { pagado: true, fechaPago: fechaActual() };
        }
        await guardar();
        render();
    }

    function nombreMes(ym) {
        const [y,m] = ym.split('-').map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString('es-BO', {month:'long', year:'numeric'});
    }

    function historialHTML(p) {
        const meses = getMesesConHistorial(p).slice(0, 12);
        if (!meses.length) return '<div style="font-size:12px;color:var(--text-soft);padding:8px 0;">Sin pagos registrados todavía.</div>';
        return `<div style="display:grid;gap:5px;margin-top:8px;">${meses.map(m => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;"><span>✓ ${escF(nombreMes(m))}</span><span class="tnum">${escF(p.historial[m]?.fechaPago || '—')}</span></div>`).join('')}</div>`;
    }

    function buildPanel() {
        const mes = mesActual();
        const rows = (S.pagosFijos || []).slice().sort((a,b) => Number(a.dia||99) - Number(b.dia||99));
        const pendientes = rows.filter(p => !estaPagado(p, mes)).length;
        const pagados = rows.length - pendientes;
        const total = rows.reduce((s,p) => s + Number(p.monto || 0), 0);
        return `<div class="panel" id="pagos-fijos-panel" style="margin-top:18px;">
            <div class="panel-h"><div><h3>🧾 Pagos por hacer</h3><span>${pagados} pagados · ${pendientes} pendientes · ${dinero(total)} estimados este mes</span></div>
            <button class="btn btn-sm btn-primary" onclick="agregarPagoFijo()">+ Agregar pago</button></div>
            <div class="panel-body">${rows.length ? `<div style="display:grid;gap:8px;">${rows.map(p => {
                const pagado = estaPagado(p, mes);
                return `<div style="display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:12px;align-items:start;padding:11px 4px;border-bottom:1px solid var(--border);">
                    <input type="checkbox" ${pagado?'checked':''} onchange="togglePagoFijo('${escF(p.id)}')" style="width:18px;height:18px;cursor:pointer;margin-top:2px;">
                    <div style="min-width:0;"><div style="font-weight:550;${pagado?'text-decoration:line-through;opacity:.6;':''}">${escF(p.nombre)}</div>
                    <div style="font-size:11px;color:var(--text-soft);">${escF(p.categoria || 'General')} · día ${Number(p.dia)||1}${pagado && p.historial?.[mes]?.fechaPago ? ` · pagado ${escF(p.historial[mes].fechaPago)}` : ''}</div>
                    <details style="margin-top:5px;"><summary style="font-size:11px;color:var(--text-soft);cursor:pointer;">Ver historial (${getMesesConHistorial(p).length})</summary>${historialHTML(p)}</details></div>
                    <div style="font-size:13px;font-weight:600;white-space:nowrap;${pagado?'opacity:.55;':''}">${dinero(p.monto)}</div>
                    <div style="display:flex;gap:4px;"><button class="iconbtn" title="Editar" onclick="editarPagoFijo('${escF(p.id)}')">✎</button><button class="iconbtn" title="Eliminar" onclick="eliminarPagoFijo('${escF(p.id)}')">×</button></div>
                </div>`;
            }).join('')}</div>` : '<div class="empty" style="padding:22px;">No tienes pagos recurrentes registrados.</div>'}</div>
        </div>`;
    }

    async function sync() {
        await cargar();
        const panel = document.getElementById('pagos-fijos-panel');
        if (panel) panel.outerHTML = buildPanel();
    }

    async function agregar() {
        const nombre = prompt('¿Qué pago quieres controlar?\nEj.: Internet, Luz, Escuela');
        if (!nombre?.trim()) return;
        const categoria = prompt('Categoría (Hogar, Educación, Servicios, etc.)','Hogar') || 'General';
        const monto = Number(prompt('Monto aproximado en Bs','0')) || 0;
        const dia = Math.min(31, Math.max(1, Number(prompt('Día habitual de pago (1-31)','5')) || 1));
        await cargar();
        const id = global.crypto?.randomUUID ? crypto.randomUUID() : `pf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        S.pagosFijos.push({id,nombre:nombre.trim(),categoria:categoria.trim(),monto,dia,historial:{},notas:''});
        await guardar();
        render();
    }

    async function editar(id) {
        await cargar();
        const p = S.pagosFijos.find(x => String(x.id) === String(id));
        if (!p) return;
        const nombre = prompt('Nombre', p.nombre);
        if (!nombre?.trim()) return;
        p.nombre = nombre.trim();
        p.monto = Number(prompt('Monto aproximado en Bs', p.monto)) || 0;
        p.dia = Math.min(31, Math.max(1, Number(prompt('Día habitual', p.dia)) || 1));
        await guardar();
        render();
    }

    async function eliminar(id) {
        await cargar();
        const p = S.pagosFijos.find(x => String(x.id) === String(id));
        if (!p || !confirm(`¿Eliminar el control de "${p.nombre}"? Se eliminará también su historial.`)) return;
        S.pagosFijos = S.pagosFijos.filter(x => String(x.id) !== String(id));
        await guardar();
        render();
    }

    global.togglePagoFijo = toggle;
    global.agregarPagoFijo = agregar;
    global.editarPagoFijo = editar;
    global.eliminarPagoFijo = eliminar;
    global.syncPagosFijosEnhanced = sync;
})(window);
