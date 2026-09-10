/* RNI28106 — Router limpio para Red profesional v2.
   El módulo real está en red-profesional-v2.js. Este archivo solo garantiza
   que la navegación existente entregue la vista al módulo nuevo.
*/
(function(){
'use strict';
let loading=null;
function loadV2(){
 if(typeof window.renderRedProfesionalV2==='function')return Promise.resolve();
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
   const s=document.createElement('script');
   s.src='js/red-profesional-v2.js?v=20260910-rp2';
   s.onload=()=>resolve();
   s.onerror=reject;
   document.head.appendChild(s);
 });
 return loading;
}
if(typeof render!=='function')return;
const originalRender=render;
render=function(){
 const target=S.view==='clientes'||S.view==='contactos';
 if(!target)return originalRender();
 S.view='contactos';
 loadV2().then(()=>{
   originalRender();
   document.querySelectorAll('[data-nav="clientes"]').forEach(x=>x.remove());
   document.querySelectorAll('#ios-nav-select option[value="clientes"]').forEach(x=>x.remove());
   if(typeof window.renderRedProfesionalV2==='function')window.renderRedProfesionalV2();
 }).catch(err=>console.error('No se pudo cargar Red profesional v2:',err));
};
})();
