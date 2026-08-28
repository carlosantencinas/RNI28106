// ============================================================
// MODALES - Todos los modales de la aplicación
// ============================================================

// ---- ITEM ROW (para cotizaciones) ----
function itemRowHtml(it) {
    return `<div class="item-row" data-item="${it.id}" style="display:grid;grid-template-columns:1fr 90px 100px 70px 30px;gap:8px;align-items:start;margin-bottom:8px;">
        <textarea class="it-actividad" placeholder="Descripción" style="min-height:36px;font-size:12px;padding:6px 8px;border:1px solid var(--border);border-radius:3px;font-family:'Inter',sans-serif;">${esc(it.actividad||'')}</textarea>
        <input class="it-pu" type="number" step="0.01" placeholder="P.U." value="${it.pu||0}" style="font-size:12px;padding:6px 8px;border:1px solid var(--border);border-radius:3px;">
        <input class="it-unidad" placeholder="Unidad" value="${attr(it.unidad||'')}" style="font-size:12px;padding:6px 8px;border:1px solid var(--border);border-radius:3px;">
        <input class="it-cantidad" type="number" step="1" placeholder="Cant." value="${it.cantidad||1}" style="font-size:12px;padding:6px 8px;border:1px solid var(--border);border-radius:3px;">
        <button type="button" class="item-remove" style="background:none;border:none;color:#C0392B;cursor:pointer;font-size:18px;padding:2px 4px;">×</button>
    </div>`;
}

// ============================================================
// MODAL - COTIZACIONES
// ============================================================

