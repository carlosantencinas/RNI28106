// ============================================================
// RENDER PRINCIPAL
// ============================================================

function render() {
    const nav = document.getElementById('nav');
    const items = [
        ['dashboard', 'Dashboard', 'dash'],
        ['cotizaciones', 'Cotizaciones', 'quote'],
        ['administrativo', 'Administrativo', 'admin'],
        ['clientes', 'Clientes', 'client'],
        ['experiencia', 'Experiencia', 'exp'],
        ['actividades', 'Actividades', 'act'],
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
        case 'administrativo': main.innerHTML = viewAdministrativo(); break;
        case 'clientes': main.innerHTML = viewClientes(); break;
        case 'experiencia': main.innerHTML = viewExperiencia(); break;
        case 'actividades': main.innerHTML = viewActividades(); break;
        case 'licitaciones': main.innerHTML = viewLicitaciones(); break;
        case 'contactos': main.innerHTML = viewContactos(); break;
        case 'config': main.innerHTML = viewConfig(); break;
        default: main.innerHTML = viewDashboard(); break;
    }

    // ========== IMPORTANTE: BIND APP EVENTS ==========
    if (typeof bindAppEvents === 'function') {
        bindAppEvents();
    } else {
        console.warn('bindAppEvents no está definida. Verifica que app.js se cargó correctamente.');
    }
}
