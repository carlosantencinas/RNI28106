// Navegación de Hoja de Vida: una sola entrada y apertura directa.
(function(){
    'use strict';
    const TYPES=['formacion','cursos','experiencia','publicaciones','eventos','certificados'];

    function injectStyles(){
        if(document.getElementById('hv-nav-ui-css'))return;
        const s=document.createElement('style');
        s.id='hv-nav-ui-css';
        s.textContent=`
/* Hoja de Vida: mismo lenguaje visual de las tablas principales de la aplicación. */
.hvpro{max-width:none!important;margin:0!important;padding:0 0 36px!important}
.hvpro-title{background:#fff!important;border:1px solid var(--border,#d8dde3)!important;border-radius:8px!important;padding:16px 20px!important;margin:0 0 12px!important;box-shadow:0 1px 2px rgba(0,0,0,.04)!important}
.hvpro-kicker{font-size:10px!important;letter-spacing:.08em!important}
.hvpro-title h1{font-size:24px!important;margin:3px 0!important;color:var(--text,#102f3b)!important}
.hvpro-title p{font-size:12px!important;margin:3px 0 0!important;color:var(--text-soft,#68737a)!important}
.hvpro-summary{display:grid!important;grid-template-columns:repeat(6,minmax(105px,1fr))!important;gap:8px!important;margin:0 0 12px!important}
.hvpro-summary>div{background:#fff!important;border:1px solid var(--border,#d8dde3)!important;border-radius:7px!important;padding:9px 11px!important;min-height:52px!important;box-sizing:border-box!important}
.hvpro-summary b{font-size:18px!important;display:block!important;color:var(--text,#102f3b)!important}
.hvpro-summary span{font-size:10px!important;color:var(--text-soft,#68737a)!important;white-space:normal!important}
.hvpro-card{background:#fff!important;border:1px solid var(--border,#d8dde3)!important;border-radius:8px!important;margin:0 0 12px!important;overflow:hidden!important;box-shadow:0 1px 2px rgba(0,0,0,.03)!important}
.hvpro-head{padding:12px 14px!important;background:#fff!important;border-bottom:1px solid #e5e8eb!important;align-items:center!important}
.hvpro-head h2{font-size:14px!important;margin:0 0 2px!important;color:var(--text,#102f3b)!important}
.hvpro-head span{font-size:10px!important;color:var(--text-soft,#68737a)!important}
.hvpro-tools{display:flex!important;gap:8px!important;align-items:center!important;background:#f1f3f5!important;border-radius:7px!important;padding:7px!important}
.hvpro-tools input{height:32px!important;min-width:210px!important;border:1px solid #d3d8dd!important;border-radius:6px!important;padding:0 10px!important;background:#fff!important;font-size:12px!important;box-sizing:border-box!important}
.hvpro-table-wrap{width:100%!important;overflow-x:auto!important}
.hvpro-table{width:100%!important;border-collapse:collapse!important;font-size:12px!important;min-width:760px!important}
.hvpro-table th{padding:8px 10px!important;text-align:left!important;font-size:9px!important;text-transform:uppercase!important;letter-spacing:.03em!important;color:#53616a!important;background:#fff!important;border-bottom:1px solid #cfd5da!important;white-space:nowrap!important}
.hvpro-table td{padding:9px 10px!important;border-bottom:1px solid #e1e5e8!important;vertical-align:top!important;color:var(--text,#102f3b)!important;line-height:1.3!important}
.hvpro-table tbody tr:hover{background:#f8fafb!important}
.hvpro-actions{display:flex!important;gap:4px!important;flex-wrap:nowrap!important}
.hvpro-actions .btn{font-size:10px!important;padding:5px 7px!important;white-space:nowrap!important}
.hvpro-empty{padding:22px 14px!important;color:var(--text-soft,#68737a)!important;font-size:12px!important}
.hvpro-personal{padding:12px 14px!important;display:grid!important;grid-template-columns:repeat(4,minmax(140px,1fr))!important;gap:8px!important}
.hvpro-personal>div{border:1px solid #e0e4e7!important;border-radius:6px!important;padding:8px 10px!important;background:#fafbfc!important}
.hvpro-personal small{font-size:9px!important;text-transform:uppercase!important;color:#73808a!important;display:block!important;margin-bottom:3px!important}
.hvpro-personal strong{font-size:12px!important;font-weight:600!important}
@media(max-width:900px){.hvpro-summary{grid-template-columns:repeat(3,minmax(100px,1fr))!important}.hvpro-personal{grid-template-columns:repeat(2,minmax(130px,1fr))!important}}
@media(max-width:600px){.hvpro-title{padding:13px!important}.hvpro-title h1{font-size:21px!important}.hvpro-title{flex-direction:column!important}.hvpro-title .btn{width:100%!important}.hvpro-summary{grid-template-columns:repeat(2,minmax(100px,1fr))!important}.hvpro-head{align-items:stretch!important;flex-direction:column!important}.hvpro-tools{margin-top:8px!important}.hvpro-tools input{min-width:0!important;width:100%!important}.hvpro-personal{grid-template-columns:1fr!important}.hvpro-table{min-width:700px!important}}
`;
        document.head.appendChild(s);
    }

    async function openHV(){
        if(!window.HojaVidaPro){setTimeout(openHV,150);return;}
        try{
            if(window.HojaVidaPro.loadType)await Promise.all(TYPES.map(t=>window.HojaVidaPro.loadType(t)));
        }catch(e){console.warn('HV navegación: carga parcial',e);}
        if(window.S)S.view='hoja-vida';
        window.HojaVidaPro.render();
    }

    function cleanDesktop(nav){
        if(!nav)return;
        nav.querySelectorAll('.nav-btn:not([data-hv-native])').forEach(btn=>{
            if((btn.textContent||'').trim().toLowerCase().includes('hoja de vida')){
                const group=btn.closest('.nav-group');
                if(group)group.remove();else btn.remove();
            }
        });
    }

    function addDesktop(nav){
        if(!nav||nav.querySelector('[data-hv-native]'))return;
        cleanDesktop(nav);
        const group=document.createElement('div');
        group.className='nav-group';
        group.innerHTML='<div class="nav-group-title">Trayectoria</div><button class="nav-btn" data-hv-native title="Hoja de Vida"><span class="nav-icon">📄</span><span class="nav-label">Hoja de Vida</span></button>';
        nav.appendChild(group);
        group.querySelector('[data-hv-native]').onclick=function(e){e.preventDefault();e.stopPropagation();openHV();};
    }

    function addIOS(){
        const select=document.getElementById('ios-nav-select');
        if(!select)return;
        let opt=select.querySelector('option[value="hoja-vida"]');
        if(!opt){
            const group=document.createElement('optgroup');group.label='Trayectoria';
            opt=document.createElement('option');opt.value='hoja-vida';opt.textContent='Hoja de Vida';
            group.appendChild(opt);select.appendChild(group);
        }
        if(select.dataset.hvBound==='1')return;
        select.dataset.hvBound='1';
        select.addEventListener('change',function(e){
            if(this.value!=='hoja-vida')return;
            e.preventDefault();e.stopImmediatePropagation();openHV();
        },true);
    }

    function addOverlay(){
        const overlay=document.getElementById('mobile-nav-overlay');
        if(!overlay||overlay.querySelector('[data-hv-native]'))return;
        const menu=overlay.querySelector('div');if(!menu)return;
        const section=document.createElement('div');
        section.style.cssText='padding:12px 16px;border-bottom:1px solid #EEE;';
        section.innerHTML='<div style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Trayectoria</div><button class="nav-btn-overlay" data-hv-native style="display:block;width:100%;text-align:left;padding:10px 12px;border:none;background:none;font-size:15px;color:#111;cursor:pointer;">📄 Hoja de Vida</button>';
        section.querySelector('[data-hv-native]').onclick=function(e){e.preventDefault();e.stopPropagation();overlay.remove();openHV();};
        menu.appendChild(section);
    }

    function patchMobileOverlay(){
        if(typeof window.toggleMobileMenuOverlay!=='function'||window.__hvOverlayPatched)return;
        const original=window.toggleMobileMenuOverlay;
        window.toggleMobileMenuOverlay=function(){original();setTimeout(addOverlay,0);};
        window.__hvOverlayPatched=true;
    }

    function tick(){
        injectStyles();
        const nav=document.getElementById('nav');
        if(nav){if(nav.classList.contains('ios-nav'))addIOS();else addDesktop(nav);}
        addOverlay();
        patchMobileOverlay();
    }

    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(tick,500));
    else setTimeout(tick,500);
    setInterval(tick,800);
})();
