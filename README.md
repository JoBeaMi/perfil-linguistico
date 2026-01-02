# PERLIM  
## Perfil Linguístico Multidimensional

Ferramenta web para caracterização, leitura e interpretação de perfis linguísticos.

Baseada no modelo conceptual da linguagem oral (Alves, 2019)  
Conceptualização e operacionalização: Joana Miguel · CAIDI · CLUNL

---

## Enquadramento

O **PERLIM** é uma ferramenta profissional que permite **organizar, visualizar e interpretar informação linguística de forma multidimensional**, preservando a complexidade do funcionamento linguístico.

A ferramenta **apoia a formulação clínica e a tomada de decisão diagnóstica**, permitindo a identificação de padrões de funcionamento, assimetrias e níveis de severidade da dificuldade linguística.  
Não substitui instrumentos de avaliação estandardizados nem critérios diagnósticos formais, devendo ser utilizada como **ferramenta de integração e interpretação do perfil linguístico**.

---

## Modelo conceptual

O PERLIM operacionaliza o modelo conceptual da linguagem oral descrito por Alves (2019), no qual a linguagem é entendida como um sistema modular e funcional, organizado por diferentes níveis linguísticos e circuitos de processamento.

A estrutura do perfil assenta em quatro eixos fundamentais:

### Módulos linguísticos  
Fonológico · Morfológico · Sintático · Semântico · Pragmático

### Níveis de funcionamento  
Implícito (automático) · Explícito (metalinguístico)

### Circuitos de processamento  
Compreensão (input) · Expressão (output)

### Modalidades  
Oral · Escrita

A combinação destes eixos resulta em **40 segmentos funcionais**, que permitem uma leitura fina e integrada do perfil linguístico.

---

## Utilização clínica e interpretativa

O PERLIM permite:

- Caracterizar o perfil linguístico global e por domínios específicos  
- Identificar **assimetrias e dissociações funcionais** entre níveis linguísticos  
- Apoiar a **hipótese diagnóstica**, em articulação com outros dados clínicos  
- Contribuir para a **análise da severidade da dificuldade linguística**  
- Apoiar decisões de intervenção e monitorização do progresso  

---

## Funcionalidades

- Visualização do perfil linguístico através de um gráfico radar interactivo  
- Conversão automática entre diferentes métricas (Percentil, QI, Nota Z, Nota T)  
- Armazenamento seguro de dados na cloud (Supabase)  
- Contas de utilizador para terapeutas e investigadores  
- Interface responsiva (desktop, tablet e dispositivos móveis)  
- Modo claro e modo escuro  
- Exportação de resultados em PNG, JSON, CSV e relatório PDF

---

## Zonas de leitura do perfil

| Zona | Competência | Interpretação funcional |
| --- | --- | --- |
| 🔴 Vermelha | 0-3 | Dificuldade acentuada |
| 🟡 Amarela | 3-5 | Dificuldade moderada/ provável |
| ⚪ Branca | 5-10 | Desempenho típico |

---

## Demonstração

A aplicação pode ser explorada em:  
https://jobeami.github.io/perfil-linguistico

---

## Estrutura do projecto

```text
perfil-linguistico/
├── index.html
├── manifest.json
├── logo.png
├── logo-branco.png
├── css/
│   └── style.css
└── js/
    ├── supabase-client.js
    ├── data.js
    ├── radar.js
    └── app.js

## 📊 Zonas de Referência



## 📚 Referências

* Alves, D. (2019). Oral language. In The SAGE encyclopedia of human communication sciences and disorders (Vol. 4, pp. 1286–1289). SAGE Publications, Inc.
https://doi.org/10.4135/9781483380810.n425

* Freitas, M.J., Lousada, M., & Alves, D.C. (Eds.) (2022). *Linguística Clínica*. Language Science Press.

## 👩‍💻 Autoria

**Conceptualização e operacionalização:** Joana Miguel  
**Base teórica:** Dina Caetaneo Alves (2019)

## 📄 Licença

Este projecto está licenciado sob a MIT License.

---

**CAIDI** - Centro de Apoio e Intervenção no Desenvolvimento Infantil

*"Não precisamos de saber SE é PDL ou Dislexia — precisamos de saber QUAL É O PERFIL para intervir."*
