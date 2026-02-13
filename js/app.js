/* ==========================================================================
   PERFIL DE COMPETÊNCIA LINGUÍSTICA - App Module v3.1
   Lógica principal da aplicação com funcionalidades avançadas
   ========================================================================== */

// ============================================================================
// LAZY LOADING DE BIBLIOTECAS PESADAS
// ============================================================================

const bibliotecasCarregadas = { docx: false, xlsx: false };

async function carregarBibliotecaDocx() {
    if (bibliotecasCarregadas.docx) return true;
    if (typeof docx !== 'undefined') {
        bibliotecasCarregadas.docx = true;
        return true;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/docx@8.5.0/build/index.umd.min.js';
        script.onload = () => {
            bibliotecasCarregadas.docx = true;
            resolve(true);
        };
        script.onerror = () => reject(new Error('Falha ao carregar biblioteca docx'));
        document.head.appendChild(script);
    });
}

async function carregarBibliotecaXLSX() {
    if (bibliotecasCarregadas.xlsx) return true;
    if (typeof XLSX !== 'undefined') {
        bibliotecasCarregadas.xlsx = true;
        return true;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.mini.min.js';
        script.onload = () => {
            bibliotecasCarregadas.xlsx = true;
            resolve(true);
        };
        script.onerror = () => reject(new Error('Falha ao carregar biblioteca xlsx'));
        document.head.appendChild(script);
    });
}

// ============================================================================
// HEADER CAIDI PARA RELATÓRIOS (Lazy Loading)
// ============================================================================

let HEADER_CAIDI = null; // Carregado sob demanda

async function carregarHeaderCaidi() {
    if (HEADER_CAIDI) return HEADER_CAIDI;
    try {
        const response = await fetch('header-caidi.txt');
        if (response.ok) {
            HEADER_CAIDI = await response.text();
            return HEADER_CAIDI;
        }
    } catch (e) {
        console.warn('Header CAIDI não disponível:', e);
    }
    return '';
}
let settings = carregarSettings();
let escritaAtiva = true;
let planoActual = null;
let radarInicializado = false;

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

function inicializarRadar() {
    if (radarInicializado) return;
    
    const canvas = document.getElementById('radar-canvas');
    const appContent = document.getElementById('app-content');
    
    // Só inicializar se o canvas estiver visível
    if (!canvas || !appContent || appContent.style.display === 'none') {
        return false;
    }
    
    try {
        radarChart = new RadarChart('radar-canvas');
        radarChart.desenhar();
        radarInicializado = true;
        console.log('Radar inicializado com sucesso');
        return true;
    } catch (e) {
        console.error('Erro ao inicializar radar:', e);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Aplicar tema guardado
    if (settings.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Definir data actual
    document.getElementById('caso-data').value = new Date().toISOString().split('T')[0];
    
    // Inicializar componentes
    inicializarPaineis();
    inicializarTabs();
    inicializarProvas();
    inicializarEventListeners();
    inicializarAuth();
    
    // Tentar inicializar radar (pode falhar se app-content estiver escondido)
    inicializarRadar();
    
    // Listener para sincronizar fullscreen do browser com o CSS
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && document.body.classList.contains('fullscreen')) {
            document.body.classList.remove('fullscreen');
            if (radarChart) setTimeout(() => radarChart.resize(), 100);
        }
    });
    
    // Esconder loading
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.add('hidden');
    }, 300);
});

// ============================================================================
// INICIALIZAR PAINÉIS DE MÓDULOS
// ============================================================================

function inicializarPaineis() {
    const container = document.getElementById('mod-panels');
    
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
                    // Usar terminologia sublexical para Fonológico (mi=0)
                    const circuito = (mi === 0) ? CIRCUITOS_SUBLEXICAL[c] : CIRCUITOS[c];
                    
                    html += `
                        <div class="comp-item ${isEscrita ? 'escrita' : ''}" data-idx="${idx}" style="--mod-color: ${mod.cor}">
                            <span class="comp-label">${circuito.abrev}-${MODALIDADES[o].abrev}</span>
                            <input type="range" class="comp-slider" min="0" max="10" value="5" data-idx="${idx}">
                            <input type="number" class="comp-val zone-green" id="v-${idx}" min="0" max="10" placeholder="—" data-idx="${idx}" data-testid="comp-${idx}">
                        </div>
                    `;
                }
            }
            
            html += '</div></div>';
        });
        
        panel.innerHTML = html;
        container.appendChild(panel);
    });
    
    // Event listeners para sliders (actualização dinâmica)
    document.querySelectorAll('.comp-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            const val = parseInt(e.target.value);
            casoActual.competencias[idx] = val;
            
            const input = document.getElementById(`v-${idx}`);
            input.value = val;
            actualizarZonaInput(input, val);
            
            // Actualização dinâmica do radar
            radarChart.setValor(idx, val);
        });
    });
    
    // Event listeners para inputs (actualização dinâmica)
    document.querySelectorAll('.comp-val').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            let val = e.target.value === '' ? null : Math.max(0, Math.min(10, parseInt(e.target.value)));
            casoActual.competencias[idx] = val;
            
            const slider = document.querySelector(`.comp-slider[data-idx="${idx}"]`);
            if (slider && val !== null) slider.value = val;
            actualizarZonaInput(e.target, val);
            
            // Actualização dinâmica do radar
            radarChart.setValor(idx, val !== null ? val : 0);
        });
    });
    
    // Event listeners para tabs de módulo
    document.querySelectorAll('.mod-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.mod-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.mod-panel').forEach(p => p.style.display = 'none');
            
            tab.classList.add('active');
            document.getElementById(`panel-${tab.dataset.mod}`).style.display = 'block';
        });
    });
}

function actualizarZonaInput(el, val) {
    el.classList.remove('zone-red', 'zone-yellow', 'zone-green');
    if (val === null) return;
    
    const zona = obterZona(val);
    el.classList.add(`zone-${zona}`);
}

// ============================================================================
// TABS
// ============================================================================

function inicializarTabs() {
    document.querySelectorAll('.tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tabs .tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

// ============================================================================
// PROVAS (incluindo custom)
// ============================================================================

function inicializarProvas() {
    actualizarSelectProvas();
    
    // Actualizar escala quando muda a prova
    document.getElementById('prova-sel').addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        if (opt && opt.dataset.escala) {
            document.getElementById('prova-esc').value = opt.dataset.escala;
        }
        actualizarConversao();
        mostrarTarefasProva(e.target.value);
    });
    
    // Actualizar conversão em tempo real
    document.getElementById('prova-val').addEventListener('input', actualizarConversao);
    document.getElementById('prova-esc').addEventListener('change', actualizarConversao);
}

function actualizarSelectProvas() {
    const select = document.getElementById('prova-sel');
    const provas = obterTodasProvas();
    
    // Limpar opções (manter primeira)
    select.innerHTML = '<option value="">Selecione uma prova</option>';
    
    // Agrupar por domínio
    const grupos = {};
    provas.forEach(p => {
        if (!grupos[p.dominio]) grupos[p.dominio] = [];
        grupos[p.dominio].push(p);
    });
    
    for (const [dominio, lista] of Object.entries(grupos)) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = dominio;
        
        lista.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nome + (p.custom ? ' ★' : '');
            opt.dataset.segs = p.segs.join(',');
            opt.dataset.escala = p.escala;
            optgroup.appendChild(opt);
        });
        
        select.appendChild(optgroup);
    }
}

function actualizarConversao() {
    const valor = parseFloat(document.getElementById('prova-val').value);
    const escala = document.getElementById('prova-esc').value;
    const display = document.getElementById('conversion-value');
    
    if (isNaN(valor)) {
        display.textContent = '—';
        display.className = 'conversion-value';
        return;
    }
    
    const comp = converterParaCompetencia(valor, escala);
    const zona = obterZona(comp);
    
    display.textContent = comp;
    display.className = `conversion-value zone-${zona}`;
}

