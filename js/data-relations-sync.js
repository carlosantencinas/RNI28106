/*
 * RNI28106 — Sincronización de relaciones entre Contactos, Clientes,
 * Cotizaciones y Pagos.
 *
 * Objetivo: que una persona/empresa tenga un contactoId estable y que
 * las relaciones comerciales apunten a ese ID, sin depender del nombre.
 *
 * Reglas de seguridad:
 * - Nunca elimina contactos, clientes, cotizaciones ni pagos.
 * - Solo completa/repara referencias cuando la coincidencia es inequívoca.
 * - Una cotización determina el contacto de sus pagos mediante cotizacionId.
 * - Los cambios se persisten únicamente cuando realmente hubo cambios.
 */
(function (w) {
    'use strict';

    const arr = v => Array.isArray(v) ? v : [];
    const text = v => v == null ? '' : String(v).trim();
    const norm = v => text(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');
    const idOf = r => text(r?.id || r?.contactoId || r?.clienteId);
    const contactName = c => text(c?.nombreCompleto || c?.nombre || c?.clienteNombre || c?.razonSocial || c?.empresa || c?.name);
    const quoteName = q => text(q?.cliente || q?.clienteNombre || q?.nombreCliente || q?.razonSocial || q?.empresa || q?.datosCliente?.nombre);
    const paymentName = p => text(p?.cliente || p?.entidad || p?.clienteNombre || p?.nombreCliente || p?.razonSocial || p?.empresa);
    const projectName = q => text(q?.proyecto || q?.proyectoNombre || q?.nombreProyecto || q?.obra || q?.contrato);
    const makeId = () => typeof uid === 'function' ? uid() : `cnt-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

    function buildIndexes() {
        const contacts = arr(S.contactos);
        const byId = new Map();
        const byName = new Map();
        contacts.forEach(c => {
            const id = idOf(c);
            if (id) byId.set(id, c);
            [c?.nombre, c?.nombreCompleto, c?.clienteNombre, c?.empresa, c?.razonSocial].forEach(value => {
                const key = norm(value);
                if (!key) return;
                const current = byName.get(key);
                if (!current) byName.set(key, { contact: c, ambiguous: false });
                else if (current.contact !== c) current.ambiguous = true;
            });
        });
        return { byId, byName };
    }

    function resolveByIdOrName(record, name, indexes) {
        const explicit = text(record?.contactoId);
        if (explicit) {
            const found = indexes.byId.get(explicit);
            if (found) return { contact: found, reason: 'contactoId' };
            // Referencia rota: no la reemplazamos por nombre automáticamente
            // si ya existe un contactoId, para evitar cambiar relaciones válidas.
            return { contact: null, reason: 'broken-contactoId' };
        }
        const key = norm(name);
        if (!key) return { contact: null, reason: 'no-name' };
        const candidate = indexes.byName.get(key);
        if (!candidate || candidate.ambiguous) return { contact: null, reason: candidate?.ambiguous ? 'ambiguous-name' : 'not-found' };
        return { contact: candidate.contact, reason: 'name' };
    }

    function ensureContactFromLegacyClient(client, indexes) {
        const clientId = text(client?.id);
        const explicit = text(client?.contactoId);
        if (explicit && indexes.byId.has(explicit)) return indexes.byId.get(explicit);

        const name = text(client?.nombre || client?.razonSocial || client?.empresa || client?.cliente);
        if (!name) return null;
        const resolved = resolveByIdOrName({}, name, indexes);
        if (resolved.contact) return resolved.contact;

        // Crear contacto solo cuando el cliente legacy no tiene equivalente.
        const c = {
            id: makeId(),
            nombre: text(client?.personaContacto || name),
            empresa: text(client?.empresa || client?.razonSocial || ''),
            cargo: text(client?.cargo || ''),
            tipoPersona: text(client?.tipoPersona || 'empresa'),
            telefono: text(client?.telefono || ''),
            whatsapp: text(client?.whatsapp || ''),
            email: text(client?.email || client?.correo || ''),
            nit: text(client?.nit || ''),
            documento: text(client?.documento || client?.ci || ''),
            ciudad: text(client?.ciudad || ''),
            direccion: text(client?.direccion || ''),
            esCliente: true,
            clienteId: clientId || makeId(),
            clienteNombre: name,
            proyectos: arr(client?.proyectos).slice(),
            notas: text(client?.notas || ''),
            creadoEn: new Date().toISOString(),
            actualizadoEn: new Date().toISOString()
        };
        S.contactos.push(c);
        indexes.byId.set(c.id, c);
        indexes.byName.set(norm(name), { contact: c, ambiguous: false });
        return c;
    }

    function syncClients(indexes) {
        let changed = false;
        const out = [];
        const existingClientByContact = new Map();
        arr(S.clientes).forEach(cl => {
            const cid = text(cl?.contactoId);
            if (cid && !existingClientByContact.has(cid)) existingClientByContact.set(cid, cl);
        });

        arr(S.clientes).forEach(cl => {
            if (!cl) return;
            const c = ensureContactFromLegacyClient(cl, indexes);
            if (!c) return;
            if (text(cl.contactoId) !== text(c.id)) { cl.contactoId = c.id; changed = true; }
            if (!c.esCliente) { c.esCliente = true; changed = true; }
            if (!c.clienteId) { c.clienteId = text(cl.id) || makeId(); changed = true; }
            if (!c.clienteNombre) { c.clienteNombre = text(cl.nombre || cl.razonSocial || cl.empresa || cl.cliente); changed = true; }
        });

        // Contactos marcados como clientes son la fuente actual del directorio.
        arr(S.contactos).forEach(c => {
            if (!c?.esCliente) return;
            if (!c.clienteId) { c.clienteId = makeId(); changed = true; }
            if (!c.clienteNombre) { c.clienteNombre = text(c.empresa || c.nombre); changed = true; }
            const rel = existingClientByContact.get(text(c.id));
            const projects = new Set(arr(c.proyectos).map(text).filter(Boolean));
            arr(S.cotizaciones).forEach(q => {
                if (text(q?.contactoId) === text(c.id)) { const p = projectName(q); if (p) projects.add(p); }
            });
            const client = {
                id: c.clienteId,
                nombre: c.clienteNombre,
                contactoId: c.id,
                contacto: c.nombre || '',
                personaContacto: c.nombre || '',
                empresa: c.empresa || '',
                cargo: c.cargo || '',
                telefono: c.telefono || '',
                whatsapp: c.whatsapp || '',
                email: c.email || c.correo || '',
                nit: c.nit || '',
                documento: c.documento || c.ci || '',
                ciudad: c.ciudad || '',
                direccion: c.direccion || '',
                proyectos: [...projects],
                notas: c.notas || '',
                tipoPersona: c.tipoPersona || 'persona'
            };
            if (!rel || JSON.stringify(rel) !== JSON.stringify(client)) changed = true;
            out.push(client);
        });

        // Conservar clientes legacy que todavía no pudieron vincularse.
        arr(S.clientes).forEach(cl => {
            const cid = text(cl?.contactoId);
            if (!cid && cl) out.push(cl);
        });

        const unique = new Map();
        out.forEach(cl => { const key = text(cl?.id) || `${norm(cl?.nombre)}|${norm(cl?.empresa)}`; if (key && !unique.has(key)) unique.set(key, cl); });
        const next = [...unique.values()];
        if (JSON.stringify(next) !== JSON.stringify(S.clientes)) { S.clientes = next; changed = true; }
        return changed;
    }

    function syncQuotes(indexes) {
        let changed = false;
        arr(S.cotizaciones).forEach(q => {
            if (!q) return;
            const resolved = resolveByIdOrName(q, quoteName(q), indexes);
            if (!resolved.contact) return;
            if (text(q.contactoId) !== text(resolved.contact.id)) { q.contactoId = resolved.contact.id; changed = true; }
            resolved.contact.esCliente = true;
            if (!resolved.contact.clienteId) { resolved.contact.clienteId = makeId(); changed = true; }
            if (!resolved.contact.clienteNombre) { resolved.contact.clienteNombre = text(resolved.contact.empresa || resolved.contact.nombre || quoteName(q)); changed = true; }
            const p = projectName(q);
            if (p) {
                const projects = arr(resolved.contact.proyectos);
                if (!projects.some(x => norm(x) === norm(p))) { resolved.contact.proyectos = [...projects, p]; changed = true; }
            }
        });
        return changed;
    }

    function syncPayments(indexes) {
        let changed = false;
        const quoteById = new Map(arr(S.cotizaciones).map(q => [text(q?.id), q]));
        arr(S.pagos).forEach(p => {
            if (!p) return;
            // La cotización es una referencia más fuerte que el nombre.
            const q = text(p.cotizacionId) ? quoteById.get(text(p.cotizacionId)) : null;
            if (q?.contactoId && text(p.contactoId) !== text(q.contactoId)) {
                p.contactoId = q.contactoId;
                changed = true;
                return;
            }
            const resolved = resolveByIdOrName(p, paymentName(p), indexes);
            if (resolved.contact && !text(p.contactoId)) {
                p.contactoId = resolved.contact.id;
                changed = true;
            }
        });
        return changed;
    }

    async function syncAndPersist(options = {}) {
        if (typeof S === 'undefined' || !S.user?.uid) return { ok: false, changed: false, reason: 'not_authenticated' };
        const indexes = buildIndexes();
        let changed = false;
        changed = syncClients(indexes) || changed;
        changed = syncQuotes(indexes) || changed;
        changed = syncPayments(indexes) || changed;

        // Rebuild the client mirror once more because quote projects/contactId
        // may have changed during this pass.
        changed = syncClients(buildIndexes()) || changed;

        if (!changed) return { ok: true, changed: false, counts: counts() };
        if (options.persist !== false) {
            await Promise.all([
                saveContactos(S.user.uid),
                saveClientes(S.user.uid),
                saveCotizaciones(S.user.uid),
                savePagos(S.user.uid)
            ]);
        }
        return { ok: true, changed: true, counts: counts() };
    }

    function counts() {
        const noQuoteContact = arr(S.cotizaciones).filter(q => !text(q?.contactoId)).length;
        const noPaymentContact = arr(S.pagos).filter(p => !text(p?.contactoId)).length;
        const orphanQuote = arr(S.cotizaciones).filter(q => text(q?.contactoId) && !arr(S.contactos).some(c => text(c?.id) === text(q.contactoId))).length;
        const orphanPayment = arr(S.pagos).filter(p => text(p?.contactoId) && !arr(S.contactos).some(c => text(c?.id) === text(p.contactoId))).length;
        return { contactos: arr(S.contactos).length, clientes: arr(S.clientes).length, cotizaciones: arr(S.cotizaciones).length, pagos: arr(S.pagos).length, cotizacionesSinContacto: noQuoteContact, pagosSinContacto: noPaymentContact, cotizacionesConContactoRoto: orphanQuote, pagosConContactoRoto: orphanPayment };
    }

    w.RNIDataRelationsSync = Object.freeze({ syncAndPersist, counts });
})(window);
