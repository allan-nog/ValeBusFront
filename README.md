# 🚌 SRS Bus — Painel de Monitoramento

Sistema de monitoramento de ônibus em tempo real para Santa Rita do Sapucaí.  
Desenvolvido com HTML, CSS e JavaScript puro — sem frameworks, sem instalações.

---

## 📁 Estrutura de arquivos

```
srs-bus/
│
├── pages/
│   └── login.html           ← Tela de login
│
├── css/
│   ├── tokens.css           ← Variáveis globais: cores, fontes, espaçamentos, sombras
│   ├── global.css           ← Reset e estilos base compartilhados por todas as telas
│   └── login.css            ← Estilos específicos da tela de login
│
├── js/
│   └── login.js             ← Comportamento: validação, carregamento de SVGs, etc.
│
└── assets/
    └── svg/
        ├── icones-ui.svg    ← Sprite com todos os ícones do sistema
        └── cidade-fundo.svg ← Ilustração animada da cidade noturna
```

> **Regra de ouro:** cada nova tela que você criar ganha sua própria pasta em `css/` e `js/`.  
> Os arquivos `tokens.css` e `global.css` são sempre compartilhados — nunca duplique eles.

---

## ▶️ Como rodar

Não precisa instalar nada. Basta abrir o arquivo no navegador:

```
Clique duas vezes em login.html
```

Ou, se preferir via terminal:

```bash
# macOS
open login.html

# Linux
xdg-open login.html

# Windows
start login.html
```

---

## 🎨 Design System

Todo o visual do projeto parte de variáveis definidas em `tokens.css`.  
Isso significa que mudar uma cor ou fonte afeta o sistema inteiro — em um único lugar.

### Paleta de cores

| Variável               | Hex         | Uso                                   |
|------------------------|-------------|---------------------------------------|
| `--cor-marca`          | `#1a6fd4`   | Botões, links, bordas de foco         |
| `--cor-marca-escura`   | `#1456a8`   | Hover e estado ativo de botões        |
| `--cor-marca-clara`    | `#e8f0fd`   | Fundos sutis, badges                  |
| `--cor-fundo-escuro`   | `#0b1628`   | Fundo da tela de login (cidade)       |
| `--cor-fundo-painel`   | `#132040`   | Prédios e elementos da ilustração     |
| `--cor-sucesso`        | `#16a34a`   | Confirmações, status "no horário"     |
| `--cor-erro`           | `#dc2626`   | Erros de formulário, status "atrasado"|
| `--cor-aviso`          | `#f59e0b`   | Alertas e avisos                      |

### Tipografia

A fonte usada é a **Inter**, carregada via Google Fonts.  
Ela é limpa, legível em qualquer tamanho e usada por apps modernos de mobilidade (Uber, Moovit, 99).

---

## 🗂️ Como o CSS está organizado

O CSS é dividido em três camadas, sempre carregadas nessa ordem no `<head>`:

```html
<link rel="stylesheet" href="css/tokens.css">   <!-- 1º: variáveis -->
<link rel="stylesheet" href="css/global.css">   <!-- 2º: reset base -->
<link rel="stylesheet" href="css/login.css">    <!-- 3º: tela específica -->
```

Cada arquivo `login.css`, `mapa.css`, `cadastro.css` etc. é organizado em seções numeradas e comentadas:

```
1. Layout principal
2. Fundo / ilustração
3. Animações
4. Card / formulário
5. Campos
6. Botões
7. Mensagens de erro
8. Responsividade mobile
```


---

## 🖼️ Sistema de SVGs

Os SVGs do projeto são divididos em dois arquivos em `assets/svg/`, mantendo o HTML limpo.

### Por que não deixar o SVG direto no HTML?

SVG inline no HTML funciona, mas tem um problema: o arquivo fica enorme e difícil de ler. Imagine 200 linhas de código de ilustração misturadas com o formulário — qualquer membro da equipe que precisar editar o HTML vai se perder.

### Como o sprite de ícones funciona

O arquivo `icones-ui.svg` é um **sprite**: um único arquivo com vários ícones dentro de `<symbol>`. Cada símbolo tem um `id` único. Para usar um ícone no HTML, basta:

```html
<svg class="campo__icone" aria-hidden="true">
  <use href="../assets/svg/icones-ui.svg#icone-email"/>
</svg>
```

| ID do ícone         | Onde é usado                        |
|---------------------|-------------------------------------|
| `#icone-email`      | Campo de e-mail                     |
| `#icone-cadeado`    | Campo de senha                      |
| `#icone-olho`       | Botão mostrar senha                 |
| `#icone-olho-off`   | Botão ocultar senha                 |
| `#icone-seta`       | Botão entrar (estado normal)        |
| `#icone-loading`    | Botão entrar (estado carregando)    |
| `#icone-erro`       | Mensagem de erro do formulário      |
| `#icone-onibus`     | Logo do sistema                     |

