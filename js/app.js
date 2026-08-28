// ============================================================
// INICIO DE LA APLICACIÓN
// ============================================================

// Exponer funciones globales
window.openPagoFromCotizacion = openPagoFromCotizacion;
window.toggleCotSort = toggleCotSort;
window.togglePagoSort = togglePagoSort;
window.toggleExpSort = toggleExpSort;
window.toggleLicSort = toggleLicSort;
window.toggleContSort = toggleContSort;
window.toggleActSort = toggleActSort;
window.toggleDocSort = toggleDocSort;
window.clearCotFilters = clearCotFilters;
window.clearPagoFilters = clearPagoFilters;
window.clearExpFilters = clearExpFilters;
window.clearLicFilters = clearLicFilters;
window.clearContFilters = clearContFilters;
window.clearActFilters = clearActFilters;
window.clearDocFilters = clearDocFilters;
window.calcularEdad = calcularEdad;
window.openColumnSelectorModal = openColumnSelectorModal;
window.exportDebtsWithColumns = exportDebtsWithColumns;
window.exportDebts = exportDebts;

// Funciones de pagos (definidas en app.js)
window.editarPagoHistorial = editarPagoHistorial;
window.eliminarPagoHistorial = eliminarPagoHistorial;
window.eliminarPagoPrincipal = eliminarPagoPrincipal;
window.abrirCotizacion = abrirCotizacion;
window.togglePagoDetalle = togglePagoDetalle;
window.openRegisterPagoModalFromDetalle = openRegisterPagoModalFromDetalle;

// Funciones de actividades (definidas en modals.js)
window.verActividadDetalle = verActividadDetalle;
window.openActModal = openActModal;

// Funciones de documentos (definidas en modals.js)
window.openDocModal = openDocModal;
window.verDocumento = verDocumento;

// Funciones de depuración
window.debugPagosDeuda = debugPagosDeuda;

// ============================================================
// FUNCIONES DE PAGOS (definiciones)
// ============================================================

// ---- FUNCIÓN PARA ELIMINAR UN PAGO DEL HISTORIAL ----
async function eliminarPagoHistorial(pagoId) {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar este pago registrado?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const pagoIndex = S.pagos.findIndex(p => p.id === pagoId);
        if (pagoIndex === -1) {
            toast('⚠️ No se encontró el pago.');
            return;
        }
        
        const pagoEliminado = S.pagos[pagoIndex];
        const montoEliminado = Number(pagoEliminado.montoPagado || 0);
        
        let pagoPrincipal = null;
        let pagoPrincipalIndex = -1;
        
        if (pagoEliminado.cotizacionId) {
            pagoPrincipalIndex = S.pagos.findIndex(p => 
                p.cotizacionId === pagoEliminado.cotizacionId && 
                p.id !== pagoId &&
                Number(p.monto) > 0
            );
            if (pagoPrincipalIndex !== -1) {
                pagoPrincipal = S.pagos[pagoPrincipalIndex];
            }
        }
        
        S.pagos.splice(pagoIndex, 1);
        
        if (pagoPrincipal && pagoPrincipalIndex !== -1) {
            const nuevoMontoPagado = Math.max(0, (Number(pagoPrincipal.montoPagado || 0) - montoEliminado));
            pagoPrincipal.montoPagado = nuevoMontoPagado;
            const notaEliminacion = `❌ Pago de ${bs(montoEliminado)} eliminado (${fmtDate(new Date().toISOString())})`;
            pagoPrincipal.notas = pagoPrincipal.notas ? pagoPrincipal.notas + '\n' + notaEliminacion : notaEliminacion;
            S.pagos[pagoPrincipalIndex] = pagoPrincipal;
        }
        
        await savePagos(S.user?.uid);
        
        if (S.expandedPagoId === pagoEliminado.cotizacionId || S.expandedPagoId === pagoId) {
            const principal = S.pagos.find(p => 
                p.cotizacionId === pagoEliminado.cotizacionId && 
                Number(p.monto) > 0
            );
            S.expandedPagoId = principal ? principal.id : null;
        }
        
        toast('✅ Pago eliminado correctamente.');
        render();
    } catch (error) {
        console.error('Error al eliminar pago:', error);
        toast('❌ Error al eliminar el pago.');
    }
}

