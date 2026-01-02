/* ==========================================================================
   PERFIL DE COMPETÊNCIA LINGUÍSTICA - Data Module v3.2
   Constantes, estruturas de dados, conversão e storage
   ========================================================================== */

// ============================================================================
// CONSTANTES PRINCIPAIS
// ============================================================================

/**
 * Domínios Linguísticos (anteriormente "Módulos")
 */
const DOMINIOS = [
    { id: 0, nome: 'Fonológico', abrev: 'Fono', cor: '#E05252', corClara: '#FFCDD2', gradiente: 'linear-gradient(135deg, #E05252, #FF7043)' },
    { id: 1, nome: 'Morfológico', abrev: 'Morf', cor: '#E8A54C', corClara: '#FFE0B2', gradiente: 'linear-gradient(135deg, #E8A54C, #FFB74D)' },
    { id: 2, nome: 'Sintático', abrev: 'Sint', cor: '#00A79D', corClara: '#B2DFDB', gradiente: 'linear-gradient(135deg, #00A79D, #4DB6AC)' },
    { id: 3, nome: 'Semântico', abrev: 'Sem', cor: '#5B8BC4', corClara: '#BBDEFB', gradiente: 'linear-gradient(135deg, #5B8BC4, #64B5F6)' },
    { id: 4, nome: 'Pragmático', abrev: 'Prag', cor: '#7CB454', corClara: '#C8E6C9', gradiente: 'linear-gradient(135deg, #7CB454, #81C784)' }
];

// Alias para compatibilidade
const MODULOS = DOMINIOS;

const NIVEIS = [
    { id: 0, nome: 'Implícito', descricao: 'Processamento automático e inconsciente' },
    { id: 1, nome: 'Explícito', descricao: 'Processamento consciente e metalinguístico' }
];

const CIRCUITOS = [
    { id: 0, nome: 'Compreensão', abrev: 'Comp', descricao: 'Input linguístico' },
    { id: 1, nome: 'Expressão', abrev: 'Expr', descricao: 'Output linguístico' }
];

// Circuitos para nível sublexical (Fonológico)
const CIRCUITOS_SUBLEXICAL = [
    { id: 0, nome: 'Perceção', abrev: 'Perc', descricao: 'Input sublexical' },
    { id: 1, nome: 'Produção', abrev: 'Prod', descricao: 'Output sublexical' }
];

const MODALIDADES = [
    { id: 0, nome: 'Oral', abrev: 'Ora' },
    { id: 1, nome: 'Escrita', abrev: 'Esc' }
];

// Gerar estrutura dos 40 segmentos
function gerarSegmentos() {
    const segs = [];
    let id = 0;
    for (let m = 0; m < 5; m++) {
        for (let n = 0; n < 2; n++) {
            for (let c = 0; c < 2; c++) {
                for (let o = 0; o < 2; o++) {
                    // Usar terminologia sublexical para Fonológico (m=0)
                    const circuito = (m === 0) ? CIRCUITOS_SUBLEXICAL[c] : CIRCUITOS[c];
                    
                    segs.push({
                        id,
                        modulo: m,
                        dominio: m, // Alias
                        nivel: n,
                        circuito: c,
                        modalidade: o,
                        codigo: `${DOMINIOS[m].abrev}-${NIVEIS[n].nome.slice(0,3)}-${circuito.abrev}-${MODALIDADES[o].abrev}`,
                        descricao: `${DOMINIOS[m].nome} | ${NIVEIS[n].nome} | ${circuito.nome} | ${MODALIDADES[o].nome}`,
                        circuitoNome: circuito.nome,
                        circuitoAbrev: circuito.abrev
                    });
                    id++;
                }
            }
        }
    }
    return segs;
}

const SEGMENTOS = gerarSegmentos();

// Escala não-linear para os raios
const INTERVALOS_PERCENTAGEM = [15, 14, 13, 11, 10, 9, 8, 7, 7, 6];
const RAIOS_ACUMULADOS = [0];
let acum = 0;
for (const i of INTERVALOS_PERCENTAGEM) {
    acum += i;
    RAIOS_ACUMULADOS.push(acum / 100);
}

// ============================================================================
// TABELA DE CONVERSÃO
// ============================================================================

