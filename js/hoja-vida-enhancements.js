/* ============================================================
 * HOJA DE VIDA — mejoras de visualización y exportación
 * Capa aditiva: no modifica registros Firebase.
 * ============================================================ */
(function(){
  'use strict';

  const escH = v => (typeof esc === 'function' ? esc(String(v ?? '')) : String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const arr = v => Array.isArray(v) ? v : [];
  const text = v => String(v ?? '').trim();
  const first = (o, keys) => { for (const k of keys) { const v=o?.[k]; if (v !== undefined && v !== null && text(v)) return v; } return ''; };

  function records(keys){
    const out=[];
    keys.forEach(k=>arr(window.S?.[k]).forEach(x=>out.push({...x, __source:k})));
    return out;
  }

  function normalizeAcademicExtras(){
    return {
      publicaciones: records(['publicaciones','publicacionesAcademicas','publicaciones_academicas']),
      eventos: records(['conversatorios','seminarios','congresos','eventosAcademicos','eventos']),
      certificados: records(['certificados','certificaciones'])
    };
  }

  function rowAction(id, type){
    return `<button class="btn btn-ghost btn-sm hv-detail" data-hv-type="${escH(type)}" data-hv-id="${escH(id)}">Ver detalle</button>`;
  }

  function table(title, icon, rows, columns, type){
    if(!rows.length) return `<section class="card hv-section"><div class="card-h"><h3>${icon} ${title}</h3></div><div class="empty">Sin registros disponibles.</div></section>`;
    const body=rows.map((r,i)=>`<tr>${columns.map(c=>`<td class="${c.cls||''}">${escH(first(r,c.keys) || (c.index ? c.index(r,i) : '—'))}</td>`).join('')}<td>${rowAction(r.id||i,type)}</td></tr>`).join('');
    return `<section class="card hv-section" data-hv-table="${escH(type)}">
      <div class="card-h hv-table-head"><div><h3>${icon} ${title}</h3><small>${rows.length} registro${rows.length===1?'':'s'}</small></div>
      <input class="hv-search" data-hv-search="${escH(type)}" placeholder="🔎 Buscar en ${title.toLowerCase()}…"></div>
      <div class="table-wrap"><table class="hv-table"><thead><tr>${columns.map(c=>`<th>${escH(c.label)}</th>`).join('')}<th>Detalle</th></tr></thead><tbody>${body}</tbody></table></div>
    </section>`;
  }

  function injectStyles(){
    if(document.getElementById('hv-enhanced-styles')) return;
    const s=document.createElement('style'); s.id='hv-enhanced-styles'; s.textContent=`
      .hv-section{margin-top:18px;overflow:hidden}.hv-table-head{align-items:center;gap:14px}.hv-table-head small{color:var(--text-soft);font-size:12px}.hv-search{max-width:280px;width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text)}
      .hv-table th{white-space:nowrap}.hv-table td{vertical-align:top;max-width:420px;white-space:normal;line-height:1.45}.hv-table tbody tr:hover{background:var(--gantt-bg)}
      .hv-empty{padding:18px}.hv-detail{white-space:nowrap}.hv-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}
      @media(max-width:700px){.hv-table-head{align-items:stretch;flex-direction:column}.hv-search{max-width:none}.hv-table{min-width:760px}.hv-section .table-wrap{overflow-x:auto}}
    `; document.head.appendChild(s);
  }

  function exportExcel(){
    const extras=normalizeAcademicExtras();
    const sections=[
      ['Datos personales',arr(S.datosPersonales)],['Formación académica',arr(S.formacion)],['Experiencia profesional',arr(S.experiencia)],['Cursos y capacitaciones',arr(S.cursos)],['Licencias y certificaciones',arr(S.licencias||S.certificaciones)],['Publicaciones académicas',extras.publicaciones],['Conversatorios, seminarios y eventos',extras.eventos],['Certificados',extras.certificados]
    ];
    if(typeof XLSX==='undefined'){ toast?.('⚠️ Falta cargar el motor XLSX para exportar Excel.'); return; }
    const wb=XLSX.utils.book_new();
    sections.forEach(([name,rows])=>{
      const data=rows.length ? rows.map(x=>({...x})) : [{Información:'Sin registros'}];
      data.forEach(x=>delete x.__source);
      const ws=XLSX.utils.json_to_sheet(data); XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31));
    });
    XLSX.writeFile(wb,'Hoja_de_Vida_Ing_Antequera.xlsx');
  }

  function renderExtras(){
    const ex=normalizeAcademicExtras();
    const host=document.querySelector('[data-hoja-vida-extra]');
    if(!host) return;
    host.innerHTML = table('Publicaciones académicas','📖',ex.publicaciones,[
      {label:'Fecha / año',keys:['fecha','año','anio','year']},{label:'Título',keys:['titulo','title','nombre']},{label:'Tipo',keys:['tipo','tipoPublicacion']},{label:'Institución / revista',keys:['revista','institucion','editorial','evento']},{label:'Enlace / DOI',keys:['doi','enlace','url']}
    ],'publicaciones') + table('Conversatorios, seminarios y eventos académicos','🎤',ex.eventos,[
      {label:'Fecha',keys:['fecha','desde','date']},{label:'Evento',keys:['titulo','nombre','evento']},{label:'Tipo',keys:['tipo','categoria']},{label:'Institución',keys:['institucion','organizador','entidad']},{label:'Modalidad',keys:['modalidad']}
    ],'eventos') + table('Certificados y respaldos académicos','📜',ex.certificados,[
      {label:'Fecha',keys:['fecha','desde','date']},{label:'Certificado',keys:['titulo','nombre','certificado']},{label:'Institución',keys:['institucion','entidad','organizador']},{label:'Tipo',keys:['tipo','categoria']},{label:'Documento',keys:['archivo','url','enlace']}
    ],'certificados');
    bindSearch(host);
  }

  function bindSearch(root){
    root.querySelectorAll('.hv-search').forEach(input=>input.addEventListener('input',()=>{
      const q=text(input.value).toLowerCase(); const section=input.closest('[data-hv-table]');
      section?.querySelectorAll('tbody tr').forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none');
    }));
  }

  function expose(){
    window.exportHojaVidaExcel=exportExcel;
    window.renderHojaVidaExtras=renderExtras;
    injectStyles();
    setTimeout(renderExtras,0);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',expose); else expose();
  window.addEventListener('rni:rendered',renderExtras);
})();
