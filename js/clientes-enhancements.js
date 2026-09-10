// Cargador único para Contactos + Clientes.
// El controlador de modal se instala a nivel WINDOW para evitar conflictos
// con delegaciones de eventos de otros módulos.
(function(){
    if (window.__contactosFusionLoader) return;
    window.__contactosFusionLoader = true;
    var s = document.createElement('script');
    s.src = 'js/contactos-fusion.js?v=20260910d';
    document.head.appendChild(s);
    var emergency = document.createElement('script');
    emergency.src = 'js/contactos-modal-emergency.js?v=20260910b';
    document.head.appendChild(emergency);
})();
