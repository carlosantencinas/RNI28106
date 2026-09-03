(function(){
    'use strict';

    async function initDashboardD3(){
        try {
            if (typeof d3 === 'undefined') {
                await window.HidroLoader.loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.4/d3.min.js');
            }
            renderD3Widgets();
        } catch (e) {
            console.warn('No se pudo cargar D3:', e);
        }
    }

    function renderD3Widgets(){
        const main = document.getElementById('main');
        if (!main || S.view !== 'dashboard') return;

        let host = document.getElementById('dashboard-d3-widgets');
        if (!host) {
            host = document.createElement('section');
            host.id = 'dashboard-d3-widgets';
            host.style.cssText = 'margin-top:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;';
            main.appendChild(host);
        }

        host.innerHTML = `
            <div id="d3-donut" style="padding:14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);min-height:220px;"></div>
            <div id="d3-timeseries" style="padding:14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);min-height:220px;"></div>
            <div id="d3-heatmap" style="padding:14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);min-height:220px;grid-column:span 2;"></div>
        `;

        try { renderDonut(); } catch(e){ console.warn('donut', e); }
        try { renderTimeSeries(); } catch(e){ console.warn('timeseries', e); }
        try { renderHeatmap(); } catch(e){ console.warn('heatmap', e); }
    }

    function renderDonut(){
        const el = d3.select('#d3-donut');
        el.selectAll('*').remove();
        const data = (S.cotizaciones||[]).reduce((acc,c)=>{const k=c.estado||'otro'; acc[k]=(acc[k]||0)+1; return acc;},{ });
        const entries = Object.keys(data).map(k=>({key:k,count:data[k]}));
        if (!entries.length){ el.append('div').attr('class','empty').text('No hay cotizaciones para mostrar.'); return; }

        const width = Math.min(360, el.node().clientWidth || 360);
        const height = 200; const radius = Math.min(width, height)/2 - 10;
        const svg = el.append('svg').attr('width', '100%').attr('viewBox', `0 0 ${width} ${height}`)
            .append('g').attr('transform', `translate(${width/2},${height/2})`);

        const color = d3.scaleOrdinal(d3.schemeTableau10).domain(entries.map(d=>d.key));
        const pie = d3.pie().value(d=>d.count);
        const arc = d3.arc().innerRadius(radius*0.5).outerRadius(radius);

        const gs = svg.selectAll('g.slice').data(pie(entries)).enter().append('g').attr('class','slice');
        gs.append('path').attr('d', arc).attr('fill', d=>color(d.data.key)).attr('stroke','#fff').attr('stroke-width',1);
        gs.append('title').text(d=>`${d.data.key}: ${d.data.count}`);

        // legend
        const legend = el.append('div').style('margin-top','8px').style('font-size','13px');
        entries.forEach(e=>{ legend.append('div').style('display','inline-flex').style('align-items','center').style('margin-right','12px')
            .html(`<span style="display:inline-block;width:12px;height:12px;background:${color(e.key)};margin-right:6px;border-radius:2px;"></span>${e.key} (${e.count})`);
        });
    }

    function renderTimeSeries(){
        const el = d3.select('#d3-timeseries');
        el.selectAll('*').remove();
        const now = new Date();
        const months = [];
        for (let i=11;i>=0;i--){ const d=new Date(now.getFullYear(), now.getMonth()-i,1); months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label:d.toLocaleDateString('es-BO',{month:'short'}) , total:0}); }
        const tx = typeof getPaymentTransactions==='function' ? getPaymentTransactions() : [];
        tx.forEach(p=>{ const m=String(p.fecha).slice(0,7); const mm = months.find(x=>x.key===m); if(mm) mm.total += Number(p.montoPagado||0); });
        const data = months;
        const W = Math.min(600, el.node().clientWidth || 600), H = 180, pad = {l:36,r:10,t:10,b:28};
        const svg = el.append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width','100%');
        const x = d3.scalePoint().domain(data.map(d=>d.label)).range([pad.l, W-pad.r]);
        const y = d3.scaleLinear().domain([0, d3.max(data,d=>d.total)||1]).nice().range([H-pad.b, pad.t]);
        const area = d3.area().x(d=>x(d.label)).y0(H-pad.b).y1(d=>y(d.total)).curve(d3.curveMonotoneX);
        svg.append('path').datum(data).attr('d', area).attr('fill','rgba(21,101,192,0.12)').attr('stroke','var(--primary)').attr('stroke-width',2);
        svg.selectAll('circle').data(data).enter().append('circle').attr('cx',d=>x(d.label)).attr('cy',d=>y(d.total)).attr('r',3).attr('fill','var(--primary)');
        svg.append('g').selectAll('text').data(data).enter().append('text').attr('x',d=>x(d.label)).attr('y',H-pad.b+16).attr('text-anchor','middle').attr('font-size',11).attr('fill','var(--text-soft)').text(d=>d.label);
        svg.append('g').attr('transform',`translate(${pad.l-6},0)`).append('text').attr('x',0).attr('y',14).attr('font-size',13).attr('font-weight',600).text('Cobros (últimos 12 meses)');
    }

    function renderHeatmap(){
        const el = d3.select('#d3-heatmap');
        el.selectAll('*').remove();
        // Heatmap: weekdays (rows) x months (cols)
        const now = new Date();
        const months = [];
        for (let i=11;i>=0;i--){ const d=new Date(now.getFullYear(), now.getMonth()-i,1); months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label:d.toLocaleDateString('es-BO',{month:'short'})}); }
        const weekdays = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
        const counts = {}; weekdays.forEach(w=>months.forEach(m=> counts[`${m.key}|${w}`]=0));
        (S.actividades||[]).forEach(a=>{ const d = a.fecha ? new Date(String(a.fecha)) : null; if(!d || isNaN(d)) return; const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; const w = weekdays[d.getDay()]; if(counts.hasOwnProperty(`${key}|${w}`)) counts[`${key}|${w}`] += 1; });
        const data = [];
        months.forEach((m,ci)=>{ weekdays.forEach((w,ri)=>{ data.push({month:m.label, monthKey:m.key, weekday:w, x:ci, y:ri, v:counts[`${m.key}|${w}`]}); }); });
        const cellSize = 26; const W = Math.max(300, months.length * cellSize + 120); const H = weekdays.length * cellSize + 60;
        const svg = el.append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width','100%');
        const max = d3.max(data,d=>d.v) || 1;
        const color = d3.scaleSequential(t=> d3.interpolateYlOrRd(t))(0); // placeholder
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, max]);
        const g = svg.append('g').attr('transform','translate(100,30)');
        // cells
        g.selectAll('rect').data(data).enter().append('rect')
            .attr('x', d => d.x * cellSize)
            .attr('y', d => d.y * cellSize)
            .attr('width', cellSize - 4)
            .attr('height', cellSize - 4)
            .attr('rx',4).attr('ry',4)
            .attr('fill', d=> colorScale(d.v))
            .append('title').text(d=>`${d.month} ${d.weekday}: ${d.v}`);
        // weekday labels
        svg.append('g').attr('transform','translate(88,30)').selectAll('text').data(weekdays).enter().append('text').attr('y', (d,i)=> i*cellSize + (cellSize/2)+4).attr('x',0).attr('text-anchor','end').attr('font-size',12).attr('fill','var(--text)').text(d=>d);
        // month labels
        svg.append('g').attr('transform','translate(100,20)').selectAll('text').data(months).enter().append('text').attr('x',(d,i)=> i*cellSize + (cellSize/2)).attr('y',0).attr('text-anchor','middle').attr('font-size',11).attr('fill','var(--text-soft)').text(d=>d.label);

        // legend
        const legendW = 160; const legendH = 10;
        const defs = svg.append('defs');
        const gradId = 'lg-' + Math.random().toString(36).slice(2,8);
        const linGrad = defs.append('linearGradient').attr('id', gradId).attr('x1','0%').attr('x2','100%');
        linGrad.append('stop').attr('offset','0%').attr('stop-color', colorScale(0));
        linGrad.append('stop').attr('offset','100%').attr('stop-color', colorScale(max));
        svg.append('rect').attr('x',100).attr('y', H-30).attr('width', legendW).attr('height',legendH).attr('fill',`url(#${gradId})`).attr('rx',4);
        svg.append('text').attr('x',100).attr('y', H-36).attr('font-size',11).attr('fill','var(--text-soft)').text('Actividad (conteo)');
        svg.append('text').attr('x',100).attr('y', H-8).attr('font-size',11).attr('fill','var(--text-soft)').text('0');
        svg.append('text').attr('x',100+legendW).attr('y', H-8).attr('font-size',11).attr('fill','var(--text-soft)').attr('text-anchor','end').text(String(max));
    }

    // expose
    window.initDashboardD3 = initDashboardD3;
    // auto-mount on DOM ready and when dashboard becomes active
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=>{ if (S.view==='dashboard') initDashboardD3(); }, 200));
    // also observe main changes
    (function(){ const main=document.getElementById('main'); if(main){ new MutationObserver(()=>{ if (S.view==='dashboard') setTimeout(initDashboardD3, 100); }).observe(main,{childList:true, subtree:true}); } })();
})();
