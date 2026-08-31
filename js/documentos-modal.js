// ============================================================
// DOCUMENTOS - Modal de adjuntos persistentes
// ============================================================
// Sobrescribe el modal anterior sin modificar modals.js.

(function () {
    'use strict';

    const fallbackTypes = {
        seprec: { label: 'SEPREC', icon: '🏢' },
        nit: { label: 'NIT', icon: '🧾' },
        rni: { label: 'RNI', icon: '🎓' },
        otro: { label: 'Otro', icon: '📌' },
        soat: { label: 'SOAT', icon: '🚗' },
        ruat: { label: 'RUAT / CRPVA', icon: '🚙' },
        licencia: { label: 'Licencia de conducir', icon: '🪪' },
        carnetIdentidad: { label: 'Carnet de identidad', icon: '🪪' },
        carnetProfesional: { label: 'Carnet profesional / RNI', icon: '🎫' }
    };

    function getTypes() {
        return typeof TIPOS_DOCUMENTOS !== 'undefined' ? TIPOS_DOCUMENTOS : fallbackTypes;
    }

    function getExistingAttachment(d) {
        if (d?.archivoStorage?.url) return d.archivoStorage;
        if (typeof d?.archivo === 'string' && d.archivo.startsWith('http')) {
            return { url: d.archivo, nombre: d.nombreArchivo || '', legacy: true };
        }
        if (typeof d?.archivo === 'string' && d.archivo.startsWith('data:')) {
            return { url: d.archivo, nombre: d.nombreArchivo || '', legacy: true };
        }
        return null;
    }

    window.openDocModal = async function (doc) {
        const isNew = !doc;
        const d = doc ? { ...doc } : {
            id: uid(), tipo: 'seprec', nombre: '', numero: '',
            fechaEmision: new Date().toISOString().slice(0, 10),
            fechaVencimiento: '', archivo: null, nombreArchivo: '',
            archivoStorage: null, observaciones: ''
        };
        const existing = getExistingAttachment(d);
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        const types = getTypes();

        overlay.innerHTML = `
        <div class="modal" style="max-width:680px;">
            <div class="modal-h">
                <h3>${isNew ? '📄 Nuevo documento' : '✏️ Editar documento'}</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="row2">
                    <div class="field"><label>Tipo de documento</label>
                        <select id="doc-tipo">
                            ${Object.entries(types).map(([key, val]) => `<option value="${attr(key)}" ${d.tipo === key ? 'selected' : ''}>${val.icon || '📄'} ${esc(val.label || key)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field"><label>Nombre del documento</label>
                        <input id="doc-nombre" value="${attr(d.nombre || '')}" placeholder="Ej. SOAT vehículo 2026">
                    </div>
                </div>
                <div class="field"><label>Número / placa / registro</label>
                    <input id="doc-numero" value="${attr(d.numero || '')}" placeholder="Ej. ABC-1234 / N° de registro">
                </div>
                <div class="row2">
                    <div class="field"><label>Fecha de emisión</label><input type="date" id="doc-fecha-emision" value="${attr(d.fechaEmision || '')}"></div>
                    <div class="field"><label>Fecha de vencimiento</label><input type="date" id="doc-fecha-vencimiento" value="${attr(d.fechaVencimiento || '')}">
                        <div style="font-size:11px;color:var(--text-soft);margin-top:2px;">Dejar en blanco si no vence.</div>
                    </div>
                </div>
                <div class="field">
                    <label>Archivo adjunto</label>
                    <input type="file" id="doc-archivo" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png">
                    <div id="doc-file-status" style="margin-top:7px;font-size:12px;color:var(--text-soft);">
                        ${existing ? `📎 Archivo actual: <b>${esc(existing.nombre || d.nombreArchivo || 'Adjunto')}</b>` : '📎 Sin archivo adjunto'}
                    </div>
                    <button type="button" class="btn btn-sm btn-danger" id="doc-remove-file" style="margin-top:7px;${existing ? '' : 'display:none;'}">Quitar archivo</button>
                    <div style="font-size:11px;color:var(--text-soft);margin-top:4px;">PDF, JPG o PNG · máximo 15 MB · almacenamiento persistente en Firebase.</div>
                </div>
                <div class="field"><label>Observaciones</label><textarea id="doc-observaciones" rows="3">${esc(d.observaciones || '')}</textarea></div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-primary" id="m-save">${isNew ? 'Guardar documento' : 'Actualizar documento'}</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);

        let selectedFile = null;
        let currentAttachment = existing;
        let removeAttachment = false;
        const input = overlay.querySelector('#doc-archivo');
        const status = overlay.querySelector('#doc-file-status');
        const removeBtn = overlay.querySelector('#doc-remove-file');
        const saveBtn = overlay.querySelector('#m-save');

        input.onchange = e => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 15 * 1024 * 1024) {
                toast('⚠️ El archivo no puede superar los 15 MB.'); input.value = ''; return;
            }
            if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                toast('⚠️ Solo se permiten PDF, JPG o PNG.'); input.value = ''; return;
            }
            selectedFile = file;
            removeAttachment = false;
            status.innerHTML = `📎 Nuevo archivo: <b>${esc(file.name)}</b> · ${(file.size / 1048576).toFixed(2)} MB`;
            removeBtn.style.display = '';
        };

        removeBtn.onclick = () => {
            selectedFile = null;
            input.value = '';
            removeAttachment = true;
            status.textContent = '📎 Sin archivo adjunto';
            removeBtn.style.display = 'none';
        };

        const close = () => overlay.remove();
        overlay.querySelector('#m-close').onclick = close;
        overlay.querySelector('#m-cancel').onclick = close;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

        saveBtn.onclick = async () => {
            const nombre = overlay.querySelector('#doc-nombre').value.trim();
            if (!nombre) { toast('Ingresa un nombre para el documento.'); return; }
            saveBtn.disabled = true; saveBtn.textContent = 'Guardando…';

            try {
                if (selectedFile) {
                    if (typeof uploadDocumentFile !== 'function') throw new Error('No está cargado el módulo de almacenamiento.');
                    toast('⏳ Subiendo archivo…');
                    const uploaded = await uploadDocumentFile(selectedFile, d.id);
                    if (currentAttachment?.path && typeof deleteDocumentFile === 'function') {
                        await deleteDocumentFile(currentAttachment);
                    }
                    currentAttachment = uploaded;
                } else if (removeAttachment) {
                    if (currentAttachment?.path && typeof deleteDocumentFile === 'function') await deleteDocumentFile(currentAttachment);
                    currentAttachment = null;
                }

                const nuevo = {
                    id: d.id,
                    tipo: overlay.querySelector('#doc-tipo').value,
                    nombre,
                    numero: overlay.querySelector('#doc-numero').value.trim(),
                    fechaEmision: overlay.querySelector('#doc-fecha-emision').value,
                    fechaVencimiento: overlay.querySelector('#doc-fecha-vencimiento').value || '',
                    archivo: currentAttachment?.url || null,
                    nombreArchivo: currentAttachment?.nombre || '',
                    archivoStorage: currentAttachment?.path ? currentAttachment : null,
                    observaciones: overlay.querySelector('#doc-observaciones').value.trim()
                };

                if (isNew) S.documentos.push(nuevo);
                else S.documentos = S.documentos.map(x => x.id === nuevo.id ? nuevo : x);

                const ok = await saveDocumentos(S.user?.uid);
                if (!ok && typeof cloudReady !== 'undefined' && cloudReady) throw new Error('Firebase no confirmó el guardado del documento.');

                close(); render();
                toast(isNew ? '✅ Documento y archivo guardados.' : '✅ Documento actualizado.');
            } catch (error) {
                console.error('Error guardando documento:', error);
                toast('❌ ' + (error.message || 'No se pudo guardar el documento.'));
                saveBtn.disabled = false; saveBtn.textContent = isNew ? 'Guardar documento' : 'Actualizar documento';
            }
        };
    };

    window.verDocumento = function (docId) {
        const d = (S.documentos || []).find(x => String(x.id) === String(docId));
        const attachment = getExistingAttachment(d);
        if (!attachment?.url) return toast('⚠️ Este documento no tiene archivo adjunto.');
        const win = window.open(attachment.url, '_blank', 'noopener,noreferrer');
        if (!win) toast('⚠️ Permite ventanas emergentes para ver el documento.');
    };
})();
