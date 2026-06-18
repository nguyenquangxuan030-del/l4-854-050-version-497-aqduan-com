(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var toggle = document.querySelector(".mobile-toggle");
    var menu = document.querySelector(".mobile-menu");

    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var opened = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!opened));
        menu.hidden = opened;
      });
    }

    var hero = document.querySelector("[data-hero-slider]");

    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
      var current = 0;

      function showSlide(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === current);
        });
      }

      dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
          showSlide(index);
        });
      });

      if (slides.length > 1) {
        window.setInterval(function () {
          showSlide(current + 1);
        }, 5200);
      }
    }

    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));

    panels.forEach(function (panel) {
      var input = panel.querySelector("[data-filter-input]");
      var year = panel.querySelector("[data-year-filter]");
      var region = panel.querySelector("[data-region-filter]");
      var grid = document.querySelector("[data-card-grid]");
      var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".movie-card")) : [];

      if (!grid || cards.length === 0) {
        return;
      }

      function applyFilter() {
        var keyword = input ? input.value.trim().toLowerCase() : "";
        var selectedYear = year ? year.value : "";
        var selectedRegion = region ? region.value : "";

        cards.forEach(function (card) {
          var text = card.getAttribute("data-search") || "";
          var cardYear = card.getAttribute("data-year") || "";
          var cardRegion = card.getAttribute("data-region") || "";
          var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
          var matchYear = !selectedYear || cardYear === selectedYear;
          var matchRegion = !selectedRegion || cardRegion === selectedRegion;
          card.classList.toggle("is-hidden", !(matchKeyword && matchYear && matchRegion));
        });
      }

      if (input) {
        input.addEventListener("input", applyFilter);
      }
      if (year) {
        year.addEventListener("change", applyFilter);
      }
      if (region) {
        region.addEventListener("change", applyFilter);
      }

      var params = new URLSearchParams(window.location.search);
      var query = params.get("q");

      if (query && input) {
        input.value = query;
        applyFilter();
      }
    });
  });
})();
