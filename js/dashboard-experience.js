// ============================================================
// DASHBOARD - Evolución de experiencia profesional
// ============================================================
// Gráfica SVG acumulativa a partir de S.experiencia.
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
        const limit = new Date(endDate);
        const intervals = items
            .filter(e => e && e.certificado === true && e.desde)
            .map(e => ({
                start: parseDate(e.desde),
                end: e.enCurso ? new Date(limit) : parseDate(e.hasta)
            }))
            .filter(i => i.start && i.end && i.end >= i.start)
            .map(i => ({
                start: i.start,
                end: i.end > limit ? new Date(limit) : i.end
            }))
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

    function accumulatedDays(endDate, intervals) {
        let total = 0;
        intervals.forEach(interval => {
            if (interval.start > endDate) return;
            const end = interval.end < endDate ? interval.end : endDate;
            if (end >= interval.start) {
                total += Math.max(0, Math.ceil((end - interval.start) / 86400000));
            }
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
            const days = accumulatedDays(end, intervals);
            data.push({
                year: String(year),
                years: Number((days / 365.25).toFixed(2))
            });
        }
        return data;
    }

    function formatYears(value) {
        return (Number(value) || 0).toLocaleString('es-BO', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + ' años';
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>'"]/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[c]));
    }

    function renderChart() {
        const host = document.getElementById('dashboard-experience-evolution');
        if (!host) return;

        const series = buildSeries(Array.isArray(S.experiencia) ? S.experiencia : []);
        if (!series.length) {
            host.innerHTML = '<div class="empty" style="padding:24px;">No hay experiencia certificada suficiente para mostrar la evolución.</div>';
            return;
        }

        const W = 900, H = 320;
        const pad = { l: 58, r: 24, t: 24, b: 48 };
        const iw = W - pad.l - pad.r;
        const ih = H - pad.t - pad.b;
        const maxY = Math.max(1, Math.ceil(Math.max(...series.map(d => d.years))));
        const x = i => pad.l + (series.length === 1 ? iw / 2 : (i / (series.length - 1)) * iw);
        const y = value => pad.t + ih - (value / maxY) * ih;
        const points = series.map((d, i) => `${x(i).toFixed(1)},${y(d.years).toFixed(1)}`).join(' ');
        const latest = series[series.length - 1];

        const grid = [];
        for (let i = 0; i <= maxY; i++) {
            const yy = y(i);
            grid.push(`<line x1="${pad.l}" y1="${yy}" x2="${W - pad.r}" y2="${yy}" stroke="var(--border)" stroke-width="1"/>`);
            grid.push(`<text x="${pad.l - 10}" y="${yy + 4}" text-anchor="end" font-size="11" fill="var(--text-soft)">${i}</text>`);
        }

        const labels = series.map((d, i) => {
            const show = series.length <= 12 || i === 0 || i === series.length - 1 || i % Math.ceil(series.length / 8) === 0;
            return show ? `<text x="${x(i)}" y="${H - 15}" text-anchor="middle" font-size="11" fill="var(--text-soft)">${d.year}</text>` : '';
        }).join('');

        const dots = series.map((d, i) => `
            <circle class="experience-point" cx="${x(i)}" cy="${y(d.years)}" r="5" fill="var(--primary)" tabindex="0"
                data-year="${escapeHtml(d.year)}" data-years="${d.years}">
                <title>${escapeHtml(d.year)}: ${escapeHtml(formatYears(d.years))}</title>
            </circle>
        `).join('');

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
            <div style="position:relative;width:100%;overflow:hidden;">
                <div class="experience-tooltip" aria-live="polite" style="display:none;position:absolute;z-index:2;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface, white);box-shadow:0 4px 14px rgba(0,0,0,.12);font-size:12px;pointer-events:none;"></div>
                <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de la experiencia profesional" style="width:100%;height:auto;display:block;">
                    ${grid.join('')}
                    <line x1="${pad.l}" y1="${pad.t + ih}" x2="${W - pad.r}" y2="${pad.t + ih}" stroke="var(--border)" stroke-width="1"/>
                    <polyline points="${points}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
                    ${dots}
                    ${labels}
                </svg>
            </div>
        `;

        const tooltip = host.querySelector('.experience-tooltip');
        host.querySelectorAll('.experience-point').forEach(point => {
            const show = () => {
                tooltip.textContent = `${point.dataset.year}: ${formatYears(point.dataset.years)}`;
                tooltip.style.display = 'block';
                const px = (Number(point.getAttribute('cx')) / W) * host.clientWidth;
                tooltip.style.left = `${Math.min(Math.max(px - 45, 4), Math.max(4, host.clientWidth - 140))}px`;
                tooltip.style.top = '4px';
            };
            const hide = () => { tooltip.style.display = 'none'; };
            point.addEventListener('mouseenter', show);
            point.addEventListener('focus', show);
            point.addEventListener('mouseleave', hide);
            point.addEventListener('blur', hide);
        });
    }

    function ensureHost() {
        if (document.getElementById('dashboard-experience-evolution')) return true;
        const main = document.getElementById('main');
        if (!main) return false;

        const host = document.createElement('section');
        host.id = 'dashboard-experience-evolution';
        host.className = 'card';
        host.style.marginTop = '18px';
        main.appendChild(host);
        return true;
    }

    function mountAndRender() {
        if (ensureHost()) renderChart();
    }

    window.renderDashboardExperienceEvolution = mountAndRender;

    document.addEventListener('DOMContentLoaded', mountAndRender);

    // viewDashboard() reemplaza el contenido de #main; observamos esos
    // cambios para volver a montar la gráfica sin modificar views.js.
    const observer = new MutationObserver(() => {
        if (document.getElementById('main')) mountAndRender();
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
