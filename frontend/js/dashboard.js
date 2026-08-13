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
     1. RELÓGIO DO SISTEMA
     ────────────────────────────────────────────────────────── */
  function atualizarRelogio() {
    const el = document.getElementById('topbar-hora');
    if (!el) return;
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2, '0');
    const m = String(agora.getMinutes()).padStart(2, '0');
    el.textContent = `${h}:${m}`;
  }

  atualizarRelogio();
  setInterval(atualizarRelogio, 5000);


  /* ──────────────────────────────────────────────────────────
     2. DADOS DAS LINHAS E FROTA (Santa Rita do Sapucaí - MG)
     ────────────────────────────────────────────────────────── */
  const LINHAS = {
    centro:     { id: 'L03', nome: 'Centro / ETE',       cor: '#22c55e' },
    campus:     { id: 'L07', nome: 'Campus / FAI',       cor: '#2563eb' },
    industrial: { id: 'L12', nome: 'Pq. Industrial',     cor: '#f97316' },
    rodoviaria: { id: 'L15', nome: 'Rodoviária Central', cor: '#a855f7' }
  };

  const FROTA = [
    { id: 'VB-101', chaveLinha: 'centro',     linha: LINHAS.centro,     posicao: [-22.2528, -45.7036], velocidade: 28, proximaParada: 'INATEL' },
    { id: 'VB-102', chaveLinha: 'centro',     linha: LINHAS.centro,     posicao: [-22.2498, -45.7062], velocidade: 32, proximaParada: 'Praça da Matriz' },
    { id: 'VB-201', chaveLinha: 'campus',     linha: LINHAS.campus,     posicao: [-22.2480, -45.6990], velocidade: 24, proximaParada: 'Praça da Bandeira' },
    { id: 'VB-202', chaveLinha: 'campus',     linha: LINHAS.campus,     posicao: [-22.2465, -45.6968], velocidade: 35, proximaParada: 'FAI Campus II' },
    { id: 'VB-301', chaveLinha: 'industrial', linha: LINHAS.industrial, posicao: [-22.2570, -45.7085], velocidade: 30, proximaParada: 'Distrito Industrial' },
    { id: 'VB-302', chaveLinha: 'industrial', linha: LINHAS.industrial, posicao: [-22.2590, -45.7055], velocidade: 22, proximaParada: 'Av. Sinhá Moreira' },
    { id: 'VB-401', chaveLinha: 'rodoviaria', linha: LINHAS.rodoviaria, posicao: [-22.2600, -45.7000], velocidade: 26, proximaParada: 'Terminal Rodoviário' },
    { id: 'VB-402', chaveLinha: 'rodoviaria', linha: LINHAS.rodoviaria, posicao: [-22.2540, -45.7020], velocidade: 29, proximaParada: 'Bairro Alto' }
  ];


  /* ──────────────────────────────────────────────────────────
     3. INICIALIZAÇÃO DO MAPA LEAFLET
     ────────────────────────────────────────────────────────── */
  const mapaContainer = document.getElementById('mapa');
  if (!mapaContainer) return;

  // Centro inicial: Santa Rita do Sapucaí
  const map = L.map('mapa', {
    zoomControl: true,
    attributionControl: false
  }).setView([-22.2528, -45.7036], 14);

  // Tiles do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);


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

  function renderizarMarcadores() {
    FROTA.forEach(bus => {
      const icone = criarIconeBus(bus.linha.cor);

      const conteudoPopup = `
        <div class="popup-onibus">
          <div class="popup-onibus__header">
            <span class="popup-onibus__id">${bus.id}</span>
            <span class="popup-onibus__badge" style="background-color:${bus.linha.cor}">
              ${bus.linha.id}
            </span>
          </div>
          <div class="popup-onibus__linha">${bus.linha.nome}</div>
          <div class="popup-onibus__detalhe">
            <strong>Próxima Parada:</strong> ${bus.proximaParada}<br>
            <strong>Velocidade:</strong> ${bus.velocidade} km/h<br>
            <strong>GPS Status:</strong> Sinal excelente
          </div>
        </div>
      `;

      const marker = L.marker(bus.posicao, { icon: icone })
        .addTo(map)
        .bindPopup(conteudoPopup);

      marcadoresMap.set(bus.id, { marker, bus });
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
      const deltaLat = (Math.random() - 0.5) * 0.0006;
      const deltaLng = (Math.random() - 0.5) * 0.0006;

      const novaLat = latAtual + deltaLat;
      const novaLng = lngAtual + deltaLng;

      marker.setLatLng([novaLat, novaLng]);

      // Variação leve na velocidade simulada
      bus.velocidade = Math.min(45, Math.max(15, bus.velocidade + Math.floor((Math.random() - 0.5) * 4)));
    });
  }, 3000);


  /* ──────────────────────────────────────────────────────────
     6. FILTRO INTERATIVO POR LINHA (LEGENDA) + RECOLHIMENTO MOBILE
     ────────────────────────────────────────────────────────── */
  const botoesFiltro = document.querySelectorAll('#filtros-legenda .mapa-legenda__item');
  const mapaLegenda = document.querySelector('.mapa-legenda');
  const mapaLegendaHeader = document.querySelector('.mapa-legenda__header');

  // Permite recolher/expandir o filtro da legenda no mobile ao clicar no cabeçalho
  if (mapaLegendaHeader && mapaLegenda) {
    mapaLegendaHeader.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        mapaLegenda.classList.toggle('recolhida');
      }
    });
  }

  botoesFiltro.forEach(botao => {
    botao.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita recolher ao clicar nos botões de filtro no mobile
      // Altera o estado visual dos botões de filtro
      botoesFiltro.forEach(b => b.classList.remove('mapa-legenda__item--ativo'));
      botao.classList.add('mapa-legenda__item--ativo');

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
      if (elTotal) elTotal.textContent = `${totalVisivel} / ${FROTA.length}`;
    });
  });


  /* ──────────────────────────────────────────────────────────
     7. NAVEGAÇÃO INTERATIVA (Clique no Card -> flyTo no Mapa)
     ────────────────────────────────────────────────────────── */
  const cardsProximos = document.querySelectorAll('.proximo-card');

  function focarOnibusPorId(busId) {
    const itemBus = marcadoresMap.get(busId);
    if (itemBus) {
      const { marker } = itemBus;
      const latLng = marker.getLatLng();

      // Garantir que a camada do marcador está visível se houver filtro
      if (!map.hasLayer(marker)) {
        map.addLayer(marker);
      }

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
      const busId = card.getAttribute('data-bus-id');
      focarOnibusPorId(busId);
    });

    // Suporte a navegação por teclado (Enter e Espaço)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const busId = card.getAttribute('data-bus-id');
        focarOnibusPorId(busId);
      }
    });
  });

  // Botão "Ver todas as 8 unidades da frota"
  const btnVerTodos = document.getElementById('btn-ver-todos');
  if (btnVerTodos) {
    btnVerTodos.addEventListener('click', () => {
      // Reseta o filtro para 'todas'
      const btnTodas = document.querySelector('#filtros-legenda [data-linha="todas"]');
      if (btnTodas) btnTodas.click();

      // Redefine a visão inicial do mapa
      map.flyTo([-22.2528, -45.7036], 14, { animate: true, duration: 1.2 });

      if (window.innerWidth < 1100) {
        fecharPainel();
      }
    });
  }


  /* ──────────────────────────────────────────────────────────
     8. DEMAIS INTERAÇÕES DA INTERFACE (Sino, Usuário e Navegação)
     ────────────────────────────────────────────────────────── */
  const btnSino = document.getElementById('btn-sino-notificacoes');
  if (btnSino) {
    btnSino.addEventListener('click', () => {
      alert('🔔 Alertas Operacionais ValeBus:\n\n1. Linha L07 Campus: Trânsito moderado na Praça da Bandeira (+4 min).\n2. Linha L12 Industrial: Manutenção preventiva agendada para às 22:00 em VB-302.');
    });
  }

  const btnUsuario = document.querySelector('.topbar__usuario');
  if (btnUsuario) {
    btnUsuario.addEventListener('click', () => {
      alert('👤 Perfil do Usuário: João da Silva\nFunção: Avaliador Feira Tech (CCO ValeBus)\nSessão ativa em Santa Rita do Sapucaí.');
    });
  }

  // Links do Menu Lateral (Sidebar)
  const itensNav = document.querySelectorAll('.sidebar__nav .nav__item');
  itensNav.forEach(item => {
    item.addEventListener('click', () => {
      itensNav.forEach(i => {
        i.classList.remove('nav__item--ativo');
        i.removeAttribute('aria-current');
      });
      item.classList.add('nav__item--ativo');
      item.setAttribute('aria-current', 'page');

      const secao = item.getAttribute('data-secao');
      const tituloMain = document.querySelector('.main__titulo');

      if (tituloMain) {
        if (secao === 'mapa') tituloMain.textContent = 'Monitoramento de Frota em Tempo Real';
        else if (secao === 'linhas') tituloMain.textContent = 'Gestão e Horários das Linhas';
        else if (secao === 'onibus') tituloMain.textContent = 'Telemetria dos Veículos (8 Unidades)';
        else if (secao === 'paradas') tituloMain.textContent = 'Pontos de Parada e Abrigos';
        else if (secao === 'alertas') tituloMain.textContent = 'Central de Alertas Operacionais';
        else if (secao === 'relatorios') tituloMain.textContent = 'Relatórios de Pontualidade e Demanda';
        else if (secao === 'config') tituloMain.textContent = 'Configurações do Sistema CCO';
      }

      if (window.innerWidth < 1100) {
        fecharSidebar();
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
