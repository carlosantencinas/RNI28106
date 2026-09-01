// ============================================================
// CENTRO DE ALERTAS - DASHBOARD
// Alertas derivadas del estado actual de la aplicación.
// No modifica datos; solo informa al usuario.
// ============================================================
(function (global) {
    'use strict';

    const previousRender = global.render;
    if (typeof previousRender !== 'function') return;

    const ALERT_DAYS = 30;

    function parseDate(value) {
        if (!value) return null;
        const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function daysUntil(value) {
        const date = parseDate(value);
        if (!date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((date.getTime() - today.getTime()) / 86400000);
    }

    function getDocumentExpiry(doc) {
        return doc?.fechaVencimiento || doc?.vencimiento || doc?.fechaExpiracion || doc?.vence || null;
    }

    function buildAlerts() {
        const alerts = [];
        const documentos = Array.isArray(S.documentos) ? S.documentos : [];
        const cotizaciones = Array.isArray(S.cotizaciones) ? S.cotizaciones : [];
        const licitaciones = Array.isArray(S.licitaciones) ? S.licitaciones : [];

        documentos.forEach(doc => {
            const vencimiento = getDocumentExpiry(doc);
            const days = daysUntil(vencimiento);
            if (days === null) return;

            const nombre = doc.nombre || doc.tipo || 'Documento';
            if (days < 0) {
                alerts.push({
                    level: 'danger',
                    icon: '🔴',
                    title: 'Documento vencido',
                    text: `${nombre} venció hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}.`,
                    action: 'documentos'
                });
            } else if (days <= ALERT_DAYS) {
                alerts.push({
                    level: 'warning',
                    icon: '🟠',
                    title: 'Documento por vencer',
                    text: `${nombre} vence en ${days} día${days === 1 ? '' : 's'}.`,
                    action: 'documentos'
                });
            }
        });

        cotizaciones.forEach(cot => {
            if (cot.estado !== 'aceptada') return;
            if (typeof getResumenCotizacion !== 'function') return;
            const resumen = getResumenCotizacion(cot);
            if (resumen.saldoPendiente > 0.01) {
                alerts.push({
                    level: resumen.totalPagado > 0 ? 'warning' : 'danger',
                    icon: resumen.totalPagado > 0 ? '🟠' : '🔴',
                    title: resumen.totalPagado > 0 ? 'Pago parcial pendiente' : 'Pago pendiente',
                    text: `${cot.titulo || 'Cotización aceptada'} · saldo ${bs(resumen.saldoPendiente)}.`,
                    action: 'pagos'
                });
            }
        });

        licitaciones.forEach(lic => {
            const estado = String(lic.estado || '').toLowerCase();
            if (estado === 'evaluacion') {
                alerts.push({
                    level: 'info',
                    icon: '🔵',
                    title: 'Licitación en evaluación',
                    text: lic.proyecto || lic.convocatoria || 'Hay una licitación en evaluación.',
                    action: 'licitaciones'
                });
            }
        });

        return alerts;
    }

    function renderAlertCenter() {
        const main = document.getElementById('main');
        if (!main || S.view !== 'dashboard') return;
        if (main.querySelector('[data-alert-center]')) return;

        const alerts = buildAlerts();
        const panel = document.createElement('div');
        panel.dataset.alertCenter = 'true';
        panel.className = 'panel';
        panel.style.marginBottom = '20px';

        if (!alerts.length) {
            panel.innerHTML = `
                <div class="panel-h"><h3>🔔 Centro de alertas</h3><span style="font-size:12px;color:var(--success);">Todo en orden</span></div>
                <div class="panel-body">
                    <div style="padding:8px 0;color:var(--text-soft);font-size:13px;">No hay documentos por vencer ni pagos pendientes que requieran atención inmediata.</div>
                </div>`;
        } else {
            panel.innerHTML = `
                <div class="panel-h">
                    <h3>🔔 Centro de alertas</h3>
                    <span style="font-size:12px;color:var(--text-soft);">${alerts.length} alerta${alerts.length === 1 ? '' : 's'}</span>
                </div>
                <div class="panel-body">
                    ${alerts.slice(0, 8).map(a => `
                        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
                            <span style="font-size:16px;">${a.icon}</span>
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:13px;">${esc(a.title)}</div>
                                <div style="font-size:12px;color:var(--text-soft);white-space:normal;">${esc(a.text)}</div>
                            </div>
                            <button class="btn btn-sm btn-ghost" data-alert-action="${a.action}">Ver</button>
                        </div>`).join('')}
                    ${alerts.length > 8 ? `<div style="padding-top:10px;font-size:12px;color:var(--text-soft);">...y ${alerts.length - 8} alertas más.</div>` : ''}
                </div>`;
        }

        const firstPanel = main.querySelector('.kpi-grid')?.nextElementSibling;
        if (firstPanel) main.insertBefore(panel, firstPanel);
        else main.appendChild(panel);

        panel.querySelectorAll('[data-alert-action]').forEach(btn => {
            btn.onclick = () => {
                S.view = btn.dataset.alertAction;
                global.render();
            };
        });
    }

    function enhancedRenderWithAlerts() {
        previousRender();
        renderAlertCenter();
    }

    global.render = enhancedRenderWithAlerts;
    global.buildDashboardAlerts = buildAlerts;
})(window);
