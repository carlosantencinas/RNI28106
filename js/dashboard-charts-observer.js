// Re-monta las gráficas cuando render() reemplaza el contenido de #main.
(function(){
    function schedule(){
        setTimeout(function(){
            if(typeof S!=='undefined' && S.view==='dashboard' && typeof renderDashboardCharts==='function') renderDashboardCharts();
        },120);
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule); else schedule();
    const main=document.getElementById('main');
    if(main){
        new MutationObserver(function(){
            if(typeof S!=='undefined' && S.view==='dashboard' && !document.getElementById('dashboard-charts')) schedule();
        }).observe(main,{childList:true});
    }
})();
