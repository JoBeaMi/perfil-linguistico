/* ==========================================================================
   PERLIM - Módulo UI
   Modais, toasts, tema, fullscreen, atalhos de teclado
   ========================================================================== */

// ============================================================================
// MODAIS
// ============================================================================

function abrirModal(id) {
    try {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    } catch (e) {
        console.error('Erro ao abrir modal:', e);
    }
}

function fecharModal(id) {
    try {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    } catch (e) {
        console.error('Erro ao fechar modal:', e);
    }
}

function inicializarModais() {
    try {
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal')?.classList.remove('active');
            });
        });
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        });
    } catch (e) {
        console.error('Erro ao inicializar modais:', e);
    }
}

// ============================================================================
// TOASTS
// ============================================================================

function mostrarToast(mensagem, tipo = 'info') {
    try {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `<span class="toast-message">${mensagem}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
    } catch (e) {
        console.error('Erro no toast:', e);
    }
}

// ============================================================================
// TEMA
// ============================================================================

function toggleTema() {
    try {
        const current = document.documentElement.getAttribute('data-theme');
        const novo = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', novo);
        settings.theme = novo;
        guardarSettings(settings);
        if (typeof radarChart !== 'undefined' && radarChart) radarChart.desenhar();
    } catch (e) {
        console.error('Erro ao mudar tema:', e);
    }
}

// ============================================================================
// FULLSCREEN
// ============================================================================

function toggleFullscreen() {
    try {
        if (document.body.classList.contains('fullscreen')) {
            sairFullscreen();
        } else {
            document.body.classList.add('fullscreen');
            document.documentElement.requestFullscreen?.();
            setTimeout(() => radarChart?.resize(), 100);
        }
    } catch (e) {
        console.error('Erro ao alternar fullscreen:', e);
    }
}

function sairFullscreen() {
    try {
        document.body.classList.remove('fullscreen');
        if (document.fullscreenElement) document.exitFullscreen?.();
        setTimeout(() => radarChart?.resize(), 100);
    } catch (e) {
        console.error('Erro ao sair de fullscreen:', e);
    }
}

function inicializarFullscreen() {
    try {
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement && document.body.classList.contains('fullscreen')) {
                document.body.classList.remove('fullscreen');
                if (radarChart) setTimeout(() => radarChart.resize(), 100);
            }
        });
    } catch (e) {
        console.error('Erro ao inicializar fullscreen:', e);
    }
}

// ============================================================================
// ATALHOS DE TECLADO
// ============================================================================

function tratarAtalhos(e) {
    try {
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
            if (document.body.classList.contains('fullscreen')) { e.preventDefault(); sairFullscreen(); return; }
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        }
    } catch (e) {
        console.error('Erro no atalho:', e);
    }
}

// ============================================================================
// INFO TABS
// ============================================================================

function mostrarInfoTab(tab) {
    try {
        document.querySelectorAll('.info-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.info-tab[data-info="${tab}"]`)?.classList.add('active');
        const content = document.getElementById('info-content');
        if (!content) return;
        switch (tab) {
            case 'provas':
                const provas = typeof getProvas === 'function' ? getProvas() : (typeof PROVAS_SISTEMA !== 'undefined' ? PROVAS_SISTEMA : []);
                content.innerHTML = '<table class="info-table"><thead><tr><th>Prova</th><th>Escala</th><th>Domínio</th><th>Descrição</th></tr></thead><tbody>' + provas.map(p => '<tr><td><b>' + p.nome + '</b>' + (p.custom ? ' 🔧' : '') + '</td><td>' + (p.escala || '').toUpperCase() + '</td><td>' + (p.dominio || '-') + '</td><td>' + (p.desc || '-') + '</td></tr>').join('') + '</tbody></table>';
                break;
            case 'conversao':
                content.innerHTML = '<table class="info-table"><thead><tr><th>Comp</th><th>Descrição</th><th>Perc</th><th>QI</th><th>Z</th></tr></thead><tbody>' + TABELA_CONVERSAO.map(r => '<tr class="zone-' + r.zona + '"><td><b>' + r.comp + '</b></td><td>' + r.desc + '</td><td>' + (r.percMin === 0 ? '<1' : r.percMin) + '-' + r.percMax + '</td><td>' + r.qiMin + '-' + r.qiMax + '</td><td>' + (r.zMin === -Infinity ? '<-2.5' : r.zMin) + ' a ' + (r.zMax === Infinity ? '>+2' : r.zMax) + '</td></tr>').join('') + '</tbody></table>';
                break;
            case 'modelo':
                content.innerHTML = '<div style="line-height:1.8"><h3 style="color:var(--caidi-turquesa);margin-bottom:1rem">Modelo Teórico</h3><p>O <b>Perfil de Competência Linguística</b> baseia-se nos <b>Quadrantes de Alves (2019)</b>.</p><h4 style="margin:1.5rem 0 0.5rem">Estrutura dos 40 Segmentos</h4><ul style="margin:0.5rem 0 0.5rem 1.5rem"><li><b>5 Domínios:</b> Fonológico, Morfológico, Sintático, Semântico, Pragmático</li><li><b>2 Níveis:</b> Implícito, Explícito</li><li><b>2 Circuitos:</b> Compreensão, Expressão</li><li><b>2 Modalidades:</b> Oral, Escrita</li></ul></div>';
                break;
            case 'atalhos':
                content.innerHTML = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem"><div class="info-item"><label>Gerar</label><p><kbd>G</kbd></p></div><div class="info-item"><label>Exemplo</label><p><kbd>E</kbd></p></div><div class="info-item"><label>Tema</label><p><kbd>T</kbd></p></div><div class="info-item"><label>Histórico</label><p><kbd>H</kbd></p></div><div class="info-item"><label>Info</label><p><kbd>I</kbd></p></div><div class="info-item"><label>Fullscreen</label><p><kbd>F</kbd></p></div></div>';
                break;
        }
    } catch (e) {
        console.error('Erro ao mostrar info tab:', e);
    }
}

// ============================================================================
// INICIALIZAÇÃO DO MÓDULO UI
// ============================================================================

function inicializarUI() {
    try {
        inicializarModais();
        inicializarFullscreen();
        document.querySelectorAll('.info-tab').forEach(tab => {
            tab.addEventListener('click', () => mostrarInfoTab(tab.dataset.info));
        });
        document.addEventListener('keydown', tratarAtalhos);
        document.getElementById('btn-theme')?.addEventListener('click', toggleTema);
        document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullscreen);
        document.getElementById('btn-close-fullscreen')?.addEventListener('click', sairFullscreen);
        console.log('✅ Módulo UI inicializado');
    } catch (e) {
        console.error('❌ Erro ao inicializar módulo UI:', e);
    }
}
