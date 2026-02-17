/* ==========================================================================
   PERLIM - Interface de Cotação de Provas v1.0
   Gera formulários de cotação para provas detalhadas (GOL-E, etc.)
   Suporta: total directo OU cotação item a item
   Requer: calculos-normativos.js
   ========================================================================== */

// ============================================================================
// ESTADO DA COTAÇÃO
// ============================================================================

let cotacaoActual = {
    provaId: null,
    idade: null,
    pontuacoes: {},      // subtesteId → pontuação bruta total
    itens: {},           // subtesteId → [cotação por item]
    modoDetalhe: {},     // subtesteId → true/false
    resultados: null
};

// ============================================================================
// GERAR INTERFACE DE COTAÇÃO
// ============================================================================

/**
 * Abre o modal de cotação para uma prova detalhada
 */
function abrirCotacaoProva(provaId) {
    const prova = PROVAS_DETALHADAS[provaId];
    if (!prova) {
        mostrarToast('Prova detalhada não encontrada', 'error');
        return;
    }

    // Obter idade do caso actual
    const idadeEl = document.getElementById('caso-idade');
    const idade = idadeEl ? idadeEl.value : null;

    if (!idade) {
        mostrarToast('Preencha a idade da criança primeiro', 'warning');
        return;
    }

    cotacaoActual = {
        provaId,
        idade,
        pontuacoes: {},
        itens: {},
        modoDetalhe: {},
        resultados: null
    };

    // Inicializar arrays de itens
    prova.estruturas.forEach(est => {
        est.subtestes.forEach(sub => {
            cotacaoActual.itens[sub.id] = new Array(sub.numItens).fill(null);
            cotacaoActual.modoDetalhe[sub.id] = false;
        });
    });

    const html = gerarHTMLCotacao(prova, idade);
    mostrarModalCotacao(html, prova);
}

/**
 * Gera o HTML completo do formulário de cotação
 */
function gerarHTMLCotacao(prova, idade) {
    const idadeMeses = idadeParaMeses(idade);
    const idadeTexto = idadeMeses
        ? `${Math.floor(idadeMeses/12)} anos e ${idadeMeses%12} meses`
        : idade;

    let html = `
        <div class="cotacao-header">
            <div class="cotacao-prova-info">
                <h3>${prova.nome}</h3>
                <span class="cotacao-desc">${prova.nomeCompleto}</span>
                <span class="cotacao-idade">Idade: <b>${idadeTexto}</b></span>
            </div>
            <div class="cotacao-total-display" id="cotacao-total-geral">
                <span class="cotacao-total-label">Total</span>
                <span class="cotacao-total-valor" id="cotacao-total-valor">0/${prova.pontuacaoMaxima}</span>
                <span class="cotacao-total-z" id="cotacao-total-z">—</span>
            </div>
        </div>

        <div class="cotacao-estruturas">
    `;

    prova.estruturas.forEach((est, estIdx) => {
        html += gerarHTMLEstrutura(est, estIdx, prova.id);
    });

    html += `
        </div>

        <div class="cotacao-actions">
            <button class="btn btn-secondary" onclick="fecharModalCotacao()">Cancelar</button>
            <button class="btn btn-primary" id="btn-aplicar-cotacao" onclick="aplicarCotacao()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                Aplicar Resultados
            </button>
        </div>
    `;

    return html;
}

/**
 * Gera HTML para uma estrutura (acordeão)
 */
