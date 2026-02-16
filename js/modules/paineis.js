/* ==========================================================================
   PERLIM - Módulo Painéis
   Inicialização de painéis de módulos, inputs, sliders, escrita
   ========================================================================== */

// ============================================================================
// INICIALIZAR PAINÉIS DE MÓDULOS
// ============================================================================

function inicializarPaineis() {
    try {
        const container = document.getElementById('mod-panels');
        if (!container) return;
        
        MODULOS.forEach((mod, mi) => {
            const panel = document.createElement('div');
            panel.id = `panel-${mi}`;
            panel.className = 'mod-panel';
            panel.style.display = mi === 0 ? 'block' : 'none';
            
            let html = '';
            
            NIVEIS.forEach((niv, ni) => {
                html += `<div class="comp-section"><div class="comp-title">${niv.nome}</div><div class="comp-grid">`;
                
                for (let c = 0; c < 2; c++) {
                    for (let o = 0; o < 2; o++) {
                        const idx = mi * 8 + ni * 4 + c * 2 + o;
                        const isEscrita = o === 1;
                        const circuito = (mi === 0) ? CIRCUITOS_SUBLEXICAL[c] : CIRCUITOS[c];
                        
                        html += `
                            <div class="comp-item ${isEscrita ? 'escrita' : ''}">
                                <label>${circuito.nome} ${MODALIDADES[o].nome}</label>
                                <div class="comp-input-group">
                                    <input type="number" id="v-${idx}" class="comp-val zone-green" data-idx="${idx}" min="0" max="10" placeholder="0-10">
                                    <input type="range" class="comp-slider" data-idx="${idx}" min="0" max="10" value="5">
                                </div>
                            </div>
                        `;
                    }
                }
                
                html += '</div></div>';
            });
            
            panel.innerHTML = html;
            container.appendChild(panel);
        });
        
        // Event listeners para inputs
        document.querySelectorAll('.comp-val').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                const val = e.target.value === '' ? null : Math.max(0, Math.min(10, parseInt(e.target.value)));
                casoActual.competencias[idx] = val;
                
                const slider = document.querySelector(`.comp-slider[data-idx="${idx}"]`);
                if (slider && val !== null) slider.value = val;
                actualizarZonaInput(e.target, val);
                
                radarChart?.setValor(idx, val !== null ? val : 0);
            });
        });
        
        // Event listeners para sliders
        document.querySelectorAll('.comp-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                const val = parseInt(e.target.value);
                
                const input = document.getElementById(`v-${idx}`);
                if (input) {
                    input.value = val;
                    actualizarZonaInput(input, val);
                }
                
                casoActual.competencias[idx] = val;
                radarChart?.setValor(idx, val);
            });
        });
        
        // Tabs de módulo
        document.querySelectorAll('.mod-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.mod-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.mod-panel').forEach(p => p.style.display = 'none');
                tab.classList.add('active');
                document.getElementById(`panel-${tab.dataset.mod}`).style.display = 'block';
            });
        });
    } catch (e) {
        console.error('Erro ao inicializar painéis:', e);
    }
}

// ============================================================================
// ZONA DO INPUT
// ============================================================================

function actualizarZonaInput(el, val) {
    try {
        el.classList.remove('zone-red', 'zone-yellow', 'zone-green');
        if (val === null) return;
        const zona = obterZona(val);
        el.classList.add(`zone-${zona}`);
    } catch (e) {
        console.error('Erro ao actualizar zona:', e);
    }
}

// ============================================================================
// ESCRITA (TOGGLE)
// ============================================================================

function verificarEscrita() {
    try {
        const esc = document.getElementById('caso-esc')?.value;
        const escInfo = document.getElementById('esc-info');
        
        if (!esc || esc === 'pre') {
            escritaAtiva = false;
            if (escInfo) escInfo.style.display = 'block';
            document.querySelectorAll('.comp-item.escrita').forEach(el => {
                el.classList.add('disabled', 'hidden-escrita');
            });
        } else {
            escritaAtiva = true;
            if (escInfo) escInfo.style.display = 'none';
            document.querySelectorAll('.comp-item.escrita').forEach(el => {
                el.classList.remove('disabled', 'hidden-escrita');
            });
        }
        
        radarChart?.setEscritaAtiva(escritaAtiva);
    } catch (e) {
        console.error('Erro ao verificar escrita:', e);
    }
}

// ============================================================================
// TABS
// ============================================================================

function inicializarTabs() {
    try {
        document.querySelectorAll('.tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tabs .tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
            });
        });
    } catch (e) {
        console.error('Erro ao inicializar tabs:', e);
    }
}
