/* ============================================================
 * HOJA DE VIDA — información completa + gestión + Excel
 * Las nuevas secciones usan los documentos de datos del usuario:
 * publicaciones, eventos y certificados. No elimina ni migra
 * registros existentes automáticamente.
 * ============================================================ */
(function () {
    'use strict';

    const arr = v => Array.isArray(v) ? v : [];
    const txt = v => String(v == null ? '' : v).trim();
    const escH = v => typeof esc === 'function' ? esc(txt(v)) : txt(v).replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
    const attrH = v => escH(v).replace(/\n/g, '&#10;');
    const uidH = () => (typeof uid === 'function' ? uid() : 'hv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));

    function pick(o, names) { for (const name of names) if (o && txt(o[name])) return o[name]; return ''; }
    function allText(o) { return Object.keys(o || {}).filter(k => k !== '__source').map(k => { const v=o[k]; if(v==null||v==='')return ''; return k+': '+(typeof v==='object'?JSON.stringify(v):v); }).filter(Boolean).join(' · '); }
    function getRows(type) { const s=window.S||{}; if(type==='formacion')return arr(s.formacion); if(type==='cursos')return arr(s.cursos); if(type==='experiencia')return arr(s.experiencia); if(type==='publicaciones')return arr(s.publicaciones); if(type==='eventos')return arr(s.eventos); if(type==='certificados')return arr(s.certificados); return []; }

    const CONFIG={
        publicaciones:{title:'Publicaciones académicas',icon:'📖',save:'savePublicaciones',fields:[['titulo','Título','text',true],['autores','Autores','text',false],['año','Año / fecha','text',false],['revista','Revista / editorial','text',false],['doi','DOI','text',false],['url','Enlace','url',false],['descripcion','Descripción / resumen','textarea',false]],columns:[r=>pick(r,['titulo','title','nombre']),r=>pick(r,['autores','autor']),r=>pick(r,['año','anio','year','fecha']),r=>pick(r,['revista','editorial','institucion']),r=>pick(r,['doi','url','enlace'])]},
        eventos:{title:'Conversatorios, seminarios, congresos y eventos',icon:'🎤',save:'saveEventos',fields:[['titulo','Nombre del evento','text',true],['tipo','Tipo de participación','text',false],['fecha','Fecha','date',false],['institucion','Institución / organizador','text',false],['lugar','Lugar / modalidad','text',false],['rol','Rol / participación','text',false],['certificado','Certificado / respaldo','text',false],['url','Enlace','url',false],['descripcion','Descripción','textarea',false]],columns:[r=>pick(r,['fecha','date']),r=>pick(r,['titulo','nombre','evento']),r=>pick(r,['tipo','categoria']),r=>pick(r,['institucion','organizador','entidad']),r=>pick(r,['rol','participacion'])]},
        certificados:{title:'Certificados y respaldos',icon:'📜',save:'saveCertificados',fields:[['titulo','Nombre del certificado','text',true],['tipo','Tipo','text',false],['fecha','Fecha','date',false],['institucion','Institución / entidad','text',false],['horas','Horas','number',false],['numero','N.º / código','text',false],['archivo','Archivo / referencia','text',false],['url','Enlace','url',false],['descripcion','Observaciones','textarea',false]],columns:[r=>pick(r,['fecha','date']),r=>pick(r,['titulo','nombre','certificado']),r=>pick(r,['tipo']),r=>pick(r,['institucion','entidad','organizador']),r=>pick(r,['horas','duracion'])]}
    };

    function makeTable(title,icon,type,rows,columns,managed){
        const body=rows.map((r,i)=>'<tr data-hv-row>'+columns.map(c=>'<td>'+escH(c(r))+'</td>').join('')+'<td><div class="rowactions"><button class="btn btn-ghost btn-sm hv-detail" data-type="'+type+'" data-index="'+i+'">Ver todo</button>'+(managed?'<button class="btn btn-ghost btn-sm hv-edit" data-type="'+type+'" data-index="'+i+'">Editar</button><button class="btn btn-danger btn-sm hv-delete" data-type="'+type+'" data-index="'+i+'">Eliminar</button>':'')+'</div></td></tr>').join('');
        return '<section class="card hv-section" data-hv-table="'+type+'"><div class="card-h hv-table-head"><div><h3>'+icon+' '+escH(title)+'</h3><small data-hv-count>'+rows.length+' registro'+(rows.length===1?'':'s')+'</small></div><input class="hv-search" data-hv-search placeholder="🔎 Buscar en toda la tabla…"></div>'+(rows.length?'<div class="table-wrap"><table class="hv-table"><thead><tr>'+columns.map(c=>'<th>'+escH(c.label||'Información')+'</th>').join('')+'<th>Acciones</th></tr></thead><tbody>'+body+'</tbody></table></div>':'<div class="empty">Sin registros disponibles.</div>')+'</section>';
    }
    function labeled(columns,labels){ return columns.map((fn,i)=>{fn.label=labels[i]||'Información';return fn;}); }

    function renderHojaVidaExtras(){
        const main=document.getElementById('main'); if(!main||!window.S||window.S.view!=='experiencia')return;
        const panel=Array.from(main.querySelectorAll('.panel')).find(p=>/Hoja de vida/i.test(p.textContent||'')); if(!panel)return;
        const body=panel.querySelector('.panel-body'); if(!body)return;
        const dp=window.S.datosPersonales||{},formacion=getRows('formacion'),cursos=getRows('cursos'),experiencia=getRows('experiencia'),publicaciones=getRows('publicaciones'),eventos=getRows('eventos'),certificados=getRows('certificados');
        const personal='<section class="card hv-section"><div class="card-h"><h3>📌 Datos personales y profesionales</h3></div><div class="hv-personal-grid">'+Object.keys(dp).filter(k=>txt(dp[k])).map(k=>'<div><small>'+escH(k)+'</small><strong>'+escH(typeof dp[k]==='object'?JSON.stringify(dp[k]):dp[k])+'</strong></div>').join('')+'</div></section>';
        const excel='<div class="hv-overview"><div><strong>Hoja de Vida completa</strong><small> Información completa, tablas dinámicas y gestión de nuevos registros.</small></div><button class="btn btn-primary" id="btn-hv-excel">📊 Exportar a Excel</button></div>';
        const managedButtons='<div class="hv-manager-actions"><button class="btn btn-primary hv-add" data-type="publicaciones">＋ Publicación</button><button class="btn btn-primary hv-add" data-type="eventos">＋ Conversatorio / evento</button><button class="btn btn-primary hv-add" data-type="certificados">＋ Certificado</button></div>';
        body.innerHTML=excel+personal+managedButtons+
            makeTable('Formación académica','🎓','formacion',formacion,labeled([r=>pick(r,['institucion','universidad','entidad']),r=>pick(r,['grado','titulo','nivel','nombre']),r=>pick(r,['fecha','desde']),r=>allText(r)],['Institución','Grado / título','Fecha','Información completa']),false)+
            makeTable('Cursos y capacitaciones','📚','cursos',cursos,labeled([r=>pick(r,['curso','titulo','nombre']),r=>pick(r,['institucion','universidad','entidad']),r=>pick(r,['horas','duracion']),r=>pick(r,['fecha','desde'])],['Curso','Institución','Horas / duración','Fecha']),false)+
            makeTable('Experiencia profesional','💼','experiencia',experiencia,labeled([r=>pick(r,['empresa','entidad','institucion']),r=>pick(r,['cargo','proyecto','objeto','descripcion']),r=>pick(r,['desde','fecha']),r=>pick(r,['hasta'])],['Entidad','Cargo / proyecto','Desde','Hasta']),false)+
            makeTable(CONFIG.publicaciones.title,CONFIG.publicaciones.icon,'publicaciones',publicaciones,labeled(CONFIG.publicaciones.columns,['Título','Autores','Año / fecha','Revista / editorial','DOI / enlace']),true)+
            makeTable(CONFIG.eventos.title,CONFIG.eventos.icon,'eventos',eventos,labeled(CONFIG.eventos.columns,['Fecha','Evento','Tipo','Institución / organizador','Rol / participación']),true)+
            makeTable(CONFIG.certificados.title,CONFIG.certificados.icon,'certificados',certificados,labeled(CONFIG.certificados.columns,['Fecha','Certificado','Tipo','Institución','Horas']),true);
        panel.dataset.hvEnhanced='1';
        const excelBtn=document.getElementById('btn-hv-excel');if(excelBtn)excelBtn.addEventListener('click',exportHojaVidaCompleta);bindTables(body);
    }

    function bindTables(root){
        root.querySelectorAll('[data-hv-search]').forEach(input=>input.addEventListener('input',()=>{const q=txt(input.value).toLowerCase(),section=input.closest('[data-hv-table]');if(!section)return;let visible=0;section.querySelectorAll('tbody tr').forEach(tr=>{const show=tr.textContent.toLowerCase().includes(q);tr.style.display=show?'':'none';if(show)visible++;});const count=section.querySelector('[data-hv-count]');if(count)count.textContent=visible+' visibles de '+section.querySelectorAll('tbody tr').length;}));
        root.querySelectorAll('.hv-detail').forEach(btn=>btn.addEventListener('click',()=>showDetail(btn.dataset.type,Number(btn.dataset.index))));
        root.querySelectorAll('.hv-add').forEach(btn=>btn.addEventListener('click',()=>openManagedModal(btn.dataset.type)));
        root.querySelectorAll('.hv-edit').forEach(btn=>btn.addEventListener('click',()=>openManagedModal(btn.dataset.type,Number(btn.dataset.index))));
        root.querySelectorAll('.hv-delete').forEach(btn=>btn.addEventListener('click',()=>deleteManaged(btn.dataset.type,Number(btn.dataset.index))));
    }

    function showDetail(type,index){
        const record=getRows(type)[index];if(!record)return;const overlay=document.createElement('div');overlay.className='overlay';
        overlay.innerHTML='<div class="modal" style="max-width:900px"><div class="modal-h"><h3>📋 Detalle completo</h3><button class="close">&times;</button></div><div class="modal-body"><dl class="hv-detail-list">'+Object.keys(record).filter(k=>k!=='__source').map(k=>'<div><dt>'+escH(k)+'</dt><dd>'+escH(typeof record[k]==='object'?JSON.stringify(record[k],null,2):record[k])+'</dd></div>').join('')+'</dl></div></div>';
        document.body.appendChild(overlay);overlay.querySelector('.close').onclick=()=>overlay.remove();overlay.addEventListener('mousedown',e=>{if(e.target===overlay)overlay.remove();});
    }

    function openManagedModal(type,index){
        const cfg=CONFIG[type],rows=getRows(type),editing=Number.isInteger(index),source=editing&&rows[index]?rows[index]:{},overlay=document.createElement('div');overlay.className='overlay';
        const fields=cfg.fields.map(f=>'<div class="field"><label>'+escH(f[1])+(f[3]?' *':'')+'</label>'+(f[2]==='textarea'?'<textarea data-hv-field="'+f[0]+'">'+escH(source[f[0]])+'</textarea>':'<input data-hv-field="'+f[0]+'" type="'+f[2]+'" value="'+attrH(source[f[0]])+'" '+(f[3]?'required':'')+'></div>').join('');
        overlay.innerHTML='<div class="modal" style="max-width:780px"><div class="modal-h"><h3>'+cfg.icon+' '+(editing?'Editar ':'Nueva ')+escH(cfg.title)+'</h3><button class="close">&times;</button></div><div class="modal-body"><div class="hv-form-grid">'+fields+'</div><p class="hv-form-note">Los cambios se guardan en la cuenta del usuario y no modifican otros módulos.</p></div><div class="modal-foot"><button class="btn btn-ghost hv-cancel">Cancelar</button><button class="btn btn-primary hv-save">'+(editing?'Actualizar':'Guardar')+'</button></div></div>';
        document.body.appendChild(overlay);const close=()=>overlay.remove();overlay.querySelector('.close').onclick=close;overlay.querySelector('.hv-cancel').onclick=close;overlay.addEventListener('mousedown',e=>{if(e.target===overlay)close();});
        overlay.querySelector('.hv-save').onclick=async()=>{
            const record={id:editing&&source.id?source.id:uidH()};let valid=true;cfg.fields.forEach(f=>{const el=overlay.querySelector('[data-hv-field="'+f[0]+'"]'),value=txt(el.value);if(f[3]&&!value)valid=false;if(value)record[f[0]]=f[2]==='number'?Number(value):value;else delete record[f[0]];});
            if(!valid){toast('Completa los campos obligatorios.');return;}if(!window.S||!window.S.user?.uid){toast('❌ No hay un usuario autenticado.');return;}
            if(editing)rows[index]=record;else rows.push(record);const saveFn=window[cfg.save];
            try{if(typeof saveFn!=='function')throw new Error('Función de guardado no disponible');const ok=await saveFn(window.S.user.uid);if(ok===false&&typeof cloudReady!=='undefined'&&!cloudReady)console.warn('Guardado local: Firebase no está disponible.');close();renderHojaVidaExtras();toast(editing?'✅ Registro actualizado.':'✅ Registro guardado.');}
            catch(err){if(editing)rows[index]=source;else rows.pop();console.error('Hoja de Vida:',err);toast('❌ No se pudo guardar el registro.');}
        };
    }

    async function deleteManaged(type,index){
        const cfg=CONFIG[type],rows=getRows(type),record=rows[index];if(!record)return;if(!confirm('¿Eliminar este registro de '+cfg.title+'? Esta acción elimina únicamente el registro seleccionado.'))return;const backup=rows.splice(index,1)[0];
        try{const saveFn=window[cfg.save];if(typeof saveFn!=='function')throw new Error('Función de guardado no disponible');await saveFn(window.S.user?.uid);renderHojaVidaExtras();toast('✅ Registro eliminado.');}catch(err){rows.splice(index,0,backup);console.error('Hoja de Vida:',err);toast('❌ No se pudo eliminar el registro.');}
    }

    async function exportHojaVidaCompleta(){
        try{if(window.HidroLoader&&window.HidroLoader.loadXLSX)await window.HidroLoader.loadXLSX();if(!window.XLSX||!XLSX.utils||!XLSX.utils.book_new){toast('❌ No se pudo cargar la librería Excel.');return;}const s=window.S||{},wb=XLSX.utils.book_new();const sheets=[['Datos personales',[s.datosPersonales||{}]],['Formación académica',arr(s.formacion)],['Cursos y capacitaciones',arr(s.cursos)],['Experiencia profesional',arr(s.experiencia)],['Publicaciones académicas',arr(s.publicaciones)],['Conversatorios y eventos',arr(s.eventos)],['Certificados y respaldos',arr(s.certificados)],['Competencias',arr(s.competencias)],['Documentos',arr(s.documentos)]];sheets.forEach(([name,rows])=>{const safeRows=rows.length?rows:[{Información:'Sin registros'}];const data=safeRows.map(r=>{const o={};Object.keys(r||{}).filter(k=>k!=='__source').forEach(k=>o[k]=typeof r[k]==='object'?JSON.stringify(r[k]):r[k]);return o;});const ws=XLSX.utils.json_to_sheet(data);if(ws['!ref'])ws['!autofilter']={ref:ws['!ref']};XLSX.utils.book_append_sheet(wb,ws,name.slice(0,31));});XLSX.writeFile(wb,'Hoja_de_Vida_Ing_Antequera_'+new Date().toISOString().slice(0,10)+'.xlsx');toast('✅ Hoja de Vida exportada a Excel.');}catch(error){console.error('Error exportando Hoja de Vida:',error);toast('❌ Error al exportar la Hoja de Vida.');}
    }

    function installStyles(){if(document.getElementById('hv-enhanced-styles'))return;const style=document.createElement('style');style.id='hv-enhanced-styles';style.textContent='.hv-overview{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 16px;margin-bottom:16px;border:1px solid var(--border);border-radius:10px;background:var(--surface)}.hv-overview small{color:var(--text-soft)}.hv-manager-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.hv-section{margin-top:16px;overflow:hidden}.hv-table-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.hv-search{min-width:260px;padding:8px 11px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text)}.hv-table td{white-space:normal;vertical-align:top;line-height:1.4;max-width:520px}.hv-table .rowactions{display:flex;gap:5px;flex-wrap:wrap}.hv-personal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;padding:16px}.hv-personal-grid>div{padding:10px 12px;border:1px solid var(--border);border-radius:9px}.hv-personal-grid small{display:block;color:var(--text-soft);font-size:11px;margin-bottom:3px}.hv-personal-grid strong{display:block;word-break:break-word}.hv-detail-list>div{display:grid;grid-template-columns:190px 1fr;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)}.hv-detail-list dt{font-weight:700}.hv-detail-list dd{margin:0;white-space:pre-wrap;word-break:break-word}.hv-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hv-form-grid .field:has(textarea){grid-column:1/-1}.hv-form-grid textarea{min-height:100px}.hv-form-note{font-size:12px;color:var(--text-soft);margin:12px 0 0}@media(max-width:700px){.hv-table{min-width:900px}.hv-section .table-wrap{overflow-x:auto}.hv-search{min-width:0;width:100%}.hv-detail-list>div{grid-template-columns:1fr}.hv-form-grid{grid-template-columns:1fr}.hv-form-grid .field:has(textarea){grid-column:auto}}';document.head.appendChild(style);}

    window.exportHojaVidaCompleta=exportHojaVidaCompleta;window.exportHojaVidaExcel=exportHojaVidaCompleta;window.renderHojaVidaExtras=renderHojaVidaExtras;installStyles();setTimeout(renderHojaVidaExtras,700);window.addEventListener('rni:rendered',()=>setTimeout(renderHojaVidaExtras,80));
})();