function mostrarTarefasProva(provaId) {
    const container = document.getElementById('tarefas-container');
    if (!container) return;
    
    if (!provaId) {
        container.innerHTML = '';
        return;
    }
    
    const provas = obterTodasProvas();
    const prova = provas.find(p => p.id === provaId);
    
    if (!prova || !prova.tarefas || prova.tarefas.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <div class="respostas-panel">
            <div class="respostas-header">
                <h5>Tarefas de ${prova.nome}</h5>
                <button class="btn-mini" onclick="toggleRespostasDetalhadas()" title="Respostas detalhadas">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                </button>
            </div>
    `;
    
    prova.tarefas.forEach(tarefa => {
        html += `
            <div class="tarefa-item">
                <span>${tarefa.nome}</span>
                <span class="text-muted">${tarefa.itens} itens</span>
            </div>
        `;
    });
    
    html += `
            <div id="respostas-detalhadas" style="display:none;margin-top:var(--space-3)">
                ${prova.tarefas.map(tarefa => `
                    <div class="mb-3">
                        <label class="text-sm font-semibold">${tarefa.nome}</label>
                        <div class="respostas-grid" data-prova="${provaId}" data-tarefa="${tarefa.id}">
                            ${Array.from({length: tarefa.itens}, (_, i) => `
                                <div class="resp-item" data-item="${i+1}" onclick="toggleResposta(this)">${i+1}</div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function toggleRespostasDetalhadas() {
    const el = document.getElementById('respostas-detalhadas');
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleResposta(el) {
    const states = ['', 'correct', 'incorrect', 'partial'];
    const currentIndex = states.indexOf(el.className.split(' ').find(c => states.includes(c)) || '');
    const nextIndex = (currentIndex + 1) % states.length;
    
    el.classList.remove('correct', 'incorrect', 'partial');
    if (states[nextIndex]) {
        el.classList.add(states[nextIndex]);
    }
    
    // Guardar resposta
    const grid = el.parentElement;
    const provaId = grid.dataset.prova;
    const tarefaId = grid.dataset.tarefa;
    const itemId = el.dataset.item;
    
    if (!casoActual.respostasDetalhadas[provaId]) {
        casoActual.respostasDetalhadas[provaId] = {};
    }
    if (!casoActual.respostasDetalhadas[provaId][tarefaId]) {
        casoActual.respostasDetalhadas[provaId][tarefaId] = {};
    }
    casoActual.respostasDetalhadas[provaId][tarefaId][itemId] = states[nextIndex] || null;
}

// ============================================================================
// VERIFICAR ESCRITA
// ============================================================================

function verificarEscrita() {
    const idade = document.getElementById('caso-idade').value;
    const esc = document.getElementById('caso-esc').value;
    const info = document.getElementById('esc-info');
    const msg = document.getElementById('esc-msg');
    
    let anos = 0;
    if (idade) {
        const match = idade.match(/(\d+)/);
        if (match) anos = parseInt(match[1]);
    }
    
    const preEscolar = esc === 'pre' || (anos > 0 && anos < 6) || (esc === '' && anos < 6);
    const ano1 = esc === '1' || (anos === 6 && esc === '');
    
    if (preEscolar) {
        escritaAtiva = false;
        info.style.display = 'flex';
        info.className = 'info-box warn';
        msg.textContent = '🚫 Modalidade ESCRITA desactivada (pré-escolar)';
    } else if (ano1) {
        escritaAtiva = true;
        info.style.display = 'flex';
        info.className = 'info-box';
        msg.textContent = 'ℹ️ 1º ano: Escrita activa, interpretar com cautela';
    } else if (esc || anos >= 7) {
        escritaAtiva = true;
        info.style.display = 'flex';
        info.className = 'info-box';
        msg.textContent = '✅ Modalidade Escrita activa';
    } else {
        info.style.display = 'none';
        escritaAtiva = true;
    }
    
    // Actualizar items de escrita visualmente
    document.querySelectorAll('.comp-item.escrita').forEach(el => {
        if (!escritaAtiva) {
            el.classList.add('disabled', 'hidden-escrita');
        } else {
            el.classList.remove('disabled', 'hidden-escrita');
        }
    });
    
    // Actualizar radar
    radarChart.setEscritaAtiva(escritaAtiva);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function inicializarEventListeners() {
    // Verificar escrita baseado na idade/escolaridade
    document.getElementById('caso-idade').addEventListener('input', verificarEscrita);
    document.getElementById('caso-esc').addEventListener('change', verificarEscrita);
    
    // Botões principais
    document.getElementById('btn-gerar').addEventListener('click', gerarPerfil);
    document.getElementById('btn-limpar').addEventListener('click', limparFormulario);
    document.getElementById('btn-guardar').addEventListener('click', guardarCasoCloud);
    document.getElementById('btn-exemplo').addEventListener('click', carregarExemplo);
    document.getElementById('btn-export').addEventListener('click', () => abrirModal('modal-export'));
    document.getElementById('btn-add-prova').addEventListener('click', adicionarProva);
    
    // Header - Painel de Gestão
    document.getElementById('btn-gestao').addEventListener('click', () => {
        abrirPainelGestao();
    });
    document.getElementById('btn-info').addEventListener('click', () => {
        mostrarInfoTab('provas');
        abrirModal('modal-info');
    });
    document.getElementById('btn-theme').addEventListener('click', toggleTema);
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
    
    // Botão de fechar fullscreen no radar
    document.getElementById('btn-close-fullscreen').addEventListener('click', sairFullscreen);
    
    // Radar
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        radarChart.setZoom(radarChart.zoom + 0.1);
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        radarChart.setZoom(radarChart.zoom - 0.1);
    });
    document.getElementById('btn-download-png').addEventListener('click', () => {
        const nome = casoActual.id || 'perfil';
        radarChart.downloadPNG(`perfil_${nome}_${casoActual.data}.png`);
        mostrarToast('PNG exportado!', 'success');
    });
    
    // Botão de IA
    document.getElementById('btn-abrir-ia').addEventListener('click', () => {
        if (!casoActual.competencias?.some(c => c > 0)) {
            mostrarToast('Gere primeiro o perfil', 'warning');
            return;
        }
        document.getElementById('ia-result').style.display = 'none';
        document.getElementById('ia-loading').style.display = 'none';
        abrirModal('modal-ia');
    });
    
    // Modais - fechar
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
    
    // Info tabs
    document.querySelectorAll('.info-tab').forEach(tab => {
        tab.addEventListener('click', () => mostrarInfoTab(tab.dataset.info));
    });
    
    // Export options
    document.querySelectorAll('[data-export]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tipo = btn.dataset.export;
            executarExport(tipo);
            fecharModal('modal-export');
        });
    });
    
    // History actions
    document.getElementById('btn-import-json')?.addEventListener('click', importarCaso);
    document.getElementById('btn-export-all')?.addEventListener('click', exportarTodosCasos);
    document.getElementById('history-search')?.addEventListener('input', filtrarHistorico);
    
    // Atalhos de teclado
    document.addEventListener('keydown', tratarAtalhos);
}

// ============================================================================
// GERAR PERFIL
// ============================================================================

function gerarPerfil() {
    // Recolher dados de identificação
    casoActual.id = document.getElementById('caso-id').value || `CASO-${Date.now()}`;
    casoActual.nome = document.getElementById('caso-nome').value;
    casoActual.idade = document.getElementById('caso-idade').value;
    casoActual.data = document.getElementById('caso-data').value;
    casoActual.escolaridade = document.getElementById('caso-esc').value;
    casoActual.avaliador = document.getElementById('caso-aval').value;
    casoActual.dataModificacao = new Date().toISOString();
    
    // Recolher dados dos inputs
    document.querySelectorAll('.comp-val').forEach(input => {
        const idx = parseInt(input.dataset.idx);
        if (input.value !== '') {
            casoActual.competencias[idx] = Math.max(0, Math.min(10, parseInt(input.value)));
        }
    });
    
    // Actualizar título
    const titulo = casoActual.nome || casoActual.id || 'Perfil de Competência Linguística';
    document.getElementById('radar-title').textContent = titulo;
    document.getElementById('radar-subtitle').textContent = casoActual.idade ? `Idade: ${casoActual.idade}` : '';
    
    // Desenhar radar com animação
    radarChart.setDados(casoActual.competencias, casoActual, escritaAtiva);
    
    // Gerar estatísticas e análise
    gerarEstatisticas();
    const analise = gerarAnalise();
    
    // Gerar plano terapêutico
    gerarPlanoTerapeutico(analise);
    
    // Auto-save
    if (settings.autoSave) {
        guardarCasoActual();
    }
    
    mostrarToast('Perfil gerado com sucesso!', 'success');
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

function gerarEstatisticas() {
    const dashboard = document.getElementById('stats-dashboard');
    const grid = document.getElementById('stats-grid');
    
    const comps = casoActual.competencias.filter(c => c !== null);
    if (comps.length === 0) {
        dashboard.style.display = 'none';
        return;
    }
    
    dashboard.style.display = 'block';
    
    const medias = MODULOS.map((mod, mi) => {
        const vals = casoActual.competencias.slice(mi * 8, mi * 8 + 8).filter(v => v !== null);
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
    });
    
    const mediaOral = calcularMediaPorDimensao('modalidade', 0);
    const mediaEscrita = calcularMediaPorDimensao('modalidade', 1);
    
    let html = '';
    
    MODULOS.forEach((mod, i) => {
        if (medias[i] !== null) {
            html += `
                <div class="stat-card" style="--stat-color: ${mod.cor}">
                    <div class="stat-value">${medias[i]}</div>
                    <div class="stat-label">${mod.abrev}</div>
                    <div class="stat-bar"><div class="stat-bar-fill" style="width: ${medias[i] * 10}%"></div></div>
                </div>
            `;
        }
    });
    
    if (mediaOral !== null) {
        html += `
            <div class="stat-card" style="--stat-color: #64748B">
                <div class="stat-value">${mediaOral.toFixed(1)}</div>
                <div class="stat-label">Oral</div>
                <div class="stat-bar"><div class="stat-bar-fill" style="width: ${mediaOral * 10}%"></div></div>
            </div>
        `;
    }
    
    if (mediaEscrita !== null && escritaAtiva) {
        html += `
            <div class="stat-card" style="--stat-color: #94A3B8">
                <div class="stat-value">${mediaEscrita.toFixed(1)}</div>
                <div class="stat-label">Escrita</div>
                <div class="stat-bar"><div class="stat-bar-fill" style="width: ${mediaEscrita * 10}%"></div></div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
}

function calcularMediaPorDimensao(dimensao, valor) {
    const vals = casoActual.competencias.filter((c, i) => {
        if (c === null) return false;
        if (dimensao === 'modalidade' && valor === 1 && !escritaAtiva) return false;
        return SEGMENTOS[i][dimensao] === valor;
    });
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

// ============================================================================
// ANÁLISE CLÍNICA
// ============================================================================

function gerarAnalise() {
    const panel = document.getElementById('analysis');
    const comps = casoActual.competencias.filter(c => c !== null);
    
    if (comps.length === 0) {
        panel.style.display = 'none';
        return null;
    }
    
    panel.style.display = 'block';
    
    // Calcular médias
    const medMod = MODULOS.map((_, mi) => {
        const vals = casoActual.competencias.slice(mi * 8, mi * 8 + 8).filter(v => v !== null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    });
    
    const modsAfectados = MODULOS.filter((_, i) => medMod[i] !== null && medMod[i] < 4);
    
    const aOral = calcularMediaPorDimensao('modalidade', 0);
    const aEscr = calcularMediaPorDimensao('modalidade', 1);
    const aComp = calcularMediaPorDimensao('circuito', 0);
    const aExpr = calcularMediaPorDimensao('circuito', 1);
    const aImpl = calcularMediaPorDimensao('nivel', 0);
    const aExpl = calcularMediaPorDimensao('nivel', 1);
    
    // Estrutura de análise para retornar
    const analise = {
        modulosAfectados: modsAfectados.map(m => m.nome),
        medias: {
            modulos: medMod,
            oral: aOral,
            escrita: aEscr,
            compreensao: aComp,
            expressao: aExpr,
            implicito: aImpl,
            explicito: aExpl
        },
        padroes: [],
        hipoteses: [],
        prioridades: []
    };
    
    // === PADRÕES ===
    let patterns = '';
    
    if (modsAfectados.length) {
        patterns += `<div class="analysis-item critical"><span class="tag tag-danger">Défice</span>Domínios afectados: <b>${modsAfectados.map(m => m.nome).join(', ')}</b></div>`;
        analise.padroes.push({ tipo: 'defice', modulos: modsAfectados.map(m => m.nome) });
    }
    
    if (aOral !== null && aEscr !== null && escritaAtiva) {
        if (aOral - aEscr > 1.5) {
            patterns += `<div class="analysis-item warning"><span class="tag tag-warning">Padrão</span>Modalidade <b>Escrita</b> mais afectada (Δ ${(aOral - aEscr).toFixed(1)})</div>`;
            analise.padroes.push({ tipo: 'modalidade', afectada: 'escrita', delta: aOral - aEscr });
        } else if (aEscr - aOral > 1.5) {
            patterns += `<div class="analysis-item info"><span class="tag tag-info">Padrão</span>Modalidade <b>Oral</b> mais afectada (Δ ${(aEscr - aOral).toFixed(1)})</div>`;
            analise.padroes.push({ tipo: 'modalidade', afectada: 'oral', delta: aEscr - aOral });
        }
    }
    
    if (aComp !== null && aExpr !== null) {
        if (aComp - aExpr > 1.5) {
            patterns += `<div class="analysis-item warning"><span class="tag tag-warning">Padrão</span>Circuito <b>Expressivo</b> mais afectado (Δ ${(aComp - aExpr).toFixed(1)})</div>`;
            analise.padroes.push({ tipo: 'circuito', afectado: 'expressao', delta: aComp - aExpr });
        } else if (aExpr - aComp > 1.5) {
            patterns += `<div class="analysis-item info"><span class="tag tag-info">Padrão</span>Circuito <b>Compreensivo</b> mais afectado (Δ ${(aExpr - aComp).toFixed(1)})</div>`;
            analise.padroes.push({ tipo: 'circuito', afectado: 'compreensao', delta: aExpr - aComp });
        }
    }
    
    if (aImpl !== null && aExpl !== null && aImpl - aExpl > 1.5) {
        patterns += `<div class="analysis-item warning"><span class="tag tag-warning">Padrão</span>Nível <b>Explícito</b> mais afectado (Δ ${(aImpl - aExpl).toFixed(1)})</div>`;
        analise.padroes.push({ tipo: 'nivel', afectado: 'explicito', delta: aImpl - aExpl });
    }
    
    if (!patterns) {
        patterns = '<div class="analysis-item success"><span class="tag tag-success">OK</span>Perfil relativamente equilibrado</div>';
    }
    
    document.getElementById('patterns').innerHTML = patterns;
    
    // === HIPÓTESES ===
    let hypo = '';
    
    const temPDL = modsAfectados.some(m => ['Fonológico', 'Morfológico', 'Sintático', 'Semântico'].includes(m.nome)) && aOral !== null && aOral < 4;
    
    if (temPDL) {
        hypo += `<div class="analysis-item critical"><span class="tag tag-danger">Alta Prob.</span><b>Perturbação do Desenvolvimento da Linguagem (PDL)</b></div>`;
        analise.hipoteses.push({ nome: 'PDL', probabilidade: 'alta' });
    }
    
    const escritaAfectada = [2, 3, 6, 7].some(i => casoActual.competencias[i] !== null && casoActual.competencias[i] < 4);
    
    if (escritaAfectada && (!aOral || aOral >= 4)) {
        hypo += `<div class="analysis-item warning"><span class="tag tag-warning">Considerar</span><b>Dislexia / Disortografia</b></div>`;
        analise.hipoteses.push({ nome: 'Dislexia/Disortografia', probabilidade: 'considerar' });
    }
    
    if (temPDL && escritaAfectada) {
        hypo += `<div class="analysis-item critical"><span class="tag tag-danger">Provável</span><b>PDL com impacto na Literacia</b></div>`;
        analise.hipoteses.push({ nome: 'PDL com impacto literacia', probabilidade: 'provavel' });
    }
    
    if (medMod[4] !== null && medMod[4] < 4) {
        hypo += `<div class="analysis-item warning"><span class="tag tag-warning">Considerar</span><b>Perturbação Pragmática</b></div>`;
        analise.hipoteses.push({ nome: 'Perturbação Pragmática', probabilidade: 'considerar' });
    }
    
    if (medMod[0] !== null && medMod[0] < 3 && modsAfectados.length === 1) {
        hypo += `<div class="analysis-item info"><span class="tag tag-info">Considerar</span><b>Perturbação dos Sons da Fala</b></div>`;
        analise.hipoteses.push({ nome: 'PSF', probabilidade: 'considerar' });
    }
    
    if (!hypo) {
        hypo = '<div class="analysis-item success"><span class="tag tag-success">Típico</span>Sem indicadores de perturbação</div>';
    }
    
    document.getElementById('hypotheses').innerHTML = hypo;
    
    // === INTERVENÇÃO ===
    let interv = '';
    
    const prioridades = casoActual.competencias
        .map((c, i) => ({ idx: i, comp: c, seg: SEGMENTOS[i] }))
        .filter(x => x.comp !== null && x.comp < 5)
        .filter(x => !(x.seg.modalidade === 1 && !escritaAtiva))
        .sort((a, b) => a.comp - b.comp)
        .slice(0, 6);
    
    if (prioridades.length) {
        prioridades.forEach(x => {
            const cls = x.comp < 3 ? 'critical' : 'warning';
            const tag = x.comp < 3 ? 'tag-danger' : 'tag-warning';
            const pri = x.comp < 3 ? 'URGENTE' : 'PRIORITÁRIO';
            // Usar terminologia sublexical para Fonológico
            const circuito = (x.seg.modulo === 0) ? CIRCUITOS_SUBLEXICAL[x.seg.circuito] : CIRCUITOS[x.seg.circuito];
            
            interv += `
                <div class="analysis-item ${cls}">
                    <span class="tag ${tag}">${pri}</span>
                    <b>${MODULOS[x.seg.modulo].nome}</b> → ${NIVEIS[x.seg.nivel].nome} → ${circuito.nome} → ${MODALIDADES[x.seg.modalidade].nome}
                    <span style="margin-left:auto;font-weight:700">${x.comp}/10</span>
                </div>
            `;
            
            analise.prioridades.push({
                dominio: MODULOS[x.seg.modulo].nome,
                nivel: NIVEIS[x.seg.nivel].nome,
                circuito: circuito.nome,
                modalidade: MODALIDADES[x.seg.modalidade].nome,
                competencia: x.comp
            });
        });
    } else {
        interv = '<div class="analysis-item success"><span class="tag tag-success">OK</span>Sem áreas prioritárias</div>';
    }
    
    document.getElementById('intervention').innerHTML = interv;
    
    // Gráficos por dimensão
    gerarGraficosDimensao();
    
    return analise;
}

function gerarGraficosDimensao() {
    const container = document.getElementById('dimension-charts');
    
    let html = '';
    
    // Por Domínio
    html += `<div class="dimension-chart"><h5>Por Domínio</h5><div class="dimension-bars">`;
    MODULOS.forEach((mod, mi) => {
        const vals = casoActual.competencias.slice(mi * 8, mi * 8 + 8).filter(v => v !== null);
        if (vals.length) {
            const media = vals.reduce((a, b) => a + b, 0) / vals.length;
            html += `
                <div class="dimension-bar">
                    <span class="dimension-bar-label">${mod.abrev}</span>
                    <div class="dimension-bar-track"><div class="dimension-bar-fill" style="width:${media*10}%;background:${mod.cor}"></div></div>
                    <span class="dimension-bar-value" style="color:${mod.cor}">${media.toFixed(1)}</span>
                </div>
            `;
        }
    });
    html += `</div></div>`;
    
    // Por Circuito
    html += `<div class="dimension-chart"><h5>Por Circuito</h5><div class="dimension-bars">`;
    CIRCUITOS.forEach((circ, ci) => {
        const vals = casoActual.competencias.filter((c, i) => c !== null && SEGMENTOS[i].circuito === ci);
        if (vals.length) {
            const media = vals.reduce((a, b) => a + b, 0) / vals.length;
            const cor = ci === 0 ? '#3B82F6' : '#F97316';
            html += `
                <div class="dimension-bar">
                    <span class="dimension-bar-label">${circ.nome}</span>
                    <div class="dimension-bar-track"><div class="dimension-bar-fill" style="width:${media*10}%;background:${cor}"></div></div>
                    <span class="dimension-bar-value">${media.toFixed(1)}</span>
                </div>
            `;
        }
    });
    html += `</div></div>`;
    
    // Por Modalidade
    html += `<div class="dimension-chart"><h5>Por Modalidade</h5><div class="dimension-bars">`;
    MODALIDADES.forEach((mod, mi) => {
        if (mi === 1 && !escritaAtiva) return;
        const vals = casoActual.competencias.filter((c, i) => c !== null && SEGMENTOS[i].modalidade === mi);
        if (vals.length) {
            const media = vals.reduce((a, b) => a + b, 0) / vals.length;
            const cor = mi === 0 ? '#8B5CF6' : '#EC4899';
            html += `
                <div class="dimension-bar">
                    <span class="dimension-bar-label">${mod.nome}</span>
                    <div class="dimension-bar-track"><div class="dimension-bar-fill" style="width:${media*10}%;background:${cor}"></div></div>
                    <span class="dimension-bar-value">${media.toFixed(1)}</span>
                </div>
            `;
        }
    });
    html += `</div></div>`;
    
    container.innerHTML = html;
}

// ============================================================================
// PLANO TERAPÊUTICO
// ============================================================================

function gerarPlanoTerapeutico(analise) {
    if (!analise || analise.prioridades.length === 0) {
        const planPanel = document.getElementById('plan-panel');
        if (planPanel) planPanel.style.display = 'none';
        return;
    }
    
    // Criar ou mostrar painel de plano
    let planPanel = document.getElementById('plan-panel');
    if (!planPanel) {
        planPanel = document.createElement('div');
        planPanel.id = 'plan-panel';
        planPanel.className = 'plan-panel';
        document.querySelector('.content').appendChild(planPanel);
    }
    
    planPanel.style.display = 'block';
    
    // Gerar sugestões baseadas em regras
    const sugestoes = gerarSugestoesIntervencao(analise);
    
    let html = `
        <div class="plan-header">
            <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Plano Terapêutico Sugerido
            </h3>
            <span class="plan-status draft">Rascunho</span>
        </div>
        
        <div class="ai-disabled-notice">
            💡 Sugestões baseadas em regras clínicas. Integração com IA disponível em breve para sugestões personalizadas.
        </div>
        
        <div class="plan-section">
            <h4>🎯 Áreas Prioritárias</h4>
            <ul class="plan-list">
                ${sugestoes.areas.map(a => `<li>${a}</li>`).join('')}
            </ul>
        </div>
        
        <div class="plan-section">
            <h4>📋 Objectivos Gerais</h4>
            <ul class="plan-list">
                ${sugestoes.objectivosGerais.map(o => `<li>${o}</li>`).join('')}
            </ul>
        </div>
        
        <div class="plan-section">
            <h4>🎯 Objectivos Específicos</h4>
            <ul class="plan-list">
                ${sugestoes.objectivosEspecificos.map(o => `<li>${o}</li>`).join('')}
            </ul>
        </div>
        
        <div class="plan-section">
            <h4>💡 Estratégias Sugeridas</h4>
            <ul class="plan-list">
                ${sugestoes.estrategias.map(e => `<li>${e}</li>`).join('')}
            </ul>
        </div>
        
        <div class="plan-section">
            <h4>📦 Materiais Recomendados</h4>
            <ul class="plan-list">
                ${sugestoes.materiais.map(m => `<li>${m}</li>`).join('')}
            </ul>
        </div>
        
        <div class="plan-section">
            <h4>📝 Notas Adicionais</h4>
            <textarea class="plan-editable" placeholder="Adicione notas personalizadas sobre o plano...">${planoActual?.notas || ''}</textarea>
        </div>
        
        <div class="btn-group" style="margin-top:var(--space-4)">
            <button class="btn btn-primary" onclick="guardarPlano()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                </svg>
                Guardar Plano
            </button>
            <button class="btn btn-secondary" onclick="exportarPlano()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Exportar
            </button>
        </div>
    `;
    
    planPanel.innerHTML = html;
    
    // Criar objecto de plano
    planoActual = criarPlanoTerapeutico(casoActual.id, analise);
    planoActual.objectivosGerais = sugestoes.objectivosGerais;
    planoActual.objectivosEspecificos = sugestoes.objectivosEspecificos;
    planoActual.areas = sugestoes.areas;
    planoActual.estrategias = sugestoes.estrategias;
    planoActual.materiais = sugestoes.materiais;
}

function gerarSugestoesIntervencao(analise) {
    const sugestoes = {
        areas: [],
        objectivosGerais: [],
        objectivosEspecificos: [],
        estrategias: [],
        materiais: []
    };
    
    // Identificar módulos afectados
    const modulosAfectados = analise.modulosAfectados || [];
    
    modulosAfectados.forEach(modNome => {
        const base = BASE_INTERVENCAO[modNome];
        if (base) {
            sugestoes.areas.push(...base.areas.slice(0, 2));
            sugestoes.objectivosGerais.push(...base.objectivos.slice(0, 2));
            sugestoes.estrategias.push(...base.estrategias.slice(0, 2));
            sugestoes.materiais.push(...base.materiais.slice(0, 2));
        }
    });
    
    // Objectivos específicos baseados nas prioridades
    analise.prioridades?.slice(0, 3).forEach(p => {
        sugestoes.objectivosEspecificos.push(
            `Melhorar ${p.dominio} ao nível ${p.nivel} no circuito de ${p.circuito} (${p.modalidade})`
        );
    });
    
    // Remover duplicados
    sugestoes.areas = [...new Set(sugestoes.areas)];
    sugestoes.objectivosGerais = [...new Set(sugestoes.objectivosGerais)];
    sugestoes.estrategias = [...new Set(sugestoes.estrategias)];
    sugestoes.materiais = [...new Set(sugestoes.materiais)];
    
    // Adicionar defaults se vazio
    if (sugestoes.areas.length === 0) {
        sugestoes.areas.push('Avaliação mais detalhada necessária');
    }
    if (sugestoes.objectivosGerais.length === 0) {
        sugestoes.objectivosGerais.push('Definir objectivos após avaliação completa');
    }
    if (sugestoes.objectivosEspecificos.length === 0) {
        sugestoes.objectivosEspecificos.push('Definir com base em avaliação mais aprofundada');
    }
    if (sugestoes.estrategias.length === 0) {
        sugestoes.estrategias.push('Seleccionar estratégias após definição de objectivos');
    }
    if (sugestoes.materiais.length === 0) {
        sugestoes.materiais.push('Materiais a definir');
    }
    
    return sugestoes;
}

function guardarPlano() {
    if (!planoActual) return;
    
    const textarea = document.querySelector('.plan-editable');
    if (textarea) {
        planoActual.notas = textarea.value;
    }
    
    planoActual.dataModificacao = new Date().toISOString();
    
    const planos = carregarPlanos();
    const idx = planos.findIndex(p => p.id === planoActual.id);
    if (idx >= 0) {
        planos[idx] = planoActual;
    } else {
        planos.push(planoActual);
    }
    
    guardarPlanos(planos);
    casoActual.planoId = planoActual.id;
    guardarCasoActual();
    
    mostrarToast('Plano guardado!', 'success');
}

function exportarPlano() {
    if (!planoActual) return;
    exportarJSON(planoActual, `plano_${casoActual.id}_${new Date().toISOString().split('T')[0]}.json`);
    mostrarToast('Plano exportado!', 'success');
}

// ============================================================================
// ADICIONAR PROVA
// ============================================================================

function adicionarProva() {
    const select = document.getElementById('prova-sel');
    const escala = document.getElementById('prova-esc').value;
    const valor = parseFloat(document.getElementById('prova-val').value);
    
    if (!select.value || isNaN(valor)) {
        mostrarToast('Selecione uma prova e insira um valor', 'warning');
        return;
    }
    
    const option = select.selectedOptions[0];
    const segs = option.dataset.segs.split(',').map(Number);
    const comp = converterParaCompetencia(valor, escala);
    
    // Aplicar aos segmentos com actualização dinâmica
    segs.forEach(segIdx => {
        if (segIdx < 40) {
            casoActual.competencias[segIdx] = comp;
            
            const input = document.getElementById(`v-${segIdx}`);
            if (input) {
                input.value = comp;
                actualizarZonaInput(input, comp);
            }
            
            const slider = document.querySelector(`.comp-slider[data-idx="${segIdx}"]`);
            if (slider) slider.value = comp;
            
            // Actualização dinâmica
            radarChart.setValor(segIdx, comp);
        }
    });
    
    // Adicionar à lista
    const lista = document.getElementById('prova-list');
    const idx = casoActual.provasAplicadas.length;
    const item = document.createElement('div');
    item.className = 'prova-item';
    item.dataset.idx = idx;
    item.innerHTML = `
        <span><b>${option.text}</b>: ${valor} (${escala}) → <b>${comp}/10</b></span>
        <div class="prova-item-actions">
            <button class="prova-item-edit" title="Editar">✏️</button>
            <button class="prova-item-remove" title="Remover">×</button>
        </div>
    `;
    item.querySelector('.prova-item-edit').addEventListener('click', () => abrirEdicaoProva(parseInt(item.dataset.idx)));
    item.querySelector('.prova-item-remove').addEventListener('click', () => {
        removerProvaAplicada(parseInt(item.dataset.idx));
    });
    lista.appendChild(item);
    
    casoActual.provasAplicadas.push({
        prova: select.value,
        nome: option.text,
        valor,
        escala,
        competencia: comp,
        segmentos: segs,
        data: new Date().toISOString()
    });
    
    document.getElementById('prova-val').value = '';
    document.getElementById('conversion-value').textContent = '—';
    document.getElementById('conversion-value').className = 'conversion-value';
    
    mostrarToast(`${option.text}: ${comp}/10`, 'success');
}

// ============================================================================
// GUARDAR NA CLOUD
// ============================================================================

async function guardarCasoCloud() {
    // Verificar se está autenticado
    if (!API.isAuthenticated()) {
        mostrarToast('Faça login para guardar casos', 'warning');
        return;
    }
    
    // Verificar se há dados mínimos
    const codigo = document.getElementById('caso-id').value.trim();
    if (!codigo) {
        mostrarToast('Preencha o código do caso', 'warning');
        return;
    }
    
    // Verificar se há competências preenchidas
    const temDados = casoActual.competencias.some(c => c !== null);
    if (!temDados) {
        mostrarToast('Preencha pelo menos uma competência', 'warning');
        return;
    }
    
    // Recolher análise clínica se existir
    const analise = {
        padroes: document.getElementById('patterns')?.innerHTML || '',
        hipoteses: document.getElementById('hypotheses')?.innerHTML || '',
        intervencao: document.getElementById('intervention')?.innerHTML || ''
    };
    
    // Preparar dados completos
    const dadosCompletos = {
        codigo: codigo,
        nome: document.getElementById('caso-nome').value.trim(),
        idade: document.getElementById('caso-idade').value.trim(),
        data: document.getElementById('caso-data').value,
        anoEscolar: document.getElementById('caso-esc').value,
        avaliador: document.getElementById('caso-aval').value.trim(),
        competencias: casoActual.competencias,
        provasAplicadas: casoActual.provasAplicadas || [],
        analise: analise,
        planoIA: planoActual || null
    };
    
    try {
        await API.guardarCasoCompleto(dadosCompletos);
        mostrarToast('Caso guardado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao guardar:', error);
        mostrarToast('Erro ao guardar: ' + error.message, 'error');
    }
}

// ============================================================================
// LIMPAR / EXEMPLO
// ============================================================================

function limparFormulario() {
    casoActual = criarCasoVazio();
    planoActual = null;
    
    document.getElementById('caso-id').value = '';
    document.getElementById('caso-nome').value = '';
    document.getElementById('caso-idade').value = '';
    document.getElementById('caso-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('caso-esc').value = '';
    document.getElementById('caso-aval').value = '';
    document.getElementById('esc-info').style.display = 'none';
    
    document.querySelectorAll('.comp-val').forEach(v => {
        v.value = '';
        v.className = 'comp-val zone-green';
    });
    document.querySelectorAll('.comp-slider').forEach(s => s.value = 5);
    document.querySelectorAll('.comp-item.escrita').forEach(el => {
        el.classList.remove('disabled', 'hidden-escrita');
    });
    
    document.getElementById('prova-list').innerHTML = '';
    
    escritaAtiva = true;
    document.getElementById('radar-title').textContent = 'Perfil de Competência Linguística';
    document.getElementById('radar-subtitle').textContent = '';
    document.getElementById('stats-dashboard').style.display = 'none';
    document.getElementById('analysis').style.display = 'none';
    
    const planPanel = document.getElementById('plan-panel');
    if (planPanel) planPanel.style.display = 'none';
    
    radarChart.setDados(null);
    mostrarToast('Formulário limpo', 'success');
}

function carregarExemplo() {
    const exemplo = gerarDadosExemplo();
    carregarCaso(exemplo);
    mostrarToast('Exemplo carregado!', 'success');
}

function carregarCaso(caso) {
    casoActual = caso;
    
    document.getElementById('caso-id').value = caso.id || '';
    document.getElementById('caso-nome').value = caso.nome || '';
    document.getElementById('caso-idade').value = caso.idade || '';
    document.getElementById('caso-data').value = caso.data || '';
    document.getElementById('caso-esc').value = caso.escolaridade || '';
    document.getElementById('caso-aval').value = caso.avaliador || '';
    
    caso.competencias.forEach((comp, idx) => {
        const input = document.getElementById(`v-${idx}`);
        if (input) {
            input.value = comp !== null ? comp : '';
            actualizarZonaInput(input, comp);
        }
        
        const slider = document.querySelector(`.comp-slider[data-idx="${idx}"]`);
        if (slider && comp !== null) slider.value = comp;
    });
    
    verificarEscrita();
    gerarPerfil();
}

// ============================================================================
// STORAGE / HISTÓRICO
// ============================================================================

function guardarCasoActual() {
    if (!casoActual.id) return;
    
    const casos = carregarCasos();
    const idx = casos.findIndex(c => c.id === casoActual.id);
    
    if (idx >= 0) {
        casos[idx] = casoActual;
    } else {
        casos.push(casoActual);
    }
    
    guardarCasos(casos);
}

async function actualizarListaHistorico() {
    const container = document.getElementById('history-list');
    
    // Verificar autenticação
    if (!API.isAuthenticated()) {
        container.innerHTML = '<div class="history-empty"><p>Faça login para ver os casos guardados</p></div>';
        return;
    }
    
    container.innerHTML = '<div class="history-empty"><p>A carregar...</p></div>';
    
    try {
        const casos = await API.listarCasos();
        
        if (casos.length === 0) {
            container.innerHTML = '<div class="history-empty"><p>Nenhum caso guardado</p></div>';
            return;
        }
        
        container.innerHTML = casos.map(caso => `
            <div class="history-item" data-id="${caso.id}">
                <div class="history-item-info">
                    <h4>${caso.codigo || 'Sem código'} - ${caso.nome || 'Sem nome'}</h4>
                    <p>Data: ${caso.data_avaliacao || '-'} | Avaliador: ${caso.avaliador || '-'}</p>
                </div>
                <div class="history-item-actions">
                    <button class="btn-mini" onclick="carregarCasoGuardado(${caso.id})" title="Carregar">↑</button>
                    <button class="btn-mini" onclick="eliminarCasoGuardado(${caso.id})" title="Eliminar">×</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = '<div class="history-empty"><p>Erro ao carregar casos</p></div>';
    }
}

async function carregarCasoGuardado(id) {
    try {
        const caso = await API.obterCaso(id);
        if (!caso) {
            mostrarToast('Caso não encontrado', 'error');
            return;
        }
        
        // Converter formato Supabase para formato da app
        const casoConvertido = {
            id: caso.codigo,
            codigo: caso.codigo,
            nome: caso.nome,
            idade: caso.idade,
            data: caso.data_avaliacao,
            escolaridade: caso.ano_escolar,
            avaliador: caso.avaliador,
            competencias: caso.competencias || new Array(40).fill(null),
            provasAplicadas: (caso.provas || []).map(p => ({
                prova: p.prova_nome,
                sigla: p.prova_sigla,
                segs: p.segmento ? p.segmento.split(',').map(Number) : [],
                valor: p.valor,
                esc: p.escala,
                comp: p.competencia
            }))
        };
        
        // Se não há competências guardadas, reconstruir a partir das provas
        if (!caso.competencias || caso.competencias.every(c => c === null)) {
            casoConvertido.provasAplicadas.forEach(p => {
                if (p.segs && p.comp !== null) {
                    p.segs.forEach(segIdx => {
                        if (segIdx >= 0 && segIdx < 40) {
                            casoConvertido.competencias[segIdx] = p.comp;
                        }
                    });
                }
            });
        }
        
        // Carregar plano IA se existir
        if (caso.plano_ia) {
            planoActual = caso.plano_ia;
        }
        
        carregarCaso(casoConvertido);
        fecharModal('modal-history');
        mostrarToast('Caso carregado!', 'success');
    } catch (error) {
        console.error('Erro ao carregar caso:', error);
        mostrarToast('Erro ao carregar caso', 'error');
    }
}

async function eliminarCasoGuardado(id) {
    if (!confirm('Eliminar este caso?')) return;
    
    try {
        await API.eliminarCaso(id);
        await actualizarListaHistorico();
        mostrarToast('Caso eliminado', 'warning');
    } catch (error) {
        console.error('Erro ao eliminar:', error);
        mostrarToast('Erro ao eliminar caso', 'error');
    }
}

function filtrarHistorico(e) {
    const termo = e.target.value.toLowerCase();
    document.querySelectorAll('.history-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(termo) ? 'flex' : 'none';
    });
}

function exportarTodosCasos() {
    const casos = carregarCasos();
    if (casos.length === 0) {
        mostrarToast('Nenhum caso para exportar', 'warning');
        return;
    }
    exportarJSON(casos, `pcl_todos_casos_${new Date().toISOString().split('T')[0]}.json`);
    mostrarToast(`${casos.length} casos exportados!`, 'success');
}

function importarCaso() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const data = await importarJSON(file);
            if (Array.isArray(data)) {
                const casos = carregarCasos();
                data.forEach(caso => {
                    const idx = casos.findIndex(c => c.id === caso.id);
                    if (idx >= 0) casos[idx] = caso;
                    else casos.push(caso);
                });
                guardarCasos(casos);
                mostrarToast(`${data.length} casos importados!`, 'success');
            } else {
                carregarCaso(data);
                mostrarToast('Caso importado!', 'success');
            }
            actualizarListaHistorico();
        } catch (err) {
            mostrarToast(err.message, 'error');
        }
    };
    input.click();
}

