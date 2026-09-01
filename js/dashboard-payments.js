// ============================================================
// DASHBOARD - Sincronización de indicadores financieros
// ============================================================
// Fuente única: pagos.js -> getResumenPagos().
// Este módulo solo actualiza la UI después del render.
// ============================================================
(function (global) {
    'use strict';

    function formatMoney(value) {
        return new Intl.NumberFormat('es-BO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value) || 0) + ' Bs';
    }

    function syncDashboardPaymentCards() {
        if (typeof getResumenPagos !== 'function') return;
        if (typeof S === 'undefined' || S.view !== 'dashboard') return;

        const resumen = getResumenPagos();
        const main = document.getElementById('main');
        if (!main) return;

        // El Dashboard actual usa .kpi y el texto de su .label.
        main.querySelectorAll('.kpi').forEach(card => {
            const label = String(card.querySelector('.label')?.textContent || '')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const value = card.querySelector('.val');
            if (!value) return;

            if (label.includes('cobrado a la fecha')) {
                value.textContent = formatMoney(resumen.totalCobrado);
            } else if (label.includes('por cobrar')) {
                value.textContent = formatMoney(resumen.totalPorCobrar);
            }
        });
    }

    global.syncDashboardPaymentCards = syncDashboardPaymentCards;

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(syncDashboardPaymentCards, 0);
    });
})(window);
