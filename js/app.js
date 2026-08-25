// ============================================================
// INICIO DE LA APLICACIÓN
// ============================================================

// Exponer funciones globales
window.openPagoFromCotizacion = openPagoFromCotizacion;
window.toggleCotSort = toggleCotSort;
window.togglePagoSort = togglePagoSort;
window.toggleExpSort = toggleExpSort;
window.toggleLicSort = toggleLicSort;
window.toggleContSort = toggleContSort;
window.clearCotFilters = clearCotFilters;
window.clearPagoFilters = clearPagoFilters;
window.clearExpFilters = clearExpFilters;
window.clearLicFilters = clearLicFilters;
window.clearContFilters = clearContFilters;
window.calcularEdad = calcularEdad;

// Cargar configuración guardada
const savedConfig = getSavedFirebaseConfig();
if (savedConfig) {
    document.getElementById('firebase-config-input').value = JSON.stringify(savedConfig, null, 2);
    updateFirebaseStatus(true, '✅ Configuración guardada');
}

// Inicializar
initLoginEvents();
initFirebase();

// ============================================================
// LOGIN EVENTS
// ============================================================
function initLoginEvents() {
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!cloudReady) {
            showLoginError('⚠️ Primero conecta Firebase en la sección "Configurar Firebase"');
            return;
        }
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (!email || !password) {
            showLoginError('Completa todos los campos.');
            return;
        }
        const btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.textContent = 'Iniciando sesión...';
        try { await login(email, password); } finally { btn.disabled = false;
            btn.textContent = 'Iniciar sesión'; }
    });

    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!cloudReady) {
            showLoginError('⚠️ Primero conecta Firebase en la sección "Configurar Firebase"');
            return;
        }
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        if (!email || !password) { showLoginError('Completa todos los campos.'); return; }
        if (password.length < 6) { showLoginError('La contraseña debe tener al menos 6 caracteres.'); return; }
        const btn = document.getElementById('btn-register');
        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';
        try { await register(email, password); } finally { btn.disabled = false;
            btn.textContent = 'Crear cuenta'; }
    });

    document.getElementById('reset-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!cloudReady) {
            showLoginError('⚠️ Primero conecta Firebase en la sección "Configurar Firebase"');
            return;
        }
        const email = document.getElementById('reset-email').value.trim();
        if (!email) { showLoginError('Ingresa tu correo electrónico.'); return; }
        const btn = document.getElementById('btn-reset');
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        try { await resetPassword(email); } finally { btn.disabled = false;
            btn.textContent = 'Enviar correo de recuperación'; }
    });

    document.getElementById('goto-register').onclick = () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('reset-form').style.display = 'none';
        hideLoginError();
    };
    document.getElementById('goto-login').onclick = () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('reset-form').style.display = 'none';
        hideLoginError();
    };
    document.getElementById('goto-login-reset').onclick = () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('reset-form').style.display = 'none';
        hideLoginError();
    };
    document.getElementById('goto-reset').onclick = () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('reset-form').style.display = 'block';
        hideLoginError();
    };

    document.getElementById('btn-connect-firebase').onclick = () => {
        const input = document.getElementById('firebase-config-input');
        try {
            const cfg = JSON.parse(input.value);
            connectFirebase(cfg);
        } catch (e) {
            showLoginError('❌ JSON inválido. Verifica la configuración.');
        }
    };

    document.getElementById('btn-disconnect-firebase').onclick = () => {
        if (confirm('¿Desconectar Firebase? Perderás la conexión con la nube.')) {
            disconnectFirebase();
        }
    };
}
