/* Navegación de Hoja de Vida: una sola entrada en PC, móvil e iPhone. */
(function(){
'use strict';
let opening=false;
async function openHV(){
 if(opening)return;
 if(!window.HojaVidaPro){setTimeout(openHV,150);return;}
 opening=true;
 try{
  if(window.S)S.view='hoja-vida';
  if(window.HojaVidaPro.load)await window.HojaVidaPro.load();
  window.HojaVidaPro.render();
 }catch(e){console.warn('Hoja de Vida: carga parcial',e);if(window.HojaVidaPro)window.HojaVidaPro.render();}
 finally{opening=false;}
}
function cleanDesktop(nav){if(!nav)return;nav.querySelectorAll('.nav-group').forEach(function(group){Array.from(group.querySelectorAll('.nav-btn')).forEach(function(btn){if((btn.textContent||'').toLowerCase().includes('hoja de vida'))btn.remove();});if(!group.querySelector('.nav-btn'))group.remove();});}
function addDesktop(nav){if(!nav||nav.classList.contains('ios-nav'))return;cleanDesktop(nav);if(nav.querySelector('[data-hv-entry]'))return;const group=document.createElement('div');group.className='nav-group';group.dataset.hvGroup='1';group.innerHTML='<div class="nav-group-title">Trayectoria</div><button class="nav-btn" data-hv-entry title="Hoja de Vida"><span class="nav-icon">📄</span><span class="nav-label">Hoja de Vida</span></button>';nav.appendChild(group);group.querySelector('[data-hv-entry]').onclick=function(e){e.preventDefault();e.stopPropagation();openHV();};}
function addIOS(){const select=document.getElementById('ios-nav-select');if(!select)return;if(!select.querySelector('option[value="hoja-vida"]')){const group=document.createElement('optgroup');group.label='Trayectoria';const opt=document.createElement('option');opt.value='hoja-vida';opt.textContent='Hoja de Vida';group.appendChild(opt);select.appendChild(group);}if(select.dataset.hvBound==='1')return;select.dataset.hvBound='1';select.addEventListener('change',function(e){if(this.value!=='hoja-vida')return;e.preventDefault();e.stopImmediatePropagation();openHV();},true);}
function addOverlay(){const overlay=document.getElementById('mobile-nav-overlay');if(!overlay)return;const menu=overlay.querySelector('div');if(!menu||menu.querySelector('[data-hv-entry]'))return;const section=document.createElement('div');section.style.cssText='padding:12px 16px;border-bottom:1px solid #EEE;';section.innerHTML='<div style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;">Trayectoria</div><button class="nav-btn-overlay" data-hv-entry style="display:block;width:100%;text-align:left;padding:10px 12px;border:none;background:none;font-size:15px;color:#111;cursor:pointer;">📄 Hoja de Vida</button>';section.querySelector('[data-hv-entry]').onclick=function(e){e.preventDefault();e.stopPropagation();overlay.remove();openHV();};menu.appendChild(section);}
function patchOverlay(){if(typeof window.toggleMobileMenuOverlay!=='function'||window.__hvOverlayPatched)return;const original=window.toggleMobileMenuOverlay;window.toggleMobileMenuOverlay=function(){original();setTimeout(addOverlay,20);};window.__hvOverlayPatched=true;}
function tick(){const nav=document.getElementById('nav');if(nav){addDesktop(nav);addIOS();}addOverlay();patchOverlay();}
setTimeout(tick,300);setInterval(tick,1000);
})();
