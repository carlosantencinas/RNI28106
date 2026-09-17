// ============================================================
// COMPATIBILIDAD VISUAL DE MÓDULOS
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
#sidebar .nav-btn[data-nav="hoja-vida"] .nav-icon::before{content:'📄';display:block;font-size:16px;line-height:18px;}
#sidebar .nav-btn[data-nav="hoja-vida"] .nav-icon svg{display:none;}
`;
document.head.appendChild(style);
})();
