/* CSN — Sucursales: data + render + filter + search.
   Áreas: tepic | mazatlan | vallarta | bahia | foraneas */
(function () {
  'use strict';

  const SUCURSALES = [
    // ÁREA TEPIC
    { id: 1, area: 'tepic', areaLabel: 'Tepic', name: 'Xalisco',
      address: 'Av. Hidalgo Sur 43 b, Xalisco Centro, 63780 Xalisco, Nay.', phone: '3113413508' },
    { id: 2, area: 'tepic', areaLabel: 'Tepic', name: 'Nayarabastos',
      address: 'Tetewa 7, Nayarabastos, 63173 Tepic, Nay.', phone: '3112115253' },
    { id: 3, area: 'tepic', areaLabel: 'Tepic', name: 'México',
      address: 'Av. México Nte. 852, Lomas de la Cruz, 63037 Tepic, Nay.', phone: '3112460595' },
    { id: 4, area: 'tepic', areaLabel: 'Tepic', name: 'Rodeo Insurgentes',
      address: 'De Los Insurgentes Pte. 864, 20 de Noviembre, 63137 Tepic, Nay.', phone: '3111411874' },
    { id: 5, area: 'tepic', areaLabel: 'Tepic', name: 'Cantera',
      address: 'Villa de León 660, 63173 Tepic, Nay.', phone: '3112530630' },
    { id: 6, area: 'tepic', areaLabel: 'Tepic', name: 'Ejido' },

    // ÁREA MAZATLÁN
    { id: 7, area: 'mazatlan', areaLabel: 'Mazatlán', name: 'Real del Valle',
      address: 'Av. Óscar Pérez Escobosa 6006-int 3, Fracc. Real Pacífico, col. El Venadillo, 82124 Mazatlán, Sin.', phone: '6691770881' },
    { id: 8, area: 'mazatlan', areaLabel: 'Mazatlán', name: 'Parque Lineal',
      address: 'Av. Lib. Núm. 2 Pte. 112, Los Conchis Secc Arrecifes, 82139 Mazatlán, Sin.', phone: '6692628454' },
    { id: 9, area: 'mazatlan', areaLabel: 'Mazatlán', name: 'Ejército Mexicano',
      address: 'Internacional Supermanzana México Km 2 #3019, Periodista, 82120 Mazatlán, Sin.', phone: '6693307713' },
    { id: 10, area: 'mazatlan', areaLabel: 'Mazatlán', name: 'Mercado Juárez',
      address: 'Internacional & 13 de Abril, Benito Juárez, 82180 Mazatlán, Sin.', phone: '6692704678' },

    // ÁREA VALLARTA
    { id: 11, area: 'vallarta', areaLabel: 'Vallarta', name: 'Pitillal',
      address: 'C. Independencia 88, Bobadilla, 48298 Puerto Vallarta, Jal.', phone: '3223801423' },
    { id: 12, area: 'vallarta', areaLabel: 'Vallarta', name: 'Fluvial' },
    { id: 13, area: 'vallarta', areaLabel: 'Vallarta', name: 'Mojoneras' },
    { id: 14, area: 'vallarta', areaLabel: 'Vallarta', name: 'Poetas' },
    { id: 15, area: 'vallarta', areaLabel: 'Vallarta', name: 'Romántica',
      address: 'Aguacate 157, Zona Romántica, Emiliano Zapata, 48380 Puerto Vallarta, Jal.' },
    { id: 16, area: 'vallarta', areaLabel: 'Vallarta', name: 'Ixtapa' },

    // ÁREA BAHÍA DE BANDERAS
    { id: 17, area: 'bahia', areaLabel: 'Bahía de Banderas', name: 'Mezcales' },
    { id: 18, area: 'bahia', areaLabel: 'Bahía de Banderas', name: 'Bucerías' },
    { id: 19, area: 'bahia', areaLabel: 'Bahía de Banderas', name: 'Santa Fe' },
    { id: 20, area: 'bahia', areaLabel: 'Bahía de Banderas', name: 'San Vicente' },

    // ÁREA FORÁNEAS NAYARIT
    { id: 21, area: 'foraneas', areaLabel: 'Foráneas Nayarit', name: 'Santiago' },
    { id: 22, area: 'foraneas', areaLabel: 'Foráneas Nayarit', name: 'La Peñita' },
    { id: 23, area: 'foraneas', areaLabel: 'Foráneas Nayarit', name: 'Villa Hidalgo' },
    { id: 24, area: 'foraneas', areaLabel: 'Foráneas Nayarit', name: 'Ixtlán del Río' },
  ];

  const GROUPS = [
    { key: 'tepic', title: 'Área Tepic' },
    { key: 'mazatlan', title: 'Área Mazatlán' },
    { key: 'vallarta', title: 'Área Vallarta' },
    { key: 'bahia', title: 'Área Bahía de Banderas' },
    { key: 'foraneas', title: 'Área Foráneas Nayarit' },
  ];

  const norm = (s) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

  function fmtPhone(p) {
    if (!p) return '';
    const d = p.replace(/\D/g, '');
    if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return p;
  }

  function mapsHref(address) {
    return 'https://maps.google.com/?q=' + encodeURIComponent(address + ' Carnes Selectas Nayarit');
  }

  function cardHTML(s) {
    const hasAddr = !!s.address;
    const idStr = String(s.id).padStart(2, '0');
    const actions = [];
    if (s.phone) {
      actions.push(
        `<a href="tel:+52${s.phone}" class="flex-1 inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary-container px-3 py-2 rounded-lg text-label-md inner-glow active:opacity-80">
          <span class="material-symbols-outlined text-base">call</span>
          ${fmtPhone(s.phone)}
        </a>`
      );
    }
    if (hasAddr) {
      actions.push(
        `<a href="${mapsHref(s.address)}" target="_blank" rel="noopener" class="flex-1 inline-flex items-center justify-center gap-2 bg-surface-variant text-on-surface px-3 py-2 rounded-lg text-label-md hover:text-primary active:opacity-80">
          <span class="material-symbols-outlined text-base">directions</span>
          Cómo llegar
        </a>`
      );
    }
    const actionsHTML = actions.length
      ? `<div class="flex gap-2 mt-stack-sm">${actions.join('')}</div>`
      : `<div class="mt-stack-sm">
          <span class="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-on-surface-variant/80 bg-surface-variant/60 px-2 py-1 rounded-full">
            <span class="material-symbols-outlined text-[14px]">schedule</span>
            Direcciones próximamente
          </span>
        </div>`;

    return `
      <article class="glass-card p-stack-md rounded-xl flex flex-col gap-1 transition-transform active:scale-[0.99]"
               data-area="${s.area}"
               data-search="${norm(s.name + ' ' + (s.address || '') + ' ' + s.areaLabel)}">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3a1c00] to-[#0e0e0e] flex items-center justify-center border border-primary/20 shrink-0">
            <span class="text-primary font-bold text-label-md">${idStr}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[10px] text-on-surface-variant/80 uppercase tracking-wider">${s.areaLabel}</p>
            <h3 class="text-body-lg font-bold text-on-surface leading-tight">${s.name}</h3>
            ${hasAddr ? `<p class="text-body-md text-on-surface-variant mt-1 leading-snug">${s.address}</p>` : ''}
          </div>
        </div>
        ${actionsHTML}
      </article>`;
  }

  function groupHTML(group, items) {
    if (!items.length) return '';
    return `
      <section data-group="${group.key}" class="flex flex-col gap-stack-md">
        <div class="flex justify-between items-end">
          <h3 class="text-headline-md text-on-surface">${group.title}</h3>
          <span class="text-label-md text-on-surface-variant">${items.length}</span>
        </div>
        <div class="flex flex-col gap-stack-md">${items.map(cardHTML).join('')}</div>
      </section>`;
  }

  function render(filterArea, search) {
    const root = document.getElementById('suc-list');
    if (!root) return;
    const q = norm(search);
    let visible = 0;
    const html = GROUPS.filter((g) => filterArea === 'all' || filterArea === g.key)
      .map((g) => {
        const filtered = SUCURSALES.filter(
          (s) => s.area === g.key &&
            (!q || norm(s.name + ' ' + (s.address || '') + ' ' + s.areaLabel).includes(q))
        );
        visible += filtered.length;
        return groupHTML(g, filtered);
      })
      .join('');
    root.innerHTML = html;
    const empty = document.getElementById('suc-empty');
    if (empty) empty.classList.toggle('hidden', visible > 0);
  }

  function bind() {
    let activeFilter = 'all';
    let activeSearch = '';
    const chips = document.querySelectorAll('[data-filter]');
    chips.forEach((b) => {
      b.addEventListener('click', () => {
        chips.forEach((c) => {
          c.classList.remove('bg-primary-container', 'text-on-primary-container', 'active-glow');
          c.classList.add('bg-surface-variant', 'text-on-surface-variant');
        });
        b.classList.remove('bg-surface-variant', 'text-on-surface-variant');
        b.classList.add('bg-primary-container', 'text-on-primary-container', 'active-glow');
        activeFilter = b.dataset.filter;
        render(activeFilter, activeSearch);
      });
    });
    const input = document.getElementById('suc-search');
    if (input) {
      input.addEventListener('input', (e) => {
        activeSearch = e.target.value;
        render(activeFilter, activeSearch);
      });
    }
    render(activeFilter, activeSearch);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
