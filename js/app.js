/* ==========================================================================
   PERLIM - App Principal (Orquestrador) v4.0
   
   Inicializa todos os módulos de forma isolada.
   Cada módulo pode falhar sem derrubar os restantes.
   
   Módulos:
     js/modules/ui.js          - Modais, toasts, tema, fullscreen, atalhos
     js/modules/auth.js        - Autenticação (login, logout, registo)
     js/modules/paineis.js     - Painéis de input, sliders, escrita
     js/modules/provas.js      - Gestão de provas aplicadas e custom
     js/modules/perfil.js      - Geração de perfil, estatísticas, análise
     js/modules/casos.js       - Guardar, carregar, limpar, exemplo
     js/modules/criancas.js    - Gestão de crianças, idade
     js/modules/gestao.js      - Painel de gestão (dashboard)
     js/modules/exportacao.js  - Exportação (PNG, PDF, CSV, Excel, JSON)
     js/modules/ia.js          - Integração com IA
   ========================================================================== */

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

let casoActual = criarCasoVazio();
let radarChart = null;
let radarInicializado = false;
let settings = carregarSettings();
let escritaAtiva = true;
let planoActual = null;

// ============================================================================
// INICIALIZAÇÃO DO RADAR
// ============================================================================

function inicializarRadar() {
    if (radarInicializado) return true;
    
    const canvas = document.getElementById('radar-canvas');
    const appContent = document.getElementById('app-content');
    
    if (!canvas || !appContent || appContent.style.display === 'none') {
        return false;
    }
    
    try {
        radarChart = new RadarChart('radar-canvas');
        radarChart.desenhar();
        radarInicializado = true;
        console.log('✅ Radar inicializado');
        return true;
    } catch (e) {
        console.error('❌ Erro ao inicializar radar:', e);
        return false;
    }
}

// ============================================================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 PERLIM v4.0 — Início da inicialização');
    const inicio = performance.now();
    
    // Aplicar tema guardado
    try {
        if (settings.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    } catch (e) {
        console.warn('Tema não aplicado:', e);
    }
    
    // Definir data actual
    try {
        const dataInput = document.getElementById('caso-data');
        if (dataInput) dataInput.value = new Date().toISOString().split('T')[0];
    } catch (e) {
        console.warn('Data não definida:', e);
    }
    
    // ── Inicializar cada módulo de forma isolada ──
    const modulos = [
        { nome: 'UI',          fn: inicializarUI },
        { nome: 'Painéis',     fn: inicializarPaineis },
        { nome: 'Tabs',        fn: inicializarTabs },
        { nome: 'Provas',      fn: inicializarProvas },
        { nome: 'Auth',        fn: inicializarAuth },
        { nome: 'Crianças',    fn: inicializarCriancas },
        { nome: 'Gestão',      fn: inicializarGestao },
        { nome: 'Exportação',  fn: inicializarExportacao },
        { nome: 'IA',          fn: inicializarIA },
    ];
    
    let sucesso = 0;
    let falha = 0;
    
    modulos.forEach(mod => {
        try {
            if (typeof mod.fn === 'function') {
                mod.fn();
                sucesso++;
            } else {
                console.warn(`⚠️ Módulo ${mod.nome} não encontrado (ficheiro não carregado?)`);
                falha++;
            }
        } catch (e) {
            console.error(`❌ Erro ao inicializar módulo ${mod.nome}:`, e);
            falha++;
        }
    });
    
    // ── Botões principais ──
    try {
        document.getElementById('btn-gerar')?.addEventListener('click', gerarPerfil);
        document.getElementById('btn-limpar')?.addEventListener('click', limparFormulario);
        document.getElementById('btn-guardar')?.addEventListener('click', guardarCasoCloud);
        document.getElementById('btn-exemplo')?.addEventListener('click', carregarExemplo);
        document.getElementById('btn-info')?.addEventListener('click', () => {
            mostrarInfoTab('provas');
            abrirModal('modal-info');
        });
        
        // Radar: zoom + download
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
            radarChart?.setZoom(radarChart.zoom + 0.1);
        });
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
            radarChart?.setZoom(radarChart.zoom - 0.1);
        });
        document.getElementById('btn-download-png')?.addEventListener('click', () => {
            const nome = casoActual.id || 'perfil';
            radarChart?.downloadPNG(`perfil_${nome}_${casoActual.data}.png`);
            mostrarToast('PNG exportado!', 'success');
        });
        
        // Prova: adicionar + editar
        document.getElementById('btn-add-prova')?.addEventListener('click', adicionarProva);
        document.getElementById('btn-salvar-edicao-prova')?.addEventListener('click', salvarEdicaoProva);
        document.getElementById('edit-prova-valor')?.addEventListener('input', calcularCompetenciaEdicao);
        document.getElementById('edit-prova-escala')?.addEventListener('change', calcularCompetenciaEdicao);
        document.getElementById('btn-salvar-prova-custom')?.addEventListener('click', salvarProvaCustomEditada);
        document.getElementById('btn-eliminar-prova-custom')?.addEventListener('click', eliminarProvaCustomEditada);
        
        // Escolaridade → verificar escrita
        document.getElementById('caso-esc')?.addEventListener('change', verificarEscrita);
        
        // History
        document.getElementById('btn-import-json')?.addEventListener('click', importarCaso);
        document.getElementById('btn-export-all')?.addEventListener('click', exportarTodosCasos);
        document.getElementById('history-search')?.addEventListener('input', filtrarHistorico);
        
    } catch (e) {
        console.error('Erro ao configurar botões:', e);
    }
    
    // ── Radar ──
    try {
        inicializarRadar();
    } catch (e) {
        console.warn('Radar não inicializado:', e);
    }
    
    // ── Esconder loading ──
    setTimeout(() => {
        try {
            document.getElementById('loading-overlay')?.classList.add('hidden');
        } catch (e) {
            console.warn('Loading overlay não escondido:', e);
        }
    }, 300);
    
    const duracao = (performance.now() - inicio).toFixed(0);
    console.log(`✅ PERLIM inicializado em ${duracao}ms — ${sucesso} módulos OK, ${falha} falharam`);
});
