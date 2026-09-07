// ============================================================
// CLIENTES - FICHA COMPLETA + VINCULACIÓN CON CONTACTOS
// ============================================================
(function (global) {
    'use strict';

    const escC = v => typeof esc === 'function' ? esc(v ?? '') : String(v ?? '').replace(/[&<>\"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[m]));
    const attrC = v => typeof attr === 'function' ? attr(v ?? '') : escC(v ?? '');
    const normC = v => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    function clienteActual(idOrNombre) {
        const value = String(idOrNombre ?? '');
        return (S.clientes || []).find(c => c.id === value || normC(c.nombre) === normC(value)) || null;
    }

    function contactoActual(id) {
        return (S.contactos || []).find(c => c.id === id) || null;
    }

    function contactoCoincidente(cliente) {
        if (!cliente) return null;
        if (cliente.contactoId) {
            const linked = contactoActual(cliente.contactoId);
            if (linked) return linked;
        }
        const key = normC(cliente.contacto || '');
        const empresa = normC(cliente.nombre || '');
        return (S.contactos || []).find(c => normC(c.nombre) === key && (!empresa || !c.empresa || normC(c.empresa) === empresa)) || null;
    }

    function abrirFichaCliente(idOrNombre) {
        const existente = clienteActual(idOrNombre);
        const isNew = !existente;
        const base = existente ? { ...existente, proyectos: [...(existente.proyectos || [])] } : {
            id: typeof uid === 'function' ? uid() : `cli-${Date.now()}`,
            nombre: '', tipoPersona: 'empresa', telefono: '', email: '', whatsapp: '', nit: '', documento: '',
            direccion: '', ciudad: '', contacto: '', contactoId: '', cargo: '', notas: '', proyectos: []
        };
        const linked = contactoCoincidente(base);

        // Si existe un contacto vinculado, completar automáticamente datos vacíos.
        if (linked) {
            base.contactoId = linked.id;
            base.contacto = base.contacto || linked.nombre || '';
            base.cargo = base.cargo || linked.cargo || '';
            base.telefono = base.telefono || linked.telefono || '';
            base.email = base.email || linked.email || '';
            base.whatsapp = base.whatsapp || linked.whatsapp || '';
        }

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
        <div class="modal" style="max-width:820px;width:calc(100% - 24px);">
            <div class="modal-h">
                <div><div style="font-size:10px;color:var(--text-soft);text-transform:uppercase;letter-spacing:.08em;">CRM · ficha del cliente</div><h3 style="margin-top:2px;">${isNew ? 'Nuevo cliente' : `Editar: ${escC(base.nombre)}`}</h3></div>
                <button class="close" id="cl-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2,#f7fafb);margin-bottom:16px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--primary);margin-bottom:8px;">🔗 Contacto profesional vinculado</div>
                    <div class="row2">
                        <div class="field" style="margin-bottom:0;">
                            <label>Contacto</label>
                            <select id="cl-contacto-id">
                                <option value="">— Sin contacto vinculado —</option>
                                ${(S.contactos || []).map(ct => `<option value="${attrC(ct.id)}" ${base.contactoId === ct.id ? 'selected' : ''}>${escC(ct.nombre)}${ct.empresa ? ` · ${escC(ct.empresa)}` : ''}${ct.cargo ? ` · ${escC(ct.cargo)}` : ''}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display:flex;align-items:flex-end;padding-bottom:5px;font-size:11px;color:var(--text-soft);">Al vincularlo, teléfono, correo, WhatsApp, empresa y cargo pueden mantenerse sincronizados.</div>
                    </div>
                </div>

                <div class="row2">
                    <div class="field"><label>Nombre / Razón social *</label><input id="cl-nombre" value="${attrC(base.nombre)}" placeholder="Nombre del cliente o institución"></div>
                    <div class="field"><label>Tipo</label><select id="cl-tipo"><option value="empresa" ${base.tipoPersona==='empresa'?'selected':''}>Empresa / institución</option><option value="persona" ${base.tipoPersona==='persona'?'selected':''}>Persona natural</option></select></div>
                </div>
                <div class="row3">
                    <div class="field"><label>Teléfono</label><input id="cl-telefono" type="tel" value="${attrC(base.telefono)}" placeholder="Teléfono"></div>
                    <div class="field"><label>WhatsApp</label><input id="cl-whatsapp" type="tel" value="${attrC(base.whatsapp)}" placeholder="WhatsApp"></div>
                    <div class="field"><label>Correo electrónico</label><input id="cl-email" type="email" value="${attrC(base.email)}" placeholder="correo@ejemplo.com"></div>
                </div>
                <div class="row3">
                    <div class="field"><label>NIT</label><input id="cl-nit" value="${attrC(base.nit)}" placeholder="NIT"></div>
                    <div class="field"><label>Documento / CI</label><input id="cl-documento" value="${attrC(base.documento)}" placeholder="CI u otro documento"></div>
                    <div class="field"><label>Ciudad</label><input id="cl-ciudad" value="${attrC(base.ciudad)}" placeholder="Ej. Sucre"></div>
                </div>
                <div class="field"><label>Dirección</label><input id="cl-direccion" value="${attrC(base.direccion)}" placeholder="Dirección fiscal o de contacto"></div>
                <div class="row2">
                    <div class="field"><label>Persona de contacto</label><input id="cl-contacto" value="${attrC(base.contacto)}" placeholder="Nombre del contacto"></div>
                    <div class="field"><label>Cargo / función</label><input id="cl-cargo" value="${attrC(base.cargo)}" placeholder="Ej. Gerente, Fiscal de obra"></div>
                </div>
                <div class="field"><label>Proyectos asociados</label><textarea id="cl-proyectos" rows="3" placeholder="Un proyecto por línea">${escC((base.proyectos||[]).join('\n'))}</textarea><div style="font-size:11px;color:var(--text-soft);margin-top:3px;">También se agregan automáticamente los proyectos encontrados en tus cotizaciones.</div></div>
                <div class="field"><label>Notas</label><textarea id="cl-notas" rows="3" placeholder="Observaciones, preferencias, condiciones comerciales, etc.">${escC(base.notas)}</textarea></div>
            </div>
            <div class="modal-foot"><button class="btn btn-ghost" id="cl-cancel">Cancelar</button><button class="btn btn-primary" id="cl-save">${isNew?'Crear cliente':'Guardar cambios'}</button></div>
        </div>`;
        document.body.appendChild(overlay);

        const fillFromContact = () => {
            const id = overlay.querySelector('#cl-contacto-id').value;
            const ct = contactoActual(id);
            if (!ct) return;
            const setIfEmpty = (selector, value) => { const el = overlay.querySelector(selector); if (el && !el.value.trim()) el.value = value || ''; };
            setIfEmpty('#cl-contacto', ct.nombre);
            setIfEmpty('#cl-cargo', ct.cargo);
            setIfEmpty('#cl-telefono', ct.telefono);
            setIfEmpty('#cl-whatsapp', ct.whatsapp);
            setIfEmpty('#cl-email', ct.email);
            if (!overlay.querySelector('#cl-nombre').value.trim() && ct.empresa) overlay.querySelector('#cl-nombre').value = ct.empresa;
        };
        overlay.querySelector('#cl-contacto-id').addEventListener('change', fillFromContact);

        const close = () => overlay.remove();
        overlay.querySelector('#cl-close').onclick = close;
        overlay.querySelector('#cl-cancel').onclick = close;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

        overlay.querySelector('#cl-save').onclick = async () => {
            const nombre = overlay.querySelector('#cl-nombre').value.trim();
            if (!nombre) { toast('⚠️ El nombre / razón social es obligatorio.'); return; }
            const key = normC(nombre);
            const duplicado = (S.clientes || []).find(x => normC(x.nombre) === key && x.id !== base.id);
            if (duplicado) { toast('⚠️ Ya existe un cliente con ese nombre.'); return; }

            const proyectosManuales = overlay.querySelector('#cl-proyectos').value.split('\n').map(x => x.trim()).filter(Boolean);
            const proyectosCot = (S.cotizaciones || []).filter(x => normC(x.cliente) === key).map(x => x.proyecto).filter(Boolean);
            const contactoId = overlay.querySelector('#cl-contacto-id').value || '';
            const ct = contactoActual(contactoId);
            const nuevo = {
                ...base,
                nombre,
                tipoPersona: overlay.querySelector('#cl-tipo').value,
                telefono: overlay.querySelector('#cl-telefono').value.trim(),
                whatsapp: overlay.querySelector('#cl-whatsapp').value.trim(),
                email: overlay.querySelector('#cl-email').value.trim(),
                nit: overlay.querySelector('#cl-nit').value.trim(),
                documento: overlay.querySelector('#cl-documento').value.trim(),
                ciudad: overlay.querySelector('#cl-ciudad').value.trim(),
                direccion: overlay.querySelector('#cl-direccion').value.trim(),
                contacto: overlay.querySelector('#cl-contacto').value.trim(),
                contactoId,
                cargo: overlay.querySelector('#cl-cargo').value.trim(),
                proyectos: [...new Set([...proyectosManuales, ...proyectosCot])],
                notas: overlay.querySelector('#cl-notas').value.trim()
            };

            if (isNew) S.clientes.push(nuevo); else S.clientes = S.clientes.map(x => x.id === nuevo.id ? nuevo : x);

            // Actualización bidireccional: el contacto profesional queda con los datos del cliente.
            if (ct) {
                const contactoActualizado = {
                    ...ct,
                    empresa: ct.empresa || nuevo.nombre,
                    telefono: nuevo.telefono || ct.telefono || '',
                    whatsapp: nuevo.whatsapp || ct.whatsapp || '',
                    email: nuevo.email || ct.email || '',
                    cargo: nuevo.cargo || ct.cargo || '',
                    clienteId: nuevo.id
                };
                S.contactos = (S.contactos || []).map(x => x.id === ct.id ? contactoActualizado : x);
            }

            await saveClientes(S.user?.uid);
            if (ct && typeof saveContactos === 'function') await saveContactos(S.user?.uid);
            close();
            render();
            toast(isNew ? '✅ Cliente creado y contacto vinculado.' : '✅ Ficha del cliente actualizada.');
        };
    }

    function insertarBotonNuevoCliente() {
        const main = document.getElementById('main');
        if (!main || document.getElementById('btn-nuevo-cliente-ficha')) return;
        const host = main.querySelector('.page-head .page-actions') || main.querySelector('.page-head') || main.firstElementChild;
        if (!host) return;
        const btn = document.createElement('button');
        btn.id = 'btn-nuevo-cliente-ficha';
        btn.className = 'btn btn-primary';
        btn.type = 'button';
        btn.innerHTML = (typeof ICONS !== 'undefined' && ICONS.plus ? ICONS.plus + ' ' : '+ ') + 'Nuevo cliente';
        btn.onclick = () => abrirFichaCliente('');
        host.appendChild(btn);
    }

    function insertarBotonesFila() {
        const main = document.getElementById('main');
        if (!main) return;
        const clientes = S.clientes || [];
        if (!clientes.length) return;

        main.querySelectorAll('table tbody tr').forEach(tr => {
            if (tr.querySelector('[data-edit-cliente-ficha]')) return;
            const cells = [...tr.querySelectorAll('td')];
            if (!cells.length) return;

            // En la tabla de Clientes la primera celda corresponde al cliente. Si no coincide,
            // buscamos cualquier celda cuyo texto corresponda a un cliente registrado.
            let cliente = clientes.find(c => normC(c.nombre) === normC(cells[0]?.textContent));
            if (!cliente) cliente = clientes.find(c => cells.some(td => normC(td.textContent) === normC(c.nombre)));
            if (!cliente) return;

            let td = cells[cells.length - 1];
            if (!td) td = tr.appendChild(document.createElement('td'));
            const wrap = td.querySelector('.rowactions') || td.appendChild(Object.assign(document.createElement('div'), { className:'rowactions' }));
            if (wrap.querySelector('[data-edit-cliente-ficha]')) return;
            const btn = document.createElement('button');
            btn.type = 'button'; btn.className = 'iconbtn'; btn.title = 'Editar ficha del cliente'; btn.setAttribute('data-edit-cliente-ficha', cliente.id);
            btn.innerHTML = typeof ICONS !== 'undefined' && ICONS.edit ? ICONS.edit : '✎';
            btn.onclick = () => abrirFichaCliente(cliente.id);
            wrap.prepend(btn);
        });
    }

    function enhance() {
        if (!global.S || S.view !== 'clientes') return;
        insertarBotonNuevoCliente();
        insertarBotonesFila();
    }

    global.abrirFichaCliente = abrirFichaCliente;
    global.enhanceClientesData = enhance;

    const startObserver = () => {
        const main = document.getElementById('main');
        if (!main) return setTimeout(startObserver, 100);
        const observer = new MutationObserver(() => setTimeout(enhance, 0));
        observer.observe(main, { childList:true, subtree:true });
        setTimeout(enhance, 100);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver); else startObserver();
})(window);
