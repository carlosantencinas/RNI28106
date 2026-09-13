// ============================================================
// COTIZACIONES PDF - VISTA PREVIA / COMPARTIR
// Intercepta solamente la descarga de [data-pdf].
// La generación del PDF existente no se modifica.
// ============================================================
(function (global) {
    'use strict';

    let activeUrl = null;
    let activeBlob = null;
    let activeName = 'Cotizacion.pdf';

    function cleanupUrl() {
        if (activeUrl) {
            URL.revokeObjectURL(activeUrl);
            activeUrl = null;
        }
    }

    function openPreview(blob, filename) {
        cleanupUrl();
        activeBlob = blob;
        activeName = filename || 'Cotizacion.pdf';
        activeUrl = URL.createObjectURL(blob);

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.cssText += 'z-index:2500;';
        overlay.innerHTML = `
            <div class="modal" style="width:min(1100px,96vw);height:min(92vh,900px);max-width:none;display:flex;flex-direction:column;">
                <div class="modal-h">
                    <div>
                        <h3>📄 Vista previa de cotización</h3>
                        <div style="font-size:11px;color:var(--text-soft);margin-top:2px;">${safe(filename)}</div>
                    </div>
                    <button class="close" id="cot-pdf-close">&times;</button>
                </div>
                <div style="flex:1;min-height:0;background:#e9edf0;padding:8px;">
                    <iframe id="cot-pdf-frame" title="Vista previa PDF" src="${activeUrl}" style="width:100%;height:100%;border:1px solid var(--border);border-radius:6px;background:#fff;"></iframe>
                </div>
                <div class="modal-foot" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
                    <button class="btn btn-ghost" id="cot-pdf-download">⬇ Descargar PDF</button>
                    <button class="btn btn-primary" id="cot-pdf-share">📤 Compartir / WhatsApp</button>
                    <button class="btn btn-ghost" id="cot-pdf-print">🖨 Imprimir</button>
                    <button class="btn btn-ghost" id="cot-pdf-close2">Cerrar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const close = () => {
            overlay.remove();
            cleanupUrl();
            activeBlob = null;
        };
        overlay.querySelector('#cot-pdf-close').onclick = close;
        overlay.querySelector('#cot-pdf-close2').onclick = close;
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

        overlay.querySelector('#cot-pdf-download').onclick = () => {
            const a = document.createElement('a');
            a.href = activeUrl;
            a.download = activeName;
            document.body.appendChild(a);
            a.click();
            a.remove();
        };

        overlay.querySelector('#cot-pdf-print').onclick = () => {
            const frame = overlay.querySelector('#cot-pdf-frame');
            try {
                frame.contentWindow?.focus();
                frame.contentWindow?.print();
            } catch (_) {
                window.open(activeUrl, '_blank', 'noopener');
            }
        };

        overlay.querySelector('#cot-pdf-share').onclick = async () => {
            if (!activeBlob) return;
            const file = new File([activeBlob], activeName, { type: 'application/pdf' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Cotización',
                        text: 'Cotización — Ing. Antequera',
                        files: [file]
                    });
                    return;
                } catch (e) {
                    if (e?.name === 'AbortError') return;
                }
            }
            // Fallback para escritorio/navegadores sin compartir archivos.
            const url = `https://wa.me/?text=${encodeURIComponent('Te envío la cotización: ' + activeName)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            toast('📤 WhatsApp abierto. Adjunta el PDF descargado en la conversación.');
        };
    }

    function safe(value) {
        return typeof esc === 'function' ? esc(value || '') : String(value || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function interceptPdfClick(event) {
        const button = event.target.closest('[data-pdf]');
        if (!button || !document.body.contains(button)) return;
        if (!global.jspdf?.jsPDF?.API) return;

        const api = global.jspdf.jsPDF.API;
        const originalSave = api.save;
        if (typeof originalSave !== 'function') return;

        let captured = false;
        api.save = function (filename) {
            captured = true;
            const blob = this.output('blob');
            openPreview(blob, filename || 'Cotizacion.pdf');
            return this;
        };

        // No detenemos el evento: así se conserva exactamente el generador
        // actual de la cotización. Solo reemplazamos temporalmente save().
        setTimeout(() => {
            api.save = originalSave;
            if (!captured) toast('⚠️ No se pudo capturar el PDF generado.');
        }, 0);
    }

    document.addEventListener('click', interceptPdfClick, true);
})(window);
