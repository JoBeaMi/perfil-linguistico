/* ==========================================================================
   PERLIM - Motor de Cálculos Normativos v1.0
   Sistema genérico para converter pontuações brutas em z-scores
   usando tabelas normativas (média + desvio-padrão por faixa etária).
   
   Reutilizável para qualquer prova que forneça dados normativos.
   ========================================================================== */

// ============================================================================
// TABELAS NORMATIVAS
// Estrutura: { provaId: { subteste/estrutura: [ {idadeMin, idadeMax, media, dp} ] } }
// Idades em meses para máxima precisão
// ============================================================================

const TABELAS_NORMATIVAS = {

    // ========================================================================
    // GOL-E (Grelha de Observação da Linguagem - Nível Escolar)
    // Kay & Santos, 2014 (2ª edição)
    // Idades: 5;07 a 10;00 — Escala: pontuação bruta → z-score
    // ========================================================================

    'gol-e': {
        // --- ESTRUTURA SEMÂNTICA (máx 40) ---
        'sem-definicao': [
            // Definição de palavras (máx 20, cotação 0-1-2)
            { idadeMin: 67, idadeMax: 72,  media: 7.45,  dp: 3.02 },  // 5;07–6;00
            { idadeMin: 73, idadeMax: 84,  media: 9.29,  dp: 3.22 },  // 6;01–7;00
            { idadeMin: 85, idadeMax: 96,  media: 11.31, dp: 3.66 },  // 7;01–8;00
            { idadeMin: 97, idadeMax: 108, media: 13.37, dp: 3.21 },  // 8;01–9;00
            { idadeMin: 109, idadeMax: 120, media: 14.23, dp: 3.25 }  // 9;01–10;00
        ],
        'sem-nomeacao': [
            // Nomeação de classes (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 5.02, dp: 2.32 },
            { idadeMin: 73, idadeMax: 84,  media: 5.96, dp: 2.18 },
            { idadeMin: 85, idadeMax: 96,  media: 7.29, dp: 1.90 },
            { idadeMin: 97, idadeMax: 108, media: 8.13, dp: 1.55 },
            { idadeMin: 109, idadeMax: 120, media: 8.67, dp: 1.30 }
        ],
        'sem-opostos': [
            // Opostos (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 5.00, dp: 2.92 },
            { idadeMin: 73, idadeMax: 84,  media: 6.06, dp: 2.40 },
            { idadeMin: 85, idadeMax: 96,  media: 7.79, dp: 1.90 },
            { idadeMin: 97, idadeMax: 108, media: 8.23, dp: 1.86 },
            { idadeMin: 109, idadeMax: 120, media: 8.69, dp: 1.38 }
        ],
        'sem-total': [
            // Total Semântica (máx 40)
            { idadeMin: 67, idadeMax: 72,  media: 17.42, dp: 6.80 },
            { idadeMin: 73, idadeMax: 84,  media: 21.42, dp: 6.10 },
            { idadeMin: 85, idadeMax: 96,  media: 26.39, dp: 5.89 },
            { idadeMin: 97, idadeMax: 108, media: 29.79, dp: 5.33 },
            { idadeMin: 109, idadeMax: 120, media: 31.56, dp: 4.55 }
        ],

        // --- ESTRUTURA MORFOSSINTÁTICA (máx 50) ---
        'morf-reconhecimento': [
            // Reconhecimento de frases agramaticais (máx 20, cotação 0-1-2)
            { idadeMin: 67, idadeMax: 72,  media: 10.68, dp: 5.27 },
            { idadeMin: 73, idadeMax: 84,  media: 12.12, dp: 4.89 },
            { idadeMin: 85, idadeMax: 96,  media: 15.13, dp: 4.12 },
            { idadeMin: 97, idadeMax: 108, media: 16.75, dp: 3.40 },
            { idadeMin: 109, idadeMax: 120, media: 17.13, dp: 2.97 }
        ],
        'morf-coordenacao': [
            // Coordenação e subordinação de frases (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 2.62, dp: 2.34 },
            { idadeMin: 73, idadeMax: 84,  media: 3.99, dp: 2.39 },
            { idadeMin: 85, idadeMax: 96,  media: 5.45, dp: 2.27 },
            { idadeMin: 97, idadeMax: 108, media: 6.60, dp: 2.45 },
            { idadeMin: 109, idadeMax: 120, media: 7.03, dp: 2.28 }
        ],
        'morf-ordem': [
            // Ordem das palavras na frase (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 3.83, dp: 2.70 },
            { idadeMin: 73, idadeMax: 84,  media: 6.37, dp: 2.68 },
            { idadeMin: 85, idadeMax: 96,  media: 8.31, dp: 1.70 },
            { idadeMin: 97, idadeMax: 108, media: 9.07, dp: 1.19 },
            { idadeMin: 109, idadeMax: 120, media: 9.11, dp: 1.13 }
        ],
        'morf-derivacao': [
            // Derivação de palavras (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 4.39, dp: 2.20 },
            { idadeMin: 73, idadeMax: 84,  media: 4.75, dp: 1.75 },
            { idadeMin: 85, idadeMax: 96,  media: 6.47, dp: 1.89 },
            { idadeMin: 97, idadeMax: 108, media: 7.49, dp: 1.51 },
            { idadeMin: 109, idadeMax: 120, media: 8.12, dp: 1.48 }
        ],
        'morf-total': [
            // Total Morfossintática (máx 50)
            { idadeMin: 67, idadeMax: 72,  media: 21.53, dp: 9.92 },
            { idadeMin: 73, idadeMax: 84,  media: 27.09, dp: 9.36 },
            { idadeMin: 85, idadeMax: 96,  media: 35.34, dp: 7.72 },
            { idadeMin: 97, idadeMax: 108, media: 39.91, dp: 6.18 },
            { idadeMin: 109, idadeMax: 120, media: 41.38, dp: 5.81 }
        ],

        // --- ESTRUTURA FONOLÓGICA (máx 40) ---
        'fono-disc-palavras': [
            // Discriminação de pares de palavras (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 8.08, dp: 2.21 },
            { idadeMin: 73, idadeMax: 84,  media: 8.50, dp: 2.30 },
            { idadeMin: 85, idadeMax: 96,  media: 9.32, dp: 1.40 },
            { idadeMin: 97, idadeMax: 108, media: 9.62, dp: 0.82 },
            { idadeMin: 109, idadeMax: 120, media: 9.72, dp: 0.64 }
        ],
        'fono-disc-pseudo': [
            // Discriminação de pseudo-palavras (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 7.76, dp: 2.12 },
            { idadeMin: 73, idadeMax: 84,  media: 8.32, dp: 2.12 },
            { idadeMin: 85, idadeMax: 96,  media: 9.00, dp: 1.40 },
            { idadeMin: 97, idadeMax: 108, media: 9.28, dp: 1.33 },
            { idadeMin: 109, idadeMax: 120, media: 9.54, dp: 0.81 }
        ],
        'fono-rimas': [
            // Identificação de palavras que rimam (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 6.04, dp: 2.84 },
            { idadeMin: 73, idadeMax: 84,  media: 7.24, dp: 2.48 },
            { idadeMin: 85, idadeMax: 96,  media: 8.57, dp: 2.00 },
            { idadeMin: 97, idadeMax: 108, media: 9.11, dp: 1.63 },
            { idadeMin: 109, idadeMax: 120, media: 9.16, dp: 1.46 }
        ],
        'fono-segmentacao': [
            // Segmentação silábica (máx 10, cotação 0-1)
            { idadeMin: 67, idadeMax: 72,  media: 5.25, dp: 1.84 },
            { idadeMin: 73, idadeMax: 84,  media: 6.24, dp: 1.35 },
            { idadeMin: 85, idadeMax: 96,  media: 7.71, dp: 1.70 },
            { idadeMin: 97, idadeMax: 108, media: 8.70, dp: 1.56 },
            { idadeMin: 109, idadeMax: 120, media: 9.27, dp: 1.07 }
        ],
        'fono-total': [
            // Total Fonológica (máx 40)
            { idadeMin: 67, idadeMax: 72,  media: 27.16, dp: 5.91 },
            { idadeMin: 73, idadeMax: 84,  media: 30.29, dp: 5.76 },
            { idadeMin: 85, idadeMax: 96,  media: 34.63, dp: 4.40 },
            { idadeMin: 97, idadeMax: 108, media: 36.72, dp: 3.48 },
            { idadeMin: 109, idadeMax: 120, media: 37.71, dp: 2.58 }
        ],

        // --- TOTAL GOL-E (máx 130) ---
        'total': [
            { idadeMin: 67, idadeMax: 72,  media: 66.11,  dp: 19.61 },
            { idadeMin: 73, idadeMax: 84,  media: 78.99,  dp: 17.43 },
            { idadeMin: 85, idadeMax: 96,  media: 96.36,  dp: 14.94 },
            { idadeMin: 97, idadeMax: 108, media: 106.42, dp: 12.47 },
            { idadeMin: 109, idadeMax: 120, media: 110.65, dp: 10.36 }
        ]
    }

    // Futuras provas (TFF-ALPE, TALC, Sin:TACS, etc.) adicionam-se aqui
    // com a mesma estrutura
};


