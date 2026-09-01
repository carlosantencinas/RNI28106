// ============================================================
// CONTROLADOR DE PAGOS
// UI para las operaciones de pagos. La lógica de negocio vive en
// PagosService; este módulo solo coordina confirmaciones, modales,
// persistencia y renderizado.
// ============================================================

(function (global) {
    'use strict';

    const service = global.PagosService;

    if (!service) {
        console.error('PagosController: PagosService no está disponible.');
        return;
    }

    function eliminarPagoHistorial(pagoId) {
        if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar este pago registrado?\n\nEsta acción no se puede deshacer.')) return;

        try {
            const pago = service.findById(pagoId);
            if (!pago) {
                toast('⚠️ No se encontró el pago.');
                return;
            }

            const result = service.removeRegisteredPayment(pagoId);
            if (!result.ok) {
                toast('⚠️ No se pudo eliminar el pago.');
                return;
            }

            // Mantiene el historial de la operación en la deuda principal.
            if (result.principal) {
                const note = `❌ Pago de ${bs(result.amount)} eliminado (${fmtDate(new Date().toISOString())})`;
                result.principal.notas = result.principal.notas
                    ? result.principal.notas + '\n' + note
                    : note;
            }

            return Promise.resolve(savePagos(S.user?.uid)).then(() => {
                if (S.expandedPagoId === pago.cotizacionId || S.expandedPagoId === pagoId) {
                    const principal = service.list().find(p =>
                        String(p?.cotizacionId) === String(pago.cotizacionId) &&
                        Number(p?.monto) > 0
                    );
                    S.expandedPagoId = principal ? principal.id : null;
                }
                toast('✅ Pago eliminado correctamente.');
                render();
            }).catch(error => {
                console.error('Error al eliminar pago:', error);
                toast('❌ Error al guardar la eliminación.');
            });
        } catch (error) {
            console.error('Error al eliminar pago:', error);
            toast('❌ Error al eliminar el pago.');
        }
    }

    function editarPagoHistorial(pagoId) {
        const pago = service.findById(pagoId);
        if (!pago) {
            toast('⚠️ No se encontró el pago.');
            return;
        }

        const principal = service.findPrincipal(pago.cotizacionId, pagoId);
        if (!principal) {
            toast('⚠️ Este es el pago principal. Edita la deuda directamente.');
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="modal" style="max-width:580px;">
                <div class="modal-h">
                    <h3>✏️ Editar pago registrado</h3>
                    <button class="close" id="m-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="field">
                        <label>Descripción</label>
                        <input id="ep-desc" value="${attr(pago.descripcion)}" placeholder="Descripción del pago">
                    </div>
                    <div class="row2">
                        <div class="field">
                            <label>Monto pagado [Bs]</label>
                            <input type="number" step="0.01" id="ep-monto" value="${pago.montoPagado}">
                        </div>
                        <div class="field">
                            <label>Fecha del pago</label>
                            <input type="date" id="ep-fecha" value="${pago.fecha || ''}">
                        </div>
                    </div>
                    <div class="row2">
                        <div class="field">
                            <label>Método de pago</label>
                            <select id="ep-metodo">
                                <option value="">Seleccionar...</option>
                                <option value="efectivo" ${pago.metodoPago === 'efectivo' ? 'selected' : ''}>💵 Efectivo</option>
                                <option value="transferencia" ${pago.metodoPago === 'transferencia' ? 'selected' : ''}>🏦 Transferencia bancaria</option>
                                <option value="deposito" ${pago.metodoPago === 'deposito' ? 'selected' : ''}>🏛️ Depósito</option>
                                <option value="cheque" ${pago.metodoPago === 'cheque' ? 'selected' : ''}>📄 Cheque</option>
                                <option value="otro" ${pago.metodoPago === 'otro' ? 'selected' : ''}>📌 Otro</option>
                            </select>
                        </div>
                        <div class="field">
                            <label>Número de comprobante</label>
                            <input id="ep-comprobante" value="${attr(pago.comprobante)}" placeholder="Ej. TRANS-001">
                        </div>
                    </div>
                    <div class="field">
                        <label>Notas</label>
                        <textarea id="ep-notas" rows="2">${esc(pago.notas || '')}</textarea>
                    </div>
                    <div style="font-size:12px;color:var(--text-soft);padding:8px 10px;background:var(--gantt-bg);border-radius:4px;margin-top:8px;">
                        <strong>⚠️ Importante:</strong> Al editar el monto, se recalculará automáticamente el saldo de la deuda principal.
                    </div>
                </div>
                <div class="modal-foot">
                    <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                    <button class="btn btn-primary" id="m-save">💾 Guardar cambios</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);

        const closeModal = () => {
            if (overlay.parentNode) overlay.remove();
        };

        overlay.querySelector('#m-close').onclick = closeModal;
        overlay.querySelector('#m-cancel').onclick = closeModal;
        overlay.addEventListener('mousedown', e => {
            if (e.target === overlay) closeModal();
        });

        overlay.querySelector('#m-save').onclick = async () => {
            const nuevoMonto = Number(overlay.querySelector('#ep-monto').value) || 0;
            if (nuevoMonto <= 0) {
                toast('⚠️ El monto debe ser mayor a cero.');
                return;
            }

            const changes = {
                descripcion: overlay.querySelector('#ep-desc').value.trim(),
                montoPagado: nuevoMonto,
                fecha: overlay.querySelector('#ep-fecha').value,
                metodoPago: overlay.querySelector('#ep-metodo').value,
                comprobante: overlay.querySelector('#ep-comprobante').value.trim(),
                notas: overlay.querySelector('#ep-notas').value.trim()
            };

            const result = service.updateRegisteredPayment(pagoId, changes);
            if (!result.ok) {
                toast(result.reason === 'invalid_amount'
                    ? '⚠️ El monto debe ser mayor a cero.'
                    : '⚠️ No se encontró el pago.');
                return;
            }

            if (result.principal && result.difference !== 0) {
                const note = `✏️ Pago editado: ${bs(result.oldAmount)} → ${bs(result.newAmount)} (${fmtDate(new Date().toISOString())})`;
                result.principal.notas = result.principal.notas
                    ? result.principal.notas + '\n' + note
                    : note;
            }

            try {
                await savePagos(S.user?.uid);
                closeModal();
                S.expandedPagoId = pago.cotizacionId
                    ? service.list().find(p =>
                        String(p?.cotizacionId) === String(pago.cotizacionId) &&
                        Number(p?.monto) > 0
                    )?.id || null
                    : null;
                render();
                toast('✅ Pago actualizado correctamente.');
            } catch (error) {
                console.error('Error al editar pago:', error);
                toast('❌ Error al guardar los cambios.');
            }
        };
    }

    function eliminarPagoPrincipal(pagoId) {
        if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar esta deuda y todos sus pagos asociados?\n\nEsta acción no se puede deshacer.')) return;

        try {
            const result = service.removeDebt(pagoId);
            if (!result.ok) {
                toast('⚠️ No se encontró la deuda.');
                return;
            }

            Promise.resolve(savePagos(S.user?.uid)).then(() => {
                toast('✅ Deuda y pagos asociados eliminados correctamente.');
                S.expandedPagoId = null;
                render();
            }).catch(error => {
                console.error('Error al eliminar deuda:', error);
                toast('❌ Error al guardar la eliminación.');
            });
        } catch (error) {
            console.error('Error al eliminar deuda:', error);
            toast('❌ Error al eliminar la deuda.');
        }
    }

    // Sustituye los handlers públicos de app.js sin alterar aún su código.
    global.editarPagoHistorial = editarPagoHistorial;
    global.eliminarPagoHistorial = eliminarPagoHistorial;
    global.eliminarPagoPrincipal = eliminarPagoPrincipal;

    global.PagosController = Object.freeze({
        editarPagoHistorial,
        eliminarPagoHistorial,
        eliminarPagoPrincipal
    });
})(window);
