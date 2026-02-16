/* ==========================================================================
   PERLIM - UI Melhorias v1.0
   Confirm bonito, loading nos botoes, toasts com icone
   Adicionar ao index.html: <script defer src="js/ui-melhorias.js"></script>
   (DEPOIS do app.js)
   ========================================================================== */

// ============================================================================
// 1. CONFIRM DIALOG - substitui window.confirm()
// ============================================================================

function mostrarConfirm(opcoes) {
    return new Promise(function(resolve) {
        var titulo = opcoes.titulo || 'Confirmar';
        var mensagem = opcoes.mensagem || 'Tem a certeza?';
        var tipo = opcoes.tipo || 'warning';
        var btnConfirmar = opcoes.btnConfirmar || 'Sim';
        var btnCancelar = opcoes.btnCancelar || 'Cancelar';
        var estiloBtnConfirmar = opcoes.danger === false ? 'primary' : '';

        var icones = {
            warning: '\u26A0\uFE0F',
            danger: '\u274C',
            info: '\u2139\uFE0F'
        };

        var overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML =
            '<div class="confirm-dialog">' +
                '<div class="confirm-dialog-header">' +
                    '<div class="confirm-dialog-icon ' + tipo + '">' + (icones[tipo] || icones.warning) + '</div>' +
                    '<div class="confirm-dialog-title">' + titulo + '</div>' +
                '</div>' +
                '<div class="confirm-dialog-body">' + mensagem + '</div>' +
                '<div class="confirm-dialog-actions">' +
                    '<button class="confirm-btn confirm-btn-cancel">' + btnCancelar + '</button>' +
                    '<button class="confirm-btn confirm-btn-confirm ' + estiloBtnConfirmar + '">' + btnConfirmar + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var btnSim = overlay.querySelector('.confirm-btn-confirm');
        var btnNao = overlay.querySelector('.confirm-btn-cancel');

        function fechar(resultado) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.2s ease';
            setTimeout(function() {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 200);
            resolve(resultado);
        }

        btnSim.addEventListener('click', function() { fechar(true); });
        btnNao.addEventListener('click', function() { fechar(false); });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) fechar(false);
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                fechar(false);
                document.removeEventListener('keydown', handler);
            }
            if (e.key === 'Enter') {
                fechar(true);
                document.removeEventListener('keydown', handler);
            }
        });

        setTimeout(function() { btnSim.focus(); }, 100);
    });
}

// Substituir confirm() nativo globalmente
window._confirmOriginal = window.confirm;
window.mostrarConfirm = mostrarConfirm;


// ============================================================================
// 2. LOADING NOS BOTOES
// ============================================================================

function btnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.classList.add('is-loading');
        btn.disabled = true;
        btn.dataset.textoOriginal = btn.textContent;
    } else {
        btn.classList.remove('is-loading');
        btn.disabled = false;
    }
}

window.btnLoading = btnLoading;


// ============================================================================
// 3. MELHORAR TOASTS - Adicionar icone e barra de progresso
// ============================================================================

(function() {
    var toastOriginal = window.mostrarToast;
    if (!toastOriginal) return;

    var icones = {
        success: '\u2705',
        error: '\u274C',
        warning: '\u26A0\uFE0F',
        info: '\u2139\uFE0F'
    };

    window.mostrarToast = function(mensagem, tipo) {
        tipo = tipo || 'info';
        var container = document.getElementById('toast-container');
        if (!container) return;

        var toast = document.createElement('div');
        toast.className = 'toast ' + tipo;
        toast.innerHTML =
            '<span class="toast-icon">' + (icones[tipo] || icones.info) + '</span>' +
            '<span class="toast-message">' + mensagem + '</span>' +
            '<button class="toast-close" onclick="this.parentElement.remove()">\u00D7</button>' +
            '<div class="toast-progress"></div>';

        container.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3500);
    };
})();


// ============================================================================
// 4. INTEGRAR LOADING NOS BOTOES PRINCIPAIS
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Botao Gerar - mostrar loading enquanto gera
    var btnGerar = document.getElementById('btn-gerar');
    if (btnGerar) {
        var gerarOriginal = btnGerar.onclick;
        btnGerar.addEventListener('click', function() {
            btnLoading(btnGerar, true);
            setTimeout(function() {
                btnLoading(btnGerar, false);
            }, 1500);
        });
    }

    // Botao Guardar - mostrar loading
    var btnGuardar = document.getElementById('btn-guardar');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', function() {
            btnLoading(btnGuardar, true);
            setTimeout(function() {
                btnLoading(btnGuardar, false);
            }, 1000);
        });
    }

    console.log('\u2705 UI Melhorias carregadas (confirm, loading, toasts)');
});
