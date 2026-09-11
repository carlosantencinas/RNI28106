// ============================================================
// DOCUMENTOS - Vista previa PDF sin Firebase Storage
// ============================================================
// Los PDF siguen almacenados como Data URL en Firestore.
// Este módulo evita abrir la Data URL directamente en el navegador.
// Genera una miniatura temporal de la primera página y ofrece
// descargar, compartir o imprimir sin modificar los datos guardados.
// ============================================================
(function () {
    'use strict';

    const PDFJS_VERSION = '3.11.174';
    const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
    let pdfJsPromise = null;

    function getDocument(docId) {
        const documentos = typeof S !== 'undefined' && Array.isArray(S.documentos) ? S.documentos : [];
        return documentos.find(x => String(x.id) === String(docId)) || null;
    }

    function getAttachment(doc) {
        if (!doc || typeof doc.archivo !== 'string' || !doc.archivo) return null;
        const url = doc.archivo;
        if (url.startsWith('data:')) {
            const comma = url.indexOf(',');
            if (comma < 0) return null;
            const meta = url.slice(0, comma);
            const data = url.slice(comma + 1);
            const mimeMatch = meta.match(/^data:([^;,]+)/i);
            const mime = mimeMatch ? mimeMatch[1] : (doc.archivoTipo || 'application/pdf');
            return { url, data, mime, isDataUrl: true };
        }
        if (/^https?:\/\//i.test(url)) {
            return { url, data: null, mime: doc.archivoTipo || '', isDataUrl: false };
        }
        return null;
    }

    function base64ToBytes(base64) {
        const clean = String(base64).replace(/\s/g, '');
        const binary = atob(clean);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function dataUrlToBlob(dataUrl, fallbackMime) {
        const comma = dataUrl.indexOf(',');
        if (comma < 0) throw new Error('Archivo adjunto inválido.');
        const meta = dataUrl.slice(0, comma);
        const payload = dataUrl.slice(comma + 1);
        const mimeMatch = meta.match(/^data:([^;,]+)/i);
        const mime = mimeMatch ? mimeMatch[1] : fallbackMime || 'application/pdf';
        const isBase64 = /;base64/i.test(meta);
        let bytes;
        if (isBase64) {
            bytes = base64ToBytes(payload);
        } else {
            const text = decodeURIComponent(payload);
            bytes = new TextEncoder().encode(text);
        }
        return new Blob([bytes], { type: mime });
    }

    function attachmentToBlob(doc) {
        const attachment = getAttachment(doc);
        if (!attachment) throw new Error('Este documento no tiene archivo adjunto.');
        if (attachment.isDataUrl) return dataUrlToBlob(attachment.url, attachment.mime);
        throw new Error('Este archivo usa una URL externa y no puede procesarse localmente.');
    }

    function loadPdfJs() {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
            return Promise.resolve(window.pdfjsLib);
        }
        if (pdfJsPromise) return pdfJsPromise;

        pdfJsPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-rni-pdfjs]');
            if (existing) {
                existing.addEventListener('load', () => {
                    if (!window.pdfjsLib) return reject(new Error('No se pudo cargar PDF.js.'));
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
                    resolve(window.pdfjsLib);
                }, { once: true });
                existing.addEventListener('error', () => reject(new Error('No se pudo cargar el visor de PDF.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = PDFJS_URL;
            script.async = true;
            script.dataset.rniPdfjs = 'true';
            script.onload = () => {
                if (!window.pdfjsLib) {
                    reject(new Error('No se pudo cargar PDF.js.'));
                    return;
                }
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
                resolve(window.pdfjsLib);
            };
            script.onerror = () => reject(new Error('No se pudo cargar el visor de PDF.'));
            document.head.appendChild(script);
        });
        return pdfJsPromise;
    }

    function safeFileName(doc) {
        let name = doc?.nombreArchivo || doc?.nombre || 'documento.pdf';
        name = String(name).replace(/[\\/:*?"<>|]+/g, '_').trim();
        if (!name) name = 'documento.pdf';
        if (!/\.[a-z0-9]{2,5}$/i.test(name)) name += '.pdf';
        return name;
    }

    function closePreview(overlay) {
        if (overlay && overlay.parentNode) overlay.remove();
    }

    function showError(overlay, message) {
        const body = overlay.querySelector('[data-pdf-preview-body]');
        if (body) {
            body.innerHTML = `<div style="padding:28px;text-align:center;color:var(--danger);">❌ ${esc(message)}</div>`;
        }
    }

    async function renderPdfThumbnail(doc, canvas) {
        const blob = attachmentToBlob(doc);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        const page = await pdf.getPage(1);

        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 620;
        const scale = Math.min(1.4, targetWidth / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const outputScale = Math.min(2, window.devicePixelRatio || 1);

        canvas.width = Math.ceil(viewport.width * outputScale);
        canvas.height = Math.ceil(viewport.height * outputScale);
        canvas.style.width = `${Math.ceil(viewport.width)}px`;
        canvas.style.height = `${Math.ceil(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        await page.render({
            canvasContext: ctx,
            viewport,
            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
        }).promise;

        return { pages: pdf.numPages, width: viewport.width, height: viewport.height };
    }

    function createPreview(doc) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="modal" style="max-width:760px;width:calc(100vw - 28px);">
                <div class="modal-h">
                    <div style="min-width:0;">
                        <h3 style="margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📄 ${esc(doc.nombre || 'Documento')}</h3>
                        <div style="font-size:11px;color:var(--text-soft);margin-top:3px;">${esc(doc.nombreArchivo || 'Archivo PDF')}</div>
                    </div>
                    <button class="close" type="button" data-pdf-close>&times;</button>
                </div>
                <div class="modal-body" data-pdf-preview-body style="padding:14px;background:var(--bg);">
                    <div style="min-height:280px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:var(--text-soft);">
                        <div style="font-size:34px;">📄</div>
                        <div>Generando vista previa…</div>
                    </div>
                </div>
                <div class="modal-foot" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
                    <button class="btn btn-ghost" type="button" data-pdf-download>⬇ Descargar</button>
                    <button class="btn btn-primary" type="button" data-pdf-share>📤 Compartir</button>
                    <button class="btn btn-ghost" type="button" data-pdf-print>🖨 Imprimir</button>
                    <button class="btn btn-ghost" type="button" data-pdf-close>Cerrar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const close = () => closePreview(overlay);
        overlay.querySelectorAll('[data-pdf-close]').forEach(btn => btn.addEventListener('click', close));
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });

        overlay.querySelector('[data-pdf-download]').addEventListener('click', () => {
            try {
                const blob = attachmentToBlob(doc);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = safeFileName(doc);
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 60000);
                if (typeof toast === 'function') toast('✅ PDF descargado.');
            } catch (error) {
                console.error('Error descargando PDF:', error);
                if (typeof toast === 'function') toast('❌ No se pudo descargar el PDF.');
            }
        });

        overlay.querySelector('[data-pdf-share]').addEventListener('click', async () => {
            try {
                const blob = attachmentToBlob(doc);
                const file = new File([blob], safeFileName(doc), { type: blob.type || 'application/pdf' });
                if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
                    await navigator.share({ title: doc.nombre || 'Documento', files: [file] });
                    return;
                }
                if (typeof toast === 'function') toast('ℹ️ Tu navegador no permite compartir archivos directamente. Usa Descargar para enviarlo por WhatsApp.');
            } catch (error) {
                if (error?.name === 'AbortError') return;
                console.error('Error compartiendo PDF:', error);
                if (typeof toast === 'function') toast('❌ No se pudo compartir el PDF.');
            }
        });

        overlay.querySelector('[data-pdf-print]').addEventListener('click', () => {
            try {
                const blob = attachmentToBlob(doc);
                const url = URL.createObjectURL(blob);
                const win = window.open(url, '_blank');
                if (!win) {
                    URL.revokeObjectURL(url);
                    if (typeof toast === 'function') toast('⚠️ Permite ventanas emergentes para imprimir.');
                    return;
                }
                const timer = setInterval(() => {
                    try {
                        if (win.closed) {
                            clearInterval(timer);
                            URL.revokeObjectURL(url);
                        }
                    } catch (_) {}
                }, 1000);
            } catch (error) {
                console.error('Error preparando impresión:', error);
                if (typeof toast === 'function') toast('❌ No se pudo preparar el PDF para imprimir.');
            }
        });

        const body = overlay.querySelector('[data-pdf-preview-body]');
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.background = '#fff';
        canvas.style.boxShadow = '0 2px 12px rgba(0,0,0,.12)';
        canvas.style.margin = '0 auto';
        body.innerHTML = '';
        body.appendChild(canvas);

        renderPdfThumbnail(doc, canvas).then(info => {
            const footer = document.createElement('div');
            footer.style.cssText = 'text-align:center;font-size:11px;color:var(--text-soft);margin-top:10px;';
            footer.textContent = info.pages > 1 ? `Página 1 de ${info.pages} · Vista previa` : 'Página 1 · Vista previa';
            body.appendChild(footer);
        }).catch(error => {
            console.error('Error generando miniatura PDF:', error);
            showError(overlay, error.message || 'No se pudo generar la vista previa. Puedes usar Descargar.');
        });

        return overlay;
    }

    window.verDocumento = function (docId) {
        const doc = getDocument(docId);
        if (!doc) {
            if (typeof toast === 'function') toast('⚠️ No se encontró el documento.');
            return;
        }
        if (!getAttachment(doc)) {
            if (typeof toast === 'function') toast('⚠️ Este documento no tiene archivo adjunto.');
            return;
        }
        createPreview(doc);
    };

    // Captura los botones creados por viewAdministrativo() sin modificar esa vista.
    // Se usa captura para impedir que otra implementación de verDocumento abra la Data URL.
    document.addEventListener('click', function (event) {
        const button = event.target.closest('[data-ver-doc]');
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        window.verDocumento(button.getAttribute('data-ver-doc'));
    }, true);
})();
