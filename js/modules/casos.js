/* ==========================================================================
   PERLIM - Módulo Casos
   Gestão de casos: guardar, carregar, limpar, exemplo, storage
   ========================================================================== */

// ============================================================================
// GUARDAR NA CLOUD
// ============================================================================

async function guardarCasoCloud() {
    try {
        if (!API.isAuthenticated()) {
            mostrarToast('Faça login para guardar casos', 'warning');
            return;
        }
        
        const codigo = document.getElementById('caso-id')?.value.trim();
        if (!codigo) {
            mostrarToast('Preencha o código do caso', 'warning');
            return;
        }
        
        const temDados = casoActual.competencias.some(c => c !== null);
        if (!temDados) {
            mostrarToast('Preencha pelo menos uma competência', 'warning');
            return;
        }
        
        const analise = {
            padroes: document.getElementById('patterns')?.innerHTML || '',
            hipoteses: document.getElementById('hypotheses')?.innerHTML || '',
            intervencao: document.getElementById('intervention')?.innerHTML || ''
        };
        
        const dadosCompletos = {
            codigo: codigo,
            nome: document.getElementById('caso-nome')?.value.trim(),
            idade: document.getElementById('caso-idade')?.value.trim(),
            data: document.getElementById('caso-data')?.value,
            anoEscolar: document.getElementById('caso-esc')?.value,
            avaliador: document.getElementById('caso-aval')?.value.trim(),
            competencias: casoActual.competencias,
            provasAplicadas: casoActual.provasAplicadas || [],
            analise: analise,
            planoIA: planoActual || null
        };
        
        await API.guardarCasoCompleto(dadosCompletos);
        mostrarToast('Caso guardado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao guardar:', error);
        mostrarToast('Erro ao guardar: ' + error.message, 'error');
    }
}

// ============================================================================
// STORAGE LOCAL
// ============================================================================

function guardarCasoActual() {
    try {
        if (!casoActual.id) return;
        
        const casos = carregarCasos();
        const idx = casos.findIndex(c => c.id === casoActual.id);
        
        if (idx >= 0) {
            casos[idx] = casoActual;
        } else {
            casos.push(casoActual);
        }
        
        guardarCasos(casos);
    } catch (e) {
        console.error('Erro ao guardar caso local:', e);
    }
}

// ============================================================================
// LIMPAR FORMULÁRIO
// ============================================================================

function limparFormulario() {
    try {
        casoActual = criarCasoVazio();
        planoActual = null;
        
        document.getElementById('caso-id').value = '';
        document.getElementById('caso-nome').value = '';
        document.getElementById('caso-idade').value = '';
        document.getElementById('caso-data').value = new Date().toISOString().split('T')[0];
        document.getElementById('caso-esc').value = '';
        document.getElementById('caso-aval').value = '';
        
        const escInfo = document.getElementById('esc-info');
        if (escInfo) escInfo.style.display = 'none';
        
        document.querySelectorAll('.comp-val').forEach(v => {
            v.value = '';
            v.className = 'comp-val zone-green';
        });
        document.querySelectorAll('.comp-slider').forEach(s => s.value = 5);
        document.querySelectorAll('.comp-item.escrita').forEach(el => {
            el.classList.remove('disabled', 'hidden-escrita');
        });
        
        const provaList = document.getElementById('prova-list');
        if (provaList) provaList.innerHTML = '';
        
        escritaAtiva = true;
        
        const radarTitle = document.getElementById('radar-title');
        if (radarTitle) radarTitle.textContent = 'Perfil de Competência Linguística';
        const radarSubtitle = document.getElementById('radar-subtitle');
        if (radarSubtitle) radarSubtitle.textContent = '';
        
        const statsDashboard = document.getElementById('stats-dashboard');
        if (statsDashboard) statsDashboard.style.display = 'none';
        const analysis = document.getElementById('analysis');
        if (analysis) analysis.style.display = 'none';
        
        const planPanel = document.getElementById('plan-panel');
        if (planPanel) planPanel.style.display = 'none';
        
        radarChart?.setDados(null);
        mostrarToast('Formulário limpo', 'success');
    } catch (e) {
        console.error('Erro ao limpar formulário:', e);
    }
}

// ============================================================================
// CARREGAR EXEMPLO
// ============================================================================