const TABELA_CONVERSAO = [
    { comp: 0,  desc: 'Défice grave',      percMin: 0,   percMax: 0.9,  qiMin: 0,   qiMax: 54,  zMin: -Infinity, zMax: -2.5, tMin: 0,  tMax: 19, zona: 'red' },
    { comp: 1,  desc: 'Défice moderado',   percMin: 1,   percMax: 1.9,  qiMin: 55,  qiMax: 69,  zMin: -2.5, zMax: -2.0, tMin: 20, tMax: 29, zona: 'red' },
    { comp: 2,  desc: 'Défice ligeiro',    percMin: 2,   percMax: 6,    qiMin: 70,  qiMax: 77,  zMin: -2.0, zMax: -1.5, tMin: 30, tMax: 34, zona: 'red' },
    { comp: 3,  desc: 'Limítrofe',         percMin: 7,   percMax: 15,   qiMin: 78,  qiMax: 84,  zMin: -1.5, zMax: -1.0, tMin: 35, tMax: 39, zona: 'yellow' },
    { comp: 4,  desc: 'Abaixo da média',   percMin: 16,  percMax: 30,   qiMin: 85,  qiMax: 92,  zMin: -1.0, zMax: -0.5, tMin: 40, tMax: 44, zona: 'yellow' },
    { comp: 5,  desc: 'Média baixa',       percMin: 31,  percMax: 49,   qiMin: 93,  qiMax: 99,  zMin: -0.5, zMax: 0,    tMin: 45, tMax: 49, zona: 'green' },
    { comp: 6,  desc: 'Média',             percMin: 50,  percMax: 68,   qiMin: 100, qiMax: 107, zMin: 0,    zMax: 0.5,  tMin: 50, tMax: 54, zona: 'green' },
    { comp: 7,  desc: 'Média alta',        percMin: 69,  percMax: 83,   qiMin: 108, qiMax: 114, zMin: 0.5,  zMax: 1.0,  tMin: 55, tMax: 59, zona: 'green' },
    { comp: 8,  desc: 'Acima da média',    percMin: 84,  percMax: 92,   qiMin: 115, qiMax: 122, zMin: 1.0,  zMax: 1.5,  tMin: 60, tMax: 64, zona: 'green' },
    { comp: 9,  desc: 'Superior',          percMin: 93,  percMax: 97,   qiMin: 123, qiMax: 129, zMin: 1.5,  zMax: 2.0,  tMin: 65, tMax: 69, zona: 'green' },
    { comp: 10, desc: 'Muito superior',    percMin: 98,  percMax: 100,  qiMin: 130, qiMax: 200, zMin: 2.0,  zMax: Infinity, tMin: 70, tMax: 100, zona: 'green' }
];

function converterParaCompetencia(valor, escala) {
    if (valor === null || valor === undefined || valor === '' || isNaN(valor)) return null;
    valor = parseFloat(valor);
    
    for (const row of TABELA_CONVERSAO) {
        let match = false;
        switch (escala) {
            case 'perc': match = valor >= row.percMin && valor <= row.percMax; break;
            case 'qi': match = valor >= row.qiMin && valor <= row.qiMax; break;
            case 'z': match = valor >= row.zMin && valor < row.zMax; break;
            case 't': match = valor >= row.tMin && valor <= row.tMax; break;
        }
        if (match) return row.comp;
    }
    return 5;
}

function obterZona(comp) {
    if (comp === null || comp === undefined) return null;
    if (comp < 3) return 'red';
    if (comp < 5) return 'yellow';
    return 'green';
}

function competenciaParaRaio(comp) {
    if (comp === null || comp === undefined || isNaN(comp)) return 0;
    comp = Math.max(0, Math.min(10, comp));
    const baixo = Math.floor(comp);
    const alto = Math.ceil(comp);
    if (baixo === alto) return RAIOS_ACUMULADOS[baixo];
    const fraccao = comp - baixo;
    return RAIOS_ACUMULADOS[baixo] + fraccao * (RAIOS_ACUMULADOS[alto] - RAIOS_ACUMULADOS[baixo]);
}

// ============================================================================
// PROVAS BASE (SISTEMA)
// ============================================================================

