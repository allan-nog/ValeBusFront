(function () {
  'use strict';

  /* RELÓGIO */

  function atualizarHora() {

    const el = document.getElementById('topbar-hora');

    if (!el) return;

    const agora = new Date();

    const h = String(
      agora.getHours()
    ).padStart(2, '0');

    const m = String(
      agora.getMinutes()
    ).padStart(2, '0');

    el.textContent = `${h}:${m}`;
  }

  atualizarHora();

  setInterval(
    atualizarHora,
    5000
  );

  /* SIDEBAR */

  const navItems =
    document.querySelectorAll(
      '.nav__item[data-secao]'
    );

  navItems.forEach(item => {

    item.addEventListener('click', () => {

      navItems.forEach(n =>
        n.classList.remove(
          'nav__item--ativo'
        )
      );

      item.classList.add(
        'nav__item--ativo'
      );

    });

  });

  /* MAPA */

  const map = L.map('mapa').setView(
    [-22.2528, -45.7036],
    14
  );

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; OpenStreetMap'
    }
  ).addTo(map);

  const linhas = {

    centro: {
      nome: 'Centro',
      cor: '#22c55e'
    },

    campus: {
      nome: 'Campus',
      cor: '#2563eb'
    },

    industrial: {
      nome: 'Industrial',
      cor: '#f97316'
    },

    rodoviaria: {
      nome: 'Rodoviária',
      cor: '#a855f7'
    }

  };

  const onibus = [

    {
      id: 'VB-101',
      linha: linhas.centro,
      posicao: [-22.2528, -45.7036]
    },

    {
      id: 'VB-102',
      linha: linhas.centro,
      posicao: [-22.2498, -45.7062]
    },

    {
      id: 'VB-103',
      linha: linhas.centro,
      posicao: [-22.2550, -45.7001]
    },

    {
      id: 'VB-201',
      linha: linhas.campus,
      posicao: [-22.2480, -45.6990]
    },

    {
      id: 'VB-202',
      linha: linhas.campus,
      posicao: [-22.2465, -45.6968]
    },

    {
      id: 'VB-301',
      linha: linhas.industrial,
      posicao: [-22.2570, -45.7085]
    },

    {
      id: 'VB-302',
      linha: linhas.industrial,
      posicao: [-22.2590, -45.7055]
    },

    {
      id: 'VB-401',
      linha: linhas.rodoviaria,
      posicao: [-22.2600, -45.7000]
    }

  ];

  const marcadores = [];

  onibus.forEach(bus => {

    const icone = L.divIcon({

      className: '',

      html: `
        <div
          class="bus-marker"
          style="background:${bus.linha.cor}">
          🚌
        </div>
      `,

      iconSize: [42, 42],
      iconAnchor: [21, 21]

    });

    const marker = L.marker(
      bus.posicao,
      {
        icon: icone
      }
    )
    .addTo(map)
    .bindPopup(`
      <strong>${bus.id}</strong><br>
      Linha: ${bus.linha.nome}<br>
      Status: Em operação
    `);

    marcadores.push(marker);

  });

  /* MOVIMENTO SIMULADO */

  setInterval(() => {

    marcadores.forEach(marker => {

      const atual =
        marker.getLatLng();

      marker.setLatLng([

        atual.lat +
          (Math.random() - 0.5)
          * 0.0008,

        atual.lng +
          (Math.random() - 0.5)
          * 0.0008

      ]);

    });

  }, 3000);

})();