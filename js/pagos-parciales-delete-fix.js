// ============================================================
// FIX SEGURO - ELIMINACIÓN DE PAGOS PARCIALES
// Corrige la eliminación de pagos registrados vinculados al
// pago principal mediante pagoPrincipalId.
// No modifica datos al cargar el script.
// ============================================================
(function (global) {
    'use strict';

    global.eliminarPagoHistorial = async function (pagoId) {
        if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar este pago registrado?\n\nEsta acción no se puede deshacer.')) {
            return;
        }

        try {
            const pago = Array.isArray(S.pagos)
                ? S.pagos.find(p => String(p?.id) === String(pagoId))
                : null;

            if (!pago) {
                toast('⚠️ No se encontró el pago.');
                return;
            }

            // Preferimos el vínculo explícito creado por el nuevo flujo.
            let principal = null;
            if (pago.pagoPrincipalId) {
                principal = S.pagos.find(p =>
                    String(p?.id) === String(pago.pagoPrincipalId) &&
                    Number(p?.monto) > 0
                ) || null;
            }

            // Compatibilidad con pagos antiguos asociados por cotizacionId.
            if (!principal && pago.cotizacionId) {
                principal = S.pagos.find(p =>
                    String(p?.cotizacionId) === String(pago.cotizacionId) &&
                    String(p?.id) !== String(pago.id) &&
                    Number(p?.monto) > 0
                ) || null;
            }

            // Compatibilidad con deuda directa sin cotización.
            if (!principal && !pago.cotizacionId && String(pago.descripcion || '').startsWith('Pago parcial -')) {
                const base = String(pago.descripcion)
                    .replace(/^(Pago parcial -\s*)+/, '')
                    .trim();
                principal = S.pagos.find(p =>
                    String(p?.id) !== String(pago.id) &&
                    !p?.cotizacionId &&
                    Number(p?.monto) > 0 &&
                    p?.cliente === pago.cliente &&
                    String(p?.descripcion || '').replace(/^(Pago parcial -\s*)+/, '').trim() === base
                ) || null;
            }

            const montoEliminado = Math.max(0, Number(pago.montoPagado || 0));
            const index = S.pagos.findIndex(p => String(p?.id) === String(pagoId));
            if (index === -1) {
                toast('⚠️ No se encontró el pago.');
                return;
            }

            S.pagos.splice(index, 1);

            if (principal && montoEliminado > 0) {
                principal.montoPagado = Math.max(
                    0,
                    Number(principal.montoPagado || 0) - montoEliminado
                );
                const nota = `❌ Pago de ${bs(montoEliminado)} eliminado (${fmtDate(new Date().toISOString())})`;
                principal.notas = principal.notas
                    ? principal.notas + '\n' + nota
                    : nota;
            }

            await savePagos(S.user?.uid);

            if (S.expandedPagoId === pagoId || S.expandedPagoId === pago.cotizacionId) {
                S.expandedPagoId = principal?.id || null;
            }

            render();
            toast('✅ Pago eliminado correctamente.');
        } catch (error) {
            console.error('Error al eliminar pago:', error);
            toast('❌ Error al eliminar el pago.');
        }
    };
})(window);