// ============================================================================
// DEFINIÇÃO DETALHADA DE PROVAS COM SUBTESTES
// Estrutura que permite cotação item a item
// ============================================================================

const PROVAS_DETALHADAS = {
    'gol-e': {
        id: 'gol-e',
        nome: 'GOL-E',
        nomeCompleto: 'Grelha de Observação da Linguagem - Nível Escolar',
        autores: 'Kay & Santos (2014)',
        idadeMin: 67,   // 5;07 em meses
        idadeMax: 120,   // 10;00 em meses
        escalaOriginal: 'bruta',
        escalaConversao: 'z',
        pontuacaoMaxima: 130,

        estruturas: [
            {
                id: 'semantica',
                nome: 'Estrutura Semântica',
                dominio: 'Semântico',
                pontuacaoMaxima: 40,
                tabelaNormativa: 'sem-total',
                subtestes: [
                    {
                        id: 'sem-definicao',
                        nome: 'Definição de palavras',
                        descricao: 'Perguntar "O que é uma banana?" — avaliar qualidade da definição',
                        pontuacaoMaxima: 20,
                        numItens: 10,
                        cotacaoMax: 2,  // 0, 1 ou 2
                        tabelaNormativa: 'sem-definicao',
                        segmentos: [29],  // Semântico-Explícito-Expressão-Oral
                        itens: [
                            'Livro', 'Rosa', 'Sandália', 'Sardinha', 'Berlinde',
                            'Simpático', 'Submarino', 'Arquiteto', 'Curioso', 'Valente'
                        ]
                    },
                    {
                        id: 'sem-nomeacao',
                        nome: 'Nomeação de classes',
                        descricao: 'Dizer categoria a que pertencem os itens apresentados',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,  // 0 ou 1
                        tabelaNormativa: 'sem-nomeacao',
                        segmentos: [25],  // Semântico-Implícito-Expressão-Oral
                        itens: [
                            'Morango, laranja, pera', 'Rosa, cravo, malmequer',
                            'Chocolate, pudim, rebuçado', 'Cão, leão, peixe, formiga',
                            'Calças, saia, camisa, gravata', 'Portugal, Espanha, França',
                            'Carro, bicicleta, comboio', 'Alicate, martelo, chave de fendas',
                            'Natação, futebol, golfe', 'Cenoura, batata, tomate'
                        ]
                    },
                    {
                        id: 'sem-opostos',
                        nome: 'Opostos',
                        descricao: 'Dizer o contrário da palavra apresentada',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,
                        tabelaNormativa: 'sem-opostos',
                        segmentos: [25],  // Semântico-Implícito-Expressão-Oral
                        itens: [
                            'Noite', 'Alto', 'Claro', 'Longe', 'Fácil',
                            'Grosso', 'Doce', 'Largo', 'Mole', 'Seco'
                        ]
                    }
                ]
            },
            {
                id: 'morfossintaxe',
                nome: 'Estrutura Morfossintática',
                dominio: 'Morfossintático',  // multi-domínio: Morfológico + Sintático
                pontuacaoMaxima: 50,
                tabelaNormativa: 'morf-total',
                subtestes: [
                    {
                        id: 'morf-reconhecimento',
                        nome: 'Reconhecimento de frases agramaticais',
                        descricao: 'Julgar se a frase está correcta e corrigir',
                        pontuacaoMaxima: 20,
                        numItens: 10,
                        cotacaoMax: 2,  // 0, 1 ou 2
                        tabelaNormativa: 'morf-reconhecimento',
                        segmentos: [20],  // Sintático-Explícito-Compreensão-Oral
                        itens: [
                            'Eu levo a bola a Maria', 'Ele comeu duas banana',
                            'O Luís pôs o livro a mesa', 'O pai quer que a Ana vai dormir',
                            'A mãe vai João à loja', 'A Maria é minha primo',
                            'Eu vou-me embora parar de chover', 'Ele se penteia -se sozinho',
                            'O livro está na mesa é meu', 'Amanhã fui ver um filme'
                        ]
                    },
                    {
                        id: 'morf-coordenacao',
                        nome: 'Coordenação e subordinação de frases',
                        descricao: 'Juntar duas frases numa só',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,
                        tabelaNormativa: 'morf-coordenacao',
                        segmentos: [21],  // Sintático-Explícito-Expressão-Oral
                        itens: [
                            'O João caiu. Fez uma ferida',
                            'O Rui adoeceu. A mãe levou-o ao hospital',
                            'O menino foi passear. O pai foi passear',
                            'Eu tenho um carro. Eu tenho uma bola',
                            'A Ana comeu um bolo. O Zé comeu um bolo',
                            'A chávena caiu. A chávena não se partiu',
                            'São horas de dormir. O bebé vai para a cama',
                            'A Paula tem um gato. O gato come peixe',
                            'O rapaz põe um chapéu. O sol está muito quente',
                            'O Nuno quer comprar uma bola. A bola é muito cara'
                        ]
                    },
                    {
                        id: 'morf-ordem',
                        nome: 'Ordem de palavras na frase',
                        descricao: 'Ordenar palavras para formar frase correcta',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,
                        tabelaNormativa: 'morf-ordem',
                        segmentos: [17],  // Sintático-Implícito-Expressão-Oral
                        itens: [
                            'chora bebé o', 'menino o bolo o come',
                            'depressa carro o anda', 'partiu caneta a minha ele',
                            'olha a menina o para livro', 'casa onde a é',
                            'rapaz o cantou', 'bolo o come',
                            'anos tens quantos', 'vou cinema ao amanhã'
                        ]
                    },
                    {
                        id: 'morf-derivacao',
                        nome: 'Derivação de palavras',
                        descricao: 'Completar frase com palavra derivada',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,
                        tabelaNormativa: 'morf-derivacao',
                        segmentos: [13],  // Morfológico-Explícito-Expressão-Oral
                        itens: [
                            'O homem que pinta é um pin...',
                            'Uma árvore que dá peras é uma pe...',
                            'Uma casa pequena é uma ca...',
                            'Um rapaz que gosta de comer muito é um co...',
                            'Uma pessoa que sonha muito é uma so...',
                            'Uma senhora que toca piano é uma pi...',
                            'Um rapaz com uma barriga grande é um ba...',
                            'Um lugar com muitos pinheiros é um pi...',
                            'Se um desenho é muito giro, dizemos que é gi...',
                            'Um dia com vento é um dia ven...'
                        ]
                    }
                ]
            },
            {
                id: 'fonologica',
                nome: 'Estrutura Fonológica',
                dominio: 'Fonológico',
                pontuacaoMaxima: 40,
                tabelaNormativa: 'fono-total',
                subtestes: [
                    {
                        id: 'fono-disc-palavras',
                        nome: 'Discriminação de pares de palavras',
                        descricao: 'Dizer se dois palavras são iguais ou diferentes',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,
                        tabelaNormativa: 'fono-disc-palavras',
                        segmentos: [0],  // Fonológico-Implícito-Perceção-Oral
                        itens: [
                            'Doce–Doze', 'Gato–Cato', 'Dente–Dente',
                            'Trinta–Tinta', 'Vento–Vendo', 'Faca–Vaca',
                            'Bate–Bate', 'Dado–Nado', 'Frasco–Fraco',
                            'Roupa–Rouba'
                        ]
                    },
                    {
                        id: 'fono-disc-pseudo',
                        nome: 'Discriminação de pseudo-palavras',
                        descricao: 'Dizer se duas palavras inventadas são iguais ou diferentes',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,
                        tabelaNormativa: 'fono-disc-pseudo',
                        segmentos: [0],  // Fonológico-Implícito-Perceção-Oral
                        itens: [
                            'Caqui–Gaqui', 'Pul–Pul', 'Duzu–Duzu',
                            'Trico–Tico', 'Dodi–Todi', 'Volo–Folo',
                            'Tal–Tal', 'Deda–Neda', 'Drasque–Draque',
                            'Guibo–Guipo'
                        ]
                    },
                    {
                        id: 'fono-rimas',
                        nome: 'Identificação de palavras que rimam',
                        descricao: 'Dizer se as palavras rimam ou não',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,
                        tabelaNormativa: 'fono-rimas',
                        segmentos: [4],  // Fonológico-Explícito-Perceção-Oral
                        itens: [
                            'Fita–Guita', 'Saco–Saia', 'Tia–Mia',
                            'Jogo–Fogo', 'Bota–Mota', 'Feira–Beira',
                            'Mel–Pão', 'Comilão–Castelão', 'Pincel–Batel',
                            'Copo–Leite'
                        ]
                    },
                    {
                        id: 'fono-segmentacao',
                        nome: 'Segmentação silábica',
                        descricao: 'Dividir palavras em sílabas (bocadinhos)',
                        pontuacaoMaxima: 10,
                        numItens: 10,
                        cotacaoMax: 1,
                        tabelaNormativa: 'fono-segmentacao',
                        segmentos: [5],  // Fonológico-Explícito-Produção-Oral
                        itens: [
                            'Cama', 'Bolo', 'Batata', 'Cadeira', 'Mão',
                            'Sol', 'Colchão', 'Camisola', 'Erva', 'Flor'
                        ]
                    }
                ]
            }
        ]
    }

    // Futuras provas detalhadas adicionam-se aqui
};


