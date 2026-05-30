/* CSN PWA — i18n dictionary + applyLang().
   Strings live here; HTML elements opt in with data-i18n="key". */
(function () {
  'use strict';

  const DICT = {
    es: {
      'brand.full': 'CSN — Carnes Selectas Nayarit',
      'brand.short': 'CSN',
      'a11y.menu': 'Menú',
      'a11y.notifications': 'Notificaciones',
      'a11y.back': 'Volver',
      'a11y.theme': 'Cambiar tema',
      'a11y.lang': 'Cambiar idioma',

      'nav.home': 'Inicio',
      'nav.catalog': 'Catálogo',
      'nav.orders': 'Pedidos',
      'nav.locations': 'Sucursales',
      'nav.rewards': 'Premios',

      'home.hello': 'Hola, Miguel 👋',
      'home.points-label': 'Tus puntos',
      'home.tofor': 'Te faltan <strong>100 puntos</strong> para llegar a <strong>Maestro del Carbón 🔥</strong>',
      'home.level-label': 'Nivel actual',
      'home.level-value': 'Taquero Oficial 🥩',
      'home.qr-title': 'Escanea en caja 🥩',
      'home.qr-body': 'Súmate puntos en cada compra y desbloquea recompensas en tu carnicería favorita.',
      'home.qr-cta': 'Ver código numérico',
      'home.promos-title': 'Promos para ti 🔥',
      'home.see-all': 'Ver todas',
      'home.promo1-title': 'Doble puntos',
      'home.promo1-body': 'en cortes selectos',
      'home.promo1-when': 'Válido hoy',
      'home.promo2-title': 'Envío gratis',
      'home.promo2-body': 'en compras > $500',
      'home.promo2-when': 'Fin de semana',

      'catalog.title': 'Catálogo',
      'catalog.search': 'Buscar productos',
      'catalog.cat.beef': 'Res',
      'catalog.cat.pork': 'Cerdo',
      'catalog.cat.chicken': 'Pollo',
      'catalog.cat.dairy': 'Lácteos',
      'catalog.cat.pantry': 'Despensa',
      'catalog.cuts': 'Cortes de res',
      'catalog.combos': 'Combos',
      'catalog.see-all': 'Ver todas',
      'catalog.best-seller': 'Best Seller',
      'catalog.combo-title': 'Combo Parrillero',
      'catalog.combo-body': 'Ribeye, arrachera, chorizo, queso',
      'catalog.kg': '/ kg',

      'rewards.title': 'Mis recompensas',
      'rewards.available': 'Disponibles',
      'rewards.redeemed': 'Canjeadas',
      'rewards.filter.all': 'Todas',
      'rewards.filter.coupons': 'Cupones',
      'rewards.filter.discounts': 'Descuentos',
      'rewards.filter.shipping': 'Envío',
      'rewards.use': 'Usar',
      'rewards.valid-until': 'Válido hasta',
      'rewards.r1.title': '10% de descuento',
      'rewards.r1.body': 'En tu próxima compra',
      'rewards.r2.title': 'Envío gratis',
      'rewards.r2.body': 'En compras mayores a $500',
      'rewards.r3.title': '$100 de descuento',
      'rewards.r3.body': 'En cortes premium',
      'rewards.locked.title': 'Postre gratis',
      'rewards.locked.body': 'Faltan 250 pts para desbloquear',
      'rewards.card.level': 'Nivel Oro Parrillero',
      'rewards.card.balance': 'Balance de puntos',

      'orders.title': 'Pedido en camino',
      'orders.order-id': 'Pedido',
      'orders.headline': 'Tu pedido va en camino',
      'orders.status.on-way': 'En camino',
      'orders.eta-label': 'Llegada estimada',
      'orders.eta-value': '25 min',
      'orders.driver-label': 'Repartidor',
      'orders.driver-orders': 'pedidos',
      'orders.home': 'Casa',

      'locations.title': 'Sucursales',
      'locations.coverage': 'Cobertura',
      'locations.count': '24 sucursales',
      'locations.states': '3 estados',
      'locations.search': 'Buscar por nombre, ciudad o colonia',
      'locations.filter.all': 'Todas',
      'locations.area.tepic': 'Tepic',
      'locations.area.mazatlan': 'Mazatlán',
      'locations.area.vallarta': 'Vallarta',
      'locations.area.bahia': 'Bahía de Banderas',
      'locations.area.foraneas': 'Foráneas Nayarit',
      'locations.area.tepic.title': 'Área Tepic',
      'locations.area.mazatlan.title': 'Área Mazatlán',
      'locations.area.vallarta.title': 'Área Vallarta',
      'locations.area.bahia.title': 'Área Bahía de Banderas',
      'locations.area.foraneas.title': 'Área Foráneas Nayarit',
      'locations.directions': 'Cómo llegar',
      'locations.soon': 'Direcciones próximamente',
      'locations.empty': 'No encontramos sucursales con ese criterio.',

      'offline.title': 'Sin conexión',
      'offline.body': 'Parece que estás sin internet. Vuelve a intentarlo cuando recuperes conexión.',
      'offline.retry': 'Reintentar',
      'offline.home': 'Volver al inicio',
      '404.title': 'No encontramos esta página.',
      '404.body': 'Quizá la moviste a la parrilla.',
      '404.home': 'Volver al inicio',

      'install.title': 'Instala CSN',
      'install.body': 'Acceso rápido y modo sin conexión.',
      'install.cta': 'Instalar',
      'install.dismiss': 'Cerrar',
      'net.offline': 'Sin conexión — modo offline',
      'net.online': 'Conectado de nuevo',
    },
    en: {
      'brand.full': 'CSN — Carnes Selectas Nayarit',
      'brand.short': 'CSN',
      'a11y.menu': 'Menu',
      'a11y.notifications': 'Notifications',
      'a11y.back': 'Back',
      'a11y.theme': 'Toggle theme',
      'a11y.lang': 'Change language',

      'nav.home': 'Home',
      'nav.catalog': 'Catalog',
      'nav.orders': 'Orders',
      'nav.locations': 'Locations',
      'nav.rewards': 'Rewards',

      'home.hello': 'Hi, Miguel 👋',
      'home.points-label': 'Your points',
      'home.tofor': '<strong>100 points</strong> to reach <strong>Charcoal Master 🔥</strong>',
      'home.level-label': 'Current level',
      'home.level-value': 'Official Taquero 🥩',
      'home.qr-title': 'Scan at checkout 🥩',
      'home.qr-body': 'Earn points on every purchase and unlock rewards at your favorite butcher shop.',
      'home.qr-cta': 'View member code',
      'home.promos-title': 'Promos for you 🔥',
      'home.see-all': 'See all',
      'home.promo1-title': 'Double points',
      'home.promo1-body': 'on select cuts',
      'home.promo1-when': 'Today only',
      'home.promo2-title': 'Free shipping',
      'home.promo2-body': 'on orders over $500',
      'home.promo2-when': 'Weekend',

      'catalog.title': 'Catalog',
      'catalog.search': 'Search products',
      'catalog.cat.beef': 'Beef',
      'catalog.cat.pork': 'Pork',
      'catalog.cat.chicken': 'Chicken',
      'catalog.cat.dairy': 'Dairy',
      'catalog.cat.pantry': 'Pantry',
      'catalog.cuts': 'Beef cuts',
      'catalog.combos': 'Combos',
      'catalog.see-all': 'See all',
      'catalog.best-seller': 'Best Seller',
      'catalog.combo-title': 'Grill Combo',
      'catalog.combo-body': 'Ribeye, skirt steak, chorizo, cheese',
      'catalog.kg': '/ kg',

      'rewards.title': 'My rewards',
      'rewards.available': 'Available',
      'rewards.redeemed': 'Redeemed',
      'rewards.filter.all': 'All',
      'rewards.filter.coupons': 'Coupons',
      'rewards.filter.discounts': 'Discounts',
      'rewards.filter.shipping': 'Shipping',
      'rewards.use': 'Use',
      'rewards.valid-until': 'Valid until',
      'rewards.r1.title': '10% off',
      'rewards.r1.body': 'on your next purchase',
      'rewards.r2.title': 'Free shipping',
      'rewards.r2.body': 'on orders over $500',
      'rewards.r3.title': '$100 off',
      'rewards.r3.body': 'on premium cuts',
      'rewards.locked.title': 'Free dessert',
      'rewards.locked.body': '250 pts left to unlock',
      'rewards.card.level': 'Gold Grill Level',
      'rewards.card.balance': 'Points balance',

      'orders.title': 'Order on the way',
      'orders.order-id': 'Order',
      'orders.headline': 'Your order is on the way',
      'orders.status.on-way': 'On the way',
      'orders.eta-label': 'ETA',
      'orders.eta-value': '25 min',
      'orders.driver-label': 'Driver',
      'orders.driver-orders': 'orders',
      'orders.home': 'Home',

      'locations.title': 'Locations',
      'locations.coverage': 'Coverage',
      'locations.count': '24 locations',
      'locations.states': '3 states',
      'locations.search': 'Search by name, city or neighborhood',
      'locations.filter.all': 'All',
      'locations.area.tepic': 'Tepic',
      'locations.area.mazatlan': 'Mazatlán',
      'locations.area.vallarta': 'Vallarta',
      'locations.area.bahia': 'Banderas Bay',
      'locations.area.foraneas': 'Outer Nayarit',
      'locations.area.tepic.title': 'Tepic Area',
      'locations.area.mazatlan.title': 'Mazatlán Area',
      'locations.area.vallarta.title': 'Vallarta Area',
      'locations.area.bahia.title': 'Banderas Bay Area',
      'locations.area.foraneas.title': 'Outer Nayarit Area',
      'locations.directions': 'Get directions',
      'locations.soon': 'Addresses coming soon',
      'locations.empty': 'No locations match your search.',

      'offline.title': 'Offline',
      'offline.body': "Looks like you're offline. Try again once you're back online.",
      'offline.retry': 'Retry',
      'offline.home': 'Back to home',
      '404.title': 'Page not found.',
      '404.body': 'Maybe it ended up on the grill.',
      '404.home': 'Back to home',

      'install.title': 'Install CSN',
      'install.body': 'Quick access and offline support.',
      'install.cta': 'Install',
      'install.dismiss': 'Close',
      'net.offline': 'Offline — working from cache',
      'net.online': 'Back online',
    },
  };

  const LANG_KEY = 'csn:lang';
  const THEME_KEY = 'csn:theme';

  function detectLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
    const nav = (navigator.language || 'es').toLowerCase();
    return nav.startsWith('en') ? 'en' : 'es';
  }

  function detectTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function tr(key, lang) {
    const l = lang || detectLang();
    return (DICT[l] && DICT[l][key]) || (DICT.es && DICT.es[key]) || key;
  }

  function applyLang(lang) {
    const l = lang || detectLang();
    document.documentElement.lang = l;
    localStorage.setItem(LANG_KEY, l);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = tr(key, l);
      if (el.dataset.i18nHtml !== undefined) el.innerHTML = value;
      else el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const spec = el.getAttribute('data-i18n-attr');
      // spec format: "attr:key, attr2:key2"
      spec.split(',').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, tr(key, l));
      });
    });

    document.querySelectorAll('[data-lang-toggle-label]').forEach((el) => {
      el.textContent = l === 'es' ? 'EN' : 'ES';
    });
  }

  function applyTheme(theme) {
    const t = theme || detectTheme();
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);

    // Reflect in theme-color so the browser chrome / iOS status bar match.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#14100b' : '#faf4ec');

    document.querySelectorAll('[data-theme-toggle-icon]').forEach((el) => {
      el.textContent = t === 'dark' ? 'light_mode' : 'dark_mode';
    });
  }

  function toggleLang() {
    const next = detectLang() === 'es' ? 'en' : 'es';
    applyLang(next);
  }
  function toggleTheme() {
    const next = detectTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  // Boot ASAP so theme is applied before paint.
  applyTheme();
  document.addEventListener('DOMContentLoaded', function () {
    applyLang();
    document.querySelectorAll('[data-action="toggle-lang"]').forEach((b) =>
      b.addEventListener('click', toggleLang)
    );
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((b) =>
      b.addEventListener('click', toggleTheme)
    );
  });

  window.CSN = { applyLang, applyTheme, toggleLang, toggleTheme, tr };
})();