const PROVAS_SISTEMA = [
    // Fonológico
    { id: 'tff-alpe', nome: 'TFF-ALPE', escala: 'perc', dominio: 'Fonológico', segs: [0, 1], desc: 'Fonologia oral - articulação',
      tarefas: [
        { id: 'rep', nome: 'Repetição de Palavras', itens: 30 },
        { id: 'nom', nome: 'Nomeação', itens: 30 },
        { id: 'esp', nome: 'Fala Espontânea', itens: 10 }
      ]
    },
    { id: 'tav', nome: 'TAV', escala: 'perc', dominio: 'Fonológico', segs: [0, 1], desc: 'Avaliação fonológica',
      tarefas: [{ id: 'geral', nome: 'Avaliação Geral', itens: 50 }]
    },
    { id: 'clcp-pe', nome: 'CLCP-PE', escala: 'perc', dominio: 'Fonológico', segs: [0, 1], desc: 'Discriminação auditiva',
      tarefas: [{ id: 'disc', nome: 'Discriminação', itens: 40 }]
    },
    { id: 'confira', nome: 'ConF.IRA', escala: 'perc', dominio: 'Fonológico', segs: [4, 5], desc: 'Consciência fonológica',
      tarefas: [
        { id: 'sil', nome: 'Segmentação Silábica', itens: 10 },
        { id: 'rim', nome: 'Rimas', itens: 10 },
        { id: 'fon', nome: 'Consciência Fonémica', itens: 10 }
      ]
    },
    { id: 'alepe-cf', nome: 'ALEPE-CF', escala: 'perc', dominio: 'Fonológico', segs: [4, 5, 6, 7], desc: 'Consciência fonológica',
      tarefas: [
        { id: 'seg', nome: 'Segmentação', itens: 12 },
        { id: 'sint', nome: 'Síntese', itens: 12 },
        { id: 'sup', nome: 'Supressão', itens: 12 }
      ]
    },
    { id: 'alepe-leit', nome: 'ALEPE-Leitura', escala: 'perc', dominio: 'Fonológico', segs: [2, 3, 6, 7], desc: 'Leitura',
      tarefas: [
        { id: 'pal', nome: 'Leitura de Palavras', itens: 40 },
        { id: 'pse', nome: 'Leitura de Pseudopalavras', itens: 20 }
      ]
    },
    { id: 'alepe-escr', nome: 'ALEPE-Escrita', escala: 'perc', dominio: 'Fonológico', segs: [2, 3, 6, 7], desc: 'Escrita',
      tarefas: [
        { id: 'dit', nome: 'Ditado de Palavras', itens: 30 },
        { id: 'pse', nome: 'Ditado de Pseudopalavras', itens: 15 }
      ]
    },
    
    // Morfológico
    { id: 'gol-e-morf', nome: 'GOL-E Morfologia', escala: 'perc', dominio: 'Morfológico', segs: [8, 9], desc: 'Morfologia derivacional e flexional',
      tarefas: [
        { id: 'der', nome: 'Derivação', itens: 20 },
        { id: 'flex', nome: 'Flexão', itens: 20 }
      ]
    },
    { id: 'talc-morfo', nome: 'TALC-Morfossintaxe', escala: 'perc', dominio: 'Morfológico', segs: [8, 9, 16, 17], desc: 'Morfossintaxe',
      tarefas: [{ id: 'geral', nome: 'Avaliação Geral', itens: 30 }]
    },
    
    // Sintático
    { id: 'sintacs-comp', nome: 'Sin:TACS - Compreensão', escala: 'qi', dominio: 'Sintático', segs: [16], desc: 'Compreensão sintática',
      tarefas: [
        { id: 'simple', nome: 'Frases Simples', itens: 15 },
        { id: 'comp', nome: 'Frases Complexas', itens: 15 }
      ]
    },
    { id: 'sintacs-prod', nome: 'Sin:TACS - Produção', escala: 'qi', dominio: 'Sintático', segs: [17], desc: 'Produção sintática',
      tarefas: [
        { id: 'rep', nome: 'Repetição de Frases', itens: 20 },
        { id: 'comp', nome: 'Completamento', itens: 10 }
      ]
    },
    { id: 'sintacs-consc', nome: 'Sin:TACS - Consciência', escala: 'qi', dominio: 'Sintático', segs: [20, 21], desc: 'Consciência sintática',
      tarefas: [{ id: 'geral', nome: 'Julgamento Gramatical', itens: 30 }]
    },
    
    // Semântico
    { id: 'tas', nome: 'TAS', escala: 'perc', dominio: 'Semântico', segs: [24, 25], desc: 'Avaliação semântica',
      tarefas: [
        { id: 'def', nome: 'Definições', itens: 20 },
        { id: 'cat', nome: 'Categorização', itens: 20 }
      ]
    },
    { id: 'talc-sem', nome: 'TALC-Semântica', escala: 'perc', dominio: 'Semântico', segs: [24, 25], desc: 'Semântica lexical',
      tarefas: [{ id: 'geral', nome: 'Avaliação Geral', itens: 40 }]
    },
    { id: 'tip', nome: 'TIP', escala: 'perc', dominio: 'Semântico', segs: [24, 25, 28, 29], desc: 'Identificação de palavras',
      tarefas: [{ id: 'geral', nome: 'Identificação', itens: 60 }]
    },
    
    // Pragmático
    { id: 'reconto-comp', nome: '(RE)CONTO-Compreensão', escala: 'perc', dominio: 'Pragmático', segs: [32, 36], desc: 'Compreensão narrativa',
      tarefas: [
        { id: 'lit', nome: 'Compreensão Literal', itens: 10 },
        { id: 'inf', nome: 'Inferências', itens: 10 }
      ]
    },
    { id: 'reconto-prod', nome: '(RE)CONTO-Produção', escala: 'perc', dominio: 'Pragmático', segs: [33, 37], desc: 'Produção narrativa',
      tarefas: [
        { id: 'est', nome: 'Estrutura', itens: 10 },
        { id: 'coe', nome: 'Coesão', itens: 10 }
      ]
    },
    { id: 'topl', nome: 'TOPL-2', escala: 'perc', dominio: 'Pragmático', segs: [32, 33], desc: 'Linguagem pragmática',
      tarefas: [{ id: 'geral', nome: 'Avaliação Geral', itens: 43 }]
    }
];