// ============================================================================
// FUNÇÕES DE CÁLCULO GENÉRICAS
// ============================================================================

/**
 * Converte idade em texto (ex: "7;06" ou "7 anos e 6 meses") para meses
 */
function idadeParaMeses(idade) {
    if (typeof idade === 'number') return idade;
    if (!idade) return null;
    
    const str = String(idade).trim();
    
    // Formato "7;06" ou "7;6"
    const matchPontoVirgula = str.match(/^(\d+)[;:](\d+)$/);
    if (matchPontoVirgula) {
        return parseInt(matchPontoVirgula[1]) * 12 + parseInt(matchPontoVirgula[2]);
    }
    
    // Formato "7a6m" ou "7A6M"
    const matchAM = str.match(/^(\d+)\s*[aA]\s*(\d+)\s*[mM]?$/);
    if (matchAM) {
        return parseInt(matchAM[1]) * 12 + parseInt(matchAM[2]);
    }
    
    // Formato "7 anos" ou "7 anos e 6 meses"
    const matchAnos = str.match(/(\d+)\s*anos?\s*(?:e\s*(\d+)\s*mes(?:es)?)?/i);
    if (matchAnos) {
        const anos = parseInt(matchAnos[1]);
        const meses = matchAnos[2] ? parseInt(matchAnos[2]) : 0;
        return anos * 12 + meses;
    }
    
    // Se for só um número, assumir anos
    const num = parseFloat(str);
    if (!isNaN(num)) {
        if (num > 20) return Math.round(num); // já em meses
        return Math.round(num * 12); // anos → meses
    }
    
    return null;
}

