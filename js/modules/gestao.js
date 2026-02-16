/* ==========================================================================
   PERLIM - Módulo Gestão (Dashboard)
   Painel de gestão unificado: crianças, avaliações, evolução
   ========================================================================== */

// ============================================================================
// VARIÁVEIS DO MÓDULO
// ============================================================================

let dadosGestao = {
    criancas: [],
    avaliacoes: [],
    criancasFiltradas: [],
    avaliacoesFiltradas: []
};

// ============================================================================
// ABRIR PAINEL
// ============================================================================

function abrirPainelGestao() {
    try {
        if (!API.isAuthenticated()) {
            abrirModal('modal-auth');
            return;
        }
        carregarDadosGestao();
        abrirModal('modal-gestao');
    } catch (e) {
        console.error('Erro ao abrir painel de gestão:', e);
    }
}

// ============================================================================
// CARREGAR DADOS
// ============================================================================

async function carregarDadosGestao() {
    try {
        const criancasResponse = await API.listarCriancas();
        dadosGestao.criancas = criancasResponse || [];
        
        const casosResponse = await API.listarCasos();
        dadosGestao.avaliacoes = casosResponse || [];
        
        dadosGestao.criancasFiltradas = [];
        dadosGestao.avaliacoesFiltradas = [];
        
        actualizarListaCriancasGestao();
        actualizarListaAvaliacoes();
        actualizarSelectEvolucao();
        actualizarSelectFiltroCrianca();
        renderizarDashboard();
    } catch (e) {
        console.error('Erro ao carregar dados de gestão:', e);
        mostrarToast('Erro ao carregar dados', 'error');
    }
}

// ============================================================================
// TABS
// ============================================================================

function mudarTabGestao(tabId) {
    try {
        document.querySelectorAll('.gestao-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.gestao-panel').forEach(p => p.style.display = 'none');
        
        document.querySelector(`.gestao-tab[data-gestao-tab="${tabId}"]`)?.classList.add('active');
        const panel = document.getElementById(`panel-${tabId}`);
        if (panel) panel.style.display = 'block';
    } catch (e) {
        console.error('Erro ao mudar tab:', e);
    }
}

// ============================================================================
// DASHBOARD
// ============================================================================

function renderizarDashboard() {
    try {
        renderizarAvaliacoesRecentes(dadosGestao.avaliacoes.slice(0, 5));
        renderizarGraficoDominios();
    } catch (e) {
        console.error('Erro ao renderizar dashboard:', e);
    }
}

function renderizarGraficoDominios() {
    try {
        const container = document.getElementById('grafico-dominios');
        if (!container) return;
        
        const dominios = ['Fono', 'Morf', 'Sint', 'Sem', 'Prag'];
        const cores = ['#E05252', '#E8A54C', '#00A79D', '#5B8BC4', '#7CB454'];
        const medias = [0, 0, 0, 0, 0];
        const counts = [0, 0, 0, 0, 0];
        
        dadosGestao.avaliacoes.forEach(a => {
            if (!a.competencias) return;
            for (let d = 0; d < 5; d++) {
                const segs = a.competencias.slice(d * 8, (d + 1) * 8);
                const vals = segs.filter(v => v !== null && !isNaN(v));
                if (vals.length) {
                    medias[d] += vals.reduce((a, b) => a + b, 0) / vals.length;
                    counts[d]++;
                }
            }
        });
        
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
    } catch (e) {
        console.error('Erro ao renderizar gráfico:', e);
    }
}

function renderizarAvaliacoesRecentes(avaliacoes) {
    try {
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
    } catch (e) {
        console.error('Erro ao renderizar avaliações recentes:', e);
    }
}

function renderizarMiniRadar(competencias) {
    try {
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
    } catch (e) {
        return '';
    }
}

// ============================================================================
// LISTA DE CRIANÇAS
// ============================================================================

function actualizarListaCriancasGestao() {
    try {
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
                        <strong>${c.codigo || ''} — ${c.nome}</strong>
                        <small>${idade ? idade + ' anos' : ''} · ${numAvaliacoes} avaliação(ões)</small>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Erro ao actualizar lista de crianças:', e);
    }
}

function filtrarCriancasGestao() {
    try {
        const termo = document.getElementById('pesquisa-criancas')?.value.toLowerCase();
        if (!termo) {
            dadosGestao.criancasFiltradas = [];
        } else {
            dadosGestao.criancasFiltradas = dadosGestao.criancas.filter(c =>
                (c.nome || '').toLowerCase().includes(termo) ||
                (c.codigo || '').toLowerCase().includes(termo)
            );
        }
        actualizarListaCriancasGestao();
    } catch (e) {
        console.error('Erro ao filtrar crianças:', e);
    }
}

