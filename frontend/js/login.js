/**
 * login.js — Comportamento da Tela de Login
 * ───────────────────────────────────────────
 * Responsabilidades:
 *  1. Carregar os SVGs externos (sprite de ícones + fundo da cidade)
 *  2. Mostrar/ocultar senha
 *  3. Validar o formulário
 *  4. Simular o processo de login com feedback visual
 *  5. Salvar e recuperar e-mail (lembrar-me)
 */


/* ──────────────────────────────────────────────────────────
   1. CARREGAMENTO DOS SVGs EXTERNOS
   ──────────────────────────────────────────────────────────
   Por que carregar via JS e não via <img src="...svg">?

   A tag <img> isola o SVG: ele não enxerga o CSS da página,
   então as animações e classes (janela-pisca, rota-animada-h)
   não funcionariam.

   A solução é buscar o conteúdo do arquivo SVG como texto
   e injetá-lo diretamente no DOM — assim ele se torna parte
   da página e herda todo o CSS normalmente.
   ────────────────────────────────────────────────────────── */
/**
 * Carrega um arquivo SVG e injeta seu conteúdo num elemento do DOM.
 * @param {string} caminho   - Caminho para o arquivo .svg
 * @param {Element} elemento - Elemento HTML onde o SVG será inserido
 */
async function carregarSVG(caminho, elemento) {
  try {
    const resposta = await fetch(caminho);

    if (!resposta.ok) {
      throw new Error(`Erro ao carregar ${caminho}: ${resposta.status}`);
    }

    const conteudo = await resposta.text();
    elemento.innerHTML = conteudo;

  } catch (erro) {
    console.warn('SVG não carregado:', erro.message);
    // A página continua funcionando mesmo sem o SVG decorativo
  }
}

// Injeta o sprite de ícones invisível no início do <body>
// O sprite precisa estar no DOM para que <use href="#id"> funcione
const containerSprite = document.createElement('div');
containerSprite.setAttribute('aria-hidden', 'true');
containerSprite.style.display = 'none';
document.body.prepend(containerSprite);
carregarSVG('../assets/svg/icones-ui.svg', containerSprite);
console.log(
  document.querySelector('symbol#icone-loading')
);

// Injeta o SVG da cidade noturna no container do fundo
const containerFundo = document.getElementById('fundo-cidade');
if (containerFundo) {
  carregarSVG('../assets/svg/cidade-fundo.svg', containerFundo);
}


/* ──────────────────────────────────────────────────────────
   2. SELEÇÃO DE ELEMENTOS DO DOM
   Sempre selecione elementos uma única vez, no início.
   ────────────────────────────────────────────────────────── */

const formulario   = document.getElementById('form-login');
const inputEmail   = document.getElementById('input-email');
const inputSenha   = document.getElementById('input-senha');
const botaoEntrar  = document.getElementById('botao-entrar');
const botaoOlho    = document.getElementById('botao-olho');
const erroMensagem = document.getElementById('erro-mensagem');
const erroTexto    = document.getElementById('erro-texto');
const checkLembrar = document.getElementById('lembrar-me');
const textoBotao   = document.getElementById('texto-botao');
const iconepadrao  = document.getElementById('icone-padrao');
const iconeLoading = document.getElementById('icone-loading');


/* ──────────────────────────────────────────────────────────
   3. MOSTRAR / OCULTAR SENHA
   Alterna o tipo do campo e troca o ícone via <use href>.
   ────────────────────────────────────────────────────────── */

botaoOlho.addEventListener('click', function () {
  const estaOculta = inputSenha.type === 'password';

  inputSenha.type = estaOculta ? 'text' : 'password';

  // Atualiza o href do <use> para trocar o ícone no sprite
  const useEl = botaoOlho.querySelector('use');
  if (useEl) {
    useEl.setAttribute(
      'href',
      estaOculta
        ? '#icone-olho-off'
        : '#icone-olho'
    );
  }

  botaoOlho.setAttribute(
    'aria-label',
    estaOculta ? 'Ocultar senha' : 'Mostrar senha'
  );
});


