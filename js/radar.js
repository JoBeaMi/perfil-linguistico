/* ==========================================================================
   PERFIL DE COMPETÊNCIA LINGUÍSTICA - Radar Chart Module v3.1
   Desenho dinâmico do gráfico radar em Canvas
   ========================================================================== */

class RadarChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas não encontrado:', canvasId);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        
        // Configurações
        this.config = {
            rCompetencia: 0.52,
            rModalidade: [0.55, 0.60],
            rCircuito: [0.62, 0.68],
            rNivel: [0.70, 0.77],
            rModulo: [0.79, 0.90],
            animationDuration: 300,
            ...options
        };
        
        // Estado
        this.dados = null;
        this.dadosAnimados = new Array(40).fill(0);
        this.casoInfo = null;
        this.escritaAtiva = true;
        this.zoom = 1;
        this.animationFrame = null;
        this.lastUpdate = 0;
        
        // Callbacks
        this.onUpdate = null;
        
        // Detectar tema
        this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // Inicializar
        this.resize();
        this.setupListeners();
    }
    
    setupListeners() {
        window.addEventListener('resize', () => this.resize());
        
        // Observar mudanças de tema
        const observer = new MutationObserver(() => {
            this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
            this.desenhar();
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    
    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const size = Math.min(container.clientWidth, 800) * this.zoom;
        
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.canvas.width = size * this.dpr;
        this.canvas.height = size * this.dpr;
        
        this.size = size * this.dpr;
        this.centro = this.size / 2;
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.dpr, this.dpr);
        
        this.desenhar();
    }
    
    /**
     * Actualizar dados com animação
     */
    setDados(dados, casoInfo = null, escritaAtiva = true) {
        this.dados = dados;
        this.casoInfo = casoInfo;
        this.escritaAtiva = escritaAtiva;
        
        // Animar transição
        if (this.config.animationDuration > 0 && dados) {
            this.animarTransicao();
        } else {
            if (dados) {
                this.dadosAnimados = [...dados];
            }
            this.desenhar();
        }
    }
    
    /**
     * Actualizar um único valor (para actualização dinâmica)
     */
    setValor(index, valor) {
        if (!this.dados) {
            this.dados = new Array(40).fill(null);
        }
        
        this.dados[index] = valor;
        
        // Animação suave para o valor individual
        const targetValue = valor !== null ? valor : 0;
        const currentValue = this.dadosAnimados[index] || 0;
        
        const startTime = performance.now();
        const duration = 200;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            
            this.dadosAnimados[index] = currentValue + (targetValue - currentValue) * easeProgress;
            this.desenhar();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.dadosAnimados[index] = targetValue;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Animação de transição completa
     */
    animarTransicao() {
        const startValues = [...this.dadosAnimados];
        const targetValues = this.dados.map(v => v !== null ? v : 0);
        
        const startTime = performance.now();
        const duration = this.config.animationDuration;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            for (let i = 0; i < 40; i++) {
                this.dadosAnimados[i] = startValues[i] + (targetValues[i] - startValues[i]) * easeProgress;
            }
            
            this.desenhar();
            
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    setZoom(zoom) {
        this.zoom = Math.max(0.5, Math.min(2, zoom));
        this.resize();
    }
    
    setEscritaAtiva(ativa) {
        this.escritaAtiva = ativa;
        this.desenhar();
    }
    
    /**
     * Desenhar o radar completo
     */
    desenhar() {
        const ctx = this.ctx;
        const size = this.size / this.dpr;
        const centro = size / 2;
        const rMax = centro * this.config.rCompetencia;
        
        // Cores adaptadas ao tema
        const cores = this.obterCores();
        
        // Limpar canvas
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = cores.bg;
        ctx.fillRect(0, 0, size, size);
        
        // Zonas de fundo
        this.desenharZonas(ctx, centro, rMax, cores);
        
        // Grelha
        this.desenharGrelha(ctx, centro, rMax, cores);
        
        // Pétalas de competência
        this.desenharPetalas(ctx, centro, rMax, cores);
        
        // Anéis hierárquicos
        this.desenharAnelModalidade(ctx, centro, cores);
        this.desenharAnelCircuito(ctx, centro, cores);
        this.desenharAnelNivel(ctx, centro, cores);
        this.desenharAnelModulo(ctx, centro, cores);
        
        // Separadores
        this.desenharSeparadores(ctx, centro, cores);
        
        // Etiquetas
        this.desenharEtiquetas(ctx, centro, rMax, cores);
    }
    
    obterCores() {
        if (this.isDarkMode) {
            return {
                bg: '#1E293B',
                zonaVermelha: '#3D1F1F',
                zonaAmarela: '#3D3520',
                zonaBranca: '#2A2A3A',
                borderRed: '#EF5350',
                borderYellow: '#FFB300',
                grid: '#475569',
                gridLight: '#334155',
                text: '#E2E8F0',
                separator: '#0F172A',
                modalOdd: '#475569',
                modalEven: '#334155',
                circComp: '#1E3A5F',
                circExpr: '#3D2B1F',
                nivOdd: '#1F3D2E',
                nivEven: '#2D4A3A'
            };
        }
        return {
            bg: '#FFFFFF',
            zonaVermelha: '#FFEBEE',
            zonaAmarela: '#FFFDE7',
            zonaBranca: '#FFFFFF',
            borderRed: '#EF9A9A',
            borderYellow: '#FFE082',
            grid: '#E0E0E0',
            gridLight: '#F0F0F0',
            text: '#424242',
            separator: '#333333',
            modalOdd: '#F5F5F5',
            modalEven: '#E8E8E8',
            circComp: '#BBDEFB',
            circExpr: '#FFCCBC',
            nivOdd: '#E8F5E9',
            nivEven: '#C8E6C9'
        };
    }
    
    desenharZonas(ctx, centro, rMax, cores) {
        const r3 = RAIOS_ACUMULADOS[3] * rMax;
        const r5 = RAIOS_ACUMULADOS[5] * rMax;
        
        ctx.beginPath();
        ctx.arc(centro, centro, rMax, 0, Math.PI * 2);
        ctx.fillStyle = cores.zonaBranca;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centro, centro, r5, 0, Math.PI * 2);
        ctx.fillStyle = cores.zonaAmarela;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centro, centro, r3, 0, Math.PI * 2);
        ctx.fillStyle = cores.zonaVermelha;
        ctx.fill();
    }
    
    desenharGrelha(ctx, centro, rMax, cores) {
        // Círculos concêntricos
        for (let i = 1; i <= 10; i++) {
            const r = RAIOS_ACUMULADOS[i] * rMax;
            
            ctx.beginPath();
            ctx.arc(centro, centro, r, 0, Math.PI * 2);
            
            if (i === 3) {
                ctx.strokeStyle = cores.borderRed;
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
            } else if (i === 5) {
                ctx.strokeStyle = cores.borderYellow;
                ctx.lineWidth = 2.5;
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = cores.grid;
                ctx.lineWidth = 0.5;
                ctx.setLineDash([3, 3]);
            }
            
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Linhas radiais
        for (let i = 0; i < 40; i++) {
            const angulo = (i / 40) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(centro, centro);
            ctx.lineTo(centro + rMax * Math.cos(angulo), centro + rMax * Math.sin(angulo));
            ctx.strokeStyle = cores.gridLight;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }
    
    desenharPetalas(ctx, centro, rMax, cores) {
        const gap = 0.012;
        const valoresParaDesenhar = this.dados ? this.dadosAnimados : [];
        
        valoresParaDesenhar.forEach((comp, idx) => {
            // Verificar se o valor original é null
            if (this.dados && this.dados[idx] === null) return;
            if (comp === null || comp === undefined || comp === 0) return;
            
            // Se é escrita e escrita não está activa, não desenhar
            const seg = SEGMENTOS[idx];
            if (seg.modalidade === 1 && !this.escritaAtiva) return;
            
            const raio = competenciaParaRaio(comp) * rMax;
            if (raio < 1) return;
            
            const a0 = (idx / 40) * Math.PI * 2 - Math.PI / 2 + gap;
            const a1 = ((idx + 1) / 40) * Math.PI * 2 - Math.PI / 2 - gap;
            
            // Cor do módulo
            const cor = MODULOS[seg.modulo].cor;
            
            ctx.beginPath();
            ctx.moveTo(centro, centro);
            ctx.arc(centro, centro, raio, a0, a1);
            ctx.closePath();
            
            ctx.fillStyle = cor;
            ctx.globalAlpha = 0.85;
            ctx.fill();
            ctx.globalAlpha = 1;
            
            ctx.strokeStyle = cores.bg;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    }
    
    desenharAnelModalidade(ctx, centro, cores) {
        const r1 = centro * this.config.rModalidade[0];
        const r2 = centro * this.config.rModalidade[1];
        const txtColor = this.isDarkMode ? '#94A3B8' : '#666666';
        
        for (let i = 0; i < 40; i++) {
            const modalIdx = i % 2;
            const a0 = (i / 40) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((i + 1) / 40) * Math.PI * 2 - Math.PI / 2;
            
            // Se é escrita e escrita não está activa, usar cor mais escura
            const isEscrita = modalIdx === 1;
            let fillColor = modalIdx === 0 ? cores.modalOdd : cores.modalEven;
            
            if (isEscrita && !this.escritaAtiva) {
                fillColor = this.isDarkMode ? '#1E293B' : '#E0E0E0';
            }
            
            ctx.beginPath();
            ctx.arc(centro, centro, r2, a0, a1);
            ctx.arc(centro, centro, r1, a1, a0, true);
            ctx.closePath();
            
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = cores.bg;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            const label = isEscrita && !this.escritaAtiva ? '—' : MODALIDADES[modalIdx].nome[0];
            const labelColor = isEscrita && !this.escritaAtiva ? (this.isDarkMode ? '#475569' : '#BDBDBD') : txtColor;
            this.desenharTextoArco(ctx, centro, (r1 + r2) / 2, a0, a1, label, 9, labelColor);
        }
    }
    
    desenharAnelCircuito(ctx, centro, cores) {
        const r1 = centro * this.config.rCircuito[0];
        const r2 = centro * this.config.rCircuito[1];
        const txtColor = this.isDarkMode ? '#CBD5E1' : '#555555';
        
        // Nomes dos circuitos por módulo
        const nomesCircuito = {
            lexical: ['Compreensão', 'Expressão'],
            sublexical: ['Perceção', 'Produção']
        };
        
        for (let i = 0; i < 20; i++) {
            const circIdx = i % 2;
            const modIdx = Math.floor(i / 4); // 4 secções por módulo (20/5)
            const a0 = (i / 20) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((i + 1) / 20) * Math.PI * 2 - Math.PI / 2;
            
            ctx.beginPath();
            ctx.arc(centro, centro, r2, a0, a1);
            ctx.arc(centro, centro, r1, a1, a0, true);
            ctx.closePath();
            
            ctx.fillStyle = circIdx === 0 ? cores.circComp : cores.circExpr;
            ctx.fill();
            ctx.strokeStyle = cores.bg;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Usar terminologia sublexical para Fonológico (modIdx=0)
            const nomes = (modIdx === 0) ? nomesCircuito.sublexical : nomesCircuito.lexical;
            this.desenharTextoArco(ctx, centro, (r1 + r2) / 2, a0, a1, nomes[circIdx], 9, txtColor);
        }
    }
    
    desenharAnelNivel(ctx, centro, cores) {
        const r1 = centro * this.config.rNivel[0];
        const r2 = centro * this.config.rNivel[1];
        const txtColor = this.isDarkMode ? '#A7F3D0' : '#2E7D32';
        
        for (let i = 0; i < 10; i++) {
            const nivIdx = i % 2;
            const a0 = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((i + 1) / 10) * Math.PI * 2 - Math.PI / 2;
            
            ctx.beginPath();
            ctx.arc(centro, centro, r2, a0, a1);
            ctx.arc(centro, centro, r1, a1, a0, true);
            ctx.closePath();
            
            ctx.fillStyle = nivIdx === 0 ? cores.nivOdd : cores.nivEven;
            ctx.fill();
            ctx.strokeStyle = cores.bg;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            this.desenharTextoArco(ctx, centro, (r1 + r2) / 2, a0, a1, NIVEIS[nivIdx].nome, 10, txtColor);
        }
    }
    
    desenharAnelModulo(ctx, centro, cores) {
        const r1 = centro * this.config.rModulo[0];
        const r2 = centro * this.config.rModulo[1];
        
        for (let i = 0; i < 5; i++) {
            const a0 = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2;
            
            ctx.beginPath();
            ctx.arc(centro, centro, r2, a0, a1);
            ctx.arc(centro, centro, r1, a1, a0, true);
            ctx.closePath();
            
            ctx.fillStyle = MODULOS[i].cor;
            ctx.fill();
            ctx.strokeStyle = cores.bg;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            this.desenharTextoArco(ctx, centro, (r1 + r2) / 2, a0, a1, MODULOS[i].nome, 13, '#FFFFFF', true);
        }
    }
    
    desenharTextoArco(ctx, centro, raio, a0, a1, texto, fontSize, cor, bold = false) {
        const am = (a0 + a1) / 2;
        const flip = am > 0 && am < Math.PI;
        
        ctx.save();
        ctx.font = (bold ? 'bold ' : '') + fontSize + 'px Inter, sans-serif';
        ctx.fillStyle = cor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (texto.length <= 2) {
            const x = centro + raio * Math.cos(am);
            const y = centro + raio * Math.sin(am);
            ctx.translate(x, y);
            ctx.rotate(am + (flip ? -Math.PI / 2 : Math.PI / 2));
            ctx.fillText(texto, 0, 0);
        } else {
            const charW = ctx.measureText('M').width * 0.75;
            const totalW = texto.length * charW;
            const arcLen = raio * (a1 - a0);
            const startA = flip ? a1 - ((arcLen - totalW) / 2) / raio : a0 + ((arcLen - totalW) / 2) / raio;
            const dir = flip ? -1 : 1;
            
            let curA = startA;
            for (let j = 0; j < texto.length; j++) {
                curA += dir * charW / 2 / raio;
                const x = centro + raio * Math.cos(curA);
                const y = centro + raio * Math.sin(curA);
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(curA + (flip ? -Math.PI / 2 : Math.PI / 2));
                ctx.fillText(texto[j], 0, 0);
                ctx.restore();
                curA += dir * charW / 2 / raio;
            }
        }
        ctx.restore();
    }
    
    desenharSeparadores(ctx, centro, cores) {
        const rMax = centro * this.config.rModulo[1];
        ctx.strokeStyle = cores.separator;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 5; i++) {
            const angulo = (i / 5) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(centro, centro);
            ctx.lineTo(centro + rMax * Math.cos(angulo), centro + rMax * Math.sin(angulo));
            ctx.stroke();
        }
    }
    
    desenharEtiquetas(ctx, centro, rMax, cores) {
        const r3 = RAIOS_ACUMULADOS[3] * rMax;
        const r5 = RAIOS_ACUMULADOS[5] * rMax;
        
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = cores.borderRed;
        ctx.fillText('3', centro + 8, centro - r3 + 2);
        
        ctx.fillStyle = cores.borderYellow;
        ctx.fillText('5', centro + 8, centro - r5 + 2);
        
        ctx.fillStyle = this.isDarkMode ? '#64748B' : '#9E9E9E';
        ctx.fillText('10', centro + 8, centro - rMax + 2);
    }
    
    toDataURL(format = 'image/png', quality = 1) {
        return this.canvas.toDataURL(format, quality);
    }
    
    downloadPNG(filename = 'perfil.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.toDataURL('image/png');
        link.click();
    }
}
