(function() {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobilePanel = document.querySelector("[data-mobile-panel]");

  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", function() {
      mobilePanel.classList.toggle("is-open");
    });
  }

  const hero = document.querySelector("[data-hero]");
  if (hero) {
    const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    const prev = hero.querySelector("[data-hero-prev]");
    const next = hero.querySelector("[data-hero-next]");
    let active = 0;
    let timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      active = (index + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === active);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === active);
      });
    }

    function auto() {
      clearInterval(timer);
      timer = setInterval(function() {
        show(active + 1);
      }, 5000);
    }

    dots.forEach(function(dot, index) {
      dot.addEventListener("click", function() {
        show(index);
        auto();
      });
    });

    if (prev) {
      prev.addEventListener("click", function() {
        show(active - 1);
        auto();
      });
    }

    if (next) {
      next.addEventListener("click", function() {
        show(active + 1);
        auto();
      });
    }

    show(0);
    auto();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function filterCards(query, root) {
    const area = root || document;
    const cards = Array.from(area.querySelectorAll("[data-title]"));
    const words = normalize(query).split(/\s+/).filter(Boolean);
    cards.forEach(function(card) {
      const haystack = normalize([
        card.dataset.title,
        card.dataset.tags,
        card.dataset.year,
        card.dataset.region,
        card.textContent
      ].join(" "));
      const matched = words.every(function(word) {
        return haystack.indexOf(word) !== -1;
      });
      card.classList.toggle("is-filtered-out", words.length > 0 && !matched);
    });
  }

  const localSearch = document.querySelector("[data-local-search]");
  if (localSearch) {
    const input = localSearch.querySelector("input[name='q']");
    const list = document.querySelector("[data-card-list]");
    localSearch.addEventListener("submit", function(event) {
      event.preventDefault();
      filterCards(input ? input.value : "", list || document);
    });
    if (input) {
      input.addEventListener("input", function() {
        filterCards(input.value, list || document);
      });
    }
  }

  const globalSearch = document.querySelector("[data-global-search]");
  if (globalSearch) {
    const input = globalSearch.querySelector("input[name='q']");
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    if (input) {
      input.value = query;
    }
    filterCards(query, document);
    globalSearch.addEventListener("submit", function(event) {
      event.preventDefault();
      const value = input ? input.value : "";
      const url = value.trim() ? "search.html?q=" + encodeURIComponent(value.trim()) : "search.html";
      window.history.replaceState(null, "", url);
      filterCards(value, document);
    });
    if (input) {
      input.addEventListener("input", function() {
        filterCards(input.value, document);
      });
    }
  }
})();
