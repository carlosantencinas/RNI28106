// ============================================================
// DOCUMENTOS - Almacenamiento persistente de adjuntos
// ============================================================
// Firestore guarda los metadatos; Firebase Storage guarda los
// archivos. Esto evita guardar PDFs/Base64 dentro de Firestore.

(function () {
    'use strict';

    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

    const EXTRA_DOCUMENT_TYPES = {
        soat: { label: 'SOAT', icon: '🚗', color: 'var(--danger)' },
        ruat: { label: 'RUAT / CRPVA', icon: '🚙', color: 'var(--primary)' },
        licencia: { label: 'Licencia de conducir', icon: '🪪', color: 'var(--accent)' },
        carnetIdentidad: { label: 'Carnet de identidad', icon: '🪪', color: 'var(--primary)' },
        carnetProfesional: { label: 'Carnet profesional / RNI', icon: '🎫', color: 'var(--success)' }
    };

    // TIPOS_DOCUMENTOS ya existe en la aplicación actual. Solo ampliamos
    // el objeto para conservar todos los tipos anteriores.
    if (typeof TIPOS_DOCUMENTOS !== 'undefined') {
        Object.assign(TIPOS_DOCUMENTOS, EXTRA_DOCUMENT_TYPES);
    }

    function storageReady() {
        return typeof firebase !== 'undefined' &&
            typeof firebase.storage === 'function' &&
            S.user?.uid;
    }

    function safeName(name) {
        return String(name || 'archivo')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(0, 100);
    }

    async function uploadDocumentFile(file, documentId) {
        if (!file) return null;
        if (!storageReady()) throw new Error('Firebase Storage no está disponible.');
        if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Solo se permiten archivos PDF, JPG o PNG.');
        if (file.size > MAX_FILE_SIZE) throw new Error('El archivo no puede superar los 15 MB.');

        const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin';
        const filename = `${Date.now()}_${safeName(file.name.replace(/\.[^.]+$/, ''))}.${extension}`;
        const path = `users/${S.user.uid}/documentos/${documentId}/${filename}`;
        const ref = firebase.storage().ref().child(path);

        const snapshot = await ref.put(file, {
            contentType: file.type,
            customMetadata: {
                userId: S.user.uid,
                documentoId: String(documentId)
            }
        });

        return {
            url: await snapshot.ref.getDownloadURL(),
            path,
            nombre: file.name,
            tipo: file.type,
            size: file.size
        };
    }

    async function deleteDocumentFile(archivoStorage) {
        if (!archivoStorage?.path || !storageReady()) return;
        try {
            await firebase.storage().ref().child(archivoStorage.path).delete();
        } catch (e) {
            if (e?.code !== 'storage/object-not-found') {
                console.warn('No se pudo eliminar el adjunto:', e);
            }
        }
    }

    window.uploadDocumentFile = uploadDocumentFile;
    window.deleteDocumentFile = deleteDocumentFile;
    window.DOCUMENT_MAX_FILE_SIZE = MAX_FILE_SIZE;

    // El borrado del registro desde app.js se intercepta en fase de captura
    // para eliminar también el archivo de Storage. El resto de eventos sigue
    // funcionando normalmente.
    document.addEventListener('click', async function (event) {
        const button = event.target.closest?.('[data-del-doc]');
        if (!button) return;

        const docId = button.dataset.delDoc;
        const doc = (S.documentos || []).find(d => String(d.id) === String(docId));
        if (!doc) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        if (!confirm('¿Eliminar este documento y su archivo adjunto?')) return;

        try {
            await deleteDocumentFile(doc.archivoStorage);
            S.documentos = S.documentos.filter(d => String(d.id) !== String(docId));
            await saveDocumentos(S.user?.uid);
            render();
            toast('Documento y archivo eliminado.');
        } catch (e) {
            console.error('Error eliminando documento:', e);
            toast('❌ No se pudo eliminar el documento.');
        }
    }, true);
})();
