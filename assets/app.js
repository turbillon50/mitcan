/* MITCAN PWA shell — service worker bootstrap, install prompt, network state,
   light haptic & ripple feedback. Shared by every page. */
(function () {
  'use strict';

  // ---------- Service Worker ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(function (err) {
          console.warn('[MITCAN] SW registration failed:', err);
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
    el.setAttribute('aria-label', 'Instalar MITCAN');
    el.innerHTML =
      '<div class="install-banner__icon" aria-hidden="true">' +
      '<span class="material-symbols-outlined">install_mobile</span>' +
      '</div>' +
      '<div class="install-banner__body">' +
      '<strong>Instala MITCAN</strong>' +
      '<span>Acceso rápido y modo sin conexión.</span>' +
      '</div>' +
      '<button class="install-banner__cta" type="button">Instalar</button>' +
      '<button class="install-banner__close" type="button" aria-label="Cerrar">' +
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
      '<span class="dot"></span><span class="net-toast__text">Sin conexión</span>';
    document.body.appendChild(t);
    return t;
  }

  function updateNetState(initial) {
    var t = ensureToast();
    var label = t.querySelector('.net-toast__text');
    if (navigator.onLine) {
      if (initial) return;
      t.classList.add('is-online');
      label.textContent = 'Conectado de nuevo';
      t.classList.add('is-visible');
      setTimeout(function () { t.classList.remove('is-visible'); }, 2200);
    } else {
      t.classList.remove('is-online');
      label.textContent = 'Sin conexión — modo offline';
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
})();
