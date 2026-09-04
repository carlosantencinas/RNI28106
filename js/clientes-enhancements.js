// ============================================================
// CLIENTES - FICHA DE CONTACTO Y DATOS FISCALES
// ============================================================
(function (global) {
    'use strict';

    const escC = v => typeof esc === 'function'
        ? esc(v ?? '')
        : String(v ?? '').replace(/[&<>\"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[m]));
    const attrC = v => typeof attr === 'function' ? attr(v ?? '') : escC(v ?? '');
    const normC = v => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    function clienteActual(nombre) {
        const key = normC(nombre);
        return (S.clientes || []).find(c => normC(c.nombre) === key) || null;
    }

    function abrirFichaCliente(nombre) {
        const existente = clienteActual(nombre);
        const isNew = !existente;
        const c = existente ? { ...existente, proyectos: [...(existente.proyectos || [])] } : {
            id: typeof uid === 'function' ? uid() : `cli-${Date.now()}`,
            nombre: '',
            tipoPersona: 'empresa',
            telefono: '',
            email: '',
            nit: '',
            documento: '',
            direccion: '',
            ciudad: '',
            contacto: '',
            cargo: '',
            notas: '',
            proyectos: []
        };

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="modal" style="max-width:760px;width:calc(100% - 24px);">
                <div class="modal-h">
                    <div>
                        <div style="font-size:10px;color:var(--text-soft);text-transform:uppercase;letter-spacing:.08em;">Ficha del cliente</div>
                        <h3 style="margin-top:2px;">${isNew ? 'Nuevo cliente' : `Editar: ${escC(c.nombre)}`}</h3>
                    </div>
                    <button class="close" id="cl-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="row2">
                        <div class="field"><label>Nombre / Razón social *</label><input id="cl-nombre" value="${attrC(c.nombre)}" placeholder="Nombre del cliente o institución"></div>
                        <div class="field"><label>Tipo</label><select id="cl-tipo"><option value="empresa" ${c.tipoPersona==='empresa'?'selected':''}>Empresa / institución</option><option value="persona" ${c.tipoPersona==='persona'?'selected':''}>Persona natural</option></select></div>
                    </div>
                    <div class="row3">
                        <div class="field"><label>Teléfono</label><input id="cl-telefono" type="tel" value="${attrC(c.telefono)}" placeholder="Ej. 7XXXXXXX"></div>
                        <div class="field"><label>Correo electrónico</label><input id="cl-email" type="email" value="${attrC(c.email)}" placeholder="correo@ejemplo.com"></div>
                        <div class="field"><label>NIT</label><input id="cl-nit" value="${attrC(c.nit)}" placeholder="NIT"></div>
                    </div>
                    <div class="row2">
                        <div class="field"><label>Documento / CI</label><input id="cl-documento" value="${attrC(c.documento)}" placeholder="CI u otro documento"></div>
                        <div class="field"><label>Ciudad</label><input id="cl-ciudad" value="${attrC(c.ciudad)}" placeholder="Ej. Sucre"></div>
                    </div>
                    <div class="field"><label>Dirección</label><input id="cl-direccion" value="${attrC(c.direccion)}" placeholder="Dirección fiscal o de contacto"></div>
                    <div class="row2">
                        <div class="field"><label>Persona de contacto</label><input id="cl-contacto" value="${attrC(c.contacto)}" placeholder="Nombre del contacto"></div>
                        <div class="field"><label>Cargo / función</label><input id="cl-cargo" value="${attrC(c.cargo)}" placeholder="Ej. Gerente, Fiscal de obra"></div>
                    </div>
                    <div class="field"><label>Proyectos asociados</label><textarea id="cl-proyectos" rows="3" placeholder="Un proyecto por línea">${escC((c.proyectos || []).join('\n'))}</textarea><div style="font-size:11px;color:var(--text-soft);margin-top:3px;">Los proyectos también se alimentan automáticamente desde las cotizaciones.</div></div>
                    <div class="field"><label>Notas</label><textarea id="cl-notas" rows="3" placeholder="Observaciones, preferencias, condiciones comerciales, etc.">${escC(c.notas)}</textarea></div>
                </div>
                <div class="modal-foot">
                    <button class="btn btn-ghost" id="cl-cancel">Cancelar</button>
                    <button class="btn btn-primary" id="cl-save">${isNew ? 'Crear cliente' : 'Guardar cambios'}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#cl-close').onclick = close;
        overlay.querySelector('#cl-cancel').onclick = close;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

        overlay.querySelector('#cl-save').onclick = async () => {
            const nombre = overlay.querySelector('#cl-nombre').value.trim();
            if (!nombre) { toast('⚠️ El nombre / razón social es obligatorio.'); return; }

            const key = normC(nombre);
            const duplicado = (S.clientes || []).find(x => normC(x.nombre) === key && x.id !== c.id);
            if (duplicado) { toast('⚠️ Ya existe un cliente con ese nombre.'); return; }

            const proyectosManuales = overlay.querySelector('#cl-proyectos').value
                .split('\n').map(x => x.trim()).filter(Boolean);
            const proyectosCot = (S.cotizaciones || [])
                .filter(x => normC(x.cliente) === key)
                .map(x => x.proyecto).filter(Boolean);
            const proyectos = [...new Set([...proyectosManuales, ...proyectosCot])];

            const nuevo = {
                ...c,
                nombre,
                tipoPersona: overlay.querySelector('#cl-tipo').value,
                telefono: overlay.querySelector('#cl-telefono').value.trim(),
                email: overlay.querySelector('#cl-email').value.trim(),
                nit: overlay.querySelector('#cl-nit').value.trim(),
                documento: overlay.querySelector('#cl-documento').value.trim(),
                ciudad: overlay.querySelector('#cl-ciudad').value.trim(),
                direccion: overlay.querySelector('#cl-direccion').value.trim(),
                contacto: overlay.querySelector('#cl-contacto').value.trim(),
                cargo: overlay.querySelector('#cl-cargo').value.trim(),
                proyectos,
                notas: overlay.querySelector('#cl-notas').value.trim()
            };

            if (isNew) S.clientes.push(nuevo);
            else S.clientes = S.clientes.map(x => x.id === nuevo.id ? nuevo : x);

            await saveClientes(S.user?.uid);
            close();
            render();
            toast(isNew ? '✅ Cliente creado.' : '✅ Ficha del cliente actualizada.');
        };
    }

    function insertarBotonNuevoCliente() {
        const main = document.getElementById('main');
        if (!main || document.getElementById('btn-nuevo-cliente-ficha')) return;

        const candidatos = [...main.querySelectorAll('button')].filter(b => {
            const t = (b.textContent || '').toLowerCase();
            return t.includes('cliente') && (t.includes('nuevo') || t.includes('agregar') || t.includes('añadir'));
        });

        if (candidatos.length) return;

        const host = main.querySelector('.view-head, .page-head, .section-head, .panel-h') || main.firstElementChild;
        if (!host) return;
        const btn = document.createElement('button');
        btn.id = 'btn-nuevo-cliente-ficha';
        btn.className = 'btn btn-primary';
        btn.type = 'button';
        btn.textContent = '+ Nuevo cliente';
        btn.style.marginLeft = '8px';
        btn.onclick = () => abrirFichaCliente('');
        host.appendChild(btn);
    }

    function insertarBotonesFila() {
        const main = document.getElementById('main');
        if (!main) return;
        const nombres = new Map((S.clientes || []).map(c => [normC(c.nombre), c.nombre]));

        main.querySelectorAll('table tbody tr').forEach(tr => {
            if (tr.querySelector('[data-edit-cliente-ficha]')) return;
            const cells = [...tr.querySelectorAll('td')];
            const clienteCell = cells.find(td => nombres.has(normC(td.textContent)));
            if (!clienteCell) return;
            const nombre = nombres.get(normC(clienteCell.textContent));
            const td = cells[cells.length - 1] || tr.appendChild(document.createElement('td'));
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'iconbtn';
            btn.title = 'Editar ficha del cliente';
            btn.setAttribute('data-edit-cliente-ficha', nombre);
            btn.innerHTML = typeof ICONS !== 'undefined' && ICONS.edit ? ICONS.edit : '✎';
            btn.onclick = () => abrirFichaCliente(nombre);
            td.appendChild(btn);
        });
    }

    function enhance() {
        if (S.view !== 'clientes') return;
        insertarBotonNuevoCliente();
        insertarBotonesFila();
    }

    global.abrirFichaCliente = abrirFichaCliente;
    global.enhanceClientesData = enhance;
})(window);
