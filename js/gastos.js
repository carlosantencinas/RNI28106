// ============================================================
// GASTOS - Egresos extraordinarios / no recurrentes
// Separados de cobros de clientes y pagos fijos.
// ============================================================
(function (global) {
    'use strict';

    const CATEGORIAS = ['Vehículo','Hogar','Equipamiento','Oficina','Formación','Personal','Mantenimiento','Trámites','Financiero','Otros'];
    const METODOS = ['Efectivo','Transferencia','Tarjeta','Débito automático','Otro'];
    const escG = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const dinero = v => typeof bs === 'function' ? bs(Number(v)||0) : `Bs ${(Number(v)||0).toFixed(2)}`;
    const hoy = () => new Date().toISOString().slice(0,10);
    const uid = () => global.crypto?.randomUUID ? crypto.randomUUID() : `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    async function cargar() {
        if (typeof loadGastos === 'function') await loadGastos();
        S.gastos = Array.isArray(S.gastos) ? S.gastos : [];
        return S.gastos;
    }
    async function guardar() { return typeof saveGastos === 'function' ? saveGastos() : false; }

    function formHTML(g={}) {
        const cat = g.categoria || 'Otros';
        const metodo = g.metodoPago || 'Transferencia';
        return `<div class="modal-overlay" id="gasto-modal" onclick="if(event.target===this)cerrarGastoModal()"><div class="modal" style="max-width:680px"><div class="modal-h"><h3>${g.id?'Editar gasto':'Nuevo gasto'}</h3><button class="iconbtn" onclick="cerrarGastoModal()">×</button></div><div class="modal-body"><div class="form-grid">
        <div class="field"><label>Fecha *</label><input id="g-fecha" type="date" value="${escG(g.fecha||hoy())}" required></div>
        <div class="field"><label>Monto (Bs) *</label><input id="g-monto" type="number" min="0" step="0.01" value="${g.monto??''}" required></div>
        <div class="field full"><label>Concepto *</label><input id="g-concepto" value="${escG(g.concepto||'')}" placeholder="Ej.: Compra de 4 llantas" required></div>
        <div class="field"><label>Categoría</label><select id="g-categoria">${CATEGORIAS.map(x=>`<option ${x===cat?'selected':''}>${escG(x)}</option>`).join('')}</select></div>
        <div class="field"><label>Método de pago</label><select id="g-metodo">${METODOS.map(x=>`<option ${x===metodo?'selected':''}>${escG(x)}</option>`).join('')}</select></div>
        <div class="field"><label>Proveedor</label><input id="g-proveedor" value="${escG(g.proveedor||'')}" placeholder="Opcional"></div>
        <div class="field"><label>NIT proveedor</label><input id="g-nit" value="${escG(g.nitProveedor||'')}" placeholder="Opcional"></div>
        <div class="field"><label>N.º factura</label><input id="g-factura" value="${escG(g.factura||'')}" placeholder="Opcional"></div>
        <div class="field full"><label>Notas</label><textarea id="g-notas" rows="3" placeholder="Detalle, motivo o información adicional">${escG(g.notas||'')}</textarea></div>
        </div></div><div class="modal-f"><button class="btn btn-ghost" onclick="cerrarGastoModal()">Cancelar</button><button class="btn btn-primary" onclick="guardarGasto('${escG(g.id||'')}')">Guardar</button></div></div></div>`;
    }

    function abrir(id='') {
        const g=(S.gastos||[]).find(x=>String(x.id)===String(id)) || {};
        const old=document.getElementById('gasto-modal'); if(old)old.remove();
        document.body.insertAdjacentHTML('beforeend',formHTML(g));
    }
    function cerrar(){document.getElementById('gasto-modal')?.remove();}

    async function guardar(id='') {
        const concepto=document.getElementById('g-concepto')?.value.trim();
        const fecha=document.getElementById('g-fecha')?.value;
        const monto=Number(document.getElementById('g-monto')?.value||0);
        if(!concepto || !fecha || monto<=0){ alert('Completa concepto, fecha y un monto mayor a 0.'); return; }
        await cargar();
        const g=S.gastos.find(x=>String(x.id)===String(id));
        const data={
            id:id||uid(), fecha, concepto, monto,
            categoria:document.getElementById('g-categoria')?.value||'Otros',
            metodoPago:document.getElementById('g-metodo')?.value||'Transferencia',
            proveedor:document.getElementById('g-proveedor')?.value.trim()||'',
            nitProveedor:document.getElementById('g-nit')?.value.trim()||'',
            factura:document.getElementById('g-factura')?.value.trim()||'',
            notas:document.getElementById('g-notas')?.value.trim()||''
        };
        if(g) Object.assign(g,data); else S.gastos.push(data);
        await guardar(); cerrar(); render();
    }
    async function eliminar(id){
        await cargar(); const g=S.gastos.find(x=>String(x.id)===String(id));
        if(!g || !confirm(`¿Eliminar el gasto "${g.concepto}" por ${dinero(g.monto)}?`))return;
        S.gastos=S.gastos.filter(x=>String(x.id)!==String(id)); await guardar(); render();
    }

    function resumen(){
        const rows=S.gastos||[]; const total=rows.reduce((s,g)=>s+Number(g.monto||0),0);
        const mes=hoy().slice(0,7); const actual=rows.filter(g=>String(g.fecha||'').slice(0,7)===mes).reduce((s,g)=>s+Number(g.monto||0),0);
        return {total,actual,cantidad:rows.length};
    }
    function vista(){
        const rows=(S.gastos||[]).slice().sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')));
        const r=resumen();
        return `<div class="page-head"><div><h1>Gastos</h1><p>Egresos extraordinarios y no recurrentes</p></div><button class="btn btn-primary" onclick="abrirGasto()">+ Registrar gasto</button></div>
        <div class="kpi-grid"><div class="kpi"><span>Total registrado</span><strong>${dinero(r.total)}</strong></div><div class="kpi"><span>Este mes</span><strong>${dinero(r.actual)}</strong></div><div class="kpi"><span>Registros</span><strong>${r.cantidad}</strong></div></div>
        <div class="panel"><div class="panel-h"><div><h3>Historial de gastos</h3><span>Compras, mantenimientos y otros egresos no recurrentes</span></div></div><div class="panel-body">${rows.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Proveedor</th><th>Método</th><th class="tright">Monto</th><th></th></tr></thead><tbody>${rows.map(g=>`<tr><td class="mono">${escG(g.fecha||'—')}</td><td><strong>${escG(g.concepto)}</strong>${g.notas?`<div class="muted">${escG(g.notas)}</div>`:''}</td><td>${escG(g.categoria||'Otros')}</td><td>${escG(g.proveedor||'—')}</td><td>${escG(g.metodoPago||'—')}</td><td class="tright tnum">${dinero(g.monto)}</td><td><div style="display:flex;gap:4px"><button class="iconbtn" title="Editar" onclick="editarGasto('${escG(g.id)}')">✎</button><button class="iconbtn" title="Eliminar" onclick="eliminarGasto('${escG(g.id)}')">×</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty" style="padding:30px">Todavía no hay gastos registrados.</div>'}</div></div>`;
    }

    global.abrirGasto=()=>abrir(); global.editarGasto=abrir; global.cerrarGastoModal=cerrar; global.guardarGasto=guardar; global.eliminarGasto=eliminar;
    global.renderGastos=vista; global.getGastosResumen=resumen; global.GASTOS_CATEGORIAS=CATEGORIAS;
})(window);
