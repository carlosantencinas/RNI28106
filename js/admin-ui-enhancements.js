// ============================================================
// MEJORAS UI - ADMINISTRATIVO / DOCUMENTOS
// Este módulo NO envuelve render(). Solo expone post-procesado.
// ============================================================
(function (global) {
    'use strict';

    function getDocumentPanelFromAdministrative() {
        if (typeof global.viewAdministrativo !== 'function') return null;
        const holder = document.createElement('div');
        holder.innerHTML = global.viewAdministrativo();
        return Array.from(holder.querySelectorAll('.panel')).find(panel => {
            const title = panel.querySelector('.panel-h h3');
            return title && title.textContent.includes('Documentos de la empresa');
        }) || null;
    }

    function viewDocumentosSeparado() {
        const panel = getDocumentPanelFromAdministrative();
        return `<div class="page-head"><div><p class="eyebrow">Archivo</p><h1>Documentos</h1><p>Documentación personal, profesional y de vehículos.</p></div><div class="page-actions"><button class="btn btn-primary" id="btn-new-doc">📄 + Nuevo documento</button></div></div>${panel ? panel.outerHTML : '<div class="panel"><div class="panel-body"><div class="empty">📄 No se pudo cargar el gestor documental.</div></div></div>'}`;
    }

    function getAssociatedPartialPayments(principal) {
        if (!principal) return [];
        const all = Array.isArray(S.pagos) ? S.pagos : [];
        let associated = all.filter(p => String(p?.id) !== String(principal.id) && String(p?.cotizacionId) === String(principal.cotizacionId) && Number(p?.montoPagado || 0) > 0);
        if (!associated.length && principal.cliente) {
            associated = all.filter(p => String(p?.id) !== String(principal.id) && p?.cliente === principal.cliente && Number(p?.montoPagado || 0) > 0 && String(p?.descripcion || '').includes('Pago parcial'));
        }
        return associated.sort((a,b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
    }

    function createPartialHistoryRow(principal, parentRow) {
        const existing = parentRow.nextElementSibling;
        if (existing?.dataset?.adminPagoDetalle === String(principal.id)) { existing.remove(); return; }
        const partials = getAssociatedPartialPayments(principal);
        const tr = document.createElement('tr');
        tr.dataset.adminPagoDetalle = String(principal.id);
        tr.innerHTML = `<td colspan="9" style="padding:0;background:var(--surface-hover);"><div style="padding:14px 18px;border-top:2px solid var(--primary);border-bottom:1px solid var(--border);"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;"><strong style="color:var(--primary);">💰 Historial de pagos parciales</strong><span style="font-size:12px;color:var(--text-soft);">${partials.length} registro${partials.length===1?'':'s'}</span></div>${partials.length ? `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Método</th><th class="tright">Monto</th><th>Comprobante</th><th>Acciones</th></tr></thead><tbody>${partials.map(p=>`<tr><td class="tnum" style="white-space:nowrap;">${global.fmtDate(p.fecha)}</td><td>${global.esc(p.descripcion||'Pago parcial')}</td><td>${p.metodoPago?`<span class="metodo-pago-badge ${p.metodoPago}">${global.metodoPagoLabel(p.metodoPago)}</span>`:'—'}</td><td class="tright tnum" style="font-weight:600;color:var(--success);">${global.bs(p.montoPagado||0)}</td><td>${global.esc(p.comprobante||'—')}</td><td><div class="rowactions"><button class="iconbtn admin-edit-partial" data-id="${p.id}" title="Editar pago parcial">${global.ICONS?.edit||'✏️'}</button><button class="iconbtn admin-delete-partial" data-id="${p.id}" title="Eliminar pago parcial">${global.ICONS?.trash||'🗑️'}</button></div></td></tr>`).join('')}</tbody></table></div>` : '<div style="font-size:13px;color:var(--text-soft);padding:8px 0;">No hay pagos parciales registrados.</div>'}</div></td>`;
        parentRow.parentNode.insertBefore(tr, parentRow.nextSibling);
        tr.querySelectorAll('.admin-edit-partial').forEach(btn => btn.onclick = () => global.editarPagoHistorial(btn.dataset.id));
        tr.querySelectorAll('.admin-delete-partial').forEach(btn => btn.onclick = () => global.eliminarPagoHistorial(btn.dataset.id));
    }

    function enhanceAdminPayments() {
        const main = document.getElementById('main');
        if (!main || S.view !== 'administrativo') return;
        main.querySelectorAll('[data-register-pago]').forEach(registerBtn => {
            const row = registerBtn.closest('tr'), id = registerBtn.dataset.registerPago;
            const pago = S.pagos.find(p => String(p.id) === String(id));
            if (!row || !pago || row.querySelector('.admin-toggle-partials')) return;
            const toggle = document.createElement('button');
            toggle.className = 'iconbtn admin-toggle-partials'; toggle.title = 'Ver/ocultar pagos parciales'; toggle.textContent = '▾';
            toggle.onclick = () => { createPartialHistoryRow(pago,row); toggle.textContent = row.nextElementSibling?.dataset?.adminPagoDetalle===String(pago.id)?'▴':'▾'; };
            const actions = row.querySelector('.rowactions'); if (actions) actions.insertBefore(toggle,actions.firstChild);
        });
    }


    function editQuoteAdvance(cotizacionId) {
        const quote = (S.cotizaciones || []).find(c => String(c.id) === String(cotizacionId));
        if (!quote) { toast('No se encontró la cotización del anticipo.'); return; }
        const principal = (S.pagos || []).find(p => String(p.cotizacionId) === String(cotizacionId) && Number(p.monto) > 0);
        if (!principal) { toast('No se encontró la deuda principal asociada.'); return; }
        const currentAdvance = Math.max(0, Number(quote.anticipo) || 0);
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
          <div class="modal" style="max-width:560px;">
            <div class="modal-h"><h3>✏️ Editar anticipo de cotización</h3><button class="close" id="ea-close">&times;</button></div>
            <div class="modal-body">
              <p style="font-size:13px;color:var(--text-soft);margin:0 0 12px;">${global.esc(quote.titulo || quote.proyecto || 'Cotización')}</p>
              <div class="field"><label>Monto del anticipo [Bs]</label><input id="ea-amount" type="number" min="0" max="${Number(principal.monto)||0}" step="0.01" value="${currentAdvance}"></div>
              <div class="row2">
                <div class="field"><label>Fecha del anticipo</label><input id="ea-date" type="date" value="${global.attr ? global.attr(quote.anticipoFecha || quote.fechaAceptacion || quote.fecha || '') : (quote.anticipoFecha || quote.fechaAceptacion || quote.fecha || '')}"></div>
                <div class="field"><label>Método de pago</label><select id="ea-method">
                  <option value="">No especificado</option>
                  <option value="efectivo" ${quote.anticipoMetodo === 'efectivo' ? 'selected' : ''}>Efectivo</option>
                  <option value="transferencia" ${quote.anticipoMetodo === 'transferencia' ? 'selected' : ''}>Transferencia</option>
                  <option value="deposito" ${quote.anticipoMetodo === 'deposito' ? 'selected' : ''}>Depósito</option>
                  <option value="cheque" ${quote.anticipoMetodo === 'cheque' ? 'selected' : ''}>Cheque</option>
                  <option value="otro" ${quote.anticipoMetodo === 'otro' ? 'selected' : ''}>Otro</option>
                </select></div>
              </div>
              <div class="field"><label>Número de comprobante</label><input id="ea-receipt" value="${global.esc(quote.anticipoComprobante || '')}"></div>
              <div class="field"><label>Notas del anticipo</label><textarea id="ea-notes" rows="2">${global.esc(quote.anticipoNotas || '')}</textarea></div>
              <p style="font-size:12px;color:var(--text-soft);">Al cambiar el monto se actualizará el acumulado cobrado de la deuda, sin crear un movimiento duplicado. El nuevo anticipo no puede superar el monto total ni reducir los pagos posteriores registrados.</p>
            </div>
            <div class="modal-foot"><button class="btn btn-ghost" id="ea-cancel">Cancelar</button><button class="btn btn-primary" id="ea-save">Guardar anticipo</button></div>
          </div>`;
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        overlay.querySelector('#ea-close').onclick = close;
        overlay.querySelector('#ea-cancel').onclick = close;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
        overlay.querySelector('#ea-save').onclick = async () => {
          const amount = Number(overlay.querySelector('#ea-amount').value);
          const total = Math.max(0, Number(principal.monto) || 0);
          if (!Number.isFinite(amount) || amount < 0 || amount > total) { toast('El anticipo debe estar entre Bs 0 y el monto total.'); return; }
          const movementTotal = (S.pagos || []).filter(p => String(p.id) !== String(principal.id) && (String(p.pagoPrincipalId || '') === String(principal.id) || (!p.pagoPrincipalId && String(p.cotizacionId || '') === String(cotizacionId)))).reduce((s,p)=>s+Math.max(0,Number(p.montoPagado)||0),0);
          if (amount + movementTotal > total + 0.01) { toast('El anticipo más los pagos posteriores supera el monto total.'); return; }
          const newPaid = Math.max(0, Number(principal.montoPagado)||0) + (amount - currentAdvance);
          if (newPaid < movementTotal + amount - 0.01) { toast('El acumulado pagado no alcanza para cubrir el anticipo y los movimientos existentes.'); return; }
          const old = { anticipo: quote.anticipo, anticipoFecha: quote.anticipoFecha, anticipoMetodo: quote.anticipoMetodo, anticipoComprobante: quote.anticipoComprobante, anticipoNotas: quote.anticipoNotas, montoPagado: principal.montoPagado };
          quote.anticipo = amount;
          quote.anticipoFecha = overlay.querySelector('#ea-date').value;
          quote.anticipoMetodo = overlay.querySelector('#ea-method').value;
          quote.anticipoComprobante = overlay.querySelector('#ea-receipt').value.trim();
          quote.anticipoNotas = overlay.querySelector('#ea-notes').value.trim();
          principal.montoPagado = Math.min(total, newPaid);
          try {
            await Promise.all([saveCotizaciones(S.user?.uid), savePagos(S.user?.uid)]);
            close(); render(); toast('Anticipo actualizado correctamente.');
          } catch (error) {
            Object.assign(quote, { anticipo: old.anticipo, anticipoFecha: old.anticipoFecha, anticipoMetodo: old.anticipoMetodo, anticipoComprobante: old.anticipoComprobante, anticipoNotas: old.anticipoNotas });
            principal.montoPagado = old.montoPagado;
            console.error('Error al actualizar anticipo:', error);
            toast('No se pudo guardar el anticipo. Revisa la conexión e inténtalo de nuevo.');
          }
        };
    }

    function enhanceAdministrativeView() {
        const main = document.getElementById('main');
        if (!main) return;
        if (S.view === 'administrativo') {
            const panel = Array.from(main.querySelectorAll('.panel')).find(p => { const t=p.querySelector('.panel-h h3'); return t && t.textContent.includes('Documentos de la empresa'); });
            if (panel) panel.remove();
            const docKpi = Array.from(main.querySelectorAll('.kpi')).find(k => { const l=k.querySelector('.label'); return l && l.textContent.includes('Documentos'); });
            if (docKpi) { docKpi.innerHTML=`<div class="label">📄 Documentos</div><div class="val">${Array.isArray(S.documentos)?S.documentos.length:0}</div><div class="sub">Gestionar en Documentos →</div>`; docKpi.style.cursor='pointer'; docKpi.onclick=()=>{S.view='documentos';render();}; }
            const d=main.querySelector('.page-head p:not(.eyebrow)'); if(d)d.textContent='Panel financiero de la empresa.';
            enhanceAdminPayments();
            main.querySelectorAll('[data-edit-anticipo]').forEach(btn => {
                if (btn.dataset.anticipoBound) return;
                btn.dataset.anticipoBound = '1';
                btn.addEventListener('click', () => editQuoteAdvance(btn.dataset.editAnticipo));
            });
        }
    }

    global.viewDocumentosSeparado = viewDocumentosSeparado;
    global.enhanceAdministrativeView = enhanceAdministrativeView;
})(window);
