/*
 * RNI28106 - Capa de modelo de datos compatible
 *
 * Esta primera fase NO cambia Firebase ni sustituye las estructuras existentes.
 * Solo proporciona funciones de lectura/normalizacion para que las siguientes
 * fases puedan dejar de depender de nombres de clientes como identificadores.
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

  function idOf(record) {
    if (!record || typeof record !== 'object') return '';
    return text(record.id || record.contactoId || record.clienteId || record.uid);
  }

  function contactName(contact) {
    if (!contact) return '';
    return text(
      contact.nombreCompleto ||
      contact.nombre ||
      contact.razonSocial ||
      contact.empresa ||
      contact.name
    );
  }

  function quoteClientName(quote) {
    return text(quote && (quote.cliente || quote.clienteNombre || quote.razonSocial));
  }

  function getContacts() {
    return arr(typeof S !== 'undefined' ? S.contactos : []);
  }

  function getLegacyClients() {
    return arr(typeof S !== 'undefined' ? S.clientes : []);
  }

  /*
   * Vista lógica de clientes.
   * No modifica S.clientes ni S.contactos.
   */
  function getClients() {
    var contacts = getContacts();
    var clients = [];

    contacts.forEach(function (c) {
      if (c && (c.esCliente === true || c.tipo === 'cliente' || c.tipo === 'cliente_contacto')) {
        clients.push(c);
      }
    });

    if (!clients.length) return getLegacyClients();

    var known = Object.create(null);
    clients.forEach(function (c) {
      var key = idOf(c) || normalizeName(contactName(c));
      if (key) known[key] = true;
    });

    getLegacyClients().forEach(function (c) {
      var key = idOf(c) || normalizeName(contactName(c) || c.cliente || c.nombre);
      if (key && !known[key]) {
        clients.push(c);
        known[key] = true;
      }
    });

    return clients;
  }

  function findContactById(id) {
    var key = text(id);
    if (!key) return null;
    return getContacts().find(function (c) { return idOf(c) === key; }) || null;
  }

  function findContactByName(name) {
    var key = normalizeName(name);
    if (!key) return null;
    return getContacts().find(function (c) {
      return normalizeName(contactName(c)) === key;
    }) || null;
  }

  /*
   * Resuelve una cotizacion sin alterar su contenido.
   * Prioridad futura: contactoId -> coincidencia por nombre.
   */
  function resolveQuoteContact(quote) {
    if (!quote) return null;
    if (quote.contactoId) {
      var byId = findContactById(quote.contactoId);
      if (byId) return byId;
    }
    return findContactByName(quoteClientName(quote));
  }

  function getProjectsForContact(contactId) {
    var id = text(contactId);
    if (!id || typeof S === 'undefined') return [];

    var quotes = arr(S.cotizaciones);
    var out = [];
    var seen = Object.create(null);

    quotes.forEach(function (q) {
      if (!q) return;
      var related = text(q.contactoId) === id;
      if (!related) {
        var c = resolveQuoteContact(q);
        related = !!c && idOf(c) === id;
      }
      if (!related) return;

      var project = text(q.proyecto);
      if (project && !seen[normalizeName(project)]) {
        seen[normalizeName(project)] = true;
        out.push(project);
      }
    });

    return out;
  }

  function getQuotesForContact(contactId) {
    var id = text(contactId);
    if (!id || typeof S === 'undefined') return [];

    return arr(S.cotizaciones).filter(function (q) {
      if (!q) return false;
      if (text(q.contactoId) === id) return true;
      var c = resolveQuoteContact(q);
      return !!c && idOf(c) === id;
    });
  }

  w.RNIDataModel = Object.freeze({
    normalizeName: normalizeName,
    idOf: idOf,
    contactName: contactName,
    getContacts: getContacts,
    getClients: getClients,
    findContactById: findContactById,
    findContactByName: findContactByName,
    resolveQuoteContact: resolveQuoteContact,
    getProjectsForContact: getProjectsForContact,
    getQuotesForContact: getQuotesForContact
  });
})(window);
