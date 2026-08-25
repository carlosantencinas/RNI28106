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
window.clearCotFilters = clearCotFilters;
window.clearPagoFilters = clearPagoFilters;
window.clearExpFilters = clearExpFilters;
window.clearLicFilters = clearLicFilters;
window.clearContFilters = clearContFilters;
window.calcularEdad = calcularEdad;
window.openColumnSelectorModal = openColumnSelectorModal;
window.openRegisterPagoModalFromDetalle = openRegisterPagoModalFromDetalle;
window.togglePagoDetalle = togglePagoDetalle;
window.exportDebtIndividual = exportDebtIndividual;

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
        
        // Botón de exportar directo
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

        // Botón de selección de columnas
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

    // Botón de exportar directo (usa todas las columnas)
    const exportDebtsBtn = document.getElementById('btn-export-debts');
    if (exportDebtsBtn) {
        exportDebtsBtn.onclick = () => {
            const selectedIds = Array.from(S.selectedDebts);
            // Usar todas las columnas por defecto
            const allColumns = Object.keys(DEBT_COLUMNS);
            exportDebtsWithColumns(selectedIds, allColumns);
        };
    }

    // Nuevo botón para seleccionar columnas
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