// ---- FUNCIÓN PARA EDITAR UN PAGO DEL HISTORIAL ----
async function editarPagoHistorial(pagoId) {
    const pago = S.pagos.find(p => p.id === pagoId);
    if (!pago) {
        toast('⚠️ No se encontró el pago.');
        return;
    }

    const esPrincipal = S.pagos.some(p => 
        p.cotizacionId === pago.cotizacionId && 
        p.id !== pagoId &&
        Number(p.monto) > 0
    );
    
    if (!esPrincipal) {
        toast('⚠️ Este es el pago principal. Edita la deuda directamente.');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:580px;">
            <div class="modal-h">
                <h3>✏️ Editar pago registrado</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="field">
                    <label>Descripción</label>
                    <input id="ep-desc" value="${attr(pago.descripcion)}" placeholder="Descripción del pago">
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Monto pagado [Bs]</label>
                        <input type="number" step="0.01" id="ep-monto" value="${pago.montoPagado}">
                    </div>
                    <div class="field">
                        <label>Fecha del pago</label>
                        <input type="date" id="ep-fecha" value="${pago.fecha}">
                    </div>
                </div>
                <div class="row2">
                    <div class="field">
                        <label>Método de pago</label>
                        <select id="ep-metodo">
                            <option value="">Seleccionar...</option>
                            <option value="efectivo" ${pago.metodoPago === 'efectivo' ? 'selected' : ''}>💵 Efectivo</option>
                            <option value="transferencia" ${pago.metodoPago === 'transferencia' ? 'selected' : ''}>🏦 Transferencia bancaria</option>
                            <option value="deposito" ${pago.metodoPago === 'deposito' ? 'selected' : ''}>🏛️ Depósito</option>
                            <option value="cheque" ${pago.metodoPago === 'cheque' ? 'selected' : ''}>📄 Cheque</option>
                            <option value="otro" ${pago.metodoPago === 'otro' ? 'selected' : ''}>📌 Otro</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Número de comprobante</label>
                        <input id="ep-comprobante" value="${attr(pago.comprobante)}" placeholder="Ej. TRANS-001">
                    </div>
                </div>
                <div class="field">
                    <label>Notas</label>
                    <textarea id="ep-notas" rows="2">${esc(pago.notas||'')}</textarea>
                </div>
                <div style="font-size:12px;color:var(--text-soft);padding:8px 10px;background:var(--gantt-bg);border-radius:4px;margin-top:8px;">
                    <strong>⚠️ Importante:</strong> Al editar el monto, se recalculará automáticamente el saldo de la deuda principal.
                </div>
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
                <button class="btn btn-primary" id="m-save">💾 Guardar cambios</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };

    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-cancel').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });

    overlay.querySelector('#m-save').onclick = async () => {
        const nuevoMonto = Number(overlay.querySelector('#ep-monto').value) || 0;
        const nuevaDesc = overlay.querySelector('#ep-desc').value.trim();
        const nuevaFecha = overlay.querySelector('#ep-fecha').value;
        const nuevoMetodo = overlay.querySelector('#ep-metodo').value;
        const nuevoComprobante = overlay.querySelector('#ep-comprobante').value.trim();
        const nuevasNotas = overlay.querySelector('#ep-notas').value.trim();

        if (nuevoMonto <= 0) {
            toast('⚠️ El monto debe ser mayor a cero.');
            return;
        }

        const montoAnterior = Number(pago.montoPagado || 0);
        const diferencia = nuevoMonto - montoAnterior;

        const pagoIndex = S.pagos.findIndex(p => p.id === pagoId);
        if (pagoIndex !== -1) {
            S.pagos[pagoIndex].descripcion = nuevaDesc || S.pagos[pagoIndex].descripcion;
            S.pagos[pagoIndex].montoPagado = nuevoMonto;
            S.pagos[pagoIndex].fecha = nuevaFecha || S.pagos[pagoIndex].fecha;
            S.pagos[pagoIndex].metodoPago = nuevoMetodo || S.pagos[pagoIndex].metodoPago;
            S.pagos[pagoIndex].comprobante = nuevoComprobante || S.pagos[pagoIndex].comprobante;
            S.pagos[pagoIndex].notas = nuevasNotas || S.pagos[pagoIndex].notas;
        }

        if (diferencia !== 0 && pago.cotizacionId) {
            const pagoPrincipal = S.pagos.find(p => 
                p.cotizacionId === pago.cotizacionId && 
                p.id !== pagoId &&
                Number(p.monto) > 0
            );
            
            if (pagoPrincipal) {
                const nuevoTotal = Math.max(0, (Number(pagoPrincipal.montoPagado || 0) + diferencia));
                pagoPrincipal.montoPagado = nuevoTotal;
                
                const notaEdicion = `✏️ Pago editado: ${bs(montoAnterior)} → ${bs(nuevoMonto)} (${fmtDate(new Date().toISOString())})`;
                pagoPrincipal.notas = pagoPrincipal.notas ? pagoPrincipal.notas + '\n' + notaEdicion : notaEdicion;
                
                const principalIndex = S.pagos.findIndex(p => p.id === pagoPrincipal.id);
                if (principalIndex !== -1) {
                    S.pagos[principalIndex] = pagoPrincipal;
                }
            }
        }

        await savePagos(S.user?.uid);
        closeModal();
        S.expandedPagoId = pago.cotizacionId ? 
            S.pagos.find(p => p.cotizacionId === pago.cotizacionId && Number(p.monto) > 0)?.id : 
            null;
        render();
        toast('✅ Pago actualizado correctamente.');
    };
}

// ---- FUNCIÓN PARA ELIMINAR LA DEUDA PRINCIPAL ----
async function eliminarPagoPrincipal(pagoId) {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar esta deuda y todos sus pagos asociados?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const pagoIndex = S.pagos.findIndex(p => p.id === pagoId);
        if (pagoIndex === -1) {
            toast('⚠️ No se encontró la deuda.');
            return;
        }
        
        const pagoEliminado = S.pagos[pagoIndex];
        const pagosAsociados = S.pagos.filter(p => p.cotizacionId === pagoEliminado.cotizacionId && p.id !== pagoId);
        const idsAEliminar = pagosAsociados.map(p => p.id);
        
        S.pagos = S.pagos.filter(p => p.id !== pagoId && !idsAEliminar.includes(p.id));
        await savePagos(S.user?.uid);
        
        toast('✅ Deuda y pagos asociados eliminados correctamente.');
        S.expandedPagoId = null;
        render();
    } catch (error) {
        console.error('Error al eliminar deuda:', error);
        toast('❌ Error al eliminar la deuda.');
    }
}

