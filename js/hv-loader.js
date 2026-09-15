/* Carga única y segura del módulo moderno de Hoja de Vida. */
(function(){
'use strict';
function load(){
 if(window.__hvDashboardLoaded)return;
 window.__hvDashboardLoaded=true;
 const s=document.createElement('script');
 s.src='js/hoja-vida-dashboard.js?v=20260915-1';
 s.defer=true;
 document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
