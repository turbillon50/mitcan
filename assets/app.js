/* CSN PWA shell — service worker bootstrap, install prompt, network state,
   light haptic & ripple feedback. Shared by every page. */
(function () {
  'use strict';

  // ---------- Service Worker ----------
  // When a new shell version is detected we activate it immediately and
  // reload, so design/copy updates appear on the next paint instead of
  // after every tab is closed.
  if ('serviceWorker' in navigator) {
    var reloadingForUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloadingForUpdate) return;
      reloadingForUpdate = true;
      window.location.reload();
    });

    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then(function (reg) {
          function promote(worker) {
            if (!worker) return;
            worker.addEventListener('statechange', function () {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                worker.postMessage('SKIP_WAITING');
              }
            });
          }
          if (reg.waiting && navigator.serviceWorker.controller) {
            reg.waiting.postMessage('SKIP_WAITING');
          }
          promote(reg.installing);
          reg.addEventListener('updatefound', function () { promote(reg.installing); });

          document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
              reg.update().catch(function () { /* noop */ });
            }
          });
        })
        .catch(function (err) {
          console.warn('[CSN] SW registration failed:', err);
        });
    });
  }

  // ---------- Install prompt ----------
  var deferredPrompt = null;
  var DISMISS_KEY = 'mitcan:install-dismissed-at';
  var DISMISS_DAYS = 14;

  function buildBanner() {
    if (document.querySelector('.install-banner')) return null;
    var el = document.createElement('div');
    el.className = 'install-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Instalar CSN');
    el.innerHTML =
      '<div class="install-banner__icon" aria-hidden="true">' +
      '<span class="material-symbols-outlined">install_mobile</span>' +
      '</div>' +
      '<div class="install-banner__body">' +
      '<strong>' + tr('install.title', 'Instala CSN') + '</strong>' +
      '<span>' + tr('install.body', 'Acceso rápido y modo sin conexión.') + '</span>' +
      '</div>' +
      '<button class="install-banner__cta" type="button">' + tr('install.cta', 'Instalar') + '</button>' +
      '<button class="install-banner__close" type="button" aria-label="' + tr('install.dismiss', 'Cerrar') + '">' +
      '<span class="material-symbols-outlined">close</span>' +
      '</button>';
    document.body.appendChild(el);
    return el;
  }

  function showBanner() {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    var last = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (last && Date.now() - last < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    var el = buildBanner();
    if (!el) return;
    requestAnimationFrame(function () { el.classList.add('is-open'); });

    el.querySelector('.install-banner__cta').addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        el.classList.remove('is-open');
      });
    });
    el.querySelector('.install-banner__close').addEventListener('click', function () {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      el.classList.remove('is-open');
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  window.addEventListener('appinstalled', function () {
    var el = document.querySelector('.install-banner');
    if (el) el.classList.remove('is-open');
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  });

  // ---------- Network status toast ----------
  function ensureToast() {
    var t = document.querySelector('.net-toast');
    if (t) return t;
    t = document.createElement('div');
    t.className = 'net-toast';
    t.innerHTML =
      '<span class="dot"></span><span class="net-toast__text"></span>';
    document.body.appendChild(t);
    return t;
  }

  function tr(key, fallback) {
    return (window.CSN && window.CSN.tr) ? window.CSN.tr(key) : fallback;
  }

  function updateNetState(initial) {
    var t = ensureToast();
    var label = t.querySelector('.net-toast__text');
    if (navigator.onLine) {
      if (initial) return;
      t.classList.add('is-online');
      label.textContent = tr('net.online', 'Conectado de nuevo');
      t.classList.add('is-visible');
      setTimeout(function () { t.classList.remove('is-visible'); }, 2200);
    } else {
      t.classList.remove('is-online');
      label.textContent = tr('net.offline', 'Sin conexión — modo offline');
      t.classList.add('is-visible');
    }
  }

  window.addEventListener('online', function () { updateNetState(false); });
  window.addEventListener('offline', function () { updateNetState(false); });
  document.addEventListener('DOMContentLoaded', function () { updateNetState(true); });

  // ---------- Active bottom-nav state ----------
  function normalizePath(p) {
    if (!p) return '/';
    p = p.replace(/\/index(\.html)?$/, '/');
    p = p.replace(/\.html$/, '');
    p = p.replace(/\/$/, '');
    return p || '/';
  }
  document.addEventListener('DOMContentLoaded', function () {
    var path = normalizePath(location.pathname);
    document.querySelectorAll('.bottom-nav a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href === '#') {
        a.removeAttribute('aria-current');
        return;
      }
      if (normalizePath(href) === path) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  });

  // ---------- Light haptic + scale on tap ----------
  function bindFeedback() {
    document.querySelectorAll('button, .bottom-nav a').forEach(function (el) {
      if (el.dataset.mfx === '1') return;
      el.dataset.mfx = '1';
      el.addEventListener('pointerdown', function () {
        el.style.transform = (el.getAttribute('aria-current') === 'page')
          ? 'scale(1.04)'
          : 'scale(0.96)';
      });
      var release = function () {
        el.style.transform = '';
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointerleave', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('click', function () {
        if ('vibrate' in navigator) navigator.vibrate(6);
      });
    });
  }
  document.addEventListener('DOMContentLoaded', bindFeedback);

  // ---------- Header shadow on scroll ----------
  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('.app-header');
    if (!header) return;
    var onScroll = function () {
      if (window.scrollY > 12) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });


  // ---------- Desktop sidebar injection ----------
  function normPath(p) {
    p = (p || '/').replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '').replace(/\/$/, '');
    return p || '/';
  }

  function buildSidebar() {
    if (document.querySelector('.sidebar-nav')) return;
    var path = normPath(location.pathname);
    var links = [
      { href: '/',            icon: 'home',         label: 'Inicio' },
      { href: '/catalogo',    icon: 'grid_view',    label: 'Catálogo' },
      { href: '/pedido',      icon: 'shopping_bag', label: 'Pedidos' },
      { href: '/sucursales',  icon: 'location_on',  label: 'Sucursales' },
      { href: '/recompensas', icon: 'redeem',       label: 'Premios' },
    ];
    var nav = document.createElement('nav');
    nav.className = 'sidebar-nav';
    nav.setAttribute('aria-label', 'Navegación principal');

    var brand = document.createElement('div');
    brand.className = 'sidebar-brand';
    brand.innerHTML =
      '<img src="/assets/logo-badge-sm.png" alt="CSN" width="34" height="29" />' +
      '<span class="sidebar-brand-name">CSN</span>';
    nav.appendChild(brand);

    links.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.href;
      a.innerHTML = '<span class="material-symbols-outlined">' + l.icon + '</span>' + l.label;
      if (normPath(l.href) === path) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    });

    var footer = document.createElement('div');
    footer.className = 'sidebar-footer';

    var themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.innerHTML = '<span class="material-symbols-outlined" id="sb-theme-icon">dark_mode</span><span>Tema</span>';
    themeBtn.addEventListener('click', function () {
      var isDark = document.body.dataset.theme === 'dark';
      document.body.dataset.theme = isDark ? 'light' : 'dark';
      localStorage.setItem('csn-theme', document.body.dataset.theme);
      document.getElementById('sb-theme-icon').textContent = isDark ? 'dark_mode' : 'light_mode';
    });

    var langBtn = document.createElement('button');
    langBtn.type = 'button';
    langBtn.innerHTML = '<span class="material-symbols-outlined">translate</span><span>Idioma</span>';
    langBtn.addEventListener('click', function () {
      var btn = document.querySelector('[data-action="toggle-lang"]');
      if (btn) btn.click();
    });

    footer.appendChild(themeBtn);
    footer.appendChild(langBtn);
    nav.appendChild(footer);

    document.body.insertBefore(nav, document.body.firstChild);

    var icon = document.getElementById('sb-theme-icon');
    if (icon) icon.textContent = document.body.dataset.theme === 'dark' ? 'light_mode' : 'dark_mode';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.matchMedia('(min-width: 768px)').matches) buildSidebar();
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', function (e) {
    if (e.matches) buildSidebar();
  });

})();
