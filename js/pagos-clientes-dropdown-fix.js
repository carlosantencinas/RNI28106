// ============================================================
// FIX SEGURO - CLIENTES DEL NUEVO REGISTRO DE PAGO
// No cambia ni elimina contactos. Solo completa el datalist del
// modal de "Nuevo registro de pago" usando contactos + clientes.
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

        // Primero la fuente unificada, si está disponible.
        try {
            const unified = global.RNIDataModel?.getClients?.();
            if (Array.isArray(unified)) unified.forEach(addClient => add(contactDisplay(addClient)));
        } catch (e) {
            console.warn('Clientes unificados no disponibles:', e);
        }

        // Luego contactos: esto permite seleccionar un contacto aunque
        // todavía no tenga la marca esCliente.
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
})(window);
