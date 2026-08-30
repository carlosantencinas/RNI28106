// ============================================================
// PAGOS - Utilidades y lógica reutilizable del módulo de pagos
// ============================================================

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

function getPagoPrincipalByCotizacionId(cotizacionId) {
    return getPagosByCotizacionId(cotizacionId)
        .find(p => Number(p.monto) > 0) || null;
}

function getPagosRegistradosByCotizacionId(cotizacionId) {
    const registros = getPagosByCotizacionId(cotizacionId);
    const principal = getPagoPrincipalByCotizacionId(cotizacionId);
    if (!principal) return registros;
    return registros.filter(p => String(p.id) !== String(principal.id));
}

function normalizePagoMonto(value) {
    const monto = Number(value);
    return Number.isFinite(monto) && monto >= 0 ? monto : 0;
}

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

function getMontoTotalDeuda(cotizacion) {
    if (!cotizacion) return 0;
    return normalizePagoMonto(
        cotizacion.montoTotal ?? cotizacion.total ?? cotizacion.monto
    );
}

function getSaldoCotizacion(cotizacion) {
    if (!cotizacion) return 0;
    return Math.max(0,
        getMontoTotalDeuda(cotizacion) - getTotalPagadoByCotizacionId(cotizacion.id)
    );
}

function getEstadoPago(cotizacion) {
    const total = getMontoTotalDeuda(cotizacion);
    const pagado = getTotalPagadoByCotizacionId(cotizacion?.id);
    const saldo = Math.max(0, total - pagado);

    if (total <= 0) return 'sin_deuda';
    if (saldo <= 0) return 'pagado';
    if (pagado > 0) return 'parcial';
    return 'pendiente';
}

/** Resumen financiero de una cotización. */
function getResumenCotizacion(cotizacion) {
    const montoTotal = getMontoTotalDeuda(cotizacion);
    const totalPagado = getTotalPagadoByCotizacionId(cotizacion?.id);
    const saldoPendiente = Math.max(0, montoTotal - totalPagado);
    const porcentaje = montoTotal > 0
        ? Math.min(100, (totalPagado / montoTotal) * 100)
        : 0;

    return {
        montoTotal,
        totalPagado,
        saldoPendiente,
        porcentaje,
        estado: getEstadoPago(cotizacion),
        pagos: getPagosRegistradosByCotizacionId(cotizacion?.id)
    };
}

/** Resumen global. No modifica S.pagos ni S.cotizaciones. */
function getResumenPagos() {
    const cotizaciones = Array.isArray(S.cotizaciones) ? S.cotizaciones : [];

    let totalFacturado = 0;
    let totalCobrado = 0;
    let totalPorCobrar = 0;
    let deudasPendientes = 0;
    let deudasParciales = 0;
    let deudasPagadas = 0;

    cotizaciones.forEach(cotizacion => {
        const resumen = getResumenCotizacion(cotizacion);
        totalFacturado += resumen.montoTotal;
        totalCobrado += resumen.totalPagado;
        totalPorCobrar += resumen.saldoPendiente;

        if (resumen.estado === 'pagado') deudasPagadas++;
        else if (resumen.estado === 'parcial') deudasParciales++;
        else if (resumen.estado === 'pendiente') deudasPendientes++;
    });

    return {
        totalFacturado,
        totalCobrado,
        totalPorCobrar,
        deudasPendientes,
        deudasParciales,
        deudasPagadas
    };
}

function getPagosOrdenados(pagos = S.pagos) {
    if (!Array.isArray(pagos)) return [];
    return [...pagos].sort((a, b) => {
        const fechaA = a?.fecha ? new Date(a.fecha).getTime() : 0;
        const fechaB = b?.fecha ? new Date(b.fecha).getTime() : 0;
        return fechaB - fechaA;
    });
}
