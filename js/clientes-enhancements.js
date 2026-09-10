// Compatibilidad: carga del módulo unificado y controlador de modal.
(function(){
    if (window.__contactosFusionLoader) return;
    window.__contactosFusionLoader = true;
    var s = document.createElement('script');
    s.src = 'js/contactos-fusion.js?v=20260910c';
    document.head.appendChild(s);
    var fix = document.createElement('script');
    fix.src = 'js/contactos-modal-fix.js?v=20260910c';
    document.head.appendChild(fix);
    var emergency = document.createElement('script');
    emergency.src = 'js/contactos-modal-emergency.js?v=20260910a';
    document.head.appendChild(emergency);
})();
