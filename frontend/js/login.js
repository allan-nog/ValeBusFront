/**
 * login.js — Comportamento da Tela de Login
 * ───────────────────────────────────────────
 * Responsabilidades:
 *  1. Carregar os SVGs externos (sprite de ícones + fundo da cidade) com fallback offline
 *  2. Mostrar/ocultar senha com toggle de acessibilidade
 *  3. Validar e destacar campos com erro (borda + mensagens + ARIA)
 *  4. Simular o processo de login com feedback visual
 *  5. Salvar e recuperar e-mail (lembrar-me)
 *  6. Lidar com eventos de cadastro e recuperação de senha
 */

/* ──────────────────────────────────────────────────────────
   1. SPRITE FALLBACK (Garante funcionamento offline / file://)
   ────────────────────────────────────────────────────────── */
const SPRITE_FALLBACK = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="icone-onibus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><rect x="2" y="3" width="20" height="15" rx="3"/><path d="M6 18v2"/><path d="M18 18v2"/><circle cx="7" cy="15" r="1"/><circle cx="17" cy="15" r="1"/>
  </symbol>
  <symbol id="icone-email" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </symbol>
  <symbol id="icone-cadeado" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </symbol>
  <symbol id="icone-olho" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </symbol>
  <symbol id="icone-olho-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>
  </symbol>
  <symbol id="icone-erro" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </symbol>
  <symbol id="icone-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </symbol>
  <symbol id="icone-loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </symbol>