async function seleccionarCriancaGestao(id) {
    try {
        const crianca = dadosGestao.criancas.find(c => c.id === id);
        if (crianca) {
            seleccionarCrianca(crianca);
            fecharModal('modal-gestao');
        }
    } catch (e) {
        console.error('Erro ao seleccionar criança:', e);
    }
}

// ============================================================================
// LISTA DE AVALIAÇÕES
// ============================================================================

function actualizarListaAvaliacoes() {
    try {
        const container = document.getElementById('gestao-avaliacoes-lista');
        if (!container) return;
        
        const avaliacoes = dadosGestao.avaliacoesFiltradas.length > 0 ?
            dadosGestao.avaliacoesFiltradas : dadosGestao.avaliacoes;
        
        if (avaliacoes.length === 0) {
            container.innerHTML = '<div class="evolucao-placeholder"><p>Nenhuma avaliação registada</p></div>';
            return;
        }
        
        container.innerHTML = avaliacoes.map(a => {
            const media = calcularMediaAvaliacao(a.competencias);
            const zona = media !== null ? obterZona(media) : 'green';
            
            return `
                <div class="gestao-item">
                    <input type="checkbox" class="gestao-item-check" value="${a.id}" onchange="actualizarBotoesSeleccao()">
                    <div class="gestao-item-avatar">${(a.nome || a.codigo || '?')[0].toUpperCase()}</div>
                    <div class="gestao-item-info" onclick="carregarAvaliacaoGestao(${a.id})">
                        <strong>${a.codigo || 'Sem código'} — ${a.nome || ''}</strong>
                        <small>${a.data_avaliacao ? new Date(a.data_avaliacao).toLocaleDateString('pt-PT') : '-'} · ${a.avaliador || '-'}</small>
                    </div>
                    <div class="gestao-item-actions">
                        <span class="tag tag-${zona === 'red' ? 'danger' : zona === 'yellow' ? 'warning' : 'success'}">${media !== null ? media.toFixed(1) : '-'}</span>
                        <button class="btn-mini" onclick="exportarAvaliacaoWord(${a.id})" title="Word">📄</button>
                        <button class="btn-mini" onclick="eliminarAvaliacaoGestao(${a.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Erro ao actualizar lista de avaliações:', e);
    }
}

function filtrarAvaliacoesGestao() {
    try {
        const termo = document.getElementById('pesquisa-avaliacoes')?.value.toLowerCase();
        const criancaId = document.getElementById('filtro-crianca')?.value;
        const dataDe = document.getElementById('filtro-data-de')?.value;
        const dataAte = document.getElementById('filtro-data-ate')?.value;
        
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
    } catch (e) {
        console.error('Erro ao filtrar avaliações:', e);
    }
}

function calcularMediaAvaliacao(competencias) {
    try {
        if (!competencias || competencias.length === 0) return null;
        const vals = competencias.filter(v => v !== null && !isNaN(v));
        if (vals.length === 0) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
    } catch (e) {
        return null;
    }
}

function actualizarBotoesSeleccao() {
    try {
        const seleccionados = document.querySelectorAll('.gestao-item-check:checked').length;
        const btnComparar = document.getElementById('btn-comparar-seleccionados');
        const btnExportar = document.getElementById('btn-exportar-seleccionados');
        if (btnComparar) btnComparar.disabled = seleccionados < 2;
        if (btnExportar) btnExportar.disabled = seleccionados === 0;
    } catch (e) {
        console.error('Erro ao actualizar botões:', e);
    }
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
                radarChart?.setValor(i, comp);
            });
            radarChart?.desenhar();
            fecharModal('modal-gestao');
            mostrarToast('Avaliação carregada!', 'success');
        }
    } catch (e) {
        console.error('Erro ao carregar avaliação:', e);
        mostrarToast('Erro ao carregar avaliação', 'error');
    }
}

async function eliminarAvaliacaoGestao(id) {
    try {
        if (!confirm('Eliminar esta avaliação?')) return;
        await API.eliminarCaso(id);
        await carregarDadosGestao();
        mostrarToast('Avaliação eliminada', 'info');
    } catch (e) {
        console.error('Erro ao eliminar avaliação:', e);
    }
}

function novaAvaliacaoCrianca(criancaId) {
    try {
        const crianca = dadosGestao.criancas.find(c => c.id === criancaId);
        if (crianca) {
            seleccionarCrianca(crianca);
            limparFormulario();
            fecharModal('modal-gestao');
        }
    } catch (e) {
        console.error('Erro ao criar nova avaliação:', e);
    }
}

// ============================================================================
// EVOLUÇÃO
// ============================================================================

function actualizarSelectEvolucao() {
    try {
        const select = document.getElementById('evolucao-crianca');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar criança...</option>';
        dadosGestao.criancas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.codigo || ''} — ${c.nome}`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Erro ao actualizar select evolução:', e);
    }
}

function actualizarSelectFiltroCrianca() {
    try {
        const select = document.getElementById('filtro-crianca');
        if (!select) return;
        
        select.innerHTML = '<option value="">Todas as crianças</option>';
        dadosGestao.criancas.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.codigo || ''} — ${c.nome}`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Erro ao actualizar filtro:', e);
    }
}

async function carregarEvolucaoCrianca() {
    try {
        const criancaId = document.getElementById('evolucao-crianca')?.value;
        const container = document.getElementById('evolucao-content');
        if (!container || !criancaId) return;
        
        container.innerHTML = '<p>A carregar...</p>';
        
        const avaliacoes = await API.obterAvaliacoesCrianca(criancaId);
        
        if (avaliacoes.length === 0) {
            container.innerHTML = '<div class="evolucao-placeholder"><p>Sem avaliações para esta criança</p></div>';
            return;
        }
        
        const nomes = ['Fonológico', 'Morfológico', 'Sintático', 'Semântico', 'Pragmático'];
        
        let html = '<div class="evolucao-grafico"><table class="evolucao-table"><thead><tr><th>Data</th>';
        nomes.forEach(n => html += `<th>${n}</th>`);
        html += '<th>Global</th></tr></thead><tbody>';
        
        avaliacoes.forEach(a => {
            html += `<tr><td>${a.data_avaliacao ? new Date(a.data_avaliacao).toLocaleDateString('pt-PT') : '-'}</td>`;
            let total = 0, count = 0;
            for (let d = 0; d < 5; d++) {
                const segs = (a.competencias || []).slice(d * 8, (d + 1) * 8);
                const vals = segs.filter(v => v !== null && !isNaN(v));
                if (vals.length) {
                    const media = vals.reduce((s, v) => s + v, 0) / vals.length;
                    total += media; count++;
                    const zona = obterZona(media);
                    html += `<td class="zone-${zona}">${media.toFixed(1)}</td>`;
                } else {
                    html += '<td>-</td>';
                }
            }
            const global = count > 0 ? (total / count) : null;
            html += `<td><strong>${global !== null ? global.toFixed(1) : '-'}</strong></td></tr>`;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (e) {
        console.error('Erro ao carregar evolução:', e);
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

function inicializarGestao() {
    try {
        document.getElementById('btn-gestao')?.addEventListener('click', abrirPainelGestao);
        
        document.querySelectorAll('.gestao-tab').forEach(tab => {
            tab.addEventListener('click', () => mudarTabGestao(tab.dataset.gestaoTab));
        });
        
        document.getElementById('pesquisa-criancas')?.addEventListener('input', filtrarCriancasGestao);
        document.getElementById('pesquisa-avaliacoes')?.addEventListener('input', filtrarAvaliacoesGestao);
        document.getElementById('filtro-crianca')?.addEventListener('change', filtrarAvaliacoesGestao);
        document.getElementById('evolucao-crianca')?.addEventListener('change', carregarEvolucaoCrianca);
        
        document.getElementById('seleccionar-todas-avaliacoes')?.addEventListener('change', (e) => {
            document.querySelectorAll('.gestao-item-check').forEach(cb => {
                cb.checked = e.target.checked;
            });
            actualizarBotoesSeleccao();
        });
        
        console.log('✅ Módulo Gestão inicializado');
    } catch (e) {
        console.error('❌ Erro ao inicializar módulo Gestão:', e);
    }
}

// Expor globalmente
window.abrirPainelGestao = abrirPainelGestao;
window.seleccionarCriancaGestao = seleccionarCriancaGestao;
window.novaAvaliacaoCrianca = novaAvaliacaoCrianca;
window.carregarAvaliacaoGestao = carregarAvaliacaoGestao;
window.eliminarAvaliacaoGestao = eliminarAvaliacaoGestao;
window.actualizarBotoesSeleccao = actualizarBotoesSeleccao;
window.exportarAvaliacaoWord = async (id) => {
    try {
        const avaliacao = dadosGestao.avaliacoes.find(a => a.id === id);
        if (avaliacao) {
            casoActual = avaliacao;
            await gerarRelatorioWord();
        }
    } catch (e) {
        console.error('Erro ao exportar Word:', e);
    }
};
