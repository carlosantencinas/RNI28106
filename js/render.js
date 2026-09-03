// ============================================================
// RENDER PRINCIPAL - ORQUESTADOR ÚNICO
// ============================================================

let clienteFinancieroLoader = null;
let uiCompatibilityStylesReady = false;

function ensureUICompatibilityStyles() {
    if (uiCompatibilityStylesReady || document.getElementById('ui-compatibility-styles')) return;
    const style = document.createElement('style');
    style.id = 'ui-compatibility-styles';
    style.textContent = `
        /* Compatibilidad visual: conserva las gráficas existentes */
        .chart-bar-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:12px; }
        .chart-bar-row .label { width:130px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
        .chart-bar-row .track { flex:1; height:18px; min-width:60px; background:var(--gantt-bg); border-radius:3px; overflow:hidden; position:relative; }
        .chart-bar-row .track .fill { height:100%; border-radius:3px; transition:width .5s ease; }
        .chart-bar-row .value { width:auto; min-width:90px; flex-shrink:0; text-align:right; font-family:'JetBrains Mono',monospace; color:var(--text-soft); }
        .nav-icon { line-height:0; }
        .nav-icon svg { width:18px !important; height:18px !important; display:block; flex:none; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .nav-btn.active .nav-icon svg { stroke:#fff; }
        /* Menú activo: azul moderno y texto/icono blanco */
        #sidebar .nav-btn.active { background:#1565C0; color:#fff; }
        #sidebar .nav-btn.active:hover { background:#0D5AAA; color:#fff; }
        #dashboard-experience-evolution { box-sizing:border-box; }

        /* Selector de navegación para iPhone/iPad */
        #ios-nav-selector { display:none; }
        @media (max-width:768px) {
            .chart-bar-row .label { width:80px; font-size:10px; }
            .chart-bar-row .value { min-width:70px; font-size:10px; }
        }
        @media (max-width:480px) {
            .chart-bar-row { flex-wrap:wrap; gap:4px; }
            .chart-bar-row .label { width:100%; font-size:10px; }
            .chart-bar-row .track { width:100%; min-width:auto; height:14px; }
            .chart-bar-row .value { width:100%; min-width:auto; font-size:10px; }
        }
        @supports (-webkit-touch-callout: none) {
            #sidebar #nav.ios-nav { display:block; }
            #sidebar #nav.ios-nav .nav-group { display:none; }
            #sidebar #nav.ios-nav #ios-nav-selector { display:block; width:100%; box-sizing:border-box; }
            #sidebar #nav.ios-nav .ios-nav-label { display:block; margin:0 0 7px; font-size:11px; font-weight:700; color:var(--text-soft); text-transform:uppercase; letter-spacing:.04em; }
            /* Asegurar que el selector iOS esté por encima y sea interactivo */
            #sidebar #nav.ios-nav select {
                width:100%; min-height:44px; padding:10px 38px 10px 13px; border:1px solid var(--border); border-radius:9px;
                background:#fff; color:var(--text); font-size:15px; font-weight:600; appearance:menulist-button; -webkit-appearance: menulist-button;
                position:relative; z-index:2200; box-sizing:border-box; touch-action:auto; pointer-events:auto;
            }
        }
    `;
    document.head.appendChild(style);
    uiCompatibilityStylesReady = true;
}

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

function navIcon(id, fallbackKey) {
    const paths = {
        dashboard: '<path d="M3 12h7V3H3zM14 21h7v-9h-7zM14 3h7v5h-7zM3 16h7v5H3z"/>',
        cotizaciones: '<path d="M6 2h9l3 3v17H6z"/><path d="M15 2v4h4M9 11h6M9 15h6M9 19h4"/>',
        administrativo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3M14 15h3"/>',
        documentos: '<path d="M4 3h11l5 5v13H4z"/><path d="M15 3v6h5M8 13h8M8 17h6"/>',
        finanzas: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M12 15h.01"/>',
        clientes: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M16 11c2.2.2 4 1.5 5 3.5M16 5.2a3 3 0 0 1 0 5.6"/>',
        experiencia: '<path d="M4 19V5M4 19h17M8 16v-5M12 16V7M16 16v-9M20 16v-4"/>',
        actividades: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        licitaciones: '<path d="M5 20h14M7 20V9h10v11M4 9h16M6 6l6-3 6 3M9 13h6M9 16h6"/>',
        contactos: '<circle cx="12" cy="8" r="3"/><path d="M5 21c.5-4 2.8-6 7-6s6.5 2 7 6M19 8h2M20 5l1-1M20 11l1 1"/>',
        config: '<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/><circle cx="12" cy="12" r="4"/>'
    };
    const path = paths[id] || (typeof ICONS !== 'undefined' && ICONS[fallbackKey]) || '';
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
}

