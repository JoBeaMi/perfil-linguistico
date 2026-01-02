/* ==========================================================================
   PERFIL DE COMPETÊNCIA LINGUÍSTICA - App Module v3.1
   Lógica principal da aplicação com funcionalidades avançadas
   ========================================================================== */

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

let casoActual = criarCasoVazio();
let radarChart = null;
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
    document.getElementById('btn-exemplo').addEventListener('click', carregarExemplo);
    document.getElementById('btn-export').addEventListener('click', () => abrirModal('modal-export'));
    document.getElementById('btn-add-prova').addEventListener('click', adicionarProva);
    
    // Header
    document.getElementById('btn-history').addEventListener('click', () => {
        actualizarListaHistorico();
        abrirModal('modal-history');
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
    document.getElementById('btn-import-json').addEventListener('click', importarCaso);
    document.getElementById('btn-export-all').addEventListener('click', exportarTodosCasos);
    document.getElementById('history-search').addEventListener('input', filtrarHistorico);
    
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

function actualizarListaHistorico() {
    const container = document.getElementById('history-list');
    const casos = carregarCasos();
    
    if (casos.length === 0) {
        container.innerHTML = '<div class="history-empty"><p>Nenhum caso guardado</p></div>';
        return;
    }
    
    container.innerHTML = casos.sort((a, b) => new Date(b.dataModificacao) - new Date(a.dataModificacao)).map(caso => `
        <div class="history-item" data-id="${caso.id}">
            <div class="history-item-info">
                <h4>${caso.id} - ${caso.nome || 'Sem nome'}</h4>
                <p>Data: ${caso.data} | Avaliador: ${caso.avaliador || '-'}</p>
            </div>
            <div class="history-item-actions">
                <button class="btn-mini" onclick="carregarCasoGuardado('${caso.id}')" title="Carregar">↑</button>
                <button class="btn-mini" onclick="eliminarCasoGuardado('${caso.id}')" title="Eliminar">×</button>
            </div>
        </div>
    `).join('');
}

function carregarCasoGuardado(id) {
    const casos = carregarCasos();
    const caso = casos.find(c => c.id === id);
    if (!caso) {
        mostrarToast('Caso não encontrado', 'error');
        return;
    }
    carregarCaso(caso);
    fecharModal('modal-history');
    mostrarToast('Caso carregado!', 'success');
}

function eliminarCasoGuardado(id) {
    if (!confirm(`Eliminar o caso "${id}"?`)) return;
    const casos = carregarCasos().filter(c => c.id !== id);
    guardarCasos(casos);
    actualizarListaHistorico();
    mostrarToast('Caso eliminado', 'warning');
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
    }
}

function gerarRelatorio() {
    const win = window.open('', '_blank');
    
    // Obter conteúdo das secções
    const patterns = document.getElementById('patterns')?.innerHTML || '<p>Sem dados</p>';
    const hypotheses = document.getElementById('hypotheses')?.innerHTML || '<p>Sem dados</p>';
    const intervention = document.getElementById('intervention')?.innerHTML || '<p>Sem dados</p>';
    
    // Gerar secção do plano terapêutico se existir
    let planoHtml = '';
    if (planoActual || casoActual.planoTerapeutico) {
        const plano = planoActual || casoActual.planoTerapeutico;
        planoHtml = `
            <div class="section page-break">
                <h2>🤖 Plano Terapêutico (Sugerido por IA)</h2>
                <div class="plano-content">
                    ${plano.resumo ? `<p><strong>Resumo:</strong> ${plano.resumo}</p>` : ''}
                    ${plano.objectivo_geral ? `<p><strong>Objectivo Geral:</strong> ${plano.objectivo_geral}</p>` : ''}
                    ${plano.objectivos_especificos?.length ? `
                        <h3>Objectivos Específicos</h3>
                        <ul>${plano.objectivos_especificos.map(o => `<li>${o}</li>`).join('')}</ul>
                    ` : ''}
                    ${plano.estrategias?.length ? `
                        <h3>Estratégias de Intervenção</h3>
                        <ul>${plano.estrategias.map(e => `<li>${e}</li>`).join('')}</ul>
                    ` : ''}
                    ${plano.actividades_sugeridas?.length ? `
                        <h3>Actividades Sugeridas</h3>
                        <ul>${plano.actividades_sugeridas.map(a => `<li>${a}</li>`).join('')}</ul>
                    ` : ''}
                    ${plano.materiais_recomendados?.length ? `
                        <h3>Materiais Recomendados</h3>
                        <ul>${plano.materiais_recomendados.map(m => `<li>${m}</li>`).join('')}</ul>
                    ` : ''}
                    ${plano.frequencia_sugerida ? `<p><strong>Frequência:</strong> ${plano.frequencia_sugerida}</p>` : ''}
                    ${plano.duracao_estimada ? `<p><strong>Duração Estimada:</strong> ${plano.duracao_estimada}</p>` : ''}
                    ${plano.indicadores_progresso?.length ? `
                        <h3>Indicadores de Progresso</h3>
                        <ul>${plano.indicadores_progresso.map(i => `<li>${i}</li>`).join('')}</ul>
                    ` : ''}
                    ${plano.recomendacoes_familia?.length ? `
                        <h3>Recomendações para a Família</h3>
                        <ul>${plano.recomendacoes_familia.map(r => `<li>${r}</li>`).join('')}</ul>
                    ` : ''}
                </div>
                <p class="ia-disclaimer"><em>Este plano foi gerado por IA e deve ser validado por um profissional de saúde.</em></p>
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
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${casoActual.provasAplicadas.map(p => `
                            <tr>
                                <td>${p.nome}</td>
                                <td>${p.valor}</td>
                                <td>${p.escala.toUpperCase()}</td>
                                <td><strong>${p.competencia}/10</strong></td>
                                <td>${p.data ? new Date(p.data).toLocaleDateString('pt-PT') : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Notas clínicas
    let notasHtml = '';
    if (casoActual.notas) {
        notasHtml = `
            <div class="section">
                <h2>Notas Clínicas</h2>
                <div class="notas-box">${casoActual.notas.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }
    
    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Relatório - ${casoActual.nome || casoActual.id}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #1E293B; line-height: 1.6; font-size: 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #00A79D; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo-section img { height: 50px; }
        .header h1 { font-size: 20px; color: #00A79D; margin-bottom: 4px; }
        .header-subtitle { font-size: 11px; color: #64748B; }
        .header-right { text-align: right; }
        .header-right p { font-size: 11px; color: #64748B; }
        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .info-item { padding: 12px 15px; background: #F1F5F9; border-radius: 8px; }
        .info-item label { font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-item p { font-size: 14px; font-weight: 600; margin-top: 4px; }
        .radar-container { text-align: center; margin: 30px 0; }
        .radar-container img { max-width: 450px; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; }
        .section { margin: 25px 0; }
        .section h2 { font-size: 14px; color: #00A79D; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 15px; }
        .section h3 { font-size: 12px; color: #334155; margin: 15px 0 8px; }
        .analysis-item { padding: 10px 15px; border-radius: 6px; margin-bottom: 8px; font-size: 12px; }
        .critical { background: #FEE2E2; border-left: 4px solid #EF4444; }
        .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; }
        .success { background: #D1FAE5; border-left: 4px solid #10B981; }
        .provas-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .provas-table th, .provas-table td { padding: 8px 12px; border: 1px solid #E2E8F0; text-align: left; }
        .provas-table th { background: #F1F5F9; font-weight: 600; }
        .notas-box { background: #F8FAFC; padding: 15px; border-radius: 8px; border: 1px solid #E2E8F0; }
        .plano-content { background: #F0FDF9; padding: 20px; border-radius: 8px; border: 1px solid #99F6E4; }
        .plano-content ul { margin: 8px 0 15px 20px; }
        .plano-content li { margin-bottom: 4px; }
        .ia-disclaimer { font-size: 10px; color: #64748B; margin-top: 15px; text-align: center; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #E2E8F0; text-align: center; font-size: 10px; color: #64748B; }
        .page-break { page-break-before: always; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <img src="logo.png" alt="CAIDI" onerror="this.style.display='none'">
            <div>
                <h1>Perfil de Competência Linguística</h1>
                <p class="header-subtitle">Quadrantes de Alves (2019) · Operacionalização: J. Miguel</p>
            </div>
        </div>
        <div class="header-right">
            <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-PT')}</p>
            <p>CAIDI - Centro de Avaliação</p>
        </div>
    </div>
    
    <div class="info-grid">
        <div class="info-item">
            <label>Código</label>
            <p>${casoActual.id || '-'}</p>
        </div>
        <div class="info-item">
            <label>Nome</label>
            <p>${casoActual.nome || '-'}</p>
        </div>
        <div class="info-item">
            <label>Idade</label>
            <p>${casoActual.idade || '-'}</p>
        </div>
        <div class="info-item">
            <label>Data da Avaliação</label>
            <p>${casoActual.data || '-'}</p>
        </div>
    </div>
    
    <div class="radar-container">
        <img src="${radarChart.toDataURL()}" alt="Perfil Linguístico">
    </div>
    
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
    
    <div class="footer">
        <p>© ${new Date().getFullYear()} CAIDI - Centro de Avaliação e Intervenção em Dificuldades Intelectuais</p>
        <p>Este relatório foi gerado automaticamente pelo sistema Perfil de Competência Linguística</p>
    </div>
    
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
    
    win.document.write(html);
    win.document.close();
    mostrarToast('Relatório gerado!', 'success');
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
    if (e.key.toLowerCase() === 'h' && !e.ctrlKey) { e.preventDefault(); actualizarListaHistorico(); abrirModal('modal-history'); }
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
    
    // Dashboard
    document.getElementById('btn-dashboard').addEventListener('click', () => {
        if (API.isAuthenticated()) {
            carregarDashboard();
            abrirModal('modal-dashboard');
        } else {
            abrirModal('modal-auth');
        }
    });
    
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

async function carregarDashboard() {
    if (!API.isAuthenticated()) return;
    
    try {
        const casos = await API.listarCasos();
        const provasCustom = await API.listarProvasCustom();
        
        // Estatísticas
        const agora = new Date();
        const mesActual = agora.getMonth();
        const anoActual = agora.getFullYear();
        
        const casosMes = casos.filter(c => {
            const d = new Date(c.criado_em);
            return d.getMonth() === mesActual && d.getFullYear() === anoActual;
        });
        
        // Média de competências
        let somaComp = 0, countComp = 0;
        casos.forEach(c => {
            if (c.competencias?.length) {
                c.competencias.forEach(comp => { somaComp += comp; countComp++; });
            }
        });
        const mediaComp = countComp > 0 ? (somaComp / countComp).toFixed(1) : '-';
        
        document.getElementById('stat-total-casos').textContent = casos.length;
        document.getElementById('stat-casos-mes').textContent = casosMes.length;
        document.getElementById('stat-media-comp').textContent = mediaComp;
        document.getElementById('stat-provas-custom').textContent = provasCustom.length;
        
        // Lista de casos recentes
        const container = document.getElementById('casos-recentes');
        if (casos.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum caso guardado ainda.</p>';
        } else {
            container.innerHTML = casos.slice(0, 8).map(c => `
                <div class="caso-card" onclick="carregarCasoCloud('${c.id}')">
                    <div class="caso-card-header">
                        <h5>${c.nome || c.id}</h5>
                        <small>${new Date(c.criado_em).toLocaleDateString('pt-PT')}</small>
                    </div>
                    <div class="caso-card-meta">
                        <span>📊 ${c.provasAplicadas?.length || 0} provas</span>
                        <span>🎂 ${c.idade || '-'}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        mostrarToast('Erro ao carregar dashboard', 'error');
    }
}

async function carregarCasoCloud(id) {
    try {
        const caso = await API.obterCaso(id);
        casoActual = caso;
        preencherFormulario(caso);
        caso.competencias?.forEach((comp, i) => {
            radarChart.setValor(i, comp);
        });
        radarChart.desenhar();
        fecharModal('modal-dashboard');
        mostrarToast('Caso carregado!', 'success');
    } catch (err) {
        mostrarToast('Erro ao carregar caso', 'error');
    }
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
