// Navegación de Hoja de Vida: una sola entrada y apertura directa.
(function(){
    'use strict';
    const TYPES=['formacion','cursos','experiencia','publicaciones','eventos','certificados'];

    async function openHV(){
        if(!window.HojaVidaPro){setTimeout(openHV,150);return;}
        try{
            if(window.HojaVidaPro.loadType) await Promise.all(TYPES.map(t=>window.HojaVidaPro.loadType(t)));
        }catch(e){console.warn('HV navegación: carga parcial',e);}
        if(window.S) S.view='hoja-vida';
        window.HojaVidaPro.render();
    }

    function cleanDesktop(nav){
        if(!nav)return;
        nav.querySelectorAll('.nav-btn').forEach(btn=>{
            if((btn.textContent||'').trim().toLowerCase().includes('hoja de vida')){
                const group=btn.closest('.nav-group');
                if(group)group.remove();else btn.remove();
            }
        });
    }

    function addDesktop(nav){
        if(!nav)return;
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
            const group=document.createElement('optgroup');
            group.label='Trayectoria';
            opt=document.createElement('option');
            opt.value='hoja-vida';
            opt.textContent='Hoja de Vida';
            group.appendChild(opt);
            select.appendChild(group);
        }
        if(select.dataset.hvBound==='1')return;
        select.dataset.hvBound='1';
        // Captura antes del onchange nativo de render.js para evitar que vuelva al Dashboard.
        select.addEventListener('change',function(e){
            if(this.value!=='hoja-vida')return;
            e.preventDefault();
            e.stopImmediatePropagation();
            openHV();
        },true);
    }

    function addOverlay(){
        const overlay=document.getElementById('mobile-nav-overlay');
        if(!overlay || overlay.querySelector('[data-hv-native]'))return;
        const menu=overlay.querySelector('div');
        if(!menu)return;
        const section=document.createElement('div');
        section.style.cssText='padding:12px 16px;border-bottom:1px solid #EEE;';
        section.innerHTML='<div style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Trayectoria</div><button class="nav-btn-overlay" data-hv-native style="display:block;width:100%;text-align:left;padding:10px 12px;border:none;background:none;font-size:15px;color:#111;cursor:pointer;">📄 Hoja de Vida</button>';
        section.querySelector('[data-hv-native]').onclick=function(e){e.preventDefault();e.stopPropagation();overlay.remove();openHV();};
        menu.appendChild(section);
    }

    function patchMobileOverlay(){
        if(typeof window.toggleMobileMenuOverlay!=='function' || window.__hvOverlayPatched)return;
        const original=window.toggleMobileMenuOverlay;
        window.toggleMobileMenuOverlay=function(){original();setTimeout(addOverlay,0);};
        window.__hvOverlayPatched=true;
    }

    function tick(){
        const nav=document.getElementById('nav');
        if(nav){
            if(nav.classList.contains('ios-nav')) addIOS();
            else addDesktop(nav);
        }
        addOverlay();
        patchMobileOverlay();
    }

    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(tick,500));
    else setTimeout(tick,500);
    setInterval(tick,800);
})();
