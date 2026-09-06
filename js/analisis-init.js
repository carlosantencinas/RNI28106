// Inicializa el filtro predeterminado del panel analítico en 12 meses.
(function(){
    'use strict';
    const s=window.__analysisUI;
    if(!s||s.period==='todo'||s.period==='custom'||s.from||s.to)return;
    const now=new Date(),from=new Date(now.getFullYear(),now.getMonth()-11,1);
    s.from=from.toISOString().slice(0,10);s.to=now.toISOString().slice(0,10);
})();
