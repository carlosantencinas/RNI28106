// ============================================================
// STATE GLOBAL
// ============================================================

const S = {
    view: 'dashboard', user: null, firebaseConnected: false, editingCV: false,
    cotizaciones: [], pagos: [], pagosFijos: [], gastos: [], clientes: [], experiencia: [], formacion: [], cursos: [], actividades: [], documentos: [], licitaciones: [], contactos: [], referencias: [],
    datosPersonales: { nombre:'', ci:'', lugarExpedicion:'', fechaNacimiento:'', nacionalidad:'', profesion:'', registroProfesional:'' },
    config: { ...DEFAULT_CONFIG },
    ganttYears: 10, ganttShowEducacion: true, ganttShowCursos: true,
    cotFilters: { fecha:'', cliente:'', estado:'' }, cotSort: { column:null, direction:'asc' },
    pagoFilters: { fecha:'', cliente:'', estado:'' }, pagoSort: { column:null, direction:'asc' },
    expFilters: { entidad:'', objeto:'', cargo:'', desde:'', hasta:'' }, expSort: { column:null, direction:'asc' },
    licFilters: { convocatoria:'', proyecto:'', estado:'', entidad:'' }, licSort: { column:null, direction:'asc' },
    contFilters: { nombre:'', empresa:'', cargo:'' }, contSort: { column:null, direction:'asc' },
    actFilters: { tipo:'', fecha:'', cliente:'', proyecto:'' }, actSort: { column:null, direction:'asc' },
    docFilters: { tipo:'', vigente:'' }, docSort: { column:null, direction:null },
    selectedDebts: new Set(), expandedPagoId: null
};
