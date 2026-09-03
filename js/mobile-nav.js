// ============================================================
// NAVEGACIÓN MÓVIL - SELECTOR DESPLEGABLE
// Móvil: barra superior compacta + selector. Escritorio: sidebar.
// ============================================================
(function () {
    const MOBILE_QUERY = '(max-width: 768px)';

    function isMobile() {
        return window.matchMedia(MOBILE_QUERY).matches;
    }

    function injectStyles() {
        if (document.getElementById('mobile-nav-styles')) return;
        const style = document.createElement('style');
        style.id = 'mobile-nav-styles';
        style.textContent = `
            @media (min-width:769px) {
                #sidebar { background:#102F3A !important; color:#fff !important; border-right:0 !important; }
                #sidebar .brand { border-bottom-color:rgba(255,255,255,.12) !important; }
                #sidebar .brand-txt .t1 { color:#fff !important; }
                #sidebar .brand-txt .t2 { color:rgba(255,255,255,.62) !important; }
                #sidebar .nav-group-title { color:rgba(255,255,255,.42) !important; }
                #sidebar .nav-btn { color:rgba(255,255,255,.72) !important; }
                #sidebar .nav-btn:hover { background:rgba(255,255,255,.08) !important; color:#fff !important; }
                #sidebar .nav-btn.active { background:#1565C0 !important; color:#fff !important; border-color:rgba(255,255,255,.12) !important; box-shadow:none !important; }
                #sidebar .nav-btn.active .nav-icon { background:rgba(255,255,255,.16) !important; color:#fff !important; box-shadow:none !important; }
                #sidebar .nav-icon { background:rgba(255,255,255,.07) !important; }
                #sidebar .nav-user .email { color:rgba(255,255,255,.85) !important; }
                #sidebar .nav-user .logout-btn { color:rgba(255,255,255,.72) !important; border-color:rgba(255,255,255,.15) !important; }
                #sidebar .nav-foot { border-top-color:rgba(255,255,255,.12) !important; color:rgba(255,255,255,.42) !important; }
                #mobile-nav-select-wrap { display:none !important; }
            }

            @media (max-width:768px) {
                body { display:block !important; }
                #app-container { display:block !important; width:100% !important; }
                #sidebar {
                    width:100% !important; height:auto !important; min-height:0 !important;
                    position:sticky !important; top:0 !important; z-index:1000 !important;
                    display:block !important; padding:0 !important; background:#102F3A !important;
                    color:#fff !important; border:0 !important;
                    box-shadow:0 2px 10px rgba(0,0,0,.12) !important;
                }
                #sidebar .brand {
                    height:48px !important; display:flex !important; align-items:center !important;
                    padding:7px 13px !important; margin:0 !important; border:0 !important;
                }
                #sidebar .brand-stamp { width:32px !important; height:32px !important; border-radius:8px !important; }
                #sidebar .brand-txt { display:block !important; }
                #sidebar .brand-txt .t1 { color:#fff !important; font-size:13px !important; }
                #sidebar .brand-txt .t2 { color:rgba(255,255,255,.58) !important; font-size:9px !important; }
                #sidebar #nav { display:none !important; }
                #sidebar .nav-user, #sidebar .nav-foot { display:none !important; }
                #mobile-nav-select-wrap {
                    display:flex !important; align-items:center !important;
                    padding:6px 13px 9px !important; background:#102F3A !important;
                }
                #mobile-nav-select-wrap::before {
                    content:'MENÚ' !important; color:rgba(255,255,255,.5) !important;
                    font:700 9px/1 Inter,system-ui,sans-serif !important;
                    letter-spacing:.08em !important; margin-right:9px !important;
                    flex:0 0 auto !important;
                }
                #mobile-nav-select {
                    flex:1 !important; width:auto !important; min-width:0 !important;
                    height:38px !important; padding:0 32px 0 12px !important;
                    border:1px solid #D9D6CE !important; border-radius:8px !important;
                    background:#fff !important; color:#1E1E1E !important;
                    font:600 13px Inter,system-ui,sans-serif !important;
                    appearance:auto !important; -webkit-appearance:auto !important;
                    box-sizing:border-box !important;
                }
                #main {
                    width:100% !important; min-width:0 !important; margin:0 !important;
                    padding:12px !important; box-sizing:border-box !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function mount() {
        injectStyles();
        const nav = document.getElementById('nav');
        const sidebar = document.getElementById('sidebar');
        if (!nav || !sidebar || !isMobile()) return;

        let wrap = document.getElementById('mobile-nav-select-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'mobile-nav-select-wrap';
            sidebar.insertBefore(wrap, nav);
        }

        const buttons = Array.from(nav.querySelectorAll('[data-nav]'));
        if (!buttons.length) return;

        const current = typeof S !== 'undefined' ? S.view : 'dashboard';
        const groups = [];
        let last = null;
        buttons.forEach(btn => {
            const group = btn.closest('.nav-group');
            const title = group?.querySelector('.nav-group-title')?.textContent?.trim() || 'Menú';
            if (!last || last.title !== title) {
                last = { title, items: [] };
                groups.push(last);
            }
            last.items.push({ id: btn.dataset.nav, label: btn.textContent.trim() });
        });

        wrap.innerHTML = `<select id="mobile-nav-select" aria-label="Seleccionar sección">${groups.map(g => `<optgroup label="${g.title}">${g.items.map(i => `<option value="${i.id}" ${i.id === current ? 'selected' : ''}>${i.label}</option>`).join('')}</optgroup>`).join('')}</select>`;
        const select = document.getElementById('mobile-nav-select');
        select.onchange = function () {
            if (typeof S !== 'undefined') S.view = this.value;
            if (typeof render === 'function') render();
        };
    }

    function start() {
        injectStyles();
        mount();
        const nav = document.getElementById('nav');
        if (nav && !nav.__mobileNavObserver) {
            const observer = new MutationObserver(() => { if (isMobile()) mount(); });
            observer.observe(nav, { childList:true, subtree:true });
            nav.__mobileNavObserver = observer;
        }
        window.addEventListener('resize', mount);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