// ============================================================================
// EXPORTAÇÃO
// ============================================================================

function executarExport(tipo) {
    const nome = casoActual.id || 'perfil';
    switch (tipo) {
        case 'png':
            radarChart.downloadPNG(`perfil_${nome}_${casoActual.data}.png`);
            mostrarToast('PNG exportado!', 'success');
            break;
        case 'json':
            exportarJSON(casoActual, `perfil_${nome}_${casoActual.data}.json`);
            mostrarToast('JSON exportado!', 'success');
            break;
        case 'csv':
            exportarCSV(casoActual);
            mostrarToast('CSV exportado!', 'success');
            break;
        case 'pdf':
            gerarRelatorio();
            break;
        case 'word':
            gerarRelatorioWord();
            break;
    }
}

function gerarRelatorio() {
    const win = window.open('', '_blank');
    
    // Obter conteúdo das secções
    const patterns = document.getElementById('patterns')?.innerHTML || '<p>Sem dados</p>';
    const hypotheses = document.getElementById('hypotheses')?.innerHTML || '<p>Sem dados</p>';
    const intervention = document.getElementById('intervention')?.innerHTML || '<p>Sem dados</p>';
    
    // Dados da criança se existir
    let infoCrianca = '';
    if (criancaActual) {
        const ac = criancaActual.antecedentes_clinicos || {};
        const acomp = criancaActual.acompanhamentos || {};
        const af = criancaActual.antecedentes_familiares || {};
        
        // Antecedentes clínicos activos
        const acLista = [];
        if (ac.prematuridade) acLista.push(`Prematuridade (${ac.prematuridadeSemanas || '?'} sem.)`);
        if (ac.audicao) acLista.push('Problemas de audição');
        if (ac.visao) acLista.push('Problemas de visão');
        if (ac.neurologico) acLista.push('Perturbação neurológica');
        if (ac.genetico) acLista.push('Perturbação genética/síndrome');
        if (ac.phda) acLista.push('PHDA');
        if (ac.pea) acLista.push('PEA');
        if (ac.outro && ac.outroDesc) acLista.push(ac.outroDesc);
        
        // Acompanhamentos activos
        const acompLista = [];
        if (acomp.tf) acompLista.push(`Terapia da Fala${acomp.tfDesde ? ' (desde ' + acomp.tfDesde + ')' : ''}`);
        if (acomp.psic) acompLista.push(`Psicologia${acomp.psicDesde ? ' (desde ' + acomp.psicDesde + ')' : ''}`);
        if (acomp.to) acompLista.push(`Terapia Ocupacional${acomp.toDesde ? ' (desde ' + acomp.toDesde + ')' : ''}`);
        if (acomp.fisio) acompLista.push(`Fisioterapia${acomp.fisioDesde ? ' (desde ' + acomp.fisioDesde + ')' : ''}`);
        if (acomp.pedopsiq) acompLista.push(`Pedopsiquiatria${acomp.pedopsiqDesde ? ' (desde ' + acomp.pedopsiqDesde + ')' : ''}`);
        if (acomp.neuroped) acompLista.push(`Neuropediatria${acomp.neuropedDesde ? ' (desde ' + acomp.neuropedDesde + ')' : ''}`);
        if (acomp.apoio) acompLista.push(`Apoio educativo${acomp.apoioDesde ? ' (desde ' + acomp.apoioDesde + ')' : ''}`);
        
        // Antecedentes familiares activos
        const afLista = [];
        if (af.linguagem) afLista.push('Dificuldades de linguagem');
        if (af.leitura) afLista.push('Dificuldades de leitura');
        if (af.escrita) afLista.push('Dificuldades de escrita');
        if (af.aprendizagem) afLista.push('Dificuldades de aprendizagem');
        
        infoCrianca = `
            <div class="section-crianca">
                <h2>Informação Clínica</h2>
                <div class="info-clinica-grid">
                    <div class="info-clinica-col">
                        <h4>Dados de Desenvolvimento</h4>
                        <table class="info-mini-table">
                            ${criancaActual.idade_primeiras_palavras ? `<tr><td>Primeiras palavras:</td><td>${criancaActual.idade_primeiras_palavras}</td></tr>` : ''}
                            ${criancaActual.idade_primeiras_frases ? `<tr><td>Primeiras frases:</td><td>${criancaActual.idade_primeiras_frases}</td></tr>` : ''}
                            ${criancaActual.idade_primeiros_passos ? `<tr><td>Primeiros passos:</td><td>${criancaActual.idade_primeiros_passos}</td></tr>` : ''}
                        </table>
                        ${criancaActual.preocupacoes_desenvolvimento ? `<p class="preocupacoes"><strong>Preocupações:</strong> ${criancaActual.preocupacoes_desenvolvimento}</p>` : ''}
                    </div>
                    <div class="info-clinica-col">
                        <h4>Antecedentes Clínicos</h4>
                        ${acLista.length > 0 ? `<ul>${acLista.map(a => `<li>${a}</li>`).join('')}</ul>` : '<p class="sem-dados">Sem antecedentes relevantes</p>'}
                    </div>
                    <div class="info-clinica-col">
                        <h4>Acompanhamentos</h4>
                        ${acompLista.length > 0 ? `<ul>${acompLista.map(a => `<li>${a}</li>`).join('')}</ul>` : '<p class="sem-dados">Sem acompanhamentos</p>'}
                    </div>
                    <div class="info-clinica-col">
                        <h4>Antecedentes Familiares</h4>
                        ${afLista.length > 0 ? `<ul>${afLista.map(a => `<li>${a}</li>`).join('')}</ul>${af.quem ? `<p><small>Grau: ${af.quem}</small></p>` : ''}` : '<p class="sem-dados">Sem antecedentes relevantes</p>'}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Gerar secção do plano terapêutico se existir
    let planoHtml = '';
    if (planoActual || casoActual.planoTerapeutico) {
        const plano = planoActual || casoActual.planoTerapeutico;
        planoHtml = `
            <div class="section page-break">
                <h2>Plano Terapêutico</h2>
                <div class="plano-content">
                    ${plano.resumo ? `<p class="plano-resumo">${plano.resumo}</p>` : ''}
                    ${plano.objectivo_geral ? `<div class="plano-obj-geral"><strong>Objectivo Geral:</strong> ${plano.objectivo_geral}</div>` : ''}
                    ${plano.objectivos_especificos?.length ? `
                        <h4>Objectivos Específicos</h4>
                        <ul>${plano.objectivos_especificos.map(o => `<li>${o}</li>`).join('')}</ul>
                    ` : ''}
                    ${plano.estrategias?.length ? `
                        <h4>Estratégias de Intervenção</h4>
                        <ul>${plano.estrategias.map(e => `<li>${e}</li>`).join('')}</ul>
                    ` : ''}
                    ${plano.actividades_sugeridas?.length ? `
                        <h4>Actividades Sugeridas</h4>
                        <ul>${plano.actividades_sugeridas.map(a => `<li>${a}</li>`).join('')}</ul>
                    ` : ''}
                    ${plano.frequencia_sugerida || plano.duracao_estimada ? `
                        <div class="plano-freq">
                            ${plano.frequencia_sugerida ? `<span><strong>Frequência:</strong> ${plano.frequencia_sugerida}</span>` : ''}
                            ${plano.duracao_estimada ? `<span><strong>Duração Estimada:</strong> ${plano.duracao_estimada}</span>` : ''}
                        </div>
                    ` : ''}
                    ${plano.recomendacoes_familia?.length ? `
                        <h4>Recomendações para a Família</h4>
                        <ul>${plano.recomendacoes_familia.map(r => `<li>${r}</li>`).join('')}</ul>
                    ` : ''}
                </div>
                <p class="ia-disclaimer">Este plano foi gerado por IA e deve ser validado pelo terapeuta responsável.</p>
            </div>
        `;
    }
    
    // Gerar lista de provas aplicadas
    let provasHtml = '';
    if (casoActual.provasAplicadas?.length > 0) {
        provasHtml = `
            <div class="section">
                <h2>Provas Aplicadas</h2>
                <table class="provas-table">
                    <thead>
                        <tr>
                            <th>Prova</th>
                            <th>Valor</th>
                            <th>Escala</th>
                            <th>Competência</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${casoActual.provasAplicadas.map(p => `
                            <tr>
                                <td>${p.prova || p.nome || '-'}</td>
                                <td>${p.valor || '-'}</td>
                                <td>${(p.esc || p.escala || '').toUpperCase()}</td>
                                <td class="comp-cell"><strong>${p.comp || p.competencia || '-'}</strong>/10</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Notas clínicas
    let notasHtml = '';
    if (casoActual.notas || (criancaActual && criancaActual.notas)) {
        const notas = casoActual.notas || criancaActual.notas;
        notasHtml = `
            <div class="section">
                <h2>Notas Clínicas</h2>
                <div class="notas-box">${notas.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    // Nome e código
    const nomeCaso = criancaActual ? criancaActual.nome : (casoActual.nome || 'Sem nome');
    const codigoCaso = criancaActual ? criancaActual.codigo : (casoActual.codigo || casoActual.id || '-');
    const diagnostico = criancaActual ? criancaActual.diagnostico : '';
    
    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Relatório PERLIM - ${nomeCaso}</title>
    <style>
        @page { 
            size: A4; 
            margin: 15mm 15mm 20mm 15mm;
        }
        @media print {
            body { padding: 0; }
            .page-break { page-break-before: always; }
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
            font-family: 'Segoe UI', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            padding: 30px 40px; 
            color: #333; 
            line-height: 1.5; 
            font-size: 11pt;
            background: white;
        }
        
        /* HEADER CAIDI */
        .header-caidi {
            margin-bottom: 20px;
        }
        
        .header-caidi img {
            width: 100%;
            max-width: 100%;
            height: auto;
        }
        
        /* TÍTULO DO RELATÓRIO */
        .report-title {
            text-align: center;
            margin: 25px 0;
        }
        
        .report-title h1 {
            font-size: 18pt;
            color: #00A79D;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .report-title .subtitle {
            font-size: 10pt;
            color: #666;
        }
        
        /* DADOS DA CRIANÇA */
        .dados-crianca {
            background: linear-gradient(135deg, #f8fffe 0%, #e8f7f5 100%);
            border: 1px solid #b8e6e0;
            border-radius: 10px;
            padding: 20px 25px;
            margin-bottom: 25px;
        }
        
        .dados-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        
        .dado-item label {
            font-size: 8pt;
            color: #00A79D;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            display: block;
            margin-bottom: 3px;
        }
        
        .dado-item p {
            font-size: 12pt;
            font-weight: 600;
            color: #333;
        }
        
        .dado-item.destaque p {
            font-size: 14pt;
            color: #00A79D;
        }
        
        /* RADAR */
        .radar-container {
            text-align: center;
            margin: 25px 0;
            padding: 15px;
            background: #fafafa;
            border-radius: 10px;
        }
        
        .radar-container img {
            max-width: 420px;
            width: 100%;
        }
        
        .radar-legenda {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 25px;
            font-size: 9pt;
            color: #666;
        }
        
        .legenda-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .legenda-cor {
            width: 14px;
            height: 14px;
            border-radius: 3px;
        }
        
        .legenda-cor.vermelho { background: #FFCDD2; border: 1px solid #EF5350; }
        .legenda-cor.amarelo { background: #FFF9C4; border: 1px solid #FFEB3B; }
        .legenda-cor.branco { background: #fff; border: 1px solid #ddd; }
        
        /* SECÇÕES */
        .section {
            margin: 25px 0;
        }
        
        .section h2 {
            font-size: 12pt;
            color: #00A79D;
            font-weight: 700;
            padding-bottom: 8px;
            border-bottom: 2px solid #e0e0e0;
            margin-bottom: 15px;
        }
        
        .section h4 {
            font-size: 10pt;
            color: #333;
            margin: 15px 0 8px;
            font-weight: 600;
        }
        
        /* INFO CLÍNICA */
        .section-crianca h2 {
            margin-bottom: 15px;
        }
        
        .info-clinica-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .info-clinica-col {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 15px;
        }
        
        .info-clinica-col h4 {
            font-size: 9pt;
            color: #00A79D;
            text-transform: uppercase;
            margin: 0 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .info-clinica-col ul {
            margin: 0;
            padding-left: 18px;
            font-size: 10pt;
        }
        
        .info-clinica-col li {
            margin-bottom: 4px;
        }
        
        .info-mini-table {
            width: 100%;
            font-size: 10pt;
        }
        
        .info-mini-table td {
            padding: 3px 0;
        }
        
        .info-mini-table td:first-child {
            color: #666;
            width: 55%;
        }
        
        .sem-dados {
            color: #999;
            font-style: italic;
            font-size: 10pt;
        }
        
        .preocupacoes {
            margin-top: 10px;
            font-size: 10pt;
            padding: 8px;
            background: #fff3e0;
            border-radius: 5px;
        }
        
        /* ANÁLISE */
        .analysis-item {
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 8px;
            font-size: 10pt;
        }
        
        .critical { background: #FFEBEE; border-left: 4px solid #E53935; }
        .warning { background: #FFF8E1; border-left: 4px solid #FFB300; }
        .success { background: #E8F5E9; border-left: 4px solid #43A047; }
        
        /* TABELAS */
        .provas-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
        }
        
        .provas-table th, .provas-table td {
            padding: 10px 12px;
            border: 1px solid #e0e0e0;
            text-align: left;
        }
        
        .provas-table th {
            background: #00A79D;
            color: white;
            font-weight: 600;
            font-size: 9pt;
            text-transform: uppercase;
        }
        
        .provas-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        .comp-cell {
            text-align: center;
            color: #00A79D;
        }
        
        /* NOTAS */
        .notas-box {
            background: #f5f5f5;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 4px solid #00A79D;
            font-size: 10pt;
            line-height: 1.6;
        }
        
        /* PLANO */
        .plano-content {
            background: linear-gradient(135deg, #f0fdf9 0%, #e0f7f3 100%);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #a7e8dc;
        }
        
        .plano-resumo {
            font-size: 11pt;
            margin-bottom: 15px;
            padding: 12px;
            background: white;
            border-radius: 6px;
        }
        
        .plano-obj-geral {
            font-size: 11pt;
            padding: 10px 15px;
            background: #00A79D;
            color: white;
            border-radius: 6px;
            margin-bottom: 15px;
        }
        
        .plano-content ul {
            margin: 8px 0 15px 20px;
        }
        
        .plano-content li {
            margin-bottom: 5px;
        }
        
        .plano-freq {
            display: flex;
            gap: 30px;
            padding: 10px 15px;
            background: white;
            border-radius: 6px;
            margin: 15px 0;
            font-size: 10pt;
        }
        
        .ia-disclaimer {
            font-size: 9pt;
            color: #666;
            text-align: center;
            margin-top: 15px;
            font-style: italic;
        }
        
        /* FOOTER */
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8pt;
            color: #888;
        }
        
        .footer-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .footer-left img {
            height: 25px;
            opacity: 0.6;
        }
        
        .footer-center {
            text-align: center;
        }
        
        .footer-right {
            text-align: right;
        }
    </style>
</head>
<body>
    <!-- HEADER CAIDI -->
    <!-- HEADER CAIDI -->
    <div class="header-caidi">
        <img src="${HEADER_CAIDI}" alt="CAIDI - Centro de Apoio e Intervenção no Desenvolvimento Infantil">
    </div>
    
    <!-- TÍTULO -->
    <div class="report-title">
        <h1>PERLIM — Perfil Linguístico Multidimensional</h1>
        <p class="subtitle">Relatório de Avaliação Linguística</p>
    </div>
    
    <!-- DADOS DA CRIANÇA -->
    <div class="dados-crianca">
        <div class="dados-grid">
            <div class="dado-item destaque">
                <label>Código</label>
                <p>${codigoCaso}</p>
            </div>
            <div class="dado-item">
                <label>Nome</label>
                <p>${nomeCaso}</p>
            </div>
            <div class="dado-item">
                <label>Idade</label>
                <p>${casoActual.idade || '-'}</p>
            </div>
            <div class="dado-item">
                <label>Data da Avaliação</label>
                <p>${casoActual.data ? new Date(casoActual.data).toLocaleDateString('pt-PT') : '-'}</p>
            </div>
        </div>
        ${diagnostico ? `<p style="margin-top:12px;font-size:10pt"><strong>Diagnóstico/Hipótese:</strong> ${diagnostico}</p>` : ''}
    </div>
    
    <!-- RADAR -->
    <div class="radar-container">
        <img src="${radarChart.toDataURL()}" alt="Perfil Linguístico Multidimensional">
        <div class="radar-legenda">
            <div class="legenda-item"><span class="legenda-cor vermelho"></span> 0-3: Dificuldade Acentuada</div>
            <div class="legenda-item"><span class="legenda-cor amarelo"></span> 3-5: Dificuldade Moderada</div>
            <div class="legenda-item"><span class="legenda-cor branco"></span> 5-10: Desempenho Típico</div>
        </div>
    </div>
    
    ${infoCrianca}
    
    ${provasHtml}
    
    <div class="section">
        <h2>Padrões Identificados</h2>
        ${patterns}
    </div>
    
    <div class="section">
        <h2>Hipóteses Diagnósticas</h2>
        ${hypotheses}
    </div>
    
    <div class="section">
        <h2>Prioridades de Intervenção</h2>
        ${intervention}
    </div>
    
    ${notasHtml}
    
    ${planoHtml}
    
    <!-- FOOTER -->
    <div class="footer">
        <div class="footer-left">
            <span>CAIDI</span>
        </div>
        <div class="footer-center">
            <p>PERLIM — Perfil Linguístico Multidimensional</p>
            <p>Modelo: Dina Caetano Alves (2019) · Operacionalização: Joana Miguel (2026)</p>
        </div>
        <div class="footer-right">
            <p>Gerado em ${new Date().toLocaleDateString('pt-PT')}</p>
            <p>© ${new Date().getFullYear()} Joana Miguel</p>
        </div>
    </div>
    
    <script>
        window.onload = function() { 
            setTimeout(() => window.print(), 500);
        }
    </script>
</body>
</html>`;
    
    win.document.write(html);
    win.document.close();
    mostrarToast('Relatório gerado!', 'success');
}

// ============================================================================
// RELATÓRIO WORD - EXPORTAÇÃO NARRATIVA
// ============================================================================

async function gerarRelatorioWord() {
    // Verificar se há dados
    if (!casoActual || !casoActual.competencias || casoActual.competencias.length === 0) {
        mostrarToast('Preencha o perfil antes de exportar', 'warning');
        return;
    }
    
    // Carregar biblioteca se necessário
    try {
        mostrarToast('A preparar exportação...', 'info');
        await carregarBibliotecaDocx();
        await carregarHeaderCaidi(); // Carregar imagem header
    } catch (error) {
        mostrarToast('Erro ao carregar biblioteca de exportação', 'error');
        return;
    }
    
    try {
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
                Header, Footer, AlignmentType, HeadingLevel, BorderStyle, 
                WidthType, PageNumber, ShadingType, LevelFormat } = docx;
        
        // Dados básicos
        const nomeCaso = criancaActual ? criancaActual.nome : (casoActual.nome || 'Sem nome');
        const codigoCaso = criancaActual ? criancaActual.codigo : (casoActual.codigo || casoActual.id || '-');
        const idadeCaso = casoActual.idade || '-';
        const dataCaso = casoActual.data ? new Date(casoActual.data).toLocaleDateString('pt-PT') : new Date().toLocaleDateString('pt-PT');
        const diagnostico = criancaActual ? criancaActual.diagnostico : '';
        
        // Garantir que competencias é um array válido
        const competencias = casoActual.competencias || new Array(40).fill(null);
        
        // Calcular médias por domínio
        const mediasPorDominio = [];
        for (let d = 0; d < 5; d++) {
            const segsDominio = competencias.slice(d * 8, (d + 1) * 8);
            const valoresValidos = segsDominio.filter(v => v !== null && v !== undefined && !isNaN(v));
            if (valoresValidos.length > 0) {
                const media = valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length;
                mediasPorDominio.push({
                    dominio: DOMINIOS[d].nome,
                    media: media.toFixed(1),
                    classificacao: obterClassificacaoWord(media),
                    valores: segsDominio
                });
            } else {
                mediasPorDominio.push({
                    dominio: DOMINIOS[d].nome,
                    media: null,
                    classificacao: 'Não avaliado',
                    valores: segsDominio
                });
            }
        }
        
        // Função auxiliar para obter classificação
        function obterClassificacaoWord(valor) {
            if (valor === null) return 'Não avaliado';
            const v = parseFloat(valor);
            if (v <= 2) return 'Défice acentuado';
            if (v <= 4) return 'Dificuldade moderada';
            if (v <= 5) return 'Desempenho limítrofe';
            if (v <= 7) return 'Desempenho típico';
            return 'Desempenho acima da média';
        }
        
        // Gerar texto narrativo para cada domínio
        function gerarTextoNarrativo(dominioData, idx) {
            const d = dominioData;
            if (d.media === null) {
                return `O domínio ${d.dominio} não foi avaliado nesta sessão.`;
            }
            
            let texto = `No domínio ${d.dominio}, a criança apresenta um desempenho global classificado como "${d.classificacao}" (pontuação média: ${d.media}/10). `;
            
            // Analisar subcomponentes
            const nomesDimensoes = ['Implícito-Compreensão-Oral', 'Implícito-Compreensão-Escrita', 
                                   'Implícito-Expressão-Oral', 'Implícito-Expressão-Escrita',
                                   'Explícito-Compreensão-Oral', 'Explícito-Compreensão-Escrita',
                                   'Explícito-Expressão-Oral', 'Explícito-Expressão-Escrita'];
            
            const nomesDimensoesFono = ['Implícito-Perceção-Oral', 'Implícito-Perceção-Escrita', 
                                        'Implícito-Produção-Oral', 'Implícito-Produção-Escrita',
                                        'Explícito-Perceção-Oral', 'Explícito-Perceção-Escrita',
                                        'Explícito-Produção-Oral', 'Explícito-Produção-Escrita'];
            
            const dimensoes = idx === 0 ? nomesDimensoesFono : nomesDimensoes;
            
            const pontosFracos = [];
            const pontosFortes = [];
            
            d.valores.forEach((v, i) => {
                if (v !== null && v !== undefined) {
                    if (v <= 3) pontosFracos.push({ nome: dimensoes[i], valor: v });
                    else if (v >= 7) pontosFortes.push({ nome: dimensoes[i], valor: v });
                }
            });
            
            if (pontosFracos.length > 0) {
                texto += `Verificam-se dificuldades em: ${pontosFracos.map(p => p.nome.toLowerCase().replace(/-/g, ' ')).join(', ')}. `;
            }
            
            if (pontosFortes.length > 0) {
                texto += `Áreas de melhor desempenho: ${pontosFortes.map(p => p.nome.toLowerCase().replace(/-/g, ' ')).join(', ')}. `;
            }
            
            return texto;
        }
        
        // Gerar síntese global
        function gerarSinteseGlobal(dominios) {
            const avaliados = dominios.filter(d => d.media !== null);
            if (avaliados.length === 0) return "Não foram registados dados suficientes para uma síntese global.";
            
            const mediaGlobal = avaliados.reduce((sum, d) => sum + parseFloat(d.media), 0) / avaliados.length;
            
            let texto = `A avaliação global revela um perfil linguístico com uma pontuação média de ${mediaGlobal.toFixed(1)}/10. `;
            
            const ordenados = [...avaliados].sort((a, b) => parseFloat(b.media) - parseFloat(a.media));
            
            if (ordenados.length >= 2) {
                texto += `O domínio com melhor desempenho é o ${ordenados[0].dominio} (${ordenados[0].media}), enquanto o domínio ${ordenados[ordenados.length - 1].dominio} apresenta os resultados mais baixos (${ordenados[ordenados.length - 1].media}). `;
            }
            
            const comDificuldades = avaliados.filter(d => parseFloat(d.media) < 5);
            if (comDificuldades.length > 0) {
                texto += `Identificam-se dificuldades nos seguintes domínios: ${comDificuldades.map(d => d.dominio).join(', ')}. `;
            }
            
            return texto;
        }
        
        // Gerar tabela resumo
        function gerarTabelaResumo(dominios) {
            const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
            const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
            
            const headerRow = new TableRow({
                tableHeader: true,
                children: [
                    new TableCell({
                        borders: cellBorders,
                        shading: { fill: "00A79D", type: ShadingType.CLEAR },
                        width: { size: 3000, type: WidthType.DXA },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Domínio", bold: true, color: "FFFFFF", size: 22 })] })]
                    }),
                    new TableCell({
                        borders: cellBorders,
                        shading: { fill: "00A79D", type: ShadingType.CLEAR },
                        width: { size: 2000, type: WidthType.DXA },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Média", bold: true, color: "FFFFFF", size: 22 })] })]
                    }),
                    new TableCell({
                        borders: cellBorders,
                        shading: { fill: "00A79D", type: ShadingType.CLEAR },
                        width: { size: 4360, type: WidthType.DXA },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Classificação", bold: true, color: "FFFFFF", size: 22 })] })]
                    })
                ]
            });
            
            const dataRows = dominios.map(d => {
                const fillColor = d.media === null ? "F5F5F5" : (parseFloat(d.media) < 5 ? "FFEBEE" : "E8F5E9");
                return new TableRow({
                    children: [
                        new TableCell({
                            borders: cellBorders,
                            shading: { fill: fillColor, type: ShadingType.CLEAR },
                            width: { size: 3000, type: WidthType.DXA },
                            children: [new Paragraph({ children: [new TextRun({ text: d.dominio, bold: true })] })]
                        }),
                        new TableCell({
                            borders: cellBorders,
                            shading: { fill: fillColor, type: ShadingType.CLEAR },
                            width: { size: 2000, type: WidthType.DXA },
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(d.media !== null ? `${d.media}/10` : "-")] })]
                        }),
                        new TableCell({
                            borders: cellBorders,
                            shading: { fill: fillColor, type: ShadingType.CLEAR },
                            width: { size: 4360, type: WidthType.DXA },
                            children: [new Paragraph({ children: [new TextRun(d.classificacao)] })]
                        })
                    ]
                });
            });
            
            return [
                new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),
                new Table({
                    columnWidths: [3000, 2000, 4360],
                    rows: [headerRow, ...dataRows]
                }),
                new Paragraph({ spacing: { after: 300 }, children: [] })
            ];
        }
        
        // Gerar recomendações
        function gerarRecomendacoes(dominios) {
            const comDificuldades = dominios.filter(d => d.media !== null && parseFloat(d.media) < 5);
            
            if (comDificuldades.length === 0) {
                return [
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [new TextRun("Com base nos resultados obtidos, não se identificam áreas de dificuldade acentuada. Recomenda-se a continuação do acompanhamento.")]
                    })
                ];
            }
            
            const paragrafos = [
                new Paragraph({
                    spacing: { after: 200 },
                    children: [new TextRun("Com base nos resultados obtidos, recomendam-se as seguintes orientações para intervenção:")]
                })
            ];
            
            const recomendacoesPorDominio = {
                'Fonológico': "Trabalhar a discriminação auditiva, consciência fonológica e produção articulatória.",
                'Morfológico': "Estimular a formação de palavras, concordâncias gramaticais e consciência morfológica.",
                'Sintático': "Trabalhar a construção frásica, compreensão de orações complexas e organização do discurso.",
                'Semântico': "Ampliar o vocabulário, trabalhar relações entre palavras e linguagem figurada.",
                'Pragmático': "Estimular competências comunicativas, adequação ao contexto e narrativa."
            };
            
            comDificuldades.forEach(d => {
                paragrafos.push(
                    new Paragraph({
                        spacing: { before: 150, after: 100 },
                        children: [
                            new TextRun({ text: `${d.dominio}: `, bold: true }),
                            new TextRun(recomendacoesPorDominio[d.dominio] || '')
                        ]
                    })
                );
            });
            
            return paragrafos;
        }
        
        // Criar documento
        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: { font: "Arial", size: 22 }
                    }
                },
                paragraphStyles: [
                    {
                        id: "Title",
                        name: "Title",
                        basedOn: "Normal",
                        run: { size: 48, bold: true, color: "00A79D", font: "Arial" },
                        paragraph: { spacing: { after: 200 }, alignment: AlignmentType.CENTER }
                    },
                    {
                        id: "Heading1",
                        name: "Heading 1",
                        basedOn: "Normal",
                        run: { size: 28, bold: true, color: "00A79D", font: "Arial" },
                        paragraph: { spacing: { before: 400, after: 200 } }
                    },
                    {
                        id: "Heading2",
                        name: "Heading 2",
                        basedOn: "Normal",
                        run: { size: 24, bold: true, color: "333333", font: "Arial" },
                        paragraph: { spacing: { before: 300, after: 150 } }
                    }
                ]
            },
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({ text: "CAIDI — Centro de Apoio e Intervenção no Desenvolvimento Infantil", size: 18, color: "888888" })
                                ]
                            })
                        ]
                    })
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({ text: "Página ", size: 18 }),
                                    new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                                    new TextRun({ text: " | PERLIM", size: 18, color: "888888" })
                                ]
                            })
                        ]
                    })
                },
                children: [
                    // Título
                    new Paragraph({
                        heading: HeadingLevel.TITLE,
                        children: [new TextRun("PERLIM")]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                        children: [new TextRun({ text: "Perfil Linguístico Multidimensional — Relatório de Avaliação", size: 24, color: "666666" })]
                    }),
                    
                    // Identificação
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Identificação")] }),
                    new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Código: ", bold: true }), new TextRun(codigoCaso)] }),
                    new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Nome: ", bold: true }), new TextRun(nomeCaso)] }),
                    new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Idade: ", bold: true }), new TextRun(idadeCaso)] }),
                    new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Data: ", bold: true }), new TextRun(dataCaso)] }),
                    ...(diagnostico ? [new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Diagnóstico: ", bold: true }), new TextRun(diagnostico)] })] : []),
                    
                    // Introdução
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Introdução")] }),
                    new Paragraph({
                        spacing: { after: 300 },
                        children: [new TextRun(`O presente relatório apresenta os resultados da avaliação linguística realizada através do PERLIM. Este instrumento analisa as competências linguísticas em cinco domínios (Fonológico, Morfológico, Sintático, Semântico e Pragmático), considerando níveis de processamento, circuitos e modalidades.`)]
                    }),
                    
                    // Resultados
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Resultados por Domínio")] }),
                    
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1. Domínio Fonológico")] }),
                    new Paragraph({ spacing: { after: 200 }, children: [new TextRun(gerarTextoNarrativo(mediasPorDominio[0], 0))] }),
                    
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2. Domínio Morfológico")] }),
                    new Paragraph({ spacing: { after: 200 }, children: [new TextRun(gerarTextoNarrativo(mediasPorDominio[1], 1))] }),
                    
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3. Domínio Sintático")] }),
                    new Paragraph({ spacing: { after: 200 }, children: [new TextRun(gerarTextoNarrativo(mediasPorDominio[2], 2))] }),
                    
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4. Domínio Semântico")] }),
                    new Paragraph({ spacing: { after: 200 }, children: [new TextRun(gerarTextoNarrativo(mediasPorDominio[3], 3))] }),
                    
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.5. Domínio Pragmático")] }),
                    new Paragraph({ spacing: { after: 300 }, children: [new TextRun(gerarTextoNarrativo(mediasPorDominio[4], 4))] }),
                    
                    // Síntese
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Síntese")] }),
                    new Paragraph({ spacing: { after: 200 }, children: [new TextRun(gerarSinteseGlobal(mediasPorDominio))] }),
                    
                    // Tabela
                    ...gerarTabelaResumo(mediasPorDominio),
                    
                    // Recomendações
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Orientações")] }),
                    ...gerarRecomendacoes(mediasPorDominio),
                    
                    // Rodapé
                    new Paragraph({
                        spacing: { before: 600 },
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `Relatório gerado em ${new Date().toLocaleDateString('pt-PT')} | © Joana Miguel | CAIDI`, size: 18, color: "888888" })]
                    })
                ]
            }]
        });
        
        // Gerar e descarregar (usar toBlob para browser)
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PERLIM_${codigoCaso}_${dataCaso.replace(/\//g, '-')}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('Relatório Word exportado!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar Word:', error);
        mostrarToast('Erro ao gerar relatório: ' + error.message, 'error');
    }
}

// ============================================================================
// INFO MODAL
// ============================================================================

function mostrarInfoTab(tab) {
    document.querySelectorAll('.info-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.info === tab);
    });
    
    const content = document.getElementById('info-content');
    
    switch (tab) {
        case 'provas':
            const provas = obterTodasProvas();
            content.innerHTML = `
                <div style="margin-bottom:var(--space-4)">
                    <button class="btn btn-primary btn-sm" onclick="abrirModalNovaProva()">
                        + Nova Prova
                    </button>
                </div>
                <table class="info-table">
                    <thead><tr><th>Prova</th><th>Escala</th><th>Domínio</th><th>Tarefas</th><th></th></tr></thead>
                    <tbody>
                        ${provas.map(p => `<tr><td><b>${p.nome}</b>${p.custom ? ' <span style="color:var(--caidi-turquesa)">★</span>' : ''}</td><td>${p.escala.toUpperCase()}</td><td>${p.dominio}</td><td>${p.tarefas?.length || 1}</td><td>${p.custom ? `<button class="btn-mini" onclick="eliminarProvaCustom('${p.id}')">×</button>` : ''}</td></tr>`).join('')}
                    </tbody>
                </table>
                <p style="margin-top:1.5rem;font-size:0.8rem;color:var(--text-muted);line-height:1.6;font-style:italic">
                    Os nomes dos instrumentos são propriedade dos respectivos autores e editoras. 
                    O mapeamento dos segmentos avaliados constitui uma interpretação clínica para fins de integração do perfil linguístico.
                </p>
            `;
            break;
        case 'conversao':
            content.innerHTML = `<table class="info-table"><thead><tr><th>Comp</th><th>Descrição</th><th>Perc</th><th>QI</th><th>Z</th></tr></thead><tbody>${TABELA_CONVERSAO.map(r => `<tr class="zone-${r.zona}"><td><b>${r.comp}</b></td><td>${r.desc}</td><td>${r.percMin===0?'<1':r.percMin}-${r.percMax}</td><td>${r.qiMin}-${r.qiMax}</td><td>${r.zMin===-Infinity?'<-2.5':r.zMin} a ${r.zMax===Infinity?'>+2':r.zMax}</td></tr>`).join('')}</tbody></table>`;
            break;
        case 'modelo':
            content.innerHTML = `<div style="line-height:1.8"><h3 style="color:var(--caidi-turquesa);margin-bottom:1rem">Modelo Teórico</h3><p>O <b>Perfil de Competência Linguística</b> baseia-se nos <b>Quadrantes de Alves (2019)</b>.</p><h4 style="margin:1.5rem 0 0.5rem">Estrutura dos 40 Segmentos</h4><ul style="margin:0.5rem 0 0.5rem 1.5rem"><li><b>5 Domínios:</b> Fonológico, Morfológico, Sintático, Semântico, Pragmático</li><li><b>2 Níveis:</b> Implícito, Explícito</li><li><b>2 Circuitos:</b> Compreensão, Expressão</li><li><b>2 Modalidades:</b> Oral, Escrita</li></ul></div>`;
            break;
        case 'atalhos':
            content.innerHTML = `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem"><div class="info-item"><label>Gerar</label><p><kbd>G</kbd></p></div><div class="info-item"><label>Exemplo</label><p><kbd>E</kbd></p></div><div class="info-item"><label>Tema</label><p><kbd>T</kbd></p></div><div class="info-item"><label>Histórico</label><p><kbd>H</kbd></p></div><div class="info-item"><label>Info</label><p><kbd>I</kbd></p></div><div class="info-item"><label>Fullscreen</label><p><kbd>F</kbd></p></div></div>`;
            break;
    }
}

// ============================================================================
// GESTÃO DE PROVAS CUSTOM
// ============================================================================

function abrirModalNovaProva() {
    // Criar modal se não existir
    let modal = document.getElementById('modal-nova-prova');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-nova-prova';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <h2>Nova Prova</h2>
                    <button class="btn-close" data-close-modal>×</button>
                </div>
                <div class="modal-body">
                    <div class="prova-form">
                        <div class="form-row-3">
                            <div class="form-group">
                                <label>Nome da Prova</label>
                                <input type="text" id="nova-prova-nome" placeholder="Ex: Minha Prova">
                            </div>
                            <div class="form-group">
                                <label>Escala</label>
                                <select id="nova-prova-escala">
                                    <option value="perc">Percentil</option>
                                    <option value="qi">QI</option>
                                    <option value="z">Nota Z</option>
                                    <option value="t">Nota T</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Domínio Principal</label>
                                <select id="nova-prova-modulo">
                                    ${MODULOS.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Descrição</label>
                            <input type="text" id="nova-prova-desc" placeholder="Breve descrição">
                        </div>
                        <div class="form-group">
                            <label>Segmentos Afectados</label>
                            <div class="segmentos-selector" id="segmentos-selector"></div>
                        </div>
                        <div class="form-group">
                            <label>Tarefas</label>
                            <div class="tarefas-list" id="nova-prova-tarefas"></div>
                            <div class="tarefa-add">
                                <input type="text" id="nova-tarefa-nome" placeholder="Nome da tarefa">
                                <input type="number" id="nova-tarefa-itens" placeholder="Itens" style="width:80px">
                                <button class="btn btn-secondary" onclick="adicionarTarefaNovaProva()">+</button>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" onclick="guardarNovaProva()">Guardar Prova</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    }
    
    // Preencher selector de segmentos
    const selector = document.getElementById('segmentos-selector');
    selector.innerHTML = SEGMENTOS.map(seg => {
        const circuito = (seg.modulo === 0) ? CIRCUITOS_SUBLEXICAL[seg.circuito] : CIRCUITOS[seg.circuito];
        return `
        <label class="seg-checkbox" data-seg="${seg.id}">
            <input type="checkbox" value="${seg.id}">
            <span style="font-size:9px;color:${MODULOS[seg.modulo].cor}">${MODULOS[seg.modulo].abrev}</span>
            <span>${NIVEIS[seg.nivel].nome.slice(0,3)}</span>
            <span>${circuito.abrev}-${MODALIDADES[seg.modalidade].abrev}</span>
        </label>
    `}).join('');
    
    selector.querySelectorAll('.seg-checkbox').forEach(label => {
        label.addEventListener('click', () => {
            label.classList.toggle('selected');
            label.querySelector('input').checked = label.classList.contains('selected');
        });
    });
    
    // Limpar
    document.getElementById('nova-prova-nome').value = '';
    document.getElementById('nova-prova-desc').value = '';
    document.getElementById('nova-prova-tarefas').innerHTML = '';
    
    modal.classList.add('active');
}

window.novaProvaTarefas = [];

function adicionarTarefaNovaProva() {
    const nome = document.getElementById('nova-tarefa-nome').value;
    const itens = parseInt(document.getElementById('nova-tarefa-itens').value) || 10;
    
    if (!nome) {
        mostrarToast('Insira o nome da tarefa', 'warning');
        return;
    }
    
    const tarefa = { id: `t${Date.now()}`, nome, itens };
    window.novaProvaTarefas.push(tarefa);
    
    const lista = document.getElementById('nova-prova-tarefas');
    const item = document.createElement('div');
    item.className = 'tarefa-item';
    item.innerHTML = `<span>${nome}</span><span>${itens} itens</span>`;
    lista.appendChild(item);
    
    document.getElementById('nova-tarefa-nome').value = '';
    document.getElementById('nova-tarefa-itens').value = '';
}

function guardarNovaProva() {
    const nome = document.getElementById('nova-prova-nome').value;
    const escala = document.getElementById('nova-prova-escala').value;
    const modulo = document.getElementById('nova-prova-modulo').value;
    const desc = document.getElementById('nova-prova-desc').value;
    
    const segs = [];
    document.querySelectorAll('#segmentos-selector .seg-checkbox.selected').forEach(label => {
        segs.push(parseInt(label.dataset.seg));
    });
    
    if (!nome) {
        mostrarToast('Insira o nome da prova', 'warning');
        return;
    }
    if (segs.length === 0) {
        mostrarToast('Selecione pelo menos um segmento', 'warning');
        return;
    }
    
    const prova = criarProvaCustom({
        nome,
        escala,
        modulo,
        desc,
        segs,
        tarefas: window.novaProvaTarefas.length > 0 ? window.novaProvaTarefas : [{ id: 'geral', nome: 'Avaliação Geral', itens: 10 }]
    });
    
    const provas = carregarProvasCustom();
    provas.push(prova);
    guardarProvasCustom(provas);
    
    window.novaProvaTarefas = [];
    actualizarSelectProvas();
    
    document.getElementById('modal-nova-prova').classList.remove('active');
    mostrarInfoTab('provas');
    
    mostrarToast('Prova criada!', 'success');
}

function eliminarProvaCustom(id) {
    if (!confirm('Eliminar esta prova?')) return;
    const provas = carregarProvasCustom().filter(p => p.id !== id);
    guardarProvasCustom(provas);
    actualizarSelectProvas();
    mostrarInfoTab('provas');
    mostrarToast('Prova eliminada', 'warning');
}

// ============================================================================
// TEMA / FULLSCREEN
// ============================================================================

function toggleTema() {
    const atual = document.documentElement.getAttribute('data-theme');
    const novo = atual === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', novo);
    settings.theme = novo;
    guardarSettings(settings);
}

function toggleFullscreen() {
    if (document.body.classList.contains('fullscreen')) {
        sairFullscreen();
    } else {
        entrarFullscreen();
    }
}

function entrarFullscreen() {
    document.body.classList.add('fullscreen');
    document.documentElement.requestFullscreen?.();
    setTimeout(() => radarChart.resize(), 100);
}

function sairFullscreen() {
    document.body.classList.remove('fullscreen');
    if (document.fullscreenElement) {
        document.exitFullscreen?.();
    }
    setTimeout(() => radarChart.resize(), 100);
}

// ============================================================================
// MODAIS / TOASTS
// ============================================================================

function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); }

function mostrarToast(mensagem, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<span class="toast-message">${mensagem}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ============================================================================
// ATALHOS
// ============================================================================

function tratarAtalhos(e) {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (e.key === 'Escape') e.target.blur();
        return;
    }
    
    if ((e.ctrlKey && e.key === 'Enter') || e.key.toLowerCase() === 'g') { e.preventDefault(); gerarPerfil(); }
    if (e.key.toLowerCase() === 'e' && !e.ctrlKey) { e.preventDefault(); carregarExemplo(); }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); limparFormulario(); }
    if (e.ctrlKey && e.key.toLowerCase() === 'e') { e.preventDefault(); abrirModal('modal-export'); }
    if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); guardarCasoActual(); mostrarToast('Guardado!', 'success'); }
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey) { e.preventDefault(); abrirPainelGestao(); }
    if (e.key.toLowerCase() === 'i' && !e.ctrlKey) { e.preventDefault(); mostrarInfoTab('provas'); abrirModal('modal-info'); }
    if (e.key.toLowerCase() === 't' && !e.ctrlKey) { e.preventDefault(); toggleTema(); }
    if (e.key.toLowerCase() === 'f' && !e.ctrlKey) { e.preventDefault(); toggleFullscreen(); }
    if (e.key === 'Escape') {
        // Primeiro verificar se está em fullscreen e sair
        if (document.body.classList.contains('fullscreen')) {
            e.preventDefault();
            sairFullscreen();
            return;
        }
        // Depois fechar modais activos
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    }
}

// ============================================================================
// AUTENTICAÇÃO E GESTÃO DE UTILIZADOR
// ============================================================================

function inicializarAuth() {
    // Verificar se já está autenticado
    actualizarUIAuth();
    
    // Event listeners de autenticação
    document.getElementById('btn-user').addEventListener('click', (e) => {
        e.stopPropagation();
        if (API.isAuthenticated()) {
            document.getElementById('user-menu').classList.toggle('active');
        } else {
            abrirModal('modal-auth');
        }
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
        document.getElementById('user-menu').classList.remove('active');
    });
    
    // Tabs de auth
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const modo = tab.dataset.auth;
            document.getElementById('auth-title').textContent = modo === 'login' ? 'Entrar' : 'Criar Conta';
            document.getElementById('auth-nome-group').style.display = modo === 'register' ? 'block' : 'none';
            document.getElementById('auth-submit').textContent = modo === 'login' ? 'Entrar' : 'Criar Conta';
            document.getElementById('auth-error').textContent = '';
        });
    });
    
    // Formulário de auth
    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const modo = document.querySelector('.auth-tab.active').dataset.auth;
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const nome = document.getElementById('auth-nome').value;
        const errorEl = document.getElementById('auth-error');
        const submitBtn = document.getElementById('auth-submit');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'A processar...';
        errorEl.textContent = '';
        
        try {
            if (modo === 'login') {
                await API.login(email, password);
                mostrarToast('Sessão iniciada!', 'success');
            } else {
                if (!nome) throw new Error('Nome é obrigatório');
                await API.register(nome, email, password);
                mostrarToast('Conta criada com sucesso!', 'success');
            }
            fecharModal('modal-auth');
            actualizarUIAuth();
            carregarProvasCustomCloud();
        } catch (err) {
            errorEl.textContent = err.message;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = modo === 'login' ? 'Entrar' : 'Criar Conta';
        }
    });
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await API.logout();
        mostrarToast('Sessão terminada', 'info');
    });
    
    // Tabs do Painel de Gestão
    document.querySelectorAll('.gestao-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.gestaoTab;
            mudarTabGestao(tabId);
        });
    });
    
    // Filtros e pesquisas do painel
    document.getElementById('pesquisa-criancas')?.addEventListener('input', filtrarCriancasGestao);
    document.getElementById('pesquisa-avaliacoes')?.addEventListener('input', filtrarAvaliacoesGestao);
    document.getElementById('filtro-crianca')?.addEventListener('change', filtrarAvaliacoesGestao);
    document.getElementById('evolucao-crianca')?.addEventListener('change', carregarEvolucaoCrianca);
    
    // Checkbox seleccionar todas
    document.getElementById('seleccionar-todas-avaliacoes')?.addEventListener('change', (e) => {
        document.querySelectorAll('.gestao-item-check').forEach(cb => {
            cb.checked = e.target.checked;
        });
        actualizarBotoesSeleccao();
    });
    
    // Botões de importação/exportação
    document.getElementById('btn-import-json')?.addEventListener('click', () => iniciarImportacao('json'));
    document.getElementById('btn-import-excel')?.addEventListener('click', () => iniciarImportacao('excel'));
    document.getElementById('input-import-file')?.addEventListener('change', processarImportacao);
    document.getElementById('btn-export-excel')?.addEventListener('click', () => exportarDados('excel'));
    document.getElementById('btn-export-csv')?.addEventListener('click', () => exportarDados('csv'));
    document.getElementById('btn-export-json-all')?.addEventListener('click', () => exportarDados('json'));
    
    // Editar prova aplicada
    document.getElementById('btn-salvar-edicao-prova').addEventListener('click', salvarEdicaoProva);
    document.getElementById('edit-prova-valor').addEventListener('input', calcularCompetenciaEdicao);
    document.getElementById('edit-prova-escala').addEventListener('change', calcularCompetenciaEdicao);
    
    // Editar prova custom
    document.getElementById('btn-salvar-prova-custom').addEventListener('click', salvarProvaCustomEditada);
    document.getElementById('btn-eliminar-prova-custom').addEventListener('click', eliminarProvaCustomEditada);
    
    // Gerar plano IA
    document.getElementById('btn-gerar-plano-ia').addEventListener('click', gerarPlanoComIA);
    
    // Carregar provas da cloud se autenticado
    if (API.isAuthenticated()) {
        carregarProvasCustomCloud();
    }
}

