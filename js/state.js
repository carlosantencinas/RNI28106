// ============================================================
// STATE GLOBAL (ACTUALIZADO)
// ============================================================

const S = {
    view: 'dashboard',
    cotizaciones: [],
    pagos: [],
    clientes: [],
    experiencia: [],
    formacion: [],
    cursos: [],
    // ========== NUEVO: ACTIVIDADES ==========
    actividades: [],
    datosPersonales: {
        nombre: '',
        ci: '',
        lugarExpedicion: '',
        fechaNacimiento: '',
        nacionalidad: '',
        profesion: '',
        registroProfesional: ''
    },
    config: { ...DEFAULT_CONFIG },
    ganttYears: 10,
    ganttShowEducacion: true,
    ganttShowCursos: true,
    user: null,
    editingCV: false,
    cotFilters: { fecha: '', cliente: '', estado: '' },
    cotSort: { column: null, direction: 'asc' },
    pagoFilters: { fecha: '', cliente: '', estado: '' },
    pagoSort: { column: null, direction: 'asc' },
    expFilters: { entidad: '', objeto: '', cargo: '', desde: '', hasta: '' },
    expSort: { column: null, direction: 'asc' },
    firebaseConnected: false,
    selectedDebts: new Set(),
    // LICITACIONES
    licitaciones: [],
    contactos: [],
    referencias: [],
    licFilters: { convocatoria: '', proyecto: '', estado: '', entidad: '' },
    licSort: { column: null, direction: 'asc' },
    contFilters: { nombre: '', empresa: '', cargo: '' },
    contSort: { column: null, direction: 'asc' },
    // EXPANDIDO PARA DETALLE DE PAGOS
    expandedPagoId: null,
    // ========== NUEVO: FILTROS DE ACTIVIDADES ==========
    actFilters: { tipo: '', fecha: '', cliente: '', proyecto: '' },
    actSort: { column: null, direction: 'asc' }
};