// ---- FUNCIÓN PARA ABRIR COTIZACIÓN ----
function abrirCotizacion(cotId) {
    if (!cotId) {
        toast('⚠️ No hay cotización asociada.');
        return;
    }
    S.view = 'cotizaciones';
    render();
    setTimeout(() => {
        const editBtn = document.querySelector(`[data-edit-cot="${cotId}"]`);
        if (editBtn) {
            editBtn.click();
        } else {
            toast('⚠️ No se encontró la cotización para editar.');
        }
    }, 200);
}

// ---- FUNCIÓN PARA ALTERNAR DETALLE DE PAGO ----
function togglePagoDetalle(pagoId) {
    if (S.expandedPagoId === pagoId) {
        S.expandedPagoId = null;
    } else {
        S.expandedPagoId = pagoId;
    }
    render();
}

// ---- FUNCIÓN PARA REGISTRAR PAGO DESDE EL DETALLE ----
function openRegisterPagoModalFromDetalle(pagoId) {
    const pago = S.pagos.find(p => p.id === pagoId);
    if (!pago) {
        toast('⚠️ No se encontró el pago.');
        return;
    }
    openRegisterPagoModal(pago);
}

// ---- FUNCIÓN DE DEPURACIÓN ----
function debugPagosDeuda(pagoId) {
    const pago = S.pagos.find(p => p.id === pagoId);
    if (!pago) {
        console.log('❌ Pago no encontrado');
        return;
    }
    
    console.log('🔍 === DEBUG PAGOS DEUDA ===');
    console.log('Pago principal:', pago);
    console.log('cotizacionId:', pago.cotizacionId);
    
    const asociados = S.pagos.filter(p => 
        p.cotizacionId === pago.cotizacionId && 
        p.id !== pago.id
    );
    console.log('Pagos asociados por cotizacionId:', asociados);
    
    const porCliente = S.pagos.filter(p => 
        p.cliente === pago.cliente && 
        p.id !== pago.id &&
        Number(p.montoPagado || 0) > 0
    );
    console.log('Pagos por cliente:', porCliente);
    
    console.log('Total de pagos en S.pagos:', S.pagos.length);
    console.log('🔍 === FIN DEBUG ===');
}

// ---- FUNCIÓN PARA MOSTRAR ACTIVIDAD (FALLBACK) ----
function mostrarActividadSimple(act) {
    const tipoInfo = TIPOS_ACTIVIDAD[act.tipo] || TIPOS_ACTIVIDAD.otro;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:600px;">
            <div class="modal-h">
                <h3>${tipoInfo.icon} Detalle de actividad</h3>
                <button class="close" id="m-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
                    <div><strong>Título:</strong></div>
                    <div style="font-weight:600;">${esc(act.titulo)}</div>
                    <div><strong>Tipo:</strong></div>
                    <div><span style="color:${tipoInfo.color};">${tipoInfo.icon} ${tipoInfo.label}</span></div>
                    <div><strong>Fecha:</strong></div>
                    <div>${fmtDate(act.fecha)}</div>
                    <div><strong>Cliente:</strong></div>
                    <div>${esc(act.cliente||'—')}</div>
                    <div><strong>Proyecto:</strong></div>
                    <div>${esc(act.proyecto||'—')}</div>
                    <div><strong>Ubicación:</strong></div>
                    <div>${esc(act.ubicacion||'—')}</div>
                    ${act.duracion ? `<div><strong>Duración:</strong></div><div>${esc(act.duracion)}</div>` : ''}
                    ${act.costo ? `<div><strong>Costo:</strong></div><div>${bs(act.costo)}</div>` : ''}
                    ${act.participantes ? `<div><strong>Participantes:</strong></div><div>${esc(act.participantes)}</div>` : ''}
                </div>
                ${act.observaciones ? `
                    <div style="margin-top:12px;padding:10px;background:var(--gantt-bg);border-radius:4px;">
                        <strong>Observaciones:</strong>
                        <div style="margin-top:4px;white-space:pre-wrap;font-size:13px;">${esc(act.observaciones)}</div>
                    </div>
                ` : ''}
                ${act.resultados ? `
                    <div style="margin-top:10px;padding:10px;background:#E8F5E9;border-radius:4px;border-left:4px solid var(--success);">
                        <strong>✅ Resultados / Acuerdos:</strong>
                        <div style="margin-top:4px;white-space:pre-wrap;font-size:13px;">${esc(act.resultados)}</div>
                    </div>
                ` : ''}
            </div>
            <div class="modal-foot">
                <button class="btn btn-ghost" id="m-close-btn">Cerrar</button>
                <button class="btn btn-primary" data-edit-act="${act.id}">✏️ Editar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    const closeModal = () => {
        if (overlay && overlay.parentNode) overlay.remove();
    };
    
    overlay.querySelector('#m-close').onclick = closeModal;
    overlay.querySelector('#m-close-btn').onclick = closeModal;
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });
    
    overlay.querySelector('[data-edit-act]').onclick = () => {
        closeModal();
        if (typeof openActModal === 'function') {
            openActModal(act);
        }
    };
}

// ============================================================
// BIND APP EVENTS - Manejadores de eventos
// ============================================================

