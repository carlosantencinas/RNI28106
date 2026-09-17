// Mejoras de cotizaciones sin alterar la estructura de datos existente.
// - Mantiene descuento separado de anticipo.
// - Muestra subtotal por actividad.
// - Permite marcar texto en negrilla mediante **texto**.
(function(){
'use strict';

const originalOpen=window.openCotModal;
if(typeof originalOpen!=='function') return;

function esc(v){
    const s=String(v==null?'':v);
    return s.replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
}
function rich(v){
    return esc(v).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}
function addStyles(){
    if(document.getElementById('cot-enh-styles'))return;
    const st=document.createElement('style');st.id='cot-enh-styles';st.textContent=`
        .cot-enh-item{display:grid;grid-template-columns:minmax(260px,1fr) 90px 80px 58px 72px 30px;gap:8px;align-items:start;margin-bottom:8px}
        .cot-enh-item .it-actividad{min-height:52px}
        .cot-enh-subtotal{font-weight:700;text-align:right;padding:9px 6px;color:var(--primary);font-size:12px;white-space:nowrap}
        .cot-enh-toolbar{display:flex;align-items:center;gap:5px;margin:4px 0 6px}
        .cot-enh-toolbar button{border:1px solid var(--border);background:#fff;border-radius:6px;padding:3px 8px;cursor:pointer;font-weight:700;color:var(--primary)}
        .cot-enh-hint{font-size:10px;color:var(--text-soft)}
        .cot-enh-preview{margin-top:4px;padding:6px 8px;background:var(--surface-subtle,#f7f8f8);border:1px solid var(--border-subtle,#e7e3db);border-radius:6px;font-size:11px;line-height:1.4;min-height:18px}
        .cot-enh-totals{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
        .cot-enh-total-card{padding:9px 11px;background:var(--surface-subtle,#f7f8f8);border:1px solid var(--border-subtle,#e7e3db);border-radius:8px}
        .cot-enh-total-card span{display:block;font-size:10px;color:var(--text-soft)}
        .cot-enh-total-card b{display:block;margin-top:2px;font-size:14px;color:var(--primary)}
        @media(max-width:700px){.cot-enh-item{grid-template-columns:1fr 80px 70px 55px 65px 28px}.cot-enh-totals{grid-template-columns:1fr}}
    `;document.head.appendChild(st);
}
function money(n){return typeof bs==='function'?bs(Number(n)||0):'Bs '+(Number(n)||0).toFixed(2);}
function getModal(){return document.querySelector('body > .overlay:last-child .modal');}
function enhance(modal,cotId){
    if(!modal||modal.dataset.cotEnhanced)return;
    modal.dataset.cotEnhanced='1';addStyles();
    const rows=()=>[...modal.querySelectorAll('.item-row')];
    const existingSubtotal=modal.querySelector('#f-subtotal-view');
    const discount=modal.querySelector('#f-descuento');
    if(!discount)return;

    const oldGrid=modal.querySelector('#items-block')?.previousElementSibling;
    if(oldGrid){
        const spans=[...oldGrid.children];
        const subtotalSpan=document.createElement('span');subtotalSpan.textContent='Subtotal';subtotalSpan.style.textAlign='right';
        if(spans.length>=5)oldGrid.insertBefore(subtotalSpan,spans[4]);
    }

    function updateSubtotals(){
        rows().forEach(row=>{
            let cell=row.querySelector('.cot-enh-subtotal');
            if(!cell){cell=document.createElement('div');cell.className='cot-enh-subtotal';const remove=row.querySelector('.item-remove');row.insertBefore(cell,remove);}
            const pu=Number(row.querySelector('.it-pu')?.value)||0;
            const qty=Number(row.querySelector('.it-cantidad')?.value)||0;
            cell.textContent=money(pu*qty);
            const ta=row.querySelector('.it-actividad');
            if(ta && !ta.nextElementSibling?.classList.contains('cot-enh-toolbar')){
                const toolbar=document.createElement('div');toolbar.className='cot-enh-toolbar';toolbar.innerHTML='<button type="button" title="Aplicar negrilla">B</button><span class="cot-enh-hint">Selecciona texto y pulsa B</span>';
                const preview=document.createElement('div');preview.className='cot-enh-preview';
                ta.insertAdjacentElement('afterend',toolbar);toolbar.insertAdjacentElement('afterend',preview);
                const renderPreview=()=>{preview.innerHTML=ta.value?rich(ta.value):'Vista previa de la actividad…';};
                toolbar.querySelector('button').onclick=()=>{
                    const a=ta.selectionStart,b=ta.selectionEnd;
                    if(a===b){toast('Selecciona primero el texto que quieres poner en negrilla.');ta.focus();return;}
                    const selected=ta.value.slice(a,b);ta.value=ta.value.slice(0,a)+'**'+selected+'**'+ta.value.slice(b);ta.focus();ta.selectionStart=a;ta.selectionEnd=b+4;renderPreview();ta.dispatchEvent(new Event('input',{bubbles:true}));
                };
                ta.addEventListener('input',renderPreview);renderPreview();
            }
        });
    }
    function ensureAnticipo(){
        let field=modal.querySelector('#f-anticipo');
        if(field)return field;
        const row=discount.closest('.row2');
        field=document.createElement('div');field.className='field';field.innerHTML='<label>Anticipo [Bs]</label><input type="number" step="0.01" min="0" id="f-anticipo" value="0"><div style="font-size:11px;color:var(--text-soft);margin-top:2px;">Pago recibido a cuenta; no reduce el precio de la cotización.</div>';
        if(row)row.appendChild(field);
        return field.querySelector('input');
    }
    const anticipo=ensureAnticipo();
    const cot=window.S?.cotizaciones?.find(x=>x.id===cotId);
    if(cot)anticipo.value=Number(cot.anticipo)||0;
    discount.closest('.field')?.querySelector('label')?.replaceChildren(document.createTextNode('Descuento [Bs]'));

    const totals=modal.querySelector('#f-total-view')?.parentElement?.parentElement;
    if(totals && !modal.querySelector('.cot-enh-totals')){
        const box=document.createElement('div');box.className='cot-enh-totals';box.innerHTML='<div class="cot-enh-total-card"><span>Total después del descuento</span><b id="cot-enh-total-net">Bs 0.00</b></div><div class="cot-enh-total-card"><span>Saldo después del anticipo</span><b id="cot-enh-saldo">Bs 0.00</b></div>';
        totals.parentNode.insertBefore(box,totals);
    }
    function recalcEnh(){
        let subtotal=0;rows().forEach(r=>subtotal+=(Number(r.querySelector('.it-pu')?.value)||0)*(Number(r.querySelector('.it-cantidad')?.value)||0));
        const desc=Math.max(0,Number(discount.value)||0),ant=Math.max(0,Number(anticipo.value)||0);
        const net=Math.max(0,subtotal-desc),saldo=Math.max(0,net-ant);
        const netEl=modal.querySelector('#cot-enh-total-net'),saldoEl=modal.querySelector('#cot-enh-saldo');
        if(existingSubtotal)existingSubtotal.textContent=money(subtotal);
        if(netEl)netEl.textContent=money(net);if(saldoEl)saldoEl.textContent=money(saldo);
        const total=modal.querySelector('#f-total-view');if(total)total.textContent=money(net);
        updateSubtotals();
    }
    modal.addEventListener('input',recalcEnh);recalcEnh();

    // Captura el anticipo y lo persiste después de que el guardado original haya actualizado la cotización.
    const save=modal.querySelector('#m-save');
    if(save){
        save.addEventListener('click',function(){
            const value=Math.max(0,Number(anticipo.value)||0);
            setTimeout(async function(){
                const saved=window.S?.cotizaciones?.find(x=>x.id===cotId);
                if(!saved)return;
                saved.anticipo=value;
                try{if(typeof window.saveCotizaciones==='function')await window.saveCotizaciones(window.S?.user?.uid);}catch(e){console.error('No se pudo guardar el anticipo',e);}
            },250);
        },false);
    }
}
window.openCotModal=function(cot){
    originalOpen(cot);
    setTimeout(()=>enhance(getModal(),cot?.id || document.querySelector('body > .overlay:last-child .modal')?.dataset?.cotId || ''),0);
};
})();
