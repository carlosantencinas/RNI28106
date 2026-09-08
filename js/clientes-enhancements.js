// ============================================================
// CLIENTES - CRUD REAL + FICHA + VINCULACION CON CONTACTOS
// Reemplaza la tabla de clientes renderizada por views.js cuando
// la vista activa es "clientes". Esto evita depender de botones
// o handlers antiguos que impedian editar los registros.
// ============================================================
(function (global) {
    'use strict';

    const norm = v => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const escC = v => typeof global.esc === 'function' ? global.esc(v ?? '') : String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
    const attrC = v => typeof global.attr === 'function' ? global.attr(v ?? '') : escC(v ?? '');

    function makeId() {
        return typeof global.uid === 'function' ? global.uid() : `cli-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    }

    function clienteNombre(c) {
        return c?.nombre || c?.razonSocial || c?.cliente || c?.empresa || c?.name || '';
    }

    function contactoNombre(c) {
        return c?.nombre || c?.name || '';
    }

    function clienteById(id) {
        return (S.clientes || []).find(c => String(c.id) === String(id)) || null;
    }

    function contactoById(id) {
        return (S.contactos || []).find(c => String(c.id) === String(id)) || null;
    }

    function proyectosCliente(cliente) {
        const propios = Array.isArray(cliente?.proyectos)
            ? cliente.proyectos
            : String(cliente?.proyectos || '').split(/\n|;/).map(x => x.trim()).filter(Boolean);
        const nombre = norm(clienteNombre(cliente));
        const deCot = (S.cotizaciones || [])
            .filter(c => norm(c.cliente || c.nombreCliente || c.razonSocial) === nombre)
            .map(c => c.proyecto)
            .filter(Boolean);
        return [...new Set([...propios, ...deCot])];
    }

    function clienteVinculado(cliente) {
        if (!cliente) return null;
        if (cliente.contactoId) {
            const c = contactoById(cliente.contactoId);
            if (c) return c;
        }
        const persona = norm(cliente.contacto || cliente.personaContacto);
        if (!persona) return null;
        return (S.contactos || []).find(c => norm(contactoNombre(c)) === persona) || null;
    }

    function fichaCliente(id) {
        const existente = clienteById(id);
        const isNew = !existente;
        const linked = clienteVinculado(existente);
        const base = existente ? {
            ...existente,
            nombre: clienteNombre(existente),
            tipoPersona: existente.tipoPersona || existente.tipo || 'empresa',
            telefono: existente.telefono || '',
            whatsapp: existente.whatsapp || '',
            email: existente.email || existente.correo || '',
            nit: existente.nit || '',
            documento: existente.documento || existente.ci || '',
            ciudad: existente.ciudad || '',
            direccion: existente.direccion || '',
            contacto: existente.contacto || existente.personaContacto || '',
            contactoId: existente.contactoId || linked?.id || '',
            cargo: existente.cargo || linked?.cargo || '',
            notas: existente.notas || '',
            proyectos: proyectosCliente(existente)
        } : {
            id: makeId(), nombre:'', tipoPersona:'empresa', telefono:'', whatsapp:'', email:'',
            nit:'', documento:'', ciudad:'', direccion:'', contacto:'', contactoId:'', cargo:'',
            notas:'', proyectos:[]
        };

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.zIndex = '10050';
        overlay.innerHTML = `
        <div class="modal" style="max-width:860px;width:calc(100% - 24px);max-height:92vh;overflow:hidden;">
            <div class="modal-h">
                <div>
                    <div style="font-size:10px;color:var(--text-soft);text-transform:uppercase;letter-spacing:.08em;">CRM · Clientes</div>
                    <h3 style="margin-top:3px;">${isNew ? 'Nuevo cliente' : 'Editar cliente'}</h3>
                </div>
                <button class="close" id="cx-close" type="button">&times;</button>
            </div>
            <div class="modal-body" style="overflow:auto;">
                <div style="padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2,#f7fafb);margin-bottom:16px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--primary);margin-bottom:9px;">🔗 Contacto profesional</div>
                    <div class="row2">
                        <div class="field" style="margin-bottom:0;">
                            <label>Vincular contacto</label>
                            <select id="cx-contacto-id">
                                <option value="">— Sin contacto vinculado —</option>
                                ${(S.contactos || []).map(c => `<option value="${attrC(c.id)}" ${base.contactoId === c.id ? 'selected' : ''}>${escC(contactoNombre(c))}${c.empresa ? ` · ${escC(c.empresa)}` : ''}${c.cargo ? ` · ${escC(c.cargo)}` : ''}</option>`).join('')}
                            </select>
                        </div>
                        <div style="font-size:11px;color:var(--text-soft);align-self:end;padding-bottom:8px;">Al seleccionar un contacto se pueden completar automáticamente sus datos.</div>
                    </div>
                </div>

                <div class="row2">
                    <div class="field"><label>Nombre / Razón social *</label><input id="cx-nombre" value="${attrC(base.nombre)}" autocomplete="organization" placeholder="Nombre del cliente o institución"></div>
                    <div class="field"><label>Tipo de persona</label><select id="cx-tipo"><option value="empresa" ${base.tipoPersona==='empresa'?'selected':''}>Empresa / institución</option><option value="persona" ${base.tipoPersona==='persona'?'selected':''}>Persona natural</option></select></div>
                </div>
                <div class="row3">
                    <div class="field"><label>Teléfono</label><input id="cx-telefono" type="tel" value="${attrC(base.telefono)}"></div>
                    <div class="field"><label>WhatsApp</label><input id="cx-whatsapp" type="tel" value="${attrC(base.whatsapp)}"></div>
                    <div class="field"><label>Correo electrónico</label><input id="cx-email" type="email" value="${attrC(base.email)}"></div>
                </div>
                <div class="row3">
                    <div class="field"><label>NIT</label><input id="cx-nit" value="${attrC(base.nit)}"></div>
                    <div class="field"><label>CI / Documento</label><input id="cx-documento" value="${attrC(base.documento)}"></div>
                    <div class="field"><label>Ciudad</label><input id="cx-ciudad" value="${attrC(base.ciudad)}"></div>
                </div>
                <div class="field"><label>Dirección</label><input id="cx-direccion" value="${attrC(base.direccion)}"></div>
                <div class="row2">
                    <div class="field"><label>Persona de contacto</label><input id="cx-contacto" value="${attrC(base.contacto)}"></div>
                    <div class="field"><label>Cargo / función</label><input id="cx-cargo" value="${attrC(base.cargo)}"></div>
                </div>
                <div class="field"><label>Proyectos asociados</label><textarea id="cx-proyectos" rows="3" placeholder="Un proyecto por línea">${escC(base.proyectos.join('\n'))}</textarea></div>
                <div class="field"><label>Notas</label><textarea id="cx-notas" rows="3" placeholder="Observaciones y datos adicionales">${escC(base.notas)}</textarea></div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="cx-cancel" type="button">Cancelar</button>
                <button class="btn btn-primary" id="cx-save" type="button">${isNew ? 'Crear cliente' : 'Guardar cambios'}</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#cx-close').onclick = close;
        overlay.querySelector('#cx-cancel').onclick = close;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

        overlay.querySelector('#cx-contacto-id').addEventListener('change', () => {
            const ct = contactoById(overlay.querySelector('#cx-contacto-id').value);
            if (!ct) return;
            const set = (sel, val, onlyEmpty=true) => {
                const el = overlay.querySelector(sel);
                if (el && (!onlyEmpty || !el.value.trim())) el.value = val || '';
            };
            set('#cx-contacto', contactoNombre(ct));
            set('#cx-cargo', ct.cargo);
            set('#cx-telefono', ct.telefono);
            set('#cx-whatsapp', ct.whatsapp);
            set('#cx-email', ct.email || ct.correo);
            set('#cx-nombre', ct.empresa || ct.cliente);
        });

        overlay.querySelector('#cx-save').onclick = async () => {
            const nombre = overlay.querySelector('#cx-nombre').value.trim();
            if (!nombre) {
                if (typeof global.toast === 'function') global.toast('⚠️ El nombre / razón social es obligatorio.');
                return;
            }
            const duplicate = (S.clientes || []).find(c => norm(clienteNombre(c)) === norm(nombre) && String(c.id) !== String(base.id));
            if (duplicate) {
                if (typeof global.toast === 'function') global.toast('⚠️ Ya existe un cliente con ese nombre.');
                return;
            }

            const contactoId = overlay.querySelector('#cx-contacto-id').value || '';
            const linked = contactoById(contactoId);
            const proyectos = overlay.querySelector('#cx-proyectos').value.split('\n').map(x => x.trim()).filter(Boolean);
            const nuevo = {
                ...base,
                id: base.id,
                nombre,
                tipoPersona: overlay.querySelector('#cx-tipo').value,
                telefono: overlay.querySelector('#cx-telefono').value.trim(),
                whatsapp: overlay.querySelector('#cx-whatsapp').value.trim(),
                email: overlay.querySelector('#cx-email').value.trim(),
                nit: overlay.querySelector('#cx-nit').value.trim(),
                documento: overlay.querySelector('#cx-documento').value.trim(),
                ciudad: overlay.querySelector('#cx-ciudad').value.trim(),
                direccion: overlay.querySelector('#cx-direccion').value.trim(),
                contacto: overlay.querySelector('#cx-contacto').value.trim(),
                contactoId,
                cargo: overlay.querySelector('#cx-cargo').value.trim(),
                proyectos: [...new Set(proyectos)],
                notas: overlay.querySelector('#cx-notas').value.trim()
            };

            S.clientes = isNew ? [...(S.clientes || []), nuevo] : (S.clientes || []).map(c => String(c.id) === String(nuevo.id) ? nuevo : c);

            // Vinculación bidireccional: el contacto profesional conserva referencia al cliente.
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
                if (typeof global.saveClientes !== 'function') throw new Error('saveClientes no está disponible');
                await global.saveClientes(S.user?.uid);
                if (linked && typeof global.saveContactos === 'function') await global.saveContactos(S.user?.uid);
                close();
                if (typeof global.render === 'function') global.render();
                if (typeof global.toast === 'function') global.toast(isNew ? '✅ Cliente creado.' : '✅ Cliente actualizado.');
            } catch (err) {
                console.error('[Clientes] Error guardando:', err);
                if (typeof global.toast === 'function') global.toast('❌ No se pudo guardar el cliente. Revisa la consola.');
            }
        };
    }

    function renderClientesCRUD() {
        if (!global.S || S.view !== 'clientes') return;
        const main = document.getElementById('main');
        if (!main) return;
        if (main.dataset.clientesCrud === '1') return;

        main.dataset.clientesCrud = '1';
        const clientes = S.clientes || [];
        const rows = clientes.map(c => {
            const proyectos = proyectosCliente(c);
            const ct = clienteVinculado(c);
            return `<tr>
                <td style="font-weight:600;min-width:180px;">${escC(clienteNombre(c) || 'Sin nombre')}</td>
                <td>${escC(c.tipoPersona === 'persona' ? 'Persona' : 'Empresa')}</td>
                <td>${escC(c.telefono || '')}</td>
                <td>${escC(c.email || c.correo || '')}</td>
                <td>${escC(ct?.nombre || c.contacto || '')}</td>
                <td>${escC(c.ciudad || '')}</td>
                <td class="tnum">${proyectos.length}</td>
                <td><div class="rowactions"><button class="iconbtn" type="button" data-cx-edit="${attrC(c.id)}" title="Editar cliente">${global.ICONS?.edit || '✎'}</button></div></td>
            </tr>`;
        }).join('');

        main.innerHTML = `
        <div class="page-head">
            <div><div class="eyebrow">GESTIÓN PROFESIONAL</div><h2>Clientes</h2><p class="muted">Base de clientes y organizaciones, vinculada con Contactos profesionales.</p></div>
            <div class="page-actions"><button class="btn btn-primary" id="cx-new" type="button">${global.ICONS?.plus || '+'} Nuevo cliente</button></div>
        </div>
        <div class="kpi-grid" style="margin-bottom:16px;">
            <div class="kpi"><div class="kpi-label">Clientes</div><div class="kpi-value">${clientes.length}</div></div>
            <div class="kpi"><div class="kpi-label">Con contacto vinculado</div><div class="kpi-value">${clientes.filter(c => !!clienteVinculado(c)).length}</div></div>
            <div class="kpi"><div class="kpi-label">Con teléfono</div><div class="kpi-value">${clientes.filter(c => c.telefono || c.whatsapp).length}</div></div>
            <div class="kpi"><div class="kpi-label">Con proyectos</div><div class="kpi-value">${clientes.filter(c => proyectosCliente(c).length).length}</div></div>
        </div>
        <div class="card">
            <div class="card-head"><div><h3>Base de clientes</h3><span class="muted">${clientes.length ? 'Selecciona Editar para modificar cualquier dato.' : 'Aún no tienes clientes registrados.'}</span></div></div>
            ${clientes.length ? `<div class="table-wrap"><table><thead><tr><th>Cliente / razón social</th><th>Tipo</th><th>Teléfono</th><th>Correo</th><th>Contacto</th><th>Ciudad</th><th>Proyectos</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty">${global.ICONS?.empty || ''}<div>No hay clientes registrados.</div><button class="btn btn-primary" id="cx-empty-new" type="button">Crear primer cliente</button></div>`}
        </div>`;

        main.querySelector('#cx-new')?.addEventListener('click', () => fichaCliente(''));
        main.querySelector('#cx-empty-new')?.addEventListener('click', () => fichaCliente(''));
        main.querySelectorAll('[data-cx-edit]').forEach(btn => btn.addEventListener('click', () => fichaCliente(btn.getAttribute('data-cx-edit'))));
    }

    function enhance() {
        if (!global.S || S.view !== 'clientes') return;
        renderClientesCRUD();
    }

    global.abrirFichaCliente = fichaCliente;
    global.enhanceClientesData = enhance;

    let lastView = '';
    function watch() {
        const main = document.getElementById('main');
        if (!main) return setTimeout(watch, 100);
        const observer = new MutationObserver(() => {
            if (!global.S) return;
            if (S.view !== 'clientes') {
                main.dataset.clientesCrud = '0';
                lastView = S.view;
                return;
            }
            // El render principal acaba de cambiar el contenido. Intervenimos una sola vez.
            if (main.dataset.clientesCrud !== '1') setTimeout(enhance, 0);
        });
        observer.observe(main, { childList:true, subtree:false });
        setInterval(() => {
            if (!global.S || S.view !== 'clientes') return;
            if (lastView !== 'clientes') {
                lastView = 'clientes';
                main.dataset.clientesCrud = '0';
                enhance();
            }
        }, 250);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})(window);
