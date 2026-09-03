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

        /* Menú moderno, usando SVG para evitar emojis problemáticos en iOS */
        #sidebar { background:#102F3A; color:#fff; border-right:0; padding:20px 12px 14px; gap:6px; }
        .brand { padding:4px 8px 18px; border-bottom-color:rgba(255,255,255,.12); margin-bottom:8px; }
        .brand-txt .t1 { color:#fff; }
        .brand-txt .t2 { color:rgba(255,255,255,.62); font-size:10px; }
        .nav-group { margin-bottom:9px; }
        .nav-group-title { padding:5px 12px 6px; font-size:9px; font-weight:700; letter-spacing:.12em; color:rgba(255,255,255,.42); }
        .nav-btn { position:relative; gap:10px; padding:9px 10px; margin:2px 0; border-radius:10px; border:1px solid transparent; background:transparent; color:rgba(255,255,255,.72); font-size:12.5px; }
        .nav-btn:hover { background:rgba(255,255,255,.08); color:#fff; }
        .nav-btn.active { background:rgba(212,168,84,.14); color:#fff; border-color:rgba(212,168,84,.28); box-shadow:inset 3px 0 0 var(--accent); }
        .nav-icon { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:8px; background:rgba(255,255,255,.07); line-height:0; flex-shrink:0; }
        .nav-icon svg { width:18px !important; height:18px !important; display:block; flex:none; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
        .nav-btn:hover .nav-icon { background:rgba(255,255,255,.13); }
        .nav-btn.active .nav-icon { background:var(--accent); color:#fff; box-shadow:0 3px 10px rgba(184,134,46,.25); }
        .nav-btn.active .nav-icon svg { stroke:#fff; }
        .nav-label { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .nav-user { color:rgba(255,255,255,.6); border-top-color:rgba(255,255,255,.12); }
        .nav-user .email { color:rgba(255,255,255,.85); }
        .nav-user .logout-btn { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.15); color:rgba(255,255,255,.72); }
        .nav-foot { color:rgba(255,255,255,.42); border-top-color:rgba(255,255,255,.12); }

        /* Dashboard compacto sin eliminar información */
        .dashboard-compact { padding-top:22px; }
        .dashboard-compact .page-head { margin-bottom:15px; }
        .dashboard-compact .page-head h1 { font-size:21px; }
        .dashboard-compact .kpi-grid { grid-template-columns:repeat(6,minmax(120px,1fr)); gap:9px; margin-bottom:14px; }
        .dashboard-compact .kpi { padding:10px 12px; min-height:78px; }
        .dashboard-compact .kpi .val { font-size:18px; }
        .dashboard-compact .panel + .panel { margin-top:10px; }
        .dashboard-compact .panel-h { padding:10px 14px; }
        .dashboard-compact .panel-body { padding:11px 14px; }
        .dashboard-compact .dash-grid-2 { gap:10px; margin-bottom:10px; }
        .dashboard-compact .chart-bar-row { margin-bottom:5px; }
        .dashboard-compact .chart-bar-row .track { height:13px; }
        .dashboard-compact #dashboard-experience-evolution { margin-top:10px !important; padding:14px !important; }
        .dashboard-compact .gantt-container { padding:10px; }
        .dashboard-compact .gantt-row { padding:4px 0; }
        .dashboard-compact .gantt-track { height:22px; }
        .dashboard-compact .gantt-label { width:180px; }

        @media (max-width:1100px) { .dashboard-compact .kpi-grid { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:768px) {
            .chart-bar-row .label { width:80px; font-size:10px; }
            .chart-bar-row .value { min-width:70px; font-size:10px; }
            .dashboard-compact .kpi-grid { grid-template-columns:repeat(2,1fr); }
            #sidebar { width:70px; padding:14px 7px; }
            .brand { justify-content:center; padding:2px 0 14px; }
            .brand-txt,.nav-label,.nav-group-title,.nav-foot,.nav-user { display:none; }
            .nav-btn { justify-content:center; padding:7px; }
            .nav-icon { width:38px; height:38px; }
        }
        @media (max-width:480px) {
            .chart-bar-row { flex-wrap:wrap; gap:4px; }
            .chart-bar-row .label { width:100%; font-size:10px; }
            .chart-bar-row .track { width:100%; min-width:auto; height:14px; }
            .chart-bar-row .value { width:100%; min-width:auto; font-size:10px; }
            .dashboard-compact .kpi-grid { grid-template-columns:1fr 1fr; }
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
        if (typeof renderDashboardExperienceEvolution === 'function') setTimeout(() => renderDashboardExperienceEvolution(), 0);
    }

    if ((S.view === 'dashboard' || S.view === 'finanzas') && typeof syncPagosFijosEnhanced === 'function') syncPagosFijosEnhanced();
}
