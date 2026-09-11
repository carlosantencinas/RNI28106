// ============================================================
// FIX SEGURO - VISUALIZACIÓN DE PDFS
// No modifica datos ni la vista de Documentos.
// Convierte Data URL Base64 a Blob URL antes de abrir el PDF.
// ============================================================
(function () {
    'use strict';

    function dataUrlToBlobUrl(dataUrl) {
        const parts = dataUrl.split(',');
        if (parts.length !== 2) throw new Error('Archivo PDF inválido.');
        const meta = parts[0];
        const base64 = parts[1];
        const match = meta.match(/^data:([^;]+);base64$/i);
        const mime = match ? match[1] : 'application/pdf';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return URL.createObjectURL(new Blob([bytes], { type: mime }));
    }

    window.verDocumento = function (docId) {
        const documentos = typeof S !== 'undefined' && Array.isArray(S.documentos) ? S.documentos : [];
        const d = documentos.find(x => String(x.id) === String(docId));
        if (!d || typeof d.archivo !== 'string' || !d.archivo) {
            if (typeof toast === 'function') toast('⚠️ Este documento no tiene archivo adjunto.');
            return;
        }

        try {
            let url = d.archivo;
            let revoke = false;

            if (url.startsWith('data:application/pdf;base64,')) {
                url = dataUrlToBlobUrl(url);
                revoke = true;
            }

            const win = window.open(url, '_blank');
            if (!win) {
                if (typeof toast === 'function') toast('⚠️ Permite ventanas emergentes para ver el documento.');
                if (revoke) URL.revokeObjectURL(url);
                return;
            }

            // Mantener la Blob URL viva mientras el visor PDF la carga.
            if (revoke) setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error('Error abriendo PDF:', error);
            if (typeof toast === 'function') toast('❌ No se pudo abrir el PDF.');
        }
    };
})();
