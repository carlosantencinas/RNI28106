// ============================================================
// RENDER PRINCIPAL
// ============================================================

function render() {
    const nav = document.getElementById('nav');
    const items = [
        ['dashboard', 'Dashboard', 'dash'],
        ['cotizaciones', 'Cotizaciones', 'quote'],
        ['pagos', 'Pagos por cobrar', 'pay'],
        ['clientes', 'Clientes', 'client'],
        ['experiencia', 'Experiencia', 'exp'],
        ['licitaciones', 'Licitaciones', 'lic'],
        ['contactos', 'Contactos', 'contact'],
        ['config', 'Configuración', 'cfg']
    ];
    nav.innerHTML = items.map(([id, label, ic]) =>
        `<button class="nav-btn ${S.view === id ? 'active' : ''}" data-nav="${id}">${ICONS[ic]}<span>${label}</span></button>`
    ).join('');
    nav.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { S.view = b.dataset.nav;
        render(); });

    const main = document.getElementById('main');
    switch(S.view) {
        case 'dashboard': main.innerHTML = viewDashboard(); break;
        case 'cotizaciones': main.innerHTML = viewCotizaciones(); break;
        case 'pagos': main.innerHTML = viewPagos(); break;
        case 'clientes': main.innerHTML = viewClientes(); break;
        case 'experiencia': main.innerHTML = viewExperiencia(); break;
        case 'licitaciones': main.innerHTML = viewLicitaciones(); break;
        case 'contactos': main.innerHTML = viewContactos(); break;
        case 'config': main.innerHTML = viewConfig(); break;
    }

    // bindAppEvents se define en app.js, asegurarse que esté disponible
    if (typeof bindAppEvents === 'function') {
        bindAppEvents();
    }
}
