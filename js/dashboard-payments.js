// ============================================================
// DASHBOARD - Sincronización de indicadores financieros
// ============================================================
// Este módulo no reemplaza viewDashboard(). Busca las tarjetas
// por su texto y actualiza únicamente sus valores monetarios.
// Depende de las funciones centralizadas de pagos.js.

(function () {
    'use strict';

    const LABELS = {
        facturado: ['cotizado', 'facturado'],
        cobrado: ['cobrado', 'pagado'],
        porCobrar: ['por cobrar', 'pendiente']
    };

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function findCardByLabels(labels) {
        const wanted = labels.map(normalizeText);
        const candidates = document.querySelectorAll(
            '.stat-card, .metric-card, .kpi-card, .card, [class*="stat"], [class*="metric"], [class*="kpi"]'
        );

        for (const card of candidates) {
            const text = normalizeText(card.textContent);
            if (wanted.some(label => text.includes(label))) return card;
        }

        return null;
    }

    function findValueElement(card) {
        if (!card) return null;

        return card.querySelector(
            '.stat-value, .metric-value, .kpi-value, .value, [class*="value"]'
        );
    }

    function formatMoney(value) {
        return new Intl.NumberFormat('es-BO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value) || 0) + ' Bs';
    }

    function updateCard(labels, value) {
        const card = findCardByLabels(labels);
        const valueElement = findValueElement(card);

        if (!valueElement) return false;

        valueElement.textContent = formatMoney(value);
        return true;
    }

    function syncDashboardPaymentCards() {
        if (typeof getResumenPagos !== 'function') return;

        const resumen = getResumenPagos();

        updateCard(LABELS.facturado, resumen.totalFacturado);
        updateCard(LABELS.cobrado, resumen.totalCobrado);
        updateCard(LABELS.porCobrar, resumen.totalPorCobrar);
    }

    // API pública para poder invocarlo después de guardar/eliminar pagos.
    window.syncDashboardPaymentCards = syncDashboardPaymentCards;

    // Ejecutar después del render inicial y permitir que renderizaciones
    // posteriores vuelvan a sincronizar las tarjetas.
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(syncDashboardPaymentCards, 0);
    });
})();
