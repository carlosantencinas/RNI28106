// ============================================================
// FIREBASE - Conexión, persistencia y carga de datos
// ============================================================

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let cloudReady = false;

const FIREBASE_CONFIG_KEY = 'hidro_firebase_config';
const FIREBASE_COLLECTION = 'users';
const DATA_COLLECTION = 'data';

// Todas las claves que se almacenan en Firebase/localStorage.
const DATA_KEYS = [
    'actividades',
    'documentos',
    'cotizaciones',
    'pagos',
    'clientes',
    'experiencia',
    'formacion',
    'cursos',
    'datosPersonales',
    'config',
    'licitaciones',
    'contactos',
    'referencias'
];

function getSavedFirebaseConfig() {
    try {
        const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn('Configuración de Firebase inválida:', e);
        return null;
    }
}

function updateFirebaseStatus(connected, message) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    if (!dot || !text) return;

    if (connected) {
        dot.className = 'dot on';
        text.textContent = message || '✅ Conectado a Firebase';
    } else {
        dot.className = 'dot off';
        text.textContent = message || '❌ No configurado';
    }
}

function getLocalStorageKey(userId, key) {
    if (!userId || !key) return null;
    return `${LS_PREFIX}${userId}_${key}`;
}

function getLocalData(userId, key) {
    const storageKey = getLocalStorageKey(userId, key);
    return storageKey ? localStorage.getItem(storageKey) : null;
}

function setLocalData(userId, key, value) {
    const storageKey = getLocalStorageKey(userId, key);
    if (!storageKey) return;

    try {
        localStorage.setItem(storageKey, value);
    } catch (e) {
        console.warn(`No se pudo guardar ${key} en localStorage:`, e);
    }
}

// ============================================================
// PERSISTENCIA
// ============================================================

/**
 * Lee un bloque de datos.
 * Firebase es la fuente principal cuando está disponible.
 * localStorage funciona como caché/respaldo cuando Firebase falla.
 */
async function cloudGet(userId, key) {
    if (!userId || !key) return null;

    if (!cloudReady || !fbDb) {
        return getLocalData(userId, key);
    }

    try {
        const snap = await fbDb
            .collection(FIREBASE_COLLECTION)
            .doc(userId)
            .collection(DATA_COLLECTION)
            .doc(key)
            .get();

        if (!snap.exists) {
            return getLocalData(userId, key);
        }

        const data = snap.data();
        const value = typeof data?.value === 'string' ? data.value : null;

        // Actualizamos el caché local con la versión confirmada por Firebase.
        if (value !== null) {
            setLocalData(userId, key, value);
        }

        return value;
    } catch (e) {
        console.warn(`Firebase: no se pudo leer "${key}". Usando caché local.`, e);
        return getLocalData(userId, key);
    }
}

/**
 * Guarda primero una copia local y luego intenta sincronizar con Firebase.
 * Se mantiene la firma existente para no romper el resto de la aplicación.
 */
async function cloudSet(userId, key, valueStr) {
    if (!userId || !key) {
        console.warn('cloudSet: falta userId o key.');
        return false;
    }

    // Guardado local inmediato: permite trabajar incluso si Firebase no responde.
    setLocalData(userId, key, valueStr);

    if (!cloudReady || !fbDb) return false;

    try {
        await fbDb
            .collection(FIREBASE_COLLECTION)
            .doc(userId)
            .collection(DATA_COLLECTION)
            .doc(key)
            .set({
                value: valueStr,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: userId
            });

        return true;
    } catch (e) {
        // La información ya quedó guardada localmente; se mantiene el comportamiento
        // tolerante a fallos de la versión anterior.
        console.warn(`Firebase: no se pudo guardar "${key}". Se conserva la copia local.`, e);
        return false;
    }
}

function getCurrentUserId(userId) {
    return userId || S.user?.uid || null;
}

// ============================================================
// FUNCIONES DE GUARDADO
// ============================================================

