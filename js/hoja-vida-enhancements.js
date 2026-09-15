/* ============================================================
 * HOJA DE VIDA — vista completa y exportación
 * Capa aditiva: solo lectura; no modifica ni elimina Firebase.
 * ============================================================ */
(function(){
  'use strict';

  const A=v=>Array.isArray(v)?v:[];
  const T=v=>String(v??'').trim();
  const E=v=>typeof esc==='function'?esc(T(v)):T(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const pick=(o,ks)=>{for(const k of ks){if(T(o?.[k]))return o[k]}return ''};
  const keys=(...ks)=>ks.flat();

  function allValues(o){
    if(!o||typeof o!=='object')return '';
    return Object.entries(o).filter(([k])=>k!=='__source').map(([k,v])=>{
      if(v==null||v==='')return '';
      if(Array.isArray(v))return `${k}: ${v.join(', ')}`;
      if(typeof v==='object')return `${k}: ${JSON.stringify(v)}`;
      return `${k}: ${v}`;
    }).filter(Boolean).join(' · ');
  }

  function unique(list){
    const seen=new Set();
    return list.filter(r=>{const s=JSON.stringify(r);if(seen.has(s))return false;seen.add(s);return true});
  }

  async function loadOptionalData(){
    const uid=window.S?.user?.uid;
    if(!uid||!window.fbDb)return;
    const groups={
      publicaciones:['publicaciones','publicacionesAcademicas','publicaciones_academicas'],
      eventos:['conversatorios','seminarios','congresos','eventosAcademicos','eventos'],
      certificados:['certificados','certificaciones']
    };
    for(const [target,candidates] of Object.entries(groups)){
      const found=[];
      for(const key of candidates){
        try{
          const snap=await fbDb.collection('users').doc(uid).collection('data').doc(key).get();
          if(snap.exists){
            const raw=snap.data()?.value;
            const parsed=typeof raw==='string'?JSON.parse(raw):raw;
            if(Array.isArray(parsed))found.push(...parsed);
          }
        }catch(e){console.warn('Hoja de vida: no se pudo leer',key,e)}
      }
      window.S[target]=unique(found);
    }
    window.S.eventos=unique(A(window.S.eventos));
    // Aprovechar actividades/documentos existentes cuando representan respaldo académico.
    const acts=A(window.S.actividades).filter(x=>/conversatorio|seminario|congreso|evento académico|evento academico/i.test(T(x?.tipo)+' '+T(x?.categoria)+' '+T(x?.nombre)));
    window.S.eventos=unique(window.S.eventos.concat(acts));
    const docs=A(window.S.documentos).filter(x=>/certific|conversatorio|seminario|congreso|evento académico|evento academico/i.test(T(x?.tipo)+' '+T(x?.nombre)+' '+T(x?.titulo)+' '+T(x?.descripcion)));
    window.S.certificados=unique(window.S.certificados.concat(docs));
  }

  function rowsFor(type){
    const s=window.S||{};
    if(type==='formacion')return A(s.formacion);
    if(type==='cursos')return A(s.cursos);
    if(type==='experiencia')return A(s.experiencia);
    if(type==='publicaciones')return A(s.publicaciones);
    if(type==='eventos')return A(s.eventos);
    if(type==='certificados')return A(s.certificados);
    return [];
  }

  function table(title,icon,type,rows,cols){
    const body=rows.map((r,i)=>`<tr>${cols.map(c=>`<td>${E(c(r,i)||'—')}</td>`).join('')}<td><button class="btn btn-sm btn-ghost hv-full-detail" data-hv-type="${type}" data-hv-index="${i}">Ver todo</button></td></tr>`).join('');
    return `<section class="card hv-section" data-hv-table="${type}">
      <div class="card-h hv-table-head"><div><h3>${icon} ${title}</h3><small>${rows.length} registro${rows.length===1?'':'s'}</small></div><input class="hv-search" placeholder="🔎 Buscar…" data-hv-search></div>
      ${rows.length?`<div class="table-wrap"><table class="hv-table"><thead><tr>${cols.map(c=>`<th>${E(c.label)}</th>`).join('')}<th>Detalle</th></tr></thead><tbody>${body}</tbody></table></div>`:'<div class="empty">Sin registros disponibles.</div>'}
    </section>`;
  }

  function renderSummary(){
    const main=document.getElementById('main');
    if(!main||!window.S||window.S.view!=='experiencia'||window.S.editingCV)return;
    const panel=Array.from(main.querySelectorAll('.panel')).find(p=>/Hoja de vida/i.test(p.querySelector('.panel-h h3')?.textContent||''));
    if(!panel||panel.dataset.hvEnhanced==='1')return;
    const body=panel.querySelector('.panel-body'); if(!body)return;
    const sections=body.querySelectorAll(':scope > div');
    const summary=Array.from(sections).find(x=>/Cursos de especialización|Formación académica|Experiencia profesional|Experiencia general/i.test(x.textContent||''));
    if(!summary)return;
    const dp=window.S.datosPersonales||{};
    const exp=A(window.S.experiencia), form=A(window.S.formacion), cursos=A(window.S.cursos);
    const head=`<div class="hv-overview"><div><div class="hv-name">${E(dp.nombre||window.S.config?.nombre||'Hoja de vida profesional')}</div><div class="hv-meta">${E(dp.profesion||'')} ${dp.registroProfesional?'· RNI '+E(dp.registroProfesional):''}</div></div><button class="btn btn-success" id="btn-hv-excel">📊 Exportar Hoja de Vida completa a Excel</button></div>`;
    const personal=`<section class="card hv-section"><div class="card-h"><h3>📌 Datos personales</h3></div><div class="hv-personal-grid">${Object.entries(dp).filter(([k,v])=>T(v)).map(([k,v])=>`<div><small>${E(k)}</small><strong>${E(v)}</strong></div>`).join('')}</div></section>`;
    const html=head+personal+
      table('Formación académica','🎓','formacion',form,[Object.assign((r)=>pick(r,keys('institucion')), {label:'Institución'}),Object.assign((r)=>pick(r,keys('grado','titulo')), {label:'Grado / título'}),Object.assign((r)=>pick(r,keys('desde','fecha')), {label:'Desde'}),Object.assign((r)=>pick(r,keys('hasta')), {label:'Hasta'}),Object.assign((r)=>allValues(r), {label:'Información completa'})])+
      table('Cursos y capacitaciones','📚','cursos',cursos,[Object.assign((r)=>pick(r,keys('institucion')), {label:'Institución'}),Object.assign((r)=>pick(r,keys('curso','titulo','nombre')), {label:'Curso'}),Object.assign((r)=>pick(r,keys('horas','duracion')), {label:'Horas / duración'}),Object.assign((r)=>pick(r,keys('desde','fecha')), {label:'Fecha'}),Object.assign((r)=>allValues(r), {label:'Información completa'})])+
      table('Experiencia profesional','💼','experiencia',exp,[Object.assign((r)=>pick(r,keys('entidad','empresa','institucion')), {label:'Entidad'}),Object.assign((r)=>pick(r,keys('objeto','proyecto','cargo')), {label:'Proyecto / cargo'}),Object.assign((r)=>pick(r,keys('desde','fecha')), {label:'Desde'}),Object.assign((r)=>pick(r,keys('hasta')), {label:'Hasta'}),Object.assign((r)=>pick(r,keys('certificado','estado')), {label:'Estado / certificado'}),Object.assign((r)=>allValues(r), {label:'Información completa'})])+
      table('Publicaciones académicas','📖','publicaciones',rowsFor('publicaciones'),[Object.assign((r)=>pick(r,keys('fecha','año','anio','year')), {label:'Fecha / año'}),Object.assign((r)=>pick(r,keys('titulo','title','nombre')), {label:'Título'}),Object.assign((r)=>pick(r,keys('autores','autor')), {label:'Autores'}),Object.assign((r)=>pick(r,keys('revista','institucion','editorial','evento')), {label:'Revista / institución'}),Object.assign((r)=>pick(r,keys('doi','enlace','url')), {label:'DOI / enlace'})])+
      table('Conversatorios, seminarios, congresos y eventos académicos','🎤','eventos',rowsFor('eventos'),[Object.assign((r)=>pick(r,keys('fecha','desde','date')), {label:'Fecha'}),Object.assign((r)=>pick(r,keys('titulo','nombre','evento')), {label:'Evento'}),Object.assign((r)=>pick(r,keys('tipo','categoria')), {label:'Tipo'}),Object.assign((r)=>pick(r,keys('institucion','organizador','entidad')), {label:'Institución / organizador'}),Object.assign((r)=>allValues(r), {label:'Información completa'})])+
      table('Certificados y respaldos','📜','certificados',rowsFor('certificados'),[Object.assign((r)=>pick(r,keys('fecha','desde','date')), {label:'Fecha'}),Object.assign((r)=>pick(r,keys('titulo','nombre','certificado')), {label:'Certificado'}),Object.assign((r)=>pick(r,keys('institucion','entidad','organizador')), {label:'Institución'}),Object.assign((r)=>pick(r,keys('archivo','url','enlace')), {label:'Documento / enlace'}),Object.assign((r)=>allValues(r), {label:'Información completa'})]);
    body.innerHTML=html;
    panel.dataset.hvEnhanced='1';
    document.getElementById('btn-hv-excel')?.addEventListener('click',()=>window.exportHojaVidaCompleta?.());
    bindTables(body);
  }

  function bindTables(root){
    root.querySelectorAll('[data-hv-search]').forEach(input=>input.addEventListener('input',()=>{const q=T(input.value).toLowerCase(), sec=input.closest('[data-hv-table]');sec?.querySelectorAll('tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none')}));
    root.querySelectorAll('.hv-full-detail').forEach(btn=>btn.addEventListener('click',()=>{const rows=rowsFor(btn.dataset.hvType),r=rows[Number(btn.dataset.hvIndex)];if(!r)return;const o=document.createElement('div');o.className='overlay';o.innerHTML=`<div class="modal" style="max-width:850px"><div class="modal-h"><h3>📋 Detalle completo</h3><button class="close">&times;</button></div><div class="modal-body"><dl class="hv-detail-list">${Object.entries(r).filter(([k])=>k!=='__source').map(([k,v])=>`<div><dt>${E(k)}</dt><dd>${E(typeof v==='object'?JSON.stringify(v,null,2):v)}</dd></div>`).join('')}</dl></div></div>`;document.body.appendChild(o);o.querySelector('.close').onclick=()=>o.remove();o.addEventListener('mousedown',e=>{if(e.target===o)o.remove()})}));
  }

  async function exportComplete(){
    try{
      if(window.HidroLoader?.loadXLSX)await window.HidroLoader.loadXLSX();
      if(!window.XLSX?.utils?.book_new){toast?.('❌ No se pudo cargar Excel.');return}
      const s=window.S||{}, wb=XLSX.utils.book_new();
      const sheets=[
        ['Datos personales',[s.datosPersonales||{}]],['Formación académica',A(s.formacion)],['Cursos y capacitaciones',A(s.cursos)],['Experiencia profesional',A(s.experiencia)],['Publicaciones académicas',A(s.publicaciones)],['Conversatorios y eventos académicos',A(s.eventos)],['Certificados y respaldos',A(s.certificados)],['Competencias',A(s.competencias)],['Documentos',A(s.documentos)]
      ];
      sheets.forEach(([name,rows])=>{const data=rows.length?rows.map(r=>{const x={...r};delete x.__source;return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,typeof v==='object'?(Array.isArray(v)?v.join(', '):JSON.stringify(v)):v]))}):[{Información:'Sin registros'}];const ws=XLSX.utils.json_to_sheet(data);ws['!autofilter']={ref:ws['!ref']};ws['!cols']=Object.keys(data[0]||{}).map(k=>({wch:Math.min(60,Math.max(14,String(k).length+8)}));XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31))});
      XLSX.writeFile(wb,`Hoja_de_Vida_Ing_Antequera_${new Date().toISOString().slice(0,10)}.xlsx`);toast?.('✅ Hoja de vida completa exportada a Excel.');
    }catch(e){console.error(e);toast?.('❌ Error al exportar la Hoja de Vida: '+e.message)}
  }

  function styles(){if(document.getElementById('hv-enhanced-styles'))return;const s=document.createElement('style');s.id='hv-enhanced-styles';s.textContent=`.hv-overview{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 16px;margin-bottom:16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.hv-name{font-size:20px;font-weight:750}.hv-meta{font-size:12px;color:var(--text-soft);margin-top:3px}.hv-section{margin-top:16px;overflow:hidden}.hv-table-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.hv-search{min-width:220px;padding:8px 11px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text)}.hv-table td{white-space:normal;vertical-align:top;line-height:1.4;max-width:520px}.hv-personal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;padding:16px}.hv-personal-grid>div{padding:10px 12px;border:1px solid var(--border);border-radius:9px}.hv-personal-grid small{display:block;color:var(--text-soft);font-size:11px;margin-bottom:3px}.hv-personal-grid strong{display:block;font-weight:600;word-break:break-word}.hv-detail-list{margin:0}.hv-detail-list>div{display:grid;grid-template-columns:180px 1fr;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)}.hv-detail-list dt{font-weight:700}.hv-detail-list dd{margin:0;white-space:pre-wrap;word-break:break-word}.hv-table tbody tr:hover{background:var(--gantt-bg)}@media(max-width:700px){.hv-table{min-width:900px}.hv-section .table-wrap{overflow-x:auto}.hv-search{min-width:0;width:100%}.hv-detail-list>div{grid-template-columns:1fr}}`;document.head.appendChild(s)}

  async function boot(){styles();window.exportHojaVidaCompleta=exportComplete;window.exportHojaVidaExcel=exportComplete;await loadOptionalData();renderSummary();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,600));else setTimeout(boot,600);
  const main=document.getElementById('main');if(main)new MutationObserver(()=>setTimeout(renderSummary,80)).observe(main,{childList:true,subtree:true});
  window.addEventListener('rni:rendered',()=>setTimeout(renderSummary,80));
})();
