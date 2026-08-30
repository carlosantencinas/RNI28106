// ============================================================
// PAGOS - Utilidades y lógica reutilizable del módulo de pagos
// ============================================================
// Incorporación incremental. Las funciones actuales de app.js
// siguen siendo la API de la interfaz.

/** Busca un registro de pago por ID. */
function findPagoById(pagoId) {
    if (!pagoId || !Array.isArray(S.pagos)) return null;
    return S.pagos.find(p => String(p.id) === String(pagoId)) || null;
}

/** Busca el índice de un registro de pago por ID. */
function findPagoIndexById(pagoId) {
    if (!pagoId || !Array.isArray(S.pagos)) return -1;
    return S.pagos.findIndex(p => String(p.id) === String(pagoId));
}

/** Devuelve todos los registros asociados a una cotización/deuda. */
function getPagosByCotizacionId(cotizacionId) {
    if (!cotizacionId || !Array.isArray(S.pagos)) return [];
    return S.pagos.filter(p => String(p.cotizacionId) === String(cotizacionId));
}

/**
 * Identifica el registro principal de una deuda.
 * En el modelo actual es el registro asociado a la cotización
 * que contiene un monto total (> 0).
 */
function getPagoPrincipalByCotizacionId(cotizacionId) {
    return getPagosByCotizacionId(cotizacionId)
        .find(p => Number(p.monto) > 0) || null;
}

/**
 * Devuelve únicamente los movimientos de pago registrados.
 * Excluye el registro principal para evitar doble contabilización.
 */
function getPagosRegistradosByCotizacionId(cotizacionId) {
    const registros = getPagosByCotizacionId(cotizacionId);
    const principal = getPagoPrincipalByCotizacionId(cotizacionId);

    if (!principal) return registros;
    return registros.filter(p => String(p.id) !== String(principal.id));
}

/**
 * Calcula el total realmente cobrado.
 *
 * Regla actual:
 * - Si existen movimientos registrados, suma sus montoPagado.
 * - Si no existen movimientos registrados, conserva el montoPagado
 *   del registro principal como compatibilidad con datos antiguos.
 */
function getTotalPagadoByCotizacionId(cotizacionId) {
    const principal = getPagoPrincipalByCotizacionId(cotizacionId);
    const registrados = getPagosRegistradosByCotizacionId(cotizacionId);

    if (registrados.length > 0) {
        return registrados.reduce(
            (total, pago) => total + normalizePagoMonto(pago.montoPagado),
            0
        );
    }

    return principal ? normalizePagoMonto(principal.montoPagado) : 0;
}

/** Obtiene el monto total de una deuda/cotización. */
function getMontoTotalDeuda(cotizacion) {
    if (!cotizacion) return 0;

    // Compatibilidad con ambos nombres utilizados por la aplicación.
    return normalizePagoMonto(
        cotizacion.montoTotal ?? cotizacion.total ?? cotizacion.monto
    );
}

/** Calcula el saldo pendiente sin modificar el estado. */
function getSaldoCotizacion(cotizacion) {
    if (!cotizacion) return 0;

    const total = getMontoTotalDeuda(cotizacion);
    const pagado = getTotalPagadoByCotizacionId(cotizacion.id);

    return Math.max(0, total - pagado);
}

/** Devuelve el estado financiero de una deuda. */
function getEstadoPago(cotizacion) {
    const total = getMontoTotalDeuda(cotizacion);
    const pagado = getTotalPagadoByCotizacionId(cotizacion?.id);
    const saldo = Math.max(0, total - pagado);

    if (total <= 0) return 'sin_deuda';
    if (saldo <= 0) return 'pagado';
    if (pagado > 0) return 'parcial';
    return 'pendiente';
}

/** Devuelve una copia de los pagos ordenada por fecha descendente. */
function getPagosOrdenados(pagos = S.pagos) {
    if (!Array.isArray(pagos)) return [];

    return [...pagos].sort((a, b) => {
        const fechaA = a?.fecha ? new Date(a.fecha).getTime() : 0;
        const fechaB = b?.fecha ? new Date(b.fecha).getTime() : 0;
        return fechaB - fechaA;
    });
}

/** Normaliza un monto para operaciones de pago. */
function normalizePagoMonto(value) {
    const monto = Number(value);
    return Number.isFinite(monto) && monto >= 0 ? monto : 0;
}
