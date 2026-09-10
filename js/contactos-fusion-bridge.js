/* Puente de compatibilidad para Contactos + Clientes fusionados. */
(function(w){
'use strict';
try {
    if (typeof render === 'function') w.render = render;
    if (typeof toast === 'function') w.toast = toast;
    if (typeof uid === 'function') w.uid = uid;
    if (typeof esc === 'function') w.esc = esc;
    if (typeof attr === 'function') w.attr = attr;
    if (typeof saveContactos === 'function') w.saveContactos = saveContactos;
    if (typeof saveClientes === 'function') w.saveClientes = saveClientes;
    if (typeof saveCotizaciones === 'function') w.saveCotizaciones = saveCotizaciones;
    if (typeof savePagos === 'function') w.savePagos = savePagos;

    /* contactos-fusion.js se ejecuta antes de este puente, por lo que su
       patchRender no encontró window.render. Ahora instalamos el puente. */
    if (!w.__contactosRenderPatched && typeof w.render === 'function' && typeof S !== 'undefined') {
        const originalRender = w.render;
        w.render = function(){
            if (S.view === 'clientes') S.view = 'contactos';
            originalRender();
            document.querySelectorAll('[data-nav="clientes"]').forEach(x => x.remove());
            document.querySelectorAll('#ios-nav-select option[value="clientes"]').forEach(x => x.remove());
        };
        w.__contactosRenderPatched = true;
    }
} catch (e) {
    console.warn('Puente Contactos: error de compatibilidad:', e);
}
})(window);
