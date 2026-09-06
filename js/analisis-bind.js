// ============================================================
// ANÁLISIS · EVENTOS DELEGADOS
// Permite que los filtros y selecciones sigan funcionando después
// de cada actualización del panel, sin depender de listeners locales.
// ============================================================
(function(){
    'use strict';
    if(window.__analysisBindReady)return;window.__analysisBindReady=true;
    const state=window.__analysisUI;
    function refresh(){if(typeof renderAnalisis==='function'){const main=document.getElementById('main');if(main&&S.view==='analisis')main.innerHTML=renderAnalisis();}}
    document.addEventListener('change',e=>{
        if(!e.target.matches('[data-ai-period],[data-ai-from],[data-ai-to]'))return;
        if(!window.__analysisUI)return;
        if(e.target.matches('[data-ai-period]')){state.period=e.target.value;if(state.period!=='custom'){if(state.period==='todo'){state.from='';state.to='';}else{const months=Number(state.period),now=new Date(),from=new Date(now.getFullYear(),now.getMonth()-months+1,1);state.from=from.toISOString().slice(0,10);state.to=now.toISOString().slice(0,10);}}}
        if(e.target.matches('[data-ai-from]')){state.period='custom';state.from=e.target.value;}
        if(e.target.matches('[data-ai-to]')){state.period='custom';state.to=e.target.value;}
        refresh();
    });
    document.addEventListener('click',e=>{
        const area=e.target.closest('[data-ai-area]');
        if(area&&window.__analysisUI){window.__analysisUI.area=area.dataset.aiArea;refresh();return;}
        const select=e.target.closest('[data-select]');
        if(select&&window.__analysisUI){window.__analysisUI.selected=select.dataset.select;refresh();}
    });
})();
