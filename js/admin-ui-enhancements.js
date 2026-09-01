// ============================================================
// MEJORAS UI - ADMINISTRATIVO
// 1. Separa Documentos en una vista propia.
// 2. Añade historial desplegable de pagos parciales en Administrativo.
// 3. Permite editar/eliminar pagos parciales desde ese historial.
// ============================================================
(function (global) {
    'use strict';

    const originalRender = global.render;

    function getDocumentPanelFromAdministrative() {
        if (typeof global.viewAdministrativo !== 'function') return null;

        const html = global.viewAdministrativo();
        const holder = document.createElement('div');
        holder.innerHTML = html;

        return Array.from(holder.querySelectorAll('.panel')).find(panel => {
            const title = panel.querySelector('.panel-h h3');
            return title && title.textContent.includes('Documentos de la empresa');
        }) || null;
    }

    function viewDocumentosSeparado() {
        const panel = getDocumentPanelFromAdministrative();
        const panelHtml = panel ? panel.outerHTML : `
            <div class="panel">
                <div class="panel-body">
                    <div class="empty">📄 No se pudo cargar el gestor documental.</div>
                </div>
            </div>`;

        return `
        <div class="page-head">
            <div>
                <p class="eyebrow">Archivo</p>
                <h1>Documentos</h1>
                <p>Documentación personal, profesional y de vehículos.</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-primary" id="btn-new-doc">📄 + Nuevo documento</button>
            </div>
        </div>
        ${panelHtml}`;
    }

    function addDocumentsNav() {
        const nav = document.getElementById('nav');
        if (!nav || nav.querySelector('[data-nav="documentos"]')) return;

        const adminBtn = nav.querySelector('[data-nav="administrativo"]');
        const button = document.createElement('button');
        button.className = 'nav-btn';
        button.dataset.nav = 'documentos';
        button.innerHTML = `${global.ICONS?.folder || '📁'}<span>Documentos</span>`;
        button.onclick = () => {
            global.S.view = 'documentos';
            global.render();
        };

        if (adminBtn && adminBtn.nextSibling) nav.insertBefore(button, adminBtn.nextSibling);
        else nav.appendChild(button);
    }

    function hideDocumentsFromAdministrative() {
        const main = document.getElementById('main');
        if (!main) return;

        const panel = Array.from(main.querySelectorAll('.panel')).find(p => {
            const title = p.querySelector('.panel-h h3');
            return title && title.textContent.includes('Documentos de la empresa');
        });
        if (panel) panel.remove();

        const docKpi = Array.from(main.querySelectorAll('.kpi')).find(k => {
            const label = k.querySelector('.label');
            return label && label.textContent.includes('Documentos');
        });
        if (docKpi) {
            docKpi.innerHTML = `
                <div class="label">📄 Documentos</div>
                <div class="val">${Array.isArray(global.S?.documentos) ? global.S.documentos.length : 0}</div>
                <div class="sub">Gestionar en Documentos →</div>`;
            docKpi.style.cursor = 'pointer';
            docKpi.onclick = () => {
                global.S.view = 'documentos';
                global.render();
            };
        }

        const headDescription = main.querySelector('.page-head p:not(.eyebrow)');
        if (headDescription) headDescription.textContent = 'Panel financiero de la empresa.';
    }

    function getAssociatedPartialPayments(principal) {
        if (!principal) return [];
        const all = Array.isArray(global.S?.pagos) ? global.S.pagos : [];
        let associated = all.filter(p =>
            String(p?.id) !== String(principal.id) &&
            String(p?.cotizacionId) === String(principal.cotizacionId) &&
            Number(p?.montoPagado || 0) > 0
        );

        // Compatibilidad con registros antiguos que no tengan cotizacionId.
        if (!associated.length && principal.cliente) {
            associated = all.filter(p =>
                String(p?.id) !== String(principal.id) &&
                p?.cliente === principal.cliente &&
                Number(p?.montoPagado || 0) > 0 &&
                String(p?.descripcion || '').includes('Pago parcial')
            );
        }

        return associated.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
    }

    function createPartialHistoryRow(principal, parentRow) {
        const existing = parentRow.nextElementSibling;
        if (existing?.dataset?.adminPagoDetalle === principal.id) {
            existing.remove();
            return;
        }

        const partials = getAssociatedPartialPayments(principal);
        const tr = document.createElement('tr');
        tr.dataset.adminPagoDetalle = principal.id;
        tr.innerHTML = `
            <td colspan="9" style="padding:0;background:var(--surface-hover);">
                <div style="padding:14px 18px;border-top:2px solid var(--primary);border-bottom:1px solid var(--border);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;">
                        <strong style="color:var(--primary);">💰 Historial de pagos parciales</strong>
                        <span style="font-size:12px;color:var(--text-soft);">${partials.length} registro${partials.length === 1 ? '' : 's'}</span>
                    </div>
                    ${partials.length ? `
                    <div class="table-wrap"><table>
                        <thead><tr>
                            <th>Fecha</th><th>Descripción</th><th>Método</th>
                            <th class="tright">Monto</th><th>Comprobante</th><th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            ${partials.map(p => `
                            <tr>
                                <td class="tnum" style="white-space:nowrap;">${global.fmtDate(p.fecha)}</td>
                                <td>${global.esc(p.descripcion || 'Pago parcial')}</td>
                                <td>${p.metodoPago ? `<span class="metodo-pago-badge ${p.metodoPago}">${global.metodoPagoLabel(p.metodoPago)}</span>` : '—'}</td>
                                <td class="tright tnum" style="font-weight:600;color:var(--success);">${global.bs(p.montoPagado || 0)}</td>
                                <td>${global.esc(p.comprobante || '—')}</td>
                                <td><div class="rowactions">
                                    <button class="iconbtn admin-edit-partial" data-id="${p.id}" title="Editar pago parcial">${global.ICONS?.edit || '✏️'}</button>
                                    <button class="iconbtn admin-delete-partial" data-id="${p.id}" title="Eliminar pago parcial">${global.ICONS?.trash || '🗑️'}</button>
                                </div></td>
                            </tr>`).join('')}
                        </tbody>
                    </table></div>` : `
                    <div style="font-size:13px;color:var(--text-soft);padding:8px 0;">No hay pagos parciales registrados.</div>`}
                </div>
            </td>`;

        parentRow.parentNode.insertBefore(tr, parentRow.nextSibling);

        tr.querySelectorAll('.admin-edit-partial').forEach(btn => {
            btn.onclick = () => global.editarPagoHistorial(btn.dataset.id);
        });
        tr.querySelectorAll('.admin-delete-partial').forEach(btn => {
            btn.onclick = () => global.eliminarPagoHistorial(btn.dataset.id);
        });
    }

    function enhanceAdminPayments() {
        const main = document.getElementById('main');
        if (!main || global.S?.view !== 'administrativo') return;

        // Pagos pendientes: añade el botón de historial desplegable.
        main.querySelectorAll('[data-register-pago]').forEach(registerBtn => {
            const row = registerBtn.closest('tr');
            const id = registerBtn.dataset.registerPago;
            const pago = global.S.pagos.find(p => String(p.id) === String(id));
            if (!row || !pago || row.querySelector('.admin-toggle-partials')) return;

            const toggle = document.createElement('button');
            toggle.className = 'iconbtn admin-toggle-partials';
            toggle.title = 'Ver/ocultar pagos parciales';
            toggle.textContent = '▾';
            toggle.onclick = () => {
                createPartialHistoryRow(pago, row);
                toggle.textContent = row.nextElementSibling?.dataset?.adminPagoDetalle === pago.id ? '▴' : '▾';
            };

            const actions = row.querySelector('.rowactions');
            if (actions) actions.insertBefore(toggle, actions.firstChild);
        });

        // Historial cerrado: agrega acciones de edición/eliminación y detalle.
        const closedRows = main.querySelectorAll('.panel h3');
        const closedTitle = Array.from(closedRows).find(h => h.textContent.includes('Historial de pagos cerrados'));
        if (closedTitle) {
            const panel = closedTitle.closest('.panel');
            const tbody = panel?.querySelector('tbody');
            if (tbody) {
                const closed = global.S.pagos.filter(p => {
                    const saldo = Number(p.monto) - Number(p.montoPagado || 0);
                    return saldo <= 0.01 && Number(p.monto) > 0;
                }).sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || ''))).slice(0, 10);

                Array.from(tbody.querySelectorAll('tr')).slice(0, closed.length).forEach((row, index) => {
                    const pago = closed[index];
                    if (!pago || row.querySelector('.admin-closed-actions')) return;
                    const td = document.createElement('td');
                    td.className = 'admin-closed-actions';
                    td.innerHTML = `<div class="rowactions">
                        <button class="iconbtn" title="Editar pago" data-id="${pago.id}">${global.ICONS?.edit || '✏️'}</button>
                        <button class="iconbtn" title="Eliminar pago" data-id="${pago.id}">${global.ICONS?.trash || '🗑️'}</button>
                    </div>`;
                    td.querySelector('[title="Editar pago"]').onclick = () => global.editarPagoHistorial(pago.id);
                    td.querySelector('[title="Eliminar pago"]').onclick = () => global.eliminarPagoHistorial(pago.id);
                    row.appendChild(td);
                });

                const head = tbody.parentElement?.querySelector('thead tr');
                if (head && !head.querySelector('.admin-closed-actions-head')) {
                    const th = document.createElement('th');
                    th.className = 'admin-closed-actions-head';
                    th.textContent = 'Acciones';
                    head.appendChild(th);
                }
            }
        }
    }

    function enhancedRender() {
        originalRender();

        addDocumentsNav();

        if (global.S?.view === 'documentos') {
            const main = document.getElementById('main');
            if (main) {
                main.innerHTML = viewDocumentosSeparado();
                if (typeof global.bindAppEvents === 'function') global.bindAppEvents();
            }
            return;
        }

        if (global.S?.view === 'administrativo') {
            hideDocumentsFromAdministrative();
            enhanceAdminPayments();
        }
    }

    global.viewDocumentosSeparado = viewDocumentosSeparado;
    global.render = enhancedRender;
})(window);
