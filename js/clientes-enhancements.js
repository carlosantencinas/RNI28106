// ============================================================
// CLIENTES - EDICIÓN REAL EN "MEMORIA > CLIENTES Y PROYECTOS"
// También conserva la edición completa de clientes y su vínculo
// con Contactos profesionales.
// ============================================================
(function (global) {
    'use strict';

    const norm = v => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const escC = v => typeof global.esc === 'function' ? global.esc(v ?? '') : String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
    const attrC = v => typeof global.attr === 'function' ? global.attr(v ?? '') : escC(v ?? '');
    const idC = () => typeof global.uid === 'function' ? global.uid() : `cli-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    const nombreCliente = c => c?.nombre || c?.razonSocial || c?.cliente || c?.empresa || '';
    const contactoNombre = c => c?.nombre || c?.name || '';
    const contactoById = id => (S.contactos || []).find(c => String(c.id) === String(id)) || null;

    function proyectosDeCliente(c) {
        const propios = Array.isArray(c?.proyectos) ? c.proyectos : String(c?.proyectos || '').split(/\n|;/).map(x => x.trim()).filter(Boolean);
        const n = norm(nombreCliente(c));
        const automaticos = (S.cotizaciones || [])
            .filter(x => norm(x.cliente || x.nombreCliente || x.razonSocial) === n)
            .map(x => x.proyecto)
            .filter(Boolean);
        return [...new Set([...propios, ...automaticos])];
    }

    function abrirEditorMemoria(id) {
        const idx = (S.clientes || []).findIndex(c => String(c.id) === String(id));
        if (idx < 0) return global.toast?.('⚠️ No se encontró el cliente.');

        const original = S.clientes[idx];
        const oldName = nombreCliente(original);
        const linked = original.contactoId ? contactoById(original.contactoId) : null;
        const base = {
            ...original,
            nombre: oldName,
            tipoPersona: original.tipoPersona || original.tipo || 'empresa',
            telefono: original.telefono || '',
            whatsapp: original.whatsapp || '',
            email: original.email || original.correo || '',
            nit: original.nit || '',
            documento: original.documento || original.ci || '',
            ciudad: original.ciudad || '',
            direccion: original.direccion || '',
            contacto: original.contacto || original.personaContacto || linked?.nombre || '',
            contactoId: original.contactoId || '',
            cargo: original.cargo || linked?.cargo || '',
            proyectos: proyectosDeCliente(original),
            notas: original.notas || ''
        };

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.zIndex = '10060';
        overlay.innerHTML = `
        <div class="modal" style="max-width:900px;width:calc(100% - 24px);max-height:92vh;overflow:hidden;">
            <div class="modal-h">
                <div>
                    <div style="font-size:10px;color:var(--text-soft);text-transform:uppercase;letter-spacing:.08em;">MEMORIA · CLIENTE</div>
                    <h3 style="margin-top:3px;">✏️ Editar cliente</h3>
                </div>
                <button class="close" id="mem-cli-close" type="button">&times;</button>
            </div>
            <div class="modal-body" style="overflow:auto;">
                <div style="padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2,#f7fafb);margin-bottom:16px;">
                    <strong style="font-size:12px;">Datos del cliente</strong>
                    <div style="font-size:11px;color:var(--text-soft);margin-top:4px;">Los cambios quedan guardados en la memoria del cliente.</div>
                </div>
                <div class="row2">
                    <div class="field"><label>Nombre / Razón social *</label><input id="mem-cli-nombre" value="${attrC(base.nombre)}" autocomplete="organization"></div>
                    <div class="field"><label>Tipo de persona</label><select id="mem-cli-tipo"><option value="empresa" ${base.tipoPersona === 'empresa' ? 'selected' : ''}>Empresa / institución</option><option value="persona" ${base.tipoPersona === 'persona' ? 'selected' : ''}>Persona natural</option></select></div>
                </div>
                <div class="row3">
                    <div class="field"><label>Teléfono</label><input id="mem-cli-telefono" type="tel" value="${attrC(base.telefono)}"></div>
                    <div class="field"><label>WhatsApp</label><input id="mem-cli-whatsapp" type="tel" value="${attrC(base.whatsapp)}"></div>
                    <div class="field"><label>Correo</label><input id="mem-cli-email" type="email" value="${attrC(base.email)}"></div>
                </div>
                <div class="row3">
                    <div class="field"><label>NIT</label><input id="mem-cli-nit" value="${attrC(base.nit)}"></div>
                    <div class="field"><label>CI / Documento</label><input id="mem-cli-documento" value="${attrC(base.documento)}"></div>
                    <div class="field"><label>Ciudad</label><input id="mem-cli-ciudad" value="${attrC(base.ciudad)}"></div>
                </div>
                <div class="field"><label>Dirección</label><input id="mem-cli-direccion" value="${attrC(base.direccion)}"></div>
                <div class="row2">
                    <div class="field"><label>Persona de contacto</label><input id="mem-cli-contacto" value="${attrC(base.contacto)}"></div>
                    <div class="field"><label>Cargo / función</label><input id="mem-cli-cargo" value="${attrC(base.cargo)}"></div>
                </div>
                <div class="field"><label>Contacto profesional vinculado</label><select id="mem-cli-contacto-id"><option value="">— Sin vínculo —</option>${(S.contactos || []).map(c => `<option value="${attrC(c.id)}" ${String(base.contactoId) === String(c.id) ? 'selected' : ''}>${escC(contactoNombre(c))}${c.empresa ? ' · ' + escC(c.empresa) : ''}</option>`).join('')}</select></div>
                <div class="field"><label>Proyectos asociados</label><textarea id="mem-cli-proyectos" rows="5" placeholder="Un proyecto por línea">${escC(base.proyectos.join('\n'))}</textarea></div>
                <div class="field"><label>Notas / información adicional</label><textarea id="mem-cli-notas" rows="4">${escC(base.notas)}</textarea></div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="mem-cli-cancel" type="button">Cancelar</button>
                <button class="btn btn-primary" id="mem-cli-save" type="button">💾 Guardar cambios</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#mem-cli-close').onclick = close;
        overlay.querySelector('#mem-cli-cancel').onclick = close;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

        overlay.querySelector('#mem-cli-contacto-id').onchange = () => {
            const c = contactoById(overlay.querySelector('#mem-cli-contacto-id').value);
            if (!c) return;
            const setIfEmpty = (sel, value) => {
                const el = overlay.querySelector(sel);
                if (el && !el.value.trim()) el.value = value || '';
            };
            setIfEmpty('#mem-cli-contacto', contactoNombre(c));
            setIfEmpty('#mem-cli-cargo', c.cargo);
            setIfEmpty('#mem-cli-telefono', c.telefono);
            setIfEmpty('#mem-cli-whatsapp', c.whatsapp);
            setIfEmpty('#mem-cli-email', c.email || c.correo);
            setIfEmpty('#mem-cli-nombre', c.empresa || c.cliente);
        };

        overlay.querySelector('#mem-cli-save').onclick = async () => {
            const nombre = overlay.querySelector('#mem-cli-nombre').value.trim();
            if (!nombre) return global.toast?.('⚠️ El nombre / razón social es obligatorio.');

            const duplicado = (S.clientes || []).find((c, i) => i !== idx && norm(nombreCliente(c)) === norm(nombre));
            if (duplicado) return global.toast?.('⚠️ Ya existe otro cliente con ese nombre.');

            const proyectos = overlay.querySelector('#mem-cli-proyectos').value.split('\n').map(x => x.trim()).filter(Boolean);
            const contactoId = overlay.querySelector('#mem-cli-contacto-id').value || '';
            const nuevo = {
                ...original,
                id: original.id || idC(),
                nombre,
                tipoPersona: overlay.querySelector('#mem-cli-tipo').value,
                telefono: overlay.querySelector('#mem-cli-telefono').value.trim(),
                whatsapp: overlay.querySelector('#mem-cli-whatsapp').value.trim(),
                email: overlay.querySelector('#mem-cli-email').value.trim(),
                nit: overlay.querySelector('#mem-cli-nit').value.trim(),
                documento: overlay.querySelector('#mem-cli-documento').value.trim(),
                ciudad: overlay.querySelector('#mem-cli-ciudad').value.trim(),
                direccion: overlay.querySelector('#mem-cli-direccion').value.trim(),
                contacto: overlay.querySelector('#mem-cli-contacto').value.trim(),
                personaContacto: overlay.querySelector('#mem-cli-contacto').value.trim(),
                contactoId,
                cargo: overlay.querySelector('#mem-cli-cargo').value.trim(),
                proyectos: [...new Set(proyectos)],
                notas: overlay.querySelector('#mem-cli-notas').value.trim(),
                actualizadoEn: new Date().toISOString()
            };

            // Si cambia el nombre, actualiza las referencias para no perder la relación
            // con cotizaciones y pagos ya registrados.
            if (oldName && oldName !== nombre) {
                S.cotizaciones = (S.cotizaciones || []).map(c => norm(c.cliente) === norm(oldName) ? { ...c, cliente: nombre } : c);
                S.pagos = (S.pagos || []).map(p => norm(p.cliente || p.entidad) === norm(oldName) ? { ...p, cliente: nombre, entidad: p.entidad && norm(p.entidad) === norm(oldName) ? nombre : p.entidad } : p);
            }

            S.clientes[idx] = nuevo;

            const linked = contactoById(contactoId);
            if (linked) {
                S.contactos = (S.contactos || []).map(c => String(c.id) === String(linked.id) ? {
                    ...c,
                    clienteId: nuevo.id,
                    empresa: c.empresa || nuevo.nombre,
                    telefono: nuevo.telefono || c.telefono || '',
                    whatsapp: nuevo.whatsapp || c.whatsapp || '',
                    email: nuevo.email || c.email || '',
                    cargo: nuevo.cargo || c.cargo || ''
                } : c);
            }

            try {
                await global.saveClientes(S.user?.uid);
                if (oldName !== nombre && typeof global.saveCotizaciones === 'function') await global.saveCotizaciones(S.user?.uid);
                if (oldName !== nombre && typeof global.savePagos === 'function') await global.savePagos(S.user?.uid);
                if (linked && typeof global.saveContactos === 'function') await global.saveContactos(S.user?.uid);
                close();
                global.render?.();
                global.toast?.('✅ Cliente actualizado correctamente.');
            } catch (err) {
                console.error('[Memoria > Clientes] Error guardando:', err);
                global.toast?.('❌ No se pudo guardar el cliente. Revisa la consola.');
            }
        };
    }

    function abrirEditorNuevo() {
        const nuevo = { id: idC(), nombre:'', tipoPersona:'empresa', proyectos:[] };
        S.clientes = [...(S.clientes || []), nuevo];
        abrirEditorMemoria(nuevo.id);
    }

    function mejorarVistaMemoria() {
        if (!global.S || S.view !== 'clientes') return;
        const main = document.getElementById('main');
        if (!main) return;
        const titulo = main.querySelector('.page-head h1');
        if (!titulo || norm(titulo.textContent) !== 'clientes y proyectos') return;

        main.querySelectorAll('[data-del-cliente]').forEach(btn => {
            const card = btn.closest('div[style*="border:1px solid var(--border)"]') || btn.parentElement?.parentElement;
            if (!card || card.querySelector('[data-edit-memoria-cliente]')) return;
            const id = btn.dataset.delCliente;
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'iconbtn';
            edit.title = 'Editar cliente';
            edit.dataset.editMemoriaCliente = id;
            edit.innerHTML = global.ICONS?.edit || '✎';
            btn.parentElement?.insertBefore(edit, btn);
        });

        const add = main.querySelector('#btn-add-cliente');
        if (add && !add.dataset.memoriaWrapped) {
            // El botón original sigue funcionando para clientes nuevos. No lo reemplazamos.
            add.dataset.memoriaWrapped = '1';
        }
    }

    document.addEventListener('click', e => {
        const edit = e.target.closest?.('[data-edit-memoria-cliente]');
        if (edit) {
            e.preventDefault();
            e.stopPropagation();
            abrirEditorMemoria(edit.dataset.editMemoriaCliente);
        }
    }, true);

    global.abrirEditorClienteMemoria = abrirEditorMemoria;

    let timer = null;
    function watch() {
        const main = document.getElementById('main');
        if (!main) return setTimeout(watch, 150);
        const observer = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(mejorarVistaMemoria, 20);
        });
        observer.observe(main, { childList:true, subtree:true });
        mejorarVistaMemoria();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})(window);
