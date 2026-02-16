/* ==========================================================================
   PERLIM - Modulo Provas
   Gestao de provas aplicadas e provas custom
   ========================================================================== */

var PROVAS_CUSTOM = [];

function inicializarProvas() {
    try {
        actualizarSelectProvas();
        var sel = document.getElementById('prova-sel');
        if (sel) {
            sel.addEventListener('change', function(e) {
                var opt = e.target.selectedOptions[0];
                if (opt && opt.dataset.escala) {
                    var escEl = document.getElementById('prova-esc');
                    if (escEl) escEl.value = opt.dataset.escala;
                }
                actualizarSelectTarefas();
            });
        }
    } catch (e) {
        console.error('Erro ao inicializar provas:', e);
    }
}

function getProvas() {
    var sistema = (typeof PROVAS_SISTEMA !== 'undefined') ? PROVAS_SISTEMA : [];
    return sistema.concat(PROVAS_CUSTOM);
}

function guardarProvasCustomLocal() {
    try { guardarProvasCustom(PROVAS_CUSTOM); } catch (e) { console.error('Erro:', e); }
}

function actualizarSelectProvas() {
    try {
        var select = document.getElementById('prova-sel');
        if (!select) return;
        select.innerHTML = '<option value="">Selecionar prova...</option>';
        var provas = getProvas();
        var dominios = [];
        provas.forEach(function(p) {
            if (dominios.indexOf(p.dominio) === -1) dominios.push(p.dominio);
        });
        dominios.forEach(function(dom) {
            var group = document.createElement('optgroup');
            group.label = dom;
            provas.filter(function(p) { return p.dominio === dom; }).forEach(function(p) {
                var opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.nome + (p.custom ? ' (custom)' : '');
                opt.dataset.escala = p.escala;
                opt.dataset.segs = (p.segs || []).join(',');
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
        var sel = document.getElementById('prova-sel');
        var provaId = sel ? sel.value : null;
        if (!provaId) return;
        var prova = getProvas().find(function(p) { return p.id === provaId; });
        var tarefaSelect = document.getElementById('prova-tarefa');
        if (!tarefaSelect || !prova || !prova.tarefas) return;
        tarefaSelect.innerHTML = '<option value="">Geral</option>';
        prova.tarefas.forEach(function(t) {
            var opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.nome;
            tarefaSelect.appendChild(opt);
        });
    } catch (e) {
        console.error('Erro ao actualizar tarefas:', e);
    }
}

function adicionarProva() {
    try {
        var select = document.getElementById('prova-sel');
        var escalaEl = document.getElementById('prova-esc');
        var valorEl = document.getElementById('prova-val');
        var escala = escalaEl ? escalaEl.value : '';
        var valor = valorEl ? parseFloat(valorEl.value) : NaN;
        if (!select || !select.value || isNaN(valor)) {
            mostrarToast('Selecione uma prova e insira um valor', 'warning');
            return;
        }
        var option = select.selectedOptions[0];
        var segs = option.dataset.segs.split(',').map(Number);
        var comp = converterParaCompetencia(valor, escala);
        segs.forEach(function(segIdx) {
            if (segIdx < 40) {
                casoActual.competencias[segIdx] = comp;
                var input = document.getElementById('v-' + segIdx);
                if (input) { input.value = comp; actualizarZonaInput(input, comp); }
                var slider = document.querySelector('.comp-slider[data-idx="' + segIdx + '"]');
                if (slider) slider.value = comp;
                if (radarChart) radarChart.setValor(segIdx, comp);
            }
        });
        var lista = document.getElementById('prova-list');
        var idx = casoActual.provasAplicadas.length;
        var item = document.createElement('div');
        item.className = 'prova-item';
        item.dataset.idx = idx;
        item.innerHTML = '<span><b>' + option.text + '</b>: ' + valor + ' (' + escala + ') &rarr; <b>' + comp + '/10</b></span><div class="prova-item-actions"><button class="prova-item-edit" title="Editar">&#9998;</button><button class="prova-item-remove" title="Remover">&times;</button></div>';
        item.querySelector('.prova-item-edit').addEventListener('click', function() { abrirEdicaoProva(parseInt(item.dataset.idx)); });
        item.querySelector('.prova-item-remove').addEventListener('click', function() { removerProvaAplicada(parseInt(item.dataset.idx)); });
        if (lista) lista.appendChild(item);
        casoActual.provasAplicadas.push({ prova: select.value, nome: option.text, valor: valor, escala: escala, competencia: comp, segmentos: segs, data: new Date().toISOString() });
        if (valorEl) valorEl.value = '';
        var convEl = document.getElementById('conversion-value');
        if (convEl) { convEl.textContent = '\u2014'; convEl.className = 'conversion-value'; }
        mostrarToast(option.text + ': ' + comp + '/10', 'success');
    } catch (e) {
        console.error('Erro ao adicionar prova:', e);
        mostrarToast('Erro ao adicionar prova', 'error');
    }
}

function removerProvaAplicada(idx) {
    try {
        if (idx < 0 || idx >= casoActual.provasAplicadas.length) return;
        var prova = casoActual.provasAplicadas[idx];
        casoActual.provasAplicadas.splice(idx, 1);
        prova.segmentos.forEach(function(segIdx) {
            var valores = casoActual.provasAplicadas.filter(function(p) { return p.segmentos.includes(segIdx); }).map(function(p) { return p.competencia; });
            if (valores.length > 0) {
                var media = valores.reduce(function(a, b) { return a + b; }, 0) / valores.length;
                casoActual.competencias[segIdx] = Math.round(media * 10) / 10;
            } else {
                casoActual.competencias[segIdx] = 0;
            }
            if (radarChart) radarChart.setValor(segIdx, casoActual.competencias[segIdx]);
        });
        if (radarChart) radarChart.desenhar();
        var lista = document.getElementById('prova-list');
        var items = lista ? lista.querySelectorAll('.prova-item') : [];
        if (items[idx]) items[idx].remove();
        mostrarToast('Prova removida', 'info');
    } catch (e) {
        console.error('Erro ao remover prova:', e);
    }
}

function abrirEdicaoProva(idx) {
    try {
        var prova = casoActual.provasAplicadas[idx];
        if (!prova) return;
        document.getElementById('edit-prova-idx').value = idx;
        document.getElementById('edit-prova-nome').textContent = prova.nome;
        document.getElementById('edit-prova-valor').value = prova.valor;
        document.getElementById('edit-prova-escala').value = prova.escala;
        calcularCompetenciaEdicao();
        abrirModal('modal-editar-prova');
    } catch (e) {
        console.error('Erro ao abrir edicao:', e);
    }
}

function calcularCompetenciaEdicao() {
    try {
        var valorEl = document.getElementById('edit-prova-valor');
        var escalaEl = document.getElementById('edit-prova-escala');
        var preview = document.getElementById('edit-prova-preview');
        var valor = valorEl ? parseFloat(valorEl.value) : NaN;
        var escala = escalaEl ? escalaEl.value : '';
        if (!isNaN(valor) && escala && preview) {
            var comp = converterParaCompetencia(valor, escala);
            preview.textContent = comp + '/10';
            preview.className = 'zone-' + obterZona(comp);
        }
    } catch (e) {
        console.error('Erro ao calcular edicao:', e);
    }
}

function salvarEdicaoProva() {
    try {
        var idxEl = document.getElementById('edit-prova-idx');
        var valorEl = document.getElementById('edit-prova-valor');
        var escalaEl = document.getElementById('edit-prova-escala');
        var idx = idxEl ? parseInt(idxEl.value) : NaN;
        var valor = valorEl ? parseFloat(valorEl.value) : NaN;
        var escala = escalaEl ? escalaEl.value : '';
        if (isNaN(idx) || isNaN(valor)) return;
        var prova = casoActual.provasAplicadas[idx];
        if (!prova) return;
        var comp = converterParaCompetencia(valor, escala);
        prova.valor = valor;
        prova.escala = escala;
        prova.competencia = comp;
        prova.segmentos.forEach(function(segIdx) {
            casoActual.competencias[segIdx] = comp;
            if (radarChart) radarChart.setValor(segIdx, comp);
        });
        if (radarChart) radarChart.desenhar();
        fecharModal('modal-editar-prova');
        mostrarToast('Prova actualizada', 'success');
    } catch (e) {
        console.error('Erro ao salvar edicao:', e);
    }
}

function abrirEdicaoProvaCustom(provaId) {
    try {
        var prova = getProvas().find(function(p) { return p.id === provaId; });
        if (!prova || !prova.custom) return;
        document.getElementById('edit-custom-id').value = prova.id;
        document.getElementById('edit-custom-nome').value = prova.nome;
        document.getElementById('edit-custom-escala').value = prova.escala;
        document.getElementById('edit-custom-dominio').value = prova.dominio;
        var grid = document.getElementById('edit-custom-segmentos');
        if (grid) {
            grid.innerHTML = '';
            for (var i = 0; i < 40; i++) {
                var selected = (prova.segs || prova.segmentos || []).indexOf(i) !== -1;
                var seg = SEGMENTOS[i];
                var div = document.createElement('div');
                div.className = 'seg-checkbox ' + (selected ? 'selected' : '');
                div.dataset.seg = i;
                div.textContent = String(i);
                div.title = MODULOS[seg.modulo].nome + ' > ' + NIVEIS[seg.nivel].nome + ' > ' + CIRCUITOS[seg.circuito].nome + ' > ' + MODALIDADES[seg.modalidade].nome;
                div.addEventListener('click', function() { this.classList.toggle('selected'); });
                grid.appendChild(div);
            }
        }
        abrirModal('modal-editar-prova-custom');
    } catch (e) {
        console.error('Erro ao abrir edicao de prova custom:', e);
    }
}

function salvarProvaCustomEditada() {
    try {
        var id = document.getElementById('edit-custom-id').value;
        var nome = document.getElementById('edit-custom-nome').value;
        var escala = document.getElementById('edit-custom-escala').value;
        var dominio = document.getElementById('edit-custom-dominio').value;
        var segs = [];
        document.querySelectorAll('#edit-custom-segmentos .seg-checkbox.selected').forEach(function(el) {
            segs.push(parseInt(el.dataset.seg));
        });
        var idx = PROVAS_CUSTOM.findIndex(function(p) { return p.id === id; });
        if (idx !== -1) {
            PROVAS_CUSTOM[idx].nome = nome;
            PROVAS_CUSTOM[idx].escala = escala;
            PROVAS_CUSTOM[idx].dominio = dominio;
            PROVAS_CUSTOM[idx].segs = segs;
        }
        guardarProvasCustomLocal();
        inicializarProvas();
        fecharModal('modal-editar-prova-custom');
        mostrarToast('Prova actualizada', 'success');
        if (API.isAuthenticated() && API.actualizarProvaCustom) {
            API.actualizarProvaCustom(id, PROVAS_CUSTOM[idx]).catch(function(err) {
                console.warn('Erro ao sincronizar:', err);
            });
        }
    } catch (e) {
        console.error('Erro ao salvar prova custom:', e);
    }
}

function eliminarProvaCustomEditada() {
    try {
        var id = document.getElementById('edit-custom-id').value;
        if (!confirm('Tem a certeza que deseja eliminar esta prova?')) return;
        var idx = PROVAS_CUSTOM.findIndex(function(p) { return p.id === id; });
        if (idx !== -1) PROVAS_CUSTOM.splice(idx, 1);
        guardarProvasCustomLocal();
        if (API.isAuthenticated()) {
            try { API.eliminarProvaCustom(id); } catch (err) { console.warn('Erro:', err); }
        }
        inicializarProvas();
        fecharModal('modal-editar-prova-custom');
        mostrarToast('Prova eliminada', 'info');
    } catch (e) {
        console.error('Erro ao eliminar prova custom:', e);
    }
}

function carregarProvasCustomCloud() {
    if (!API.isAuthenticated()) return;
    try {
        API.listarProvasCustom().then(function(provas) {
            provas.forEach(function(p) {
                if (!getProvas().find(function(x) { return x.id === p.id; })) {
                    PROVAS_CUSTOM.push(p);
                }
            });
            inicializarProvas();
        });
    } catch (err) {
        console.warn('Erro ao carregar provas cloud:', err);
    }
}

window.abrirEdicaoProva = abrirEdicaoProva;
window.removerProvaAplicada = removerProvaAplicada;
window.abrirEdicaoProvaCustom = abrirEdicaoProvaCustom;
