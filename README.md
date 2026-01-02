# 🎯 Perfil de Competência Linguística

**Ferramenta web para visualização multidimensional de perfis linguísticos**

Baseado nos **Quadrantes de Alves (2019)** · Operacionalização: Joana Miguel

## 📋 Descrição

Aplicação web que permite criar perfis linguísticos visuais, baseados no modelo de 40 dimensões mensuráveis.

### Estrutura do Perfil

| Dimensão | Categorias |
| --- | --- |
| **Módulos** | Fonológico, Morfológico, Sintático, Semântico, Pragmático |
| **Níveis** | Implícito (automático), Explícito (metalinguístico) |
| **Circuitos** | Compreensão (input), Expressão (output) |
| **Modalidades** | Oral, Escrita |

**Total: 5 × 2 × 2 × 2 = 40 segmentos**

## ✨ Funcionalidades

* 📊 **Radar Chart Interactivo** — Visualização clara do perfil completo
* 🔄 **Conversão Automática** — Suporta Percentil, QI, Nota Z, Nota T
* 💾 **Armazenamento na Cloud** — Dados guardados de forma segura (Supabase)
* 👥 **Contas de Utilizador** — Login para terapeutas/investigadores
* 📱 **Responsivo** — Funciona em desktop, tablet e mobile
* 🌙 **Dark Mode** — Tema claro e escuro
* 📤 **Exportação** — PNG, JSON, CSV, Relatório PDF

## 🚀 Demo

Aceda à aplicação em: **https://jobeami.github.io/perfil-linguistico**

## 📁 Estrutura do Projecto

```
perfil-linguistico/
├── index.html              # Página principal
├── manifest.json           # PWA manifest
├── logo.png                # Logo CAIDI
├── logo-branco.png         # Logo para dark mode
├── css/
│   └── style.css           # Estilos
└── js/
    ├── supabase-client.js  # Integração com Supabase
    ├── data.js             # Dados e conversões
    ├── radar.js            # Desenho do radar
    └── app.js              # Lógica principal
```

## 📊 Zonas de Referência

| Zona | Competência | Interpretação |
| --- | --- | --- |
| 🔴 Vermelha | 0-3 | Dificuldade Significativa |
| 🟡 Amarela | 3-5 | Dificuldade Provável |
| ⚪ Branca | 5-10 | Desempenho Típico |

## 📚 Referências

* Alves, D.C. (2019). Quadrantes das Manifestações Linguísticas.
* Freitas, M.J., Lousada, M., & Alves, D.C. (Eds.) (2022). *Linguística Clínica*. Language Science Press.

## 👩‍💻 Autoria

**Conceptualização e operacionalização:** Joana Miguel  
**Base teórica:** Dina Alves (Quadrantes, 2019)

## 📄 Licença

Este projecto está licenciado sob a MIT License.

---

**CAIDI** - Centro de Apoio e Intervenção no Desenvolvimento Infantil

*"Não precisamos de saber SE é PDL ou Dislexia — precisamos de saber QUAL É O PERFIL para intervir."*
