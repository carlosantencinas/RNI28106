// ============================================================
// NAVEGACIÓN MÓVIL - SELECTOR DESPLEGABLE
// En pantallas táctiles/móviles reemplaza el sidebar por un
// selector compacto. Escritorio conserva el menú lateral.
// ============================================================
(function () {
    const MOBILE_QUERY = '(max-width: 768px)';
    let initialized = false;

    function isMobile() {
        return window.matchMedia(MOBILE_QUERY).matches;
    }

    function injectStyles() {
        if (document.getElementById('mobile-nav-styles')) return;
        const style = document.createElement('style');
        style.id = 'mobile-nav-styles';
        style.textContent = `
            @media (max-width:768px) {
                #app-container { display:block !important; }
                #sidebar { width:100% !important; height:auto !important; min-height:0 !important; position:sticky !important; top:0 !important; z-index:1000 !important; border-right:0 !important; border-bottom:1px solid var(--border) !important; padding:10px 12px !important; box-sizing:border-box !important; background:#fff !important; }
                #sidebar .brand { display:flex !important; align-items:center !important; margin-bottom:8px !important; }
                #sidebar .brand-txt, #sidebar .nav-user, #sidebar .nav-foot { display:none !important; }
                #sidebar .brand-stamp { width:34px !important; height:34px !important; margin:0 !important; }
                #sidebar #nav { display:block !important; }
                #sidebar #nav .nav-group { display:none !important; }
                #mobile-nav-select-wrap { display:block !important; }
                #mobile-nav-select { width:100%; min-height:44px; padding:0 40px 0 14px; border:1px solid #cbd5e1; border-radius:10px; background:#1565C0; color:#fff; font:600 15px Inter,system-ui,sans-serif; appearance:auto; -webkit-appearance:auto; box-sizing:border-box; }
                #main { width:100% !important; min-width:0 !important; margin:0 !important; padding:12px !important; box-sizing:border-box !important; }
            }
            @media (min-width:769px) { #mobile-nav-select-wrap { display:none !important; } }
        `;
        document.head.appendChild(style);
    }

    function mount() {
        injectStyles();
        const nav = document.getElementById('nav');
        const sidebar = document.getElementById('sidebar');
        if (!nav || !sidebar) return;

        let wrap = document.getElementById('mobile-nav-select-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'mobile-nav-select-wrap';
            wrap.style.display = 'none';
            sidebar.insertBefore(wrap, nav);
        }

        if (!isMobile()) {
            wrap.innerHTML = '';
            return;
        }

        const buttons = Array.from(nav.querySelectorAll('[data-nav]'));
        if (!buttons.length) return;

        const current = typeof S !== 'undefined' ? S.view : (buttons.find(b => b.classList.contains('active'))?.dataset.nav || 'dashboard');
        const groups = [];
        let lastGroup = null;
        buttons.forEach(btn => {
            const group = btn.closest('.nav-group');
            const title = group?.querySelector('.nav-group-title')?.textContent?.trim() || 'Menú';
            if (!lastGroup || lastGroup.title !== title) {
                lastGroup = { title, items: [] };
                groups.push(lastGroup);
            }
            lastGroup.items.push({ id: btn.dataset.nav, label: btn.textContent.trim() });
        });

        wrap.innerHTML = `<select id="mobile-nav-select" aria-label="Seleccionar sección">${groups.map(g => `<optgroup label="${g.title}">${g.items.map(i => `<option value="${i.id}" ${i.id === current ? 'selected' : ''}>${i.label}</option>`).join('')}</optgroup>`).join('')}</select>`;
        const select = document.getElementById('mobile-nav-select');
        select.onchange = function () {
            if (typeof S !== 'undefined') S.view = this.value;
            if (typeof render === 'function') render();
        };
        initialized = true;
    }

    function start() {
        injectStyles();
        mount();
        const nav = document.getElementById('nav');
        if (nav && !nav.__mobileNavObserver) {
            const observer = new MutationObserver(() => {
                if (isMobile()) mount();
            });
            observer.observe(nav, { childList: true, subtree: true });
            nav.__mobileNavObserver = observer;
        }
        window.addEventListener('resize', mount);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
