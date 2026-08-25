// ============================================================
// UTILIDADES
// ============================================================

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function bs(n) {
    return 'Bs ' + (Number(n) || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s) {
    if (!s) return '—';
    try {
        const d = new Date(s + 'T00:00:00');
        return isNaN(d) ? s : d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return '—'; }
}

function fmtDateShort(s) {
    if (!s) return '—';
    try {
        const d = new Date(s + 'T00:00:00');
        return isNaN(d) ? s : d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
    } catch (e) { return '—'; }
}

function fmtDateExcel(s) {
    if (!s) return '';
    try {
        const d = new Date(s + 'T00:00:00');
        return isNaN(d) ? s : d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
}

function fmtDateWord(s) {
    if (!s) return '';
    try {
        const d = new Date(s + 'T00:00:00');
        return isNaN(d) ? s : d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) { return ''; }
}

function fmtDateWordShort(s) {
    if (!s) return '';
    try {
        const d = new Date(s + 'T00:00:00');
        return isNaN(d) ? s : d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
}

function diffDays(a, b) {
    const d1 = new Date(a + 'T00:00:00'), d2 = new Date(b + 'T00:00:00');
    return Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
}

function diffYears(start, end) {
    if (!start || !end) return 0;
    try {
        const d1 = new Date(start + 'T00:00:00');
        const d2 = new Date(end + 'T00:00:00');
        if (isNaN(d1) || isNaN(d2)) return 0;
        let years = d2.getFullYear() - d1.getFullYear();
        const m = d2.getMonth() - d1.getMonth();
        if (m < 0 || (m === 0 && d2.getDate() < d1.getDate())) {
            years--;
        }
        return Math.max(0, years);
    } catch (e) { return 0; }
}

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return '';
    try {
        const hoy = new Date();
        const nac = new Date(fechaNacimiento + 'T00:00:00');
        if (isNaN(nac)) return '';
        let edad = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
            edad--;
        }
        return edad;
    } catch (e) { return ''; }
}

function esc(s) {
    return String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function attr(s) {
    return esc(s).replace(/"/g, '&quot;');
}

function metodoPagoLabel(m) {
    const map = {
        'efectivo': '💵 Efectivo',
        'transferencia': '🏦 Transferencia',
        'deposito': '🏛️ Depósito',
        'cheque': '📄 Cheque',
        'otro': '📌 Otro'
    };
    return map[m] || m || '—';
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__tt);
    window.__tt = setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================================
// HELPERS DE NEGOCIO
// ============================================================

function cotSubtotal(c) {
    return c.items.reduce((s, it) => s + (Number(it.pu) || 0) * (Number(it.cantidad) || 0), 0);
}

function cotTotal(c) {
    return cotSubtotal(c) - (Number(c.descuento) || 0);
}

function pagoEstado(p) {
    const pend = Number(p.monto) - Number(p.montoPagado || 0);
    if (pend <= 0.001) return 'pagado';
    if (Number(p.montoPagado || 0) > 0) return 'parcial';
    return 'pendiente';
}

// ============================================================
// ICONS
// ============================================================

const ICONS = {
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>',
    pay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M6 15h2"/></svg>',
    client: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    exp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 22v-4M4 12H2h2M22 12h-2M4 4l2.5 2.5M17.5 17.5L20 20M4 20l2.5-2.5M17.5 6.5L20 4"/><circle cx="12" cy="12" r="4"/></svg>',
    cfg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l-.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83-2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.36.62 1 1 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/></svg>',
    lic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 22v-4M4 12H2h2M22 12h-2M4 4l2.5 2.5M17.5 17.5L20 20M4 20l2.5-2.5M17.5 6.5L20 4"/><circle cx="12" cy="12" r="4"/></svg>',
    contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v13m0 0-4-4m4 4 4-4"/><path d="M3 17v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    excel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M8 12l3 3-3 3M14 12l-3 3 3 3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16v-6m0 0-3 3m3-3 3 3M4 16v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/></svg>',
    word: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/></svg>'
};
