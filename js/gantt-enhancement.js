// ============================================================
// EXPERIENCIA - GRAFICA COMPLEMENTARIA AL GANTT
// Mantiene el Gantt original y añade una lectura visual anual.
// ============================================================
(function(){
    if(window.__ganttProfessionalChartInstalled) return;
    window.__ganttProfessionalChartInstalled = true;

    const originalRenderGantt = window.renderGantt;
    if(typeof originalRenderGantt !== 'function') return;

    function yearData(){
        const now = new Date();
        const years = Number(S.ganttYears) || 10;
        const startYear = now.getFullYear() - years + 1;
        const rows = [];
        for(let year=startYear; year<=now.getFullYear(); year++){
            const yearStart = new Date(year,0,1);
            const yearEnd = new Date(year,11,31,23,59,59);
            const projects = (S.experiencia || []).filter(e=>{
                if(!e.desde) return false;
                const start = new Date(e.desde+'T00:00:00');
                const end = e.enCurso ? now : (e.hasta ? new Date(e.hasta+'T23:59:59') : start);
                return start <= yearEnd && end >= yearStart;
            });
            const months = projects.reduce((total,e)=>{
                const startRaw = new Date(e.desde+'T00:00:00');
                const endRaw = e.enCurso ? now : (e.hasta ? new Date(e.hasta+'T23:59:59') : startRaw);
                const start = startRaw < yearStart ? yearStart : startRaw;
                const end = endRaw > yearEnd ? yearEnd : endRaw;
                return total + Math.max(0,(end-start)/86400000/30.4375);
            },0);
            rows.push({year,count:projects.length,months});
        }
        return rows;
    }

    function renderChart(){
        const rows = yearData();
        if(!rows.some(r=>r.count)) return '';
        const visible = rows.slice(-10);
        const maxCount = Math.max(1,...visible.map(r=>r.count));
        const w=620,h=150,left=34,right=10,top=16,bottom=30;
        const plotW=w-left-right, plotH=h-top-bottom;
        const step=plotW/visible.length;
        const barW=Math.min(30,step*0.55);
        const y=v=>top+plotH-(v/maxCount)*plotH;
        const bars=visible.map((r,i)=>{
            const x=left+i*step+(step-barW)/2;
            const bh=(r.count/maxCount)*plotH;
            return `<g><rect x="${x.toFixed(1)}" y="${(top+plotH-bh).toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="#2F7890" opacity=".88"/><text x="${(x+barW/2).toFixed(1)}" y="${Math.max(11,top+plotH-bh-6).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#49616B">${r.count}</text><text x="${(x+barW/2).toFixed(1)}" y="${h-10}" text-anchor="middle" font-size="9" fill="#8A979D">${String(r.year).slice(2)}</text></g>`;
        }).join('');
        const grid=[0,.5,1].map(v=>{const yy=y(maxCount*v);return `<line x1="${left}" y1="${yy.toFixed(1)}" x2="${w-right}" y2="${yy.toFixed(1)}" stroke="#EDF1F3" stroke-width="1"/>`;}).join('');
        const maxMonths=Math.max(1,...visible.map(r=>r.months));
        const dots=visible.map((r,i)=>{
            const x=left+i*step+step/2;
            const yy=top+plotH-(r.months/maxMonths)*plotH;
            return `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="3" fill="#B8862E"><title>${r.year}: ${r.count} proyecto(s), ${r.months.toFixed(1)} meses activos</title></circle>`;
        }).join('');
        const line=visible.map((r,i)=>{const x=left+i*step+step/2;const yy=top+plotH-(r.months/maxMonths)*plotH;return `${x.toFixed(1)},${yy.toFixed(1)}`;}).join(' ');
        return `<div class="exp-annual-chart"><div class="exp-chart-head"><div><span>LECTURA ANUAL</span><strong>Actividad profesional por año</strong></div><small><i class="exp-legend-project"></i> Proyectos <i class="exp-legend-month"></i> Meses activos</small></div><div class="exp-chart-wrap"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Actividad profesional por año">${grid}<polyline points="${line}" fill="none" stroke="#B8862E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>${bars}${dots}</svg></div></div>`;
    }

    window.renderGantt = function(){
        const gantt = originalRenderGantt();
        const chart = renderChart();
        return chart + gantt;
    };

    const style=document.createElement('style');
    style.id='gantt-professional-chart-styles';
    style.textContent=`
        .exp-annual-chart{margin-bottom:18px;padding:14px 16px;border:1px solid var(--border);border-radius:12px;background:#fff;box-shadow:0 2px 8px rgba(20,40,50,.035)}
        .exp-chart-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}
        .exp-chart-head div{display:flex;flex-direction:column;gap:3px}.exp-chart-head span{font-size:8px;font-weight:800;letter-spacing:.12em;color:#819097}.exp-chart-head strong{font-size:13px;color:#18333d}.exp-chart-head small{font-size:9px;color:#8A979D;white-space:nowrap}.exp-chart-head i{display:inline-block;width:7px;height:7px;border-radius:50%;margin:0 3px 0 7px}.exp-legend-project{background:#2F7890}.exp-legend-month{background:#B8862E}.exp-chart-wrap{height:150px;width:100%}.exp-chart-wrap svg{display:block;width:100%;height:100%}
        @media(max-width:700px){.exp-chart-head{align-items:flex-start;flex-direction:column}.exp-chart-head small{white-space:normal}.exp-chart-wrap{height:130px}}
    `;
    document.head.appendChild(style);
})();