function bindAppEvents() {
    const main = document.getElementById('main');

    document.getElementById('btn-logout').onclick = logout;

    // --- GANTT ---
    const ganttInput = document.getElementById('gantt-years');
    const ganttBtn = document.getElementById('btn-update-gantt');
    if (ganttInput && ganttBtn) {
        ganttBtn.onclick = () => {
            const val = parseInt(ganttInput.value);
            if (val > 0 && val <= 30) {
                S.ganttYears = val;
                render();
                toast('📊 Gantt actualizado a ' + val + ' años');
            } else {
                toast('Ingresa un valor entre 1 y 30');
            }
        };
        ganttInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') ganttBtn.click();
        });
    }

    const showEduc = document.getElementById('gantt-show-educ');
    const showCursos = document.getElementById('gantt-show-cursos');
    if (showEduc) {
        showEduc.onchange = () => {
            S.ganttShowEducacion = showEduc.checked;
            render();
        };
    }
    if (showCursos) {
        showCursos.onchange = () => {
            S.ganttShowCursos = showCursos.checked;
            render();
        };
    }

    // --- CV ---
    const btnEditCV = document.getElementById('btn-edit-cv');
    if (btnEditCV) {
        btnEditCV.onclick = () => {
            S.editingCV = !S.editingCV;
            render();
        };
    }

    const btnSaveCV = document.getElementById('btn-save-cv');
    if (btnSaveCV) {
        btnSaveCV.onclick = async () => {
            S.datosPersonales.nombre = document.getElementById('cv-nombre').value.trim();
            S.datosPersonales.ci = document.getElementById('cv-ci').value.trim();
            S.datosPersonales.lugarExpedicion = document.getElementById('cv-lugar').value.trim();
            S.datosPersonales.fechaNacimiento = document.getElementById('cv-fecha-nac').value;
            S.datosPersonales.nacionalidad = document.getElementById('cv-nacionalidad').value.trim();
            S.datosPersonales.profesion = document.getElementById('cv-profesion').value.trim();
            S.datosPersonales.registroProfesional = document.getElementById('cv-rni').value.trim();

            const formacionRows = document.querySelectorAll('#cv-formacion-container .row4');
            S.formacion = [];
            formacionRows.forEach(row => {
                const institucion = row.querySelector('.cv-f-institucion').value.trim();
                const desde = row.querySelector('.cv-f-desde').value;
                const hasta = row.querySelector('.cv-f-hasta').value;
                const grado = row.querySelector('.cv-f-grado').value.trim();
                if (institucion && grado) {
                    S.formacion.push({ institucion, desde, hasta, grado, titulo: '' });
                }
            });

            const cursosRows = document.querySelectorAll('#cv-cursos-container .row4');
            S.cursos = [];
            cursosRows.forEach(row => {
                const institucion = row.querySelector('.cv-c-institucion').value.trim();
                const desde = row.querySelector('.cv-c-desde').value;
                const hasta = row.querySelector('.cv-c-hasta').value;
                const curso = row.querySelector('.cv-c-curso').value.trim();
                const horas = Number(row.querySelector('.cv-c-horas').value) || 0;
                if (institucion && curso) {
                    S.cursos.push({ institucion, desde, hasta, curso, horas });
                }
            });

            await saveDatosPersonales(S.user?.uid);
            await saveFormacion(S.user?.uid);
            await saveCursos(S.user?.uid);

            S.editingCV = false;
            render();
            toast('✅ Hoja de vida actualizada correctamente.');
        };
    }

    const btnAddFormacion = document.getElementById('cv-add-formacion');
    if (btnAddFormacion) {
        btnAddFormacion.onclick = () => {
            const container = document.getElementById('cv-formacion-container');
            const div = document.createElement('div');
            div.className = 'row4';
            div.style.marginBottom = '8px';
            div.style.alignItems = 'center';
            div.innerHTML = `
                <input placeholder="Institución" class="cv-f-institucion">
                <input type="date" class="cv-f-desde">
                <input type="date" class="cv-f-hasta">
                <input placeholder="Grado" class="cv-f-grado">
                <button class="btn btn-sm btn-danger cv-f-remove" style="padding:4px 8px;">✕</button>
            `;
            container.appendChild(div);
        };
    }

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cv-f-remove')) {
            const row = e.target.closest('.row4');
            if (row && document.querySelectorAll('#cv-formacion-container .row4').length > 1) {
                row.remove();
            } else {
                toast('Debe haber al menos una formación.');
            }
        }
        if (e.target.classList.contains('cv-c-remove')) {
            const row = e.target.closest('.row4');
            if (row && document.querySelectorAll('#cv-cursos-container .row4').length > 1) {
                row.remove();
            } else {
                toast('Debe haber al menos un curso.');
            }
        }
    });

    const btnAddCurso = document.getElementById('cv-add-curso');
    if (btnAddCurso) {
        btnAddCurso.onclick = () => {
            const container = document.getElementById('cv-cursos-container');
            const div = document.createElement('div');
            div.className = 'row4';
            div.style.marginBottom = '8px';
            div.style.alignItems = 'center';
            div.innerHTML = `
                <input placeholder="Institución" class="cv-c-institucion">
                <input type="date" class="cv-c-desde">
                <input type="date" class="cv-c-hasta">
                <input placeholder="Curso" class="cv-c-curso">
                <input type="number" placeholder="Horas" class="cv-c-horas" style="width:70px;">
                <button class="btn btn-sm btn-danger cv-c-remove" style="padding:4px 8px;">✕</button>
            `;
            container.appendChild(div);
        };
    }

    // --- COTIZACIONES ---
    const btnNewCot = document.getElementById('btn-new-cot');
    if (btnNewCot) btnNewCot.onclick = () => openCotModal(null);
    main.querySelectorAll('[data-edit-cot]').forEach(b => b.onclick = () => openCotModal(S.cotizaciones.find(c => c.id === b.dataset.editCot)));
    main.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => exportPDF(S.cotizaciones.find(c => c.id === b.dataset.pdf)));
    main.querySelectorAll('[data-dup-cot]').forEach(b => b.onclick = async () => {
        const orig = S.cotizaciones.find(c => c.id === b.dataset.dupCot);
        if (!orig) return;
        const copy = JSON.parse(JSON.stringify(orig));
        copy.id = uid();
        copy.items = copy.items.map(it => ({ ...it, id: uid() }));
        copy.estado = 'borrador';
        copy.fecha = new Date().toISOString().slice(0, 10);
        S.cotizaciones.push(copy);
        await saveCotizaciones(S.user?.uid);
        render();
        toast('✅ Cotización duplicada.');
    });
    main.querySelectorAll('[data-del-cot]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Eliminar esta cotización?')) return;
        S.cotizaciones = S.cotizaciones.filter(c => c.id !== b.dataset.delCot);
        await saveCotizaciones(S.user?.uid);
        render();
        toast('Cotización eliminada.');
    });

    // --- PAGOS ---
    main.querySelectorAll('[data-register-pago]').forEach(b => {
        b.onclick = () => {
            const pago = S.pagos.find(p => p.id === b.dataset.registerPago);
            if (pago) openRegisterPagoModal(pago);
        };
    });
    main.querySelectorAll('[data-edit-pago]').forEach(b => b.onclick = () => openPagoModal(S.pagos.find(p => p.id === b.dataset.editPago)));
    main.querySelectorAll('[data-del-pago]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Eliminar este registro de pago?')) return;
        S.pagos = S.pagos.filter(p => p.id !== b.dataset.delPago);
        await savePagos(S.user?.uid);
        render();
        toast('Registro eliminado.');
    });
    const btnNewPago = document.getElementById('btn-new-pago');
    if (btnNewPago) btnNewPago.onclick = () => openPagoModal(null);

    // --- DOCUMENTOS ---
    const btnNewDoc = document.getElementById('btn-new-doc');
    if (btnNewDoc) btnNewDoc.onclick = () => openDocModal(null);
    const btnNewDocEmpty = document.getElementById('btn-new-doc-empty');
    if (btnNewDocEmpty) btnNewDocEmpty.onclick = () => openDocModal(null);
    
    main.querySelectorAll('[data-edit-doc]').forEach(b => b.onclick = () => openDocModal(S.documentos.find(d => d.id === b.dataset.editDoc)));
    main.querySelectorAll('[data-del-doc]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Eliminar este documento?')) return;
        S.documentos = S.documentos.filter(d => d.id !== b.dataset.delDoc);
        await saveDocumentos(S.user?.uid);
        render();
        toast('Documento eliminado.');
    });
    main.querySelectorAll('[data-ver-doc]').forEach(b => b.onclick = () => verDocumento(b.dataset.verDoc));

    // --- CLIENTES ---
    const btnAddCliente = document.getElementById('btn-add-cliente');
    if (btnAddCliente) btnAddCliente.onclick = async () => {
        const val = document.getElementById('new-cliente-nombre').value.trim();
        if (!val) { toast('Escribe un nombre de cliente.'); return; }
        let cli = S.clientes.find(c => c.nombre.toLowerCase() === val.toLowerCase());
        if (!cli) { cli = { id: uid(), nombre: val, proyectos: [] };
            S.clientes.push(cli);
            await saveClientes(S.user?.uid); }
        render();
        toast('Cliente agregado.');
    };
    main.querySelectorAll('[data-del-cliente]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Eliminar este cliente?')) return;
        S.clientes = S.clientes.filter(c => c.id !== b.dataset.delCliente);
        await saveClientes(S.user?.uid);
        render();
        toast('Cliente eliminado.');
    });
    main.querySelectorAll('[data-del-proy]').forEach(b => b.onclick = async () => {
        const [cid, proy] = b.dataset.delProy.split('::');
        const cli = S.clientes.find(c => c.id === cid);
        if (cli) { cli.proyectos = cli.proyectos.filter(p => p !== proy);
            await saveClientes(S.user?.uid);
            render(); }
    });
    main.querySelectorAll('[data-add-proy]').forEach(b => b.onclick = async () => {
        const cid = b.dataset.addProy;
        const input = main.querySelector(`[data-new-proy-input="${cid}"]`);
        if (!input) return;
        const val = input.value.trim();
        if (!val) return;
        const cli = S.clientes.find(c => c.id === cid);
        if (cli && !cli.proyectos.some(p => p.toLowerCase() === val.toLowerCase())) {
            cli.proyectos.push(val);
            await saveClientes(S.user?.uid);
            render();
            toast('Proyecto agregado.');
        }
    });

    // --- EXPERIENCIA ---
    const btnNewExp = document.getElementById('btn-new-exp');
    if (btnNewExp) btnNewExp.onclick = () => openExpModal(null);
    main.querySelectorAll('[data-edit-exp]').forEach(b => b.onclick = () => openExpModal(S.experiencia.find(e => e.id === b.dataset.editExp)));
    main.querySelectorAll('[data-del-exp]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Eliminar este proyecto?')) return;
        S.experiencia = S.experiencia.filter(e => e.id !== b.dataset.delExp);
        await saveExperiencia(S.user?.uid);
        render();
        toast('Proyecto eliminado.');
    });
    const btnExport = document.getElementById('btn-export-excel');
    if (btnExport) btnExport.onclick = exportHojaVida;
    const btnImport = document.getElementById('btn-import-excel');
    if (btnImport) btnImport.onclick = openImportModal;

    // --- WORD EXPORT ---
    const btnA5 = document.getElementById('btn-word-a5');
    if (btnA5) btnA5.onclick = () => exportWord('a5');
    const btnA7 = document.getElementById('btn-word-a7');
    if (btnA7) btnA7.onclick = () => exportWord('a7');
    const btnPart = document.getElementById('btn-word-participacion');
    if (btnPart) btnPart.onclick = () => exportWord('participacion');

    // --- LICITACIONES ---
    const btnNewLic = document.getElementById('btn-new-lic');
    if (btnNewLic) btnNewLic.onclick = () => openLicModal(null);
    main.querySelectorAll('[data-edit-lic]').forEach(b => b.onclick = () => openLicModal(S.licitaciones.find(l => l.id === b.dataset.editLic)));
    main.querySelectorAll('[data-del-lic]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Eliminar esta licitación?')) return;
        S.licitaciones = S.licitaciones.filter(l => l.id !== b.dataset.delLic);
        await saveLicitaciones(S.user?.uid);
        render();
        toast('Licitación eliminada.');
    });
    const btnExpLic = document.getElementById('btn-export-lic-excel');
    if (btnExpLic) btnExpLic.onclick = exportLicitacionesExcel;

    // --- CONTACTOS ---
    const btnNewCont = document.getElementById('btn-new-cont');
    if (btnNewCont) btnNewCont.onclick = () => openContModal(null);
    main.querySelectorAll('[data-edit-cont]').forEach(b => b.onclick = () => openContModal(S.contactos.find(c => c.id === b.dataset.editCont)));
    main.querySelectorAll('[data-del-cont]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Eliminar este contacto?')) return;
        S.contactos = S.contactos.filter(c => c.id !== b.dataset.delCont);
        await saveContactos(S.user?.uid);
        render();
        toast('Contacto eliminado.');
    });
    const btnExpCont = document.getElementById('btn-export-cont-excel');
    if (btnExpCont) btnExpCont.onclick = exportContactosExcel;

    // --- ACTIVIDADES ---
    const btnNewActividad = document.getElementById('btn-new-actividad');
    if (btnNewActividad) btnNewActividad.onclick = () => openActModal(null);
    main.querySelectorAll('[data-edit-act]').forEach(b => b.onclick = () => openActModal(S.actividades.find(a => a.id === b.dataset.editAct)));
    main.querySelectorAll('[data-del-act]').forEach(b => b.onclick = async () => {
        if (!confirm('¿Eliminar esta actividad?')) return;
        S.actividades = S.actividades.filter(a => a.id !== b.dataset.delAct);
        await saveActividades(S.user?.uid);
        render();
        toast('Actividad eliminada.');
    });
    
    // ========== EVENTO PARA VER DETALLE DE ACTIVIDAD ==========
    main.querySelectorAll('[data-ver-act]').forEach(b => {
        b.onclick = (e) => {
            e.preventDefault();
            const actId = b.dataset.verAct;
            if (actId) {
                if (typeof verActividadDetalle === 'function') {
                    verActividadDetalle(actId);
                } else if (typeof window.verActividadDetalle === 'function') {
                    window.verActividadDetalle(actId);
                } else {
                    const act = S.actividades.find(a => a.id === actId);
                    if (act) {
                        mostrarActividadSimple(act);
                    } else {
                        toast('⚠️ Actividad no encontrada.');
                    }
                }
            }
        };
    });

    // --- FILTROS ---
    const cotFilterApply = document.getElementById('cot-filter-apply');
    if (cotFilterApply) {
        cotFilterApply.onclick = () => {
            S.cotFilters.fecha = document.getElementById('cot-filter-fecha').value || '';
            S.cotFilters.cliente = document.getElementById('cot-filter-cliente').value || '';
            S.cotFilters.estado = document.getElementById('cot-filter-estado').value || '';
            render();
            toast('🔍 Filtros aplicados');
        };
    }
    const cotFilterClear = document.getElementById('cot-filter-clear');
    if (cotFilterClear) cotFilterClear.onclick = clearCotFilters;

    const pagoFilterApply = document.getElementById('pago-filter-apply');
    if (pagoFilterApply) {
        pagoFilterApply.onclick = () => {
            S.pagoFilters.fecha = document.getElementById('pago-filter-fecha').value || '';
            S.pagoFilters.cliente = document.getElementById('pago-filter-cliente').value || '';
            S.pagoFilters.estado = document.getElementById('pago-filter-estado').value || '';
            render();
            toast('🔍 Filtros aplicados');
        };
    }
    const pagoFilterClear = document.getElementById('pago-filter-clear');
    if (pagoFilterClear) pagoFilterClear.onclick = clearPagoFilters;

    const expFilterApply = document.getElementById('exp-filter-apply');
    if (expFilterApply) {
        expFilterApply.onclick = () => {
            S.expFilters.entidad = document.getElementById('exp-filter-entidad').value || '';
            S.expFilters.objeto = document.getElementById('exp-filter-objeto').value || '';
            S.expFilters.cargo = document.getElementById('exp-filter-cargo').value || '';
            S.expFilters.desde = document.getElementById('exp-filter-desde').value || '';
            S.expFilters.hasta = document.getElementById('exp-filter-hasta').value || '';
            render();
            toast('🔍 Filtros aplicados');
        };
    }
    const expFilterClear = document.getElementById('exp-filter-clear');
    if (expFilterClear) expFilterClear.onclick = clearExpFilters;

    const licFilterApply = document.getElementById('lic-filter-apply');
    if (licFilterApply) {
        licFilterApply.onclick = () => {
            S.licFilters.convocatoria = document.getElementById('lic-filter-convocatoria').value || '';
            S.licFilters.proyecto = document.getElementById('lic-filter-proyecto').value || '';
            S.licFilters.entidad = document.getElementById('lic-filter-entidad').value || '';
            S.licFilters.estado = document.getElementById('lic-filter-estado').value || '';
            render();
            toast('🔍 Filtros aplicados');
        };
    }
    const licFilterClear = document.getElementById('lic-filter-clear');
    if (licFilterClear) licFilterClear.onclick = clearLicFilters;

    const contFilterApply = document.getElementById('cont-filter-apply');
    if (contFilterApply) {
        contFilterApply.onclick = () => {
            S.contFilters.nombre = document.getElementById('cont-filter-nombre').value || '';
            S.contFilters.empresa = document.getElementById('cont-filter-empresa').value || '';
            S.contFilters.cargo = document.getElementById('cont-filter-cargo').value || '';
            render();
            toast('🔍 Filtros aplicados');
        };
    }
    const contFilterClear = document.getElementById('cont-filter-clear');
    if (contFilterClear) contFilterClear.onclick = clearContFilters;

    const actFilterApply = document.getElementById('act-filter-apply');
    if (actFilterApply) {
        actFilterApply.onclick = () => {
            S.actFilters.tipo = document.getElementById('act-filter-tipo').value || '';
            S.actFilters.fecha = document.getElementById('act-filter-fecha').value || '';
            S.actFilters.cliente = document.getElementById('act-filter-cliente').value || '';
            S.actFilters.proyecto = document.getElementById('act-filter-proyecto').value || '';
            render();
            toast('🔍 Filtros aplicados');
        };
    }
    const actFilterClear = document.getElementById('act-filter-clear');
    if (actFilterClear) actFilterClear.onclick = clearActFilters;

    const docFilterApply = document.getElementById('doc-filter-apply');
    if (docFilterApply) {
        docFilterApply.onclick = () => {
            S.docFilters.tipo = document.getElementById('doc-filter-tipo').value || '';
            S.docFilters.vigente = document.getElementById('doc-filter-vigente').value || '';
            render();
            toast('🔍 Filtros aplicados');
        };
    }
    const docFilterClear = document.getElementById('doc-filter-clear');
    if (docFilterClear) docFilterClear.onclick = clearDocFilters;

    // Enter en filtros
    document.querySelectorAll('.filter-bar input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const applyBtn = input.closest('.filter-bar').querySelector('.filter-apply, [id$="-filter-apply"]');
                if (applyBtn) applyBtn.click();
            }
        });
    });

    // --- FIREBASE ---
    const btnConnect = document.getElementById('btn-connect-firebase');
    if (btnConnect) btnConnect.onclick = () => {
        const input = document.getElementById('firebase-config-input');
        try {
            const cfg = JSON.parse(input.value);
            connectFirebase(cfg);
        } catch (e) { toast('JSON inválido. Verifica la configuración.'); }
    };

    // --- CONFIG ---
    let pendingLogo = S.config.logo;
    const fileInput = document.getElementById('cfg-logo-file');
    if (fileInput) fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { pendingLogo = reader.result;
            document.getElementById('logo-preview').innerHTML = `<img src="${pendingLogo}" style="width:100%;height:100%;object-fit:cover;">`; };
        reader.readAsDataURL(file);
    };
    const btnRemoveLogo = document.getElementById('btn-remove-logo');
    if (btnRemoveLogo) btnRemoveLogo.onclick = () => { pendingLogo = null;
        document.getElementById('logo-preview').innerHTML = '—'; };

    const btnSaveCfg = document.getElementById('btn-save-cfg');
    if (btnSaveCfg) btnSaveCfg.onclick = async () => {
        S.config.nombre = document.getElementById('cfg-nombre').value.trim();
        S.config.rni = document.getElementById('cfg-rni').value.trim();
        if (pendingLogo !== undefined) S.config.logo = pendingLogo;
        await saveConfig(S.user?.uid);
        if (S.config.logo) {
            document.getElementById('brand-stamp').innerHTML = `<img src="${S.config.logo}" alt="logo">`;
        }
        render();
        toast('Configuración guardada.');
    };

    // --- SELECCIÓN DE DEUDAS ---
    function updateDebtUI() {
        const checkboxes = document.querySelectorAll('.debt-checkbox');
        const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        
        const selectedSpan = document.querySelector('.debt-select-all + div span');
        if (selectedSpan) {
            selectedSpan.textContent = `${selectedCount} seleccionados`;
        }
        
        const exportBtn = document.getElementById('btn-export-debts');
        if (exportBtn) {
            const validSelected = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => S.pagos.find(p => p.id === cb.dataset.id))
                .filter(p => p && (Number(p.monto) - Number(p.montoPagado || 0)) > 0.01);
            const count = validSelected.length;
            exportBtn.disabled = count === 0;
            exportBtn.textContent = `📤 Exportar deuda (${count})`;
        }

        const selectColumnsBtn = document.getElementById('btn-select-columns');
        if (selectColumnsBtn) {
            const validSelected = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => S.pagos.find(p => p.id === cb.dataset.id))
                .filter(p => p && (Number(p.monto) - Number(p.montoPagado || 0)) > 0.01);
            selectColumnsBtn.disabled = validSelected.length === 0;
        }
        
        const selectAll = document.getElementById('select-all-debts');
        if (selectAll && checkboxes.length > 0) {
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            selectAll.checked = allChecked;
        }
    }

    const selectAllCheck = document.getElementById('select-all-debts');
    if (selectAllCheck) {
        selectAllCheck.onchange = () => {
            const checkboxes = document.querySelectorAll('.debt-checkbox');
            const allChecked = selectAllCheck.checked;
            checkboxes.forEach(cb => {
                cb.checked = allChecked;
                const id = cb.dataset.id;
                if (allChecked) {
                    S.selectedDebts.add(id);
                } else {
                    S.selectedDebts.delete(id);
                }
            });
            updateDebtUI();
        };
    }

    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('debt-checkbox')) {
            const id = e.target.dataset.id;
            if (e.target.checked) {
                S.selectedDebts.add(id);
            } else {
                S.selectedDebts.delete(id);
            }
            updateDebtUI();
        }
    });

    const clearSelectionBtn = document.getElementById('btn-clear-selection');
    if (clearSelectionBtn) {
        clearSelectionBtn.onclick = () => {
            S.selectedDebts.clear();
            document.querySelectorAll('.debt-checkbox').forEach(cb => cb.checked = false);
            updateDebtUI();
            toast('🧹 Selección limpiada.');
        };
    }

    const exportDebtsBtn = document.getElementById('btn-export-debts');
    if (exportDebtsBtn) {
        exportDebtsBtn.onclick = () => {
            const selectedIds = Array.from(S.selectedDebts);
            const allColumns = Object.keys(DEBT_COLUMNS);
            exportDebtsWithColumns(selectedIds, allColumns);
        };
    }

    const selectColumnsBtn = document.getElementById('btn-select-columns');
    if (selectColumnsBtn) {
        selectColumnsBtn.onclick = () => {
            const selectedIds = Array.from(S.selectedDebts);
            if (selectedIds.length === 0) {
                toast('⚠️ Selecciona al menos una deuda.');
                return;
            }
            openColumnSelectorModal();
        };
    }

    setTimeout(updateDebtUI, 100);
}