function gerarHTMLEstrutura(estrutura, estIdx, provaId) {
    const cores = {
        'Semântico': '#5B8BC4',
        'Morfossintático': '#E8A54C',
        'Fonológico': '#E05252'
    };
    const cor = cores[estrutura.dominio] || '#666';

    let html = `
        <div class="cotacao-estrutura" data-estrutura="${estrutura.id}">
            <div class="cotacao-estrutura-header" onclick="toggleEstrutura('${estrutura.id}')" style="border-left: 4px solid ${cor}">
                <div class="cotacao-estrutura-info">
                    <span class="cotacao-estrutura-badge" style="background:${cor}">${estrutura.dominio}</span>
                    <h4>${estrutura.nome}</h4>
                </div>
                <div class="cotacao-estrutura-resumo">
                    <span class="cotacao-est-bruto" id="est-bruto-${estrutura.id}">0/${estrutura.pontuacaoMaxima}</span>
                    <span class="cotacao-est-z" id="est-z-${estrutura.id}">—</span>
                    <svg class="cotacao-chevron" id="chevron-${estrutura.id}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
            </div>
            <div class="cotacao-estrutura-body" id="body-${estrutura.id}" style="display:${estIdx === 0 ? 'block' : 'none'}">
    `;

    estrutura.subtestes.forEach(sub => {
        html += gerarHTMLSubteste(sub, provaId);
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Gera HTML para um subteste (total directo + opção de detalhar)
 */
function gerarHTMLSubteste(subteste, provaId) {
    const cotMax = subteste.cotacaoMax;
    const maxPts = subteste.pontuacaoMaxima;

    let html = `
        <div class="cotacao-subteste" data-subteste="${subteste.id}">
            <div class="cotacao-subteste-header">
                <div class="cotacao-subteste-info">
                    <h5>${subteste.nome}</h5>
                    <span class="cotacao-subteste-desc">${subteste.descricao}</span>
                </div>
                <div class="cotacao-subteste-input">
                    <input type="number" 
                           class="cotacao-total-input" 
                           id="total-${subteste.id}" 
                           min="0" max="${maxPts}" 
                           placeholder="0-${maxPts}"
                           oninput="onTotalChange('${provaId}', '${subteste.id}', this.value)">
                    <span class="cotacao-max">/ ${maxPts}</span>
                    <span class="cotacao-sub-z" id="sub-z-${subteste.id}">—</span>
                </div>
            </div>
            <div class="cotacao-subteste-toggle">
                <button class="btn-detalhar" id="btn-detalhar-${subteste.id}" 
                        onclick="toggleDetalhe('${provaId}', '${subteste.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg>
                    Detalhar item a item
                </button>
            </div>
            <div class="cotacao-itens-grid" id="itens-${subteste.id}" style="display:none">
    `;

    // Gerar itens
    subteste.itens.forEach((item, i) => {
        html += `
                <div class="cotacao-item" data-item-idx="${i}">
                    <span class="cotacao-item-num">${i + 1}.</span>
                    <span class="cotacao-item-texto">${item}</span>
                    <div class="cotacao-item-botoes">
        `;
        for (let c = 0; c <= cotMax; c++) {
            html += `
                        <button class="btn-cotacao" 
                                id="cot-${subteste.id}-${i}-${c}"
                                data-subteste="${subteste.id}" 
                                data-item="${i}" 
                                data-valor="${c}"
                                onclick="cotarItem('${provaId}', '${subteste.id}', ${i}, ${c})">${c}</button>
            `;
        }
        html += `
                    </div>
                </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}


// ============================================================================
// INTERACÇÕES
// ============================================================================

/**
 * Toggle acordeão de estrutura
 */
function toggleEstrutura(estruturaId) {
    const body = document.getElementById(`body-${estruturaId}`);
    const chevron = document.getElementById(`chevron-${estruturaId}`);
    
    if (body.style.display === 'none') {
        body.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
    } else {
        body.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
    }
}

/**
 * Toggle detalhe item a item de um subteste
 */
function toggleDetalhe(provaId, subtesteId) {
    const grid = document.getElementById(`itens-${subtesteId}`);
    const btn = document.getElementById(`btn-detalhar-${subtesteId}`);
    const isVisible = grid.style.display !== 'none';
    
    grid.style.display = isVisible ? 'none' : 'block';
    cotacaoActual.modoDetalhe[subtesteId] = !isVisible;
    
    btn.innerHTML = isVisible
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg> Detalhar item a item'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg> Ocultar itens';
}

/**
 * Cotação de um item individual (botão 0/1/2)
 */
function cotarItem(provaId, subtesteId, itemIdx, valor) {
    const prova = PROVAS_DETALHADAS[provaId];
    const subteste = encontrarSubteste(prova, subtesteId);
    if (!subteste) return;

    // Actualizar estado
    cotacaoActual.itens[subtesteId][itemIdx] = valor;

    // Actualizar visual dos botões
    for (let c = 0; c <= subteste.cotacaoMax; c++) {
        const btn = document.getElementById(`cot-${subtesteId}-${itemIdx}-${c}`);
        if (btn) {
            btn.classList.toggle('active', c === valor);
        }
    }

    // Calcular total a partir dos itens
    const itens = cotacaoActual.itens[subtesteId];
    const preenchidos = itens.filter(v => v !== null);
    const soma = preenchidos.reduce((a, b) => a + b, 0);

    // Actualizar campo total
    const totalInput = document.getElementById(`total-${subtesteId}`);
    if (totalInput) {
        totalInput.value = soma;
    }

    // Actualizar pontuação
    cotacaoActual.pontuacoes[subtesteId] = soma;
    recalcularTudo(provaId);
}

/**
 * Alteração manual do total de um subteste
 */
function onTotalChange(provaId, subtesteId, valor) {
    const num = parseInt(valor);
    if (isNaN(num) || num < 0) {
        cotacaoActual.pontuacoes[subtesteId] = null;
    } else {
        cotacaoActual.pontuacoes[subtesteId] = num;
    }
    recalcularTudo(provaId);
}

/**
 * Recalcula todos os z-scores e actualiza a interface
 */
function recalcularTudo(provaId) {
    const prova = PROVAS_DETALHADAS[provaId];
    if (!prova) return;

    const resultados = processarProvaCompleta(provaId, cotacaoActual.pontuacoes, cotacaoActual.idade);
    cotacaoActual.resultados = resultados;

    if (!resultados) return;

    // Actualizar z-scores por subteste
    resultados.estruturas.forEach(est => {
        // Total da estrutura
        const estBrutoEl = document.getElementById(`est-bruto-${est.id}`);
        const estZEl = document.getElementById(`est-z-${est.id}`);
        
        if (estBrutoEl) {
            const estruturaDef = prova.estruturas.find(e => e.id === est.id);
            estBrutoEl.textContent = `${est.totalBruto}/${estruturaDef.pontuacaoMaxima}`;
        }
        if (estZEl && est.zScore !== null) {
            estZEl.textContent = `z=${est.zScore.toFixed(2)}`;
            estZEl.className = `cotacao-est-z zona-${zonaZScore(est.zScore)}`;
        }

        // Subtestes individuais
        est.subtestes.forEach(sub => {
            const subZEl = document.getElementById(`sub-z-${sub.id}`);
            if (subZEl && sub.zScore !== null) {
                subZEl.textContent = `z=${sub.zScore.toFixed(2)} (${sub.descricao})`;
                subZEl.className = `cotacao-sub-z zona-${sub.zona}`;
            }
        });
    });

    // Total geral
    const totalValorEl = document.getElementById('cotacao-total-valor');
    const totalZEl = document.getElementById('cotacao-total-z');
    
    if (totalValorEl) {
        totalValorEl.textContent = `${resultados.totalBruto}/${prova.pontuacaoMaxima}`;
    }
    if (totalZEl && resultados.totalZ !== null) {
        totalZEl.textContent = `z=${resultados.totalZ.toFixed(2)} — ${descreverZScore(resultados.totalZ)}`;
        totalZEl.className = `cotacao-total-z zona-${zonaZScore(resultados.totalZ)}`;
    }
}


// ============================================================================
// APLICAR RESULTADOS AO CASO
// ============================================================================

/**
 * Aplica os resultados da cotação ao caso actual (alimenta o radar)
 */
function aplicarCotacao() {
    const resultados = cotacaoActual.resultados;
    if (!resultados) {
        mostrarToast('Preencha pelo menos um subteste', 'warning');
        return;
    }

    // Verificar se há dados
    const temDados = resultados.estruturas.some(e => e.subtestes.some(s => s.pontuacaoBruta > 0));
    if (!temDados) {
        mostrarToast('Nenhuma pontuação inserida', 'warning');
        return;
    }

    // Aplicar competências nos segmentos do radar
    Object.entries(resultados.segmentos).forEach(([segId, competencia]) => {
        const idx = parseInt(segId);
        if (idx >= 0 && idx < 40 && competencia !== null) {
            casoActual.competencias[idx] = Math.round(competencia * 10) / 10;
        }
    });

    // Registar provas aplicadas por subteste
    resultados.estruturas.forEach(est => {
        est.subtestes.forEach(sub => {
            if (sub.pontuacaoBruta > 0) {
                const provaAplicada = {
                    prova: cotacaoActual.provaId,
                    nome: `${resultados.provaNome} — ${sub.nome}`,
                    valor: sub.pontuacaoBruta,
                    escala: 'z',
                    valorConvertido: sub.zScore,
                    competencia: sub.competencia,
                    segmentos: sub.segmentos,
                    data: new Date().toISOString()
                };

                if (!casoActual.provasAplicadas) casoActual.provasAplicadas = [];
                casoActual.provasAplicadas.push(provaAplicada);

                // Adicionar à lista visual
                adicionarProvaListaUI(provaAplicada, casoActual.provasAplicadas.length - 1);
            }
        });
    });

    // Actualizar inputs de competência na interface
    actualizarInputsCompetencia();

    fecharModalCotacao();
    mostrarToast(`${resultados.provaNome} aplicada com sucesso!`, 'success');
}

/**
 * Actualiza os inputs de competência na interface principal
 */
function actualizarInputsCompetencia() {
    casoActual.competencias.forEach((comp, idx) => {
        if (comp !== null) {
            const input = document.querySelector(`input[data-seg="${idx}"]`);
            if (input) {
                input.value = comp;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });
}


// ============================================================================
// MODAL DE COTAÇÃO
// ============================================================================

/**
 * Mostra o modal de cotação
 */
function mostrarModalCotacao(html, prova) {
    // Remover modal anterior se existir
    const existente = document.getElementById('modal-cotacao');
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'modal-cotacao';
    modal.innerHTML = `
        <div class="modal-content modal-xl">
            <div class="modal-header">
                <h3>📋 Cotação: ${prova.nome}</h3>
                <button class="modal-close" onclick="fecharModalCotacao()">&times;</button>
            </div>
            <div class="modal-body cotacao-modal-body">
                ${html}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fechar com Escape
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharModalCotacao();
    });
}

/**
 * Fecha o modal de cotação
 */
function fecharModalCotacao() {
    const modal = document.getElementById('modal-cotacao');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}


// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Encontra um subteste dentro de uma prova
 */
function encontrarSubteste(prova, subtesteId) {
    for (const est of prova.estruturas) {
        const sub = est.subtestes.find(s => s.id === subtesteId);
        if (sub) return sub;
    }
    return null;
}


// ============================================================================
// INTEGRAÇÃO COM SELECTOR DE PROVAS EXISTENTE
// ============================================================================

/**
 * Override do selector de provas — se a prova tem definição detalhada,
 * abre o modal de cotação em vez do fluxo normal
 */
function verificarProvaDetalhada() {
    const select = document.getElementById('prova-sel');
    if (!select) return;

    select.addEventListener('change', function() {
        const provaId = this.value;
        
        // Verificar se tem prova detalhada
        if (temProvaDetalhada(provaId)) {
            // Mostrar botão de cotação detalhada
            mostrarBotaoCotacaoDetalhada(provaId);
        } else {
            ocultarBotaoCotacaoDetalhada();
        }
    });
}

function mostrarBotaoCotacaoDetalhada(provaId) {
    let container = document.getElementById('cotacao-detalhada-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'cotacao-detalhada-container';
        const addBtn = document.getElementById('btn-add-prova');
        if (addBtn) addBtn.parentNode.insertBefore(container, addBtn);
    }
    
    container.innerHTML = `
        <button class="btn btn-accent btn-block" onclick="abrirCotacaoProva('${provaId}')" style="margin: 8px 0; background: linear-gradient(135deg, #7C3AED, #5B21B6); color: white; padding: 12px; font-size: 0.95rem; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
            📋 Abrir Cotação Detalhada (GOL-E)
        </button>
    `;
    
    container.style.display = 'block';
}

function ocultarBotaoCotacaoDetalhada() {
    const container = document.getElementById('cotacao-detalhada-container');
    if (container) container.style.display = 'none';
}


// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    verificarProvaDetalhada();
    console.log('✅ Interface de Cotação v1.0 carregada');
});
