// ============================================================
// CARGA SEGURA DE PAGOS RECURRENTES EN FINANZAS - V2
// Usa el estado lexical S de la aplicación. No modifica Firebase.
// ============================================================
(function (global) {
    'use strict';

    const originalViewFinanzas = global.viewFinanzas;
    let loadPromise = null;
    let requestedUid = null;

    if (typeof originalViewFinanzas !== 'function') return;

    global.viewFinanzas = function () {
        const userId = S?.user?.uid || null;

        if (!userId || !Array.isArray(S.pagosFijos) || S.pagosFijos.length > 0) {
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
                    S.pagosFijos = Array.isArray(data) ? data : [];
                    if (S.view === 'finanzas') global.render();
                })
                .catch(error => {
                    console.warn('No se pudieron cargar los pagos recurrentes antes de Finanzas:', error);
                });
        }

        return '<div class="panel"><div class="panel-body" style="padding:28px;text-align:center;color:var(--text-soft);">Cargando pagos recurrentes…</div></div>';
    };
})(window);
