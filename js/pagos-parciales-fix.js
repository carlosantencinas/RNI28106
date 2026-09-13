// ============================================================
// FIX SEGURO - PAGOS PARCIALES
// Evita encadenar pagos parciales como nuevas deudas.
// No modifica datos existentes hasta que el usuario registre un pago.
// ============================================================
(function (global) {
    'use strict';

    function findPrincipal(pago) {
        if (!pago) return null;

        if (pago.pagoPrincipalId) {
            const linked = Array.isArray(S.pagos)
                ? S.pagos.find(x => String(x.id) === String(pago.pagoPrincipalId))
                : null;
            if (linked) return linked;
        }

        if (pago.cotizacionId) {
            const linked = Array.isArray(S.pagos)
                ? S.pagos.find(x =>
                    String(x.cotizacionId) === String(pago.cotizacionId) &&
                    String(x.id) !== String(pago.id) &&
                    Number(x.monto) > 0
                )
                : null;
            if (linked) return linked;
        }

        // Compatibilidad con los registros antiguos que quedaron sin
        // cotizacionId y cuya descripción se fue encadenando.
        if (String(pago.descripcion || '').startsWith('Pago parcial -')) {
            const base = String(pago.descripcion)
                .replace(/^(Pago parcial -\s*)+/, '')
                .trim();
            const candidates = (Array.isArray(S.pagos) ? S.pagos : []).filter(x =>
                String(x.id) !== String(pago.id) &&
                !x.cotizacionId &&
                x.cliente === pago.cliente &&
                Number(x.monto) === Number(pago.monto) &&
                String(x.descripcion || '').trim() === base
            );
            if (candidates[0]) return candidates[0];
        }

        return pago;
    }

    global.openRegisterPagoModal = function (pago) {
        const principal = findPrincipal(pago);
        if (!principal) {
            toast('⚠️ No se encontró la deuda.');
            return;
        }

        const total = Number(principal.monto) || 0;
        const pagado = Number(principal.montoPagado) || 0;
        const saldo = Math.max(0, total - pagado);

        if (saldo <= 0) {
            toast('✅ Esta deuda ya está completamente pagada.');
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="modal" style="max-width:620px;">
                <div class="modal-h">
                    <h3>💰 Registrar pago parcial</h3>
                    <button class="close" id="m-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="field">
                        <label>Deuda</label>
                        <input value="${attr(principal.descripcion || principal.cliente || 'Deuda')}" disabled style="background:#f5f5f5;">
                    </div>
                    <div class="row2">
                        <div class="field">
                            <label>Monto total [Bs]</label>
                            <input value="${total}" disabled style="background:#f5f5f5;">
                        </div>
                        <div class="field">
                            <label>Saldo pendiente [Bs]</label>
                            <input id="rp-saldo" value="${saldo}" disabled style="background:#f5f5f5;font-weight:bold;">
                        </div>
                    </div>
                    <div class="field">
                        <label>Monto a pagar AHORA [Bs]</label>
                        <input id="rp-pagado-nuevo" type="number" min="0.01" step="0.01" placeholder="Ej. 1.00">
                        <div style="font-size:12px;color:var(--text-soft);margin-top:4px;">Se registra solo el monto adicional de este pago.</div>
                    </div>
                    <div class="row2">
                        <div class="field">
                            <label>Fecha del pago</label>
                            <input id="rp-fecha-pago" type="date" value="${new Date().toISOString().slice(0,10)}">
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
                        <input id="rp-comprobante" placeholder="Ej. TRANS-001">
                    </div>
                    <div class="field">
                        <label>Notas</label>
                        <textarea id="rp-notas" rows="2" placeholder="Detalles del pago..."></textarea>
                    </div>
                </div>
                <div class="modal-foot">
                    <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                    <button class="btn btn-primary" id="m-save">💾 Registrar pago</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#m-close').onclick = close;
        overlay.querySelector('#m-cancel').onclick = close;
        overlay.addEventListener('mousedown', e => {
            if (e.target === overlay) close();
        });

        const input = overlay.querySelector('#rp-pagado-nuevo');
        const saldoEl = overlay.querySelector('#rp-saldo');
        input.addEventListener('input', () => {
            const monto = Number(input.value) || 0;
            saldoEl.value = Math.max(0, saldo - monto).toFixed(2);
        });

        overlay.querySelector('#m-save').onclick = async () => {
            const montoAPagar = Number(input.value) || 0;
            if (montoAPagar <= 0) {
                toast('⚠️ Ingresa un monto válido.');
                return;
            }
            if (montoAPagar > saldo) {
                toast(`⚠️ El monto no puede ser mayor al saldo pendiente (${bs(saldo)}).`);
                return;
            }

            const fecha = overlay.querySelector('#rp-fecha-pago').value || new Date().toISOString().slice(0,10);
            const nuevoPago = {
                id: uid(),
                pagoPrincipalId: principal.id,
                cotizacionId: principal.cotizacionId || '',
                cliente: principal.cliente || '',
                descripcion: `Pago parcial - ${String(principal.descripcion || 'Deuda').replace(/^(Pago parcial -\s*)+/, '').trim()}`,
                monto: 0,
                montoPagado: montoAPagar,
                fecha,
                fechaCompromiso: fecha,
                notas: overlay.querySelector('#rp-notas').value.trim(),
                metodoPago: overlay.querySelector('#rp-metodo').value || '',
                comprobante: overlay.querySelector('#rp-comprobante').value.trim()
            };

            S.pagos.push(nuevoPago);
            principal.montoPagado = pagado + montoAPagar;

            const nota = `💰 Pago de ${bs(montoAPagar)} registrado el ${fmtDate(fecha)}`;
            principal.notas = principal.notas ? principal.notas + '\n' + nota : nota;

            try {
                await savePagos(S.user?.uid);
                close();
                S.expandedPagoId = principal.id;
                render();
                toast('✅ Pago registrado correctamente.');
            } catch (error) {
                console.error('Error al guardar pago:', error);
                toast('❌ Error al guardar el pago.');
            }
        };
    };
})(window);
