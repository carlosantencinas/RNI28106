// ============================================================
// CONFIGURACIÓN
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
