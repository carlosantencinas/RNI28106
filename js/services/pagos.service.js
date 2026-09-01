// ============================================================
// SERVICIO DE PAGOS
// Capa de dominio: reglas y mutaciones de pagos sin UI.
// ============================================================

(function (global) {
    'use strict';

    function list() {
        return Array.isArray(global.S?.pagos) ? global.S.pagos : [];
    }

    function findById(pagoId) {
        return list().find(p => String(p?.id) === String(pagoId)) || null;
    }

    function findIndexById(pagoId) {
        return list().findIndex(p => String(p?.id) === String(pagoId));
    }

    function findPrincipal(cotizacionId, excludedId = null) {
        return list().find(p =>
            String(p?.cotizacionId) === String(cotizacionId) &&
            String(p?.id) !== String(excludedId) &&
            Number(p?.monto) > 0
        ) || null;
    }

    /**
     * Elimina un pago registrado y descuenta su monto del pago principal.
     * No muestra UI ni llama a render(); eso corresponde a la vista/controlador.
     */
    function removeRegisteredPayment(pagoId) {
        const pagos = list();
        const index = findIndexById(pagoId);
        if (index === -1) return { ok: false, reason: 'not_found' };

        const removed = pagos[index];
        const amount = Math.max(0, Number(removed?.montoPagado || 0));
        const principal = findPrincipal(removed?.cotizacionId, pagoId);

        pagos.splice(index, 1);

        if (principal) {
            principal.montoPagado = Math.max(
                0,
                Number(principal.montoPagado || 0) - amount
            );
        }

        return {
            ok: true,
            removed,
            amount,
            principal
        };
    }

    /**
     * Elimina una deuda principal y todos sus pagos asociados.
     */
    function removeDebt(pagoId) {
        const principal = findById(pagoId);
        if (!principal) return { ok: false, reason: 'not_found' };

        const cotizacionId = principal.cotizacionId;
        const before = list().length;
        global.S.pagos = list().filter(p =>
            String(p?.id) !== String(pagoId) &&
            String(p?.cotizacionId) !== String(cotizacionId)
        );

        return {
            ok: true,
            removed: principal,
            removedCount: before - global.S.pagos.length,
            cotizacionId
        };
    }

    /**
     * Actualiza un pago registrado y sincroniza la variación de monto
     * con su deuda principal.
     */
    function updateRegisteredPayment(pagoId, changes = {}) {
        const pago = findById(pagoId);
        if (!pago) return { ok: false, reason: 'not_found' };

        const principal = findPrincipal(pago.cotizacionId, pagoId);
        const oldAmount = Number(pago.montoPagado || 0);
        const newAmount = Number(changes.montoPagado);

        if (!Number.isFinite(newAmount) || newAmount <= 0) {
            return { ok: false, reason: 'invalid_amount' };
        }

        pago.descripcion = changes.descripcion || pago.descripcion;
        pago.montoPagado = newAmount;
        pago.fecha = changes.fecha || pago.fecha;
        pago.metodoPago = changes.metodoPago || pago.metodoPago;
        pago.comprobante = changes.comprobante || pago.comprobante;
        pago.notas = changes.notas || pago.notas;

        const difference = newAmount - oldAmount;
        if (principal && difference !== 0) {
            principal.montoPagado = Math.max(
                0,
                Number(principal.montoPagado || 0) + difference
            );
        }

        return {
            ok: true,
            pago,
            principal,
            oldAmount,
            newAmount,
            difference
        };
    }

    const service = Object.freeze({
        list,
        findById,
        findIndexById,
        findPrincipal,
        removeRegisteredPayment,
        removeDebt,
        updateRegisteredPayment
    });

    global.PagosService = service;
})(window);
