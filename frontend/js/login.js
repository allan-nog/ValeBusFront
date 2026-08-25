/**
 * login.js — Comportamento da Tela de Login do ValeBus
 * ──────────────────────────────────────────────────────────
 * Responsabilidades:
 *  1. Gerenciamento do Fundo Dinâmico baseado no horário do dia (Manhã, Tarde, Noite)
 *  2. Controles de Demonstração (Permite aos avaliadores da feira alternar o tema ao vivo)
 *  3. Autenticação e Integração com o Google (Modal de Contas + Sincronização)
 *  4. Carregamento do SVG da Cidade com Fallback Offline
 *  5. Validação de Formulário com Acessibilidade e Feedback Visual
 *  6. Mostrar/Ocultar Senha
 *  7. Persistência de E-mail (Lembrar-me)
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. SPRITE DE ÍCONES SÍNCRONO (GARANTE OFFLINE / FILE://)
     ────────────────────────────────────────────────────────── */
  const SPRITE_FALLBACK = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
    <symbol id="icone-onibus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
      <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
      <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
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
    <symbol id="icone-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </symbol>
  </svg>`;

  const containerSprite = document.createElement('div');
  containerSprite.setAttribute('aria-hidden', 'true');
  containerSprite.style.display = 'none';
  containerSprite.innerHTML = SPRITE_FALLBACK;
  document.body.prepend(containerSprite);


  /* ──────────────────────────────────────────────────────────
     2. CARREGAMENTO DO SVG DA CIDADE
     ────────────────────────────────────────────────────────── */
  const containerFundo = document.getElementById('fundo-cidade');
  if (containerFundo) {
    fetch('assets/svg/cidade-fundo.svg')
      .then(res => res.ok ? res.text() : Promise.reject('SVG not found'))
      .then(svgText => {
        containerFundo.innerHTML = svgText;
      })
      .catch(err => {
        console.warn('Injeção externa do SVG:', err);
      });
  }


  /* ──────────────────────────────────────────────────────────
     3. TEMA DINÂMICO AUTOMÁTICO BASEADO NO HORÁRIO DO DIA
     ────────────────────────────────────────────────────────── */
  const elFundo    = document.getElementById('login-fundo');
  const badgeIcone = document.getElementById('badge-icone');
  const badgeTexto = document.getElementById('badge-texto');

  function obterPeriodoReal() {
    const agora = new Date();
    const hora = agora.getHours();

    if (hora >= 5 && hora < 12) {
      return { periodo: 'manha', icone: '🌅' };
    } else if (hora >= 12 && hora < 18) {
      return { periodo: 'tarde', icone: '☀️' };
    } else {
      return { periodo: 'noite', icone: '🌙' };
    }
  }

  function formatarHoraAtual() {
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2, '0');
    const m = String(agora.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  function aplicarTemaFundo(periodo) {
    if (!elFundo) return;

    // Remove temas anteriores
    elFundo.classList.remove('login-fundo--manha', 'login-fundo--tarde', 'login-fundo--noite');

    // Adiciona o tema atual
    elFundo.classList.add(`login-fundo--${periodo}`);

    const info = periodo === 'manha' ? { icone: '🌅' }
               : periodo === 'tarde' ? { icone: '☀️' }
               : { icone: '🌙' };

    if (badgeIcone) badgeIcone.textContent = info.icone;
    if (badgeTexto) {
      const horaStr = formatarHoraAtual();
      badgeTexto.textContent = `Santa Rita do Sapucaí — ${horaStr}`;
    }
  }

  function atualizarAmbiente() {
    const real = obterPeriodoReal();
    aplicarTemaFundo(real.periodo);
  }

  // Inicializa tema de acordo com horário real e atualiza a cada 30 segundos
  atualizarAmbiente();
  setInterval(atualizarAmbiente, 30000);


  /* ──────────────────────────────────────────────────────────
     4. AUTENTICAÇÃO COM O GOOGLE (SIMULAÇÃO REALISTA)
     ────────────────────────────────────────────────────────── */
  const btnLoginGoogle = document.getElementById('btn-login-google');
  const modalGoogle    = document.getElementById('modal-google');
  const btnCancelarG   = document.getElementById('btn-cancelar-google');
  const contasGoogle   = document.querySelectorAll('.modal-google__conta-item');
  const botaoEntrar    = document.getElementById('botao-entrar');
  const textoBotao     = document.getElementById('texto-botao');
  const iconePadrao    = document.getElementById('icone-padrao');
  const iconeLoading   = document.getElementById('icone-loading');
  const iconeSucesso   = document.getElementById('icone-sucesso');

  function abrirModalGoogle() {
    if (modalGoogle) {
      modalGoogle.classList.add('ativo');
      modalGoogle.setAttribute('aria-hidden', 'false');
      // Foco na primeira conta para acessibilidade
      const primeiraConta = modalGoogle.querySelector('.modal-google__conta-item');
      if (primeiraConta) primeiraConta.focus();
    }
  }

  function fecharModalGoogle() {
    if (modalGoogle) {
      modalGoogle.classList.remove('ativo');
      modalGoogle.setAttribute('aria-hidden', 'true');
      if (btnLoginGoogle) btnLoginGoogle.focus();
    }
  }

  if (btnLoginGoogle) {
    btnLoginGoogle.addEventListener('click', abrirModalGoogle);
  }

  if (btnCancelarG) {
    btnCancelarG.addEventListener('click', fecharModalGoogle);
  }

  // Fecha modal com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalGoogle && modalGoogle.classList.contains('ativo')) {
      fecharModalGoogle();
    }
  });

  // Fecha ao clicar fora do card do modal
  if (modalGoogle) {
    modalGoogle.addEventListener('click', (e) => {
      if (e.target === modalGoogle) {
        fecharModalGoogle();
      }
    });
  }

  // Ao selecionar uma conta do Google no modal
  contasGoogle.forEach(conta => {
    conta.addEventListener('click', () => {
      const email = conta.getAttribute('data-email');
      const nome  = conta.getAttribute('data-nome');

      conta.classList.add('modal-google__conta-item--selecionada');

      setTimeout(() => {
        fecharModalGoogle();
        conta.classList.remove('modal-google__conta-item--selecionada');

        // Salva usuário logado no localStorage
        try {
          localStorage.setItem('valebus_usuario', JSON.stringify({
            nome: nome,
            email: email,
            metodo: 'Google'
          }));
        } catch (e) {
          console.warn('Erro ao salvar no localStorage:', e);
        }

        // Feedback visual no botão principal
        if (botaoEntrar) {
          botaoEntrar.disabled = true;
          botaoEntrar.classList.remove('botao-entrar--carregando');
          botaoEntrar.classList.add('botao-entrar--sucesso');
        }
        if (iconePadrao) iconePadrao.style.display = 'none';
        if (iconeLoading) iconeLoading.style.display = 'none';
        if (iconeSucesso) iconeSucesso.style.display = 'inline-block';
        if (textoBotao) textoBotao.textContent = 'Acesso autorizado!';

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 750);
      }, 150);
    });
  });


  /* ──────────────────────────────────────────────────────────
     5. SELEÇÃO DE ELEMENTOS DO FORMULÁRIO PADRÃO
     ────────────────────────────────────────────────────────── */
  const formulario    = document.getElementById('form-login');
  const inputEmail    = document.getElementById('input-email');
  const inputSenha    = document.getElementById('input-senha');
  const botaoOlho     = document.getElementById('botao-olho');
  const erroMensagem  = document.getElementById('erro-mensagem');
  const erroTexto     = document.getElementById('erro-texto');
  const checkLembrar  = document.getElementById('lembrar-me');
  const botaoCadastro = document.getElementById('botao-cadastro');
  const linkEsqueceu  = document.getElementById('link-esqueceu');


  /* ──────────────────────────────────────────────────────────
     6. MOSTRAR / OCULTAR SENHA
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
     7. RECUPERAR E-MAIL SALVO (Lembrar-me)
     ────────────────────────────────────────────────────────── */
  try {
    const emailSalvo = localStorage.getItem('valebus_email');
    if (emailSalvo && inputEmail && checkLembrar) {
      inputEmail.value     = emailSalvo;
      checkLembrar.checked = true;
    }
  } catch (e) {}


  /* ──────────────────────────────────────────────────────────
     8. VALIDAÇÃO & SUBMIT DO FORMULÁRIO DE LOGIN
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
      const erroSenha = validarSenha(senha);
      if (erroSenha) {
        mostrarErro(erroSenha, inputSenha);
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
      } catch (e) {}

      ocultarErro();

      // Salva nome derivado do e-mail para a sessão
      try {
        const parteNome = email.split('@')[0];
        const nomeFormatado = parteNome.charAt(0).toUpperCase() + parteNome.slice(1);
        localStorage.setItem('valebus_usuario', JSON.stringify({
          nome: nomeFormatado,
          email: email,
          metodo: 'Email/Senha'
        }));
      } catch (e) {}

      await simularLogin(email, senha);
    });
  }


  /* ──────────────────────────────────────────────────────────
     9. EVENTOS DOS BOTÕES SECUNDÁRIOS
     ────────────────────────────────────────────────────────── */
  if (botaoCadastro) {
    botaoCadastro.addEventListener('click', function() {
      alert('Módulo de Cadastro: O fluxo de criação de conta será desenvolvido na Etapa 5.');
    });
  }

  if (linkEsqueceu) {
    linkEsqueceu.addEventListener('click', function(e) {
      e.preventDefault();
      alert('Recuperação de Senha: Um link de redefinição será enviado para o seu e-mail cadastrado.');
    });
  }


  /* ──────────────────────────────────────────────────────────
     10. SIMULAÇÃO DE PROCESSAMENTO DE LOGIN
     ────────────────────────────────────────────────────────── */
  async function simularLogin(email, senha) {
    setCarregando(true);

    try {
      await esperar(950);

      setCarregando(false);
      if (botaoEntrar) {
        botaoEntrar.disabled = true;
        botaoEntrar.classList.add('botao-entrar--sucesso');
      }
      if (iconePadrao) iconePadrao.style.display = 'none';
      if (iconeLoading) iconeLoading.style.display = 'none';
      if (iconeSucesso) iconeSucesso.style.display = 'inline-block';
      if (textoBotao) {
        textoBotao.textContent = 'Acesso autorizado!';
      }

      await esperar(700);
      window.location.href = 'dashboard.html';

    } catch (erro) {
      setCarregando(false);
      resetarBotao();
      mostrarErro('Ocorreu um erro ao entrar. Tente novamente.', inputEmail);
    }
  }


  /* ──────────────────────────────────────────────────────────
     FUNÇÕES AUXILIARES
     ────────────────────────────────────────────────────────── */
  function mostrarErro(mensagem, campoComErro = null) {
    if (erroTexto) erroTexto.textContent = mensagem;
    if (erroMensagem) erroMensagem.classList.remove('erro-mensagem--oculto');

    if (inputEmail) {
      inputEmail.classList.remove('campo__input--erro');
      inputEmail.setAttribute('aria-invalid', 'false');
    }
    if (inputSenha) {
      inputSenha.classList.remove('campo__input--erro');
      inputSenha.setAttribute('aria-invalid', 'false');
    }

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

  function validarSenha(senha) {
    if (senha.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres.';
    }
    if (!/[A-Z]/.test(senha)) {
      return 'A senha deve conter pelo menos uma letra maiúscula.';
    }
    if (!/[^A-Za-z0-9]/.test(senha)) {
      return 'A senha deve conter pelo menos um símbolo (ex: @, #, $, !).';
    }
    return null;
  }

  function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function setCarregando(ativo) {
    if (botaoEntrar) {
      botaoEntrar.disabled = ativo;
      if (ativo) {
        botaoEntrar.classList.add('botao-entrar--carregando');
        botaoEntrar.classList.remove('botao-entrar--sucesso');
      } else {
        botaoEntrar.classList.remove('botao-entrar--carregando');
      }
    }
    if (iconePadrao) {
      iconePadrao.style.display = ativo ? 'none' : 'inline-block';
    }
    if (iconeLoading) {
      iconeLoading.style.display = ativo ? 'inline-block' : 'none';
    }
    if (iconeSucesso) {
      iconeSucesso.style.display = 'none';
    }
    if (textoBotao) {
      textoBotao.textContent = ativo ? 'Entrando...' : 'Entrar';
    }
  }

  function resetarBotao() {
    if (botaoEntrar) {
      botaoEntrar.disabled = false;
      botaoEntrar.classList.remove('botao-entrar--carregando', 'botao-entrar--sucesso');
    }
    if (iconePadrao) iconePadrao.style.display = 'inline-block';
    if (iconeLoading) iconeLoading.style.display = 'none';
    if (iconeSucesso) iconeSucesso.style.display = 'none';
    if (textoBotao) textoBotao.textContent = 'Entrar';
  }

  if (inputEmail) inputEmail.addEventListener('input', ocultarErro);
  if (inputSenha) inputSenha.addEventListener('input', ocultarErro);

})();
