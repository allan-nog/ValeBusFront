/**
 * dashboard.js — Lógica e Telemetria em Tempo Real (ValeBus)
 * ─────────────────────────────────────────────────────────
 * Módulos:
 *  1. Relógio do Sistema em Tempo Real (TopBar CCO)
 *  2. Controle do Mapa Leaflet (Frota de Santa Rita do Sapucaí)
 *  3. Telemetria e Animação de Ônibus (Movimento GPS Simulado)
 *  4. Filtro de Linhas Interativo na Legenda
 *  5. Navegação Interativa (Cards -> Zoom no Ônibus com flyTo)
 *  6. Controle das Gavetas (Sidebar Mobile e Painel Lateral)
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. RELÓGIO DO SISTEMA & USUÁRIO LOGADO
     ────────────────────────────────────────────────────────── */
  function atualizarRelogio() {
    const el = document.getElementById('topbar-hora');
    if (!el) return;
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2, '0');
    const m = String(agora.getMinutes()).padStart(2, '0');
    el.textContent = `${h}:${m}`;
  }

  function carregarUsuarioLogado() {
    try {
      let nome = 'João da Silva';
      let email = 'avaliador@feiratech.com.br';
      let cargo = 'Avaliador Feira';
      let metodo = 'Google Workspace / Feira Tech';

      const salvo = localStorage.getItem('valebus_usuario');
      if (salvo) {
        const usuario = JSON.parse(salvo);
        if (usuario && usuario.nome) {
          nome = usuario.nome;
          email = usuario.email || `${usuario.nome.toLowerCase().replace(/\s+/g, '.')}@feiratech.com.br`;
          cargo = usuario.metodo === 'Google' ? 'Avaliador Feira Tech' : (usuario.cargo || 'Operador CCO');
          if (usuario.metodo) metodo = usuario.metodo;
        }
      }

      // Iniciais do Avatar
      const partes = nome.trim().split(/\s+/).filter(Boolean);
      let iniciais = 'US';
      if (partes.length === 1) {
        iniciais = partes[0].substring(0, 2).toUpperCase();
      } else if (partes.length > 1) {
        iniciais = (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
      }

      // 1. Atualiza elementos do TopBar
      const elNome   = document.getElementById('topbar-usuario-nome') || document.querySelector('.topbar__usuario-nome');
      const elCargo  = document.getElementById('topbar-usuario-cargo') || document.querySelector('.topbar__usuario-cargo');
      const elAvatar = document.getElementById('topbar-usuario-avatar') || document.querySelector('.topbar__avatar');

      if (elNome) elNome.textContent = nome;
      if (elCargo) elCargo.textContent = cargo;
      if (elAvatar) elAvatar.textContent = iniciais;

      // 2. Atualiza elementos do Dropdown
      const elDropNome   = document.getElementById('dropdown-usuario-nome');
      const elDropEmail  = document.getElementById('dropdown-usuario-email');
      const elDropCargo  = document.getElementById('dropdown-usuario-cargo');
      const elDropAvatar = document.getElementById('dropdown-usuario-avatar');

      if (elDropNome) elDropNome.textContent = nome;
      if (elDropEmail) elDropEmail.textContent = email;
      if (elDropCargo) elDropCargo.textContent = cargo;
      if (elDropAvatar) elDropAvatar.textContent = iniciais;

      // 3. Atualiza elementos do Modal de Perfil
      const elModNome   = document.getElementById('modal-perfil-nome');
      const elModEmail  = document.getElementById('modal-perfil-email');
      const elModCargo  = document.getElementById('modal-perfil-cargo');
      const elModAvatar = document.getElementById('modal-perfil-avatar');
      const elModMetodo = document.getElementById('modal-perfil-metodo');

      if (elModNome) elModNome.textContent = nome;
      if (elModEmail) elModEmail.textContent = email;
      if (elModCargo) elModCargo.textContent = cargo;
      if (elModAvatar) elModAvatar.textContent = iniciais;
      if (elModMetodo) elModMetodo.textContent = metodo;

    } catch (e) {
      console.warn('Erro ao carregar usuário autenticado:', e);
    }
  }

  atualizarRelogio();
  setInterval(atualizarRelogio, 5000);
  carregarUsuarioLogado();


  /* ──────────────────────────────────────────────────────────
     2. DADOS DAS LINHAS E FROTA (Santa Rita do Sapucaí - MG)
     ────────────────────────────────────────────────────────── */
  const LINHAS = {
    anchieta: {
      chave: 'anchieta',
      nome: 'Linha Anchieta',
      cor: '#16a34a',
      partida: 'Praça Urbana Carolina | Praça Do Murilo',
      proximaParada: 'Rua José Ribeiro De Barros, 59 | Inatel - Sentido Recanto'
    },
    fernandes: {
      chave: 'fernandes',
      nome: 'Linha Fernandes',
      cor: '#2563eb',
      partida: 'Rua Das Rosas, 300 | Caixa D\'Água Da Copasa',
      proximaParada: 'Rua Das Rosas, 400 | Ginásio Poliesportivo'
    },
    fortaleza: {
      chave: 'fortaleza',
      nome: 'Linha Fortaleza',
      cor: '#9333ea',
      partida: 'Rua Das Rosas, 300 | Caixa D\'Água Da Copasa',
      proximaParada: 'Rua Das Rosas, 400 | Ginásio Poliesportivo'
    },
    industrial: {
      chave: 'industrial',
      nome: 'Linha Industrial',
      cor: '#ea580c',
      partida: 'Br-459 Rod. Jk, Km 119,8 Leste | Entr. Mg-173 Para Cachoeira De Minas',
      proximaParada: 'Br-459 Rod. Jk, Km 120,7 Leste | Linear'
    },
    porto_sapucai: {
      chave: 'porto_sapucai',
      nome: 'Linha Porto Sapucaí',
      cor: '#0891b2',
      partida: 'Br-459 Rod. Jk, Km 116 Leste',
      proximaParada: 'Br-459 Rod. Jk, Km 116,3 Leste | Acesso Ao Porto Sapucaí'
    },
    reforco_jose_gm: {
      chave: 'reforco_jose_gm',
      nome: 'Linha Reforço José G.M (via MCM)',
      cor: '#dc2626',
      partida: 'Rua Das Rosas, 300 | Caixa D\'Água Da Copasa',
      proximaParada: 'Rua Das Rosas, 400 | Ginásio Poliesportivo'
    },
    sao_benedito_hora_meia: {
      chave: 'sao_benedito_hora_meia',
      nome: 'Linha São Benedito (Hora e Meia)',
      cor: '#db2777',
      partida: 'Rua Das Rosas, 300 | Caixa D\'Água Da Copasa',
      proximaParada: 'Rua Das Rosas, 400 | Ginásio Poliesportivo'
    },
    sao_benedito_hora: {
      chave: 'sao_benedito_hora',
      nome: 'Linha São Benedito (Hora)',
      cor: '#eab308',
      partida: 'Rua Das Rosas, 300 | Caixa D\'Água Da Copasa',
      proximaParada: 'Rua Das Rosas, 400 | Ginásio Poliesportivo'
    }
  };

  const FROTA = [
    { chaveLinha: 'anchieta',               linha: LINHAS.anchieta,               posicao: [-22.2575, -45.6965], velocidade: 28 },
    { chaveLinha: 'fernandes',              linha: LINHAS.fernandes,              posicao: [-22.2470, -45.7090], velocidade: 32 },
    { chaveLinha: 'fortaleza',              linha: LINHAS.fortaleza,              posicao: [-22.2445, -45.7060], velocidade: 25 },
    { chaveLinha: 'industrial',             linha: LINHAS.industrial,             posicao: [-22.2610, -45.7140], velocidade: 35 },
    { chaveLinha: 'porto_sapucai',          linha: LINHAS.porto_sapucai,          posicao: [-22.2660, -45.6880], velocidade: 30 },
    { chaveLinha: 'reforco_jose_gm',        linha: LINHAS.reforco_jose_gm,        posicao: [-22.2420, -45.7020], velocidade: 22 },
    { chaveLinha: 'sao_benedito_hora_meia', linha: LINHAS.sao_benedito_hora_meia, posicao: [-22.2510, -45.7010], velocidade: 27 },
    { chaveLinha: 'sao_benedito_hora',      linha: LINHAS.sao_benedito_hora,      posicao: [-22.2545, -45.7075], velocidade: 29 }
  ];


  /* ──────────────────────────────────────────────────────────
     3. INICIALIZAÇÃO DO MAPA LEAFLET & CAMADAS TEMÁTICAS (DIA/NOITE)
     ────────────────────────────────────────────────────────── */
  const mapaContainer = document.getElementById('mapa');
  if (!mapaContainer) return;

  // Centro inicial: Santa Rita do Sapucaí - MG
  const map = L.map('mapa', {
    zoomControl: true,
    attributionControl: false
  }).setView([-22.2528, -45.7036], 14);

  // Camada de Tiles padrão OpenStreetMap (100% gratuita, sem marca d'água ou chave de API)
  const TILE_LAYER_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const TILE_OPTIONS = {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };

  let camadaTilesAtual = L.tileLayer(TILE_LAYER_URL, TILE_OPTIONS).addTo(map);

  /* ──────────────────────────────────────────────────────────
     3.1. GERENCIAMENTO DE TEMA (CLARO / ESCURO)
     ────────────────────────────────────────────────────────── */
  const btnTemaToggle = document.getElementById('btn-tema-toggle');

  function definirTema(tema, salvar = true) {
    const isDark = tema === 'escuro';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');

    if (btnTemaToggle) {
      btnTemaToggle.setAttribute('aria-label', isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
      btnTemaToggle.setAttribute('title', isDark ? 'Ativar Modo Claro (Dia)' : 'Ativar Modo Escuro (Noite)');
    }

    if (salvar) {
      try {
        localStorage.setItem('valebus_tema', tema);
      } catch (e) {
        console.warn('Não foi possível salvar tema no localStorage:', e);
      }
    }
  }

  // Inicializa tema: localStorage -> prefers-color-scheme -> claro
  const temaSalvo = localStorage.getItem('valebus_tema');
  const prefereEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const temaInicial = temaSalvo === 'escuro' || (!temaSalvo && prefereEscuro) ? 'escuro' : 'claro';
  definirTema(temaInicial, false);

  if (btnTemaToggle) {
    btnTemaToggle.addEventListener('click', () => {
      const temaAtual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'escuro' : 'claro';
      const novoTema = temaAtual === 'escuro' ? 'claro' : 'escuro';
      definirTema(novoTema, true);
    });
  }


  /* ──────────────────────────────────────────────────────────
     4. RENDERIZAÇÃO DOS MARCADORES SVG DE ÔNIBUS
     ────────────────────────────────────────────────────────── */
  const marcadoresMap = new Map();

  function criarIconeBus(cor) {
    const htmlIcone = `
      <div class="bus-marker-container">
        <div class="bus-marker" style="background-color: ${cor};">
          <svg viewBox="0 0 24 24">
            <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
            <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
          </svg>
          <div class="bus-marker-pulse" style="color: ${cor};"></div>
        </div>
      </div>
    `;

    return L.divIcon({
      html: htmlIcone,
      className: '',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -18]
    });
  }

  function gerarHtmlPopup(bus) {
    return `
      <div class="popup-onibus">
        <div class="popup-onibus__header">
          <span class="popup-onibus__dot" style="background-color: ${bus.linha.cor};"></span>
          <h3 class="popup-onibus__titulo" style="color: ${bus.linha.cor};">
            ${bus.linha.nome}
          </h3>
        </div>
        <div class="popup-onibus__corpo">
          <div class="popup-onibus__item">
            <span class="popup-onibus__rotulo">🚩 Partida:</span>
            <span class="popup-onibus__valor">${bus.linha.partida}</span>
          </div>
          <div class="popup-onibus__item">
            <span class="popup-onibus__rotulo">📍 Próxima Parada:</span>
            <span class="popup-onibus__valor">${bus.linha.proximaParada}</span>
          </div>
        </div>
        <div class="popup-onibus__footer">
          <span class="popup-onibus__velocidade">⚡ <strong>${bus.velocidade} km/h</strong></span>
          <span class="popup-onibus__gps-badge">GPS Online</span>
        </div>
      </div>
    `;
  }

  function renderizarMarcadores() {
    FROTA.forEach(bus => {
      const icone = criarIconeBus(bus.linha.cor);
      const conteudoPopup = gerarHtmlPopup(bus);

      const marker = L.marker(bus.posicao, { icon: icone })
        .addTo(map)
        .bindPopup(conteudoPopup);

      marcadoresMap.set(bus.chaveLinha, { marker, bus });
    });
  }

  renderizarMarcadores();


  /* ──────────────────────────────────────────────────────────
     5. SIMULAÇÃO DE MOVIMENTAÇÃO GPS
     ────────────────────────────────────────────────────────── */
  setInterval(() => {
    marcadoresMap.forEach(({ marker, bus }) => {
      const latAtual = marker.getLatLng().lat;
      const lngAtual = marker.getLatLng().lng;

      // Deslocamento suave aleatório
      const deltaLat = (Math.random() - 0.5) * 0.0005;
      const deltaLng = (Math.random() - 0.5) * 0.0005;

      const novaLat = latAtual + deltaLat;
      const novaLng = lngAtual + deltaLng;

      marker.setLatLng([novaLat, novaLng]);

      // Variação leve na velocidade simulada
      bus.velocidade = Math.min(45, Math.max(15, bus.velocidade + Math.floor((Math.random() - 0.5) * 4)));

      // Atualiza conteúdo do popup mantendo dados dinâmicos
      if (marker.isPopupOpen()) {
        marker.setPopupContent(gerarHtmlPopup(bus));
      }
    });
  }, 3000);


  /* ──────────────────────────────────────────────────────────
     6. FILTRO INTERATIVO POR LINHA (LEGENDA) + FOCO NO MAPA
     ────────────────────────────────────────────────────────── */
  const botoesFiltro = document.querySelectorAll('#filtros-legenda .mapa-legenda__item');
  const mapaLegenda = document.querySelector('.mapa-legenda');
  const mapaLegendaHeader = document.querySelector('.mapa-legenda__header');
  const btnLegendaPrev = document.getElementById('btn-legenda-prev');
  const btnLegendaNext = document.getElementById('btn-legenda-next');
  const containerFiltrosLegenda = document.getElementById('filtros-legenda');

  // Permite recolher/expandir o filtro da legenda no mobile ao clicar no cabeçalho
  if (mapaLegendaHeader && mapaLegenda) {
    mapaLegendaHeader.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        mapaLegenda.classList.toggle('recolhida');
      }
    });
  }

  // Suporte a rolagem horizontal via roda do mouse no carrossel
  if (containerFiltrosLegenda) {
    containerFiltrosLegenda.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0 && !e.deltaX) {
        e.preventDefault();
        containerFiltrosLegenda.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  // Ações das setas de navegação (Anterior / Próxima Linha)
  if (btnLegendaPrev) {
    btnLegendaPrev.addEventListener('click', () => {
      const botoesArr = Array.from(botoesFiltro);
      const indexAtual = botoesArr.findIndex(b => b.classList.contains('mapa-legenda__item--ativo'));
      const prevIndex = indexAtual > 0 ? indexAtual - 1 : botoesArr.length - 1;
      botoesArr[prevIndex].click();
    });
  }

  if (btnLegendaNext) {
    btnLegendaNext.addEventListener('click', () => {
      const botoesArr = Array.from(botoesFiltro);
      const indexAtual = botoesArr.findIndex(b => b.classList.contains('mapa-legenda__item--ativo'));
      const nextIndex = indexAtual < botoesArr.length - 1 ? indexAtual + 1 : 0;
      botoesArr[nextIndex].click();
    });
  }

  botoesFiltro.forEach(botao => {
    botao.addEventListener('click', (e) => {
      e.stopPropagation();
      botoesFiltro.forEach(b => {
        b.classList.remove('mapa-legenda__item--ativo');
        b.setAttribute('aria-selected', 'false');
      });
      botao.classList.add('mapa-legenda__item--ativo');
      botao.setAttribute('aria-selected', 'true');

      // Centraliza o chip ativo com animação fluida no carrossel em qualquer resolução
      botao.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

      const linhaSelecionada = botao.getAttribute('data-linha');
      let totalVisivel = 0;

      marcadoresMap.forEach(({ marker, bus }) => {
        if (linhaSelecionada === 'todas' || bus.chaveLinha === linhaSelecionada) {
          if (!map.hasLayer(marker)) map.addLayer(marker);
          totalVisivel++;
        } else {
          if (map.hasLayer(marker)) map.removeLayer(marker);
        }
      });

      // Atualiza o contador no resumo do painel
      const elTotal = document.getElementById('total-onibus-ativo');
      if (elTotal) {
        const spanNumDestaque = elTotal.querySelector('.num-destaque');
        const spanNumTotal = elTotal.querySelector('.num-total');
        if (spanNumDestaque && spanNumTotal) {
          spanNumDestaque.textContent = totalVisivel;
          spanNumTotal.textContent = FROTA.length;
        } else {
          elTotal.textContent = `${totalVisivel} / ${FROTA.length}`;
        }
      }

      // FOCO DINÂMICO NO MAPA NA LINHA SELECIONADA
      if (linhaSelecionada === 'todas') {
        map.closePopup();
        map.flyTo([-22.2528, -45.7036], 14, { animate: true, duration: 1.0 });
      } else {
        focarOnibusPorLinha(linhaSelecionada, false);
      }
    });
  });


  /* ──────────────────────────────────────────────────────────
     7. NAVEGAÇÃO INTERATIVA (Clique no Card -> flyTo no Mapa)
     ────────────────────────────────────────────────────────── */
  const cardsProximos = document.querySelectorAll('.proximo-card');

  function focarOnibusPorLinha(chaveLinha, atualizarCarrossel = true) {
    const itemBus = marcadoresMap.get(chaveLinha);
    if (itemBus) {
      const { marker, bus } = itemBus;
      const latLng = marker.getLatLng();

      // Sincroniza o botão correspondente no carrossel da legenda
      if (atualizarCarrossel) {
        const btnLegenda = document.querySelector(`#filtros-legenda [data-linha="${chaveLinha}"]`);
        if (btnLegenda) {
          botoesFiltro.forEach(b => {
            b.classList.remove('mapa-legenda__item--ativo');
            b.setAttribute('aria-selected', 'false');
          });
          btnLegenda.classList.add('mapa-legenda__item--ativo');
          btnLegenda.setAttribute('aria-selected', 'true');
          btnLegenda.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }

      // Garantir que a camada do marcador está visível se houver filtro
      if (!map.hasLayer(marker)) {
        map.addLayer(marker);
      }

      // Atualiza popup antes de abrir
      marker.setPopupContent(gerarHtmlPopup(bus));

      // Faz o mapa voar suavemente até o ônibus selecionado
      map.flyTo(latLng, 16, { animate: true, duration: 1.2 });
      marker.openPopup();

      // Se estiver no celular/tablet, fecha o painel lateral para mostrar o mapa
      if (window.innerWidth < 1100) {
        fecharPainel();
      }
    }
  }

  cardsProximos.forEach(card => {
    card.addEventListener('click', () => {
      const chaveLinha = card.getAttribute('data-linha');
      focarOnibusPorLinha(chaveLinha);
    });

    // Suporte a navegação por teclado (Enter e Espaço)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const chaveLinha = card.getAttribute('data-linha');
        focarOnibusPorLinha(chaveLinha);
      }
    });
  });

  // Botão "Ver todas as 8 linhas da frota" (Expandir / Recolher lista de próximos ônibus)
  const btnVerTodos = document.getElementById('btn-ver-todos');
  const proximosLista = document.getElementById('proximos-lista');
  const btnVerTodosTexto = btnVerTodos ? btnVerTodos.querySelector('.btn-ver-todos__texto') : null;
  const btnVerTodosBadge = btnVerTodos ? btnVerTodos.querySelector('.btn-ver-todos__badge') : null;

  if (btnVerTodos) {
    btnVerTodos.addEventListener('click', () => {
      const estaExpandido = btnVerTodos.getAttribute('aria-expanded') === 'true';
      const novoEstado = !estaExpandido;

      btnVerTodos.setAttribute('aria-expanded', String(novoEstado));

      if (proximosLista) {
        proximosLista.classList.toggle('proximos-lista--expandida', novoEstado);
      }

      if (novoEstado) {
        if (btnVerTodosTexto) btnVerTodosTexto.textContent = 'Recolher linhas da frota';
        if (btnVerTodosBadge) btnVerTodosBadge.style.display = 'none';

        // Reseta o filtro do mapa para 'todas' e re-enquadra a visão completa
        const btnTodas = document.querySelector('#filtros-legenda [data-linha="todas"]');
        if (btnTodas && !btnTodas.classList.contains('mapa-legenda__item--ativo')) {
          btnTodas.click();
        }
      } else {
        if (btnVerTodosTexto) btnVerTodosTexto.textContent = 'Ver todas as 8 linhas da frota';
        if (btnVerTodosBadge) btnVerTodosBadge.style.display = 'inline-flex';
      }
    });
  }


  /* ──────────────────────────────────────────────────────────
     8. MENU DO USUÁRIO (DROPDOWN), MODAIS & DEMAIS INTERAÇÕES
     ────────────────────────────────────────────────────────── */
  const btnSino = document.getElementById('btn-sino-notificacoes');
  if (btnSino) {
    btnSino.addEventListener('click', () => {
      navegarParaSecao('alertas');
    });
  }

  // 8.1. Dropdown do Usuário
  const btnUsuario = document.getElementById('btn-usuario-menu') || document.querySelector('.topbar__usuario');
  const dropdownUsuario = document.getElementById('dropdown-usuario');
  const usuarioWrapper = document.getElementById('topbar-usuario-wrapper') || document.querySelector('.topbar__usuario-wrapper');

  function abrirDropdownUsuario() {
    if (!dropdownUsuario || !btnUsuario) return;
    dropdownUsuario.classList.add('usuario-dropdown--aberto');
    dropdownUsuario.setAttribute('aria-hidden', 'false');
    btnUsuario.setAttribute('aria-expanded', 'true');
  }

  function fecharDropdownUsuario() {
    if (!dropdownUsuario || !btnUsuario) return;
    dropdownUsuario.classList.remove('usuario-dropdown--aberto');
    dropdownUsuario.setAttribute('aria-hidden', 'true');
    btnUsuario.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdownUsuario(e) {
    if (e) {
      e.stopPropagation();
    }
    const aberto = dropdownUsuario && dropdownUsuario.classList.contains('usuario-dropdown--aberto');
    if (aberto) {
      fecharDropdownUsuario();
    } else {
      abrirDropdownUsuario();
    }
  }

  if (btnUsuario) {
    btnUsuario.addEventListener('click', toggleDropdownUsuario);
  }

  // Fecha dropdown se clicar fora
  document.addEventListener('click', (e) => {
    if (usuarioWrapper && !usuarioWrapper.contains(e.target)) {
      fecharDropdownUsuario();
    }
  });

  // 8.2. Modais de Perfil e Configurações
  const modalPerfil = document.getElementById('modal-perfil');
  const modalConfig = document.getElementById('modal-configuracoes');
  const btnDropdownPerfil = document.getElementById('dropdown-btn-perfil');
  const btnDropdownConfig = document.getElementById('dropdown-btn-config');
  const btnFecharPerfil = document.getElementById('btn-fechar-modal-perfil');
  const btnFecharPerfilAcao = document.getElementById('btn-fechar-perfil-acao');
  const btnFecharConfig = document.getElementById('btn-fechar-modal-config');
  const btnSalvarConfig = document.getElementById('btn-salvar-config');
  const switchTema = document.getElementById('cfg-switch-tema');
  const switchAnim = document.getElementById('cfg-switch-anim');

  function abrirModalDash(modal) {
    if (!modal) return;
    fecharDropdownUsuario();
    modal.classList.add('ativo');
    modal.setAttribute('aria-hidden', 'false');
  }

  function fecharModalDash(modal) {
    if (!modal) return;
    modal.classList.remove('ativo');
    modal.setAttribute('aria-hidden', 'true');
  }

  if (btnDropdownPerfil) {
    btnDropdownPerfil.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalDash(modalPerfil);
    });
  }

  if (btnDropdownConfig) {
    btnDropdownConfig.addEventListener('click', (e) => {
      e.preventDefault();
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (switchTema) {
        switchTema.classList.toggle('config-switch--ativo', isDark);
        switchTema.setAttribute('aria-checked', String(isDark));
      }
      abrirModalDash(modalConfig);
    });
  }

  if (btnFecharPerfil) btnFecharPerfil.addEventListener('click', () => fecharModalDash(modalPerfil));
  if (btnFecharPerfilAcao) btnFecharPerfilAcao.addEventListener('click', () => fecharModalDash(modalPerfil));
  if (btnFecharConfig) btnFecharConfig.addEventListener('click', () => fecharModalDash(modalConfig));
  if (btnSalvarConfig) btnSalvarConfig.addEventListener('click', () => fecharModalDash(modalConfig));

  [modalPerfil, modalConfig].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) fecharModalDash(m);
      });
    }
  });

  if (switchTema) {
    switchTema.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const novoTema = isDark ? 'claro' : 'escuro';
      definirTema(novoTema, true);
      switchTema.classList.toggle('config-switch--ativo', !isDark);
      switchTema.setAttribute('aria-checked', String(!isDark));
    });
  }

  if (switchAnim) {
    switchAnim.addEventListener('click', () => {
      const ativo = switchAnim.classList.toggle('config-switch--ativo');
      switchAnim.setAttribute('aria-checked', String(ativo));
    });
  }

  // Gerenciamento Centralizado de Seções / Views
  const secoesConfig = {
    mapa: {
      titulo: 'Monitoramento de Frota em Tempo Real',
      subtitulo: 'Santa Rita do Sapucaí — Simulação GPS Telemetria'
    },
    buscar: {
      titulo: 'Buscar Linhas e Destinos',
      subtitulo: 'Pesquise por bairro, pontos turísticos, faculdades e conexões'
    },
    horarios: {
      titulo: 'Quadro Geral de Horários',
      subtitulo: 'Itinerários e intervalos programados da frota municipal'
    },
    alertas: {
      titulo: 'Central de Alertas Operacionais',
      subtitulo: 'Avisos de tráfego, manutenções e pontualidade em tempo real'
    },
    sobre: {
      titulo: 'Sobre o Projeto ValeBus',
      subtitulo: 'Inovação e mobilidade inteligente para Santa Rita do Sapucaí'
    }
  };

  function navegarParaSecao(secao) {
    // 1. Atualiza botões do menu lateral
    itensNav.forEach(i => {
      const isAlvo = i.getAttribute('data-secao') === secao;
      i.classList.toggle('nav__item--ativo', isAlvo);
      if (isAlvo) {
        i.setAttribute('aria-current', 'page');
      } else {
        i.removeAttribute('aria-current');
      }
    });

    // 2. Atualiza títulos no cabeçalho da página
    const cfg = secoesConfig[secao] || secoesConfig.mapa;
    const elTitulo = document.getElementById('main-titulo');
    const elSubtitulo = document.getElementById('main-subtitulo');
    if (elTitulo) elTitulo.textContent = cfg.titulo;
    if (elSubtitulo) elSubtitulo.textContent = cfg.subtitulo;

    // 3. Alterna a exibição das views
    const todasViews = document.querySelectorAll('.secao-view');
    todasViews.forEach(v => {
      v.style.display = 'none';
      v.classList.remove('secao-view--ativa');
    });

    const viewAlvo = document.getElementById(`view-${secao}`);
    if (viewAlvo) {
      viewAlvo.style.display = 'flex';
      viewAlvo.classList.add('secao-view--ativa');
    }

    // 4. Se a view selecionada for o mapa, revalida o tamanho do Leaflet
    if (secao === 'mapa') {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }

    if (window.innerWidth < 1100) {
      fecharSidebar();
    }
  }

  // Links do Menu Lateral (Sidebar)
  const itensNav = document.querySelectorAll('.sidebar__nav .nav__item');
  itensNav.forEach(item => {
    item.addEventListener('click', () => {
      const secao = item.getAttribute('data-secao');
      if (secao) {
        navegarParaSecao(secao);
      }
    });
  });


  /* ──────────────────────────────────────────────────────────
     8.1. SISTEMA DE BUSCA DE DESTINO E FILTRO POR NOME DA LINHA
     ────────────────────────────────────────────────────────── */
  const inputBusca = document.getElementById('input-busca-linha');
  const btnLimparBusca = document.getElementById('btn-limpar-busca');
  const chipsFiltro = document.querySelectorAll('#chips-destinos .chip-filtro');
  const cardsLinhasBusca = document.querySelectorAll('#grade-linhas-busca .linha-card');
  const contadorResultado = document.getElementById('busca-contador-resultado');

  function normalizarTexto(txt) {
    return (txt || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function executarBuscaDestino(termo) {
    const termoNorm = normalizarTexto(termo);
    let visiveis = 0;

    if (btnLimparBusca) {
      btnLimparBusca.style.display = termoNorm ? 'flex' : 'none';
    }

    cardsLinhasBusca.forEach(card => {
      const dadosBusca = normalizarTexto(card.getAttribute('data-busca') || '');
      const textoCard = normalizarTexto(card.innerText || '');
      const matches = !termoNorm || dadosBusca.includes(termoNorm) || textoCard.includes(termoNorm);

      if (matches) {
        card.style.display = 'flex';
        visiveis++;
      } else {
        card.style.display = 'none';
      }
    });

    if (contadorResultado) {
      if (!termoNorm) {
        contadorResultado.textContent = `Exibindo todas as ${cardsLinhasBusca.length} linhas disponíveis em Santa Rita do Sapucaí`;
      } else if (visiveis === 0) {
        contadorResultado.textContent = `Nenhuma linha encontrada para "${termo}". Tente outro termo ou atalho.`;
      } else {
        contadorResultado.textContent = `Exibindo ${visiveis} linha(s) encontrada(s) para "${termo}"`;
      }
    }
  }

  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      // Remove ativação de chips ao digitar livremente
      chipsFiltro.forEach(c => c.classList.remove('chip-filtro--ativo'));
      executarBuscaDestino(e.target.value);
    });
  }

  if (btnLimparBusca) {
    btnLimparBusca.addEventListener('click', () => {
      if (inputBusca) {
        inputBusca.value = '';
        inputBusca.focus();
      }
      chipsFiltro.forEach((c, idx) => {
        c.classList.toggle('chip-filtro--ativo', idx === 0);
      });
      executarBuscaDestino('');
    });
  }

  chipsFiltro.forEach(chip => {
    chip.addEventListener('click', () => {
      chipsFiltro.forEach(c => c.classList.remove('chip-filtro--ativo'));
      chip.classList.add('chip-filtro--ativo');

      const filtro = chip.getAttribute('data-filtro') || '';
      if (inputBusca) {
        inputBusca.value = filtro;
      }
      executarBuscaDestino(filtro);
    });
  });

  // Botões "Ver no Mapa" dentro da busca e horários
  const botoesVerLinhaMapa = document.querySelectorAll('.btn-ver-linha-mapa');
  botoesVerLinhaMapa.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chaveLinha = btn.getAttribute('data-linha');
      if (chaveLinha) {
        // 1. Muda para a visualização do mapa
        navegarParaSecao('mapa');

        // 2. Aciona o filtro correspondente na legenda do mapa
        const btnFiltroLegenda = document.querySelector(`#filtros-legenda [data-linha="${chaveLinha}"]`);
        if (btnFiltroLegenda) {
          btnFiltroLegenda.click();
        }

        // 3. Foca o mapa no ônibus da linha com animação suave e abre o popup
        setTimeout(() => {
          focarOnibusPorLinha(chaveLinha);
        }, 350);
      }
    });
  });


  /* ──────────────────────────────────────────────────────────
     9. GERENCIAMENTO DAS GAVETAS (SIDEBAR E PAINEL MOBILE)
     ────────────────────────────────────────────────────────── */
  const sidebar      = document.getElementById('sidebar');
  const painel       = document.getElementById('painel-lateral');
  const overlay      = document.getElementById('overlay');
  const btnMenu      = document.getElementById('btn-menu');
  const btnPainel    = document.getElementById('btn-painel-flutuante');
  const btnFecharP   = document.getElementById('btn-fechar-painel');

  function atualizarMapaAposTransicao() {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }

  function abrirSidebar() {
    if (sidebar) sidebar.classList.add('aberta');
    if (overlay) overlay.classList.add('ativo');
    if (btnMenu) btnMenu.setAttribute('aria-expanded', 'true');
    fecharPainel();
    atualizarMapaAposTransicao();
  }

  function fecharSidebar() {
    if (sidebar) sidebar.classList.remove('aberta');
    if (!painel || !painel.classList.contains('aberto')) {
      if (overlay) overlay.classList.remove('ativo');
    }
    if (btnMenu) btnMenu.setAttribute('aria-expanded', 'false');
    atualizarMapaAposTransicao();
  }

  function abrirPainel() {
    if (painel) painel.classList.add('aberto');
    if (overlay) overlay.classList.add('ativo');
    fecharSidebar();
    atualizarMapaAposTransicao();
  }

  function fecharPainel() {
    if (painel) painel.classList.remove('aberto');
    if (!sidebar || !sidebar.classList.contains('aberta')) {
      if (overlay) overlay.classList.remove('ativo');
    }
    atualizarMapaAposTransicao();
  }

  // Event Listeners das Gavetas
  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      const aberta = sidebar && sidebar.classList.contains('aberta');
      aberta ? fecharSidebar() : abrirSidebar();
    });
  }

  if (btnPainel) btnPainel.addEventListener('click', abrirPainel);
  if (btnFecharP) btnFecharP.addEventListener('click', fecharPainel);

  // Manipulação de gestos de toque no Bottom Sheet para uso com uma mão
  const handleMobile = document.querySelector('.painel__handle-mobile');
  if (handleMobile) {
    handleMobile.addEventListener('click', () => {
      if (window.innerWidth < 1100) {
        fecharPainel();
      }
    });
  }

  if (painel) {
    let touchStartY = 0;
    let touchMoveY = 0;

    painel.addEventListener('touchstart', (e) => {
      // Inicia rastreio apenas se o painel estiver no topo do scroll
      if (painel.scrollTop <= 0) {
        touchStartY = e.touches[0].clientY;
      } else {
        touchStartY = 0;
      }
    }, { passive: true });

    painel.addEventListener('touchmove', (e) => {
      if (!touchStartY) return;
      touchMoveY = e.touches[0].clientY;
      const diffY = touchMoveY - touchStartY;
      if (diffY > 0 && window.innerWidth < 768) {
        painel.style.transform = `translateY(${Math.min(diffY, 180)}px)`;
      }
    }, { passive: true });

    painel.addEventListener('touchend', () => {
      if (!touchStartY || !touchMoveY) return;
      const diffY = touchMoveY - touchStartY;
      painel.style.transform = '';
      if (diffY > 70 && window.innerWidth < 768) {
        fecharPainel();
      }
      touchStartY = 0;
      touchMoveY = 0;
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      fecharSidebar();
      fecharPainel();
    });
  }

  // Atalho Tecla ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      fecharSidebar();
      fecharPainel();
      fecharDropdownUsuario();
      fecharModalDash(modalPerfil);
      fecharModalDash(modalConfig);
    }
  });

  // Ajuste do tamanho do Leaflet ao redimensionar a janela
  window.addEventListener('resize', () => {
    map.invalidateSize();
    if (window.innerWidth >= 1100) {
      fecharSidebar();
      fecharPainel();
    }
  });

})();
