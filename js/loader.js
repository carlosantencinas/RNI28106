(function(){
    function loadScript(url){
        return new Promise((resolve, reject) => {
            if (!url) return reject(new Error('No url'));
            // already loaded?
            const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src && s.src.indexOf(url) !== -1);
            if (existing) {
                if (existing.loaded) return resolve();
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', (e) => reject(e));
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
        // cargar secuencialmente para evitar condiciones de carrera
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/firebase-app-compat.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/firebase-auth-compat.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/firebase/10.12.2/firebase-firestore-compat.min.js');
    }

    async function loadJsPDF(){
        if (window.jspdf) return;
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
    }

    async function loadXLSX(){
        if (window.XLSX) return;
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }

    window.HidroLoader = {
        loadScript,
        loadFirebase,
        loadJsPDF,
        loadXLSX
    };
})();