function actualizarUIAuth() {
    const isAuth = API.isAuthenticated();
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const userInfo = document.getElementById('user-info');
    
    if (isAuth && API.user) {
        userName.textContent = API.user.nome?.split(' ')[0] || '';
        userInfo.innerHTML = `<strong>${API.user.nome}</strong><small>${API.user.email}</small>`;
        userMenu.classList.add('authenticated');
    } else {
        userName.textContent = '';
        userInfo.innerHTML = '';
        userMenu.classList.remove('authenticated');
    }
}

async function carregarProvasCustomCloud() {
    if (!API.isAuthenticated()) return;
    
    try {
        const provas = await API.listarProvasCustom();
        // Merge with local provas
        provas.forEach(p => {
            if (!getProvas().find(x => x.id === p.id)) {
                PROVAS_CUSTOM.push(p);
            }
        });
        inicializarProvas();
    } catch (err) {
        console.warn('Erro ao carregar provas cloud:', err);
    }
}

// ============================================================================
// DASHBOARD
// ============================================================================
// PAINEL DE GESTÃO UNIFICADO
// ============================================================================

let dadosGestao = {
    criancas: [],
    avaliacoes: [],
    criancasFiltradas: [],
    avaliacoesFiltradas: []
};

function abrirPainelGestao() {
    if (!API.isAuthenticated()) {
        abrirModal('modal-auth');
        return;
    }
    
    carregarDadosGestao();
    abrirModal('modal-gestao');
}

