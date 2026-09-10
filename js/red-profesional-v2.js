/* RNI28106 — Red profesional v2
   Módulo autónomo de Contactos + Clientes.
   No reemplaza render(), no usa modales globales y no depende de window.S.
*/
(function(){
'use strict';

if(window.__rniRedProfesionalV2)return;
window.__rniRedProfesionalV2=true;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=v=>String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const contacts=()=>Array.isArray(S.contactos)?S.contactos:[];
const quotes=()=>Array.isArray(S.cotizaciones)?S.cotizaciones:[];
const payments=()=>Array.isArray(S.pagos)?S.pagos:[];
const makeId=()=>typeof uid==='function'?uid():`contacto-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const contactLabel=c=>c?.nombre||c?.empresa||c?.clienteNombre||'Sin nombre';
const quoteName=q=>q?.cliente||q?.clienteNombre||q?.nombreCliente||q?.razonSocial||q?.empresa||q?.datosCliente?.nombre||'';
const paymentName=p=>p?.cliente||p?.entidad||p?.clienteNombre||p?.nombreCliente||p?.razonSocial||'';
const projectName=q=>q?.proyecto||q?.proyectoNombre||q?.nombreProyecto||q?.obra||q?.contrato||'';

function findContact(id){return contacts().find(c=>norm(c.id)===norm(id));}
function stats(c){
 const id=norm(c.id);
 const qs=quotes().filter(q=>norm(q.contactoId)===id);
 const ps=payments().filter(p=>norm(p.contactoId)===id);
 const projects=new Set(Array.isArray(c.proyectos)?c.proyectos:[]);
 qs.forEach(q=>{const p=projectName(q);if(p)projects.add(p);});
 return {quotes:qs,payments:ps,projects:[...projects]};
}

/* Vincula datos antiguos sin borrar nada: solo completa contactoId cuando
   existe una coincidencia inequívoca por nombre normalizado. */
function linkLegacyRelations(){
 const map=new Map();
 contacts().forEach(c=>{
   const keys=[c.nombre,c.empresa,c.clienteNombre].map(norm).filter(Boolean);
   keys.forEach(k=>{if(!map.has(k))map.set(k,c);});
 });
 quotes().forEach(q=>{
   if(q.contactoId)return;
   const c=map.get(norm(quoteName(q)));
   if(c)q.contactoId=c.id;
 });
 payments().forEach(p=>{
   if(p.contactoId)return;
   const c=map.get(norm(paymentName(p)));
   if(c)p.contactoId=c.id;
 });
}

function syncLegacyClients(){
 const out=[];
 contacts().forEach(c=>{
   if(!c.esCliente)return;
   const s=stats(c);
   if(!c.clienteId)c.clienteId=makeId();
   c.clienteNombre=c.empresa||c.nombre||c.clienteNombre||'';
   out.push({
     id:c.clienteId,nombre:c.clienteNombre,contactoId:c.id,
     contacto:c.nombre||'',personaContacto:c.nombre||'',empresa:c.empresa||'',cargo:c.cargo||'',
     telefono:c.telefono||'',whatsapp:c.whatsapp||'',email:c.email||'',nit:c.nit||'',
     documento:c.documento||'',ciudad:c.ciudad||'',direccion:c.direccion||'',
     proyectos:s.projects,notas:c.notas||'',tipoPersona:c.tipoPersona||'persona'
   });
 });
 S.clientes=out;
}

async function persist(){
 if(!S.user?.uid){
   if(typeof toast==='function')toast('⚠️ Debes iniciar sesión para guardar.');
   return false;
 }
 linkLegacyRelations();
 syncLegacyClients();
 try{
   await saveContactos(S.user.uid);
   await saveClientes(S.user.uid);
   await saveCotizaciones(S.user.uid);
   await savePagos(S.user.uid);
   return true;
 }catch(err){
   console.error('Red profesional v2:',err);
   if(typeof toast==='function')toast('❌ No se pudo completar el guardado.');
   return false;
 }
}

function modal(id){
 const old=id?findContact(id):null;
 const c=old||{id:makeId(),nombre:'',empresa:'',cargo:'',tipoPersona:'persona',telefono:'',whatsapp:'',email:'',nit:'',documento:'',ciudad:'',direccion:'',esCliente:false,proyectos:[],notas:''};
 const ov=document.createElement('div');
 ov.className='overlay'; ov.dataset.rniRp2Modal='1';
 ov.innerHTML=`
 <div class="modal" style="width:min(920px,96vw);max-height:92vh;overflow:auto">
   <div class="modal-h"><h3>${old?'✏️ Editar contacto':'＋ Nuevo contacto'}</h3><button type="button" class="close" data-rp="close">×</button></div>
   <div class="modal-body">
     <div class="row2">
       <div class="field"><label for="rp-nombre">Nombre / persona *</label><input id="rp-nombre" name="nombre" data-f="nombre" value="${esc(c.nombre)}" autocomplete="name"></div>
       <div class="field"><label for="rp-empresa">Empresa / institución</label><input id="rp-empresa" name="empresa" data-f="empresa" value="${esc(c.empresa)}" autocomplete="organization"></div>
     </div>
     <div class="row3">
       <div class="field"><label for="rp-cargo">Cargo / función</label><input id="rp-cargo" name="cargo" data-f="cargo" value="${esc(c.cargo)}"></div>
       <div class="field"><label for="rp-tipo">Tipo</label><select id="rp-tipo" name="tipoPersona" data-f="tipoPersona"><option value="persona" ${c.tipoPersona==='persona'?'selected':''}>Persona natural</option><option value="empresa" ${c.tipoPersona==='empresa'?'selected':''}>Empresa / institución</option></select></div>
       <div class="field"><label for="rp-cliente">Relación comercial</label><select id="rp-cliente" name="esCliente" data-f="esCliente"><option value="0" ${!c.esCliente?'selected':''}>Contacto</option><option value="1" ${c.esCliente?'selected':''}>Cliente</option></select></div>
     </div>
     <div class="row3">
       <div class="field"><label for="rp-tel">Teléfono</label><input id="rp-tel" name="telefono" data-f="telefono" value="${esc(c.telefono)}" autocomplete="tel"></div>
       <div class="field"><label for="rp-wa">WhatsApp</label><input id="rp-wa" name="whatsapp" data-f="whatsapp" value="${esc(c.whatsapp)}" autocomplete="tel"></div>
       <div class="field"><label for="rp-email">Correo electrónico</label><input id="rp-email" name="email" data-f="email" type="email" value="${esc(c.email||c.correo)}" autocomplete="email"></div>
     </div>
     <div class="row3">
       <div class="field"><label for="rp-nit">NIT</label><input id="rp-nit" name="nit" data-f="nit" value="${esc(c.nit)}"></div>
       <div class="field"><label for="rp-doc">CI / Documento</label><input id="rp-doc" name="documento" data-f="documento" value="${esc(c.documento||c.ci)}"></div>
       <div class="field"><label for="rp-city">Ciudad</label><input id="rp-city" name="ciudad" data-f="ciudad" value="${esc(c.ciudad)}" autocomplete="address-level2"></div>
     </div>
     <div class="field"><label for="rp-dir">Dirección</label><input id="rp-dir" name="direccion" data-f="direccion" value="${esc(c.direccion)}" autocomplete="street-address"></div>
     <div class="field"><label for="rp-proy">Proyectos / contratos asociados</label><textarea id="rp-proy" name="proyectos" data-f="proyectos" rows="5" placeholder="Un proyecto por línea">${esc((c.proyectos||[]).join('\n'))}</textarea></div>
     <div class="field"><label for="rp-notas">Notas e información adicional</label><textarea id="rp-notas" name="notas" data-f="notas" rows="4">${esc(c.notas||'')}</textarea></div>
   </div>
   <div class="modal-foot"><button type="button" class="btn btn-ghost" data-rp="close">Cancelar</button><button type="button" class="btn btn-primary" data-rp="save" data-id="${esc(old?old.id:'')}">💾 Guardar contacto</button></div>
 </div>`;
 document.body.appendChild(ov);
 ov.querySelector('[data-f="nombre"]')?.focus();
 ov.addEventListener('mousedown',e=>{if(e.target===ov)ov.remove();});
}

function detail(id){
 const c=findContact(id);if(!c)return;
 const s=stats(c);
 const ov=document.createElement('div');ov.className='overlay';ov.dataset.rniRp2Detail='1';
 ov.innerHTML=`<div class="modal" style="width:min(900px,96vw);max-height:90vh;overflow:auto">
 <div class="modal-h"><h3>👤 ${esc(contactLabel(c))}</h3><button class="close" type="button" data-rp="close">×</button></div>
 <div class="modal-body">
   <div class="kpi-grid">
    <div class="kpi"><div class="label">Cotizaciones</div><div class="val">${s.quotes.length}</div><div class="sub">Relacionadas</div></div>
    <div class="kpi"><div class="label">Pagos</div><div class="val">${s.payments.length}</div><div class="sub">Historial financiero</div></div>
    <div class="kpi"><div class="label">Proyectos</div><div class="val">${s.projects.length}</div><div class="sub">Asociados</div></div>
   </div>
   <div class="panel"><div class="panel-h"><h3>Información</h3></div><div style="padding:14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
    <div><b>Empresa:</b><br>${esc(c.empresa||'—')}</div><div><b>Cargo:</b><br>${esc(c.cargo||'—')}</div>
    <div><b>Teléfono:</b><br>${esc(c.telefono||'—')}</div><div><b>WhatsApp:</b><br>${esc(c.whatsapp||'—')}</div>
    <div><b>Correo:</b><br>${esc(c.email||'—')}</div><div><b>NIT / CI:</b><br>${esc(c.nit||c.documento||'—')}</div>
    <div><b>Ciudad:</b><br>${esc(c.ciudad||'—')}</div><div><b>Dirección:</b><br>${esc(c.direccion||'—')}</div>
   </div></div>
   <div class="panel"><div class="panel-h"><h3>Proyectos y contratos</h3></div><div style="padding:14px">${s.projects.length?s.projects.map(p=>`<div style="padding:7px 0;border-bottom:1px solid var(--border)">▸ ${esc(p)}</div>`).join(''):'<span class="muted">Sin proyectos asociados.</span>'}</div></div>
   ${c.notas?`<div class="panel"><div class="panel-h"><h3>Notas</h3></div><div style="padding:14px;white-space:pre-wrap">${esc(c.notas)}</div></div>`:''}
 </div>
 <div class="modal-foot"><button class="btn btn-ghost" data-rp="close">Cerrar</button><button class="btn btn-primary" data-rp="edit-detail" data-id="${esc(c.id)}">✏️ Editar</button></div>
 </div>`;
 document.body.appendChild(ov);
 ov.addEventListener('mousedown',e=>{if(e.target===ov)ov.remove();});
}

function render(){
 linkLegacyRelations();
 const all=contacts();
 const clients=all.filter(c=>c.esCliente);
 const root=document.createElement('div');root.id='rni-red-profesional-v2';
 root.innerHTML=`
 <div class="page-head">
  <div><div class="eyebrow">RED PROFESIONAL</div><h1>Contactos y clientes</h1><p>Un solo directorio para personas, empresas, clientes, proyectos y relaciones financieras.</p></div>
  <div class="page-actions"><button class="btn btn-primary" data-rp="new">＋ Nuevo contacto</button></div>
 </div>
 <div class="kpi-grid">
  <div class="kpi"><div class="label">Contactos</div><div class="val">${all.length}</div><div class="sub">Directorio profesional</div></div>
  <div class="kpi accent"><div class="label">Clientes</div><div class="val">${clients.length}</div><div class="sub">Relación comercial</div></div>
  <div class="kpi success"><div class="label">Con teléfono</div><div class="val">${all.filter(c=>c.telefono||c.whatsapp).length}</div><div class="sub">Contacto directo</div></div>
  <div class="kpi"><div class="label">Con correo</div><div class="val">${all.filter(c=>c.email||c.correo).length}</div><div class="sub">Contacto digital</div></div>
 </div>
 <div class="panel">
  <div class="panel-h" style="gap:10px;flex-wrap:wrap">
   <h3 style="margin-right:auto">Directorio</h3>
   <select class="search-input" data-rp="filter" aria-label="Filtrar contactos"><option value="todos">Todos</option><option value="clientes">Clientes</option><option value="personas">Personas</option><option value="empresas">Empresas / instituciones</option></select>
   <input class="search-input" style="min-width:240px" data-rp="search" name="busqueda" aria-label="Buscar contactos" placeholder="Buscar nombre, empresa, correo...">
  </div>
  <div class="table-wrap"><table><thead><tr><th>Contacto</th><th>Empresa / cargo</th><th>Teléfono</th><th>Correo</th><th>Tipo</th><th>Relaciones</th><th></th></tr></thead><tbody data-rp="tbody"></tbody></table></div>
 </div>`;
 document.getElementById('main').replaceChildren(root);
 const tbody=root.querySelector('[data-rp="tbody"]');
 function draw(){
   const term=norm(root.querySelector('[data-rp="search"]')?.value||'');
   const filter=root.querySelector('[data-rp="filter"]')?.value||'todos';
   let rows=contacts().filter(c=>{
     if(filter==='clientes'&&!c.esCliente)return false;
     if(filter==='personas'&&c.tipoPersona!=='persona')return false;
     if(filter==='empresas'&&c.tipoPersona!=='empresa')return false;
     if(!term)return true;
     return norm([c.nombre,c.empresa,c.cargo,c.telefono,c.whatsapp,c.email,c.nit,c.documento,c.ciudad,c.clienteNombre].join(' ')).includes(term);
   });
   tbody.innerHTML=rows.map(c=>{const s=stats(c);return `<tr>
    <td><button class="linklike" data-rp="detail" data-id="${esc(c.id)}"><b>${esc(contactLabel(c))}</b></button><div class="muted">${esc(c.ciudad||'')}</div></td>
    <td>${esc(c.empresa||'—')}<div class="muted">${esc(c.cargo||'')}</div></td>
    <td>${esc(c.whatsapp||c.telefono||'—')}</td><td>${esc(c.email||c.correo||'—')}</td>
    <td>${c.esCliente?'<span class="badge badge-success">Cliente</span>':'Contacto'}</td>
    <td>${s.quotes.length} cot. · ${s.payments.length} pagos · ${s.projects.length} proy.</td>
    <td><div class="rowactions"><button class="iconbtn" title="Editar" data-rp="edit" data-id="${esc(c.id)}">✎</button><button class="iconbtn" title="Eliminar" data-rp="delete" data-id="${esc(c.id)}">×</button></div></td>
   </tr>`}).join('')||'<tr><td colspan="7" style="text-align:center;padding:35px">No hay registros que coincidan con el filtro.</td></tr>';
 }
 draw();
 root.addEventListener('input',e=>{if(e.target.matches('[data-rp="search"]'))draw();});
 root.addEventListener('change',e=>{if(e.target.matches('[data-rp="filter"]'))draw();});
 root.addEventListener('click',async e=>{
   const b=e.target.closest('[data-rp]');if(!b||!root.contains(b))return;
   const a=b.dataset.rp,id=b.dataset.id;
   if(a==='new'){modal();return;}
   if(a==='edit'){modal(id);return;}
   if(a==='detail'){detail(id);return;}
   if(a==='delete'){
     const c=findContact(id);if(!c)return;
     if(!confirm(`¿Eliminar el contacto "${contactLabel(c)}"?`))return;
     S.contactos=contacts().filter(x=>norm(x.id)!==norm(id));
     quotes().forEach(q=>{if(norm(q.contactoId)===norm(id))delete q.contactoId;});
     payments().forEach(p=>{if(norm(p.contactoId)===norm(id))delete p.contactoId;});
     await persist();render();if(typeof toast==='function')toast('✅ Contacto eliminado.');return;
   }
 });
}

function bindModalEvents(){
 document.addEventListener('click',async function handler(e){
   const b=e.target.closest('[data-rp]');if(!b)return;
   const ov=b.closest('[data-rni-rp2-modal], [data-rni-rp2-detail]');
   if(!ov)return;
   const a=b.dataset.rp;
   if(a==='close'){ov.remove();return;}
   if(a==='edit-detail'){ov.remove();modal(b.dataset.id);return;}
   if(a!=='save')return;
   const oldId=b.dataset.id,old=oldId?findContact(oldId):null;
   const get=k=>ov.querySelector(`[data-f="${k}"]`)?.value?.trim()||'';
   const name=get('nombre');
   if(!name){if(typeof toast==='function')toast('⚠️ El nombre es obligatorio.');ov.querySelector('[data-f="nombre"]')?.focus();return;}
   const c={...(old||{}),id:old?.id||makeId(),nombre:name,empresa:get('empresa'),cargo:get('cargo'),tipoPersona:get('tipoPersona')||'persona',telefono:get('telefono'),whatsapp:get('whatsapp'),email:get('email'),nit:get('nit'),documento:get('documento'),ciudad:get('ciudad'),direccion:get('direccion'),esCliente:get('esCliente')==='1',proyectos:get('proyectos').split(/\n|;/).map(x=>x.trim()).filter(Boolean),notas:get('notas'),creadoEn:old?.creadoEn||new Date().toISOString(),actualizadoEn:new Date().toISOString()};
   if(c.esCliente){c.clienteId=old?.clienteId||makeId();c.clienteNombre=c.empresa||c.nombre;}else{c.clienteId=null;c.clienteNombre='';}
   if(old)S.contactos=contacts().map(x=>norm(x.id)===norm(old.id)?c:x);else S.contactos=[...contacts(),c];
   ov.remove();
   const ok=await persist();
   if(ok){render();if(typeof toast==='function')toast('✅ Contacto guardado correctamente.');}
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelector('[data-rni-rp2-modal], [data-rni-rp2-detail]')?.remove();}});
}

/* Se expone solo una función de vista; render.js decide cuándo usarla. */
window.renderRedProfesionalV2=render;
bindModalEvents();
})();
