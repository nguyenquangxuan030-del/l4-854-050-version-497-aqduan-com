(function() {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMenu() {
    var button = document.querySelector(".menu-toggle");
    var panel = document.getElementById("mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function() {
      var open = panel.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = selectAll(".hero-slide", hero);
    var dots = selectAll(".hero-dot", hero);
    var thumbs = selectAll(".hero-thumb", hero);
    var current = 0;
    var timer = null;

    function setSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle("active", i === current);
      });
      thumbs.forEach(function(thumb, i) {
        thumb.classList.toggle("active", i === current);
      });
    }

    function start() {
      clearInterval(timer);
      timer = setInterval(function() {
        setSlide(current + 1);
      }, 5600);
    }

    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        setSlide(Number(dot.getAttribute("data-slide")) || 0);
        start();
      });
    });

    thumbs.forEach(function(thumb) {
      thumb.addEventListener("mouseenter", function() {
        setSlide(Number(thumb.getAttribute("data-slide")) || 0);
      });
    });

    start();
  }

  function initFilters() {
    var scope = document.querySelector("[data-filter-scope]");
    if (!scope) {
      return;
    }
    var input = scope.querySelector(".filter-input");
    var year = scope.querySelector(".filter-year");
    var region = scope.querySelector(".filter-region");
    var cards = selectAll(".movie-card, .ranking-row");

    function apply() {
      var keyword = input ? input.value.trim().toLowerCase() : "";
      var yearValue = year ? year.value : "";
      var regionValue = region ? region.value : "";
      cards.forEach(function(card) {
        var keyText = card.getAttribute("data-keywords") || "";
        var cardYear = card.getAttribute("data-year") || "";
        var cardRegion = card.getAttribute("data-region") || "";
        var matchedKeyword = !keyword || keyText.indexOf(keyword) !== -1;
        var matchedYear = !yearValue || cardYear === yearValue;
        var matchedRegion = !regionValue || cardRegion === regionValue;
        card.classList.toggle("is-filter-hidden", !(matchedKeyword && matchedYear && matchedRegion));
      });
    }

    [input, year, region].forEach(function(element) {
      if (element) {
        element.addEventListener("input", apply);
        element.addEventListener("change", apply);
      }
    });
  }

  function createResultCard(item) {
    var article = document.createElement("article");
    article.className = "movie-card search-item";
    article.innerHTML = [
      '<a class="poster-link" href="' + item.url + '">',
      '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '海报" loading="lazy">',
      '<span class="score-badge">' + item.score + '</span>',
      '<span class="play-badge">播放</span>',
      '</a>',
      '<div class="card-body">',
      '<div class="card-meta"><a href="' + item.categoryUrl + '">' + escapeHtml(item.category) + '</a><span>' + escapeHtml(item.year) + '</span></div>',
      '<h2><a href="' + item.url + '">' + escapeHtml(item.title) + '</a></h2>',
      '<p>' + escapeHtml(item.summary) + '</p>',
      '<div class="tag-row"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.genre) + '</span></div>',
      '</div>'
    ].join("");
    return article;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initSearchPage() {
    var form = document.getElementById("search-page-form");
    var input = document.getElementById("search-keyword");
    var results = document.getElementById("search-results");
    if (!form || !input || !results || !window.movieIndex) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initialKeyword = params.get("q") || "";
    input.value = initialKeyword;

    function render(keyword) {
      var query = keyword.trim().toLowerCase();
      results.innerHTML = "";
      if (!query) {
        results.innerHTML = '<div class="search-empty">输入关键词后即可查看匹配内容。</div>';
        return;
      }
      var matched = window.movieIndex.filter(function(item) {
        return item.keywords.indexOf(query) !== -1;
      }).slice(0, 80);
      if (!matched.length) {
        results.innerHTML = '<div class="search-empty">暂未找到匹配内容，可以尝试更换片名、地区或题材关键词。</div>';
        return;
      }
      matched.forEach(function(item) {
        results.appendChild(createResultCard(item));
      });
    }

    form.addEventListener("submit", function(event) {
      event.preventDefault();
      var keyword = input.value.trim();
      var nextUrl = keyword ? "./search.html?q=" + encodeURIComponent(keyword) : "./search.html";
      history.replaceState(null, "", nextUrl);
      render(keyword);
    });

    input.addEventListener("input", function() {
      render(input.value);
    });

    render(initialKeyword);
  }

  function initPlayer(config) {
    var video = document.getElementById("movie-video");
    var overlay = document.getElementById("play-overlay");
    if (!video || !overlay || !config || !config.url) {
      return;
    }
    var loaded = false;
    var hlsInstance = null;

    function attachAndPlay() {
      if (!loaded) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = config.url;
          video.load();
          loaded = true;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(config.url);
          hlsInstance.attachMedia(video);
          loaded = true;
        } else {
          video.src = config.url;
          video.load();
          loaded = true;
        }
      }
      overlay.classList.add("is-hidden");
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function() {
          overlay.classList.remove("is-hidden");
        });
      }
    }

    overlay.addEventListener("click", attachAndPlay);
    video.addEventListener("click", function() {
      if (video.paused) {
        attachAndPlay();
      }
    });
    video.addEventListener("play", function() {
      overlay.classList.add("is-hidden");
    });
    video.addEventListener("ended", function() {
      overlay.classList.remove("is-hidden");
    });
    window.addEventListener("beforeunload", function() {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    initMenu();
    initHero();
    initFilters();
    initSearchPage();
  });

  window.MovieSite = {
    initPlayer: initPlayer
  };
})();
