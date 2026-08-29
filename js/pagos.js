// ============================================================
// PAGOS - Utilidades y lógica reutilizable del módulo de pagos
// ============================================================
// Incorporación incremental. Las funciones actuales de app.js
// siguen siendo la API de la interfaz.

function findPagoById(pagoId) {
    if (!pagoId || !Array.isArray(S.pagos)) return null;
    return S.pagos.find(p => String(p.id) === String(pagoId)) || null;
}

function findPagoIndexById(pagoId) {
    if (!pagoId || !Array.isArray(S.pagos)) return -1;
    return S.pagos.findIndex(p => String(p.id) === String(pagoId));
}

function getPagosByCotizacionId(cotizacionId) {
    if (!cotizacionId || !Array.isArray(S.pagos)) return [];
    return S.pagos.filter(p => String(p.cotizacionId) === String(cotizacionId));
}

function getTotalPagadoByCotizacionId(cotizacionId) {
    return getPagosByCotizacionId(cotizacionId)
        .reduce((total, pago) => total + (Number(pago.monto) || 0), 0);
}

function getSaldoCotizacion(cotizacion) {
    if (!cotizacion) return 0;
    const total = Number(cotizacion.total) || 0;
    const pagado = getTotalPagadoByCotizacionId(cotizacion.id);
    return Math.max(0, total - pagado);
}

function getPagosOrdenados(pagos = S.pagos) {
    if (!Array.isArray(pagos)) return [];
    return [...pagos].sort((a, b) => {
        const fechaA = a?.fecha ? new Date(a.fecha).getTime() : 0;
        const fechaB = b?.fecha ? new Date(b.fecha).getTime() : 0;
        return fechaB - fechaA;
    });
}

function normalizePagoMonto(value) {
    const monto = Number(value);
    return Number.isFinite(monto) && monto >= 0 ? monto : 0;
}