</svg>`;

// Injeta sprite síncrono no DOM para que os ícones fiquem disponíveis imediatamente
const containerSprite = document.createElement('div');
containerSprite.setAttribute('aria-hidden', 'true');
containerSprite.style.display = 'none';
containerSprite.innerHTML = SPRITE_FALLBACK;
document.body.prepend(containerSprite);


/* ──────────────────────────────────────────────────────────
   2. CARREGAMENTO DOS SVGs EXTERNOS
   Caminho ajustado para 'assets/svg/...' a partir de login.html
   ────────────────────────────────────────────────────────── */
async function carregarSVG(caminho, elemento) {
  try {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
      throw new Error(`Erro ao carregar ${caminho}: ${resposta.status}`);
    }
    const conteudo = await resposta.text();
    elemento.innerHTML = conteudo;
  } catch (erro) {
    console.warn('Injeção externa do SVG omitida (usando fallback interno):', erro.message);
  }
}

// Tenta atualizar o sprite via fetch se disponível em servidor web
carregarSVG('assets/svg/icones-ui.svg', containerSprite);

// Injeta o SVG da cidade no container do fundo
const containerFundo = document.getElementById('fundo-cidade');
if (containerFundo) {
  carregarSVG('assets/svg/cidade-fundo.svg', containerFundo);
}


/* ──────────────────────────────────────────────────────────
   3. SELEÇÃO DE ELEMENTOS DO DOM
   ────────────────────────────────────────────────────────── */
const formulario    = document.getElementById('form-login');
const inputEmail    = document.getElementById('input-email');
const inputSenha    = document.getElementById('input-senha');
const botaoEntrar   = document.getElementById('botao-entrar');
const botaoOlho     = document.getElementById('botao-olho');
const erroMensagem  = document.getElementById('erro-mensagem');
const erroTexto     = document.getElementById('erro-texto');
const checkLembrar  = document.getElementById('lembrar-me');
const textoBotao    = document.getElementById('texto-botao');
const iconePadrao   = document.getElementById('icone-padrao');
const iconeLoading  = document.getElementById('icone-loading');
const botaoCadastro = document.getElementById('botao-cadastro');
const linkEsqueceu  = document.getElementById('link-esqueceu');


/* ──────────────────────────────────────────────────────────
   4. MOSTRAR / OCULTAR SENHA
   ────────────────────────────────────────────────────────── */
if (botaoOlho && inputSenha) {
  botaoOlho.addEventListener('click', function () {
    const estaOculta = inputSenha.type === 'password';
    inputSenha.type = estaOculta ? 'text' : 'password';

    const useEl = botaoOlho.querySelector('use');
    if (useEl) {
      useEl.setAttribute('href', estaOculta ? '#icone-olho-off' : '#icone-olho');
    }

    botaoOlho.setAttribute('aria-label', estaOculta ? 'Ocultar senha' : 'Mostrar senha');
  });
}


/* ──────────────────────────────────────────────────────────
   5. RECUPERAR E-MAIL SALVO (lembrar-me)
   ────────────────────────────────────────────────────────── */
(function carregarEmailSalvo() {
  try {
    const emailSalvo = localStorage.getItem('valebus_email');
    if (emailSalvo && inputEmail && checkLembrar) {
      inputEmail.value     = emailSalvo;
      checkLembrar.checked = true;
    }
  } catch (e) {
    // Tratamento gracioso caso localStorage esteja bloqueado no navegador
  }
})();


/* ──────────────────────────────────────────────────────────
   6. SUBMIT DO FORMULÁRIO COM VALIDAÇÃO COMPLETA
   ────────────────────────────────────────────────────────── */
if (formulario) {
  formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const email = inputEmail.value.trim();
    const senha = inputSenha.value;

    // Validação de E-mail
    if (!emailValido(email)) {
      mostrarErro('Informe um e-mail válido.', inputEmail);
      inputEmail.focus();
      return;
    }

    // Validação de Senha
    if (senha.length < 6) {
      mostrarErro('A senha deve ter pelo menos 6 caracteres.', inputSenha);
      inputSenha.focus();
      return;
    }

    // Persistência do E-mail
    try {
      if (checkLembrar && checkLembrar.checked) {
        localStorage.setItem('valebus_email', email);
      } else {
        localStorage.removeItem('valebus_email');
      }
    } catch (e) {
      // Ignora erro de cota ou política do navegador
    }

    ocultarErro();
    await simularLogin(email, senha);
  });
}


/* ──────────────────────────────────────────────────────────
   7. EVENTOS DOS BOTOES SECUNDÁRIOS
   ────────────────────────────────────────────────────────── */
if (botaoCadastro) {
  botaoCadastro.addEventListener('click', function() {
    alert('Tela de cadastro de novos usuários será carregada nas próximas etapas.');
  });
}

if (linkEsqueceu) {
  linkEsqueceu.addEventListener('click', function(e) {
    e.preventDefault();
    alert('Recuperação de senha: Um link de redefinição será enviado para o seu e-mail cadastrado.');
  });
}


/* ──────────────────────────────────────────────────────────
   8. SIMULAÇÃO DE LOGIN E REDIRECIONAMENTO
   ────────────────────────────────────────────────────────── */
async function simularLogin(email, senha) {
  setCarregando(true);

  try {
    await esperar(1200);

    const loginOk = email.length > 0 && senha.length >= 6;

    if (loginOk) {
      setCarregando(false);
      botaoEntrar.style.background = 'var(--cor-sucesso)';
      textoBotao.textContent       = 'Acesso autorizado!';
      iconePadrao.style.display    = 'none';
      iconeLoading.style.display   = 'none';

      await esperar(800);
      window.location.href = 'dashboard.html';
    } else {
      throw new Error('Credenciais inválidas.');
    }

  } catch (erro) {
    setCarregando(false);
    resetarBotao();
    mostrarErro(erro.message || 'Ocorreu um erro ao entrar. Tente novamente.', inputEmail);
  }
}


/* ──────────────────────────────────────────────────────────
   FUNÇÕES AUXILIARES DE INTERFACE
   ────────────────────────────────────────────────────────── */
function mostrarErro(mensagem, campoComErro = null) {
  if (erroTexto) erroTexto.textContent = mensagem;
  if (erroMensagem) erroMensagem.classList.remove('erro-mensagem--oculto');

  // Remove destaque prévio de erro
  if (inputEmail) {
    inputEmail.classList.remove('campo__input--erro');
    inputEmail.setAttribute('aria-invalid', 'false');
  }
  if (inputSenha) {
    inputSenha.classList.remove('campo__input--erro');
    inputSenha.setAttribute('aria-invalid', 'false');
  }

  // Aplica destaque de erro no campo específico
  if (campoComErro) {
    campoComErro.classList.add('campo__input--erro');
    campoComErro.setAttribute('aria-invalid', 'true');
  }
}

function ocultarErro() {
  if (erroMensagem) erroMensagem.classList.add('erro-mensagem--oculto');
  if (inputEmail) {
    inputEmail.classList.remove('campo__input--erro');
    inputEmail.setAttribute('aria-invalid', 'false');
  }
  if (inputSenha) {
    inputSenha.classList.remove('campo__input--erro');
    inputSenha.setAttribute('aria-invalid', 'false');
  }
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setCarregando(ativo) {
  if (botaoEntrar) botaoEntrar.disabled = ativo;
  if (iconePadrao) iconePadrao.style.display = ativo ? 'none'  : 'block';
  if (iconeLoading) iconeLoading.style.display = ativo ? 'block' : 'none';
  if (textoBotao) textoBotao.textContent = ativo ? 'Entrando no sistema...' : 'Entrar no sistema';
}

function resetarBotao() {
  if (botaoEntrar) {
    botaoEntrar.style.background = '';
    botaoEntrar.disabled = false;
  }
  if (iconePadrao) iconePadrao.style.display = 'block';
  if (iconeLoading) iconeLoading.style.display = 'none';
  if (textoBotao) textoBotao.textContent = 'Entrar no sistema';
}

// Limpa erro dinamicamente enquanto o usuário digita nos campos
if (inputEmail) inputEmail.addEventListener('input', ocultarErro);
if (inputSenha) inputSenha.addEventListener('input', ocultarErro);
