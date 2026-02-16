/* ==========================================================================
   PERLIM - Módulo Provas
   Gestão de provas aplicadas e provas custom
   ========================================================================== */

// ============================================================================
// VARIÁVEIS DO MÓDULO
// ============================================================================

let PROVAS_CUSTOM = [];

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

function inicializarProvas() {
    try {
        actualizarSelectProvas();
        
        document.getElementById('prova-sel')?.addEventListener('change', (e) => {
            const opt = e.target.selectedOptions[0];
            if (opt?.dataset.escala) {
                const escEl = document.getElementById('prova-esc');
                if (escEl) escEl.value = opt.dataset.escala;
            }
            actualizarSelectTarefas();
        });
    } catch (e) {
        console.error('Erro ao inicializar provas:', e);
    }
}

function getProvas() {
    return [...(typeof PROVAS_SISTEMA !== 'undefined' ? PROVAS_SISTEMA : []), ...PROVAS_CUSTOM];
}

function guardarProvasCustomLocal() {
    try {
        guardarProvasCustom(PROVAS_CUSTOM);
    } catch (e) {
        console.error('Erro ao guardar provas custom:', e);
    }
}

function actualizarSelectProvas() {
    try {
        const select = document.getElementById('prova-sel');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecionar prova...</option>';
        
        const provas = getProvas();
        const dominios = [...new Set(provas.map(p => p.dominio))];
        
        dominios.forEach(dom => {
            const group = document.createElement('optgroup');
            group.label = dom;
            provas.filter(p => p.dominio === dom).forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.nome;
                opt.dataset.escala = p.escala;
                opt.dataset.segs = (p.segs || []).join(',');
                if (p.custom) opt.textContent += ' 🔧';
                group.appendChild(opt);
            });
            select.appendChild(group);
        });
    } catch (e) {
        console.error('Erro ao actualizar select de provas:', e);
    }
}

function actualizarSelectTarefas() {
    try {
        const provaId = document.getElementById('prova-sel')?.value;
        if (!provaId) return;
        
        const prova = getProvas().find(p => p.id === provaId);
        const tarefaSelect = document.getElementById('prova-tarefa');
        if (!tarefaSelect || !prova?.tarefas) return;
        
        tarefaSelect.innerHTML = '<option value="">Geral</option>';
        prova.tarefas.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.nome;
            tarefaSelect.appendChild(opt);
        });
    } catch (e) {
        console.error('Erro ao actualizar tarefas:', e);
    }
}

// ============================================================================
// ADICIONAR PROVA
// ============================================================================

function adicionarProva() {
    try {
        const select = document.getElementById('prova-sel');
        const escala = document.getElementById('prova-esc')?.value;
        const valor = parseFloat(document.getElementById('prova-val')?.value);
        
        if (!select?.value || isNaN(valor)) {
            mostrarToast('Selecione uma prova e insira um valor', 'warning');
            return;
        }
        
        const option = select.selectedOptions[0];
        const segs = option.dataset.segs.split(',').map(Number);
        const comp = converterParaCompetencia(valor, escala);
        
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
                
                radarChart?.setValor(segIdx, comp);
            }
        });
        
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
        item.querySelector('.prova-item-remove').addEventListener('click', () => removerProvaAplicada(parseInt(item.dataset.idx)));
        lista?.appendChild(item);
        
        casoActual.provasAplicadas.push({
            prova: select.value,
            nome: option.text,
            valor, escala,
            competencia: comp,
            segmentos: segs,
            data: new Date().toISOString()
        });
        
        const valInput = document.getElementById('prova-val');
        if (valInput) valInput.value = '';
        const convEl = document.getElementById('conversion-value');
        if (convEl) {
            convEl.textContent = '—';
            convEl.className = 'conversion-value';
        }
        
        mostrarToast(`${option.text}: ${comp}/10`, 'success');
    } catch (e) {
        console.error('Erro ao adicionar prova:', e);
        mostrarToast('Erro ao adicionar prova', 'error');
    }
}

// ============================================================================
// REMOVER PROVA
// ============================================================================

function removerProvaAplicada(idx) {
    try {
        if (idx < 0 || idx >= casoActual.provasAplicadas.length) return;
        
        const prova = casoActual.provasAplicadas[idx];
        casoActual.provasAplicadas.splice(idx, 1);
        
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
            radarChart?.setValor(segIdx, casoActual.competencias[segIdx]);
        });
        
        radarChart?.desenhar();
        
        const lista = document.getElementById('prova-list');
        const items = lista?.querySelectorAll('.prova-item');
        if (items?.[idx]) items[idx].remove();
        
        mostrarToast('Prova removida', 'info');
    } catch (e) {
        console.error('Erro ao remover prova:', e);
    }
}

// ============================================================================
// EDIÇÃO DE PROVAS APLICADAS
// ============================================================================

function abrirEdicaoProva(idx) {
    try {
        const prova = casoActual.provasAplicadas[idx];
        if (!prova) return;
        
        document.getElementById('edit-prova-idx').value = idx;
        document.getElementById('edit-prova-nome').textContent = prova.nome;
        document.getElementById('edit-prova-valor').value = prova.valor;
        document.getElementById('edit-prova-escala').value = prova.escala;
        calcularCompetenciaEdicao();
        abrirModal('modal-editar-prova');
    } catch (e) {
        console.error('Erro ao abrir edição:', e);
    }
}

function calcularCompetenciaEdicao() {
    try {
        const valor = parseFloat(document.getElementById('edit-prova-valor')?.value);
        const escala = document.getElementById('edit-prova-escala')?.value;
        const preview = document.getElementById('edit-prova-preview');
        
        if (!isNaN(valor) && escala && preview) {
            const comp = converterParaCompetencia(valor, escala);
            preview.textContent = `${comp}/10`;
            preview.className = `zone-${obterZona(comp)}`;
        }
    } catch (e) {
        console.error('Erro ao calcular edição:', e);
    }
}

function salvarEdicaoProva() {
    try {
        const idx = parseInt(document.getElementById('edit-prova-idx')?.value);
        const valor = parseFloat(document.getElementById('edit-prova-valor')?.value);
        const escala = document.getElementById('edit-prova-escala')?.value;
        
        if (isNaN(idx) || isNaN(valor)) return;
        
        const prova = casoActual.provasAplicadas[idx];
        if (!prova) return;
        
        const comp = converterParaCompetencia(valor, escala);
        prova.valor = valor;
        prova.escala = escala;
        prova.competencia = comp;
        
        prova.segmentos.forEach(segIdx => {
            casoActual.competencias[segIdx] = comp;
            radarChart?.setValor(segIdx, comp);
        });
        
        radarChart?.desenhar();
        fecharModal('modal-editar-prova');
        mostrarToast('Prova actualizada', 'success');
    } catch (e) {
        console.error('Erro ao salvar edição:', e);
    }
}

// ============================================================================
// PROVAS CUSTOM
// ============================================================================

function abrirEdicaoProvaCustom(provaId) {
    try {
        const prova = getProvas().find(p => p.id === provaId);
        if (!prova || !prova.custom) return;
        
        document.getElementById('edit-custom-id').value = prova.id;
        document.getElementById('edit-custom-nome').value = prova.nome;
        document.getElementById('edit-custom-escala').value = prova.escala;
        document.getElementById('edit-custom-do
