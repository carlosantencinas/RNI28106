/* Contactos y clientes — controlador de emergencia del modal.
 * Se instala en WINDOW/CAPTURE para quedar por delante de cualquier
 * delegación documentaria que pueda bloquear los botones.
 */
(function(w){
'use strict';
if(w.__contactosModalEmergency)return;
w.__contactosModalEmergency=true;

const norm=v=>String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const uid=()=>w.uid?w.uid():`ct-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const value=(ov,k)=>ov.querySelector(`[data-f="${k}"]`)?.value?.trim()||'';

function close(ov){
  if(!ov)return;
  ov.remove();
}

async function save(ov){
  if(!ov || ov.dataset.emergencySaving==='1')return;
  ov.dataset.emergencySaving='1';
  const btn=ov.querySelector('[data-contact-save]');
  const id=btn?.dataset.id||'';
  const old=id&&(S.contactos||[]).find(c=>norm(c.id)===norm(id));
  const nombre=value(ov,'nombre');
  if(!nombre){ov.dataset.emergencySaving='';w.toast?.('⚠️ El nombre es obligatorio.');return;}
  const cliente=value(ov,'esCliente')==='1';
  const nuevo={...(old||{}),id:old?.id||uid(),nombre,empresa:value(ov,'empresa'),cargo:value(ov,'cargo'),tipoPersona:value(ov,'tipoPersona')||'persona',esCliente,telefono:value(ov,'telefono'),whatsapp:value(ov,'whatsapp'),email:value(ov,'email'),nit:value(ov,'nit'),documento:value(ov,'documento'),ciudad:value(ov,'ciudad'),direccion:value(ov,'direccion'),proyectos:[...new Set(value(ov,'proyectos').split(/[\n;]+/).map(x=>x.trim()).filter(Boolean))],notas:value(ov,'notas'),actualizadoEn:new Date().toISOString()};
  if(cliente){nuevo.clienteNombre=nuevo.empresa||nuevo.nombre;nuevo.clienteId=old?.clienteId||uid();}
  else {delete nuevo.clienteId;delete nuevo.clienteNombre;}
  S.contactos=Array.isArray(S.contactos)?S.contactos:[];
  if(old)S.contactos=S.contactos.map(c=>norm(c.id)===norm(old.id)?nuevo:c);
  else S.contactos.push(nuevo);
  if(cliente){
    S.clientes=Array.isArray(S.clientes)?S.clientes:[];
    let cl=S.clientes.find(c=>norm(c.id)===norm(nuevo.clienteId));
    if(!cl)cl={id:nuevo.clienteId,nombre:nuevo.clienteNombre};
    Object.assign(cl,{nombre:nuevo.clienteNombre,contactoId:nuevo.id,contacto:nuevo.nombre,personaContacto:nuevo.nombre,cargo:nuevo.cargo,telefono:nuevo.telefono,whatsapp:nuevo.whatsapp,email:nuevo.email,nit:nuevo.nit,documento:nuevo.documento,ciudad:nuevo.ciudad,direccion:nuevo.direccion,notas:nuevo.notas,tipoPersona:nuevo.tipoPersona,proyectos:nuevo.proyectos});
    if(!S.clientes.some(c=>norm(c.id)===norm(cl.id)))S.clientes.push(cl);
  }
  close(ov);
  try{
    const idu=S.user?.uid;
    await w.saveContactos?.(idu);
    await w.saveClientes?.(idu);
    if(w.render)w.render();
    w.toast?.('✅ Contacto guardado correctamente.');
  }catch(err){
    console.error('Error guardando contacto:',err);
    w.toast?.('❌ Error al guardar el contacto.');
  }
}

/* Window/capture ocurre antes que document/capture y document/bubble. */
w.addEventListener('click',function(e){
  const target=e.target?.closest?.('[data-modal-close],[data-contact-save]');
  if(!target)return;
  const ov=target.closest?.('[data-contactModal]');
  if(!ov)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  if(target.matches('[data-modal-close]')){close(ov);return;}
  if(target.matches('[data-contact-save]')){save(ov);return;}
},true);

w.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  const ov=document.querySelector('[data-contactModal]');
  if(ov){e.preventDefault();e.stopPropagation();close(ov);}
},true);

})(window);