/**
 * Encontra a norma adequada para uma idade (em meses) numa tabela normativa
 */
function encontrarNorma(tabelaArray, idadeMeses) {
    if (!tabelaArray || !idadeMeses) return null;
    
    for (const norma of tabelaArray) {
        if (idadeMeses >= norma.idadeMin && idadeMeses <= norma.idadeMax) {
            return norma;
        }
    }
    
    // Se a idade está fora do intervalo, usar a mais próxima
    if (idadeMeses < tabelaArray[0].idadeMin) {
        return tabelaArray[0]; // usar a faixa mais nova
    }
    if (idadeMeses > tabelaArray[tabelaArray.length - 1].idadeMax) {
        return tabelaArray[tabelaArray.length - 1]; // usar a faixa mais velha
    }
    
    return null;
}

/**
 * Calcula z-score a partir de pontuação bruta, média e desvio-padrão
 */
function calcularZScore(pontuacaoBruta, media, dp) {
    if (dp === 0) return 0;
    return (pontuacaoBruta - media) / dp;
}

/**
 * Calcula z-score para uma prova/subteste usando tabelas normativas
 * @param {string} provaId - ID da prova (ex: 'gol-e')
 * @param {string} subtesteId - ID do subteste/estrutura (ex: 'sem-definicao')
 * @param {number} pontuacaoBruta - Pontuação obtida
 * @param {number|string} idade - Idade (em meses ou formato texto)
 * @returns {object|null} { z, media, dp, norma }
 */