async function carregarDadosGestao() {
    try {
        // Carregar crianças
        const criancasResponse = await API.listarCriancas();
        dadosGestao.criancas = criancasResponse || [];
        
        // Carregar avaliações/casos
        const casosResponse = await API.listarCasos();
        dadosGestao.avaliacoes = casosResponse || [];
        
        // Actualizar todas as tabs
        actualizarVisaoGeral();
        actualizarListaCriancas();
        actualizarListaAvaliacoes();
        preencherSelectsCriancas();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarToast('Erro ao carregar dados', 'error');
    }
}

function mudarTabGestao(tabId) {
    // Actualizar tabs
    document.querySelectorAll('.gestao-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.gestaoTab === tabId);
    });
    
    // Actualizar painéis
    document.querySelectorAll('.gestao-panel').forEach(p => {
        p.classList.toggle('active', p.id === `panel-${tabId}`);
    });
}

// --- VISÃO GERAL ---
function actualizarVisaoGeral() {
    const criancas = dadosGestao.criancas;
    const avaliacoes = dadosGestao.avaliacoes;
    
    // Estatísticas
    const agora = new Date();
    const mesActual = agora.getMonth();
    const anoActual = agora.getFullYear();
    
    const avaliacoesMes = avaliacoes.filter(a => {
        const d = new Date(a.criado_em || a.data_avaliacao);
        return d.getMonth() === mesActual && d.getFullYear() === anoActual;
    });
    
    // Média global
    let somaComp = 0, countComp = 0;
    avaliacoes.forEach(a => {
        if (a.competencias?.length) {
            a.competencias.forEach(c => {
                if (c !== null && !isNaN(c)) { somaComp += c; countComp++; }
            });
        }
    });
    const mediaGlobal = countComp > 0 ? (somaComp / countComp).toFixed(1) : '-';
    
    document.getElementById('stat-criancas').textContent = criancas.length;
    document.getElementById('stat-avaliacoes').textContent = avaliacoes.length;
    document.getElementById('stat-mes').textContent = avaliacoesMes.length;
    document.getElementById('stat-media').textContent = mediaGlobal;
    
    // Gráfico de idades
    renderizarGraficoIdades(criancas);
    
    // Gráfico de domínios
    renderizarGraficoDominios(avaliacoes);
    
    // Avaliações recentes
    renderizarAvaliacoesRecentes(avaliacoes.slice(0, 6));
}

