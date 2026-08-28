// ============================================================
// CONFIGURACIÓN (ACTUALIZADA)
// ============================================================

const LOGO_URL = "https://raw.githubusercontent.com/tu-usuario/tu-repo/main/logo.png";

const DEFAULT_CONFIG = {
    nombre: 'M.Sc. Ing. Carlos A. Antequera E.',
    rni: 'RNI: 28.106 Ingeniero Civil - Especialista Hidrólogo - Hidráulico',
    logo: LOGO_URL,
    defaultNota: 'Esta cotización se enfoca exclusivamente en servicios relacionados con la especialidad hidráulica e Hidrológica. No abarca el cálculo estructural de pasarelas, obras de captación de agua, ni ninguna otra actividad que pertenezca a especialidades diferentes tales como ambiental, geológica, topográfica, económica, agronómica, entre otras.',
    defaultEntregables: 'en formato digital:\n- Mapas parámetros morfométricos de la cuenca, pendientes, elevaciones, cobertura, precipitaciones, temperatura, estaciones y ubicación hidrográfica.\n- Informe Hidrológico, y modelo hidrológico.\n- Regulación del embalse.\n- Modelo numérico Vertedero Iber 3.3\n- Modelo numérico Aliviadero Iber 3.3\n- Planos Hidráulicos vertedor y aliviadero.\n- Modelo hidrodinámico Rotura de presa y zonas de riesgo Iber 3.3\n- Mapa de riesgo de inundación'
};

const DEFAULT_REFERENCIAS = [
    { contratante: 'CONSULTORA Y CONSTRUCTORA ANFAYA', supervisor: 'PEDRO JESUS QUISPE', cargo: 'RESPONSABLE', telefono: '76112087' },
    { contratante: 'FONDO PRODUCTIVO Y SOCIAL FPS CHUQUISACA', supervisor: 'FELICIDAD ALMENDRAS C.', cargo: 'FISCAL DE PROYECTOS', telefono: '77135608' },
    { contratante: 'ROES CONSULTORES', supervisor: 'RODRIGO UZQUEDA SEGOVIA', cargo: 'REPRESENTANTE LEGAL', telefono: '72972874' }
];

const LS_PREFIX = 'hidro_data_';

// ---- COLUMNAS PARA EXPORTAR DEUDAS ----
const DEBT_COLUMNS = {
    fecha: { label: 'Fecha', default: true },
    descripcion: { label: 'Descripción', default: true },
    cliente: { label: 'Cliente', default: true },
    proyecto: { label: 'Proyecto', default: true },
    monto: { label: 'Monto', default: true },
    pagado: { label: 'Pagado', default: true },
    saldo: { label: 'Saldo', default: true },
    metodo: { label: 'Método de pago', default: false },
    comprobante: { label: 'Comprobante', default: false },
    notas: { label: 'Notas', default: false }
};

// ========== NUEVO: TIPOS DE ACTIVIDADES ==========
const TIPOS_ACTIVIDAD = {
    reunion: { label: '🤝 Reunión', icon: '🤝', color: '#4A90D9' },
    viaje: { label: '✈️ Viaje', icon: '✈️', color: '#E67E22' },
    visita_tecnica: { label: '🔧 Visita Técnica', icon: '🔧', color: '#27AE60' },
    capacitacion: { label: '📚 Capacitación', icon: '📚', color: '#8E44AD' },
    otro: { label: '📌 Otro', icon: '📌', color: '#7F8C8D' }
};
// ============================================================
// CONFIGURACIÓN (ACTUALIZADA)
// ============================================================

// ... config existente ...

// ========== TIPOS DE DOCUMENTOS ADMINISTRATIVOS ==========
const TIPOS_DOCUMENTOS = {
    seprec: { label: '📋 SEPREC', icon: '📋', color: '#2E86C1' },
    nit: { label: '🏛️ NIT', icon: '🏛️', color: '#27AE60' },
    rni: { label: '📜 RNI', icon: '📜', color: '#8E44AD' },
    licencia: { label: '📄 Licencia', icon: '📄', color: '#E67E22' },
    matricula: { label: '🎓 Matrícula', icon: '🎓', color: '#1A4A5C' },
    otro: { label: '📁 Otro', icon: '📁', color: '#7F8C8D' }
};
