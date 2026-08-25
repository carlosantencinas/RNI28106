// ============================================================
// FIREBASE
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
