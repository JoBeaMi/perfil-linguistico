/* ==========================================================================
   PERLIM - Módulo Perfil
   Geração de perfil, estatísticas, análise clínica, plano terapêutico
   ========================================================================== */

// ============================================================================
// GERAR PERFIL
// ============================================================================

function gerarPerfil() {
    try {
        casoActual.id = document.getElementById('caso-id')?.value || `CASO-${Date.now()}`;
        casoActual.nome = document.getElementById('caso-nome')?.value;
        casoActual.idade = document.getElementById('caso-idade')?.value;
        casoActual.data = document.getElementById('caso-data')?.value;
        casoActual.escolaridade = document.getElementById('caso-esc')?.value;
        casoActual.avaliador = document.getElementById('caso-aval')?.value;
        casoActual.dataModificacao = new Date().toISOString();
        
        document.querySelectorAll('.comp-val').forEach(input => {
            const idx = parseInt(input.dataset.idx);
            if (input.value !== '') {
                casoActual.competencias[idx] = Math.max(0, Math.min(10, parseInt(input.value)));
            }
        });
        
        const titulo = casoActual.nome || casoActual.id || 'Perfil de Competência Linguística';
        const tituloEl = document.getElementById('radar-title');
        const subtituloEl = document.getElementById('radar-subtitle');
        if (tituloEl) tituloEl.textContent = titulo;
        if (subtituloEl) subtituloEl.textContent = casoActual.idade ? `Idade: ${casoActual.idade}` : '';
        
        radarChart?.setDados(casoActual.competencias, casoActual, escritaAtiva);
        
        gerarEstatisticas();
        const analise = gerarAnalise();
        gerarPlanoTerapeutico(analise);
        
        if (settings.autoSave) {
            guardarCasoActual();
        }
        
        mostrarToast('Perfil gerado com sucesso!', 'success');
    } catch (e) {
        console.error('Erro ao gerar perfil:', e);
        mostrarToast('Erro ao gerar perfil', 'error');
    }
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

function gerarEstatisticas() {
    try {
        const dashboard = document.getElementById('stats-dashboard');
        const grid = document.getElementById('stats-grid');
        
        const comps = casoActual.competencias.filter(c => c !== null);
        if (comps.length === 0) {
            if (dashboard) dashboard.style.display = 'none';
            return;
        }
        
        if (dashboard) dashboard.style.display = 'block';
        
        const medias = MODULOS.map((mod, mi) => {
            const vals = casoActual.competencias.slice(mi * 8, mi * 8 + 8).filter(v => v !== null);
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        });
        
        if (!grid) return;
        
        grid.innerHTML = medias.map((media, i) => {
            if (media === null) return '';
            const zona = obterZona(media);
            return `
                <div class="stat-card">
                    <div class="stat-label">${MODULOS[i].nome}</div>
                    <div class="stat-value zone-${zona}">${media.toFixed(1)}</div>
                    <div class="stat-bar"><div class="stat-bar-fill" style="width:${media * 10}%;background:${MODULOS[i].cor}"></div></div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Erro ao gerar estatísticas:', e);
    }
}

// ============================================================================
// ANÁLISE CLÍNICA
// ============================================================================

function calcularMediaPorDimensao(dimensao, valor) {
    try {
        const vals = casoActual.competencias.filter((c, i) => c !== null && SEGMENTOS[i][dimensao] === valor);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    } catch (e) {
        console.error('Erro ao calcular média:', e);
        return null;
    }
}

function gerarAnalise() {
    try {
        const analysisPanel = document.getElementById('analysis');
        const comps = casoActual.competencias.filter(c => c !== null);
        
        if (comps.length === 0) {
            if (analysisPanel) analysisPanel.style.display = 'none';
            return null;
        }
        
        if (analysisPanel) analysisPanel.style.display = 'block';
        
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
        
        const analise = {
            modulosAfectados: modsAfectados.map(m => m.nome),
            medias: {
                modulos: medMod,
                oral: aOral, escrita: aEscr,
                compreensao: aComp, expressao: aExpr,
                implicito: aImpl, explicito: aExpl
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
        
        const patternsEl = document.getElementById('patterns');
        if (patternsEl) patternsEl.innerHTML = patterns;
        
        // === HIPÓTESES ===
        let hypo = '';
        
        const temPDL = modsAfectados.some(m => ['Fonológico', 'Morfológico', 'Sintático', 'Semântico'].includes(m.nome)) && aOral !== null && aOral < 4;
        
        if (temPDL) {
            hypo += `<div class="analysis-item critical"><span class="tag tag-danger">Alta Prob.</span><b>Perturbação do Desenvolvimento da Linguagem (PDL)</b></div>`;
            analise.hipoteses.push('PDL');
        }
        
        if (modsAfectados.length === 1 && modsAfectados[0].nome === 'Fonológico') {
            hypo += `<div class="analysis-item warning"><span class="tag tag-warning">Provável</span><b>Perturbação dos Sons da Fala</b></div>`;
            analise.hipoteses.push('PSF');
        }
        
        if (medMod[4] !== null && medMod[4] < 4 && modsAfectados.length <= 2) {
            hypo += `<div class="analysis-item warning"><span class="tag tag-warning">Considerar</span><b>Perturbação da Comunicação Social (Pragmática)</b></div>`;
            analise.hipoteses.push('PCS');
        }
        
        if (aEscr !== null && aOral !== null && aEscr < 4 && aOral >= 5) {
            hypo += `<div class="analysis-item warning"><span class="tag tag-warning">Considerar</span><b>Dificuldade Específica de Leitura e Escrita</b></div>`;
            analise.hipoteses.push('DELE');
        }
        
        if (!hypo) {
            hypo = '<div class="analysis-item success"><span class="tag tag-success">OK</span>Sem indicadores de perturbação linguística significativa</div>';
        }
        
        const hypothesesEl = document.getElementById('hypotheses');
        if (hypothesesEl) hypothesesEl.innerHTML = hypo;
        
        // === PRIORIDADES ===
        let intervention = '';
        const prioridades = [];
        
        const modOrdenados = medMod
            .map((m, i) => ({ idx: i, media: m, nome: MODULOS[i].nome }))
            .filter(m => m.media !== null && m.media < 5)
            .sort((a, b) => a.media - b.media);
        
        modOrdenados.forEach((mod, rank) => {
            const urgencia = mod.media < 3 ? 'tag-danger' : 'tag-warning';
            const label = mod.media < 3 ? 'Urgente' : 'Prioritário';
            intervention += `<div class="analysis-item"><span class="tag ${urgencia}">${label}</span><b>${mod.nome}</b> — Média: ${mod.media.toFixed(1)}</div>`;
            prioridades.push({ modulo: mod.nome, media: mod.media, rank: rank + 1 });
        });
        
        if (!intervention) {
            intervention = '<div class="analysis-item success"><span class="tag tag-success">OK</span>Sem prioridades de intervenção identificadas</div>';
        }
        
        const interventionEl = document.getElementById('intervention');
        if (interventionEl) interventionEl.innerHTML = intervention;
        
        analise.prioridades = prioridades;
        casoActual.analise = analise;
        
        gerarGraficosDimensao();
        
        return analise;
    } catch (e) {
        console.error('Erro ao gerar análise:', e);
        return null;
    }
}

// ============================================================================
// GRÁFICOS POR DIMENSÃO
// ============================================================================

function gerarGraficosDimensao() {
    try {
        const container = document.getElementById('dimension-charts');
        if (!container) return;
        
        let html = '';
        
        // Por Nível
        html += `<div class="dimension-chart"><h5>Por Nível</h5><div class="dimension-bars">`;
        NIVEIS.forEach((niv, ni) => {
            const vals = casoActual.competencias.filter((c, i) => c !== null && SEGMENTOS[i].nivel === ni);
            if (vals.length) {
                const media = vals.reduce((a, b) => a + b, 0) / vals.length;
                const cor = ni === 0 ? '#10B981' : '#F59E0B';
                html += `<div class="dimension-bar"><span class="dimension-bar-label">${niv.nome}</span><div class="dimension-bar-track"><div class="dimension-bar-fill" style="width:${media * 10}%;background:${cor}"></div></div><span class="dimension-bar-value">${media.toFixed(1)}</span></div>`;
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
                html += `<div class="dimension-bar"><span class="dimension-bar-label">${circ.nome}</span><div class="dimension-bar-track"><div class="dimension-bar-fill" style="width:${media * 10}%;background:${cor}"></div></div><span class="dimension-bar-value">${media.toFixed(1)}</span></div>`;
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
                html += `<div class="dimension-bar"><span class="dimension-bar-label">${mod.nome}</span><div class="dimension-bar-track"><div class="dimension-bar-fill" style="width:${media * 10}%;background:${cor}"></div></div><span class="dimension-bar-value">${media.toFixed(1)}</span></div>`;
            }
        });
        html += `</div></div>`;
        
        container.innerHTML = html;
    } catch (e) {
        console.error('Erro ao gerar gráficos de dimensão:', e);
    }
}

// ============================================================================
// PLANO TERAPÊUTICO (BASEADO EM REGRAS)
// ============================================================================

function gerarPlanoTerapeutico(analise) {
    try {
        if (!analise || analise.prioridades.length === 0) {
            const planPanel = document.getElementById('plan-panel');
            if (planPanel) planPanel.style.display = 'none';
            return;
        }
        
        let planPanel = document.getElementById('plan-panel');
        if (!planPanel) {
            planPanel = document.createElement('div');
            planPanel.id = 'plan-panel';
            planPanel.className = 'plan-panel';
            document.querySelector('.content')?.appendChild(planPanel);
        }
        
        planPanel.style.display = 'block';
        
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
                💡 Sugestões baseadas em regras clínicas. Active a IA para um plano mais detalhado.
            </div>
        `;
        
        if (sugestoes.areas.length > 0) {
            html += `<div class="plan-section"><h4>🎯 Áreas de Intervenção</h4><ul>${sugestoes.areas.map(a => `<li>${a}</li>`).join('')}</ul></div>`;
        }
        if (sugestoes.objectivosGerais.length > 0) {
            html += `<div class="plan-section"><h4>📋 Objectivos</h4><ul>${sugestoes.objectivosGerais.map(o => `<li>${o}</li>`).join('')}</ul></div>`;
        }
        if (sugestoes.estrategias.length > 0) {
            html += `<div class="plan-section"><h4>💡 Estratégias</h4><ul>${sugestoes.estrategias.map(e => `<li>${e}</li>`).join('')}</ul></div>`;
        }
        if (sugestoes.materiais.length > 0) {
            html += `<div class="plan-section"><h4>📦 Materiais</h4><ul>${sugestoes.materiais.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
        }
        
        html += `
            <div class="plan-actions">
                <button class="btn btn-primary" onclick="guardarPlano()">Guardar Plano</button>
                <button class="btn btn-secondary" onclick="exportarPlano()">Exportar</button>
            </div>
        `;
        
        planPanel.innerHTML = html;
        
        planoActual = criarPlanoTerapeutico(casoActual.id, analise);
        planoActual.objectivosGerais = sugestoes.objectivosGerais;
        planoActual.objectivosEspecificos = sugestoes.objectivosEspecificos;
        planoActual.areas = sugestoes.areas;
        planoActual.estrategias = sugestoes.estrategias;
        planoActual.materiais = sugestoes.materiais;
    } catch (e) {
        console.error('Erro ao gerar plano terapêutico:', e);
    }
}

function gerarSugestoesIntervencao(analise) {
    const sugestoes = {
        areas: [],
        objectivosGerais: [],
        objectivosEspecificos: [],
        estrategias: [],
        materiais: []
    };
    
    try {
        const modulosAfectados = analise.modulosAfectados || [];
        
        modulosAfectados.forEach(modNome => {
            const base = typeof BASE_INTERVENCAO !== 'undefined' ? BASE_INTERVENCAO[modNome] : null;
            if (base) {
                sugestoes.areas.push(...base.areas.slice(0, 2));
                sugestoes.objectivosGerais.push(...base.objectivos.slice(0, 2));
                sugestoes.estrategias.push(...base.estrategias.slice(0, 2));
                sugestoes.materiais.push(...base.materiais.slice(0, 2));
            }
        });
        
        analise.prioridades?.slice(0, 3).forEach(p => {
            sugestoes.objectivosEspecificos.push(
                `Melhorar competências no domínio ${p.modulo} (actual: ${p.media.toFixed(1)}/10)`
            );
        });
    } catch (e) {
        console.error('Erro ao gerar sugestões:', e);
    }
    
    return sugestoes;
}

function guardarPlano() {
    try {
        if (!planoActual) return;
        const planos = carregarPlanos();
        planos.push(planoActual);
        guardarPlanos(planos);
        mostrarToast('Plano guardado!', 'success');
    } catch (e) {
        console.error('Erro ao guardar plano:', e);
    }
}

function exportarPlano() {
    try {
        if (!planoActual) return;
        exportarJSON(planoActual, `plano_${casoActual.id}_${new Date().toISOString().split('T')[0]}.json`);
        mostrarToast('Plano exportado!', 'success');
    } catch (e) {
        console.error('Erro ao exportar plano:', e);
    }
}
