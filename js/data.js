// ============================================================
// CRUD - DATOS
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

async function loadData(userId) {
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
    if (S.config.logo) {
        document.getElementById('brand-stamp').innerHTML = `<img src="${S.config.logo}" alt="logo">`;
    }
}

async function saveCotizaciones(userId) { await cloudSet(userId || S.user?.uid, 'cotizaciones', JSON.stringify(S.cotizaciones)); }
async function savePagos(userId) { await cloudSet(userId || S.user?.uid, 'pagos', JSON.stringify(S.pagos)); }
async function saveClientes(userId) { await cloudSet(userId || S.user?.uid, 'clientes', JSON.stringify(S.clientes)); }
async function saveExperiencia(userId) { await cloudSet(userId || S.user?.uid, 'experiencia', JSON.stringify(S.experiencia)); }
async function saveFormacion(userId) { await cloudSet(userId || S.user?.uid, 'formacion', JSON.stringify(S.formacion)); }
async function saveCursos(userId) { await cloudSet(userId || S.user?.uid, 'cursos', JSON.stringify(S.cursos)); }
async function saveDatosPersonales(userId) { await cloudSet(userId || S.user?.uid, 'datosPersonales', JSON.stringify(S.datosPersonales)); }
async function saveConfig(userId) { await cloudSet(userId || S.user?.uid, 'config', JSON.stringify(S.config)); }