/* ──────────────────────────────────────────────────────────
   4. RECUPERAR E-MAIL SALVO (lembrar-me)
   ────────────────────────────────────────────────────────── */

(function carregarEmailSalvo() {
  const emailSalvo = localStorage.getItem('valebus_email');
  if (emailSalvo) {
    inputEmail.value     = emailSalvo;
    checkLembrar.checked = true;
  }
})();


/* ──────────────────────────────────────────────────────────
   5. SUBMIT DO FORMULÁRIO
   ────────────────────────────────────────────────────────── */

formulario.addEventListener('submit', async function (evento) {
  evento.preventDefault();

  const email = inputEmail.value.trim();
  const senha = inputSenha.value;

  if (!emailValido(email)) {
    mostrarErro('Informe um e-mail válido.');
    inputEmail.focus();
    return;
  }

  if (senha.length < 6) {
    mostrarErro('A senha deve ter pelo menos 6 caracteres.');
    inputSenha.focus();
    return;
  }

  if (checkLembrar.checked) {
    localStorage.setItem('valebus_email', email);
  } else {
    localStorage.removeItem('valebus_email');
  }

  ocultarErro();
  await simularLogin(email, senha);
});


/* ──────────────────────────────────────────────────────────
   6. SIMULAÇÃO DE LOGIN
   Substitua o setTimeout por fetch() quando integrar o backend.

   EXEMPLO FUTURO:
     const resposta = await fetch('/api/login', {
       method:  'POST',
       headers: { 'Content-Type': 'application/json' },
       body:    JSON.stringify({ email, senha })
     });
     if (!resposta.ok) throw new Error('Credenciais inválidas.');
   ────────────────────────────────────────────────────────── */

async function simularLogin(email, senha) {
  setCarregando(true);

  try {
    await esperar(1500);

    const loginOk = email.length > 0 && senha.length >= 6;

    if (loginOk) {
      setCarregando(false);
      botaoEntrar.style.background = 'var(--cor-sucesso)';
      textoBotao.textContent = 'Acesso autorizado!';
      iconepadrao.style.display  = 'none';
      iconeLoading.style.display = 'none';

      await esperar(1200);

      window.location.href = '../pages/dashboard.html'
      // alert('✅ Login simulado!\n\nNa próxima etapa você será redirecionado para o painel.');
      resetarBotao();

    } else {
      throw new Error('Credenciais inválidas.');
    }

  } catch (erro) {
    setCarregando(false);
    resetarBotao();
    mostrarErro(erro.message || 'Ocorreu um erro. Tente novamente.');
  }
}


/* ──────────────────────────────────────────────────────────
   FUNÇÕES AUXILIARES
   ────────────────────────────────────────────────────────── */

function mostrarErro(mensagem) {
  erroTexto.textContent = mensagem;
  erroMensagem.classList.remove('erro-mensagem--oculto');
}

function ocultarErro() {
  erroMensagem.classList.add('erro-mensagem--oculto');
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setCarregando(ativo) {
  botaoEntrar.disabled       = ativo;
  iconepadrao.style.display  = ativo ? 'none'  : 'block';
  iconeLoading.style.display = ativo ? 'block' : 'none';
  textoBotao.textContent     = ativo ? 'Entrando...' : 'Entrar no sistema';
}

function resetarBotao() {
  botaoEntrar.style.background = '';
  botaoEntrar.disabled         = false;
  iconepadrao.style.display    = 'block';
  iconeLoading.style.display   = 'none';
  textoBotao.textContent       = 'Entrar no sistema';
}

// Limpa erro enquanto o usuário corrige os campos
inputEmail.addEventListener('input', ocultarErro);
inputSenha.addEventListener('input', ocultarErro);