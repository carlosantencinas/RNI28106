// ============================================================
// COMPATIBILIDAD VISUAL DE MÓDULOS
// El sistema visual principal vive en css/design-system.css.
// Este archivo conserva únicamente compatibilidad con módulos
// antiguos que todavía no usan las clases del sistema.
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
})();