// ============================================================
// LOGIN EVENTS
// ============================================================

function initLoginEvents() {
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!cloudReady) {
            showLoginError('⚠️ Primero conecta Firebase en la sección "Configurar Firebase"');
            return;
        }
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (!email || !password) {
            showLoginError('Completa todos los campos.');
            return;
        }
        const btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.textContent = 'Iniciando sesión...';
        try { 
            await login(email, password); 
        } finally { 
            btn.disabled = false;
            btn.textContent = 'Iniciar sesión'; 
        }
    });

    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!cloudReady) {
            showLoginError('⚠️ Primero conecta Firebase en la sección "Configurar Firebase"');
            return;
        }
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        if (!email || !password) { 
            showLoginError('Completa todos los campos.'); 
            return; 
        }
        if (password.length < 6) { 
            showLoginError('La contraseña debe tener al menos 6 caracteres.'); 
            return; 
        }
        const btn = document.getElementById('btn-register');
        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';
        try { 
            await register(email, password); 
        } finally { 
            btn.disabled = false;
            btn.textContent = 'Crear cuenta'; 
        }
    });

    document.getElementById('reset-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!cloudReady) {
            showLoginError('⚠️ Primero conecta Firebase en la sección "Configurar Firebase"');
            return;
        }
        const email = document.getElementById('reset-email').value.trim();
        if (!email) { 
            showLoginError('Ingresa tu correo electrónico.'); 
            return; 
        }
        const btn = document.getElementById('btn-reset');
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        try { 
            await resetPassword(email); 
        } finally { 
            btn.disabled = false;
            btn.textContent = 'Enviar correo de recuperación'; 
        }
    });

    document.getElementById('goto-register').onclick = () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('reset-form').style.display = 'none';
        hideLoginError();
    };
    
    document.getElementById('goto-login').onclick = () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('reset-form').style.display = 'none';
        hideLoginError();
    };
    
    document.getElementById('goto-login-reset').onclick = () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('reset-form').style.display = 'none';
        hideLoginError();
    };
    
    document.getElementById('goto-reset').onclick = () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('reset-form').style.display = 'block';
        hideLoginError();
    };

    document.getElementById('btn-connect-firebase').onclick = () => {
        const input = document.getElementById('firebase-config-input');
        try {
            const cfg = JSON.parse(input.value);
            connectFirebase(cfg);
        } catch (e) {
            showLoginError('❌ JSON inválido. Verifica la configuración.');
        }
    };

    document.getElementById('btn-disconnect-firebase').onclick = () => {
        if (confirm('¿Desconectar Firebase? Perderás la conexión con la nube.')) {
            disconnectFirebase();
        }
    };
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

// Cargar configuración guardada
const savedConfig = getSavedFirebaseConfig();
if (savedConfig) {
    const input = document.getElementById('firebase-config-input');
    if (input) {
        input.value = JSON.stringify(savedConfig, null, 2);
    }
    updateFirebaseStatus(true, '✅ Configuración guardada');
}

// Inicializar eventos de login y Firebase
initLoginEvents();
initFirebase();
