// ============================================================
// AUTENTICACIÓN
// ============================================================

async function login(email, password) {
    try {
        await fbAuth.signInWithEmailAndPassword(email, password);
        hideLoginError();
        return true;
    } catch (e) {
        let msg = e.message;
        if (e.code === 'auth/user-not-found') msg = '❌ No existe una cuenta con este correo.';
        else if (e.code === 'auth/wrong-password') msg = '❌ Contraseña incorrecta.';
        else if (e.code === 'auth/invalid-credential') msg = '❌ Credenciales inválidas. Verifica tus datos.';
        else if (e.code === 'auth/too-many-requests') msg = '⏳ Demasiados intentos fallidos. Espera un momento.';
        else if (e.code === 'auth/network-request-failed') msg = '🌐 Error de red. Verifica tu conexión.';
        showLoginError(msg);
        return false;
    }
}

async function register(email, password) {
    try {
        await fbAuth.createUserWithEmailAndPassword(email, password);
        hideLoginError();
        return true;
    } catch (e) {
        let msg = e.message;
        if (e.code === 'auth/email-already-in-use') msg = '📧 Este correo ya está registrado.';
        else if (e.code === 'auth/weak-password') msg = '🔑 La contraseña es demasiado débil. Usa al menos 6 caracteres.';
        else if (e.code === 'auth/invalid-email') msg = '📧 Correo electrónico inválido.';
        showLoginError(msg);
        return false;
    }
}

async function resetPassword(email) {
    try {
        await fbAuth.sendPasswordResetEmail(email);
        hideLoginError();
        toast('📧 Se envió un correo de recuperación a ' + email);
        return true;
    } catch (e) {
        let msg = e.message;
        if (e.code === 'auth/user-not-found') msg = 'No existe una cuenta con este correo.';
        else if (e.code === 'auth/invalid-email') msg = 'Correo electrónico inválido.';
        showLoginError(msg);
        return false;
    }
}

async function logout() {
    await fbAuth.signOut();
    S.user = null;
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.add('show');
}

function hideLoginError() {
    document.getElementById('login-error').classList.remove('show');
}