function renderizarGraficoIdades(criancas) {
    const container = document.getElementById('chart-idades');
    if (!container) return;
    
    const faixas = { '0-3': 0, '3-6': 0, '6-10': 0, '10+': 0 };
    
    criancas.forEach(c => {
        if (c.data_nascimento) {
            const idade = calcularIdadeAnos(c.data_nascimento);
            if (idade < 3) faixas['0-3']++;
            else if (idade < 6) faixas['3-6']++;
            else if (idade < 10) faixas['6-10']++;
            else faixas['10+']++;
        }
    });
    
    const max = Math.max(...Object.values(faixas), 1);
    
    container.innerHTML = Object.entries(faixas).map(([label, value]) => `
        <div class="chart-bar" style="height: ${(value / max) * 100}%">
            <span class="chart-bar-value">${value}</span>
            <span class="chart-bar-label">${label}</span>
        </div>
    `).join('');
}

function renderizarGraficoDominios(avaliacoes) {
    const container = document.getElementById('chart-dominios');
    if (!container) return;
    
    const dominios = ['Fono', 'Morf', 'Sint', 'Sem', 'Prag'];
    const medias = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];
    
    avaliacoes.forEach(a => {
        if (a.competencias?.length >= 40) {
            for (let d = 0; d < 5; d++) {
                const segs = a.competencias.slice(d * 8, (d + 1) * 8);
                segs.forEach(v => {
                    if (v !== null && !isNaN(v)) {
                        medias[d] += v;
                        counts[d]++;
                    }
                });
            }
        }
    });
    
    const cores = ['#E05252', '#E8A54C', '#00A79D', '#5B8BC4', '#7CB454'];
    
    container.innerHTML = dominios.map((dom, i) => {
        const media = counts[i] > 0 ? (medias[i] / counts[i]) : 0;
        const altura = (media / 10) * 100;
        return `
            <div class="chart-bar" style="height: ${altura}%; background: ${cores[i]}">
                <span class="chart-bar-value">${media.toFixed(1)}</span>
                <span class="chart-bar-label">${dom}</span>
            </div>
        `;
    }).join('');
}

function renderizarAvaliacoesRecentes(avaliacoes) {
    const container = document.getElementById('avaliacoes-recentes');
    if (!container) return;
    
    if (avaliacoes.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma avaliação registada</p>';
        return;
    }
    
    container.innerHTML = avaliacoes.map(a => `
        <div class="avaliacao-card" onclick="carregarAvaliacaoGestao(${a.id})">
            <div class="gestao-item-avatar">${(a.nome || a.codigo || '?')[0].toUpperCase()}</div>
            <div class="avaliacao-card-info">
                <h5>${a.codigo || a.nome || 'Sem código'}</h5>
                <small>${a.data_avaliacao ? new Date(a.data_avaliacao).toLocaleDateString('pt-PT') : '-'}</small>
            </div>
            ${renderizarMiniRadar(a.competencias)}
        </div>
    `).join('');
}

function renderizarMiniRadar(competencias) {
    if (!competencias || competencias.length < 40) return '';
    
    const cores = ['#E05252', '#E8A54C', '#00A79D', '#5B8BC4', '#7CB454'];
    
    let html = '<div class="mini-radar">';
    for (let d = 0; d < 5; d++) {
        const segs = competencias.slice(d * 8, (d + 1) * 8);
        const vals = segs.filter(v => v !== null && !isNaN(v));
        const media = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const altura = Math.max(4, (media / 10) * 24);
        html += `<div class="mini-radar-bar" style="height: ${altura}px; background: ${cores[d]}"></div>`;
    }
    html += '</div>';
    return html;
}

// --- CRIANÇAS ---
function actualizarListaCriancas() {
    const container = document.getElementById('gestao-criancas-lista');
    if (!container) return;
    
    const criancas = dadosGestao.criancasFiltradas.length > 0 ? dadosGestao.criancasFiltradas : dadosGestao.criancas;
    
    if (criancas.length === 0) {
        container.innerHTML = '<div class="evolucao-placeholder"><p>Nenhuma criança registada</p></div>';
        return;
    }
    
    container.innerHTML = criancas.map(c => {
        const numAvaliacoes = dadosGestao.avaliacoes.filter(a => a.crianca_id === c.id).length;
        const idade = c.data_nascimento ? calcularIdadeAnos(c.data_nascimento) : null;
        
        return `
            <div class="gestao-item" onclick="seleccionarCriancaGestao(${c.id})">
                <div class="gestao-item-avatar">${(c.nome || '?')[0].toUpperCase()}</div>
                <div class="gestao-item-info">
                    <h5>${c.codigo} - ${c.nome || 'Sem nome'}</h5>
                    <p>${c.diagnostico || 'Sem diagnóstico'}</p>
                </div>
                <div class="gestao-item-meta">
                    <span>${idade !== null ? idade + ' anos' : '-'}</span>
                    <span>${numAvaliacoes} avaliações</span>
                </div>
                <div class="gestao-item-actions">
                    <button class="btn-mini" onclick="event.stopPropagation(); editarCrianca(${c.id})" title="Editar">✏️</button>
                    <button class="btn-mini" onclick="event.stopPropagation(); novaAvaliacaoCrianca(${c.id})" title="Nova Avaliação">+</button>
                </div>
            </div>
        `;
    }).join('');
}

function filtrarCriancasGestao() {
    const termo = document.getElementById('pesquisa-criancas')?.value.toLowerCase() || '';
    const filtroIdade = document.getElementById('filtro-criancas-idade')?.value || '';
    
    dadosGestao.criancasFiltradas = dadosGestao.criancas.filter(c => {
        const matchTermo = !termo || 
            (c.nome || '').toLowerCase().includes(termo) ||
            (c.codigo || '').toLowerCase().includes(termo);
        
        let matchIdade = true;
        if (filtroIdade && c.data_nascimento) {
            const idade = calcularIdadeAnos(c.data_nascimento);
            switch (filtroIdade) {
                case '0-3': matchIdade = idade < 3; break;
                case '3-6': matchIdade = idade >= 3 && idade < 6; break;
                case '6-10': matchIdade = idade >= 6 && idade < 10; break;
                case '10+': matchIdade = idade >= 10; break;
            }
        }
        
        return matchTermo && matchIdade;
    });
    
    actualizarListaCriancas();
}

function seleccionarCriancaGestao(id) {
    const crianca = dadosGestao.criancas.find(c => c.id === id);
    if (crianca) {
        criancaActual = crianca;
        actualizarDisplayCrianca();
        fecharModal('modal-gestao');
        mostrarToast(`Criança "${crianca.nome}" seleccionada`, 'success');
    }
}

function novaAvaliacaoCrianca(id) {
    const crianca = dadosGestao.criancas.find(c => c.id === id);
    if (crianca) {
        criancaActual = crianca;
        actualizarDisplayCrianca();
        novoCaso();
        fecharModal('modal-gestao');
        mostrarToast(`Nova avaliação para "${crianca.nome}"`, 'info');
    }
}

// --- AVALIAÇÕES ---
function actualizarListaAvaliacoes() {
    const container = document.getElementById('gestao-avaliacoes-lista');
    if (!container) return;
    
    const avaliacoes = dadosGestao.avaliacoesFiltradas.length > 0 ? dadosGestao.avaliacoesFiltradas : dadosGestao.avaliacoes;
    
    if (avaliacoes.length === 0) {
        container.innerHTML = '<div class="evolucao-placeholder"><p>Nenhuma avaliação registada</p></div>';
        return;
    }
    
    container.innerHTML = avaliacoes.map(a => {
        const media = calcularMediaAvaliacao(a.competencias);
        const badge = media === null ? '' : 
            media < 5 ? '<span class="gestao-item-badge badge-red">Dificuldade</span>' :
            media < 7 ? '<span class="gestao-item-badge badge-yellow">Atenção</span>' :
            '<span class="gestao-item-badge badge-green">Adequado</span>';
        
        return `
            <div class="gestao-item">
                <input type="checkbox" class="gestao-item-check" data-id="${a.id}" onchange="actualizarBotoesSeleccao()">
                <div class="gestao-item-avatar">${(a.nome || a.codigo || '?')[0].toUpperCase()}</div>
                <div class="gestao-item-info">
                    <h5>${a.codigo || 'Sem código'} ${a.nome ? '- ' + a.nome : ''}</h5>
                    <p>Avaliação: ${a.data_avaliacao ? new Date(a.data_avaliacao).toLocaleDateString('pt-PT') : '-'}</p>
                </div>
                ${renderizarMiniRadar(a.competencias)}
                ${badge}
                <div class="gestao-item-actions">
                    <button class="btn-mini" onclick="carregarAvaliacaoGestao(${a.id})" title="Carregar">↗</button>
                    <button class="btn-mini" onclick="exportarAvaliacaoWord(${a.id})" title="Word">W</button>
                    <button class="btn-mini" onclick="eliminarAvaliacaoGestao(${a.id})" title="Eliminar">×</button>
                </div>
            </div>
        `;
    }).join('');
}

function filtrarAvaliacoesGestao() {
    const termo = document.getElementById('pesquisa-avaliacoes')?.value.toLowerCase() || '';
    const criancaId = document.getElementById('filtro-crianca')?.value || '';
    const dataDe = document.getElementById('filtro-data-de')?.value || '';
    const dataAte = document.getElementById('filtro-data-ate')?.value || '';
    
    dadosGestao.avaliacoesFiltradas = dadosGestao.avaliacoes.filter(a => {
        const matchTermo = !termo || 
            (a.nome || '').toLowerCase().includes(termo) ||
            (a.codigo || '').toLowerCase().includes(termo);
        
        const matchCrianca = !criancaId || a.crianca_id == criancaId;
        
        let matchData = true;
        if (a.data_avaliacao) {
            const dataAval = new Date(a.data_avaliacao);
            if (dataDe) matchData = matchData && dataAval >= new Date(dataDe);
            if (dataAte) matchData = matchData && dataAval <= new Date(dataAte);
        }
        
        return matchTermo && matchCrianca && matchData;
    });
    
    actualizarListaAvaliacoes();
}

