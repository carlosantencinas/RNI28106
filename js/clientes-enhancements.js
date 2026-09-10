// Compatibilidad: el antiguo módulo Clientes ahora carga el módulo unificado Contactos + Clientes y la reparación del modal.
(function(){
    if (window.__contactosFusionLoader) return;
    window.__contactosFusionLoader = true;
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'js/contactos-fusion.js?v=20260910';
    document.head.appendChild(s);
    var fix = document.createElement('script');
    fix.defer = true;
    fix.src = 'js/contactos-modal-fix.js?v=20260910';
    document.head.appendChild(fix);
})();