function calcularZScoreNormativo(provaId, subtesteId, pontuacaoBruta, idade) {
    const tabelasProva = TABELAS_NORMATIVAS[provaId];
    if (!tabelasProva) {
        console.warn(`Tabelas normativas não encontradas para: ${provaId}`);
        return null;
    }
    
    const tabela = tabelasProva[subtesteId];
    if (!tabela) {
        console.warn(`Subteste não encontrado: ${subtesteId} em ${provaId}`);
        return null;
    }
    
    const idadeMeses = idadeParaMeses(idade);
    if (!idadeMeses) {
        console.warn(`Idade inválida: ${idade}`);
        return null;
    }
    
    const norma = encontrarNorma(tabela, idadeMeses);
    if (!norma) {
        console.warn(`Norma não encontrada para idade ${idadeMeses} meses em ${subtesteId}`);
        return null;
    }
    
    const z = calcularZScore(pontuacaoBruta, norma.media, norma.dp);
    
    return {
        z: Math.round(z * 100) / 100,  // arredondar a 2 casas
        media: norma.media,
        dp: norma.dp,
        pontuacaoBruta,
        idadeMeses,
        faixaEtaria: `${Math.floor(norma.idadeMin/12)};${String(norma.idadeMin%12).padStart(2,'0')}–${Math.floor(norma.idadeMax/12)};${String(norma.idadeMax%12).padStart(2,'0')}`
    };
}

