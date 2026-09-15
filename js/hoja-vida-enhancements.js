/* ============================================================
 * HOJA DE VIDA — visualización completa y exportación Excel
 * Solo lectura: no modifica ni elimina datos de Firebase.
 * ============================================================ */
(function () {
    'use strict';

    const arr = v => Array.isArray(v) ? v : [];
    const txt = v => String(v == null ? '' : v).trim();
    const escH = v => typeof esc === 'function' ? esc(txt(v)) : txt(v).replace(/[&<>"']/g, function (m) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
    });

    function pick(o, names) {
        for (const name of names) {
            if (o && txt(o[name])) return o[name];
        }
        return '';
    }

    function allText(o) {
        return Object.keys(o || {}).filter(k => k !== '__source').map(k => {
            const v = o[k];
            if (v == null || v === '') return '';
            return k + ': ' + (typeof v === 'object' ? JSON.stringify(v) : v);
        }).filter(Boolean).join(' · ');
    }

    function getRows(type) {
        const s = window.S || {};
        if (type === 'formacion') return arr(s.formacion);
        if (type === 'cursos') return arr(s.cursos);
        if (type === 'experiencia') return arr(s.experiencia);
        if (type === 'publicaciones') return arr(s.publicaciones || s.publicacionesAcademicas);
        if (type === 'eventos') return arr(s.eventos || s.conversatorios || s.eventosAcademicos);
        if (type === 'certificados') return arr(s.certificados || s.certificaciones);
        return [];
    }

    function makeTable(title, icon, type, rows, columns) {
        const body = rows.map(function (r, i) {
            return '<tr>' + columns.map(function (c) {
                return '<td>' + escH(c(r)) + '</td>';
            }).join('') + '<td><button class="btn btn-ghost btn-sm hv-detail" data-type="' + type + '" data-index="' + i + '">Ver todo</button></td></tr>';
        }).join('');

        return '<section class="card hv-section" data-hv-table="' + type + '">' +
            '<div class="card-h hv-table-head"><div><h3>' + icon + ' ' + title + '</h3><small>' + rows.length + ' registro' + (rows.length === 1 ? '' : 's') + '</small></div>' +
            '<input class="hv-search" data-hv-search placeholder="🔎 Buscar…"></div>' +
            (rows.length ? '<div class="table-wrap"><table class="hv-table"><thead><tr>' + columns.map(c => '<th>' + escH(c.label) + '</th>').join('') + '<th>Detalle</th></tr></thead><tbody>' + body + '</tbody></table></div>' : '<div class="empty">Sin registros disponibles.</div>') +
            '</section>';
    }

    function renderHojaVidaExtras() {
        const main = document.getElementById('main');
        if (!main || !window.S || window.S.view !== 'experiencia') return;

        const panel = Array.from(main.querySelectorAll('.panel')).find(function (p) {
            return /Hoja de vida/i.test(p.textContent || '');
        });
        if (!panel || panel.dataset.hvEnhanced === '1') return;

        const body = panel.querySelector('.panel-body');
        if (!body) return;

        const dp = window.S.datosPersonales || {};
        const formacion = getRows('formacion');
        const cursos = getRows('cursos');
        const experiencia = getRows('experiencia');
        const publicaciones = getRows('publicaciones');
        const eventos = getRows('eventos');
        const certificados = getRows('certificados');

        const personal = '<section class="card hv-section"><div class="card-h"><h3>📌 Datos personales y profesionales</h3></div><div class="hv-personal-grid">' +
            Object.keys(dp).filter(k => txt(dp[k])).map(k => '<div><small>' + escH(k) + '</small><strong>' + escH(dp[k]) + '</strong></div>').join('') + '</div></section>';

        const excel = '<div class="hv-overview"><div><strong>Hoja de Vida completa</strong><small> Toda la información disponible se muestra en tablas, sin truncamiento.</small></div><button class="btn btn-primary" id="btn-hv-excel">📊 Exportar a Excel</button></div>';

        body.innerHTML = excel + personal +
            makeTable('Formación académica','🎓','formacion',formacion,[
                Object.assign(r => pick(r,['institucion','universidad','entidad']),{label:'Institución'}),
                Object.assign(r => pick(r,['grado','titulo','nivel','nombre']),{label:'Grado / título'}),
                Object.assign(r => pick(r,['fecha','desde']),{label:'Fecha'}),
                Object.assign(r => allText(r),{label:'Información completa'})
            ]) +
            makeTable('Cursos y capacitaciones','📚','cursos',cursos,[
                Object.assign(r => pick(r,['curso','titulo','nombre']),{label:'Curso'}),
                Object.assign(r => pick(r,['institucion','universidad','entidad']),{label:'Institución'}),
                Object.assign(r => pick(r,['horas','duracion']),{label:'Horas / duración'}),
                Object.assign(r => pick(r,['fecha','desde']),{label:'Fecha'}),
                Object.assign(r => allText(r),{label:'Información completa'})
            ]) +
            makeTable('Experiencia profesional','💼','experiencia',experiencia,[
                Object.assign(r => pick(r,['empresa','entidad','institucion']),{label:'Entidad'}),
                Object.assign(r => pick(r,['cargo','proyecto','objeto','descripcion']),{label:'Cargo / proyecto'}),
                Object.assign(r => pick(r,['desde','fecha']),{label:'Desde'}),
                Object.assign(r => pick(r,['hasta']),{label:'Hasta'}),
                Object.assign(r => allText(r),{label:'Información completa'})
            ]) +
            makeTable('Publicaciones académicas','📖','publicaciones',publicaciones,[
                Object.assign(r => pick(r,['titulo','title','nombre']),{label:'Título'}),
                Object.assign(r => pick(r,['autores','autor']),{label:'Autores'}),
                Object.assign(r => pick(r,['fecha','año','anio','year']),{label:'Año / fecha'}),
                Object.assign(r => pick(r,['revista','institucion','editorial','evento']),{label:'Revista / institución'}),
                Object.assign(r => pick(r,['doi','url','enlace']),{label:'DOI / enlace'})
            ]) +
            makeTable('Conversatorios, seminarios, congresos y eventos académicos','🎤','eventos',eventos,[
                Object.assign(r => pick(r,['fecha','desde','date']),{label:'Fecha'}),
                Object.assign(r => pick(r,['titulo','nombre','evento']),{label:'Evento'}),
                Object.assign(r => pick(r,['tipo','categoria']),{label:'Tipo'}),
                Object.assign(r => pick(r,['institucion','organizador','entidad']),{label:'Institución / organizador'}),
                Object.assign(r => allText(r),{label:'Información completa'})
            ]) +
            makeTable('Certificados y respaldos','📜','certificados',certificados,[
                Object.assign(r => pick(r,['fecha','desde','date']),{label:'Fecha'}),
                Object.assign(r => pick(r,['titulo','nombre','certificado']),{label:'Certificado'}),
                Object.assign(r => pick(r,['institucion','entidad','organizador']),{label:'Institución'}),
                Object.assign(r => pick(r,['archivo','url','enlace']),{label:'Documento / enlace'}),
                Object.assign(r => allText(r),{label:'Información completa'})
            ]);

        panel.dataset.hvEnhanced = '1';
        const excelBtn = document.getElementById('btn-hv-excel');
        if (excelBtn) excelBtn.addEventListener('click', exportHojaVidaCompleta);
        bindTables(body);
    }

    function bindTables(root) {
        root.querySelectorAll('[data-hv-search]').forEach(function (input) {
            input.addEventListener('input', function () {
                const q = txt(input.value).toLowerCase();
                const section = input.closest('[data-hv-table]');
                if (!section) return;
                section.querySelectorAll('tbody tr').forEach(function (tr) {
                    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
                });
            });
        });

        root.querySelectorAll('.hv-detail').forEach(function (button) {
            button.addEventListener('click', function () {
                const rows = getRows(button.dataset.type);
                const record = rows[Number(button.dataset.index)];
                if (!record) return;
                const overlay = document.createElement('div');
                overlay.className = 'overlay';
                overlay.innerHTML = '<div class="modal" style="max-width:850px"><div class="modal-h"><h3>📋 Detalle completo</h3><button class="close">&times;</button></div><div class="modal-body"><dl class="hv-detail-list">' +
                    Object.keys(record).filter(k => k !== '__source').map(k => '<div><dt>' + escH(k) + '</dt><dd>' + escH(typeof record[k] === 'object' ? JSON.stringify(record[k], null, 2) : record[k]) + '</dd></div>').join('') +
                    '</dl></div></div>';
                document.body.appendChild(overlay);
                overlay.querySelector('.close').onclick = () => overlay.remove();
                overlay.addEventListener('mousedown', e => { if (e.target === overlay) overlay.remove(); });
            });
        });
    }

    async function exportHojaVidaCompleta() {
        try {
            if (window.HidroLoader && window.HidroLoader.loadXLSX) await window.HidroLoader.loadXLSX();
            if (!window.XLSX || !XLSX.utils || !XLSX.utils.book_new) {
                if (typeof toast === 'function') toast('❌ No se pudo cargar la librería Excel.');
                return;
            }
            const s = window.S || {};
            const wb = XLSX.utils.book_new();
            const sheets = [
                ['Datos personales',[s.datosPersonales || {}]],
                ['Formación académica',arr(s.formacion)],
                ['Cursos y capacitaciones',arr(s.cursos)],
                ['Experiencia profesional',arr(s.experiencia)],
                ['Publicaciones académicas',getRows('publicaciones')],
                ['Conversatorios y eventos',getRows('eventos')],
                ['Certificados y respaldos',getRows('certificados')],
                ['Competencias',arr(s.competencias)],
                ['Documentos',arr(s.documentos)]
            ];
            sheets.forEach(function (entry) {
                const name = entry[0];
                const rows = entry[1].length ? entry[1] : [{Información:'Sin registros'}];
                const data = rows.map(function (r) {
                    const out = {};
                    Object.keys(r || {}).forEach(function (k) {
                        if (k === '__source') return;
                        const v = r[k];
                        out[k] = typeof v === 'object' ? JSON.stringify(v) : v;
                    });
                    return out;
                });
                const ws = XLSX.utils.json_to_sheet(data);
                if (ws['!ref']) ws['!autofilter'] = {ref: ws['!ref']};
                XLSX.utils.book_append_sheet(wb, ws, name.slice(0,31));
            });
            XLSX.writeFile(wb, 'Hoja_de_Vida_Ing_Antequera_' + new Date().toISOString().slice(0,10) + '.xlsx');
            if (typeof toast === 'function') toast('✅ Hoja de Vida exportada a Excel.');
        } catch (error) {
            console.error('Error exportando Hoja de Vida:', error);
            if (typeof toast === 'function') toast('❌ Error al exportar la Hoja de Vida.');
        }
    }

    function installStyles() {
        if (document.getElementById('hv-enhanced-styles')) return;
        const style = document.createElement('style');
        style.id = 'hv-enhanced-styles';
        style.textContent = '.hv-overview{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 16px;margin-bottom:16px;border:1px solid var(--border);border-radius:10px;background:var(--surface)}.hv-overview small{color:var(--text-soft)}.hv-section{margin-top:16px;overflow:hidden}.hv-table-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.hv-search{min-width:220px;padding:8px 11px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text)}.hv-table td{white-space:normal;vertical-align:top;line-height:1.4;max-width:520px}.hv-personal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;padding:16px}.hv-personal-grid>div{padding:10px 12px;border:1px solid var(--border);border-radius:9px}.hv-personal-grid small{display:block;color:var(--text-soft);font-size:11px;margin-bottom:3px}.hv-personal-grid strong{display:block;word-break:break-word}.hv-detail-list>div{display:grid;grid-template-columns:180px 1fr;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)}.hv-detail-list dt{font-weight:700}.hv-detail-list dd{margin:0;white-space:pre-wrap;word-break:break-word}@media(max-width:700px){.hv-table{min-width:900px}.hv-section .table-wrap{overflow-x:auto}.hv-search{min-width:0;width:100%}.hv-detail-list>div{grid-template-columns:1fr}}';
        document.head.appendChild(style);
    }

    window.exportHojaVidaCompleta = exportHojaVidaCompleta;
    window.exportHojaVidaExcel = exportHojaVidaCompleta;
    window.renderHojaVidaExtras = renderHojaVidaExtras;
    installStyles();
    setTimeout(renderHojaVidaExtras, 700);
    window.addEventListener('rni:rendered', function () { setTimeout(renderHojaVidaExtras, 80); });
})();