function isAppleTouchDevice() {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function renderIOSNavigation(nav, groups) {
    nav.classList.add('ios-nav');
    const current = groups.flatMap(g => g.items).find(item => item[0] === S.view);
    nav.innerHTML = `
        <div id="ios-nav-selector">
            <label class="ios-nav-label" for="ios-nav-select">Sección</label>
            <select id="ios-nav-select" aria-label="Navegación principal">
                ${groups.map(group => `
                    <optgroup label="${group.title}">
                        ${group.items.map(([id, label]) => `<option value="${id}" ${S.view === id ? 'selected' : ''}>${label}</option>`).join('')}
                    </optgroup>
                `).join('')}
            </select>
        </div>
    `;
    const select = document.getElementById('ios-nav-select');
    if (select) select.onchange = () => { S.view = select.value; render(); };
}

function render() {
    ensureUICompatibilityStyles();

    const nav = document.getElementById('nav');
    const groups = [
        { title: 'Inicio', items: [['dashboard', 'Dashboard', 'dash']] },
        { title: 'Gestión profesional', items: [['cotizaciones', 'Cotizaciones', 'quote'],['administrativo', 'Administrativo', 'admin'],['documentos', 'Documentos', 'folder'],['finanzas', 'Finanzas', 'money'],['clientes', 'Clientes', 'client']] },
        { title: 'Trayectoria', items: [['experiencia', 'Experiencia', 'exp'],['actividades', 'Actividades', 'act'],['licitaciones', 'Licitaciones', 'lic']] },
        { title: 'Red profesional', items: [['contactos', 'Contactos', 'contact']] },
        { title: 'Sistema', items: [['config', 'Configuración', 'cfg']] }
    ];

    if (isAppleTouchDevice()) {
        renderIOSNavigation(nav, groups);
    } else {
        nav.classList.remove('ios-nav');
        nav.innerHTML = groups.map(group => `
            <div class="nav-group">
                <div class="nav-group-title">${group.title}</div>
                ${group.items.map(([id, label, ic]) => {
                    const icon = navIcon(id, ic);
                    return `<button class="nav-btn ${S.view === id ? 'active' : ''}" data-nav="${id}" title="${label}"><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></button>`;
                }).join('')}
            </div>
        `).join('');

        nav.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { S.view = b.dataset.nav; render(); });
    }

    const main = document.getElementById('main');
    main.classList.toggle('dashboard-compact', S.view === 'dashboard');
    main.classList.toggle('app-view', S.view !== 'dashboard');

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
        ensureClienteFinancieroModule().then(() => { if (S.view === 'clientes' && typeof enhanceClientesView === 'function') enhanceClientesView(); });
    }

    if (S.view === 'dashboard') {
        if (typeof syncDashboardPaymentCards === 'function') syncDashboardPaymentCards();
        if (typeof renderDashboardAlerts === 'function') renderDashboardAlerts();
        if (typeof syncDashboardFinancialView === 'function') syncDashboardFinancialView();
        if (typeof syncPagosFijosDashboard === 'function') syncPagosFijosDashboard();
        // Re-monta explícitamente la gráfica después de que viewDashboard() reemplaza #main.
        if (typeof renderDashboardExperienceEvolution === 'function') {
            setTimeout(() => {
                if (S.view === 'dashboard') renderDashboardExperienceEvolution();
            }, 0);
        }
    }

    if ((S.view === 'dashboard' || S.view === 'finanzas') && typeof syncPagosFijosEnhanced === 'function') syncPagosFijosEnhanced();
}