function carregarExemplo() {
    try {
        const exemplo = gerarDadosExemplo();
        carregarCaso(exemplo);
        mostrarToast('Exemplo carregado!', 'success');
    } catch (e) {
        console.error('Erro ao carregar exemplo:', e);
    }
}

// ============================================================================
// CARREGAR CASO
// ============================================================================

function carregarCaso(caso) {
    try {
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
    } catch (e) {
        console.error('Erro ao carregar caso:', e);
    }
}

function preencherFormulario(caso) {
    try {
        document.getElementById('caso-id').value = caso.id || '';
        document.getElementById('caso-nome').value = caso.nome || '';
        document.getElementById('caso-idade').value = caso.idade || '';
        document.getElementById('caso-data').value = caso.data || '';
        if (caso.escolaridade) {
            document.getElementById('caso-esc').value = caso.escolaridade;
            verificarEscrita();
        }
        document.getElementById('caso-notas').value = caso.notas || '';
        
        const lista = document.getElementById('prova-list');
        if (lista) lista.innerHTML = '';
        
        caso.provasAplicadas?.forEach?.((prova, idx) => {
            const item = document.createElement('div');
            item.className = 'prova-item';
            item.dataset.idx = idx;
            item.innerHTML = `
                <span><b>${prova.nome || prova.prova}</b>: ${prova.valor} (${prova.escala || prova.esc}) → <b>${prova.competencia || prova.comp}/10</b></span>
                <div class="prova-item-actions">
                    <button class="prova-item-edit" title="Editar">✏️</button>
                    <button class="prova-item-remove" title="Remover">×</button>
                </div>
            `;
            item.querySelector('.prova-item-edit')?.addEventListener('click', () => abrirEdicaoProva(parseInt(item.dataset.idx)));
            item.querySelector('.prova-item-remove')?.addEventListener('click', () => removerProvaAplicada(parseInt(item.dataset.idx)));
            lista?.appendChild(item);
        });
    } catch (e) {
        console.error('Erro ao preencher formulário:', e);
    }
}

// ============================================================================
// HISTÓRICO
// ============================================================================

async function actualizarListaHistorico() {
    const container = document.getElementById('history-list');
    if (!container) return;
    
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
    } catch (e) {
        console.error('Erro ao carregar histórico:', e);
        container.innerHTML = '<div class="history-empty"><p>Erro ao carregar</p></div>';
    }
}

async function carregarCasoGuardado(id) {
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
                provasAplicadas: caso.provasAplicadas || []
            };
            preencherFormulario(casoActual);
            (casoActual.competencias || []).forEach((comp, i) => {
                radarChart?.setValor(i, comp);
            });
            radarChart?.desenhar();
            mostrarToast('Caso carregado!', 'success');
        }
    } catch (e) {
        console.error('Erro ao carregar caso:', e);
        mostrarToast('Erro ao carregar caso', 'error');
    }
}

async function eliminarCasoGuardado(id) {
    try {
        if (!confirm('Eliminar este caso?')) return;
        await API.eliminarCaso(id);
        actualizarListaHistorico();
        mostrarToast('Caso eliminado', 'info');
    } catch (e) {
        console.error('Erro ao eliminar caso:', e);
    }
}

function filtrarHistorico() {
    try {
        const termo = document.getElementById('history-search')?.value.toLowerCase();
        document.querySelectorAll('.history-item').forEach(item => {
            const texto = item.textContent.toLowerCase();
            item.style.display = texto.includes(termo) ? '' : 'none';
        });
    } catch (e) {
        console.error('Erro ao filtrar histórico:', e);
    }
}

function importarCaso() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                const dados = await importarJSON(file);
                carregarCaso(dados);
                mostrarToast('Caso importado!', 'success');
            } catch (err) {
                mostrarToast('Erro ao importar: ' + err.message, 'error');
            }
        };
        input.click();
    } catch (e) {
        console.error('Erro ao importar caso:', e);
    }
}

function exportarTodosCasos() {
    try {
        const casos = carregarCasos();
        exportarJSON(casos, `PERLIM_todos_casos_${new Date().toISOString().split('T')[0]}.json`);
    } catch (e) {
        console.error('Erro ao exportar todos os casos:', e);
    }
}

// Expor globalmente
window.carregarCasoGuardado = carregarCasoGuardado;
window.eliminarCasoGuardado = eliminarCasoGuardado;
window.carregarCasoCloud = carregarCasoGuardado;
window.guardarPlano = guardarPlano;
window.exportarPlano = exportarPlano;
