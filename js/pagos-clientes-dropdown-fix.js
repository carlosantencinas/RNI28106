// ============================================================
// FIX SEGURO - CLIENTES DEL NUEVO REGISTRO DE PAGO
// Además inicia la sincronización de relaciones de datos una vez
// cargado el usuario. No elimina registros.
// ============================================================
(function (global) {
    'use strict';

    function normalize(value) {
        return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function contactDisplay(c) {
        return c?.clienteNombre || c?.empresa || c?.nombre || c?.razonSocial || '';
    }

    function getAllClientNames() {
        const values = [];
        const seen = new Set();
        const add = value => {
            const text = String(value ?? '').trim();
            if (!text) return;
            const key = normalize(text);
            if (seen.has(key)) return;
            seen.add(key);
            values.push(text);
        };

        try {
            const unified = global.RNIDataModel?.getClients?.();
            if (Array.isArray(unified)) unified.forEach(addClient => add(contactDisplay(addClient)));
        } catch (e) {
            console.warn('Clientes unificados no disponibles:', e);
        }

        if (Array.isArray(S.contactos)) S.contactos.forEach(addClient => add(contactDisplay(addClient)));
        if (Array.isArray(S.clientes)) S.clientes.forEach(addClient => add(contactDisplay(addClient)));

        return values.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    }

    function refreshDatalist() {
        const list = document.getElementById('dl-clientes-pago');
        if (!list) return false;
        const current = document.getElementById('p-cliente')?.value || '';
        list.innerHTML = getAllClientNames().map(name => `<option value="${esc(name)}"></option>`).join('');
        if (current) {
            const input = document.getElementById('p-cliente');
            if (input && !input.value) input.value = current;
        }
        return true;
    }

    function loadRelationSync() {
        if (global.RNIDataRelationsSync) return Promise.resolve(global.RNIDataRelationsSync);
        if (global.__rniRelationSyncPromise) return global.__rniRelationSyncPromise;
        global.__rniRelationSyncPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-rni-relations-sync]');
            if (existing) {
                existing.addEventListener('load', () => resolve(global.RNIDataRelationsSync), { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            const s = document.createElement('script');
            s.src = 'js/data-relations-sync.js?v=20260914-relations1';
            s.dataset.rniRelationsSync = '1';
            s.onload = () => resolve(global.RNIDataRelationsSync);
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return global.__rniRelationSyncPromise;
    }

    async function synchronizeWhenReady(attempt = 0) {
        if (global.__rniRelationsSyncedForUser === S.user?.uid) return;
        if (!S.user?.uid) {
            if (attempt < 100) setTimeout(() => synchronizeWhenReady(attempt + 1), 100);
            return;
        }
        const ready = Array.isArray(S.contactos) && Array.isArray(S.clientes) &&
            Array.isArray(S.cotizaciones) && Array.isArray(S.pagos);
        if (!ready) {
            if (attempt < 100) setTimeout(() => synchronizeWhenReady(attempt + 1), 100);
            return;
        }
        try {
            const service = await loadRelationSync();
            if (!service?.syncAndPersist) return;
            const result = await service.syncAndPersist();
            global.__rniRelationsSyncedForUser = S.user.uid;
            console.info('RNI sincronización de relaciones:', result);
        } catch (e) {
            console.error('RNI: error sincronizando contactos/clientes/cotizaciones/pagos:', e);
        }
    }

    function install() {
        const original = global.openPagoModal;
        if (typeof original !== 'function' || original.__clientDropdownFix) {
            if (typeof original !== 'function') setTimeout(install, 100);
            return;
        }

        const wrapped = function (...args) {
            const result = original.apply(this, args);
            setTimeout(refreshDatalist, 0);
            setTimeout(refreshDatalist, 50);
            return result;
        };
        wrapped.__clientDropdownFix = true;
        global.openPagoModal = wrapped;
        global.refreshPagoClientes = refreshDatalist;
    }

    setTimeout(install, 0);
    setTimeout(install, 300);
    setTimeout(() => synchronizeWhenReady(), 0);
})(window);
