// ============================================================
// RENDER PRINCIPAL - ORQUESTADOR ÚNICO
// ============================================================

let clienteFinancieroLoader = null;
function ensureClienteFinancieroModule() {
    if (typeof enhanceClientesView === 'function') return Promise.resolve();
    if (!clienteFinancieroLoader) {
        clienteFinancieroLoader = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'js/cliente-financiero.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }
    return clienteFinancieroLoader.catch(e => console.warn('No se pudo cargar la ficha financiera del cliente:', e));
}

function render() {
    const nav = document.getElementById('nav');
    const groups = [
        {
            title: 'Inicio',
            items: [['dashboard', 'Dashboard', 'dash']]
        },
        {
            title: 'Gestión profesional',
            items: [
                ['cotizaciones', 'Cotizaciones', 'quote'],
                ['administrativo', 'Administrativo', 'admin'],
                ['documentos', 'Documentos', 'folder'],
                ['finanzas', 'Finanzas', 'money'],
                ['clientes', 'Clientes', 'client']
            ]
        },
        {
            title: 'Trayectoria',
            items: [
                ['experiencia', 'Experiencia', 'exp'],
                ['actividades', 'Actividades', 'act'],
                ['licitaciones', 'Licitaciones', 'lic']
            ]
        },
        {
            title: 'Red profesional',
            items: [['contactos', 'Contactos', 'contact']]
        },
        {
            title: 'Sistema',
            items: [['config', 'Configuración', 'cfg']]
        }
    ];

    nav.innerHTML = groups.map(group => `
        <div class="nav-group">
            <div class="nav-group-title">${group.title}</div>
            ${group.items.map(([id, label, ic]) => {
                const icon = ic === 'folder' ? (ICONS.folder || '📁') : ic === 'money' ? '💰' : ICONS[ic];
                return `<button class="nav-btn ${S.view === id ? 'active' : ''}" data-nav="${id}" title="${label}">
                    <span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>
                </button>`;
            }).join('')}
        </div>
    `).join('');

    nav.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { S.view = b.dataset.nav; render(); });

    const main = document.getElementById('main');
    switch (S.view) {
        case 'dashboard': main.innerHTML = viewDashboard(); break;
        case 'cotizaciones': main.innerHTML = viewCotizaciones(); break;
        case 'administrativo': main.innerHTML = viewAdministrativo(); break;
        case 'documentos': main.innerHTML = typeof viewDocumentosSeparado === 'function' ? viewDocumentosSeparado() : '<div class="empty">Gestor documental no disponible.</div>'; break;
        case 'finanzas': main.innerHTML = typeof viewFinanzas === 'function' ? viewFinanzas() : '<div class="empty">Centro financiero no disponible.</div>'; break;
        case 'clientes': main.innerHTML = viewClientes(); break;
        case 'experiencia': main.innerHTML = viewExperiencia(); break;
        case 'actividades': main.innerHTML = viewActividades(); break;
        case 'licitaciones': main.innerHTML = viewLicitaciones(); break;
        case 'contactos': main.innerHTML = viewContactos(); break;
        case 'config': main.innerHTML = viewConfig(); break;
        default: main.innerHTML = viewDashboard(); break;
    }

    if (typeof bindAppEvents === 'function') bindAppEvents();
    if (S.view === 'finanzas' && typeof bindFinanceFilters === 'function') bindFinanceFilters();

    if (S.view === 'administrativo' && typeof enhanceAdministrativeView === 'function') enhanceAdministrativeView();
    if (S.view === 'finanzas' && typeof enhanceFinanceView === 'function') enhanceFinanceView();

    if (S.view === 'clientes') {
        ensureClienteFinancieroModule().then(() => {
            if (S.view === 'clientes' && typeof enhanceClientesView === 'function') enhanceClientesView();
        });
    }

    if (S.view === 'dashboard') {
        if (typeof syncDashboardPaymentCards === 'function') syncDashboardPaymentCards();
        if (typeof renderDashboardAlerts === 'function') renderDashboardAlerts();
        if (typeof syncDashboardFinancialView === 'function') syncDashboardFinancialView();
        if (typeof syncPagosFijosDashboard === 'function') syncPagosFijosDashboard();
    }

    // Historial mensual de pagos recurrentes.
    if ((S.view === 'dashboard' || S.view === 'finanzas') && typeof syncPagosFijosEnhanced === 'function') {
        syncPagosFijosEnhanced();
    }
}
