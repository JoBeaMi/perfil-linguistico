/* ==========================================================================
   PERLIM - Módulo Autenticação
   Login, logout, registo, gestão de sessão, UI de autenticação
   ========================================================================== */

function actualizarUIAuth() {
    try {
        const isAuth = API.isAuthenticated();
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');
        const userInfo = document.getElementById('user-info');
        if (isAuth && API.user) {
            userName.textContent = API.user.nome?.split(' ')[0] || '';
            userInfo.innerHTML = '<strong>' + API.user.nome + '</strong><small>' + API.user.email + '</small>';
            userMenu?.classList.add('authenticated');
        } else {
            if (userName) userName.textContent = '';
            if (userInfo) userInfo.innerHTML = '';
            userMenu?.classList.remove('authenticated');
        }
    } catch (e) { console.error('Erro ao actualizar UI auth:', e); }
}

function inicializarAuth() {
    try {
        actualizarUIAuth();
        document.getElementById('btn-user')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (API.isAuthenticated()) {
                document.getElementById('user-menu')?.classList.toggle('active');
            } else { abrirModal('modal-auth'); }
        });
        document.addEventListener('click', () => {
            document.getElementById('user-menu')?.classList.remove('active');
        });
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const modo = tab.dataset.auth;
                const titulo = document.getElementById('auth-title');
                if (titulo) titulo.textContent = modo === 'login' ? 'Entrar' : 'Criar Conta';
                const nomeGroup = document.getElementById('auth-nome-group');
                if (nomeGroup) nomeGroup.style.display = modo === 'register' ? 'block' : 'none';
                const submitBtn = document.getElementById('auth-submit');
                if (submitBtn) submitBtn.textContent = modo === 'login' ? 'Entrar' : 'Criar Conta';
                const errorEl = document.getElementById('auth-error');
                if (errorEl) errorEl.textContent = '';
            });
        });
        document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const modo = document.querySelector('.auth-tab.active')?.dataset.auth || 'login';
            const email = document.getElementById('auth-email')?.value;
            const password = document.getElementById('auth-password')?.value;
            const nome = document.getElementById('auth-nome')?.value;
            const errorEl = document.getElementById('auth-error');
            const submitBtn = document.getElementById('auth-submit');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'A processar...'; }
            if (errorEl) errorEl.textContent = '';
            try {
                if (modo === 'login') {
                    await API.login(email, password);
                    mostrarToast('Sessão iniciada!', 'success');
                } else {
                    if (!nome) throw new Error('Nome é obrigatório');
                    await API.register(nome, email, password);
                    mostrarToast('Conta criada com sucesso!', 'success');
                }
                fecharModal('modal-auth');
                actualizarUIAuth();
                carregarProvasCustomCloud();
            } catch (err) {
                if (errorEl) errorEl.textContent = err.message;
            } finally {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = modo === 'login' ? 'Entrar' : 'Criar Conta'; }
            }
        });
        document.getElementById('btn-logout')?.addEventListener('click', async () => {
            try { await API.logout(); mostrarToast('Sessão terminada', 'info'); actualizarUIAuth(); }
            catch (e) { console.error('Erro ao fazer logout:', e); }
        });
        console.log('✅ Módulo Auth inicializado');
    } catch (e) { console.error('❌ Erro ao inicializar módulo Auth:', e); }
}
