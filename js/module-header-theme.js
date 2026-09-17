// ============================================================
// COMPATIBILIDAD VISUAL Y CARGA DE MEJORAS
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
/* Icono visible de Hoja de Vida en la navegación */
#sidebar .nav-btn[data-nav="hoja-vida"] .nav-icon::before{content:'📄';display:block;font-size:16px;line-height:18px;}
#sidebar .nav-btn[data-nav="hoja-vida"] .nav-icon svg{display:none;}
`;
document.head.appendChild(style);

function loadOnce(src,id){
    if(document.getElementById(id))return;
    const s=document.createElement('script');
    s.id=id;
    s.src=src;
    s.defer=false;
    s.onload=function(){console.info('Mejora cargada:',src);};
    s.onerror=function(e){console.error('No se pudo cargar:',src,e);};
    document.head.appendChild(s);
}

// Se cargan después de los módulos base, evitando duplicar formularios.
loadOnce('js/hoja-vida-docencia-ui.js','hv-docencia-runtime');
loadOnce('js/cotizaciones-enhancements.js','cotizaciones-enhancements-runtime');
})();
