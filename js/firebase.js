// ============================================================
// FIREBASE - Conexión y CRUD
// ============================================================

let fbApp = null;
let fbAuth = null;
let fbDb = null;
let cloudReady = false;

function getSavedFirebaseConfig() {
    try {
        const raw = localStorage.getItem('hidro_firebase_config');
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function updateFirebaseStatus(connected, message) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (connected) {
        dot.className = 'dot on';
        text.textContent = message || '✅ Conectado a Firebase';
    } else {
        dot.className = 'dot off';
        text.textContent = message || '❌ No configurado';
    }
}

// ============================================================
// CRUD - Funciones de guardado
// ============================================================

async function cloudGet(userId, key) {
    if (!cloudReady || !fbDb) return localStorage.getItem(LS_PREFIX + userId + '_' + key);
    try {
        const snap = await fbDb.collection('users').doc(userId).collection('data').doc(key).get();
        return snap.exists ? snap.data().value : null;
    } catch (e) {
        return localStorage.getItem(LS_PREFIX + userId + '_' + key);
    }
}

async function cloudSet(userId, key, valueStr) {
    localStorage.setItem(LS_PREFIX + userId + '_' + key, valueStr);
    if (!cloudReady || !fbDb || !userId) return;
    try {
        await fbDb.collection('users').doc(userId).collection('data').doc(key).set({
            value: valueStr,
            updatedAt: Date.now(),
            userId: userId
        });
    } catch (e) {
        console.warn('Error guardando en Firebase:', e);
    }
}

// ============================================================
// FUNCIONES DE GUARDADO (definidas ANTES de loadData)
// ============================================================
// En firebase.js, agregar:
async function saveDocumentos(userId) { 
    await cloudSet(userId || S.user?.uid, 'documentos', JSON.stringify(S.documentos)); 
}

async function saveCotizaciones(userId) { 
    await cloudSet(userId || S.user?.uid, 'cotizaciones', JSON.stringify(S.cotizaciones)); 
}

async function savePagos(userId) { 
    await cloudSet(userId || S.user?.uid, 'pagos', JSON.stringify(S.pagos)); 
}

async function saveClientes(userId) { 
    await cloudSet(userId || S.user?.uid, 'clientes', JSON.stringify(S.clientes)); 
}

async function saveExperiencia(userId) { 
    await cloudSet(userId || S.user?.uid, 'experiencia', JSON.stringify(S.experiencia)); 
}

async function saveFormacion(userId) { 
    await cloudSet(userId || S.user?.uid, 'formacion', JSON.stringify(S.formacion)); 
}

async function saveCursos(userId) { 
    await cloudSet(userId || S.user?.uid, 'cursos', JSON.stringify(S.cursos)); 
}

async function saveDatosPersonales(userId) { 
    await cloudSet(userId || S.user?.uid, 'datosPersonales', JSON.stringify(S.datosPersonales)); 
}

async function saveConfig(userId) { 
    await cloudSet(userId || S.user?.uid, 'config', JSON.stringify(S.config)); 
}

async function saveLicitaciones(userId) { 
    await cloudSet(userId || S.user?.uid, 'licitaciones', JSON.stringify(S.licitaciones)); 
}

async function saveContactos(userId) { 
    await cloudSet(userId || S.user?.uid, 'contactos', JSON.stringify(S.contactos)); 
}

async function saveReferencias(userId) { 
    await cloudSet(userId || S.user?.uid, 'referencias', JSON.stringify(S.referencias)); 
}

async function saveActividades(userId) { 
    await cloudSet(userId || S.user?.uid, 'actividades', JSON.stringify(S.actividades)); 
}

// ============================================================
// FUNCIÓN LOAD DATA
// ============================================================

async function loadData(userId) {
    try {
    const a = await cloudGet(userId, 'actividades');
    S.actividades = a ? JSON.parse(a) : null;
} catch (e) { S.actividades = null; }

    try {
    const d = await cloudGet(userId, 'documentos');
    S.documentos = d ? JSON.parse(d) : null;
} catch (e) { S.documentos = null; }


    try {
        const c = await cloudGet(userId, 'cotizaciones');
        S.cotizaciones = c ? JSON.parse(c) : null;
    } catch (e) { S.cotizaciones = null; }
    
    try {
        const p = await cloudGet(userId, 'pagos');
        S.pagos = p ? JSON.parse(p) : null;
    } catch (e) { S.pagos = null; }
    
    try {
        const cl = await cloudGet(userId, 'clientes');
        S.clientes = cl ? JSON.parse(cl) : null;
    } catch (e) { S.clientes = null; }
    
    try {
        const e = await cloudGet(userId, 'experiencia');
        S.experiencia = e ? JSON.parse(e) : null;
    } catch (e) { S.experiencia = null; }
    
    try {
        const f = await cloudGet(userId, 'formacion');
        S.formacion = f ? JSON.parse(f) : null;
    } catch (e) { S.formacion = null; }
    
    try {
        const cu = await cloudGet(userId, 'cursos');
        S.cursos = cu ? JSON.parse(cu) : null;
    } catch (e) { S.cursos = null; }
    
    try {
        const dp = await cloudGet(userId, 'datosPersonales');
        S.datosPersonales = dp ? JSON.parse(dp) : null;
    } catch (e) { S.datosPersonales = null; }
    
    try {
        const cfg = await cloudGet(userId, 'config');
        if (cfg) S.config = { ...DEFAULT_CONFIG, ...JSON.parse(cfg) };
    } catch (e) {}
    
    try {
        const l = await cloudGet(userId, 'licitaciones');
        S.licitaciones = l ? JSON.parse(l) : null;
    } catch (e) { S.licitaciones = null; }
    
    try {
        const co = await cloudGet(userId, 'contactos');
        S.contactos = co ? JSON.parse(co) : null;
    } catch (e) { S.contactos = null; }
    
    try {
        const refs = await cloudGet(userId, 'referencias');
        if (refs) S.referencias = JSON.parse(refs);
    } catch (e) { S.referencias = null; }

    // Inicializar arrays vacíos si es necesario
    // Inicializar:
if (S.actividades === null) { S.actividades = []; await saveActividades(userId); }
    if (S.cotizaciones === null) { S.cotizaciones = []; await saveCotizaciones(userId); }
    if (S.pagos === null) { S.pagos = []; await savePagos(userId); }
    if (S.clientes === null) { S.clientes = []; await saveClientes(userId); }
    if (S.experiencia === null) { S.experiencia = []; await saveExperiencia(userId); }
    if (S.formacion === null) { S.formacion = []; await saveFormacion(userId); }
    if (S.cursos === null) { S.cursos = []; await saveCursos(userId); }
    if (S.datosPersonales === null) {
        S.datosPersonales = { nombre: '', ci: '', lugarExpedicion: '', fechaNacimiento: '', nacionalidad: '', profesion: '', registroProfesional: '' };
        await saveDatosPersonales(userId);
    }
    if (S.licitaciones === null) { S.licitaciones = []; await saveLicitaciones(userId); }
    if (S.contactos === null) { S.contactos = []; await saveContactos(userId); }
    if (S.referencias === null || S.referencias.length === 0) {
        S.referencias = [...DEFAULT_REFERENCIAS];
        await saveReferencias(userId);
    }
    if (S.documentos === null) { S.documentos = []; await saveDocumentos(userId); }

    if (S.config.logo) {
        document.getElementById('brand-stamp').innerHTML = `<img src="${S.config.logo}" alt="logo">`;
    }
}

// ============================================================
// INICIALIZAR FIREBASE
// ============================================================

async function initFirebase() {
    const cfg = getSavedFirebaseConfig();
    if (!cfg) {
        updateFirebaseStatus(false, '⚠️ Configura Firebase');
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
        return;
    }
    try {
        fbApp = firebase.initializeApp(cfg);
        fbAuth = firebase.auth();
        fbDb = firebase.firestore();
        cloudReady = true;
        updateFirebaseStatus(true, '✅ Conectado a Firebase');

        await fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        fbAuth.onAuthStateChanged(async (user) => {
            S.user = user;
            if (user) {
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('app-container').style.display = 'flex';
                document.getElementById('user-email').textContent = user.email || 'usuario@email.com';
                await loadData(user.uid);
                render();
            } else {
                document.getElementById('login-container').style.display = 'flex';
                document.getElementById('app-container').style.display = 'none';
            }
        });
    } catch (e) {
        console.error('Firebase init failed', e);
        updateFirebaseStatus(false, '❌ Error: ' + e.message);
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
        showLoginError('Error al conectar con Firebase. Verifica tu configuración.');
    }
}

function connectFirebase(configObj) {
    localStorage.setItem('hidro_firebase_config', JSON.stringify(configObj));
    location.reload();
}

function disconnectFirebase() {
    localStorage.removeItem('hidro_firebase_config');
    location.reload();
}