// ---- MODAL COTIZACIONES (CON PLAZO POR ÍTEM) ----
// ---- MODAL COTIZACIONES (CON CABECERA DE ÍTEMS) ----
function openCotModal(cot) {
    const isNew = !cot;
    const c = cot ? JSON.parse(JSON.stringify(cot)) : {
        id: uid(),
        fecha: new Date().toISOString().slice(0, 10),
        proyecto: '',
        cliente: '',
        titulo: '',
        items: [{ id: uid(), actividad: '', pu: 0, unidad: '', cantidad: 1, plazo: 0 }],
        descuento: 0,
        plazoDias: 0,
        nota: S.config.defaultNota || '',
        entregables: S.config.defaultEntregables || '',
        estado: 'borrador'
    };

    // Calcular plazo total si existe
    let plazoTotal = 0;
    if (c.items && c.items.length > 0) {
        plazoTotal = c.items.reduce((sum, item) => sum + (Number(item.plazo) || 0), 0);
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-h">
                <h3>${isNew ? 'Nueva cotización' : 'Editar cotización'}</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="field"><label>Título del trabajo</label><input id="f-titulo" value="${attr(c.titulo)}" placeholder="Ej. Diseño hidráulico de..."></div>
                <div class="row2">
                    <div class="field"><label>Proyecto</label><input id="f-proyecto" list="dl-proyectos" value="${attr(c.proyecto)}"></div>
                    <div class="field"><label>Cliente</label><input id="f-cliente" list="dl-clientes" value="${attr(c.cliente)}"></div>
                </div>
                <datalist id="dl-clientes">${S.clientes.map(cl => `<option value="${attr(cl.nombre)}">`).join('')}</datalist>
                <datalist id="dl-proyectos">${[...new Set(S.clientes.flatMap(cl => cl.proyectos))].map(p => `<option value="${attr(p)}">`).join('')}</datalist>
                <div class="row3">
                    <div class="field"><label>Fecha</label><input type="date" id="f-fecha" value="${attr(c.fecha)}"></div>
                    <div class="field"><label>Plazo total (días)</label>
                        <input type="number" id="f-plazo-total" value="${plazoTotal}" disabled style="background:#f5f5f5;font-weight:bold;color:var(--primary);">
                        <div style="font-size:11px;color:var(--text-soft);margin-top:2px;">Se calcula automáticamente sumando los plazos de cada ítem</div>
                    </div>
                    <div class="field"><label>Estado</label>
                        <select id="f-estado">
                            ${['borrador','enviada','aceptada','rechazada'].map(e => `<option value="${e}" ${c.estado===e?'selected':''}>${e}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <!-- ========== CABECERA DE ÍTEMS ========== -->
                <div style="display:grid;grid-template-columns:1fr 80px 70px 50px 70px 30px;gap:8px;align-items:center;margin-bottom:6px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-soft);font-weight:600;padding:0 4px;">
                    <span>Actividad</span>
                    <span style="text-align:right;">P.U. [Bs]</span>
                    <span>Unidad</span>
                    <span style="text-align:center;">Cant.</span>
                    <span style="text-align:center;">Plazo</span>
                    <span style="text-align:center;"></span>
                </div>
                <!-- ======================================== -->
                
                <div class="items-block" id="items-block">
                    ${c.items.map(it => itemRowHtmlConPlazo(it)).join('')}
                </div>
                <button type="button" class="btn btn-sm btn-ghost" id="btn-add-item" style="margin-bottom:14px;">+ Agregar ítem</button>
                
                <div class="row2">
                    <div class="field"><label>Descuento [Bs]</label><input type="number" step="0.01" id="f-descuento" value="${c.descuento||0}"></div>
                    <div class="field"><label>&nbsp;</label><div style="font-size:12.5px;color:var(--text-soft);">Subtotal: <b id="f-subtotal-view">${bs(cotSubtotal(c))}</b></div></div>
                </div>
                
                <div class="field"><label>Entregables</label><textarea id="f-entregables" style="min-height:80px;">${esc(c.entregables||'')}</textarea></div>
                <div class="field"><label>Nota / alcance</label><textarea id="f-nota">${esc(c.nota||'')}</textarea></div>
                
                <div style="border-top:2px solid var(--primary);margin-top:6px;padding-top:12px;">
                    <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;color:var(--primary);">
                        <span>Monto final</span>
                        <span id="f-total-view">${bs(cotTotal(c))}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-soft);margin-top:4px;">
                        <span>Plazo total</span>
                        <span id="f-plazo-final">${plazoTotal} días</span>
                    </div>
                </div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-primary" id="m-save">${isNew ? 'Crear cotización' : 'Actualizar'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // ============================================================
    // FUNCIONES DE RECÁLCULO
    // ============================================================
    function recalc() {
        const rows = overlay.querySelectorAll('.item-row');
        let subtotal = 0;
        let plazoTotal = 0;
        
        rows.forEach(r => {
            const pu = Number(r.querySelector('.it-pu').value) || 0;
            const cant = Number(r.querySelector('.it-cantidad').value) || 0;
            const plazo = Number(r.querySelector('.it-plazo').value) || 0;
            subtotal += pu * cant;
            plazoTotal += plazo;
        });
        
        const desc = Number(overlay.querySelector('#f-descuento').value) || 0;
        overlay.querySelector('#f-subtotal-view').textContent = bs(subtotal);
        overlay.querySelector('#f-total-view').textContent = bs(subtotal - desc);
        
        // Actualizar plazo total
        overlay.querySelector('#f-plazo-total').value = plazoTotal;
        overlay.querySelector('#f-plazo-final').textContent = plazoTotal + ' días';
    }

    // ============================================================
    // EVENTOS
    // ============================================================
    
    // Agregar ítem
    overlay.querySelector('#btn-add-item').onclick = () => {
        const block = overlay.querySelector('#items-block');
        block.insertAdjacentHTML('beforeend', itemRowHtmlConPlazo({ 
            id: uid(), 
            actividad: '', 
            pu: 0, 
            unidad: '', 
            cantidad: 1, 
            plazo: 0 
        }));
        recalc();
    };

    // Eliminar ítem
    overlay.querySelector('#items-block').addEventListener('click', e => {
        if (e.target.classList.contains('item-remove')) {
            const row = e.target.closest('.item-row');
            if (overlay.querySelectorAll('.item-row').length > 1) {
                row.remove();
                recalc();
            } else toast('La cotización necesita al menos un ítem.');
        }
    });

    // Recalcular en cada cambio
    overlay.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.id !== 'f-plazo-total' && el.id !== 'f-plazo-final') {
            el.addEventListener('input', recalc);
        }
        if (el.id === 'f-plazo-total') {
            // No permitir edición manual
            el.addEventListener('keydown', e => e.preventDefault());
        }
    });
    overlay.querySelector('#f-descuento').addEventListener('input', recalc);

    // ============================================================
    // CERRAR MODAL
    // ============================================================
    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    // ============================================================
    // GUARDAR
    // ============================================================
    overlay.querySelector('#m-save').onclick = async () => {
        const items = [...overlay.querySelectorAll('.item-row')].map(r => ({
            id: r.dataset.item,
            actividad: r.querySelector('.it-actividad').value.trim(),
            pu: Number(r.querySelector('.it-pu').value) || 0,
            unidad: r.querySelector('.it-unidad').value.trim(),
            cantidad: Number(r.querySelector('.it-cantidad').value) || 0,
            plazo: Number(r.querySelector('.it-plazo').value) || 0 // <-- GUARDAR PLAZO
        }));
        
        const titulo = overlay.querySelector('#f-titulo').value.trim();
        if (!titulo) { toast('Ponle un título a la cotización.'); return; }

        // Calcular plazo total
        const plazoTotal = items.reduce((sum, item) => sum + (Number(item.plazo) || 0), 0);

        const nuevo = {
            id: c.id,
            fecha: overlay.querySelector('#f-fecha').value,
            proyecto: overlay.querySelector('#f-proyecto').value.trim(),
            cliente: overlay.querySelector('#f-cliente').value.trim(),
            titulo,
            items,
            descuento: Number(overlay.querySelector('#f-descuento').value) || 0,
            plazoDias: plazoTotal, // <-- GUARDAR PLAZO TOTAL
            entregables: overlay.querySelector('#f-entregables').value.trim(),
            nota: overlay.querySelector('#f-nota').value.trim(),
            estado: overlay.querySelector('#f-estado').value
        };

        if (isNew) S.cotizaciones.push(nuevo);
        else S.cotizaciones = S.cotizaciones.map(x => x.id === nuevo.id ? nuevo : x);

        await saveCotizaciones(S.user?.uid);

        if (nuevo.cliente) {
            let cli = S.clientes.find(c => c.nombre.toLowerCase() === nuevo.cliente.toLowerCase());
            if (!cli) { cli = { id: uid(), nombre: nuevo.cliente, proyectos: [] };
                S.clientes.push(cli); }
            if (nuevo.proyecto && !cli.proyectos.some(p => p.toLowerCase() === nuevo.proyecto.toLowerCase())) {
                cli.proyectos.push(nuevo.proyecto);
            }
            await saveClientes(S.user?.uid);
        }

        closeModal();
        render();
        toast(isNew ? '✅ Cotización creada.' : '✅ Cotización actualizada.');
    };
}
// ============================================================
// MODAL - PAGOS
// ============================================================

function openPagoModal(pago) {
    const isNew = !pago;
    const p = pago ? { ...pago } : {
        id: uid(),
        fecha: new Date().toISOString().slice(0, 10),
        cliente: '',
        descripcion: '',
        monto: 0,
        montoPagado: 0,
        fechaCompromiso: '',
        notas: '',
        cotizacionId: '',
        metodoPago: '',
        comprobante: ''
    };

    const cotizacionesDisponibles = S.cotizaciones.filter(c => c.estado === 'aceptada');

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:680px;">
            <div class="modal-h">
                <h3>${isNew ? 'Nuevo registro de pago' : 'Editar pago'}</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="field">
                    <label>Descripción</label>
                    <input id="p-desc" value="${attr(p.descripcion)}" placeholder="Ej. Informe hidrológico — Poroma">
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Cliente / proyecto</label>
                        <input id="p-cliente" list="dl-clientes-pago" value="${attr(p.cliente)}">
                        <datalist id="dl-clientes-pago">${S.clientes.map(cl => `<option value="${attr(cl.nombre)}">`).join('')}</datalist>
                    </div>
                    <div class="field">
                        <label>Cotización relacionada</label>
                        <select id="p-cotizacion">
                            <option value="">Sin relación</option>
                            ${cotizacionesDisponibles.map(c => `
                                <option value="${c.id}" ${p.cotizacionId === c.id ? 'selected' : ''}>${esc(c.titulo)} - ${bs(cotTotal(c))}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Fecha de registro</label>
                        <input type="date" id="p-fecha" value="${attr(p.fecha)}">
                    </div>
                    <div class="field">
                        <label>Fecha comprometida</label>
                        <input type="date" id="p-comp" value="${attr(p.fechaCompromiso)}">
                    </div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Monto total [Bs]</label>
                        <input type="number" step="0.01" id="p-monto" value="${p.monto}">
                    </div>
                    <div class="field">
                        <label>Monto pagado [Bs]</label>
                        <input type="number" step="0.01" id="p-pagado" value="${p.montoPagado||0}">
                    </div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Método de pago</label>
                        <select id="p-metodo">
                            <option value="">Seleccionar...</option>
                            <option value="efectivo" ${p.metodoPago === 'efectivo' ? 'selected' : ''}>💵 Efectivo</option>
                            <option value="transferencia" ${p.metodoPago === 'transferencia' ? 'selected' : ''}>🏦 Transferencia bancaria</option>
                            <option value="deposito" ${p.metodoPago === 'deposito' ? 'selected' : ''}>🏛️ Depósito</option>
                            <option value="cheque" ${p.metodoPago === 'cheque' ? 'selected' : ''}>📄 Cheque</option>
                            <option value="otro" ${p.metodoPago === 'otro' ? 'selected' : ''}>📌 Otro</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Número de comprobante</label>
                        <input id="p-comprobante" value="${attr(p.comprobante)}" placeholder="Ej. TRANS-001, Factura #123...">
                    </div>
                </div>
                <div class="field">
                    <label>Notas</label>
                    <textarea id="p-notas" rows="2">${esc(p.notas||'')}</textarea>
                </div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-primary" id="m-save">${isNew ? 'Guardar' : 'Actualizar'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#m-save').onclick = async () => {
        const nuevo = {
            id: p.id,
            descripcion: document.getElementById('p-desc').value.trim(),
            cliente: document.getElementById('p-cliente').value.trim(),
            cotizacionId: document.getElementById('p-cotizacion').value || '',
            monto: Number(document.getElementById('p-monto').value) || 0,
            montoPagado: Number(document.getElementById('p-pagado').value) || 0,
            fecha: document.getElementById('p-fecha').value,
            fechaCompromiso: document.getElementById('p-comp').value,
            notas: document.getElementById('p-notas').value.trim(),
            metodoPago: document.getElementById('p-metodo').value,
            comprobante: document.getElementById('p-comprobante').value.trim()
        };

        if (!nuevo.descripcion) { toast('Agrega una descripción.'); return; }
        if (!nuevo.cliente) { toast('Agrega un cliente o proyecto.'); return; }

        if (isNew) S.pagos.push(nuevo);
        else S.pagos = S.pagos.map(x => x.id === nuevo.id ? nuevo : x);

        await savePagos(S.user?.uid);
        closeModal();
        render();
        toast(isNew ? '✅ Pago registrado.' : '✅ Pago actualizado.');
    };
}

// ============================================================
// REGISTRAR PAGO PARCIAL
// ============================================================

// ---- REGISTRAR PAGO PARCIAL (MEJORADO) ----
// ---- REGISTRAR PAGO PARCIAL (MEJORADO) ----
// ---- REGISTRAR PAGO PARCIAL (MEJORADO - CON ASOCIACIÓN CORRECTA) ----
// ---- REGISTRAR PAGO PARCIAL (CORREGIDO - CREA REGISTROS SEPARADOS) ----

// ---- REGISTRAR PAGO PARCIAL (CORREGIDO - MONTO ADICIONAL) ----
function openRegisterPagoModal(pago) {
    // Verificar que el pago existe
    if (!pago) {
        toast('⚠️ No se encontró el pago.');
        return;
    }

    const saldoActual = Number(pago.monto) - Number(pago.montoPagado || 0);
    if (saldoActual <= 0) {
        toast('✅ Esta deuda ya está completamente pagada.');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:580px;">
            <div class="modal-h">
                <h3>💰 Registrar pago parcial</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="field">
                    <label>Descripción</label>
                    <input id="rp-desc" value="${attr(pago.descripcion)}" disabled style="background:#f5f5f5;">
                </div>
                <div class="field">
                    <label>Cliente</label>
                    <input id="rp-cliente" value="${attr(pago.cliente)}" disabled style="background:#f5f5f5;">
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Monto total [Bs]</label>
                        <input id="rp-monto" type="number" value="${pago.monto}" disabled style="background:#f5f5f5;">
                    </div>
                    <div class="field">
                        <label>Saldo pendiente [Bs]</label>
                        <input id="rp-saldo-actual" type="number" value="${saldoActual}" disabled style="background:#f5f5f5;font-weight:bold;color:var(--danger);">
                    </div>
                </div>
                <div class="field">
                    <label>Monto a pagar AHORA [Bs]</label>
                    <input id="rp-pagado-nuevo" type="number" step="0.01" placeholder="Ingresa el monto que se va a pagar ahora" value="">
                    <div style="font-size:12px;color:var(--text-soft);margin-top:4px;">
                        <strong>Importante:</strong> Este es el monto <u>adicional</u> que estás pagando ahora, no el total acumulado.
                        <br>Saldo restante después del pago: <strong id="rp-saldo-restante">${bs(saldoActual)}</strong>
                    </div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Fecha del pago</label>
                        <input type="date" id="rp-fecha-pago" value="${new Date().toISOString().slice(0, 10)}">
                    </div>
                    <div class="field">
                        <label>Método de pago</label>
                        <select id="rp-metodo">
                            <option value="">Seleccionar...</option>
                            <option value="efectivo">💵 Efectivo</option>
                            <option value="transferencia">🏦 Transferencia bancaria</option>
                            <option value="deposito">🏛️ Depósito</option>
                            <option value="cheque">📄 Cheque</option>
                            <option value="otro">📌 Otro</option>
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label>Número de comprobante</label>
                    <input id="rp-comprobante" placeholder="Ej. TRANS-001, Factura #123...">
                </div>
                <div class="field">
                    <label>Notas adicionales</label>
                    <textarea id="rp-notas" rows="2" placeholder="Detalles del pago..."></textarea>
                </div>
                ${pago.notas ? `
                    <div style="font-size:12px;color:var(--text-soft);padding:6px 10px;background:var(--gantt-bg);border-radius:4px;margin-top:8px;max-height:80px;overflow-y:auto;white-space:pre-wrap;">
                        <strong>Notas existentes:</strong> ${esc(pago.notas)}
                    </div>
                ` : ''}
                <div style="font-size:11px;color:var(--text-soft);margin-top:8px;padding:6px 10px;background:var(--gantt-bg);border-radius:4px;">
                    <strong>ℹ️ Resumen:</strong><br>
                    Monto total: ${bs(pago.monto)}<br>
                    Ya pagado: ${bs(pago.montoPagado||0)}<br>
                    <span style="color:var(--danger);">Saldo pendiente: ${bs(saldoActual)}</span>
                </div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-success" id="m-save">💰 Registrar pago</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const inputNuevo = overlay.querySelector('#rp-pagado-nuevo');
    const saldoRestanteSpan = overlay.querySelector('#rp-saldo-restante');
    
    // Actualizar saldo restante en tiempo real
    inputNuevo.addEventListener('input', () => {
        const montoAPagar = Number(inputNuevo.value) || 0;
        const saldoRestante = Math.max(0, saldoActual - montoAPagar);
        saldoRestanteSpan.textContent = bs(saldoRestante);
    });

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#m-save').onclick = async () => {
        const montoAPagar = Number(inputNuevo.value) || 0;
        const metodo = overlay.querySelector('#rp-metodo').value;
        const comprobante = overlay.querySelector('#rp-comprobante').value.trim();
        const fechaPago = overlay.querySelector('#rp-fecha-pago').value;
        const notasAdicionales = overlay.querySelector('#rp-notas').value.trim();

        if (montoAPagar <= 0) {
            toast('⚠️ Ingresa un monto válido.');
            return;
        }

        if (montoAPagar > saldoActual) {
            toast(`⚠️ El monto no puede ser mayor al saldo pendiente (${bs(saldoActual)}).`);
            return;
        }

        // ============================================================
        // CREAR NUEVO REGISTRO DE PAGO CON EL MONTO ADICIONAL
        // ============================================================
        const nuevoPago = {
            id: uid(),
            cotizacionId: pago.cotizacionId || '',
            cliente: pago.cliente,
            descripcion: `Pago parcial - ${pago.descripcion || 'Deuda'}`,
            monto: pago.monto, // Monto total de referencia
            montoPagado: montoAPagar, // <-- SOLO EL MONTO ADICIONAL
            fecha: fechaPago || new Date().toISOString().slice(0, 10),
            fechaCompromiso: fechaPago || new Date().toISOString().slice(0, 10),
            notas: notasAdicionales || '',
            metodoPago: metodo || '',
            comprobante: comprobante || ''
        };

        console.log('✅ Nuevo pago registrado (monto adicional):', nuevoPago);

        // 1. AGREGAR EL NUEVO PAGO AL ARRAY
        S.pagos.push(nuevoPago);
        
        // 2. ACTUALIZAR EL MONTO PAGADO DEL PAGO PRINCIPAL (ACUMULAR)
        const pagoPrincipalIndex = S.pagos.findIndex(p => p.id === pago.id);
        if (pagoPrincipalIndex !== -1) {
            const pagoPrincipal = S.pagos[pagoPrincipalIndex];
            const nuevoTotalPagado = (Number(pagoPrincipal.montoPagado || 0) + montoAPagar);
            pagoPrincipal.montoPagado = nuevoTotalPagado;
            
            // Agregar nota sobre el pago
            const notaPago = `💰 Pago adicional de ${bs(montoAPagar)} registrado el ${fmtDate(nuevoPago.fecha)}${metodo ? ` (${metodoPagoLabel(metodo)})` : ''}${comprobante ? ` #${comprobante}` : ''}`;
            pagoPrincipal.notas = pagoPrincipal.notas ? pagoPrincipal.notas + '\n' + notaPago : notaPago;
            
            S.pagos[pagoPrincipalIndex] = pagoPrincipal;
            console.log('✅ Pago principal actualizado (nuevo total):', pagoPrincipal);
        }

        // 3. GUARDAR EN FIREBASE
        await savePagos(S.user?.uid);
        
        closeModal();
        S.expandedPagoId = pago.id;
        render();
        toast(`✅ Pago de ${bs(montoAPagar)} registrado exitosamente. Saldo restante: ${bs(saldoActual - montoAPagar)}`);
    };
}
// ============================================================
// REGISTRAR PAGO DESDE COTIZACIÓN
// ============================================================

function openPagoFromCotizacion(cotizacionId) {
    const cot = S.cotizaciones.find(c => c.id === cotizacionId);
    if (!cot) { toast('Cotización no encontrada'); return; }

    const montoTotal = cotTotal(cot);
    const pagosExistentes = S.pagos.filter(p => p.cotizacionId === cotizacionId);
    const totalPagado = pagosExistentes.reduce((s, p) => s + Number(p.montoPagado || 0), 0);
    const saldoPendiente = montoTotal - totalPagado;

    if (saldoPendiente <= 0.01) {
        toast('✅ Esta cotización ya está completamente pagada.');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:640px;">
            <div class="modal-h">
                <h3>💰 Registrar pago - ${esc(cot.titulo)}</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="row2">
                    <div class="field">
                        <label>Cliente</label>
                        <input value="${esc(cot.cliente)}" disabled style="background:#f5f5f5;">
                    </div>
                    <div class="field">
                        <label>Monto total</label>
                        <input value="${bs(montoTotal)}" disabled style="background:#f5f5f5;">
                    </div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Monto ya pagado</label>
                        <input value="${bs(totalPagado)}" disabled style="background:#f5f5f5;">
                    </div>
                    <div class="field">
                        <label>Saldo pendiente</label>
                        <input value="${bs(saldoPendiente)}" disabled style="background:#f5f5f5;font-weight:bold;color:var(--primary);">
                    </div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Monto a pagar [Bs]</label>
                        <input type="number" step="0.01" id="cp-monto" value="${Math.min(saldoPendiente, 1000)}" max="${saldoPendiente}">
                    </div>
                    <div class="field">
                        <label>Fecha del pago</label>
                        <input type="date" id="cp-fecha" value="${new Date().toISOString().slice(0, 10)}">
                    </div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Método de pago</label>
                        <select id="cp-metodo">
                            <option value="">Seleccionar...</option>
                            <option value="efectivo">💵 Efectivo</option>
                            <option value="transferencia">🏦 Transferencia bancaria</option>
                            <option value="deposito">🏛️ Depósito</option>
                            <option value="cheque">📄 Cheque</option>
                            <option value="otro">📌 Otro</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Número de comprobante</label>
                        <input id="cp-comprobante" placeholder="Ej. TRANS-001, Factura #123...">
                    </div>
                </div>
                <div class="field">
                    <label>Descripción / concepto</label>
                    <input id="cp-desc" placeholder="Ej. Primer pago, anticipo, etc." value="Pago parcial - ${cot.titulo}">
                </div>
                <div class="field">
                    <label>Notas adicionales</label>
                    <textarea id="cp-notas" rows="2"></textarea>
                </div>
                ${pagosExistentes.length ? `
                    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
                        <label style="font-family:'JetBrains Mono';font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-soft);">Historial de pagos</label>
                        <div class="payment-history">
                            ${pagosExistentes.map(p => `
                                <div class="entry">
                                    <span>
                                        ${fmtDate(p.fecha)} - ${esc(p.descripcion)}
                                        ${p.metodoPago ? `<span class="metodo-pago-badge ${p.metodoPago}">${metodoPagoLabel(p.metodoPago)}</span>` : ''}
                                        ${p.comprobante ? `<span class="comprobante-num">#${esc(p.comprobante)}</span>` : ''}
                                    </span>
                                    <span style="font-weight:500;">${bs(p.montoPagado)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-success" id="m-save">💰 Registrar pago</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#m-save').onclick = async () => {
        const montoPagar = Number(overlay.querySelector('#cp-monto').value) || 0;
        const metodo = overlay.querySelector('#cp-metodo').value;
        const comprobante = overlay.querySelector('#cp-comprobante').value.trim();

        if (montoPagar <= 0) {
            toast('⚠️ Ingresa un monto válido.');
            return;
        }
        if (montoPagar > saldoPendiente) {
            toast(`⚠️ El monto no puede ser mayor al saldo pendiente (${bs(saldoPendiente)}).`);
            return;
        }

        const nuevoPago = {
            id: uid(),
            cotizacionId: cotizacionId,
            cliente: cot.cliente,
            descripcion: overlay.querySelector('#cp-desc').value.trim() || 'Pago parcial',
            monto: montoTotal,
            montoPagado: montoPagar,
            fecha: overlay.querySelector('#cp-fecha').value,
            fechaCompromiso: overlay.querySelector('#cp-fecha').value,
            notas: overlay.querySelector('#cp-notas').value.trim(),
            metodoPago: metodo,
            comprobante: comprobante
        };

        S.pagos.push(nuevoPago);
        await savePagos(S.user?.uid);

        const totalPagadoActualizado = S.pagos.filter(p => p.cotizacionId === cotizacionId).reduce((s, p) => s + Number(p.montoPagado || 0), 0);
        if (totalPagadoActualizado >= montoTotal - 0.01) {
            toast('🎉 ¡Cotización completamente pagada!');
        } else {
            toast('✅ Pago registrado exitosamente.');
        }

        closeModal();
        render();
    };
}

// ============================================================
// MODAL - EXPERIENCIA
// ============================================================

function openExpModal(exp) {
    const isNew = !exp;
    const e = exp ? { ...exp } : {
        id: uid(),
        entidad: '',
        objeto: '',
        monto: 0,
        cargo: '',
        desde: '',
        hasta: '',
        enCurso: false,
        certificado: false
    };

    const entidadesExistentes = [...new Set(S.experiencia.map(p => p.entidad).filter(Boolean))].sort();

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:640px;">
            <div class="modal-h">
                <h3>${isNew ? 'Agregar proyecto' : 'Editar proyecto'}</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="field">
                    <label>Entidad / Empresa</label>
                    <input id="e-entidad" list="entidades-list" value="${attr(e.entidad)}" placeholder="Nombre de la entidad o empresa">
                    <datalist id="entidades-list">
                        ${entidadesExistentes.map(en => `<option value="${en}">`).join('')}
                    </datalist>
                </div>
                <div class="field"><label>Objeto / Proyecto</label><input id="e-objeto" value="${attr(e.objeto)}" placeholder="Descripción del proyecto"></div>
                <div class="row2">
                    <div class="field"><label>Monto [Bs]</label><input type="number" step="0.01" id="e-monto" value="${e.monto}"></div>
                    <div class="field"><label>Cargo</label><input id="e-cargo" value="${attr(e.cargo)}" placeholder="Ej. Especialista Hidráulico"></div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Desde</label>
                        <input type="date" id="e-desde" value="${attr(e.desde)}">
                    </div>
                    <div class="field ${e.enCurso ? 'field-disabled' : ''}">
                        <label>Hasta</label>
                        <input type="date" id="e-hasta" value="${attr(e.hasta)}" ${e.enCurso ? 'disabled' : ''}>
                    </div>
                </div>
                <div class="field">
                    <div class="checkbox-group">
                        <input type="checkbox" id="e-en-curso" ${e.enCurso ? 'checked' : ''}>
                        <label for="e-en-curso">📌 Proyecto en curso (sin fecha de finalización definida)</label>
                    </div>
                </div>
                <div class="field">
                    <div class="checkbox-group">
                        <input type="checkbox" id="e-certificado" ${e.certificado ? 'checked' : ''}>
                        <label for="e-certificado">✅ Proyecto con certificado de finalización</label>
                    </div>
                    <div style="font-size:11px;color:var(--text-soft);margin-top:4px;">
                        ⚠️ Desmarca si aún no tienes el certificado de finalización del proyecto.
                    </div>
                </div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-primary" id="m-save">${isNew ? 'Agregar' : 'Actualizar'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const enCursoCheck = overlay.querySelector('#e-en-curso');
    const hastaInput = overlay.querySelector('#e-hasta');
    const hastaField = hastaInput.closest('.field');
    enCursoCheck.addEventListener('change', () => {
        if (enCursoCheck.checked) {
            hastaInput.disabled = true;
            hastaField.classList.add('field-disabled');
            hastaInput.value = '';
        } else {
            hastaInput.disabled = false;
            hastaField.classList.remove('field-disabled');
        }
    });

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#m-save').onclick = async () => {
        const enCurso = enCursoCheck.checked;
        const nuevo = {
            id: e.id,
            entidad: document.getElementById('e-entidad').value.trim(),
            objeto: document.getElementById('e-objeto').value.trim(),
            monto: Number(document.getElementById('e-monto').value) || 0,
            cargo: document.getElementById('e-cargo').value.trim(),
            desde: document.getElementById('e-desde').value,
            hasta: enCurso ? '' : document.getElementById('e-hasta').value,
            enCurso: enCurso,
            certificado: document.getElementById('e-certificado').checked
        };
        if (!nuevo.entidad || !nuevo.objeto) { toast('Completa entidad y objeto del proyecto.'); return; }
        if (isNew) S.experiencia.push(nuevo);
        else S.experiencia = S.experiencia.map(x => x.id === nuevo.id ? nuevo : x);
        await saveExperiencia(S.user?.uid);
        closeModal();
        render();
        toast(isNew ? '✅ Proyecto agregado.' : '✅ Proyecto actualizado.');
    };
}

// ============================================================
// MODAL - LICITACIONES
// ============================================================

function openLicModal(lic) {
    const isNew = !lic;
    const l = lic ? { ...lic } : {
        id: uid(),
        convocatoria: '',
        proyecto: '',
        entidad: '',
        fecha: new Date().toISOString().slice(0, 10),
        estado: 'presentada',
        contactoId: '',
        monto: '',
        observaciones: ''
    };

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:640px;">
            <div class="modal-h">
                <h3>${isNew ? 'Nueva licitación' : 'Editar licitación'}</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="field"><label>N° Convocatoria</label><input id="lic-convocatoria" value="${attr(l.convocatoria)}" placeholder="Ej. LIC-2024-001"></div>
                <div class="field"><label>Proyecto</label><input id="lic-proyecto" value="${attr(l.proyecto)}" placeholder="Nombre del proyecto"></div>
                <div class="field"><label>Entidad convocante</label><input id="lic-entidad" value="${attr(l.entidad)}" placeholder="Nombre de la entidad"></div>
                <div class="row2">
                    <div class="field"><label>Fecha de presentación</label><input type="date" id="lic-fecha" value="${attr(l.fecha)}"></div>
                    <div class="field"><label>Monto [Bs]</label><input type="number" step="0.01" id="lic-monto" value="${l.monto || ''}" placeholder="0.00"></div>
                </div>
                <div class="field">
                    <label>Estado</label>
                    <select id="lic-estado">
                        ${['presentada','evaluacion','adjudicada','no-adjudicada','en-curso'].map(e =>
                            `<option value="${e}" ${l.estado === e ? 'selected' : ''}>${e}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="field">
                    <label>Contacto asociado</label>
                    <select id="lic-contacto">
                        <option value="">Seleccionar contacto...</option>
                        ${S.contactos.map(c =>
                            `<option value="${c.id}" ${l.contactoId === c.id ? 'selected' : ''}>${esc(c.nombre)} - ${esc(c.empresa)}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="field"><label>Observaciones</label><textarea id="lic-observaciones" rows="3">${esc(l.observaciones||'')}</textarea></div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-primary" id="m-save">${isNew ? 'Guardar' : 'Actualizar'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#m-save').onclick = async () => {
        const nuevo = {
            id: l.id,
            convocatoria: document.getElementById('lic-convocatoria').value.trim(),
            proyecto: document.getElementById('lic-proyecto').value.trim(),
            entidad: document.getElementById('lic-entidad').value.trim(),
            fecha: document.getElementById('lic-fecha').value,
            estado: document.getElementById('lic-estado').value,
            contactoId: document.getElementById('lic-contacto').value,
            monto: Number(document.getElementById('lic-monto').value) || 0,
            observaciones: document.getElementById('lic-observaciones').value.trim()
        };
        if (!nuevo.proyecto) { toast('Ingresa el nombre del proyecto.'); return; }
        if (isNew) S.licitaciones.push(nuevo);
        else S.licitaciones = S.licitaciones.map(x => x.id === nuevo.id ? nuevo : x);
        await saveLicitaciones(S.user?.uid);
        closeModal();
        render();
        toast(isNew ? '✅ Licitación registrada.' : '✅ Licitación actualizada.');
    };
}

// ============================================================
// MODAL - CONTACTOS
// ============================================================

function openContModal(cont) {
    const isNew = !cont;
    const c = cont ? { ...cont } : {
        id: uid(),
        nombre: '',
        empresa: '',
        cargo: '',
        telefono: '',
        email: '',
        notas: ''
    };

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:600px;">
            <div class="modal-h">
                <h3>${isNew ? 'Nuevo contacto' : 'Editar contacto'}</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="field"><label>Nombre completo</label><input id="cont-nombre" value="${attr(c.nombre)}" placeholder="Nombre y apellido"></div>
                <div class="row2">
                    <div class="field"><label>Empresa / Institución</label><input id="cont-empresa" value="${attr(c.empresa)}" placeholder="Empresa"></div>
                    <div class="field"><label>Cargo</label><input id="cont-cargo" value="${attr(c.cargo)}" placeholder="Cargo"></div>
                </div>
                <div class="row2">
                    <div class="field"><label>Teléfono</label><input id="cont-telefono" value="${attr(c.telefono)}" placeholder="Número de teléfono"></div>
                    <div class="field"><label>Correo electrónico</label><input id="cont-email" value="${attr(c.email)}" placeholder="correo@ejemplo.com"></div>
                </div>
                <div class="field"><label>Notas adicionales</label><textarea id="cont-notas" rows="3">${esc(c.notas||'')}</textarea></div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-primary" id="m-save">${isNew ? 'Guardar' : 'Actualizar'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#m-save').onclick = async () => {
        const nuevo = {
            id: c.id,
            nombre: document.getElementById('cont-nombre').value.trim(),
            empresa: document.getElementById('cont-empresa').value.trim(),
            cargo: document.getElementById('cont-cargo').value.trim(),
            telefono: document.getElementById('cont-telefono').value.trim(),
            email: document.getElementById('cont-email').value.trim(),
            notas: document.getElementById('cont-notas').value.trim()
        };
        if (!nuevo.nombre) { toast('Ingresa el nombre del contacto.'); return; }
        if (isNew) S.contactos.push(nuevo);
        else S.contactos = S.contactos.map(x => x.id === nuevo.id ? nuevo : x);
        await saveContactos(S.user?.uid);
        closeModal();
        render();
        toast(isNew ? '✅ Contacto registrado.' : '✅ Contacto actualizado.');
    };
}

// ============================================================
// MODAL - IMPORTAR EXPERIENCIA (Excel)
// ============================================================

function openImportModal() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:700px;">
            <div class="modal-h">
                <h3>📥 Importar experiencia desde Excel</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="field">
                    <label>Formato esperado</label>
                    <div style="background:var(--gantt-bg);padding:12px;border-radius:var(--radius);font-size:12px;font-family:monospace;">
                        <strong>Columnas requeridas:</strong><br>
                        Entidad | Objeto | Monto | Cargo | Desde | Hasta<br>
                        <span style="color:var(--text-soft);">(Fechas: DD/MM/YYYY, DD-MM-YYYY, o YYYY-MM-DD)</span>
                    </div>
                </div>
                <div class="file-upload-area" id="file-drop-area">
                    <div class="icon">📂</div>
                    <div class="text">Arrastra un archivo Excel (.xlsx, .xls) o haz clic para seleccionar</div>
                    <div class="sub">Soporta archivos .xlsx y .xls</div>
                    <input type="file" id="file-input" accept=".xlsx,.xls">
                </div>
                <div id="import-preview" style="display:none;margin-top:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span id="import-count" style="font-weight:600;"></span>
                        <span style="font-size:12px;color:var(--text-soft);" id="import-status"></span>
                    </div>
                    <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);" id="import-table-container"></div>
                </div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-success" id="btn-import-confirm" disabled>✅ Importar datos</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    let importedData = [];

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    const dropArea = overlay.querySelector('#file-drop-area');
    const fileInput = overlay.querySelector('#file-input');

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.style.borderColor = 'var(--primary)';
        dropArea.style.background = 'var(--surface-hover)';
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.style.borderColor = 'var(--border)';
        dropArea.style.background = 'transparent';
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.borderColor = 'var(--border)';
        dropArea.style.background = 'transparent';
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFile(e.dataTransfer.files[0]);
        }
    });

    dropArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function parseDate(value) {
        if (!value) return null;
        if (typeof value === 'number' && value > 10000) {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + value * 86400000);
            if (!isNaN(date)) return date.toISOString().slice(0, 10);
        }
        const str = String(value).trim();
        const formats = [
            { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: ['d', 'm', 'y'] },
            { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: ['d', 'm', 'y'] },
            { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: ['y', 'm', 'd'] },
            { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, order: ['d', 'm', 'y'] }
        ];
        let d = new Date(str);
        if (!isNaN(d) && str.includes('-')) {
            return d.toISOString().slice(0, 10);
        }
        for (const fmt of formats) {
            const match = str.match(fmt.regex);
            if (match) {
                let year, month, day;
                const parts = { y: parseInt(match[1]), m: parseInt(match[2]), d: parseInt(match[3]) };
                if (parts.y < 100) parts.y += 2000;
                if (parts.m > 12 && parts.d <= 12) {
                    [parts.m, parts.d] = [parts.d, parts.m];
                }
                year = parts.y;
                month = parts.m;
                day = parts.d;
                if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    const dateObj = new Date(year, month - 1, day);
                    if (!isNaN(dateObj)) {
                        return dateObj.toISOString().slice(0, 10);
                    }
                }
            }
        }
        d = new Date(str);
        if (!isNaN(d)) {
            return d.toISOString().slice(0, 10);
        }
        return null;
    }

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (!jsonData || jsonData.length === 0) {
                    toast('❌ El archivo no contiene datos.');
                    return;
                }

                const headers = Object.keys(jsonData[0]);
                const mapCol = (posible) => {
                    for (const h of headers) {
                        if (h.toLowerCase().includes(posible.toLowerCase())) return h;
                    }
                    return null;
                };

                const colEntidad = mapCol('entidad') || mapCol('empresa') || headers[0];
                const colObjeto = mapCol('objeto') || mapCol('proyecto') || headers[1];
                const colMonto = mapCol('monto') || headers[2];
                const colCargo = mapCol('cargo') || headers[3];
                const colDesde = mapCol('desde') || headers[4];
                const colHasta = mapCol('hasta') || headers[5];

                if (!colEntidad || !colObjeto) {
                    toast('❌ No se encontraron las columnas "Entidad" y "Objeto". Verifica el formato.');
                    return;
                }

                importedData = jsonData.map(row => {
                    const entidad = String(row[colEntidad] || '').trim();
                    const objeto = String(row[colObjeto] || '').trim();
                    let monto = 0;
                    if (colMonto) {
                        const val = String(row[colMonto] || '0').replace(/[^0-9.,-]/g, '').replace(/,/g, '');
                        monto = parseFloat(val) || 0;
                    }
                    const cargo = colCargo ? String(row[colCargo] || '').trim() : '';
                    let desde = colDesde ? parseDate(row[colDesde]) : null;
                    let hasta = colHasta ? parseDate(row[colHasta]) : null;
                    if (!desde) desde = new Date().toISOString().slice(0, 10);
                    if (!hasta) hasta = new Date().toISOString().slice(0, 10);
                    return { entidad, objeto, monto, cargo, desde, hasta };
                }).filter(row => row.entidad || row.objeto);

                mostrarPreview(importedData);
                overlay.querySelector('#btn-import-confirm').disabled = importedData.length === 0;
            } catch (err) {
                toast('❌ Error al leer el archivo: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function mostrarPreview(data) {
        const container = overlay.querySelector('#import-preview');
        const tableContainer = overlay.querySelector('#import-table-container');
        const countSpan = overlay.querySelector('#import-count');
        const statusSpan = overlay.querySelector('#import-status');

        container.style.display = 'block';
        countSpan.textContent = `📊 ${data.length} registros encontrados`;

        if (data.length === 0) {
            tableContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-soft);">No se encontraron datos válidos.</div>';
            statusSpan.textContent = '⚠️ Sin datos válidos';
            return;
        }

        let html = '<table style="width:100%;font-size:12px;border-collapse:collapse;">';
        html += '<thead><tr style="background:var(--primary);color:#fff;">';
        html += '<th style="padding:6px 8px;text-align:left;">Entidad</th>';
        html += '<th style="padding:6px 8px;text-align:left;">Objeto</th>';
        html += '<th style="padding:6px 8px;text-align:right;">Monto</th>';
        html += '<th style="padding:6px 8px;text-align:left;">Cargo</th>';
        html += '<th style="padding:6px 8px;text-align:left;">Desde</th>';
        html += '<th style="padding:6px 8px;text-align:left;">Hasta</th>';
        html += '</tr></thead><tbody>';

        data.slice(0, 50).forEach(row => {
            html += `<tr style="border-bottom:1px solid var(--border);">`;
            html += `<td style="padding:4px 8px;">${esc(row.entidad || '—')}</td>`;
            html += `<td style="padding:4px 8px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(row.objeto || '—')}</td>`;
            html += `<td style="padding:4px 8px;text-align:right;">${row.monto ? bs(row.monto) : '—'}</td>`;
            html += `<td style="padding:4px 8px;">${esc(row.cargo || '—')}</td>`;
            html += `<td style="padding:4px 8px;">${row.desde ? fmtDate(row.desde) : '—'}</td>`;
            html += `<td style="padding:4px 8px;">${row.hasta ? fmtDate(row.hasta) : '—'}</td>`;
            html += '</tr>';
        });

        if (data.length > 50) {
            html += `<tr><td colspan="6" style="padding:8px;text-align:center;color:var(--text-soft);">...y ${data.length - 50} registros más</td></tr>`;
        }

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
        statusSpan.textContent = `✅ ${data.length} registros listos para importar`;
    }

    overlay.querySelector('#btn-import-confirm').onclick = async () => {
        if (importedData.length === 0) {
            toast('No hay datos para importar.');
            return;
        }

        const nuevos = importedData.map(row => ({
            id: uid(),
            entidad: row.entidad || 'Sin entidad',
            objeto: row.objeto || 'Sin descripción',
            monto: row.monto || 0,
            cargo: row.cargo || 'Sin cargo',
            desde: row.desde || new Date().toISOString().slice(0, 10),
            hasta: row.hasta || new Date().toISOString().slice(0, 10),
            enCurso: false,
            certificado: false
        }));

        S.experiencia = [...S.experiencia, ...nuevos];
        await saveExperiencia(S.user?.uid);

        closeModal();
        render();
        toast(`✅ ${nuevos.length} proyectos importados exitosamente. Total: ${S.experiencia.length} proyectos.`);
    };
}

