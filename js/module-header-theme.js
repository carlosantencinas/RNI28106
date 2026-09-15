// ============================================================
// ENCABEZADOS UNIFICADOS DE MÓDULOS
// Tarjeta blanca + borde redondeado + acento vertical izquierdo.
// Solo modifica presentación; no toca datos ni lógica de negocio.
// ============================================================
(function(){
    'use strict';
    if(document.getElementById('module-header-theme')) return;
    const style=document.createElement('style');
    style.id='module-header-theme';
    style.textContent=`
        #main.app-view{background:var(--bg,#F2F0EB);}
        #main.app-view .page-head{
            --module-accent:var(--primary,#1A4A5C);display:flex;position:relative;align-items:center;
            justify-content:space-between;gap:20px;margin:0 0 22px;padding:18px 20px 18px 22px;
            background:var(--surface,#fff);border:1px solid var(--border,#D9D6CE);
            border-left:5px solid var(--module-accent);border-radius:14px;
            box-shadow:0 3px 12px rgba(0,0,0,.045);overflow:hidden;
        }
        #main.app-view .page-head h1{color:var(--text,#1E1E1E);font-size:23px;line-height:1.2;margin:2px 0 5px;}
        #main.app-view .page-head p:not(.eyebrow){color:var(--text-soft,#5A5A5A);font-size:13px;line-height:1.45;}
        #main.app-view .page-head .eyebrow{color:var(--module-accent)!important;margin-bottom:4px;}
        #main.app-view .page-actions{align-self:center;}
        #main.app-view .fm-head,#main.app-view .hv-head{
            --module-accent:var(--primary,#1A4A5C);position:relative;background:var(--surface,#fff);
            border:1px solid var(--border,#D9D6CE);border-left:5px solid var(--module-accent);
            border-radius:14px;box-shadow:0 3px 12px rgba(0,0,0,.045);padding:18px 20px 18px 22px;
        }
        #main.app-view .fm-head{margin-bottom:18px;--module-accent:#2F8F5B;}
        #main.app-view .hv-head{margin-bottom:18px;--module-accent:#7A4E9E;}
        #main.app-view .fm-head .fm-eyebrow{color:var(--module-accent)!important;}
        #main.app-view .fm-head h1{color:var(--text,#1E1E1E);}
        @media(max-width:700px){
            #main.app-view .page-head,#main.app-view .fm-head,#main.app-view .hv-head{padding:15px 15px 15px 18px;border-radius:12px;}
            #main.app-view .page-head{align-items:flex-start;}
            #main.app-view .page-head h1{font-size:20px;}
            #main.app-view .page-actions{width:100%;}
            #main.app-view .page-actions .btn{flex:1;justify-content:center;}
        }
    `;
    document.head.appendChild(style);

    const accents={
        analisis:'#2878B5',cotizaciones:'#2878B5',administrativo:'#7A4E9E',documentos:'#C47A24',
        finanzas:'#2F8F5B',cuentas:'#2878B5',gastos:'#C46A3A',clientes:'#2F718F',experiencia:'#278A82',
        actividades:'#7A62A8',licitaciones:'#B8862E',contactos:'#4776A8',config:'#667085'
    };
    function applyAccent(){
        const main=document.getElementById('main');
        if(!main)return;
        const view=window.S&&S.view;
        const color=accents[view]||'#1A4A5C';
        main.querySelectorAll('.page-head').forEach(el=>el.style.setProperty('--module-accent',color));
    }
    function observe(){
        const main=document.getElementById('main');
        if(!main)return setTimeout(observe,100);
        applyAccent();
        new MutationObserver(applyAccent).observe(main,{childList:true,subtree:true});
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});
    else observe();
})();
