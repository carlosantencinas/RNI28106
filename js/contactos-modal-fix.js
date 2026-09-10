/* Contactos y clientes — reparación robusta del modal */
(function(w){
'use strict';
if(w.__contactosModalFix)return;
w.__contactosModalFix=true;
const N=v=>String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const U=()=>w.uid?w.uid():`ct-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const F=(...xs)=>{for(const x of xs){if(x===null||x===undefined)continue;if(typeof x==='object'){const y=F(x.nombre,x.nombreCompleto,x.razonSocial,x.empresa,x.name,x.titular);if(y)return y}else{const s=String(x).trim();if(s)return s}}return ''};
function quoteName(q){return F(q?.cliente,q?.clienteNombre,q?.nombreCliente,q?.razonSocial,q?.empresa,q?.datosCliente?.nombre,q?.datosCliente?.razonSocial,q?.datosCliente?.empresa)}
function paymentName(p){return F(p?.cliente,p?.entidad,p?.clienteNombre,p?.nombreCliente,p?.razonSocial)}
function saveClientRecord(c){
  if(!c.esCliente)return;
  S.clientes=Array.isArray(S.clientes)?S.clientes:[];
  const name=c.clienteNombre||c.empresa||c.nombre;
  let cl=c.clienteId&&S.clientes.find(x=>N(x.id)===N(c.clienteId));
  if(!cl)cl=S.clientes.find(x=>N(F(x.nombre,x.razonSocial,x.cliente,x.empresa))===N(name));
  if(!cl){cl={id:c.clienteId||U(),nombre:name};S.clientes.push(cl)}
  Object.assign(cl,{nombre:name,contactoId:c.id,contacto:c.nombre,personaContacto:c.nombre,cargo:c.cargo||'',telefono:c.telefono||'',whatsapp:c.whatsapp||'',email:c.email||'',nit:c.nit||'',documento:c.documento||'',ciudad:c.ciudad||'',direccion:c.direccion||'',notas:c.notas||'',tipoPersona:c.tipoPersona||'persona',proyectos:Array.isArray(c.proyectos)?c.proyectos:[]});
  c.clienteId=cl.id;c.clienteNombre=name;
}
async function save(ov){
  if(!ov||ov.dataset.saving==='1')return;
  ov.dataset.saving='1';
  const btn=ov.querySelector('[data-contact-save]');
  const oldId=btn?.dataset.id;
  const old=oldId&&(S.contactos||[]).find(c=>N(c.id)===N(oldId));
  const val=k=>ov.querySelector(`[data-f="${k}"]`)?.value?.trim()||'';
  const name=val('nombre');
  if(!name){ov.dataset.saving='';w.toast?.('⚠️ El nombre es obligatorio.');return;}
  const nuevo={...(old||{}),id:old?.id||U(),nombre:name,empresa:val('empresa'),cargo:val('cargo'),tipoPersona:val('tipoPersona')||'persona',esCliente:val('esCliente')==='1',telefono:val('telefono'),whatsapp:val('whatsapp'),email:val('email'),nit:val('nit'),documento:val('documento'),ciudad:val('ciudad'),direccion:val('direccion'),proyectos:[...new Set(val('proyectos').split(/\n|;/).map(x=>x.trim()).filter(Boolean))],notas:val('notas'),actualizadoEn:new Date().toISOString()};
  if(nuevo.esCliente){nuevo.clienteNombre=nuevo.empresa||nuevo.nombre;nuevo.clienteId=old?.clienteId||U()}else{delete nuevo.clienteId;delete nuevo.clienteNombre}
  const from=old?.esCliente?N(old.clienteNombre||old.empresa||old.nombre):'';
  const to=nuevo.clienteNombre||nuevo.empresa||nuevo.nombre;
  if(old)S.contactos=S.contactos.map(c=>N(c.id)===N(old.id)?nuevo:c);else S.contactos.push(nuevo);
  if(from&&nuevo.esCliente&&from!==N(to)){
    S.cotizaciones=(S.cotizaciones||[]).map(q=>N(quoteName(q))===from?{...q,cliente:to,contactoId:nuevo.id}:q);
    S.pagos=(S.pagos||[]).map(p=>N(paymentName(p))===from?{...p,cliente:to,entidad:p.entidad&&N(p.entidad)===from?to:p.entidad,contactoId:nuevo.id}:p);
  }
  saveClientRecord(nuevo);
  ov.remove();
  try{
    const uid=S.user?.uid;
    await w.saveContactos?.(uid);
    await w.saveClientes?.(uid);
    await w.saveCotizaciones?.(uid);
    await w.savePagos?.(uid);
    w.render?.();
    w.toast?.('✅ Contacto guardado correctamente.');
  }catch(err){console.error('Contactos modal:',err);w.toast?.('❌ No se pudieron guardar los cambios.');}
}
function install(){
  document.addEventListener('click',function(e){
    const el=e.target?.closest?.('[data-modal-close],[data-contact-save]');
    if(!el)return;
    const ov=el.closest?.('[data-contactModal]');
    if(!ov)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(el.matches('[data-modal-close]')){ov.remove();return;}
    save(ov);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})(window);