// ============================================================================
// BASE DE CONHECIMENTO PARA PLANO TERAPÊUTICO
// ============================================================================

const BASE_INTERVENCAO = {
    Fonológico: {
        areas: ['Discriminação Auditiva', 'Consciência Fonológica', 'Articulação', 'Processos Fonológicos'],
        objectivos: [
            'Desenvolver discriminação auditiva de pares mínimos',
            'Melhorar consciência silábica e fonémica',
            'Corrigir processos fonológicos de simplificação',
            'Expandir inventário fonético',
            'Automatizar produção de fonemas-alvo',
            'Generalizar para contextos comunicativos'
        ],
        estrategias: [
            'Treino de pares mínimos',
            'Ciclos fonológicos de Hodson',
            'Abordagem de complexidade máxima',
            'Treino de consciência fonológica explícita',
            'Jogos de rimas e aliteração',
            'Bombardeamento auditivo'
        ],
        materiais: ['Cartões de pares mínimos', 'Jogos de consciência fonológica', 'Espelho', 'Gravações áudio']
    },
    Morfológico: {
        areas: ['Flexão Nominal', 'Flexão Verbal', 'Derivação', 'Morfemas Gramaticais'],
        objectivos: [
            'Desenvolver uso correcto de morfemas de plural',
            'Melhorar flexão verbal em tempo e pessoa',
            'Expandir uso de prefixos e sufixos',
            'Aumentar compreensão de palavras complexas',
            'Desenvolver consciência morfológica'
        ],
        estrategias: [
            'Modelagem e expansão',
            'Elicitação em contexto',
            'Treino explícito de regras',
            'Jogos de transformação morfológica',
            'Análise de famílias de palavras'
        ],
        materiais: ['Jogos de morfologia', 'Histórias estruturadas', 'Cartões de transformação']
    },
    Sintático: {
        areas: ['Estrutura Frásica', 'Frases Complexas', 'Ordem de Palavras', 'Concordância'],
        objectivos: [
            'Expandir comprimento médio do enunciado',
            'Desenvolver uso de frases complexas',
            'Melhorar compreensão de estruturas sintácticas',
            'Corrigir erros de ordem de palavras',
            'Desenvolver uso de conjunções e conectores'
        ],
        estrategias: [
            'Modelagem de frases expandidas',
            'Sentence combining',
            'Reconstrução de frases',
            'Role-play comunicativo',
            'Treino de compreensão auditiva'
        ],
        materiais: ['Histórias sequenciais', 'Jogos de construção frásica', 'Imagens de acção']
    },
    Semântico: {
        areas: ['Vocabulário Receptivo', 'Vocabulário Expressivo', 'Relações Semânticas', 'Categorização'],
        objectivos: [
            'Expandir vocabulário receptivo e expressivo',
            'Desenvolver redes semânticas',
            'Melhorar acesso lexical',
            'Desenvolver definições e descrições',
            'Compreender relações de sinonímia e antonímia'
        ],
        estrategias: [
            'Mapeamento semântico',
            'Treino de definições',
            'Categorização e subcategorização',
            'Associação de palavras',
            'Estratégias de recuperação lexical'
        ],
        materiais: ['Mapas semânticos', 'Cartões de vocabulário', 'Jogos de categorias']
    },
    Pragmático: {
        areas: ['Tomada de Turno', 'Relevância', 'Narrativa', 'Comunicação Social'],
        objectivos: [
            'Desenvolver competências conversacionais',
            'Melhorar estrutura narrativa',
            'Desenvolver inferências sociais',
            'Melhorar adequação ao contexto',
            'Expandir funções comunicativas'
        ],
        estrategias: [
            'Role-play social',
            'Treino de narrativa com suportes visuais',
            'Análise de situações sociais',
            'Vídeo-modelagem',
            'Scripts sociais'
        ],
        materiais: ['Histórias sociais', 'Vídeos de situações', 'Cartões de emoções', 'Jogos cooperativos']
    }
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
    CASOS: 'pcl_casos',
    PROVAS_CUSTOM: 'pcl_provas_custom',
    SETTINGS: 'pcl_settings',
    PLANOS: 'pcl_planos'
};

