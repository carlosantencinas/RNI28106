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
const DOCUMENTS_COLLECTION = 'documents';

const DATA_KEYS = [
    'actividades', 'documentos', 'cotizaciones', 'pagos', 'clientes',
    'experiencia', 'formacion', 'cursos', 'datosPersonales', 'config',
    'licitaciones', 'contactos', 'referencias', 'gastos'
];

function getSavedFirebaseConfig() {
    try { const raw = localStorage.getItem(FIREBASE_CONFIG_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { console.warn('Configuración de Firebase inválida:', e); return null; }
}
function updateFirebaseStatus(connected, message) {
    const dot=document.getElementById('status-dot'), text=document.getElementById('status-text'); if(!dot||!text)return;
    dot.className=connected?'dot on':'dot off'; text.textContent=message||(connected?'✅ Conectado a Firebase':'❌ No configurado');
}
function getLocalStorageKey(userId,key){return userId&&key?`${LS_PREFIX}${userId}_${key}`:null;}
function getLocalData(userId,key){const k=getLocalStorageKey(userId,key);return k?localStorage.getItem(k):null;}
function setLocalData(userId,key,value){const k=getLocalStorageKey(userId,key);if(!k)return;try{localStorage.setItem(k,value);}catch(e){console.warn(`No se pudo guardar ${key} en localStorage:`,e);}}

async function cloudGet(userId,key){
    if(!userId||!key)return null;
    if(!cloudReady||!fbDb)return getLocalData(userId,key);
    try{const snap=await fbDb.collection(FIREBASE_COLLECTION).doc(userId).collection(DATA_COLLECTION).doc(key).get();if(!snap.exists)return getLocalData(userId,key);const data=snap.data();const value=typeof data?.value==='string'?data.value:null;if(value!==null)setLocalData(userId,key,value);return value;}
    catch(e){console.warn(`Firebase: no se pudo leer "${key}". Usando caché local.`,e);return getLocalData(userId,key);}
}
async function cloudSet(userId,key,valueStr){
    if(!userId||!key){console.warn('cloudSet: falta userId o key.');return false;}
    setLocalData(userId,key,valueStr);if(!cloudReady||!fbDb)return false;
    try{await fbDb.collection(FIREBASE_COLLECTION).doc(userId).collection(DATA_COLLECTION).doc(key).set({value:valueStr,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),userId});return true;}
    catch(e){console.warn(`Firebase: no se pudo guardar "${key}". Se conserva la copia local.`,e);return false;}
}
function getCurrentUserId(userId){return userId||S.user?.uid||null;}

function documentsCollection(userId){return fbDb.collection(FIREBASE_COLLECTION).doc(userId).collection(DOCUMENTS_COLLECTION);}
async function loadDocuments(userId){
    if(!userId)return [];
    if(!cloudReady||!fbDb)return parseStoredData(getLocalData(userId,'documentos'),[]);
    try{const snap=await documentsCollection(userId).get();if(snap.size>0){const docs=snap.docs.map(doc=>({id:doc.id,...doc.data()}));setLocalData(userId,'documentos',JSON.stringify(docs));return docs;}const legacyRaw=await cloudGet(userId,'documentos');const legacy=parseStoredData(legacyRaw,[]);if(Array.isArray(legacy)&&legacy.length){const migrated=await migrateLegacyDocuments(userId,legacy);if(migrated)return legacy;}return [];}catch(e){console.warn('Firebase: no se pudieron cargar los documentos. Usando caché local.',e);return parseStoredData(getLocalData(userId,'documentos'),[]);}
}
async function migrateLegacyDocuments(userId,documents){if(!cloudReady||!fbDb||!Array.isArray(documents))return false;try{const batch=fbDb.batch();documents.forEach(d=>{if(!d||!d.id)return;batch.set(documentsCollection(userId).doc(String(d.id)),{...d,migratedAt:firebase.firestore.FieldValue.serverTimestamp()});});await batch.commit();return true;}catch(e){console.warn('Firebase: no se pudo migrar documentos antiguos.',e);return false;}}
async function saveDocumentos(userId){const uid=getCurrentUserId(userId);if(!uid)return false;const documents=Array.isArray(S.documentos)?S.documentos:[];setLocalData(uid,'documentos',JSON.stringify(documents));if(!cloudReady||!fbDb)return false;try{const existingSnap=await documentsCollection(uid).get();const currentIds=new Set(documents.map(d=>String(d.id)));const batch=fbDb.batch();existingSnap.docs.forEach(doc=>{if(!currentIds.has(doc.id))batch.delete(doc.ref);});documents.forEach(d=>{if(!d||!d.id)return;batch.set(documentsCollection(uid).doc(String(d.id)),{...d,userId:uid,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});});await batch.commit();return true;}catch(e){console.warn('Firebase: no se pudieron guardar los documentos. Se conserva la copia local.',e);return false;}}

// ============================================================
// FUNCIONES DE GUARDADO
// ============================================================
async function saveDataKey(userId,key,value){const uid=getCurrentUserId(userId);if(!uid)return false;return cloudSet(uid,key,JSON.stringify(value));}
async function saveCotizaciones(userId){return saveDataKey(userId,'cotizaciones',S.cotizaciones);}
async function savePagos(userId){return saveDataKey(userId,'pagos',S.pagos);}
async function saveClientes(userId){return saveDataKey(userId,'clientes',S.clientes);}
async function saveExperiencia(userId){return saveDataKey(userId,'experiencia',S.experiencia);}
async function saveFormacion(userId){return saveDataKey(userId,'formacion',S.formacion);}
async function saveCursos(userId){return saveDataKey(userId,'cursos',S.cursos);}
async function saveDatosPersonales(userId){return saveDataKey(userId,'datosPersonales',S.datosPersonales);}
async function saveConfig(userId){return saveDataKey(userId,'config',S.config);}
async function saveLicitaciones(userId){return saveDataKey(userId,'licitaciones',S.licitaciones);}
async function saveContactos(userId){return saveDataKey(userId,'contactos',S.contactos);}
async function saveReferencias(userId){return saveDataKey(userId,'referencias',S.referencias);}
async function saveActividades(userId){return saveDataKey(userId,'actividades',S.actividades);}
async function saveGastos(userId){return saveDataKey(userId,'gastos',S.gastos);}

function parseStoredData(raw,fallback=null){if(raw===null||raw===undefined||raw==='')return fallback;try{return JSON.parse(raw);}catch(e){console.warn('Datos almacenados con JSON inválido:',e);return fallback;}}

async function loadData(userId){
    if(!userId){console.warn('loadData: no se recibió userId.');return;}
    const regularKeys=DATA_KEYS.filter(key=>key!=='documentos');
    const results=await Promise.all(regularKeys.map(async key=>{try{return [key,parseStoredData(await cloudGet(userId,key))];}catch(e){console.warn(`Error cargando ${key}:`,e);return [key,null];}}));
    const data=Object.fromEntries(results); data.documentos=await loadDocuments(userId);
    const arrayKeys=['actividades','documentos','cotizaciones','pagos','clientes','experiencia','formacion','cursos','licitaciones','contactos','gastos'];
    arrayKeys.forEach(key=>{S[key]=Array.isArray(data[key])?data[key]:null;});
    S.datosPersonales=data.datosPersonales&&typeof data.datosPersonales==='object'?data.datosPersonales:null;
    S.config=data.config&&typeof data.config==='object'?{...DEFAULT_CONFIG,...data.config}:{...DEFAULT_CONFIG};
    S.referencias=Array.isArray(data.referencias)?data.referencias:null;
    const initializers=[];
    if(S.actividades===null){S.actividades=[];initializers.push(saveActividades(userId));}
    if(S.documentos===null)S.documentos=[];
    if(S.cotizaciones===null){S.cotizaciones=[];initializers.push(saveCotizaciones(userId));}
    if(S.pagos===null){S.pagos=[];initializers.push(savePagos(userId));}
    if(S.clientes===null){S.clientes=[];initializers.push(saveClientes(userId));}
    if(S.experiencia===null){S.experiencia=[];initializers.push(saveExperiencia(userId));}
    if(S.formacion===null){S.formacion=[];initializers.push(saveFormacion(userId));}
    if(S.cursos===null){S.cursos=[];initializers.push(saveCursos(userId));}
    if(S.licitaciones===null){S.licitaciones=[];initializers.push(saveLicitaciones(userId));}
    if(S.contactos===null){S.contactos=[];initializers.push(saveContactos(userId));}
    if(S.gastos===null){S.gastos=[];initializers.push(saveGastos(userId));}
    if(S.datosPersonales===null){S.datosPersonales={nombre:'',ci:'',lugarExpedicion:'',fechaNacimiento:'',nacionalidad:'',profesion:'',registroProfesional:''};initializers.push(saveDatosPersonales(userId));}
    if(S.referencias===null||S.referencias.length===0){S.referencias=[...DEFAULT_REFERENCIAS];initializers.push(saveReferencias(userId));}
    if(initializers.length)await Promise.all(initializers);
    if(S.config?.logo){const brandStamp=document.getElementById('brand-stamp');if(brandStamp)brandStamp.innerHTML=`<img src="${S.config.logo}" alt="logo">`;}
}

async function initFirebase(){
    const cfg=getSavedFirebaseConfig();
    if(typeof firebase==='undefined'&&window.HidroLoader&&typeof window.HidroLoader.loadFirebase==='function'){try{await window.HidroLoader.loadFirebase();}catch(e){console.warn('Error cargando libs de Firebase:',e);}}
    if(!cfg){cloudReady=false;updateFirebaseStatus(false,'⚠️ Configura Firebase');const login=document.getElementById('login-container'),app=document.getElementById('app-container');if(login)login.style.display='flex';if(app)app.style.display='none';return;}
    try{fbApp=firebase.apps.length?firebase.app():firebase.initializeApp(cfg);fbAuth=firebase.auth();fbDb=firebase.firestore();