async function saveDataKey(userId, key, value) {
    const uid = getCurrentUserId(userId);
    if (!uid) return false;
    return cloudSet(uid, key, JSON.stringify(value));
}

async function saveDocumentos(userId) {
    return saveDataKey(userId, 'documentos', S.documentos);
}

async function saveCotizaciones(userId) {
    return saveDataKey(userId, 'cotizaciones', S.cotizaciones);
}

async function savePagos(userId) {
    return saveDataKey(userId, 'pagos', S.pagos);
}

async function saveClientes(userId) {
    return saveDataKey(userId, 'clientes', S.clientes);
}

async function saveExperiencia(userId) {
    return saveDataKey(userId, 'experiencia', S.experiencia);
}

async function saveFormacion(userId) {
    return saveDataKey(userId, 'formacion', S.formacion);
}

async function saveCursos(userId) {
    return saveDataKey(userId, 'cursos', S.cursos);
}

async function saveDatosPersonales(userId) {
    return saveDataKey(userId, 'datosPersonales', S.datosPersonales);
}

async function saveConfig(userId) {
    return saveDataKey(userId, 'config', S.config);
}

async function saveLicitaciones(userId) {
    return saveDataKey(userId, 'licitaciones', S.licitaciones);
}

async function saveContactos(userId) {
    return saveDataKey(userId, 'contactos', S.contactos);
}

async function saveReferencias(userId) {
    return saveDataKey(userId, 'referencias', S.referencias);
}

async function saveActividades(userId) {
    return saveDataKey(userId, 'actividades', S.actividades);
}

// ============================================================
// PARSEO Y CARGA DE DATOS
// ============================================================

function parseStoredData(raw, fallback = null) {
    if (raw === null || raw === undefined || raw === '') return fallback;

    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn('Datos almacenados con JSON inválido:', e);
        return fallback;
    }
}

/**
 * Carga todos los módulos en paralelo para reducir el tiempo de inicio.
 * Mantiene exactamente las mismas claves/estructuras que usa la aplicación.
 */
async function loadData(userId) {
    if (!userId) {
        console.warn('loadData: no se recibió userId.');
        return;
    }

    const results = await Promise.all(
        DATA_KEYS.map(async (key) => {
            try {
                return [key, parseStoredData(await cloudGet(userId, key))];
            } catch (e) {
                console.warn(`Error cargando ${key}:`, e);
                return [key, null];
            }
        })
    );

    const data = Object.fromEntries(results);

    // Datos que son arrays.
    const arrayKeys = [
        'actividades',
        'documentos',
        'cotizaciones',
        'pagos',
        'clientes',
        'experiencia',
        'formacion',
        'cursos',
        'licitaciones',
        'contactos'
    ];

    arrayKeys.forEach((key) => {
        S[key] = Array.isArray(data[key]) ? data[key] : null;
    });

    S.datosPersonales = data.datosPersonales && typeof data.datosPersonales === 'object'
        ? data.datosPersonales
        : null;

    S.config = data.config && typeof data.config === 'object'
        ? { ...DEFAULT_CONFIG, ...data.config }
        : { ...DEFAULT_CONFIG };

    S.referencias = Array.isArray(data.referencias) ? data.referencias : null;

    // Inicializar solamente lo que realmente no existe.
    // Se mantienen las funciones saveXXX() existentes para no alterar el resto de la app.
    const initializers = [];

    if (S.actividades === null) {
        S.actividades = [];
        initializers.push(saveActividades(userId));
    }
    if (S.documentos === null) {
        S.documentos = [];
        initializers.push(saveDocumentos(userId));
    }
    if (S.cotizaciones === null) {
        S.cotizaciones = [];
        initializers.push(saveCotizaciones(userId));
    }
    if (S.pagos === null) {
        S.pagos = [];
        initializers.push(savePagos(userId));
    }
    if (S.clientes === null) {
        S.clientes = [];
        initializers.push(saveClientes(userId));
    }
    if (S.experiencia === null) {
        S.experiencia = [];
        initializers.push(saveExperiencia(userId));
    }
    if (S.formacion === null) {
        S.formacion = [];
        initializers.push(saveFormacion(userId));
    }
    if (S.cursos === null) {
        S.cursos = [];
        initializers.push(saveCursos(userId));
    }
    if (S.licitaciones === null) {
        S.licitaciones = [];
        initializers.push(saveLicitaciones(userId));
    }
    if (S.contactos === null) {
        S.contactos = [];
        initializers.push(saveContactos(userId));
    }

    if (S.datosPersonales === null) {
        S.datosPersonales = {
            nombre: '',
            ci: '',
            lugarExpedicion: '',
            fechaNacimiento: '',
            nacionalidad: '',
            profesion: '',
            registroProfesional: ''
        };
        initializers.push(saveDatosPersonales(userId));
    }

    // Se conserva la lógica anterior: si no hay referencias, se cargan las referencias por defecto.
    if (S.referencias === null || S.referencias.length === 0) {
        S.referencias = [...DEFAULT_REFERENCIAS];
        initializers.push(saveReferencias(userId));
    }

    if (initializers.length) {
        await Promise.all(initializers);
    }

    // Mostrar el logo solo si existe el elemento y hay un logo configurado.
    if (S.config?.logo) {
        const brandStamp = document.getElementById('brand-stamp');
        if (brandStamp) {
            brandStamp.innerHTML = `<img src="${S.config.logo}" alt="logo">`;
        }
    }
}

