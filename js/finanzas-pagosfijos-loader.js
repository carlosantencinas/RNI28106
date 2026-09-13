// ============================================================
// CARGA SEGURA DE PAGOS RECURRENTES EN FINANZAS
// No modifica datos ni Firebase. Solo espera la carga antes de
// volver a renderizar Finanzas cuando S.pagosFijos aún no está listo.
// ============================================================
(function (global) {
    'use strict';

    const originalViewFinanzas = global.viewFinanzas;
    let loadPromise = null;
    let requestedUid = null;

    if (typeof originalViewFinanzas !== 'function') return;

    global.viewFinanzas = function () {
        const state = global.S;
        const userId = state?.user?.uid || null;

        if (!userId || !Array.isArray(state.pagosFijos) || state.pagosFijos.length > 0) {
            return originalViewFinanzas();
        }

        if (requestedUid !== userId) {
            requestedUid = userId;
            loadPromise = null;
        }

        if (!loadPromise && typeof global.cloudGet === 'function') {
            loadPromise = global.cloudGet(userId, 'pagosFijos')
                .then(raw => {
                    const data = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
                    state.pagosFijos = Array.isArray(data) ? data : [];
                    if (state.view === 'finanzas') global.render();
                })
                .catch(error => {
                    console.warn('No se pudieron cargar los pagos recurrentes antes de Finanzas:', error);
                });
        }

        return '<div class="panel"><div class="panel-body" style="padding:28px;text-align:center;color:var(--text-soft);">Cargando pagos recurrentes…</div></div>';
    };
})(window);
