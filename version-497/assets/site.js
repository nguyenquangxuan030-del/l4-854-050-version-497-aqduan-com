(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initPlayers();
    applyQuery();
  });

  function initMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });
    restart();
  }

  function initFilters() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.filter-targets .movie-card'));
    if (!cards.length) {
      return;
    }
    var input = document.querySelector('[data-filter-input]');
    var type = document.querySelector('[data-filter-type]');
    var year = document.querySelector('[data-filter-year]');
    var category = document.querySelector('[data-filter-category]');
    var reset = document.querySelector('[data-filter-reset]');
    var empty = document.querySelector('[data-empty-state]');

    function textOf(card) {
      return [
        card.getAttribute('data-title'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-year'),
        card.getAttribute('data-tags'),
        card.getAttribute('data-summary')
      ].join(' ').toLowerCase();
    }

    function matchSelect(card, select, attr) {
      if (!select || !select.value) {
        return true;
      }
      var value = card.getAttribute(attr) || '';
      if (attr === 'data-year') {
        return Number(value) >= Number(select.value);
      }
      return value.indexOf(select.value) !== -1;
    }

    function run() {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var visible = 0;
      cards.forEach(function (card) {
        var matches = true;
        if (keyword && textOf(card).indexOf(keyword) === -1) {
          matches = false;
        }
        if (!matchSelect(card, type, 'data-type')) {
          matches = false;
        }
        if (!matchSelect(card, year, 'data-year')) {
          matches = false;
        }
        if (!matchSelect(card, category, 'data-category')) {
          matches = false;
        }
        card.style.display = matches ? '' : 'none';
        if (matches) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('show', visible === 0);
      }
    }

    [input, type, year, category].forEach(function (el) {
      if (el) {
        el.addEventListener('input', run);
        el.addEventListener('change', run);
      }
    });
    if (reset) {
      reset.addEventListener('click', function () {
        if (input) {
          input.value = '';
        }
        [type, year, category].forEach(function (el) {
          if (el) {
            el.value = '';
          }
        });
        run();
      });
    }
    run();
  }

  function applyQuery() {
    var input = document.querySelector('[data-filter-input]');
    if (!input) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');
    if (query) {
      input.value = query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (shell) {
      var video = shell.querySelector('video');
      var cover = shell.querySelector('.player-cover');
      var src = shell.getAttribute('data-src');
      var loaded = false;
      var hls = null;
      if (!video || !cover || !src) {
        return;
      }

      function attach() {
        if (loaded) {
          return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          video.src = src;
        }
        loaded = true;
      }

      function start() {
        attach();
        cover.classList.add('is-hidden');
        video.setAttribute('controls', 'controls');
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            cover.classList.remove('is-hidden');
          });
        }
      }

      cover.addEventListener('click', start);
      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });
      video.addEventListener('ended', function () {
        cover.classList.remove('is-hidden');
      });
      window.addEventListener('pagehide', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }
})();