function calcularMediaAvaliacao(competencias) {
    if (!competencias || competencias.length === 0) return null;
    const vals = competencias.filter(v => v !== null && !isNaN(v));
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function actualizarBotoesSeleccao() {
    const seleccionados = document.querySelectorAll('.gestao-item-check:checked').length;
    document.getElementById('btn-comparar-seleccionados').disabled = seleccionados < 2;
    document.getElementById('btn-exportar-seleccionados').disabled = seleccionados === 0;
}

async function carregarAvaliacaoGestao(id) {
    try {
        const caso = await API.obterCaso(id);
        if (caso) {
            casoActual = {
                id: caso.codigo,
                codigo: caso.codigo,
                nome: caso.nome,
                idade: caso.idade,
                data: caso.data_avaliacao,
                escolaridade: caso.ano_escolar,
                avaliador: caso.avaliador,
                competencias: caso.competencias || new Array(40).fill(null),
                provasAplicadas: []
            };
            
            preencherFormulario(casoActual);
            (casoActual.competencias || []).forEach((comp, i) => {
                radarChart.setValor(i, comp);
            });
            radarChart.desenhar();
            fecharModal('modal-gestao');
            mostrarToast('Avaliação carregada!', 'success');
        }
    } catch (error) {
        mostrarToast('Erro ao carregar avaliação', 'error');
    }
}

async function eliminarAvaliacaoGestao(id) {
    if (!confirm('Eliminar esta avaliação?')) return;
    
    try {
        await API.eliminarCaso(id);
        dadosGestao.avaliacoes = dadosGestao.avaliacoes.filter(a => a.id !== id);
        actualizarListaAvaliacoes();
        actualizarVisaoGeral();
        mostrarToast('Avaliação eliminada', 'warning');
    } catch (error) {
        mostrarToast('Erro ao eliminar', 'error');
    }
}

// --- EVOLUÇÃO ---
function preencherSelectsCriancas() {
    const selects = ['filtro-crianca', 'evolucao-crianca', 'export-criancas'];
    
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        
        const primeiraOpcao = select.querySelector('option');
        select.innerHTML = '';
        if (primeiraOpcao) select.appendChild(primeiraOpcao);
        
        dadosGestao.criancas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.codigo} - ${c.nome || 'Sem nome'}`;
            select.appendChild(opt);
        });
    });
}

function carregarEvolucaoCrianca() {
    const criancaId = document.getElementById('evolucao-crianca')?.value;
    const container = document.getElementById('evolucao-content');
    if (!container) return;
    
    if (!criancaId) {
        container.innerHTML = `
            <div class="evolucao-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <p>Seleccione uma criança para ver a evolução</p>
            </div>
        `;
        return;
    }
    
    const avaliacoes = dadosGestao.avaliacoes
        .filter(a => a.crianca_id == criancaId)
        .sort((a, b) => new Date(a.data_avaliacao) - new Date(b.data_avaliacao));
    
    if (avaliacoes.length === 0) {
        container.innerHTML = '<div class="evolucao-placeholder"><p>Nenhuma avaliação para esta criança</p></div>';
        return;
    }
    
    if (avaliacoes.length === 1) {
        container.innerHTML = '<div class="evolucao-placeholder"><p>Apenas 1 avaliação. São necessárias pelo menos 2 para comparar evolução.</p></div>';
        return;
    }
    
    // Renderizar tabela de evolução
    const dominios = ['Fonológico', 'Morfológico', 'Sintático', 'Semântico', 'Pragmático'];
    
    let html = '<table class="evolucao-tabela"><thead><tr><th>Domínio</th>';
    avaliacoes.forEach(a => {
        html += `<th>${new Date(a.data_avaliacao).toLocaleDateString('pt-PT')}</th>`;
    });
    html += '<th>Evolução</th></tr></thead><tbody>';
    
    for (let d = 0; d < 5; d++) {
        html += `<tr><td><strong>${dominios[d]}</strong></td>`;
        
        let valores = [];
        avaliacoes.forEach(a => {
            if (a.competencias && a.competencias.length >= 40) {
                const segs = a.competencias.slice(d * 8, (d + 1) * 8);
                const vals = segs.filter(v => v !== null && !isNaN(v));
                const media = vals.length > 0 ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
                valores.push(media);
                html += `<td>${media !== null ? media.toFixed(1) : '-'}</td>`;
            } else {
                valores.push(null);
                html += '<td>-</td>';
            }
        });
        
        // Calcular evolução
        const primeiro = valores.find(v => v !== null);
        const ultimo = valores.reverse().find(v => v !== null);
        if (primeiro !== null && ultimo !== null && valores.length >= 2) {
            const diff = ultimo - primeiro;
            const classe = diff > 0.5 ? 'progresso-up' : diff < -0.5 ? 'progresso-down' : 'progresso-same';
            const sinal = diff > 0 ? '+' : '';
            html += `<td class="${classe}">${sinal}${diff.toFixed(1)}</td>`;
        } else {
            html += '<td>-</td>';
        }
        
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// --- IMPORTAÇÃO ---
function iniciarImportacao(tipo) {
    const input = document.getElementById('input-import-file');
    if (input) {
        input.dataset.tipo = tipo;
        input.accept = tipo === 'excel' ? '.xlsx,.xls' : '.json';
        input.click();
    }
}

async function processarImportacao(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const tipo = e.target.dataset.tipo;
    
    try {
        if (tipo === 'json') {
            await importarJSON(file);
        } else {
            await importarExcel(file);
        }
        e.target.value = '';
    } catch (error) {
        console.error('Erro na importação:', error);
        mostrarToast('Erro ao importar: ' + error.message, 'error');
        e.target.value = '';
    }
}

async function importarJSON(file) {
    const text = await file.text();
    const dados = JSON.parse(text);
    
    // Verificar formato
    if (Array.isArray(dados)) {
        // Lista de avaliações
        let importados = 0;
        for (const caso of dados) {
            try {
                await API.guardarCaso(caso);
                importados++;
            } catch (err) {
                console.error('Erro ao importar caso:', err);
            }
        }
        mostrarToast(`${importados} avaliações importadas`, 'success');
    } else if (dados.competencias) {
        // Avaliação única
        await API.guardarCaso(dados);
        mostrarToast('Avaliação importada', 'success');
    }
    
    await carregarDadosGestao();
}

async function importarExcel(file) {
    // Carregar biblioteca se necessário
    try {
        mostrarToast('A carregar biblioteca Excel...', 'info');
        await carregarBibliotecaXLSX();
    } catch (error) {
        mostrarToast('Erro ao carregar biblioteca Excel', 'error');
        return;
    }
    
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    let importados = 0;
    for (const row of rows) {
        try {
            // Mapear colunas do Excel para estrutura de caso
            const caso = {
                codigo: row['Código'] || row['codigo'] || row['ID'],
                nome: row['Nome'] || row['nome'],
                idade: row['Idade'] || row['idade'],
                data_avaliacao: row['Data'] || row['data'] || row['Data Avaliação'],
                competencias: []
            };
            
            // Tentar extrair competências (colunas Seg0 a Seg39 ou C0 a C39)
            for (let i = 0; i < 40; i++) {
                const val = row[`Seg${i}`] || row[`C${i}`] || row[`Competência ${i}`] || null;
                caso.competencias.push(val !== null && val !== '' ? parseFloat(val) : null);
            }
            
            await API.guardarCaso(caso);
            importados++;
        } catch (err) {
            console.error('Erro ao importar linha:', err);
        }
    }
    
    mostrarToast(`${importados} avaliações importadas do Excel`, 'success');
    await carregarDadosGestao();
}

// --- EXPORTAÇÃO ---
async function exportarDados(formato) {
    const dataDe = document.getElementById('export-data-de')?.value;
    const dataAte = document.getElementById('export-data-ate')?.value;
    
    let dados = dadosGestao.avaliacoes;
    
    // Filtrar por data
    if (dataDe || dataAte) {
        dados = dados.filter(a => {
            if (!a.data_avaliacao) return true;
            const d = new Date(a.data_avaliacao);
            if (dataDe && d < new Date(dataDe)) return false;
            if (dataAte && d > new Date(dataAte)) return false;
            return true;
        });
    }
    
    if (dados.length === 0) {
        mostrarToast('Nenhuma avaliação para exportar', 'warning');
        return;
    }
    
    switch (formato) {
        case 'excel':
            exportarParaExcel(dados);
            break;
        case 'csv':
            exportarParaCSV(dados);
            break;
        case 'json':
            exportarParaJSON(dados);
            break;
    }
}

function exportarParaExcel(dados) {
    // Carregar biblioteca e exportar
    carregarBibliotecaXLSX().then(() => {
        // Preparar dados para Excel
        const rows = dados.map(a => {
            const row = {
                'Código': a.codigo || '',
                'Nome': a.nome || '',
                'Idade': a.idade || '',
                'Data Avaliação': a.data_avaliacao || '',
                'Avaliador': a.avaliador || ''
            };
            
            // Adicionar competências
            const dominios = ['Fono', 'Morf', 'Sint', 'Sem', 'Prag'];
            const niveis = ['Imp', 'Exp'];
            const circuitos = ['Comp', 'Expr'];
            const modalidades = ['Oral', 'Esc'];
            
            for (let i = 0; i < 40; i++) {
                const d = Math.floor(i / 8);
                const resto = i % 8;
                const n = Math.floor(resto / 4);
                const c = Math.floor((resto % 4) / 2);
                const m = resto % 2;
                
                const colName = `${dominios[d]}_${niveis[n]}_${circuitos[c]}_${modalidades[m]}`;
                row[colName] = a.competencias?.[i] ?? '';
            }
            
            return row;
        });
        
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');
        
        XLSX.writeFile(wb, `PERLIM_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
        mostrarToast('Excel exportado!', 'success');
    }).catch(() => {
        mostrarToast('Erro ao carregar biblioteca Excel', 'error');
    });
}

