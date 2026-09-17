// Mejoras de cotizaciones integradas sobre el formulario original.
// No crea una segunda ventana. El texto puede usar **negrilla** manualmente.
(function(){
'use strict';

function money(n){return typeof bs==='function'?bs(Number(n)||0):'Bs '+(Number(n)||0).toFixed(2);}
function styles(){
    if(document.getElementById('cot-enh-styles'))return;
    const s=document.createElement('style');
    s.id='cot-enh-styles';
    s.textContent=''+
    '.cot-enh-item{position:relative;}'+
    '.cot-enh-subtotal{font-weight:700;text-align:right;color:var(--primary);font-size:12px;white-space:nowrap;padding:4px 6px;}'+
    '.cot-enh-note{display:block;margin-top:4px;font-size:10px;color:var(--text-soft);}'+
    '.cot-enh-totals{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}'+
    '.cot-enh-total-card{padding:9px 11px;background:var(--surface-subtle,#f7f8f8);border:1px solid var(--border-subtle,#e7e3db);border-radius:8px;}'+
    '.cot-enh-total-card span{display:block;font-size:10px;color:var(--text-soft);}'+
    '.cot-enh-total-card b{display:block;margin-top:2px;font-size:14px;color:var(--primary);}'+
    '@media(max-width:700px){.cot-enh-totals{grid-template-columns:1fr;}}';
    document.head.appendChild(s);
}
function getModal(){return document.querySelector('body > .overlay:last-child .modal');}
function ensureFormNames(modal){
    let n=0;
    modal.querySelectorAll('input,textarea,select').forEach(function(el){
        if(!el.id)el.id='cot-field-'+(++n);
        if(!el.name)el.name=el.id;
    });
}
function addActivityHint(modal){
    modal.querySelectorAll('.it-actividad').forEach(function(ta){
        if(ta.parentElement.querySelector('.cot-enh-note'))return;
        const note=document.createElement('small');
        note.className='cot-enh-note';
        note.textContent='Puedes escribir **texto** para marcarlo en negrilla.';
        ta.parentElement.appendChild(note);
    });
}
function enhance(modal,cotId){
    if(!modal||modal.dataset.cotEnhanced)return;
    modal.dataset.cotEnhanced='1';
    styles();
    ensureFormNames(modal);
    addActivityHint(modal);

    const discount=modal.querySelector('#f-descuento');
    if(!discount)return;
    const totalView=modal.querySelector('#f-total-view');
    const subtotalView=modal.querySelector('#f-subtotal-view');
    const rows=()=>Array.from(modal.querySelectorAll('.item-row'));

    function ensureAnticipo(){
        let input=modal.querySelector('#f-anticipo');
        if(input)return input;
        const field=document.createElement('div');
        field.className='field';
        field.innerHTML='<label for="f-anticipo">Anticipo [Bs]</label><input id="f-anticipo" name="anticipo" type="number" step="0.01" min="0" value="0"><small class="cot-enh-note">Pago recibido a cuenta; no reduce el precio de la cotización.</small>';
        const discountField=discount.closest('.field');
        const parent=discountField&&discountField.parentElement;
        if(parent)parent.appendChild(field);else modal.appendChild(field);
        return field.querySelector('#f-anticipo');
    }

    const anticipo=ensureAnticipo();
    const cot=window.S&&Array.isArray(S.cotizaciones)?S.cotizaciones.find(x=>x.id===cotId):null;
    if(cot&&anticipo)anticipo.value=Number(cot.anticipo)||0;
    const discountLabel=discount.closest('.field')&&discount.closest('.field').querySelector('label');
    if(discountLabel)discountLabel.textContent='Descuento [Bs]';

    function updateRowSubtotals(){
        rows().forEach(function(row){
            row.classList.add('cot-enh-item');
            const pu=Number(row.querySelector('.it-pu')?.value)||0;
            const qty=Number(row.querySelector('.it-cantidad')?.value)||0;
            let cell=row.querySelector('.cot-enh-subtotal');
            if(!cell){
                cell=document.createElement('span');
                cell.className='cot-enh-subtotal';
                const remove=row.querySelector('.item-remove');
                if(remove)remove.parentNode.insertBefore(cell,remove);else row.appendChild(cell);
            }
            cell.textContent=money(pu*qty);
        });
    }
    function recalc(){
        let subtotal=0;
        rows().forEach(function(row){subtotal+=(Number(row.querySelector('.it-pu')?.value)||0)*(Number(row.querySelector('.it-cantidad')?.value)||0);});
        const desc=Math.max(0,Number(discount.value)||0);
        const ant=Math.max(0,Number(anticipo?.value)||0);
        const net=Math.max(0,subtotal-desc);
        const saldo=Math.max(0,net-ant);
        if(subtotalView)subtotalView.textContent=money(subtotal);
        if(totalView)totalView.textContent=money(net);
        updateRowSubtotals();
        let cards=modal.querySelector('.cot-enh-totals');
        if(!cards){
            cards=document.createElement('div');cards.className='cot-enh-totals';
            cards.innerHTML='<div class="cot-enh-total-card"><span>Total después del descuento</span><b id="cot-enh-total-net"></b></div><div class="cot-enh-total-card"><span>Saldo después del anticipo</span><b id="cot-enh-saldo"></b></div>';
            const totalField=totalView&&totalView.closest('.field');
            if(totalField&&totalField.parentElement)totalField.parentElement.appendChild(cards);else modal.appendChild(cards);
        }
        const netEl=modal.querySelector('#cot-enh-total-net'),saldoEl=modal.querySelector('#cot-enh-saldo');
        if(netEl)netEl.textContent=money(net);
        if(saldoEl)saldoEl.textContent=money(saldo);
    }
    modal.addEventListener('input',recalc);
    recalc();
    const save=modal.querySelector('#m-save');
    if(save)save.addEventListener('click',function(){
        const value=Math.max(0,Number(anticipo?.value)||0);
        setTimeout(async function(){
            const saved=cotId&&window.S&&Array.isArray(S.cotizaciones)?S.cotizaciones.find(x=>x.id===cotId):null;
            if(!saved)return;
            saved.anticipo=value;
            try{if(typeof window.saveCotizaciones==='function')await window.saveCotizaciones(S.user&&S.user.uid);}catch(e){console.error('No se pudo guardar el anticipo',e);}
        },300);
    });
}
function init(){
    if(typeof window.openCotModal!=='function')return;
    const original=window.openCotModal;
    if(original.__cotEnhancedWrapper)return;
    function wrapped(cot){original(cot);setTimeout(function(){enhance(getModal(),cot&&cot.id||'');},0);}
    wrapped.__cotEnhancedWrapper=true;
    window.openCotModal=wrapped;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
