/*
 * RNI28106 - Migraciones de datos no destructivas
 *
 * IMPORTANTE: estas funciones solo calculan/normalizan datos en memoria.
 * No escriben en Firebase, no modifican S y no se ejecutan automaticamente.
 */
(function (w) {
  'use strict';

  function arr(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(value) {
    return value == null ? '' : String(value).trim();
  }

  function normalizeName(value) {
    return text(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function makeId(prefix, index) {
    return prefix + '_' + String(index + 1).padStart(4, '0');
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  /*
   * Construye una propuesta de contactos a partir de los clientes legacy.
   * No toca el estado actual.
   */
  function previewClientsAsContacts(state) {
    var source = state || (typeof S !== 'undefined' ? S : null);
    if (!source) return [];

    var contacts = arr(source.contactos).map(clone);
    var clients = arr(source.clientes);
    var byName = Object.create(null);

    contacts.forEach(function (c) {
      var name = normalizeName(c && (c.nombreCompleto || c.nombre || c.razonSocial || c.empresa));
      if (name) byName[name] = true;
    });

    clients.forEach(function (client, index) {
      if (!client || typeof client !== 'object') return;
      var name = text(client.nombre || client.razonSocial || client.empresa || client.cliente);
      var key = normalizeName(name);
      if (!key || byName[key]) return;

      var contact = clone(client);
      contact.id = text(contact.id) || makeId('cnt', contacts.length);
      contact.esCliente = true;
      if (!contact.nombreCompleto && name) contact.nombreCompleto = name;
      contacts.push(contact);
      byName[key] = true;
    });

    return contacts;
  }

  /*
   * Genera referencias contactoId para cotizaciones que todavía usan
   * exclusivamente el nombre del cliente. La propuesta se devuelve aparte.
   */
  function previewQuoteLinks(state, contacts) {
    var source = state || (typeof S !== 'undefined' ? S : null);
    var list = arr(contacts);
    if (!source) return [];

    var byName = Object.create(null);
    list.forEach(function (c) {
      var name = normalizeName(c && (c.nombreCompleto || c.nombre || c.razonSocial || c.empresa));
      if (name && c && c.id) byName[name] = c.id;
    });

    return arr(source.cotizaciones).map(function (quote) {
      var q = clone(quote);
      if (!q || q.contactoId) return q;
      var name = normalizeName(q.cliente || q.clienteNombre || q.razonSocial);
      if (name && byName[name]) q.contactoId = byName[name];
      return q;
    });
  }

  /*
   * Diagnostico previo a una futura migracion. Solo informa; no escribe.
   */
  function audit(state) {
    var source = state || (typeof S !== 'undefined' ? S : null);
    if (!source) return { ok: false, reason: 'S no disponible' };

    var quotes = arr(source.cotizaciones);
    var contacts = arr(source.contactos);
    var clients = arr(source.clientes);
    var quoteWithoutContactId = quotes.filter(function (q) { return q && !text(q.contactoId); }).length;

    return {
      ok: true,
      contactos: contacts.length,
      clientesLegacy: clients.length,
      cotizaciones: quotes.length,
      cotizacionesSinContactoId: quoteWithoutContactId,
      firebaseDataUntouched: true,
      stateUntouched: true
    };
  }

  w.RNIDataMigrations = Object.freeze({
    previewClientsAsContacts: previewClientsAsContacts,
    previewQuoteLinks: previewQuoteLinks,
    audit: audit
  });
})(window);