function exportarParaCSV(dados) {
    // Cabeçalho
    let csv = 'Código,Nome,Idade,Data,';
    for (let i = 0; i < 40; i++) csv += `Seg${i},`;
    csv = csv.slice(0, -1) + '\n';
    
    // Dados
    dados.forEach(a => {
        csv += `"${a.codigo || ''}","${a.nome || ''}","${a.idade || ''}","${a.data_avaliacao || ''}",`;
        for (let i = 0; i < 40; i++) {
            csv += `${a.competencias?.[i] ?? ''},`;
        }
        csv = csv.slice(0, -1) + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PERLIM_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('CSV exportado!', 'success');
}

function exportarParaJSON(dados) {
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PERLIM_Export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('JSON exportado!', 'success');
}

// Função auxiliar
function calcularIdadeAnos(dataNascimento) {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
}

// Expor funções
window.abrirPainelGestao = abrirPainelGestao;
window.seleccionarCriancaGestao = seleccionarCriancaGestao;
window.novaAvaliacaoCrianca = novaAvaliacaoCrianca;
window.carregarAvaliacaoGestao = carregarAvaliacaoGestao;
window.eliminarAvaliacaoGestao = eliminarAvaliacaoGestao;
window.exportarAvaliacaoWord = async (id) => {
    const avaliacao = dadosGestao.avaliacoes.find(a => a.id === id);
    if (avaliacao) {
        casoActual = avaliacao;
        await gerarRelatorioWord();
    }
};

// Manter compatibilidade
async function carregarCasoCloud(id) {
    await carregarAvaliacaoGestao(id);
}

function preencherFormulario(caso) {
    document.getElementById('caso-id').value = caso.id || '';
    document.getElementById('caso-nome').value = caso.nome || '';
    document.getElementById('caso-idade').value = caso.idade || '';
    document.getElementById('caso-data').value = caso.data || '';
    if (caso.escolaridade) {
        document.getElementById('caso-esc').value = caso.escolaridade;
        verificarEscrita();
    }
    document.getElementById('caso-notas').value = caso.notas || '';
    
    // Actualizar lista de provas aplicadas
    const lista = document.getElementById('prova-list');
    lista.innerHTML = '';
    caso.provasAplicadas?.forEach((p, idx) => {
        adicionarProvaListaUI(p, idx);
    });
}

function adicionarProvaListaUI(prova, idx) {
    const lista = document.getElementById('prova-list');
    const item = document.createElement('div');
    item.className = 'prova-item';
    item.dataset.idx = idx;
    item.innerHTML = `
        <span><b>${prova.nome}</b>: ${prova.valor} (${prova.escala}) → <b>${prova.competencia}/10</b></span>
        <div class="prova-item-actions">
            <button class="prova-item-edit" title="Editar" onclick="abrirEdicaoProva(${idx})">✏️</button>
            <button class="prova-item-remove" title="Remover" onclick="removerProvaAplicada(${idx})">×</button>
        </div>
    `;
    lista.appendChild(item);
}

// ============================================================================
// EDIÇÃO DE PROVAS APLICADAS
// ============================================================================

function abrirEdicaoProva(idx) {
    const prova = casoActual.provasAplicadas[idx];
    if (!prova) return;
    
    document.getElementById('edit-prova-nome').value = prova.nome;
    document.getElementById('edit-prova-valor').value = prova.valor;
    document.getElementById('edit-prova-escala').value = prova.escala;
    document.getElementById('edit-prova-comp').value = prova.competencia + '/10';
    document.getElementById('edit-prova-idx').value = idx;
    
    abrirModal('modal-editar-prova');
}

function calcularCompetenciaEdicao() {
    const valor = parseFloat(document.getElementById('edit-prova-valor').value);
    const escala = document.getElementById('edit-prova-escala').value;
    if (isNaN(valor)) return;
    
    const comp = converterParaCompetencia(valor, escala);
    document.getElementById('edit-prova-comp').value = comp + '/10';
}

function salvarEdicaoProva() {
    const idx = parseInt(document.getElementById('edit-prova-idx').value);
    const valor = parseFloat(document.getElementById('edit-prova-valor').value);
    const escala = document.getElementById('edit-prova-escala').value;
    
    if (isNaN(valor) || idx < 0 || idx >= casoActual.provasAplicadas.length) {
        mostrarToast('Dados inválidos', 'error');
        return;
    }
    
    const comp = converterParaCompetencia(valor, escala);
    const prova = casoActual.provasAplicadas[idx];
    
    // Actualizar valores
    prova.valor = valor;
    prova.escala = escala;
    prova.competencia = comp;
    
    // Recalcular competências dos segmentos
    prova.segmentos.forEach(segIdx => {
        const valores = casoActual.provasAplicadas
            .filter(p => p.segmentos.includes(segIdx))
            .map(p => p.competencia);
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        casoActual.competencias[segIdx] = Math.round(media * 10) / 10;
        radarChart.setValor(segIdx, casoActual.competencias[segIdx]);
    });
    
    radarChart.desenhar();
    
    // Actualizar UI
    const lista = document.getElementById('prova-list');
    const items = lista.querySelectorAll('.prova-item');
    if (items[idx]) {
        items[idx].querySelector('span').innerHTML = 
            `<b>${prova.nome}</b>: ${valor} (${escala}) → <b>${comp}/10</b>`;
    }
    
    fecharModal('modal-editar-prova');
    mostrarToast('Prova actualizada!', 'success');
}

function removerProvaAplicada(idx) {
    if (idx < 0 || idx >= casoActual.provasAplicadas.length) return;
    
    const prova = casoActual.provasAplicadas[idx];
    casoActual.provasAplicadas.splice(idx, 1);
    
    // Recalcular competências
    prova.segmentos.forEach(segIdx => {
        const valores = casoActual.provasAplicadas
            .filter(p => p.segmentos.includes(segIdx))
            .map(p => p.competencia);
        if (valores.length > 0) {
            const media = valores.reduce((a, b) => a + b, 0) / valores.length;
            casoActual.competencias[segIdx] = Math.round(media * 10) / 10;
        } else {
            casoActual.competencias[segIdx] = 0;
        }
        radarChart.setValor(segIdx, casoActual.competencias[segIdx]);
    });
    
    radarChart.desenhar();
    
    // Actualizar lista UI
    const lista = document.getElementById('prova-list');
    const items = lista.querySelectorAll('.prova-item');
    if (items[idx]) items[idx].remove();
    
    mostrarToast('Prova removida', 'info');
}

// ============================================================================
// EDIÇÃO DE PROVAS CUSTOM
// ============================================================================

function abrirEdicaoProvaCustom(provaId) {
    const prova = getProvas().find(p => p.id === provaId);
    if (!prova || !prova.custom) return;
    
    document.getElementById('edit-custom-id').value = prova.id;
    document.getElementById('edit-custom-nome').value = prova.nome;
    document.getElementById('edit-custom-escala').value = prova.escala;
    document.getElementById('edit-custom-dominio').value = prova.dominio;
    
    // Renderizar grid de segmentos
    const grid = document.getElementById('edit-custom-segmentos');
    grid.innerHTML = '';
    for (let i = 0; i < 40; i++) {
        const selected = prova.segmentos.includes(i);
        const seg = SEGMENTOS[i];
        const div = document.createElement('div');
        div.className = `seg-checkbox ${selected ? 'selected' : ''}`;
        div.dataset.idx = i;
        div.textContent = i + 1;
        div.title = `${seg.modulo} - ${seg.nivel} - ${seg.circuito} - ${seg.modalidade}`;
        div.onclick = () => div.classList.toggle('selected');
        grid.appendChild(div);
    }
    
    abrirModal('modal-editar-prova-custom');
}

async function salvarProvaCustomEditada() {
    const id = document.getElementById('edit-custom-id').value;
    const nome = document.getElementById('edit-custom-nome').value;
    const escala = document.getElementById('edit-custom-escala').value;
    const dominio = document.getElementById('edit-custom-dominio').value;
    
    const segmentos = [];
    document.querySelectorAll('#edit-custom-segmentos .seg-checkbox.selected').forEach(el => {
        segmentos.push(parseInt(el.dataset.idx));
    });
    
    if (!nome || segmentos.length === 0) {
        mostrarToast('Preencha todos os campos', 'error');
        return;
    }
    
    const provaData = { id, nome, escala, dominio, segmentos, tarefas: [] };
    
    // Actualizar localmente
    const idx = PROVAS_CUSTOM.findIndex(p => p.id === id);
    if (idx !== -1) {
        PROVAS_CUSTOM[idx] = { ...PROVAS_CUSTOM[idx], ...provaData };
    }
    guardarProvasCustomLocal();
    
    // Actualizar na cloud se autenticado
    if (API.isAuthenticated()) {
        try {
            await API.actualizarProvaCustom(id, provaData);
        } catch (err) {
            console.warn('Erro ao actualizar na cloud:', err);
        }
    }
    
    inicializarProvas();
    fecharModal('modal-editar-prova-custom');
    mostrarToast('Prova actualizada!', 'success');
}

async function eliminarProvaCustomEditada() {
    const id = document.getElementById('edit-custom-id').value;
    
    if (!confirm('Tem a certeza que deseja eliminar esta prova?')) return;
    
    // Remover localmente
    const idx = PROVAS_CUSTOM.findIndex(p => p.id === id);
    if (idx !== -1) {
        PROVAS_CUSTOM.splice(idx, 1);
    }
    guardarProvasCustomLocal();
    
    // Remover da cloud
    if (API.isAuthenticated()) {
        try {
            await API.eliminarProvaCustom(id);
        } catch (err) {
            console.warn('Erro ao eliminar da cloud:', err);
        }
    }
    
    inicializarProvas();
    fecharModal('modal-editar-prova-custom');
    mostrarToast('Prova eliminada', 'info');
}

// ============================================================================
// INTEGRAÇÃO COM IA - PLANO TERAPÊUTICO
// ============================================================================

async function gerarPlanoComIA() {
    if (!API.isAuthenticated()) {
        mostrarToast('Faça login para usar a IA', 'warning');
        abrirModal('modal-auth');
        return;
    }
    
    if (!casoActual.competencias?.some(c => c > 0)) {
        mostrarToast('Gere primeiro o perfil', 'warning');
        return;
    }
    
    const loadingEl = document.getElementById('ia-loading');
    const resultEl = document.getElementById('ia-result');
    const btnGerar = document.getElementById('btn-gerar-plano-ia');
    const contexto = document.getElementById('ia-contexto').value;
    
    loadingEl.style.display = 'block';
    resultEl.style.display = 'none';
    btnGerar.disabled = true;
    
    try {
        const perfil = {
            nome: casoActual.nome,
            idade: casoActual.idade,
            escolaridade: casoActual.escolaridade,
            competencias: casoActual.competencias,
            analise: casoActual.analise
        };
        
        const response = await API.gerarPlanoIA(perfil, contexto);
        
        if (response.success && response.plano) {
            const plano = response.plano;
            planoActual = plano;
            
            resultEl.innerHTML = `
                <h4>📋 Resumo</h4>
                <p>${plano.resumo || ''}</p>
                
                <h4>🎯 Objectivo Geral</h4>
                <p>${plano.objectivo_geral || ''}</p>
                
                <h4>✅ Objectivos Específicos</h4>
                <ul>${(plano.objectivos_especificos || []).map(o => `<li>${o}</li>`).join('')}</ul>
                
                <h4>⚡ Áreas Prioritárias</h4>
                <ul>${(plano.areas_prioritarias || []).map(a => `<li>${a}</li>`).join('')}</ul>
                
                <h4>💡 Estratégias</h4>
                <ul>${(plano.estrategias || []).map(e => `<li>${e}</li>`).join('')}</ul>
                
                <h4>🎮 Actividades Sugeridas</h4>
                <ul>${(plano.actividades_sugeridas || []).map(a => `<li>${a}</li>`).join('')}</ul>
                
                <h4>📦 Materiais Recomendados</h4>
                <ul>${(plano.materiais_recomendados || []).map(m => `<li>${m}</li>`).join('')}</ul>
                
                <h4>📅 Frequência e Duração</h4>
                <p><strong>Frequência:</strong> ${plano.frequencia_sugerida || '-'}</p>
                <p><strong>Duração estimada:</strong> ${plano.duracao_estimada || '-'}</p>
                
                <h4>📈 Indicadores de Progresso</h4>
                <ul>${(plano.indicadores_progresso || []).map(i => `<li>${i}</li>`).join('')}</ul>
                
                <h4>👨‍👩‍👧 Recomendações para a Família</h4>
                <ul>${(plano.recomendacoes_familia || []).map(r => `<li>${r}</li>`).join('')}</ul>
                
                <p class="text-muted" style="margin-top:1rem;font-size:0.75rem">
                    <em>Gerado por IA (${response.modelo}). Deve ser validado por um profissional.</em>
                </p>
            `;
            resultEl.style.display = 'block';
            
            // Guardar plano no caso
            casoActual.planoTerapeutico = plano;
            mostrarToast('Plano gerado com sucesso!', 'success');
        }
    } catch (err) {
        mostrarToast('Erro ao gerar plano: ' + err.message, 'error');
    } finally {
        loadingEl.style.display = 'none';
        btnGerar.disabled = false;
    }
}

// Expor funções globalmente
window.abrirEdicaoProva = abrirEdicaoProva;
window.removerProvaAplicada = removerProvaAplicada;
window.abrirEdicaoProvaCustom = abrirEdicaoProvaCustom;
window.carregarCasoCloud = carregarCasoCloud;
window.carregarCasoGuardado = carregarCasoGuardado;
window.eliminarCasoGuardado = eliminarCasoGuardado;

// ============================================================================
// GESTÃO DE CRIANÇAS
// ============================================================================

let criancaActual = null;

// Toggle de secções colapsáveis
function toggleSection(header) {
    const fieldset = header.closest('fieldset');
    fieldset.classList.toggle('collapsed');
}
window.toggleSection = toggleSection;

// Toggle de subfields em checkboxes
function toggleSubfield(checkbox, subfieldId) {
    const subfield = document.getElementById(subfieldId);
    if (subfield) {
        subfield.disabled = !checkbox.checked;
        if (!checkbox.checked) subfield.value = '';
    }
}
window.toggleSubfield = toggleSubfield;

// Calcular idade em anos;meses
function calcularIdade(dataNascimento, dataReferencia = null) {
    const dn = new Date(dataNascimento);
    const ref = dataReferencia ? new Date(dataReferencia) : new Date();
    
    let anos = ref.getFullYear() - dn.getFullYear();
    let meses = ref.getMonth() - dn.getMonth();
    
    if (meses < 0) {
        anos--;
        meses += 12;
    }
    
    if (ref.getDate() < dn.getDate()) {
        meses--;
        if (meses < 0) {
            anos--;
            meses += 12;
        }
    }
    
    return `${anos};${meses}`;
}
window.calcularIdade = calcularIdade;

// Abrir modal de seleccionar/criar criança
async function abrirSeleccionarCrianca() {
    abrirModal('modal-seleccionar-crianca');
    await actualizarListaCriancas();
}
window.abrirSeleccionarCrianca = abrirSeleccionarCrianca;

// Actualizar lista de crianças
async function actualizarListaCriancas() {
    const container = document.getElementById('lista-criancas');
    container.innerHTML = '<p class="text-muted">A carregar...</p>';
    
    try {
        const criancas = await API.listarCriancas();
        
        if (criancas.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma criança registada. Clique em "Nova Criança" para adicionar.</p>';
            return;
        }
        
        container.innerHTML = criancas.map(c => {
            const idade = c.data_nascimento ? calcularIdade(c.data_nascimento) : '-';
            return `
                <div class="crianca-item" onclick="seleccionarCrianca(${c.id})">
                    <div class="crianca-item-info">
                        <h4><span class="codigo">${c.codigo}</span> — ${c.nome || 'Sem nome'}</h4>
                        <p>Idade: ${idade} | ${c.diagnostico || 'Sem diagnóstico'}</p>
                    </div>
                    <div class="crianca-item-actions">
                        <button class="btn-mini" onclick="event.stopPropagation(); editarCrianca(${c.id})" title="Editar">✏️</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar crianças:', error);
        container.innerHTML = '<p class="text-muted">Erro ao carregar crianças.</p>';
    }
}

// Pesquisar crianças
function filtrarCriancas(e) {
    const termo = e.target.value.toLowerCase();
    document.querySelectorAll('.crianca-item').forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(termo) ? 'flex' : 'none';
    });
}

// Abrir modal de nova criança
function abrirNovaCrianca() {
    fecharModal('modal-seleccionar-crianca');
    limparFormularioCrianca();
    document.getElementById('crianca-codigo').textContent = 'Será gerado automaticamente';
    document.getElementById('crianca-id').value = '';
    abrirModal('modal-crianca');
}
window.abrirNovaCrianca = abrirNovaCrianca;

// Editar criança existente
async function editarCrianca(id) {
    try {
        const crianca = await API.obterCrianca(id);
        if (!crianca) {
            mostrarToast('Criança não encontrada', 'error');
            return;
        }
        
        fecharModal('modal-seleccionar-crianca');
        preencherFormularioCrianca(crianca);
        abrirModal('modal-crianca');
    } catch (error) {
        mostrarToast('Erro ao carregar criança', 'error');
    }
}
window.editarCrianca = editarCrianca;

// Preencher formulário com dados da criança
function preencherFormularioCrianca(c) {
    document.getElementById('crianca-id').value = c.id;
    document.getElementById('crianca-codigo').textContent = c.codigo || '-';
    document.getElementById('crianca-nome').value = c.nome || '';
    document.getElementById('crianca-dn').value = c.data_nascimento || '';
    document.getElementById('crianca-sexo').value = c.sexo || '';
    document.getElementById('crianca-lateralidade').value = c.lateralidade || '';
    document.getElementById('crianca-escola').value = c.escola || '';
    document.getElementById('crianca-ano').value = c.ano_escolar || '';
    document.getElementById('crianca-linguas').value = c.linguas_casa || '';
    document.getElementById('crianca-palavras').value = c.idade_primeiras_palavras || '';
    document.getElementById('crianca-frases').value = c.idade_primeiras_frases || '';
    document.getElementById('crianca-passos').value = c.idade_primeiros_passos || '';
    document.getElementById('crianca-preocupacoes').value = c.preocupacoes_desenvolvimento || '';
    document.getElementById('crianca-diagnostico').value = c.diagnostico || '';
    document.getElementById('crianca-notas').value = c.notas || '';
    
    // Antecedentes clínicos
    const ac = c.antecedentes_clinicos || {};
    document.getElementById('ac-prematuridade').checked = ac.prematuridade || false;
    document.getElementById('ac-prematuridade-sem').value = ac.prematuridadeSemanas || '';
    document.getElementById('ac-prematuridade-sem').disabled = !ac.prematuridade;
    document.getElementById('ac-audicao').checked = ac.audicao || false;
    document.getElementById('ac-visao').checked = ac.visao || false;
    document.getElementById('ac-neurologico').checked = ac.neurologico || false;
    document.getElementById('ac-genetico').checked = ac.genetico || false;
    document.getElementById('ac-phda').checked = ac.phda || false;
    document.getElementById('ac-pea').checked = ac.pea || false;
    document.getElementById('ac-outro').checked = ac.outro || false;
    document.getElementById('ac-outro-desc').value = ac.outroDesc || '';
    document.getElementById('ac-outro-desc').disabled = !ac.outro;
    
    // Acompanhamentos
    const acomp = c.acompanhamentos || {};
    ['tf', 'psic', 'to', 'fisio', 'pedopsiq', 'neuroped', 'apoio', 'outro'].forEach(tipo => {
        const checkbox = document.getElementById(`acomp-${tipo}`);
        const desde = document.getElementById(`acomp-${tipo}-desde`) || document.getElementById(`acomp-${tipo}-desc`);
        if (checkbox) {
            checkbox.checked = acomp[tipo] || false;
            if (desde) {
                desde.value = acomp[`${tipo}Desde`] || acomp[`${tipo}Desc`] || '';
                desde.disabled = !acomp[tipo];
            }
        }
    });
    
    // Antecedentes familiares
    const af = c.antecedentes_familiares || {};
    document.getElementById('af-linguagem').checked = af.linguagem || false;
    document.getElementById('af-leitura').checked = af.leitura || false;
    document.getElementById('af-escrita').checked = af.escrita || false;
    document.getElementById('af-aprendizagem').checked = af.aprendizagem || false;
    document.getElementById('af-quem').value = af.quem || '';
}

// Limpar formulário
function limparFormularioCrianca() {
    document.getElementById('form-crianca').reset();
    document.querySelectorAll('#form-crianca .subfield').forEach(f => f.disabled = true);
}

// Recolher dados do formulário
function recolherDadosCrianca() {
    return {
        nome: document.getElementById('crianca-nome').value.trim(),
        dataNascimento: document.getElementById('crianca-dn').value,
        sexo: document.getElementById('crianca-sexo').value,
        lateralidade: document.getElementById('crianca-lateralidade').value,
        escola: document.getElementById('crianca-escola').value.trim(),
        anoEscolar: document.getElementById('crianca-ano').value,
        linguas: document.getElementById('crianca-linguas').value.trim(),
        primeirasPalavras: document.getElementById('crianca-palavras').value.trim(),
        primeirasFrases: document.getElementById('crianca-frases').value.trim(),
        primeirosPassos: document.getElementById('crianca-passos').value.trim(),
        preocupacoes: document.getElementById('crianca-preocupacoes').value.trim(),
        diagnostico: document.getElementById('crianca-diagnostico').value.trim(),
        notas: document.getElementById('crianca-notas').value.trim(),
        antecedentesClinicos: {
            prematuridade: document.getElementById('ac-prematuridade').checked,
            prematuridadeSemanas: document.getElementById('ac-prematuridade-sem').value,
            audicao: document.getElementById('ac-audicao').checked,
            visao: document.getElementById('ac-visao').checked,
            neurologico: document.getElementById('ac-neurologico').checked,
            genetico: document.getElementById('ac-genetico').checked,
            phda: document.getElementById('ac-phda').checked,
            pea: document.getElementById('ac-pea').checked,
            outro: document.getElementById('ac-outro').checked,
            outroDesc: document.getElementById('ac-outro-desc').value
        },
        acompanhamentos: {
            tf: document.getElementById('acomp-tf').checked,
            tfDesde: document.getElementById('acomp-tf-desde').value,
            psic: document.getElementById('acomp-psic').checked,
            psicDesde: document.getElementById('acomp-psic-desde').value,
            to: document.getElementById('acomp-to').checked,
            toDesde: document.getElementById('acomp-to-desde').value,
            fisio: document.getElementById('acomp-fisio').checked,
            fisioDesde: document.getElementById('acomp-fisio-desde').value,
            pedopsiq: document.getElementById('acomp-pedopsiq').checked,
            pedopsiqDesde: document.getElementById('acomp-pedopsiq-desde').value,
            neuroped: document.getElementById('acomp-neuroped').checked,
            neuropedDesde: document.getElementById('acomp-neuroped-desde').value,
            apoio: document.getElementById('acomp-apoio').checked,
            apoioDesde: document.getElementById('acomp-apoio-desde').value,
            outro: document.getElementById('acomp-outro').checked,
            outroDesc: document.getElementById('acomp-outro-desc').value
        },
        antecedentesFamiliares: {
            linguagem: document.getElementById('af-linguagem').checked,
            leitura: document.getElementById('af-leitura').checked,
            escrita: document.getElementById('af-escrita').checked,
            aprendizagem: document.getElementById('af-aprendizagem').checked,
            quem: document.getElementById('af-quem').value
        }
    };
}

// Guardar criança
async function guardarCrianca() {
    const id = document.getElementById('crianca-id').value;
    const dados = recolherDadosCrianca();
    
    if (!dados.nome) {
        mostrarToast('O nome é obrigatório', 'warning');
        return;
    }
    
    try {
        let crianca;
        if (id) {
            crianca = await API.actualizarCrianca(id, dados);
            mostrarToast('Criança actualizada!', 'success');
        } else {
            crianca = await API.guardarCrianca(dados);
            mostrarToast(`Criança ${crianca.codigo} criada!`, 'success');
        }
        
        fecharModal('modal-crianca');
        seleccionarCrianca(crianca.id);
    } catch (error) {
        console.error('Erro ao guardar criança:', error);
        mostrarToast('Erro ao guardar: ' + error.message, 'error');
    }
}
window.guardarCrianca = guardarCrianca;

// Seleccionar criança para avaliação
async function seleccionarCrianca(id) {
    try {
        const crianca = await API.obterCrianca(id);
        if (!crianca) {
            mostrarToast('Criança não encontrada', 'error');
            return;
        }
        
        criancaActual = crianca;
        
        // Mostrar indicador de criança seleccionada
        mostrarCriancaSeleccionada(crianca);
        
        // Preencher dados na identificação do caso
        document.getElementById('caso-nome').value = crianca.nome || '';
        if (crianca.data_nascimento) {
            document.getElementById('caso-idade').value = calcularIdade(crianca.data_nascimento);
        }
        if (crianca.ano_escolar) {
            // Mapear para valores do select
            const mapa = {
                'JI 3 anos': 'pre', 'JI 4 anos': 'pre', 'JI 5 anos': 'pre',
                '1º ano': '1', '2º ano': '2', '3º ano': '3', '4º ano': '4',
                '5º ano': '4', '6º ano': '4'
            };
            document.getElementById('caso-esc').value = mapa[crianca.ano_escolar] || '';
        }
        
        fecharModal('modal-seleccionar-crianca');
        mostrarToast(`${crianca.codigo} seleccionada`, 'success');
    } catch (error) {
        mostrarToast('Erro ao seleccionar criança', 'error');
    }
}
window.seleccionarCrianca = seleccionarCrianca;

// Mostrar indicador de criança seleccionada
function mostrarCriancaSeleccionada(crianca) {
    // Remover indicador existente
    const existente = document.querySelector('.crianca-seleccionada');
    if (existente) existente.remove();
    
    // Criar novo indicador
    const indicador = document.createElement('div');
    indicador.className = 'crianca-seleccionada';
    const idade = crianca.data_nascimento ? calcularIdade(crianca.data_nascimento) : '-';
    indicador.innerHTML = `
        <div class="crianca-seleccionada-info">
            <span class="codigo">${crianca.codigo}</span>
            <span class="nome">${crianca.nome}</span>
            <span class="idade">(${idade})</span>
        </div>
        <button class="btn btn-secondary btn-mudar-crianca" onclick="abrirSeleccionarCrianca()">Mudar</button>
    `;
    
    // Inserir antes do card de identificação
    const cardIdent = document.getElementById('card-identificacao');
    cardIdent.parentNode.insertBefore(indicador, cardIdent);
}

// Actualizar idade quando muda data da avaliação
function actualizarIdadeAvaliacao() {
    if (criancaActual && criancaActual.data_nascimento) {
        const dataAval = document.getElementById('caso-data').value;
        if (dataAval) {
            document.getElementById('caso-idade').value = calcularIdade(criancaActual.data_nascimento, dataAval);
        }
    }
}

// Event Listeners para crianças
document.addEventListener('DOMContentLoaded', () => {
    // Botão nova criança
    const btnNova = document.getElementById('btn-nova-crianca');
    if (btnNova) btnNova.addEventListener('click', abrirNovaCrianca);
    
    // Botão guardar criança
    const btnGuardar = document.getElementById('btn-guardar-crianca');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarCrianca);
    
    // Pesquisa de crianças
    const searchCrianca = document.getElementById('crianca-search');
    if (searchCrianca) searchCrianca.addEventListener('input', filtrarCriancas);
    
    // Botão load-case abre selecção de criança
    const btnLoadCase = document.getElementById('btn-load-case');
    if (btnLoadCase) {
        btnLoadCase.removeEventListener('click', () => {});
        btnLoadCase.addEventListener('click', abrirSeleccionarCrianca);
    }
    
    // Actualizar idade quando muda data da avaliação
    const dataAval = document.getElementById('caso-data');
    if (dataAval) dataAval.addEventListener('change', actualizarIdadeAvaliacao);
});
