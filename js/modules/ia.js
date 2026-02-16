/* ==========================================================================
   PERLIM - Módulo IA
   Integração com IA para planos terapêuticos
   ========================================================================== */

// ============================================================================
// GERAR PLANO COM IA
// ============================================================================

async function gerarPlanoComIA() {
    try {
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
        const contexto = document.getElementById('ia-contexto')?.value;
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (resultEl) resultEl.style.display = 'none';
        if (btnGerar) btnGerar.disabled = true;
        
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
            
            if (resultEl) {
                resultEl.innerHTML = `
                    <h4>📋 Resumo</h4><p>${plano.resumo || ''}</p>
                    <h4>🎯 Objectivo Geral</h4><p>${plano.objectivo_geral || ''}</p>
                    <h4>✅ Objectivos Específicos</h4><ul>${(plano.objectivos_especificos || []).map(o => `<li>${o}</li>`).join('')}</ul>
                    <h4>⚡ Áreas Prioritárias</h4><ul>${(plano.areas_prioritarias || []).map(a => `<li>${a}</li>`).join('')}</ul>
                    <h4>💡 Estratégias</h4><ul>${(plano.estrategias || []).map(e => `<li>${e}</li>`).join('')}</ul>
                    <h4>🎮 Actividades Sugeridas</h4><ul>${(plano.actividades_sugeridas || []).map(a => `<li>${a}</li>`).join('')}</ul>
                    <h4>📦 Materiais Recomendados</h4><ul>${(plano.materiais_recomendados || []).map(m => `<li>${m}</li>`).join('')}</ul>
                    <h4>📅 Frequência e Duração</h4>
                    <p><strong>Frequência:</strong> ${plano.frequencia_sugerida || '-'}</p>
                    <p><strong>Duração estimada:</strong> ${plano.duracao_estimada || '-'}</p>
                    <h4>📈 Indicadores de Progresso</h4><ul>${(plano.indicadores_progresso || []).map(i => `<li>${i}</li>`).join('')}</ul>
                    <h4>👨‍👩‍👧 Recomendações para a Família</h4><ul>${(plano.recomendacoes_familia || []).map(r => `<li>${r}</li>`).join('')}</ul>
                    <p class="text-muted" style="margin-top:1rem;font-size:0.75rem"><em>Gerado por IA (${response.modelo}). Deve ser validado por um profissional.</em></p>
                `;
                resultEl.style.display = 'block';
            }
            
            casoActual.planoTerapeutico = plano;
            mostrarToast('Plano gerado com sucesso!', 'success');
        }
    } catch (err) {
        mostrarToast('Erro ao gerar plano: ' + err.message, 'error');
    } finally {
        const loadingEl = document.getElementById('ia-loading');
        const btnGerar = document.getElementById('btn-gerar-plano-ia');
        if (loadingEl) loadingEl.style.display = 'none';
        if (btnGerar) btnGerar.disabled = false;
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

function inicializarIA() {
    try {
        document.getElementById('btn-abrir-ia')?.addEventListener('click', () => {
            if (!casoActual.competencias?.some(c => c > 0)) {
                mostrarToast('Gere primeiro o perfil', 'warning');
                return;
            }
            const resultEl = document.getElementById('ia-result');
            const loadingEl = document.getElementById('ia-loading');
            if (resultEl) resultEl.style.display = 'none';
            if (loadingEl) loadingEl.style.display = 'none';
            abrirModal('modal-ia');
        });
        
        document.getElementById('btn-gerar-plano-ia')?.addEventListener('click', gerarPlanoComIA);
        
        console.log('✅ Módulo IA inicializado');
    } catch (e) {
        console.error('❌ Erro ao inicializar módulo IA:', e);
    }
}