/**
 * Converte z-score para competência (escala 0-10 do PERLIM)
 * Mapeamento baseado na TABELA_CONVERSAO existente no data.js
 */
function converterZParaCompetencia(z) {
    if (z === null || z === undefined || isNaN(z)) return null;
    
    // Mapeamento z-score → competência (0-10)
    // Baseado na tabela de conversão do PERLIM
    if (z <= -2.0) return 1;      // Muito inferior
    if (z <= -1.5) return 2;      // Inferior
    if (z <= -1.0) return 3;      // Abaixo da média (baixo)
    if (z <= -0.5) return 4;      // Abaixo da média
    if (z <= 0.0)  return 5;      // Média
    if (z <= 0.5)  return 6;      // Média
    if (z <= 1.0)  return 7;      // Média alta
    if (z <= 1.5)  return 8;      // Acima da média
    if (z <= 2.0)  return 9;      // Superior
    return 10;                     // Muito superior
}

/**
 * Obter descrição qualitativa do z-score
 */
function descreverZScore(z) {
    if (z === null || z === undefined) return 'Sem dados';
    if (z <= -2.0) return 'Muito inferior';
    if (z <= -1.5) return 'Inferior';
    if (z <= -1.0) return 'Abaixo da média';
    if (z <= -0.5) return 'Ligeiramente abaixo da média';
    if (z <= 0.5)  return 'Dentro da média';
    if (z <= 1.0)  return 'Ligeiramente acima da média';
    if (z <= 1.5)  return 'Acima da média';
    if (z <= 2.0)  return 'Superior';
    return 'Muito superior';
}

/**
 * Obter zona de cor para z-score
 */
