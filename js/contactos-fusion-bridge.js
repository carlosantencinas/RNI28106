/* Puente de compatibilidad: los módulos globales modernos usan declaraciones const/function
   que no aparecen como propiedades de window. El módulo de Contactos las necesita para
   persistencia y refresco después de abrir/editar/guardar fichas. */
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

    /* El módulo fusionado se carga antes de este puente. Su patchRender no pudo
       ejecutarse porque render aún no era propiedad de window. Lo hacemos aquí. */
    if (!w.__contactosRenderPatched && typeof w.render === 'function' && typeof w.S !== 'undefined') {
        const originalRender = w.render;
        w.render = function(){
            if (w.S.view === 'clientes') w.S.view = 'contactos';
            originalRender();
            document.querySelectorAll('[data-nav="clientes"]').forEach(x => x.remove());
            document.querySelectorAll('#ios-nav-select option[value="clientes"]').forEach(x => x.remove());
        };
        w.__contactosRenderPatched = true;
    }
} catch (e) {
    console.warn('Puente Contactos: no se pudo completar la compatibilidad:', e);
}
})(window);
