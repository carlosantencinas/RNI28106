// ============================================================
// COMPATIBILIDAD VISUAL DE MÓDULOS
// El sistema visual principal vive en css/design-system.css.
// Este archivo conserva compatibilidad y carga mejoras UI puntuales.
// ============================================================
(function(){
'use strict';
if(document.getElementById('module-header-theme')) return;
const style=document.createElement('style');
style.id='module-header-theme';
style.textContent=`
#main.app-view .fm-hero{background:#fff!important;border:1px solid var(--border)!important;box-shadow:var(--shadow-sm);}
#main.app-view .fm-table th{background:var(--surface-subtle);}
#main.app-view .fm-table-head{background:#fff;border-bottom:1px solid var(--border-subtle);}
`;
document.head.appendChild(style);
[
  'js/cotizaciones-enhancements.js?v=20260917-2',
  'js/hoja-vida-docencia-ui.js?v=20260917-1'
].forEach(function(src){
  if(document.querySelector('script[src^="'+src.split('?')[0]+'"]')) return;
  const s=document.createElement('script');s.src=src;s.defer=false;document.head.appendChild(s);
});
})();