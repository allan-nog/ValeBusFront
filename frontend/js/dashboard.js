(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     RELÓGIO
     ══════════════════════════════════════════════════════ */

  function atualizarHora() {
    const el = document.getElementById('topbar-hora');
    if (!el) return;
    const agora = new Date();
    const h = String(agora.getHours()).padStart(2, '0');
    const m = String(agora.getMinutes()).padStart(2, '0');
    el.textContent = `${h}:${m}`;
  }

  atualizarHora();
  setInterval(atualizarHora, 5000);


  /* ══════════════════════════════════════════════════════
     SIDEBAR — nav items
     ══════════════════════════════════════════════════════ */

  const navItems = document.querySelectorAll('.nav__item[data-secao]');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('nav__item--ativo'));
      item.classList.add('nav__item--ativo');
      // fecha sidebar no mobile ao clicar num item
      fecharSidebar();
    });
  });


  /* ══════════════════════════════════════════════════════
     SIDEBAR HAMBÚRGUER (mobile)
     ══════════════════════════════════════════════════════ */

  const sidebar      = document.getElementById('sidebar');
  const overlay      = document.getElementById('overlay');
  const btnMenu      = document.getElementById('btn-menu');

  function abrirSidebar() {
    sidebar.classList.add('aberta');
    overlay.classList.add('ativo');
    btnMenu.setAttribute('aria-expanded', 'true');
    // garante que o painel não fique aberto ao mesmo tempo
    fecharPainel();
  }

  function fecharSidebar() {
    sidebar.classList.remove('aberta');
    overlay.classList.remove('ativo');
    btnMenu && btnMenu.setAttribute('aria-expanded', 'false');
  }

  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      const aberta = sidebar.classList.contains('aberta');
      aberta ? fecharSidebar() : abrirSidebar();
    });
  }


  /* ══════════════════════════════════════════════════════
     PAINEL LATERAL — drawer (tablet + mobile)
     ══════════════════════════════════════════════════════ */

  const painel             = document.getElementById('painel-lateral');
  const btnFecharPainel    = document.getElementById('btn-fechar-painel');
  const btnPainelFlutuante = document.getElementById('btn-painel-flutuante');

  function abrirPainel() {
    painel.classList.add('aberto');
    overlay.classList.add('ativo');
    // fecha sidebar se estiver aberta
    fecharSidebar();
  }

  function fecharPainel() {
    painel.classList.remove('aberto');
    // remove overlay apenas se sidebar também estiver fechada
    if (!sidebar.classList.contains('aberta')) {
      overlay.classList.remove('ativo');
    }
  }

  if (btnPainelFlutuante) {
    btnPainelFlutuante.addEventListener('click', abrirPainel);
  }

  if (btnFecharPainel) {
    btnFecharPainel.addEventListener('click', fecharPainel);
  }


  /* ══════════════════════════════════════════════════════
     OVERLAY — fecha sidebar ou painel ao clicar fora
     ══════════════════════════════════════════════════════ */

  if (overlay) {
    overlay.addEventListener('click', () => {
      fecharSidebar();
      fecharPainel();
    });
  }


  /* ══════════════════════════════════════════════════════
     TECLA ESC — fecha qualquer coisa aberta
     ══════════════════════════════════════════════════════ */

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      fecharSidebar();
      fecharPainel();
    }
  });


  /* ══════════════════════════════════════════════════════
     REDIMENSIONAMENTO — limpa estados ao voltar ao desktop
     ══════════════════════════════════════════════════════ */

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1100) {
      fecharSidebar();
      fecharPainel();
    }
  });


  /* ══════════════════════════════════════════════════════
     MAPA LEAFLET
     ══════════════════════════════════════════════════════ */

  const map = L.map('mapa').setView([-22.2528, -45.7036], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // Corrige tamanho do mapa ao abrir/fechar painéis
  function invalidarMapa() {
    setTimeout(() => map.invalidateSize(), 300);
  }

  if (btnPainelFlutuante) btnPainelFlutuante.addEventListener('click', invalidarMapa);
  if (btnFecharPainel)    btnFecharPainel.addEventListener('click', invalidarMapa);
  if (btnMenu)            btnMenu.addEventListener('click', invalidarMapa);

  const linhas = {
    centro:     { nome: 'Centro',     cor: '#22c55e' },
    campus:     { nome: 'Campus',     cor: '#2563eb' },
    industrial: { nome: 'Industrial', cor: '#f97316' },
    rodoviaria: { nome: 'Rodoviária', cor: '#a855f7' }
  };

  const onibus = [
    { id: 'VB-101', linha: linhas.centro,     posicao: [-22.2528, -45.7036] },
    { id: 'VB-102', linha: linhas.centro,     posicao: [-22.2498, -45.7062] },
    { id: 'VB-103', linha: linhas.centro,     posicao: [-22.2550, -45.7001] },
    { id: 'VB-201', linha: linhas.campus,     posicao: [-22.2480, -45.6990] },
    { id: 'VB-202', linha: linhas.campus,     posicao: [-22.2465, -45.6968] },
    { id: 'VB-301', linha: linhas.industrial, posicao: [-22.2570, -45.7085] },
    { id: 'VB-302', linha: linhas.industrial, posicao: [-22.2590, -45.7055] },
    { id: 'VB-401', linha: linhas.rodoviaria, posicao: [-22.2600, -45.7000] }
  ];

  const marcadores = [];

  onibus.forEach(bus => {

    const icone = L.divIcon({
      className: '',
      html: `<div class="bus-marker" style="background:${bus.linha.cor}">🚌</div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    const marker = L.marker(bus.posicao, { icon: icone })
      .addTo(map)
      .bindPopup(`
        <strong>${bus.id}</strong><br>
        Linha: ${bus.linha.nome}<br>
        Status: Em operação
      `);

    marcadores.push(marker);

  });

  /* Movimento simulado */
  setInterval(() => {
    marcadores.forEach(marker => {
      const atual = marker.getLatLng();
      marker.setLatLng([
        atual.lat + (Math.random() - 0.5) * 0.0008,
        atual.lng + (Math.random() - 0.5) * 0.0008
      ]);
    });
  }, 3000);

})();
