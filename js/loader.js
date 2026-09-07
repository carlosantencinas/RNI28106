(function(){
    function loadScript(url){
        return new Promise((resolve, reject) => {
            if (!url) return reject(new Error('No url'));
            const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src && s.src.indexOf(url) !== -1);
            if (existing) {
                if (existing.loaded || (url.includes('jspdf') && window.jspdf) || (url.includes('autotable') && window.jspdf?.jsPDF?.API?.autoTable)) return resolve();
                existing.addEventListener('load', () => resolve(), {once:true});
                existing.addEventListener('error', e => reject(e), {once:true});
                return;
            }
            const s = document.createElement('script');
            s.src = url;
            s.async = true;
            s.onload = () => { s.loaded = true; resolve(); };
            s.onerror = e => reject(e);
            document.head.appendChild(s);
        });
    }

    async function loadFirebase(){
        if (window.firebase) return;
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/firebase-app-compat.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/firebase-auth-compat.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/firebase-firestore-compat.min.js');
    }

    let jsPDFPromise = null;
    function loadJsPDF(){
        if (window.jspdf?.jsPDF?.API?.autoTable) return Promise.resolve();
        if (jsPDFPromise) return jsPDFPromise;
        jsPDFPromise = (async () => {
            if (!window.jspdf?.jsPDF) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }
            if (!window.jspdf?.jsPDF?.API?.autoTable) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
            }
            if (!window.jspdf?.jsPDF) throw new Error('jsPDF no pudo cargarse');
            if (!window.jspdf.jsPDF.API.autoTable) throw new Error('jsPDF AutoTable no pudo cargarse');
        })().catch(err => {
            jsPDFPromise = null;
            throw err;
        });
        return jsPDFPromise;
    }

    async function loadXLSX(){
        if (window.XLSX) return;
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }

    function installPdfGuard(){
        ['exportPDF','exportDebtsWithColumns'].forEach(name => {
            const original = window[name];
            if (typeof original !== 'function' || original.__pdfReadyGuard) return;
            const guarded = async function(...args){
                try {
                    await loadJsPDF();
                } catch (error) {
                    console.error('Error cargando PDF:', error);
                    toast('❌ No se pudo cargar la librería PDF. Verifica tu conexión a Internet e inténtalo nuevamente.');
                    return;
                }
                return original.apply(this, args);
            };
            guarded.__pdfReadyGuard = true;
            window[name] = guarded;
        });
        if (!window.exportPDF || !window.exportDebtsWithColumns) setTimeout(installPdfGuard, 100);
    }

    window.HidroLoader = {
        loadScript,
        loadFirebase,
        loadJsPDF,
        loadXLSX
    };

    // Precargar PDF al iniciar y evitar la condición de carrera al exportar.
    loadJsPDF().catch(err => console.warn('PDF se cargará bajo demanda:', err));
    setTimeout(installPdfGuard, 0);
})();
