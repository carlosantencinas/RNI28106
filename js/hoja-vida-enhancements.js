(function(){
'use strict';
function route(type){
    if(!window.S||typeof render!=='function')return;
    S.view='experiencia';
    S.editingCV=false;
    render();
    setTimeout(function(){
        if(type==='experiencia'){
            var b=document.getElementById('btn-new-exp');
            if(b)b.click();
            return;
        }
        S.editingCV=true;
        render();
        setTimeout(function(){
            var id=type==='formacion'?'cv-add-formacion':type==='cursos'?'cv-add-curso':null;
            var b=id&&document.getElementById(id);
            if(b)b.click();
        },120);
    },120);
}
function fixIcon(){
    var b=document.querySelector('[data-nav="hoja-vida"] .nav-icon svg');
    if(!b||b.dataset.hvFixed==='1')return;
    b.innerHTML='<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>';
    b.dataset.hvFixed='1';
}
function install(){
    document.addEventListener('click',function(e){
        var b=e.target.closest&&e.target.closest('[data-hv-add]');
        if(b){e.preventDefault();e.stopImmediatePropagation();route(b.dataset.hvAdd);return;}
        b=e.target.closest&&e.target.closest('[data-hv-edit]');
        if(b){e.preventDefault();e.stopImmediatePropagation();route(b.dataset.hvEdit);}
    },true);
    document.addEventListener('rni:rendered',function(){setTimeout(fixIcon,20);});
    setTimeout(fixIcon,300);
    var s=document.createElement('style');
    s.id='hv-safe-fixes';
    s.textContent='.hv-table-wrap{overflow-x:auto}.hv-table{min-width:900px}';
    document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
