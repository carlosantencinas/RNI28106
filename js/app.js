// ============================================================
// INICIO DE LA APLICACIÓN
// ============================================================

// Exponer funciones globales
window.openPagoFromCotizacion = openPagoFromCotizacion;
window.toggleCotSort = toggleCotSort;
window.togglePagoSort = togglePagoSort;
window.toggleExpSort = toggleExpSort;
window.clearCotFilters = clearCotFilters;
window.clearPagoFilters = clearPagoFilters;
window.clearExpFilters = clearExpFilters;
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
