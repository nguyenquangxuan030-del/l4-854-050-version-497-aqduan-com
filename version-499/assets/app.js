(function () {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initSearchForms() {
    selectAll('[data-site-search]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var value = input ? input.value.trim() : '';
        var target = './search.html';
        if (value) {
          target += '?q=' + encodeURIComponent(value);
        }
        window.location.href = target;
      });
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = selectAll('[data-hero-slide]', hero);
    var dots = selectAll('[data-hero-dot]', hero);
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
      });
    });
    show(0);
    window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function initCatalog() {
    var page = document.querySelector('[data-catalog-page]');
    if (!page) {
      return;
    }
    var input = page.querySelector('[data-catalog-search]');
    var sort = page.querySelector('[data-catalog-sort]');
    var list = page.querySelector('[data-catalog-list]');
    var items = list ? selectAll('.catalog-item', list) : [];
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    if (input && query) {
      input.value = query;
    }

    function filter() {
      var value = input ? input.value.trim().toLowerCase() : '';
      items.forEach(function (item) {
        var text = (item.getAttribute('data-search') || '').toLowerCase();
        item.hidden = value ? text.indexOf(value) === -1 : false;
      });
    }

    function sortItems() {
      if (!sort || !list) {
        return;
      }
      var mode = sort.value;
      var sorted = items.slice().sort(function (a, b) {
        if (mode === 'views') {
          return Number(b.dataset.views || 0) - Number(a.dataset.views || 0);
        }
        if (mode === 'year') {
          return Number((b.dataset.year || '').match(/\d{4}/) || 0) - Number((a.dataset.year || '').match(/\d{4}/) || 0);
        }
        if (mode === 'title') {
          return (a.dataset.title || '').localeCompare(b.dataset.title || '', 'zh-Hans-CN');
        }
        return String(b.dataset.date || '').localeCompare(String(a.dataset.date || ''));
      });
      sorted.forEach(function (item) {
        list.appendChild(item);
      });
      items = sorted;
      filter();
    }

    if (input) {
      input.addEventListener('input', filter);
    }
    if (sort) {
      sort.addEventListener('change', sortItems);
      sortItems();
    } else {
      filter();
    }
  }

  function initPlayer() {
    var video = document.querySelector('[data-player-video]');
    var overlay = document.querySelector('[data-player-overlay]');
    var config = document.getElementById('media-config');
    if (!video || !config) {
      return;
    }

    var stream = '';
    try {
      stream = JSON.parse(config.textContent || '{}').stream || '';
    } catch (error) {
      stream = '';
    }

    var attached = false;
    var hlsInstance = null;

    function attachStream() {
      if (attached || !stream) {
        return;
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            hlsInstance.destroy();
          }
        });
      } else {
        video.src = stream;
      }
      attached = true;
    }

    function startPlayback() {
      attachStream();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener('click', startPlayback);
    }
    video.addEventListener('click', function () {
      if (!attached) {
        startPlayback();
      }
    });
    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    });
    window.addEventListener('pagehide', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initSearchForms();
    initHero();
    initCatalog();
    initPlayer();
  });
})();
