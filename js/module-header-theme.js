// ============================================================
// SISTEMA VISUAL UNIFICADO DE MÓDULOS
// Encabezados = mismo lenguaje visual que el Panel Ejecutivo.
// Cuadros resumen = tarjeta blanca + acento lateral.
// Tablas y gráficos extensos = superficie blanca limpia, sin acento.
// ============================================================
(function(){
'use strict';
if(document.getElementById('module-header-theme')) return;
const style=document.createElement('style');
style.id='module-header-theme';
style.textContent=`
#main.app-view{background:#F2F0EB;}

/* ENCABEZADO COMÚN */
#main.app-view .page-head,#main.app-view .fm-head,#main.app-view .hv-head{
position:relative;display:flex;align-items:center;justify-content:space-between;gap:24px;
margin:0 0 22px;padding:24px 26px;background:linear-gradient(135deg,#102F3A 0%,#1A4A5C 62%,#21677A 100%);
color:#fff;border:1px solid rgba(255,255,255,.08);border-radius:18px;box-shadow:0 8px 24px rgba(16,47,58,.14);overflow:hidden;
}
#main.app-view .page-head::after,#main.app-view .fm-head::after,#main.app-view .hv-head::after{content:'';position:absolute;right:-45px;top:-55px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.055);pointer-events:none;}
#main.app-view .page-head h1,#main.app-view .fm-head h1,#main.app-view .hv-head h1{color:#fff;font-size:24px;line-height:1.2;font-weight:700;margin:3px 0 6px;}
#main.app-view .page-head p:not(.eyebrow),#main.app-view .fm-head p:not(.fm-eyebrow),#main.app-view .hv-head p:not(.eyebrow){color:rgba(255,255,255,.76);font-size:13.5px;line-height:1.5;}
#main.app-view .page-head .eyebrow,#main.app-view .fm-head .fm-eyebrow,#main.app-view .hv-head .eyebrow{color:#8FD1D0!important;font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;margin:0 0 5px;}
#main.app-view .page-actions,#main.app-view .fm-head-actions,#main.app-view .hv-head-right{position:relative;z-index:1;align-self:center;}
#main.app-view .page-head .btn-primary,#main.app-view .fm-head .btn-primary,#main.app-view .hv-head .btn-primary{background:#fff;color:#1A4A5C;border-color:rgba(255,255,255,.8);}

/* COLORES DE ACENTO: solo para cuadros resumen */
#main[data-module-view="analisis"]{--module-accent:#2878B5}#main[data-module-view="cotizaciones"]{--module-accent:#2878B5}
#main[data-module-view="administrativo"]{--module-accent:#8E63AD}#main[data-module-view="documentos"]{--module-accent:#C47A24}
#main[data-module-view="finanzas"]{--module-accent:#3F9B72}#main[data-module-view="cuentas"]{--module-accent:#2878B5}
#main[data-module-view="gastos"]{--module-accent:#C46A3A}#main[data-module-view="clientes"]{--module-accent:#2F718F}
#main[data-module-view="experiencia"]{--module-accent:#278A82}#main[data-module-view="actividades"]{--module-accent:#7A62A8}
#main[data-module-view="licitaciones"]{--module-accent:#B8862E}#main[data-module-view="contactos"]{--module-accent:#4776A8}
#main[data-module-view="config"]{--module-accent:#667085}

/* CUADROS RESUMEN */
#main.app-view .panel,#main.app-view .dash-card,#main.app-view .content-card{
position:relative;background:#fff;border:1px solid #D9D6CE;border-left:4px solid var(--module-accent,#2F7890);border-radius:14px;box-shadow:0 3px 12px rgba(0,0,0,.045);overflow:hidden;
}
#main.app-view .panel-h,#main.app-view .dash-card-head{background:#fff;border-bottom:1px solid #E7E3DB;}
#main.app-view .kpi{background:#fff;border:1px solid #D9D6CE;border-radius:14px;box-shadow:0 2px 9px rgba(0,0,0,.035);}

/* TABLAS Y LISTADOS LARGOS: blanco, sin franja lateral */
#main.app-view .table-panel,#main.app-view .table-wrap,#main.app-view .table-container,#main.app-view .data-table-wrap,#main.app-view .list-panel,#main.app-view .data-card,#main.app-view .table-card{
position:relative;background:#fff!important;border:1px solid #D9D6CE!important;border-left:1px solid #D9D6CE!important;border-radius:14px;box-shadow:0 3px 12px rgba(0,0,0,.045);overflow:hidden;
}
#main.app-view table,#main.app-view .data-table,#main.app-view .modern-table{width:100%;background:#fff;border-collapse:separate;border-spacing:0;}
#main.app-view table thead,#main.app-view .data-table thead,#main.app-view .modern-table thead{background:#F7F8F8;}
#main.app-view table tbody tr,#main.app-view .data-table tbody tr,#main.app-view .modern-table tbody tr{background:#fff;}
#main.app-view table tbody tr:nth-child(even),#main.app-view .data-table tbody tr:nth-child(even),#main.app-view .modern-table tbody tr:nth-child(even){background:#FCFCFB;}
#main.app-view table tbody tr:hover,#main.app-view .data-table tbody tr:hover,#main.app-view .modern-table tbody tr:hover{background:#F4F8F9;}

/* GRÁFICOS EXTENSOS: blanco y sin acento */
#main.app-view .chart-card,#main.app-view .chart-panel,#main.app-view .chart-container,#main.app-view .graph-card,#main.app-view .graph-panel,#main.app-view .analysis-card,#main.app-view .analysis-panel{
background:#fff!important;border:1px solid #D9D6CE!important;border-left:1px solid #D9D6CE!important;border-radius:14px;box-shadow:0 3px 12px rgba(0,0,0,.045);overflow:hidden;
}

@media(max-width:700px){
#main.app-view .page-head,#main.app-view .fm-head,#main.app-view .hv-head{align-items:flex-start;flex-direction:column;padding:20px 18px;border-radius:15px;}
#main.app-view .page-head h1,#main.app-view .fm-head h1,#main.app-view .hv-head h1{font-size:21px;}
#main.app-view .page-actions,#main.app-view .fm-head-actions,#main.app-view .hv-head-right{width:100%;}
}
`;
document.head.appendChild(style);
})();
