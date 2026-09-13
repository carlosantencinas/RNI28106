// ============================================================
// REPARACIÓN CONTROLADA - YAMPARAEZ
// No se ejecuta automáticamente.
// El usuario debe invocar repararYamparaezPruebas() y confirmar.
// Restaura la deuda original de Bs 2.500 y elimina SOLO los
// pagos de prueba asociados a "Prestamo Documento ORIGINALES...".
// ============================================================
(function (global) {
    'use strict';

    function normalize(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/^(pago parcial\s*-\s*)+/i, '')
            .trim();
    }

    global.repararYamparaezPruebas = async function () {
        const all = Array.isArray(S.pagos) ? S.pagos : [];
        const base = 'prestamo documento originales para contrato yamparaez';

        const candidatos = all.filter(p =>
            String(p?.cliente || '').toLowerCase().includes('juan pablo diaz') &&
            normalize(p?.descripcion) === base
        );

        const parciales = candidatos.filter(p =>
            String(p?.descripcion || '').toLowerCase().includes('pago parcial')
        );
        const principalExistente = candidatos.find(p =>
            !String(p?.descripcion || '').toLowerCase().includes('pago parcial') &&
            Number(p?.monto || 0) > 0
        );

        if (!parciales.length && !principalExistente) {
            toast('⚠️ No se encontró la deuda/pruebas de Yamparaez.');
            return;
        }

        const montoPrincipal = Number(principalExistente?.monto) || Number(parciales[0]?.monto) || 2500;
        const resumen = `\n\nSe conservará/restaurará:\n• Prestamo Documento ORIGINALES para contrato Yamparaez\n• Monto: ${bs(montoPrincipal)}\n• Pagado: Bs 0,00\n• Saldo: ${bs(montoPrincipal)}\n\nSe eliminarán SOLO los pagos parciales de prueba encontrados: ${parciales.length}.`;

        if (!confirm('⚠️ RESTAURAR YAMPARAEZ A SU ESTADO ORIGINAL?' + resumen + '\n\nEsta acción modifica los datos guardados.')) return;

        let principal = principalExistente;
        if (principal) {
            principal.descripcion = 'Prestamo Documento ORIGINALES para contrato Yamparaez';
            principal.monto = montoPrincipal;
            principal.montoPagado = 0;
            principal.cotizacionId = principal.cotizacionId || '';
            principal.fecha = principal.fecha || '2026-08-20';
            principal.notas = '';
        } else {
            principal = {
                id: uid(),
                fecha: '2026-08-20',
                cliente: 'Juan Pablo Diaz',
                descripcion: 'Prestamo Documento ORIGINALES para contrato Yamparaez',
                monto: montoPrincipal,
                montoPagado: 0,
                fechaCompromiso: '',
                notas: '',
                cotizacionId: '',
                metodoPago: '',
                comprobante: ''
            };
            S.pagos.push(principal);
        }

        const idsParciales = new Set(parciales.map(p => String(p.id)));
        S.pagos = S.pagos.filter(p => !idsParciales.has(String(p.id)));

        // Garantiza que el principal quede una sola vez.
        const principalId = String(principal.id);
        const seen = new Set();
        S.pagos = S.pagos.filter(p => {
            if (String(p.id) !== principalId) return true;
            if (seen.has(principalId)) return false;
            seen.add(principalId);
            return true;
        });

        await savePagos(S.user?.uid);
        S.expandedPagoId = principal.id;
        render();
        toast('✅ Yamparaez restaurado: Bs 2.500 por cobrar y sin pagos de prueba.');
    };
})(window);