### Por que o fundo é injetado via JavaScript?

O SVG da cidade usa classes CSS para animações (`janela-pisca`, `rota-animada-h`, etc.). Se carregado com `<img src="...">`, o SVG fica isolado e não enxerga o CSS da página — as animações não funcionam. A solução é o `login.js` buscar o arquivo via `fetch()` e injetar o conteúdo diretamente no DOM.

---

## ✨ Animações da tela de login

A tela de login tem um fundo animado de cidade noturna. Veja como cada animação funciona:

| Elemento                  | Como funciona                                                                 |
|---------------------------|-------------------------------------------------------------------------------|
| Linhas pontilhadas (ruas) | `stroke-dashoffset` animado — cria ilusão de estrada em movimento             |
| Ônibus deslizando         | `translateX` de -200px até 110vw em loop — dois ônibus com velocidades diferentes |
| Janelas piscando          | `opacity` alterna suavemente — delays escalonados para não piscar em sincronia|
| Pontos de parada          | Raio do círculo expande de 4 para 12 com fade — imita "ping" de GPS           |
| Card de login             | Sobe 20px com fade ao carregar — `cubic-bezier` para sensação elástica suave  |

---

## 🧩 Componentes reutilizáveis (planejados)

À medida que o projeto crescer, estes elementos virarão componentes independentes:

- **Campo de formulário** (`campo` + `campo__label` + `campo__input`) — já usado no login
- **Botão primário** (`.botao-entrar`) — será extraído para `components/botao.css`
- **Mensagem de erro** (`.erro-mensagem`) — reutilizável em cadastro e outros forms
- **Card** (`.form-card`) — base para cards de ônibus e linhas no painel principal

---

## 📋 Boas práticas adotadas

- **Nomenclatura BEM** — classes no padrão `bloco__elemento--modificador` (ex: `campo__input--erro`)
- **Variáveis CSS** — nenhuma cor ou tamanho "solto" no código; tudo vem de `tokens.css`
- **JavaScript sem jQuery** — DOM puro, sem dependências desnecessárias
- **Acessibilidade básica** — `aria-label`, `role="alert"`, `aria-live` nos elementos interativos
- **JS no final do `<body>`** — garante que o HTML carregue antes do script executar
- **`novalidate` no form** — desativa validação nativa do browser para controlar as mensagens em português

---

## 🗺️ Roadmap do projeto

### ✅ Etapa 1 — Tela de Login (concluída)
- [x] Fundo animado com cidade noturna
- [x] Card de login centralizado e responsivo
- [x] Campos de e-mail e senha com validação
- [x] Toggle mostrar/ocultar senha
- [x] Lembrar e-mail (localStorage)
- [x] Feedback visual no botão (loading → sucesso)
- [x] Mensagem de erro animada

### 🔲 Etapa 2 — Tela principal com mapa
- [ ] Layout com mapa (Leaflet.js) ocupando a tela
- [ ] Navbar com logo e status ao vivo
- [ ] Sidebar com lista de linhas
- [ ] Marcadores de ônibus no mapa

### 🔲 Etapa 3 — Cards e status em tempo real
- [ ] Cards de ônibus (próximo / atrasado / passou)
- [ ] Painel de ETA por ponto de parada
- [ ] Seletor de linhas com filtro ativo

### 🔲 Etapa 4 — Backend e dados reais
- [ ] API REST com Node.js + Express
- [ ] Simulador de GPS movendo ônibus nas rotas
- [ ] Socket.IO para atualização em tempo real
- [ ] Autenticação real substituindo a simulação

---

## 📦 Dependências externas

| Dependência          | Versão  | Para que serve                        | Como é carregada |
|----------------------|---------|---------------------------------------|------------------|
| Inter (Google Fonts) | —       | Tipografia do sistema                 | CDN no `<head>`  |
| _(nenhuma outra)_    | —       | —                                     | —                |

> Nas próximas etapas serão adicionados: **Leaflet.js** (mapas) e **Socket.IO** (tempo real).  
> Ambos também via CDN — sem necessidade de npm por enquanto.

---

## 👥 Organização da equipe (sugestão)

Para trabalhar em equipe sem conflitos, sugerimos dividir assim:

| Responsabilidade        | Arquivos envolvidos                  |
|-------------------------|--------------------------------------|
| Design / CSS            | `css/tokens.css`, `css/login.css`    |
| Estrutura HTML          | `login.html`                         |
| Comportamento JS        | `js/login.js`                        |
| Próxima tela (mapa)     | `mapa.html`, `css/mapa.css`          |

> **Dica:** nunca duas pessoas editam o mesmo arquivo ao mesmo tempo.  
> Use o Git para versionar — `git commit` a cada funcionalidade concluída.