function zonaZScore(z) {
    if (z === null || z === undefined) return null;
    if (z <= -1.0) return 'red';
    if (z <= -0.5) return 'yellow';
    return 'green';
}

/**
 * Processa todos os subtestes de uma prova detalhada
 * @param {string} provaId - ID da prova
 * @param {object} pontuacoes - { subtesteId: pontuacaoBruta, ... }
 * @param {number|string} idade - Idade da criança
 * @returns {object} Resultados completos com z-scores e competências
 */
function processarProvaCompleta(provaId, pontuacoes, idade) {
    const prova = PROVAS_DETALHADAS[provaId];
    if (!prova) return null;
    
    const resultados = {
        provaId,
        provaNome: prova.nome,
        idade,
        idadeMeses: idadeParaMeses(idade),
        estruturas: [],
        segmentos: {},  // segId → competência (para alimentar o radar)
        totalBruto: 0,
        totalZ: null,
        totalCompetencia: null
    };
    
    let totalBruto = 0;
    
    prova.estruturas.forEach(estrutura => {
        const resultEstrutura = {
            id: estrutura.id,
            nome: estrutura.nome,
            dominio: estrutura.dominio,
            subtestes: [],
            totalBruto: 0,
            zScore: null,
            competencia: null
        };
        
        let estruturaBruto = 0;
        
        estrutura.subtestes.forEach(subteste => {
            const bruto = pontuacoes[subteste.id];
            if (bruto === undefined || bruto === null) return;
            
            const resultado = calcularZScoreNormativo(provaId, subteste.tabelaNormativa, bruto, idade);
            
            const resultSubteste = {
                id: subteste.id,
                nome: subteste.nome,
                pontuacaoBruta: bruto,
                pontuacaoMaxima: subteste.pontuacaoMaxima,
                zScore: resultado ? resultado.z : null,
                competencia: resultado ? converterZParaCompetencia(resultado.z) : null,
                descricao: resultado ? descreverZScore(resultado.z) : null,
                zona: resultado ? zonaZScore(resultado.z) : null,
                segmentos: subteste.segmentos
            };
            
            resultEstrutura.subtestes.push(resultSubteste);
            estruturaBruto += bruto;
            
            // Mapear para segmentos do radar
            if (resultSubteste.competencia !== null) {
                subteste.segmentos.forEach(segId => {
                    // Se já existe um valor, fazer média
                    if (resultados.segmentos[segId] !== undefined) {
                        resultados.segmentos[segId] = (resultados.segmentos[segId] + resultSubteste.competencia) / 2;
                    } else {
                        resultados.segmentos[segId] = resultSubteste.competencia;
                    }
                });
            }
        });
        
        resultEstrutura.totalBruto = estruturaBruto;
        
        // Z-score da estrutura total
        const resultEstruturaTotal = calcularZScoreNormativo(provaId, estrutura.tabelaNormativa, estruturaBruto, idade);
        if (resultEstruturaTotal) {
            resultEstrutura.zScore = resultEstruturaTotal.z;
            resultEstrutura.competencia = converterZParaCompetencia(resultEstruturaTotal.z);
        }
        
        resultados.estruturas.push(resultEstrutura);
        totalBruto += estruturaBruto;
    });
    
    // Total da prova
    resultados.totalBruto = totalBruto;
    const resultTotal = calcularZScoreNormativo(provaId, 'total', totalBruto, idade);
    if (resultTotal) {
        resultados.totalZ = resultTotal.z;
        resultados.totalCompetencia = converterZParaCompetencia(resultTotal.z);
    }
    
    return resultados;
}

/**
 * Verifica se uma prova tem tabelas normativas disponíveis
 */
function temTabelasNormativas(provaId) {
    return !!TABELAS_NORMATIVAS[provaId];
}

/**
 * Verifica se uma prova tem definição detalhada (com subtestes)
 */
function temProvaDetalhada(provaId) {
    return !!PROVAS_DETALHADAS[provaId];
}

/**
 * Lista todas as provas com tabelas normativas
 */
function listarProvasComNormas() {
    return Object.keys(TABELAS_NORMATIVAS);
}