// ============================================================
// INICIALIZAR FIREBASE
// ============================================================

async function initFirebase() {
    const cfg = getSavedFirebaseConfig();

    if (!cfg) {
        cloudReady = false;
        updateFirebaseStatus(false, '⚠️ Configura Firebase');

        const login = document.getElementById('login-container');
        const app = document.getElementById('app-container');
        if (login) login.style.display = 'flex';
        if (app) app.style.display = 'none';
        return;
    }

    try {
        // Evita intentar inicializar Firebase dos veces si initFirebase() se ejecuta nuevamente.
        fbApp = firebase.apps.length
            ? firebase.app()
            : firebase.initializeApp(cfg);

        fbAuth = firebase.auth();
        fbDb = firebase.firestore();
        cloudReady = true;

        updateFirebaseStatus(true, '✅ Conectado a Firebase');

        await fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

        fbAuth.onAuthStateChanged(async (user) => {
            S.user = user;

            const login = document.getElementById('login-container');
            const app = document.getElementById('app-container');
            const email = document.getElementById('user-email');

            if (user) {
                if (login) login.style.display = 'none';
                if (app) app.style.display = 'flex';
                if (email) email.textContent = user.email || 'usuario@email.com';

                try {
                    await loadData(user.uid);
                    render();
                } catch (e) {
                    console.error('Error cargando datos del usuario:', e);
                    showLoginError('No se pudieron cargar los datos. Verifica tu conexión e inténtalo nuevamente.');
                }
            } else {
                if (login) login.style.display = 'flex';
                if (app) app.style.display = 'none';
            }
        });
    } catch (e) {
        cloudReady = false;
        console.error('Firebase init failed:', e);
        updateFirebaseStatus(false, '❌ Error de conexión');

        const login = document.getElementById('login-container');
        const app = document.getElementById('app-container');
        if (login) login.style.display = 'flex';
        if (app) app.style.display = 'none';

        showLoginError('Error al conectar con Firebase. Verifica tu configuración.');
    }
}

function connectFirebase(configObj) {
    if (!configObj || typeof configObj !== 'object') {
        console.warn('Configuración de Firebase inválida.');
        return;
    }

    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(configObj));
    location.reload();
}

function disconnectFirebase() {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
    location.reload();
}
