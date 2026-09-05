// ============================================================
// NAVEGACIÓN MÓVIL - ESTILOS
// Incluye ajustes responsive de navegación y modales.
// ============================================================
(function () {
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
            }

            @media (max-width:768px) {
                body { display:block !important; }
                #app-container { display:block !important; width:100% !important; }
                #sidebar {
                    width:100% !important; height:auto !important; min-height:0 !important;
                    position:sticky !important; top:0 !important; z-index:1000 !important;
                    display:flex !important; padding:0 !important; background:#102F3A !important;
                    color:#fff !important; border:0 !important; align-items:center !important;
                    box-shadow:0 2px 10px rgba(0,0,0,.12) !important;
                }
                #sidebar .brand {
                    height:48px !important; display:flex !important; align-items:center !important;
                    padding:7px 13px !important; margin:0 !important; border:0 !important; flex:1;
                }
                #sidebar .brand-stamp { width:32px !important; height:32px !important; border-radius:8px !important; }
                #sidebar .brand-txt { display:block !important; }
                #sidebar .brand-txt .t1 { color:#fff !important; font-size:13px !important; }
                #sidebar .brand-txt .t2 { color:rgba(255,255,255,.58) !important; font-size:9px !important; }
                #sidebar #nav { display:none !important; }
                #sidebar .nav-user, #sidebar .nav-foot { display:none !important; }

                .mobile-hamburger {
                    display:inline-flex !important; align-items:center !important; justify-content:center !important;
                    width:40px !important; height:40px !important; background:transparent !important; border:none !important;
                    color:#fff !important; cursor:pointer !important; z-index:2300 !important; margin-right:8px !important;
                    padding:8px !important; flex-shrink:0 !important;
                }
                .mobile-hamburger svg { width:20px !important; height:20px !important; stroke:#fff !important; stroke-width:2.2 !important; }

                main {
                    width:100% !important; min-width:0 !important; margin:0 !important;
                    padding:12px !important; box-sizing:border-box !important;
                }

                /* Modales: en móvil deben ocupar la ventana, no quedar fuera de ella. */
                .overlay {
                    position:fixed !important;
                    inset:0 !important;
                    width:100vw !important;
                    height:100dvh !important;
                    min-height:100vh !important;
                    padding:8px !important;
                    display:flex !important;
                    align-items:flex-start !important;
                    justify-content:center !important;
                    overflow-y:auto !important;
                    overflow-x:hidden !important;
                    z-index:9999 !important;
                    -webkit-overflow-scrolling:touch !important;
                }

                .overlay .modal {
                    width:100% !important;
                    max-width:none !important;
                    max-height:calc(100dvh - 16px) !important;
                    margin:0 !important;
                    display:flex !important;
                    flex-direction:column !important;
                    overflow:hidden !important;
                    flex-shrink:0 !important;
                }

                .overlay .modal-h {
                    flex:0 0 auto !important;
                    padding:13px 16px !important;
                }

                .overlay .modal-h h3 { font-size:15px !important; }

                .overlay .modal-body {
                    flex:1 1 auto !important;
                    min-height:0 !important;
                    max-height:none !important;
                    overflow-y:auto !important;
                    overflow-x:hidden !important;
                    padding:16px !important;
                    -webkit-overflow-scrolling:touch !important;
                }

                .overlay .modal-foot {
                    flex:0 0 auto !important;
                    padding:10px 16px !important;
                    background:var(--surface) !important;
                    padding-bottom:max(10px, env(safe-area-inset-bottom)) !important;
                }

                .overlay .modal-foot .btn { flex:1 1 0 !important; justify-content:center !important; }
            }
        `;
        document.head.appendChild(style);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectStyles);
    else injectStyles();
})();
