// ============================================================
// DASHBOARD - Evolución de experiencia profesional
// ============================================================
// Genera una gráfica SVG acumulativa a partir de S.experiencia.
// Solo considera experiencia certificada y evita doble conteo
// de periodos superpuestos.

(function () {
    'use strict';

    function parseDate(value) {
        if (!value) return null;
        const d = new Date(value + 'T00:00:00');
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function mergeIntervals(items, endDate) {
        const intervals = items
            .filter(e => e && e.certificado === true && e.desde)
            .map(e => ({
                start: parseDate(e.desde),
                end: e.enCurso ? new Date(endDate) : parseDate(e.hasta)
            }))
            .filter(i => i.start && i.end && i.end >= i.start)
            .map(i => ({ start: i.start, end: i.end > endDate ? new Date(endDate) : i.end }))
            .sort((a, b) => a.start - b.start);

        const merged = [];
        intervals.forEach(interval => {
            const last = merged[merged.length - 1];
            if (!last || interval.start > last.end) {
                merged.push({ ...interval });
            } else if (interval.end > last.end) {
                last.end = interval.end;
            }
        });
        return merged;
    }

    function daysUntil(date, endDate, items) {
        const bounded = items
            .map(i => ({
                start: i.start,
                end: i.end > endDate ? endDate : i.end
            }))
            .filter(i => i.start <= endDate && i.end >= i.start);

        let total = 0;
        bounded.forEach(i => {
            const end = i.end > endDate ? endDate : i.end;
            total += Math.max(0, Math.ceil((end - i.start) / 86400000));
        });
        return total;
    }

    function buildSeries(experiencias) {
        const now = new Date();
        const valid = experiencias.filter(e => e && e.certificado === true && e.desde);
        if (!valid.length) return [];

        const starts = valid.map(e => parseDate(e.desde)).filter(Boolean);
        if (!starts.length) return [];

        const firstYear = Math.min(...starts.map(d => d.getFullYear()));
        const currentYear = now.getFullYear();
        const intervals = mergeIntervals(valid, now);
        const data = [];

        for (let year = firstYear; year <= currentYear; year++) {
            const end = year === currentYear ? now : new Date(year, 11, 31, 23, 59, 59);
            const days = daysUntil(end, end, intervals);
            data.push({ year: String(year), years: Number((days / 365.25).toFixed(2)) });
        }
        return data;
    }

    function formatYears(value) {
        const years = Number(value) || 0;
        return years.toLocaleString('es-BO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' años';
    }

    function renderChart() {
        const host = document.getElementById('dashboard-experience-evolution');
        if (!host) return;

        const series = buildSeries(Array.isArray(S.experiencia) ? S.experiencia : []);
        if (!series.length) {
            host.innerHTML = '<div class="empty" style="padding:24px;">No hay experiencia certificada suficiente para mostrar la evolución.</div>';
            return;
        }

        const W = 900, H = 300;
        const pad = { l: 58, r: 24, t: 22, b: 42 };
        const iw = W - pad.l - pad.r;
        const ih = H - pad.t - pad.b;
        const maxY = Math.max(1, Math.ceil(Math.max(...series.map(d => d.years))));
        const x = i => pad.l + (series.length === 1 ? iw / 2 : (i / (series.length - 1)) * iw);
        const y = value => pad.t + ih - (value / maxY) * ih;
        const points = series.map((d, i) => `${x(i).toFixed(1)},${y(d.years).toFixed(1)}`).join(' ');

        const grid = [];
        for (let i = 0; i <= maxY; i++) {
            const yy = y(i);
            grid.push(`<line x1="${pad.l}" y1="${yy}" x2="${W - pad.r}" y2="${yy}" stroke="var(--border)" stroke-width="1"/>`);
            grid.push(`<text x="${pad.l - 10}" y="${yy + 4}" text-anchor="end" font-size="11" fill="var(--text-soft)">${i}</text>`);
        }

        const labels = series.map((d, i) => {
            const show = series.length <= 12 || i === 0 || i === series.length - 1 || i % Math.ceil(series.length / 8) === 0;
            return show ? `<text x="${x(i)}" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--text-soft)">${d.year}</text>` : '';
        }).join('');

        const dots = series.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.years)}" r="3.5" fill="var(--primary)"/><title>${d.year}: ${formatYears(d.years)}</title>`).join('');
        const latest = series[series.length - 1];

        host.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px;">
                <div>
                    <div style="font-size:16px;font-weight:700;">Evolución de la experiencia profesional</div>
                    <div style="font-size:12px;color:var(--text-soft);margin-top:3px;">Experiencia certificada acumulada, descontando periodos superpuestos.</div>
                </div>
                <div style="text-align:right;white-space:nowrap;">
                    <div style="font-size:22px;font-weight:700;">${formatYears(latest.years)}</div>
                    <div style="font-size:11px;color:var(--text-soft);">a ${latest.year}</div>
                </div>
            </div>
            <div style="width:100%;overflow:hidden;">
                <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de la experiencia profesional" style="width:100%;height:auto;display:block;">
                    ${grid.join('')}
                    <line x1="${pad.l}" y1="${pad.t + ih}" x2="${W - pad.r}" y2="${pad.t + ih}" stroke="var(--border)" stroke-width="1"/>
                    <polyline points="${points}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
                    ${dots}
                    ${labels}
                </svg>
            </div>
        `;
    }

    window.renderDashboardExperienceEvolution = renderChart;
})();
