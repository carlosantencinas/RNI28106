// Compatibilidad: el antiguo módulo Clientes ahora carga el módulo unificado Contactos + Clientes.
(function(){
    if (window.__contactosFusionLoader) return;
    window.__contactosFusionLoader = true;
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'js/contactos-fusion.js?v=20260909';
    document.head.appendChild(s);
})();