// ============================================================================
// INTEGRAÇÃO AUTOMÁTICA COM PROVAS_SISTEMA (dropdown)
// ============================================================================

/**
 * Converte uma prova detalhada para o formato PROVAS_SISTEMA
 * Assim não é preciso manter dados em dois sítios
 */
function provaDetalhadaParaSistema(provaId) {
    const prova = PROVAS_DETALHADAS[provaId];
    if (!prova) return null;

    const todosSegs = new Set();
    const todasTarefas = [];

    prova.estruturas.forEach(est => {
        est.subtestes.forEach(sub => {
            sub.segmentos.forEach(s => todosSegs.add(s));
            todasTarefas.push({
                id: sub.id,
                nome: sub.nome,
                itens: sub.numItens
            });
        });
    });

    return {
        id: prova.id,
        nome: prova.nome,
        escala: prova.escalaConversao || 'z',
        dominio: 'Multi',
        segs: Array.from(todosSegs).sort((a, b) => a - b),
        desc: prova.nomeCompleto + ' (' + prova.autores + '). Cotação detalhada disponível.',
        tarefas: todasTarefas,
        temCotacaoDetalhada: true,
        idadeMin: prova.idadeMin,
        idadeMax: prova.idadeMax
    };
}

/**
 * Gera todas as entradas de provas detalhadas no formato PROVAS_SISTEMA
 */
function gerarProvasDetalhadasParaSistema() {
    return Object.keys(PROVAS_DETALHADAS).map(id => provaDetalhadaParaSistema(id)).filter(Boolean);
}

/**
 * Integra provas detalhadas com PROVAS_SISTEMA existente
 * - Provas detalhadas SUBSTITUEM provas do sistema com IDs que começam igual
 * - Ex: 'gol-e' substitui 'gol-e-morf'
 */
function integrarProvasDetalhadas() {
    if (typeof PROVAS_SISTEMA === 'undefined') {
        console.warn('PROVAS_SISTEMA não encontrado — a integração será feita depois');
        return;
    }

    const provasDetalhadas = gerarProvasDetalhadasParaSistema();
    const idsDetalhados = provasDetalhadas.map(p => p.id);

    // Remover do PROVAS_SISTEMA as que são substituídas
    const provasFiltradas = PROVAS_SISTEMA.filter(p => {
        return !idsDetalhados.some(detId => {
            return p.id === detId || p.id.startsWith(detId + '-');
        });
    });

    // Limpar e re-popular
    PROVAS_SISTEMA.length = 0;

    // Agrupar por domínio
    const provasPorDominio = {};
    provasFiltradas.forEach(p => {
        if (!provasPorDominio[p.dominio]) provasPorDominio[p.dominio] = [];
        provasPorDominio[p.dominio].push(p);
    });

    // Adicionar detalhadas — Multi vai para o início
    provasDetalhadas.forEach(p => {
        if (!provasPorDominio[p.dominio]) provasPorDominio[p.dominio] = [];
        provasPorDominio[p.dominio].unshift(p);
    });

    // Reconstruir na ordem dos domínios
    const ordemDominios = ['Multi', 'Fonológico', 'Morfológico', 'Sintático', 'Semântico', 'Pragmático'];
    ordemDominios.forEach(dom => {
        if (provasPorDominio[dom]) {
            provasPorDominio[dom].forEach(p => PROVAS_SISTEMA.push(p));
        }
    });

    // Domínios extra
    Object.keys(provasPorDominio).forEach(dom => {
        if (!ordemDominios.includes(dom)) {
            provasPorDominio[dom].forEach(p => PROVAS_SISTEMA.push(p));
        }
    });

    console.log(`   Provas detalhadas integradas: ${idsDetalhados.join(', ')}`);
    console.log(`   Total PROVAS_SISTEMA: ${PROVAS_SISTEMA.length}`);
}

// ============================================================================
// AUTO-INICIALIZAÇÃO
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', integrarProvasDetalhadas);
} else {
    integrarProvasDetalhadas();
}

// Log de confirmação
console.log('✅ Motor de Cálculos Normativos v1.1 carregado');
console.log(`   Provas com normas: ${listarProvasComNormas().join(', ')}`);
