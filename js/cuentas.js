// ============================================================
// CUENTAS BANCARIAS · datos propios de cobro
// Logo + color del banco + tarjeta visual para compartir.
// ============================================================
(function(){
    'use strict';
    const safe=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const uid=()=>`cta_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const mask=v=>{const s=String(v||'');return s.length>4?'•••• '+s.slice(-4):s||'—';};
    const DEFAULT_COLOR='#1A4A5C';

    function hexToRgb(hex){
        const h=String(hex||DEFAULT_COLOR).replace('#','');
        const n=parseInt(h.length===3?h.split('').map(x=>x+x).join(''):h,16);
        return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
    }
    function mix(hex,amount){
        const {r,g,b}=hexToRgb(hex), p=amount>=0?255:0, a=Math.abs(amount);
        return `rgb(${Math.round(r+(p-r)*a)},${Math.round(g+(p-g)*a)},${Math.round(b+(p-b)*a)})`;
    }
    function contrastColor(hex){
        const {r,g,b}=hexToRgb(hex);
        const lum=(0.299*r+0.587*g+0.114*b)/255;
        return lum>0.62?'#173B47':'#FFFFFF';
    }
    function validColor(v){return /^#[0-9a-f]{6}$/i.test(String(v||''))?v:DEFAULT_COLOR;}

    function compressLogo(file){
        return new Promise((resolve,reject)=>{
            if(!file)return resolve('');
            if(!/^image\/(png|jpeg|webp)$/i.test(file.type)){reject(new Error('Formato no compatible'));return;}
            if(file.size>3*1024*1024){reject(new Error('El logo supera 3 MB'));return;}
            const reader=new FileReader();
            reader.onerror=()=>reject(new Error('No se pudo leer el logo'));
            reader.onload=()=>{
                const img=new Image();
                img.onerror=()=>reject(new Error('No se pudo procesar el logo'));
                img.onload=()=>{
                    const max=320, scale=Math.min(1,max/Math.max(img.width,img.height));
                    const canvas=document.createElement('canvas');
                    canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
                    const ctx=canvas.getContext('2d');
                    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
                    resolve(canvas.toDataURL('image/webp',0.82));
                };
                img.src=reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function modal(index=null){
        const c=index===null?{}:(S.cuentas||[])[index]||{};
        const title=index===null?'Nueva cuenta bancaria':'Editar cuenta bancaria';
        const overlay=document.createElement('div');overlay.className='overlay';overlay.id='cuenta-modal';
        overlay.innerHTML=`<div class="modal" style="max-width:640px;width:calc(100% - 28px);"><div class="modal-h"><div><h3>${title}</h3><span>Información para recibir pagos profesionales</span></div><button class="modal-close" type="button" id="cuenta-close">×</button></div><div class="modal-b" style="padding:18px;"><div class="form-grid-2">
        <div class="field"><label>Banco / entidad</label><input id="cta-banco" value="${safe(c.banco||'')}" placeholder="Ej. Banco Unión"></div>
        <div class="field"><label>Titular</label><input id="cta-titular" value="${safe(c.titular||S.datosPersonales?.nombre||'')}" placeholder="Nombre completo del titular"></div>
        <div class="field"><label>Tipo de cuenta</label><select id="cta-tipo"><option value="Caja de ahorro">Caja de ahorro</option><option value="Cuenta corriente">Cuenta corriente</option><option value="Otro">Otro</option></select></div>
        <div class="field"><label>Moneda</label><select id="cta-moneda"><option>BOB · Bolivianos</option><option>USD · Dólares</option><option>EUR · Euros</option></select></div>
        <div class="field full"><label>Número de cuenta</label><input id="cta-numero" inputmode="numeric" autocomplete="off" value="${safe(c.numero||'')}" placeholder="Número de cuenta"></div>
        <div class="field"><label>Alias / referencia</label><input id="cta-alias" value="${safe(c.alias||'')}" placeholder="Ej. Cuenta principal"></div>
        <div class="field"><label>Estado</label><select id="cta-activa"><option value="true">Activa</option><option value="false">Inactiva</option></select></div>
        <div class="field full"><label>Color del banco</label><div class="cta-color-row"><input id="cta-color" type="color" value="${validColor(c.color||DEFAULT_COLOR)}"><input id="cta-color-hex" value="${safe(validColor(c.color||DEFAULT_COLOR))}" maxlength="7" placeholder="#1A4A5C"><span id="cta-color-preview" class="cta-color-preview"></span></div><small class="cta-help">Este color será el fondo principal de la imagen que compartirás.</small></div>
        <div class="field full"><label>Logo del banco</label><div class="cta-logo-row"><label class="btn btn-ghost btn-sm cta-file-btn" for="cta-logo">▣ Seleccionar logo</label><input id="cta-logo" type="file" accept="image/png,image/jpeg,image/webp" style="display:none"><button type="button" class="btn btn-ghost btn-sm" id="cta-logo-remove" ${c.logo?'':'style="display:none"'}>Quitar logo</button><div class="cta-logo-preview" id="cta-logo-preview">${c.logo?`<img src="${safe(c.logo)}" alt="Logo del banco">`:'<span>Sin logo</span>'}</div></div><small class="cta-help">PNG, JPG o WebP. Se reduce automáticamente para no ocupar espacio innecesario.</small></div>
        <div class="field full"><label>Notas</label><textarea id="cta-notas" rows="3" placeholder="Información adicional">${safe(c.notas||'')}</textarea></div>
        </div><p class="cuenta-privacy">🔒 Esta información se guarda únicamente en tu cuenta de la aplicación. No registres claves, PIN ni credenciales bancarias.</p></div><div class="modal-foot"><button class="btn btn-ghost" id="cuenta-cancel">Cancelar</button><button class="btn btn-primary" id="cuenta-save">Guardar cuenta</button></div></div>`;
        document.body.appendChild(overlay);
        const set=(id,val)=>{const e=document.getElementById(id);if(e)e.value=val;};
        set('cta-tipo',c.tipo||'Caja de ahorro');set('cta-moneda',c.moneda||'BOB · Bolivianos');set('cta-activa',String(c.activa!==false));set('cta-color',validColor(c.color||DEFAULT_COLOR));set('cta-color-hex',validColor(c.color||DEFAULT_COLOR));
        const colorPreview=document.getElementById('cta-color-preview');
        const syncColor=v=>{const color=validColor(v);set('cta-color',color);set('cta-color-hex',color);if(colorPreview)colorPreview.style.background=color;};
        syncColor(c.color||DEFAULT_COLOR);
        document.getElementById('cta-color').oninput=e=>syncColor(e.target.value);
        document.getElementById('cta-color-hex').oninput=e=>{let v=e.target.value.trim();if(!v.startsWith('#'))v='#'+v;if(/^#[0-9a-f]{6}$/i.test(v))syncColor(v);};
        let logo=c.logo||'';
        const logoPreview=document.getElementById('cta-logo-preview'),removeLogo=document.getElementById('cta-logo-remove');
        const showLogo=src=>{logoPreview.innerHTML=src?`<img src="${safe(src)}" alt="Logo del banco">`:'<span>Sin logo</span>';removeLogo.style.display=src?'inline-flex':'none';};
        document.getElementById('cta-logo').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{logo=await compressLogo(file);showLogo(logo);}catch(err){alert(err.message||'No se pudo cargar el logo.');e.target.value='';}};
        removeLogo.onclick=()=>{logo='';showLogo('');document.getElementById('cta-logo').value='';};
        const close=()=>overlay.remove();document.getElementById('cuenta-close').onclick=close;document.getElementById('cuenta-cancel').onclick=close;
        document.getElementById('cuenta-save').onclick=async()=>{
            const banco=document.getElementById('cta-banco').value.trim(),numero=document.getElementById('cta-numero').value.trim(),titular=document.getElementById('cta-titular').value.trim();
            if(!banco||!numero||!titular){alert('Indica banco, titular y número de cuenta.');return;}
            const item={...c,id:c.id||uid(),banco,titular,tipo:document.getElementById('cta-tipo').value,moneda:document.getElementById('cta-moneda').value,numero,alias:document.getElementById('cta-alias').value.trim(),activa:document.getElementById('cta-activa').value==='true',color:validColor(document.getElementById('cta-color').value),logo,notas:document.getElementById('cta-notas').value.trim(),updatedAt:new Date().toISOString()};
            if(index===null)S.cuentas.push(item);else S.cuentas[index]=item;
            await saveCuentas(S.user?.uid);close();render();
        };
    }

    function roundRect(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
    function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines){const words=String(text||'').split(/\s+/);let line='',lines=[];for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;if(lines.length===maxLines-1)break;}else line=test;}if(line&&lines.length<maxLines)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));return y+lines.length*lineHeight;}
    function loadImage(src){return new Promise(resolve=>{if(!src)return resolve(null);const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});}

    async function generarImagenCuenta(index,share=false){
        const c=(S.cuentas||[])[index];if(!c)return;
        const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=720;const ctx=canvas.getContext('2d');
        const color=validColor(c.color||DEFAULT_COLOR), light=mix(color,.86), dark=mix(color,-.25), fg=contrastColor(color);
        const bg=ctx.createLinearGradient(0,0,1200,720);bg.addColorStop(0,dark);bg.addColorStop(1,color);ctx.fillStyle=bg;ctx.fillRect(0,0,1200,720);
        ctx.globalAlpha=.10;ctx.beginPath();ctx.arc(1060,80,230,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.beginPath();ctx.arc(1130,650,320,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
        roundRect(ctx,70,55,1060,610,30);ctx.fillStyle='rgba(255,255,255,.97)';ctx.fill();
        roundRect(ctx,70,55,1060,125,30);ctx.save();ctx.clip();ctx.fillStyle=color;ctx.fillRect(70,55,1060,125);ctx.restore();
        const logo=await loadImage(c.logo);
        if(logo){
            const maxW=130,maxH=80,scale=Math.min(maxW/logo.width,maxH/logo.height);const w=logo.width*scale,h=logo.height*scale;
            roundRect(ctx,105,78,150,80,16);ctx.fillStyle='#fff';ctx.fill();ctx.drawImage(logo,105+(150-w)/2,78+(80-h)/2,w,h);
        }
        ctx.fillStyle=fg;ctx.font='700 28px Inter, Arial, sans-serif';ctx.fillText('DATOS PARA TRANSFERENCIA',285,112);
        ctx.globalAlpha=.82;ctx.font='500 16px Inter, Arial, sans-serif';ctx.fillText('Ing. Antequera · Hidráulica · Hidrología',285,141);ctx.globalAlpha=1;
        roundRect(ctx,110,205,980,118,20);ctx.fillStyle=light;ctx.fill();
        ctx.fillStyle=dark;ctx.font='700 34px Inter, Arial, sans-serif';drawWrapped(ctx,c.banco||'Banco',145,255,700,42,2);
        ctx.fillStyle='#667780';ctx.font='500 17px Inter, Arial, sans-serif';ctx.fillText(`${c.tipo||'Cuenta'}  ·  ${c.moneda||''}`,145,296);
        ctx.fillStyle='#7A8A91';ctx.font='600 13px Inter, Arial, sans-serif';ctx.fillText('NÚMERO DE CUENTA',145,360);
        ctx.fillStyle='#173B47';ctx.font='700 34px "Courier New", monospace';ctx.fillText(String(c.numero||''),145,397);
        ctx.fillStyle='#7A8A91';ctx.font='600 13px Inter, Arial, sans-serif';ctx.fillText('TITULAR',145,455);
        ctx.fillStyle='#173B47';ctx.font='700 26px Inter, Arial, sans-serif';drawWrapped(ctx,c.titular||S.datosPersonales?.nombre||'',145,490,820,34,2);
        if(c.alias){ctx.fillStyle='#7A8A91';ctx.font='500 16px Inter, Arial, sans-serif';ctx.fillText(c.alias,145,560);}
        ctx.fillStyle=dark;ctx.font='600 16px Inter, Arial, sans-serif';ctx.fillText('Gracias por realizar el depósito / transferencia.',145,615);
        ctx.fillStyle='#9AA7AC';ctx.font='500 13px Inter, Arial, sans-serif';ctx.fillText('Compartido desde RNI 28.106',145,640);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',1));if(!blob)return;
        const filename=`cuenta-${String(c.banco||'banco').toLowerCase().replace(/[^a-z0-9]+/gi,'-')}.png`;
        if(share&&navigator.share){try{const file=new File([blob],filename,{type:'image/png'});if(!navigator.canShare||navigator.canShare({files:[file]})){await navigator.share({title:'Datos para transferencia',text:`${c.banco||'Banco'} · ${c.titular||''}`,files:[file]});return;}}catch(e){if(e?.name==='AbortError')return;}}
        const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }

    window.abrirCuenta=modal;
    window.generarImagenCuenta=generarImagenCuenta;
    window.compartirCuenta=async index=>generarImagenCuenta(index,true);
    window.eliminarCuenta=async function(index){const c=(S.cuentas||[])[index];if(!c)return;if(!confirm(`¿Eliminar la cuenta "${c.alias||c.banco}"?`))return;S.cuentas.splice(index,1);await saveCuentas(S.user?.uid);render();};

    window.renderCuentas=function(){
        const list=Array.isArray(S.cuentas)?S.cuentas:[],active=list.filter(x=>x.activa!==false).length;
        return `<div class="page-head"><div><p class="eyebrow">Gestión profesional</p><h1>Cuentas bancarias</h1><p>Datos de cuenta disponibles para tus cobros profesionales.</p></div><button class="btn btn-primary" onclick="abrirCuenta()">＋ Nueva cuenta</button></div>
        <div class="cuentas-summary"><div><span>Cuentas registradas</span><strong>${list.length}</strong></div><div><span>Activas</span><strong>${active}</strong></div><div><span>Monedas</span><strong>${new Set(list.map(x=>x.moneda).filter(Boolean)).size||0}</strong></div></div>
        <div class="cuentas-grid">${list.length?list.map((c,i)=>`<article class="cuenta-card ${c.activa===false?'inactive':''}"><div class="cuenta-top"><div class="bank-mark" style="background:${safe(validColor(c.color||DEFAULT_COLOR))}">${c.logo?`<img src="${safe(c.logo)}" alt="Logo">`:safe((c.banco||'B').slice(0,1).toUpperCase())}</div><div><h3>${safe(c.banco||'Banco')}</h3><span>${safe(c.tipo||'Cuenta')} · ${safe(c.moneda||'')}</span></div><span class="cuenta-status">${c.activa===false?'Inactiva':'Activa'}</span></div><div class="cuenta-number" style="border-left:4px solid ${safe(validColor(c.color||DEFAULT_COLOR))}"><small>NÚMERO DE CUENTA</small><strong>${safe(mask(c.numero))}</strong></div><div class="cuenta-meta"><div><span>Titular</span><strong>${safe(c.titular||'—')}</strong></div><div><span>Referencia</span><strong>${safe(c.alias||'Sin alias')}</strong></div></div><div class="cuenta-actions"><button class="btn btn-primary btn-sm" onclick="compartirCuenta(${i})">▣ WhatsApp / Compartir</button><button class="btn btn-ghost btn-sm" onclick="generarImagenCuenta(${i})">Imagen</button><button class="btn btn-ghost btn-sm" onclick="abrirCuenta(${i})">Editar</button><button class="btn btn-ghost btn-sm danger" onclick="eliminarCuenta(${i})">Eliminar</button></div></article>`).join(''):`<div class="cuentas-empty"><div class="empty-icon">₿</div><h3>Aún no tienes cuentas registradas</h3><p>Registra las cuentas que utilizas para recibir pagos por tus servicios profesionales.</p><button class="btn btn-primary" onclick="abrirCuenta()">＋ Registrar primera cuenta</button></div>`}</div>`;
    };

    const old=document.getElementById('cuentas-styles');if(old)old.remove();const style=document.createElement('style');style.id='cuentas-styles';style.textContent=`
    .cuentas-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.cuentas-summary>div{padding:16px 18px;border:1px solid var(--border);border-radius:14px;background:var(--panel);box-shadow:0 7px 20px rgba(0,0,0,.035)}.cuentas-summary span{display:block;color:var(--text-soft);font-size:10px;text-transform:uppercase;letter-spacing:.06em}.cuentas-summary strong{display:block;font-size:23px;margin-top:4px}.cuentas-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.cuenta-card{border:1px solid var(--border);border-radius:16px;background:linear-gradient(145deg,var(--panel),rgba(255,255,255,.012));padding:18px;box-shadow:0 9px 26px rgba(0,0,0,.045)}.cuenta-card.inactive{opacity:.7}.cuenta-top{display:flex;align-items:center;gap:11px}.bank-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:#fff;font-weight:700;font-size:18px;overflow:hidden}.bank-mark img{width:100%;height:100%;object-fit:contain;background:#fff;padding:5px}.cuenta-top h3{margin:0;font-size:15px}.cuenta-top span:not(.cuenta-status){font-size:10px;color:var(--text-soft)}.cuenta-status{margin-left:auto;font-size:9px!important;text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;border-radius:20px;background:var(--gantt-bg);color:var(--text-soft)}.cuenta-number{margin:22px 0 16px;padding:15px;border-radius:12px;background:var(--gantt-bg)}.cuenta-number small,.cuenta-meta span{display:block;color:var(--text-soft);font-size:9px;text-transform:uppercase;letter-spacing:.07em}.cuenta-number strong{display:block;margin-top:5px;font:600 19px 'JetBrains Mono',monospace;letter-spacing:.05em}.cuenta-meta{display:grid;grid-template-columns:1fr 1fr;gap:15px}.cuenta-meta strong{display:block;margin-top:4px;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cuenta-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:17px;padding-top:13px;border-top:1px solid var(--border)}.cuenta-actions .danger{color:var(--danger)}.cuentas-empty{grid-column:1/-1;text-align:center;padding:55px 20px;border:1px dashed var(--border);border-radius:16px}.empty-icon{font-size:28px;color:var(--accent)}.cuentas-empty p{color:var(--text-soft);max-width:450px;margin:6px auto 18px}.cuenta-privacy{font-size:10px;color:var(--text-soft);margin:14px 0 0}.form-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:13px}.form-grid-2 .full{grid-column:1/-1}.cta-color-row{display:flex;align-items:center;gap:9px}.cta-color-row input[type=color]{width:48px;height:38px;padding:3px;border:1px solid var(--border);border-radius:9px;background:var(--panel);cursor:pointer}.cta-color-row input[type=text],.cta-color-row input:not([type]){flex:1}.cta-color-row #cta-color-hex{max-width:120px}.cta-color-preview{width:38px;height:38px;border-radius:9px;border:1px solid rgba(0,0,0,.08)}.cta-help{display:block;margin-top:5px;font-size:10px;color:var(--text-soft)}.cta-logo-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cta-file-btn{cursor:pointer}.cta-logo-preview{width:74px;height:48px;border:1px dashed var(--border);border-radius:9px;display:grid;place-items:center;overflow:hidden;color:var(--text-soft);font-size:9px}.cta-logo-preview img{width:100%;height:100%;object-fit:contain;padding:5px;background:#fff}@media(max-width:700px){.cuentas-grid,.cuentas-summary{grid-template-columns:1fr}.form-grid-2{grid-template-columns:1fr}.form-grid-2 .full{grid-column:auto}.cuenta-actions{justify-content:stretch}.cuenta-actions button{flex:1 1 45%}.cta-color-row{flex-wrap:nowrap}}
    `;document.head.appendChild(style);
})();
