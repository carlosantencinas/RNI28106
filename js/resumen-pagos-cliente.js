// Resumen compartible de pagos por cobrar. Solo lectura: no modifica pagos ni Firebase.
(function(global){
'use strict';
const esc=v=>typeof global.esc==='function'?global.esc(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'Bs '+(Number(v)||0).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2});
function parseMoney(s){
 let v=String(s||'').replace(/[^0-9,.-]/g,'');
 if(v.includes(',')&&v.includes('.')) v=v.lastIndexOf(',')>v.lastIndexOf('.')?v.replace(/\./g,'').replace(',','.'):v.replace(/,/g,'');
 else if(v.includes(',')) v=v.replace(',','.');
 const n=Number(v);return Number.isFinite(n)?n:0;
}
function addActions(){
 const table=document.querySelector('.fm-table');if(!table)return;
 const head=table.querySelector('thead tr');
 if(head&&!head.querySelector('.rp-action-head')){const th=document.createElement('th');th.className='rp-action-head';th.textContent='Reporte';head.appendChild(th);}
 table.querySelectorAll('tbody tr').forEach((tr,i)=>{
  if(tr.querySelector('.rp-open'))return;
  const td=document.createElement('td'),b=document.createElement('button');b.type='button';b.className='btn btn-sm btn-ghost rp-open';b.textContent='Generar resumen';b.addEventListener('click',()=>openFromRow(tr));td.appendChild(b);tr.appendChild(td);
 });
}
function openFromRow(tr){
 const cells=tr.querySelectorAll('td');if(cells.length<8)return;
 const total=parseMoney(cells[4].textContent),paid=Math.min(total,parseMoney(cells[5].textContent)),balance=Math.max(0,total-paid);
 const client=cells[1].innerText.trim()||'Cliente',concept=cells[2].innerText.trim()||'Servicio profesional';
 document.getElementById('rp-overlay')?.remove();
 const o=document.createElement('div');o.id='rp-overlay';o.className='rp-overlay';
 o.innerHTML=`<section class="rp-modal" role="dialog" aria-modal="true" aria-labelledby="rp-title"><header class="rp-head"><div><span class="rp-eyebrow">RESUMEN PARA CLIENTE</span><h2 id="rp-title">Estado de pagos</h2><p>${esc(client)} · ${esc(concept)}</p></div><button class="rp-close" type="button" aria-label="Cerrar">×</button></header><div class="rp-form"><label for="rp-current">Pago actual solicitado (opcional)</label><div class="rp-input-wrap"><span>Bs</span><input id="rp-current" type="number" min="0" step="0.01" placeholder="Dejar vacío si no corresponde"></div><small>El importe solicitado no se registra como pago recibido.</small></div><div id="rp-preview"></div><footer class="rp-actions"><button type="button" class="btn btn-ghost" id="rp-copy">Copiar para WhatsApp</button><button type="button" class="btn btn-primary" id="rp-print">Imprimir / Guardar PDF</button></footer></section>`;
 o.dataset.total=total;o.dataset.paid=paid;o.dataset.client=client;o.dataset.concept=concept;
 o.querySelector('.rp-close').onclick=()=>o.remove();o.addEventListener('click',e=>{if(e.target===o)o.remove();});
 o.querySelector('#rp-current').addEventListener('input',()=>updatePreview(o));
 o.querySelector('#rp-copy').onclick=()=>copySummary(o);o.querySelector('#rp-print').onclick=()=>printSummary(o);
 document.body.appendChild(o);updatePreview(o);
}
function updatePreview(o){
 const total=Number(o.dataset.total)||0,paid=Number(o.dataset.paid)||0,raw=o.querySelector('#rp-current').value.trim(),actual=raw===''?null:Number(raw),balance=Math.max(0,total-paid),valid=actual===null||(Number.isFinite(actual)&&actual>=0&&actual<=balance+.000001),requested=actual===null?0:Math.max(0,actual),projected=Math.max(0,balance-requested);
 const pct=n=>total>0?Math.min(100,Math.max(0,n/total*100)):0,pt=n=>pct(n).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2})+'%',fmt=money;
 o.dataset.actual=actual===null?'':actual;o.dataset.valid=valid?'1':'0';o.dataset.projected=projected;
 o.querySelector('#rp-preview').innerHTML=`<div class="rp-total"><span>Monto total</span><strong>${fmt(total)}</strong></div><div class="rp-legend"><span><i class="rp-dot rp-paid"></i>Pagado</span>${actual!==null?'<span><i class="rp-dot rp-request"></i>Pago solicitado</span>':''}<span><i class="rp-dot rp-balance"></i>Saldo</span></div><div class="rp-bar"><span class="rp-segment rp-paid" style="width:${pct(paid)}%"></span>${actual!==null?`<span class="rp-segment rp-request" style="width:${pct(requested)}%"></span>`:''}<span class="rp-segment rp-balance" style="width:${pct(projected)}%"></span></div><div class="rp-table-wrap"><table class="rp-table"><thead><tr><th>Concepto</th><th>Importe</th><th>Porcentaje</th></tr></thead><tbody><tr><td>Pagos realizados acumulados</td><td>${fmt(paid)}</td><td>${pt(paid)}</td></tr>${actual!==null?`<tr><td>Pago actual solicitado</td><td>${fmt(requested)}</td><td>${pt(requested)}</td></tr>`:''}<tr class="rp-balance-row"><td>${actual!==null?'Saldo proyectado después del pago':'Saldo pendiente actual'}</td><td>${fmt(projected)}</td><td>${pt(projected)}</td></tr><tr class="rp-grand-total"><td>Total</td><td>${fmt(total)}</td><td>100,00%</td></tr></tbody></table></div>${valid?'':'<p class="rp-error">El pago solicitado supera el saldo disponible. Corrige el importe para compartir.</p>'}<p class="rp-note">El pago solicitado se considera pendiente hasta su recepción efectiva.</p>`;
}
function summary(o){
 updatePreview(o);if(o.dataset.valid!=='1')return '';
 const total=Number(o.dataset.total)||0,paid=Number(o.dataset.paid)||0,actual=o.dataset.actual===''?null:Number(o.dataset.actual),projected=Number(o.dataset.projected)||0;
 const pct=n=>total>0?(n/total*100).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2}):'0,00';
 return `*RESUMEN DE PAGOS*\nCliente: ${o.dataset.client}\nConcepto: ${o.dataset.concept}\n\nTotal: ${money(total)}\nPagos realizados: ${money(paid)} (${pct(paid)}%)${actual!==null?'\nPago actual solicitado: '+money(actual)+' ('+pct(actual)+'%)':''}\n${actual!==null?'Saldo proyectado':'Saldo pendiente'}: ${money(projected)} (${pct(projected)}%)\n\nEl pago solicitado se considera pendiente hasta su recepción efectiva.`;
}
async function copySummary(o){
 const s=summary(o);if(!s){alert('El pago solicitado supera el saldo disponible.');return;}
 try{await navigator.clipboard.writeText(s);}catch(_){const t=document.createElement('textarea');t.value=s;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}
 if(typeof global.toast==='function')global.toast('Resumen copiado para compartir.');
}
function printSummary(o){if(!summary(o)){alert('Corrige el pago actual antes de imprimir.');return;}window.print();}
const style=document.createElement('style');
style.textContent=`.rp-overlay{position:fixed;inset:0;z-index:99999;background:rgba(16,47,59,.48);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}.rp-modal{width:min(760px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;color:#102F3B;border:1px solid #D9D6CE;border-radius:14px;box-shadow:0 20px 70px #0003;padding:22px}.rp-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.rp-head h2{font-size:22px;margin:4px 0}.rp-head p{font-size:12px;color:#68737A;margin:0}.rp-eyebrow{font-size:10px;font-weight:750;letter-spacing:.08em;color:#1A4A5C}.rp-close{border:0;background:#F2F0EB;border-radius:8px;width:34px;height:34px;font-size:24px;cursor:pointer}.rp-form{padding:14px;background:#F2F0EB;border:1px solid #D9D6CE;border-radius:10px;margin-bottom:18px}.rp-form label{display:block;font-size:12px;font-weight:650;margin-bottom:7px}.rp-input-wrap{display:flex;align-items:center;gap:8px}.rp-input-wrap input{width:100%;min-width:0;padding:10px 12px;border:1px solid #C8C5BC;border-radius:7px;background:#fff;font:inherit}.rp-form small,.rp-note{display:block;color:#68737A;font-size:11px;margin-top:7px}.rp-total{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #D9D6CE}.rp-total span{font-size:12px;color:#68737A}.rp-total strong{font-size:25px;color:#1A4A5C}.rp-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:#68737A;margin:15px 0 8px}.rp-legend span{display:flex;align-items:center;gap:6px}.rp-dot{width:9px;height:9px;border-radius:50%;display:inline-block}.rp-paid{background:#16805C}.rp-request{background:#1A4A5C}.rp-balance{background:#B7791F}.rp-bar{display:flex;width:100%;height:14px;border-radius:8px;overflow:hidden;background:#e8e7e2;margin-bottom:18px}.rp-segment{height:100%;display:block}.rp-table-wrap{overflow:auto}.rp-table{width:100%;border-collapse:collapse;font-size:12px}.rp-table th,.rp-table td{padding:10px 8px;border-bottom:1px solid #D9D6CE;text-align:left}.rp-table th{font-size:10px;text-transform:uppercase;color:#68737A}.rp-table td:nth-child(n+2),.rp-table th:nth-child(n+2){text-align:right;white-space:nowrap}.rp-balance-row td{color:#94620e}.rp-grand-total td{font-weight:750;border-bottom:0}.rp-error{font-size:12px;color:#C24141;font-weight:650;margin-top:10px}.rp-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:20px}.rp-note{margin-top:12px}@media(max-width:600px){.rp-overlay{padding:8px;align-items:flex-start}.rp-modal{padding:15px;margin:auto 0;max-height:calc(100vh - 16px)}.rp-actions{flex-direction:column}.rp-actions button{width:100%}}@media print{body>*:not(#rp-overlay){display:none!important}#rp-overlay{position:static!important;display:block!important;background:#fff!important;padding:0!important;overflow:visible!important}#rp-overlay .rp-modal{width:100%!important;max-height:none!important;overflow:visible!important;box-shadow:none!important;border:0!important;padding:0!important}#rp-overlay .rp-form,#rp-overlay .rp-actions,#rp-overlay .rp-close{display:none!important}.rp-bar{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`;
document.head.appendChild(style);
function wrapRender(name){const original=global[name];if(typeof original!=='function'||original.__rpWrapped)return;const wrapped=function(){const result=original.apply(this,arguments);addActions();return result;};wrapped.__rpWrapped=true;global[name]=wrapped;}
wrapRender('viewFinanzasModern');wrapRender('viewFinanzas');
document.addEventListener('DOMContentLoaded',addActions);
})(window);
