(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('img'), function (img) {
    img.addEventListener('error', function () {
      img.classList.add('image-hidden');
    });
  });

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function next() {
      show(current + 1);
    }

    function start() {
      timer = window.setInterval(next, 5000);
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      start();
    }

    var prevButton = hero.querySelector('[data-hero-prev]');
    var nextButton = hero.querySelector('[data-hero-next]');

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    start();
  }

  var filterPanel = document.querySelector('.filter-panel');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

  if (filterPanel && cards.length) {
    var searchInput = filterPanel.querySelector('[data-card-search]');
    var typeSelect = filterPanel.querySelector('[data-filter-type]');
    var regionSelect = filterPanel.querySelector('[data-filter-region]');
    var yearSelect = filterPanel.querySelector('[data-filter-year]');
    var clearButton = filterPanel.querySelector('[data-clear-filter]');
    var emptyState = filterPanel.querySelector('[data-empty]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function includesText(card, value) {
      if (!value) {
        return true;
      }
      return normalize(card.getAttribute('data-search')).indexOf(value) !== -1;
    }

    function equalsData(card, name, value) {
      if (!value) {
        return true;
      }
      return String(card.getAttribute(name) || '') === value;
    }

    function applyFilters() {
      var q = normalize(searchInput && searchInput.value);
      var typeValue = typeSelect ? typeSelect.value : '';
      var regionValue = regionSelect ? regionSelect.value : '';
      var yearValue = yearSelect ? yearSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var ok = includesText(card, q) &&
          equalsData(card, 'data-type', typeValue) &&
          equalsData(card, 'data-region', regionValue) &&
          equalsData(card, 'data-year', yearValue);
        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    if (query && searchInput) {
      searchInput.value = query;
    }

    [searchInput, typeSelect, regionSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilters);
        control.addEventListener('change', applyFilters);
      }
    });

    if (clearButton) {
      clearButton.addEventListener('click', function () {
        if (searchInput) {
          searchInput.value = '';
        }
        if (typeSelect) {
          typeSelect.value = '';
        }
        if (regionSelect) {
          regionSelect.value = '';
        }
        if (yearSelect) {
          yearSelect.value = '';
        }
        applyFilters();
      });
    }

    applyFilters();
  }
})();
