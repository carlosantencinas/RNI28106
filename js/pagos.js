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

    // Si Administrativo creó el registro de deuda asociado a esta
    // cotización, el monto del registro de pago es la fuente financiera
    // principal. Así se mantiene sincronizado el Centro Financiero con
    // la deuda que realmente aparece en Administrativo.
    const principal = getPagoPrincipalByCotizacionId(cotizacion.id);
    if (principal && Number(principal.monto) > 0) {
        return normalizePagoMonto(principal.monto);
    }

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

/**
 * Cartera financiera unificada.
 * Incluye cotizaciones y deudas creadas directamente desde Administrativo.
 * Una deuda vinculada a una cotización se contabiliza una sola vez.
 */
function getCarteraFinanciera() {
    const cotizaciones = Array.isArray(S.cotizaciones) ? S.cotizaciones : [];
    const pagos = Array.isArray(S.pagos) ? S.pagos : [];
    const cotizacionIds = new Set(cotizaciones.map(c => String(c?.id)));
    const rows = [];

    cotizaciones.forEach(cotizacion => {
        const resumen = getResumenCotizacion(cotizacion);
        if (resumen.montoTotal <= 0 || resumen.saldoPendiente <= 0.01) return;
        const principal = getPagoPrincipalByCotizacionId(cotizacion.id);
        rows.push({
            ...cotizacion,
            ...resumen,
            origen: principal ? 'pago-administrativo' : 'cotizacion',
            pagoPrincipalId: principal?.id || null
        });
    });

    // Deudas de Administrativo sin cotización equivalente.
    pagos.filter(p => Number(p?.monto) > 0).forEach(p => {
        const cotizacionId = p?.cotizacionId;
        if (cotizacionId && cotizacionIds.has(String(cotizacionId))) return;

        const montoTotal = normalizePagoMonto(p.monto);
        const totalPagado = normalizePagoMonto(p.montoPagado);
        const saldoPendiente = Math.max(0, montoTotal - totalPagado);
        if (saldoPendiente <= 0.01) return;

        rows.push({
            ...p,
            id: p.cotizacionId || `pago-${p.id}`,
            cliente: p.cliente || p.entidad || '',
            titulo: p.descripcion || p.concepto || p.nombre || 'Pago por cobrar',
            proyecto: p.proyecto || '',
            fecha: p.fecha || p.fechaCreacion || '',
            montoTotal,
            totalPagado,
            saldoPendiente,
            porcentaje: montoTotal > 0 ? Math.min(100, (totalPagado / montoTotal) * 100) : 0,
            estado: totalPagado > 0 ? 'parcial' : 'pendiente',
            pagos: getPagosRegistradosByCotizacionId(cotizacionId),
            origen: 'pago'
        });
    });

    return rows.sort((a, b) => Number(b.saldoPendiente || 0) - Number(a.saldoPendiente || 0));
}

/** Resumen global. No modifica S.pagos ni S.cotizaciones. */
function getResumenPagos() {
    const cotizaciones = Array.isArray(S.cotizaciones) ? S.cotizaciones : [];
    const pagos = Array.isArray(S.pagos) ? S.pagos : [];
    const cotizacionIds = new Set(cotizaciones.map(c => String(c?.id)));

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

        if (resumen.saldoPendiente > 0.01) {
            totalPorCobrar += resumen.saldoPendiente;
            if (resumen.estado === 'parcial') deudasParciales++;
            else if (resumen.estado === 'pendiente') deudasPendientes++;
        } else if (resumen.montoTotal > 0) {
            deudasPagadas++;
        }
    });

    // Deudas de Administrativo que no tienen cotización equivalente.
    pagos.filter(p => Number(p?.monto) > 0).forEach(p => {
        const cotizacionId = p?.cotizacionId;
        if (cotizacionId && cotizacionIds.has(String(cotizacionId))) return;

        const monto = normalizePagoMonto(p.monto);
        const pagado = normalizePagoMonto(p.montoPagado);
        const saldo = Math.max(0, monto - pagado);
        totalFacturado += monto;
        totalCobrado += pagado;

        if (saldo > 0.01) {
            totalPorCobrar += saldo;
            if (pagado > 0) deudasParciales++;
            else deudasPendientes++;
        } else if (monto > 0) {
            deudasPagadas++;
        }
    });

    return {
        totalFacturado,
        totalCobrado,
        totalPorCobrar,
        deudasPendientes,
        deudasParciales,
        deudasPagadas,
        cartera: getCarteraFinanciera()
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