// ============================================================================
// FUNÇÕES DE STORAGE
// ============================================================================

function guardarDados(key, dados) {
    try {
        localStorage.setItem(key, JSON.stringify(dados));
        return true;
    } catch (e) {
        console.error(`Erro ao guardar ${key}:`, e);
        return false;
    }
}

function carregarDados(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error(`Erro ao carregar ${key}:`, e);
        return defaultValue;
    }
}

function guardarCasos(casos) { return guardarDados(STORAGE_KEYS.CASOS, casos); }
function carregarCasos() { return carregarDados(STORAGE_KEYS.CASOS, []); }
function guardarProvasCustom(provas) { return guardarDados(STORAGE_KEYS.PROVAS_CUSTOM, provas); }
function carregarProvasCustom() { return carregarDados(STORAGE_KEYS.PROVAS_CUSTOM, []); }
function guardarSettings(settings) { return guardarDados(STORAGE_KEYS.SETTINGS, settings); }
function carregarSettings() { return carregarDados(STORAGE_KEYS.SETTINGS, { theme: 'light', autoSave: true }); }
function guardarPlanos(planos) { return guardarDados(STORAGE_KEYS.PLANOS, planos); }
function carregarPlanos() { return carregarDados(STORAGE_KEYS.PLANOS, []); }

function obterTodasProvas() {
    const custom = carregarProvasCustom();
    return [...PROVAS_SISTEMA, ...custom];
}

// ============================================================================
// ESTRUTURAS DE DADOS
// ============================================================================

function criarCasoVazio() {
    return {
        id: '',
        nome: '',
        idade: '',
        data: new Date().toISOString().split('T')[0],
        escolaridade: '',
        avaliador: '',
        terapeuta: '',
        dataCriacao: new Date().toISOString(),
        dataModificacao: new Date().toISOString(),
        competencias: new Array(40).fill(null),
        provasAplicadas: [],
        respostasDetalhadas: {},
        notas: '',
        planoId: null
    };
}

function criarProvaCustom(dados) {
    return {
        id: `custom-${Date.now()}`,
        nome: dados.nome || 'Nova Prova',
        escala: dados.escala || 'perc',
        dominio: dados.dominio || 'Fonológico',
        segs: dados.segs || [],
        desc: dados.desc || '',
        tarefas: dados.tarefas || [{ id: 'geral', nome: 'Avaliação Geral', itens: 10 }],
        custom: true,
        dataCriacao: new Date().toISOString()
    };
}

