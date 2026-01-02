/* ==========================================================================
   SUPABASE CLIENT - Substitui o antigo api.js do Emergent
   Mantém compatibilidade com o app.js existente através do objeto API
   ========================================================================== */

// Configuração do Supabase
const SUPABASE_URL = 'https://ioxseayeewybkkopczed.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jQvnAJfsqsVgARIMXD4_PA_aTm8l6Ng';

// Inicializar cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// OBJETO API - COMPATÍVEL COM app.js EXISTENTE
// ============================================================================

const API = {
    user: null,
    
    // Verificar se está autenticado
    isAuthenticated() {
        return this.user !== null;
    },
    
    // ========================================================================
    // AUTENTICAÇÃO
    // ========================================================================
    
    async register(nome, email, password) {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { nome: nome }
            }
        });
        
        if (error) throw new Error(traduzirErro(error.message));
        
        // Actualizar perfil com nome
        if (data.user) {
            await supabaseClient
                .from('profiles')
                .update({ nome: nome })
                .eq('id', data.user.id);
            
            this.user = {
                id: data.user.id,
                email: data.user.email,
                nome: nome
            };
        }
        
        return { user: this.user };
    },
    
    async login(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw new Error(traduzirErro(error.message));
        
        this.user = {
            id: data.user.id,
            email: data.user.email,
            nome: data.user.user_metadata?.nome || email.split('@')[0]
        };
        
        return { user: this.user };
    },
    
    logout() {
        supabaseClient.auth.signOut();
        this.user = null;
        window.location.reload();
    },
    
    // ========================================================================
    // CASOS
    // ========================================================================
    
    async listarCasos() {
        if (!this.user) return [];
        
        const { data, error } = await supabaseClient
            .from('casos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw new Error('Erro ao carregar casos');
        return data || [];
    },
    
    async obterCaso(id) {
        if (!this.user) return null;
        
        const { data: caso, error } = await supabaseClient
            .from('casos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw new Error('Erro ao carregar caso');
        
        // Buscar provas do caso
        const { data: provas } = await supabaseClient
            .from('provas_aplicadas')
            .select('*')
            .eq('caso_id', id);
        
        caso.provas = provas || [];
        return caso;
    },
    
    async guardarCaso(caso) {
        if (!this.user) throw new Error('Não autenticado');
        
        // Criar caso
        const { data: novoCaso, error: insertError } = await supabaseClient
            .from('casos')
            .insert([{
                user_id: this.user.id,
                codigo: caso.id || caso.codigo || 'SEM_CODIGO',
                nome: caso.nome || '',
                idade: caso.idade || '',
                ano_escolar: caso.escolaridade || '',
                data_avaliacao: caso.data || new Date().toISOString().split('T')[0],
                avaliador: caso.avaliador || '',
                notas: caso.notas || ''
            }])
            .select()
            .single();
        
        if (insertError) throw new Error('Erro ao guardar caso');
        
        // Inserir provas
        if (caso.provasAplicadas && caso.provasAplicadas.length > 0) {
            const provasParaInserir = caso.provasAplicadas.map(p => ({
                caso_id: novoCaso.id,
                prova_nome: p.prova || p.nome || '',
                prova_sigla: p.sigla || '',
                segmento: Array.isArray(p.segs) ? p.segs.join(',') : (p.segmento || ''),
                valor: p.valor,
                escala: p.esc || p.escala || '',
                competencia: p.comp || p.competencia || 0
            }));
            
            await supabaseClient
                .from('provas_aplicadas')
                .insert(provasParaInserir);
        }
        
        return novoCaso;
    },
    
    async actualizarCaso(id, dados) {
        if (!this.user) throw new Error('Não autenticado');
        
        const { error } = await supabaseClient
            .from('casos')
            .update({
                codigo: dados.id || dados.codigo,
                nome: dados.nome,
                idade: dados.idade,
                ano_escolar: dados.escolaridade,
                data_avaliacao: dados.data,
                avaliador: dados.avaliador,
                notas: dados.notas,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw new Error('Erro ao actualizar caso');
        return { success: true };
    },
    
    async eliminarCaso(id) {
        if (!this.user) throw new Error('Não autenticado');
        
        const { error } = await supabaseClient
            .from('casos')
            .delete()
            .eq('id', id);
        
        if (error) throw new Error('Erro ao eliminar caso');
        return { success: true };
    },
    
    async obterHistorico(casoId) {
        // Supabase não tem histórico automático - retornar vazio
        return [];
    },
    
    async criarSnapshot(casoId) {
        // Funcionalidade simplificada
        return { success: true };
    },
    
    // ========================================================================
    // PROVAS CUSTOM
    // ========================================================================
    
    async listarProvasCustom() {
        if (!this.user) return [];
        
        const { data, error } = await supabaseClient
            .from('provas_custom')
            .select('*')
            .order('nome');
        
        if (error) throw new Error('Erro ao carregar provas');
        
        // Converter formato para compatibilidade
        return (data || []).map(p => ({
            id: p.id,
            nome: p.nome,
            sigla: p.sigla,
            escala: p.escala,
            dominio: p.dominio,
            segmentos: p.segmentos || [],
            segs: p.segmentos || [],
            custom: true,
            tarefas: []
        }));
    },
    
    async criarProvaCustom(prova) {
        if (!this.user) throw new Error('Não autenticado');
        
        const { data, error } = await supabaseClient
            .from('provas_custom')
            .insert([{
                user_id: this.user.id,
                nome: prova.nome,
                sigla: prova.sigla || '',
                escala: prova.escala || 'perc',
                dominio: prova.dominio || '',
                segmentos: prova.segmentos || prova.segs || []
            }])
            .select()
            .single();
        
        if (error) throw new Error('Erro ao criar prova');
        return data;
    },
    
    async actualizarProvaCustom(id, prova) {
        if (!this.user) throw new Error('Não autenticado');
        
        const { error } = await supabaseClient
            .from('provas_custom')
            .update({
                nome: prova.nome,
                sigla: prova.sigla,
                escala: prova.escala,
                dominio: prova.dominio,
                segmentos: prova.segmentos || prova.segs
            })
            .eq('id', id);
        
        if (error) throw new Error('Erro ao actualizar prova');
        return { success: true };
    },
    
    async eliminarProvaCustom(id) {
        if (!this.user) throw new Error('Não autenticado');
        
        const { error } = await supabaseClient
            .from('provas_custom')
            .delete()
            .eq('id', id);
        
        if (error) throw new Error('Erro ao eliminar prova');
        return { success: true };
    },
    
    // ========================================================================
    // IA - PLANO TERAPÊUTICO (desactivado - pode ser adicionado depois)
    // ========================================================================
    
    async gerarPlanoIA(perfil, contextoAdicional = null) {
        // IA não está disponível nesta versão
        throw new Error('Funcionalidade de IA não disponível. Contacte o administrador para activar.');
    },
    
    async analiseAvancadaIA(perfil) {
        throw new Error('Funcionalidade de IA não disponível. Contacte o administrador para activar.');
    }
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function traduzirErro(msg) {
    const traducoes = {
        'Invalid login credentials': 'Email ou password incorretos',
        'Email not confirmed': 'Email não confirmado. Verifique a sua caixa de correio.',
        'User already registered': 'Este email já está registado',
        'Password should be at least 6 characters': 'A password deve ter pelo menos 6 caracteres',
        'Unable to validate email address: invalid format': 'Formato de email inválido',
        'Invalid email or password': 'Email ou password incorretos'
    };
    return traducoes[msg] || msg;
}

// ============================================================================
// GESTÃO DO ECRÃ DE LOGIN
// ============================================================================

function mostrarApp() {
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
}

function mostrarLogin() {
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
}

function inicializarEcraLogin() {
    const loginTabs = document.querySelectorAll('.login-tab');
    const loginForm = document.getElementById('login-form');
    const loginNomeGroup = document.getElementById('login-nome-group');
    const loginSubmit = document.getElementById('login-submit');
    const loginError = document.getElementById('login-error');
    
    let loginMode = 'login';
    
    // Trocar tabs
    loginTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            loginTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loginMode = tab.dataset.tab;
            
            if (loginMode === 'register') {
                loginNomeGroup.style.display = 'block';
                loginSubmit.textContent = 'Criar Conta';
            } else {
                loginNomeGroup.style.display = 'none';
                loginSubmit.textContent = 'Entrar';
            }
            loginError.textContent = '';
        });
    });
    
    // Submit do form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const nome = document.getElementById('login-nome').value;
            
            loginSubmit.disabled = true;
            loginSubmit.textContent = loginMode === 'login' ? 'A entrar...' : 'A criar conta...';
            loginError.textContent = '';
            
            try {
                if (loginMode === 'login') {
                    await API.login(email, password);
                } else {
                    if (!nome) throw new Error('Nome é obrigatório');
                    await API.register(nome, email, password);
                }
                mostrarApp();
                loginForm.reset();
            } catch (err) {
                loginError.textContent = err.message;
            } finally {
                loginSubmit.disabled = false;
                loginSubmit.textContent = loginMode === 'login' ? 'Entrar' : 'Criar Conta';
            }
        });
    }
}

// ============================================================================
// INICIALIZAÇÃO - VERIFICAR SESSÃO EXISTENTE
// ============================================================================

async function inicializarSessao() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            API.user = {
                id: session.user.id,
                email: session.user.email,
                nome: session.user.user_metadata?.nome || session.user.email.split('@')[0]
            };
            console.log('Sessão restaurada:', API.user.email);
            mostrarApp();
        } else {
            mostrarLogin();
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        mostrarLogin();
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    inicializarEcraLogin();
    inicializarSessao();
});

// Listener para mudanças de autenticação
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        API.user = {
            id: session.user.id,
            email: session.user.email,
            nome: session.user.user_metadata?.nome || session.user.email.split('@')[0]
        };
        mostrarApp();
    } else if (event === 'SIGNED_OUT') {
        API.user = null;
        mostrarLogin();
    }
});

// Exportar para uso global
window.API = API;
window.supabaseClient = supabaseClient;
