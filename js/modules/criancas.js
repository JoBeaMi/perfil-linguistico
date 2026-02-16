/* ==========================================================================
   PERLIM - Módulo Crianças
   Gestão de crianças: CRUD, selecção, cálculo de idade
   ========================================================================== */

// ============================================================================
// VARIÁVEIS DO MÓDULO
// ============================================================================

let criancaActual = null;

// ============================================================================
// CÁLCULO DE IDADE
// ============================================================================

function calcularIdade(dataNascimento, dataReferencia = null) {
    try {
        const dn = new Date(dataNascimento);
        const ref = dataReferencia ? new Date(dataReferencia) : new Date();
        
        let anos = ref.getFullYear() - dn.getFullYear();
        let meses = ref.getMonth() - dn.getMonth();
        
        if (ref.getDate() < dn.getDate()) meses--;
        if (meses < 0) { anos--; meses += 12; }
        
        return `${anos};${meses}`;
    } catch (e) {
        console.error('Erro ao calcular idade:', e);
        return '-';
    }
}

function calcularIdadeAnos(dataNascimento) {
    try {
        if (!dataNascimento) return null;
        const hoje = new Date();
        const nasc = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        return idade;
    } catch (e) {
        return null;
    }
}

// ============================================================================
// SELECCIONAR CRIANÇA
// ============================================================================

function seleccionarCrianca(crianca) {
    try {
        criancaActual = crianca;
        
        document.getElementById('caso-nome').value = crianca.nome || '';
        if (crianca.data_nascimento) {
            document.getElementById('caso-idade').value = calcularIdade(crianca.data_nascimento);
        }
        
        mostrarIndicadorCrianca(crianca);
        
        fecharModal('modal-seleccionar-crianca');
        mostrarToast(`Criança seleccionada: ${crianca.nome}`, 'success');
    } catch (e) {
        console.error('Erro ao seleccionar criança:', e);
    }
}

function mostrarIndicadorCrianca(crianca) {
    try {
        document.getElementById('crianca-indicador')?.remove();
        
        const indicador = document.createElement('div');
        indicador.id = 'crianca-indicador';
        indicador.className = 'crianca-indicador';
        
        const idade = crianca.data_nascimento ? calcularIdade(crianca.data_nascimento) : '-';
        indicador.innerHTML = `
            <div class="crianca-seleccionada-info">
                <span class="codigo">${crianca.codigo}</span>
                <span class="nome">${crianca.nome}</span>
                <span class="idade">(${idade})</span>
            </div>
            <button class="btn btn-secondary btn-mudar-crianca" onclick="abrirSeleccionarCrianca()">Mudar</button>
        `;
        
        const cardIdent = document.getElementById('card-identificacao');
        cardIdent?.parentNode?.insertBefore(indicador, cardIdent);
    } catch (e) {
        console.error('Erro ao mostrar indicador:', e);
    }
}

function actualizarIdadeAvaliacao() {
    try {
        if (criancaActual?.data_nascimento) {
            const dataAval = document.getElementById('caso-data')?.value;
            if (dataAval) {
                document.getElementById('caso-idade').value = calcularIdade(criancaActual.data_nascimento, dataAval);
            }
        }
    } catch (e) {
        console.error('Erro ao actualizar idade:', e);
    }
}

// ============================================================================
// CRUD DE CRIANÇAS
// ============================================================================

function abrirSeleccionarCrianca() {
    try {
        abrirModal('modal-seleccionar-crianca');
        carregarListaCriancas();
    } catch (e) {
        console.error('Erro ao abrir selecção:', e);
    }
}

function abrirNovaCrianca() {
    try {
        abrirModal('modal-nova-crianca');
    } catch (e) {
        console.error('Erro ao abrir nova criança:', e);
    }
}

async function guardarCrianca() {
    try {
        const dados = {
            nome: document.getElementById('crianca-nome')?.value,
            codigo: document.getElementById('crianca-codigo')?.value,
            data_nascimento: document.getElementById('crianca-data-nasc')?.value,
            genero: document.getElementById('crianca-genero')?.value,
            diagnostico: document.getElementById('crianca-diagnostico')?.value,
            notas: document.getElementById('crianca-notas')?.value
        };
        
        if (!dados.nome) {
            mostrarToast('Nome é obrigatório', 'warning');
            return;
        }
        
        const crianca = await API.criarCrianca(dados);
        fecharModal('modal-nova-crianca');
        seleccionarCrianca(crianca);
        mostrarToast('Criança criada!', 'success');
    } catch (e) {
        console.error('Erro ao guardar criança:', e);
        mostrarToast('Erro ao guardar: ' + e.message, 'error');
    }
}

async function carregarListaCriancas() {
    try {
        const container = document.getElementById('lista-criancas');
        if (!container) return;
        
        container.innerHTML = '<p>A carregar...</p>';
        
        const criancas = await API.listarCriancas();
        
        if (criancas.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhuma criança registada</p>';
            return;
        }
        
        container.innerHTML = criancas.map(c => {
            const idade = c.data_nascimento ? calcularIdadeAnos(c.data_nascimento) : null;
            return `
                <div class="crianca-item" onclick="seleccionarCrianca(${JSON.stringify(c).replace(/"/g, '&quot;')})">
                    <div class="crianca-avatar">${(c.nome || '?')[0].toUpperCase()}</div>
                    <div class="crianca-info">
                        <strong>${c.codigo || ''} — ${c.nome}</strong>
                        <small>${idade ? idade + ' anos' : ''}</small>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Erro ao carregar lista:', e);
    }
}

function filtrarCriancas() {
    try {
        const termo = document.getElementById('crianca-search')?.value.toLowerCase();
        document.querySelectorAll('.crianca-item').forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(termo) ? '' : 'none';
        });
    } catch (e) {
        console.error('Erro ao filtrar crianças:', e);
    }
}

// ============================================================================
// TOGGLE HELPERS
// ============================================================================

function toggleSection(header) {
    try {
        const fieldset = header.closest('fieldset');
        fieldset?.classList.toggle('collapsed');
    } catch (e) {
        console.error('Erro ao toggle section:', e);
    }
}

function toggleSubfield(checkbox, subfieldId) {
    try {
        const subfield = document.getElementById(subfieldId);
        if (subfield) {
            subfield.disabled = !checkbox.checked;
            if (!checkbox.checked) subfield.value = '';
        }
    } catch (e) {
        console.error('Erro ao toggle subfield:', e);
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

function inicializarCriancas() {
    try {
        document.getElementById('btn-nova-crianca')?.addEventListener('click', abrirNovaCrianca);
        document.getElementById('btn-guardar-crianca')?.addEventListener('click', guardarCrianca);
        document.getElementById('crianca-search')?.addEventListener('input', filtrarCriancas);
        
        const btnLoadCase = document.getElementById('btn-load-case');
        if (btnLoadCase) {
            btnLoadCase.addEventListener('click', abrirSeleccionarCrianca);
        }
        
        document.getElementById('caso-data')?.addEventListener('change', actualizarIdadeAvaliacao);
        
        console.log('✅ Módulo Crianças inicializado');
    } catch (e) {
        console.error('❌ Erro ao inicializar módulo Crianças:', e);
    }
}

// Expor globalmente
window.toggleSection = toggleSection;
window.toggleSubfield = toggleSubfield;
window.seleccionarCrianca = seleccionarCrianca;
window.abrirSeleccionarCrianca = abrirSeleccionarCrianca;