function criarPlanoTerapeutico(casoId, analise) {
    return {
        id: `plano-${Date.now()}`,
        casoId,
        dataCriacao: new Date().toISOString(),
        dataModificacao: new Date().toISOString(),
        objectivosGerais: [],
        objectivosEspecificos: [],
        areas: [],
        estrategias: [],
        materiais: [],
        sessoes: [],
        notas: '',
        analiseBase: analise,
        status: 'rascunho'
    };
}

function gerarDadosExemplo() {
    const caso = criarCasoVazio();
    caso.id = 'DEMO-001';
    caso.nome = 'Caso Demonstração';
    caso.idade = '7;6';
    caso.escolaridade = '2';
    caso.avaliador = 'TF Demo';
    
    const exemplo = [
        3, 2, 2, 1, 4, 3, 2, 1,
        5, 4, 4, 3, 5, 4, 4, 3,
        6, 5, 5, 4, 6, 5, 5, 4,
        6, 6, 5, 5, 6, 5, 5, 4,
        4, 3, 3, 2, 4, 3, 3, 2
    ];
    
    caso.competencias = exemplo;
    return caso;
}

// ============================================================================
// EXPORTAÇÃO/IMPORTAÇÃO
// ============================================================================

function exportarJSON(dados, filename) {
    const dataStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarCSV(caso) {
    let csv = 'Segmento,Domínio,Nível,Circuito,Modalidade,Competência,Zona,Descrição\n';
    caso.competencias.forEach((comp, idx) => {
        const seg = SEGMENTOS[idx];
        const zona = obterZona(comp) || '';
        const descZona = comp !== null ? TABELA_CONVERSAO.find(t => t.comp === comp)?.desc || '' : '';
        csv += `${idx + 1},"${DOMINIOS[seg.modulo].nome}","${NIVEIS[seg.nivel].nome}","${CIRCUITOS[seg.circuito].nome}","${MODALIDADES[seg.modalidade].nome}",${comp !== null ? comp : ''},${zona},"${descZona}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perfil_${caso.id || 'caso'}_${caso.data}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                resolve(JSON.parse(e.target.result));
            } catch (err) {
                reject(new Error('Ficheiro JSON inválido'));
            }
        };
        reader.onerror = () => reject(new Error('Erro ao ler ficheiro'));
        reader.readAsText(file);
    });
}

// ============================================================================
// ESTRUTURA PARA IA (PREPARAÇÃO FUTURA)
// ============================================================================

const AI_CONFIG = {
    enabled: false,
    provider: null,
    apiEndpoint: null,
    model: null,
    prompts: {
        analise: `Analisa o seguinte perfil linguístico e identifica padrões clínicos relevantes:`,
        diagnostico: `Com base nos dados fornecidos, sugere hipóteses diagnósticas fundamentadas:`,
        plano: `Elabora um plano terapêutico detalhado para as seguintes áreas de dificuldade:`,
        objectivos: `Sugere objectivos SMART para intervenção nas seguintes áreas:`
    }
};

function prepararDadosParaIA(caso, tipo = 'analise') {
    const perfil = {
        identificacao: { idade: caso.idade, escolaridade: caso.escolaridade },
        competencias: {},
        medias: {},
        zonas: { vermelho: [], amarelo: [], verde: [] }
    };
    
    DOMINIOS.forEach((dom, di) => {
        const comps = caso.competencias.slice(di * 8, di * 8 + 8);
        const validos = comps.filter(c => c !== null);
        
        perfil.competencias[dom.nome] = comps;
        if (validos.length) {
            const media = validos.reduce((a, b) => a + b, 0) / validos.length;
            perfil.medias[dom.nome] = media.toFixed(1);
            
            if (media < 3) perfil.zonas.vermelho.push(dom.nome);
            else if (media < 5) perfil.zonas.amarelo.push(dom.nome);
            else perfil.zonas.verde.push(dom.nome);
        }
    });
    
    return { tipo, prompt: AI_CONFIG.prompts[tipo], dados: perfil };
}

async function chamarIA(dados) {
    if (!AI_CONFIG.enabled) {
        return { success: false, message: 'Integração com IA não configurada.', usarRegras: true };
    }
    return { success: false, message: 'Implementação futura' };
}