// ============================================================
// FUNCIÓN PARA EXPORTAR DEUDAS (PDF)
// ============================================================

function exportDebts(selectedIds) {
    if (!selectedIds || selectedIds.length === 0) {
        toast('⚠️ No hay deudas seleccionadas.');
        return;
    }

    const selectedPagos = S.pagos.filter(p => selectedIds.includes(p.id));
    if (selectedPagos.length === 0) {
        toast('⚠️ No se encontraron los pagos seleccionados.');
        return;
    }

    const debtsWithBalance = selectedPagos.filter(p => {
        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
        return saldo > 0.01;
    });

    if (debtsWithBalance.length === 0) {
        toast('⚠️ Los registros seleccionados no tienen saldo pendiente.');
        return;
    }

    if (!window.jspdf) {
        toast('La librería de PDF aún está cargando.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const primary = [26, 74, 92];
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...primary);
    doc.text('REPORTE DE DEUDAS PENDIENTES', pageW / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(60, 66, 71);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ing. Antequera — ${S.config.nombre || 'Consultoría Hidráulica'}`, pageW / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW / 2, y, { align: 'center' });
    y += 10;

    doc.setDrawColor(...primary);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    const totalDeuda = debtsWithBalance.reduce((s, p) => s + (Number(p.monto) - Number(p.montoPagado || 0)), 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primary);
    doc.text(`Total de deuda seleccionada: ${bs(totalDeuda)}`, 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 66, 71);
    doc.text(`Número de registros: ${debtsWithBalance.length}`, 15, y);
    y += 10;

    const tableData = debtsWithBalance.map(p => {
        const saldo = Number(p.monto) - Number(p.montoPagado || 0);
        const cot = S.cotizaciones.find(c => c.id === p.cotizacionId);
        const proyecto = cot ? cot.proyecto || '—' : '—';
        return [
            fmtDate(p.fecha),
            p.descripcion || '—',
            p.cliente || '—',
            proyecto,
            bs(p.monto),
            bs(p.montoPagado || 0),
            bs(saldo),
            p.metodoPago ? metodoPagoLabel(p.metodoPago) : '—',
            p.comprobante || '—'
        ];
    });

    doc.autoTable({
        startY: y,
        head: [['Fecha', 'Descripción', 'Cliente', 'Proyecto', 'Monto', 'Pagado', 'Saldo', 'Método', 'Comprobante']],
        body: tableData,
        styles: { fontSize: 7.5, cellPadding: 2, valign: 'middle', textColor: [30, 36, 41] },
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 244, 238] },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 28 },
            2: { cellWidth: 22 },
            3: { cellWidth: 22 },
            4: { cellWidth: 18, halign: 'right' },
            5: { cellWidth: 18, halign: 'right' },
            6: { cellWidth: 18, halign: 'right' },
            7: { cellWidth: 18 },
            8: { cellWidth: 18 }
        },
        margin: { left: 12, right: 12 }
    });

    y = doc.lastAutoTable.finalY + 10;

    if (y > 250) { doc.addPage();
        y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(100, 105, 110);
    doc.setFont('helvetica', 'italic');
    doc.text('Este reporte incluye únicamente las deudas seleccionadas. Para mayor detalle, contactar al Ing. Antequera.', 15, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(S.config.rni || 'RNI: 28.106', 15, y);

    const fileName = `Reporte_Deudas_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
    toast(`📄 Reporte de deudas exportado (${debtsWithBalance.length} registros).`);
}
