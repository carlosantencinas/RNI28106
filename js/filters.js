// ============================================================
// FILTROS Y ORDENAMIENTO
// ============================================================

// ---- COTIZACIONES ----
function applyCotFiltersAndSort(data) {
    let result = [...data];
    if (S.cotFilters.fecha) {
        result = result.filter(c => c.fecha && c.fecha.includes(S.cotFilters.fecha));
    }
    if (S.cotFilters.cliente) {
        const filter = S.cotFilters.cliente.toLowerCase().trim();
        result = result.filter(c => c.cliente && c.cliente.toLowerCase().includes(filter));
    }
    if (S.cotFilters.estado) {
        result = result.filter(c => c.estado === S.cotFilters.estado);
    }
    if (S.cotSort.column) {
        result.sort((a, b) => {
            let valA = a[S.cotSort.column] || '';
            let valB = b[S.cotSort.column] || '';
            if (S.cotSort.column === 'total') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            }
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return S.cotSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return S.cotSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
}

function toggleCotSort(column) {
    if (S.cotSort.column === column) {
        S.cotSort.direction = S.cotSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        S.cotSort.column = column;
        S.cotSort.direction = 'asc';
    }
    render();
}

function clearCotFilters() {
    S.cotFilters = { fecha: '', cliente: '', estado: '' };
    S.cotSort = { column: null, direction: 'asc' };
    document.querySelectorAll('.cot-filter-bar input, .cot-filter-bar select').forEach(el => {
        if (el.tagName === 'SELECT') el.value = '';
        else if (el.type === 'text' || el.type === 'date') el.value = '';
    });
    render();
}

// ---- PAGOS ----
function applyPagoFiltersAndSort(data) {
    let result = [...data];
    if (S.pagoFilters.fecha) {
        result = result.filter(p => p.fecha && p.fecha.includes(S.pagoFilters.fecha));
    }
    if (S.pagoFilters.cliente) {
        const filter = S.pagoFilters.cliente.toLowerCase().trim();
        result = result.filter(p => p.cliente && p.cliente.toLowerCase().includes(filter));
    }
    if (S.pagoFilters.estado) {
        result = result.filter(p => pagoEstado(p) === S.pagoFilters.estado);
    }
    if (S.pagoSort.column) {
        result.sort((a, b) => {
            let valA = a[S.pagoSort.column] || '';
            let valB = b[S.pagoSort.column] || '';
            if (S.pagoSort.column === 'monto' || S.pagoSort.column === 'montoPagado') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            }
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return S.pagoSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return S.pagoSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
}

function togglePagoSort(column) {
    if (S.pagoSort.column === column) {
        S.pagoSort.direction = S.pagoSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        S.pagoSort.column = column;
        S.pagoSort.direction = 'asc';
    }
    render();
}

function clearPagoFilters() {
    S.pagoFilters = { fecha: '', cliente: '', estado: '' };
    S.pagoSort = { column: null, direction: 'asc' };
    document.querySelectorAll('.pago-filter-bar input, .pago-filter-bar select').forEach(el => {
        if (el.tagName === 'SELECT') el.value = '';
        else if (el.type === 'text' || el.type === 'date') el.value = '';
    });
    render();
}

// ---- EXPERIENCIA ----
function applyExpFiltersAndSort(data) {
    let result = [...data];
    if (S.expFilters.entidad && S.expFilters.entidad.trim()) {
        const filter = S.expFilters.entidad.toLowerCase().trim();
        result = result.filter(e => e.entidad && e.entidad.toLowerCase().includes(filter));
    }
    if (S.expFilters.objeto && S.expFilters.objeto.trim()) {
        const filter = S.expFilters.objeto.toLowerCase().trim();
        result = result.filter(e => e.objeto && e.objeto.toLowerCase().includes(filter));
    }
    if (S.expFilters.cargo && S.expFilters.cargo.trim()) {
        const filter = S.expFilters.cargo.toLowerCase().trim();
        result = result.filter(e => e.cargo && e.cargo.toLowerCase().includes(filter));
    }
    if (S.expFilters.desde) {
        result = result.filter(e => e.inicio && e.inicio >= S.expFilters.desde);
    }
    if (S.expFilters.hasta) {
        result = result.filter(e => e.fin && e.fin <= S.expFilters.hasta);
    }
    if (S.expSort.column) {
        result.sort((a, b) => {
            let valA = a[S.expSort.column] || '';
            let valB = b[S.expSort.column] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return S.expSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return S.expSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
}

function toggleExpSort(column) {
    if (S.expSort.column === column) {
        S.expSort.direction = S.expSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        S.expSort.column = column;
        S.expSort.direction = 'asc';
    }
    render();
}

function clearExpFilters() {
    S.expFilters = { entidad: '', objeto: '', cargo: '', desde: '', hasta: '' };
    S.expSort = { column: null, direction: 'asc' };
    document.querySelectorAll('.exp-filter-bar input').forEach(el => el.value = '');
    render();
}

// ---- LICITACIONES ----
function applyLicFiltersAndSort(data) {
    let result = [...data];
    if (S.licFilters.convocatoria) {
        const filter = S.licFilters.convocatoria.toLowerCase().trim();
        result = result.filter(l => l.convocatoria && l.convocatoria.toLowerCase().includes(filter));
    }
    if (S.licFilters.proyecto) {
        const filter = S.licFilters.proyecto.toLowerCase().trim();
        result = result.filter(l => l.proyecto && l.proyecto.toLowerCase().includes(filter));
    }
    if (S.licFilters.estado) {
        result = result.filter(l => l.estado === S.licFilters.estado);
    }
    if (S.licFilters.entidad) {
        const filter = S.licFilters.entidad.toLowerCase().trim();
        result = result.filter(l => l.entidad && l.entidad.toLowerCase().includes(filter));
    }
    if (S.licSort.column) {
        result.sort((a, b) => {
            let valA = a[S.licSort.column] || '';
            let valB = b[S.licSort.column] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return S.licSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return S.licSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
}

function toggleLicSort(column) {
    if (S.licSort.column === column) {
        S.licSort.direction = S.licSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        S.licSort.column = column;
        S.licSort.direction = 'asc';
    }
    render();
}

function clearLicFilters() {
    S.licFilters = { convocatoria: '', proyecto: '', estado: '', entidad: '' };
    S.licSort = { column: null, direction: 'asc' };
    document.querySelectorAll('.lic-filter-bar input, .lic-filter-bar select').forEach(el => {
        if (el.tagName === 'SELECT') el.value = '';
        else el.value = '';
    });
    render();
}

// ---- CONTACTOS ----
function applyContFiltersAndSort(data) {
    let result = [...data];
    if (S.contFilters.nombre) {
        const filter = S.contFilters.nombre.toLowerCase().trim();
        result = result.filter(c => c.nombre && c.nombre.toLowerCase().includes(filter));
    }
    if (S.contFilters.empresa) {
        const filter = S.contFilters.empresa.toLowerCase().trim();
        result = result.filter(c => c.empresa && c.empresa.toLowerCase().includes(filter));
    }
    if (S.contFilters.cargo) {
        const filter = S.contFilters.cargo.toLowerCase().trim();
        result = result.filter(c => c.cargo && c.cargo.toLowerCase().includes(filter));
    }
    if (S.contSort.column) {
        result.sort((a, b) => {
            let valA = a[S.contSort.column] || '';
            let valB = b[S.contSort.column] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return S.contSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return S.contSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
}

function toggleContSort(column) {
    if (S.contSort.column === column) {
        S.contSort.direction = S.contSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        S.contSort.column = column;
        S.contSort.direction = 'asc';
    }
    render();
}

function clearContFilters() {
    S.contFilters = { nombre: '', empresa: '', cargo: '' };
    S.contSort = { column: null, direction: 'asc' };
    document.querySelectorAll('.cont-filter-bar input').forEach(el => el.value = '');
    render();
}

// ---- ACTIVIDADES ----
function applyActFiltersAndSort(data) {
    let result = [...data];
    if (S.actFilters.tipo) {
        result = result.filter(a => a.tipo === S.actFilters.tipo);
    }
    if (S.actFilters.fecha) {
        result = result.filter(a => a.fecha && a.fecha.includes(S.actFilters.fecha));
    }
    if (S.actFilters.cliente) {
        const f = S.actFilters.cliente.toLowerCase().trim();
        result = result.filter(a => a.cliente && a.cliente.toLowerCase().includes(f));
    }
    if (S.actFilters.proyecto) {
        const f = S.actFilters.proyecto.toLowerCase().trim();
        result = result.filter(a => a.proyecto && a.proyecto.toLowerCase().includes(f));
    }
    if (S.actSort.column) {
        result.sort((a, b) => {
            let valA = a[S.actSort.column] || '';
            let valB = b[S.actSort.column] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return S.actSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return S.actSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
}

function toggleActSort(column) {
    if (S.actSort.column === column) {
        S.actSort.direction = S.actSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        S.actSort.column = column;
        S.actSort.direction = 'asc';
    }
    render();
}

function clearActFilters() {
    S.actFilters = { tipo: '', fecha: '', cliente: '', proyecto: '' };
    S.actSort = { column: null, direction: 'asc' };
    document.querySelectorAll('.act-filter-bar input, .act-filter-bar select').forEach(el => {
        if (el.tagName === 'SELECT') el.value = '';
        else el.value = '';
    });
    render();
}

// ---- DOCUMENTOS ----
function applyDocFiltersAndSort(data) {
    let result = Array.isArray(data) ? [...data] : [];

    // Protección defensiva: versiones antiguas de state.js no tenían docFilters.
    const filters = S.docFilters || { tipo: '', vigente: '' };
    const sort = S.docSort || { column: null, direction: 'asc' };

    if (filters.tipo) {
        result = result.filter(d => d.tipo === filters.tipo);
    }

    if (filters.vigente === 'vigente') {
        const hoy = new Date().toISOString().slice(0, 10);
        result = result.filter(d => !d.fechaVencimiento || d.fechaVencimiento >= hoy);
    } else if (filters.vigente === 'vencido') {
        const hoy = new Date().toISOString().slice(0, 10);
        result = result.filter(d => d.fechaVencimiento && d.fechaVencimiento < hoy);
    }

    if (sort.column) {
        result.sort((a, b) => {
            let valA = a[sort.column] || '';
            let valB = b[sort.column] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
}

function toggleDocSort(column) {
    if (!S.docSort) S.docSort = { column: null, direction: 'asc' };

    if (S.docSort.column === column) {
        S.docSort.direction = S.docSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        S.docSort.column = column;
        S.docSort.direction = 'asc';
    }
    render();
}

function clearDocFilters() {
    S.docFilters = { tipo: '', vigente: '' };
    S.docSort = { column: null, direction: 'asc' };
    document.querySelectorAll('.doc-filter-bar input, .doc-filter-bar select').forEach(el => {
        el.value = '';
    });
    render();
}
