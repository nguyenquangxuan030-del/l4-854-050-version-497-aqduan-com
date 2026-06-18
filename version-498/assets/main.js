(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var button = document.querySelector(".menu-button");
    var panel = document.querySelector(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.textContent = open ? "×" : "☰";
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    if (slides.length === 0) {
      return;
    }
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var prev = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function restart() {
      window.clearInterval(timer);
      start();
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    start();
  }

  function setupLocalFilter() {
    var input = document.querySelector(".local-filter");
    var list = document.querySelector(".searchable-list");
    if (!input || !list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll("[data-filter-text]"));
    input.addEventListener("input", function () {
      var keyword = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = (card.getAttribute("data-filter-text") || "").toLowerCase();
        card.classList.toggle("hidden-card", keyword && text.indexOf(keyword) === -1);
      });
    });
  }

  function createResultCard(item) {
    var article = document.createElement("article");
    article.className = "movie-card";
    article.innerHTML = "" +
      "<a class=\"poster-frame\" href=\"" + item.url + "\">" +
      "<img src=\"" + item.cover + "\" alt=\"" + escapeHtml(item.title) + "\" loading=\"lazy\">" +
      "<span class=\"duration\">" + item.duration + "</span>" +
      "<span class=\"play-badge\">▶</span>" +
      "</a>" +
      "<div class=\"movie-card-body\">" +
      "<a class=\"movie-title\" href=\"" + item.url + "\">" + escapeHtml(item.title) + "</a>" +
      "<p>" + escapeHtml(item.desc) + "</p>" +
      "<div class=\"tag-row\"><span>" + escapeHtml(item.year) + "</span><span>" + escapeHtml(item.region) + "</span><span>" + escapeHtml(item.channel) + "</span></div>" +
      "<div class=\"card-meta\">" + escapeHtml(item.genre) + "</div>" +
      "</div>";
    return article;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;"
      }[char];
    });
  }

  function setupSearch() {
    var form = document.querySelector(".search-page-form");
    var input = document.getElementById("site-search-input");
    var results = document.getElementById("search-results");
    var items = window.SEARCH_ITEMS || [];
    if (!form || !input || !results) {
      return;
    }

    function render(keyword) {
      var q = keyword.trim().toLowerCase();
      results.innerHTML = "";
      if (!q) {
        results.innerHTML = "<div class=\"empty-state\">请输入关键词开始搜索</div>";
        return;
      }
      var found = items.filter(function (item) {
        return item.search.indexOf(q) !== -1;
      }).slice(0, 160);
      if (found.length === 0) {
        results.innerHTML = "<div class=\"empty-state\">没有找到匹配影片</div>";
        return;
      }
      found.forEach(function (item) {
        results.appendChild(createResultCard(item));
      });
    }

    function syncFromUrl() {
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q") || "";
      input.value = q;
      render(q);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var q = input.value.trim();
      var url = q ? "./search.html?q=" + encodeURIComponent(q) : "./search.html";
      window.history.replaceState(null, "", url);
      render(q);
    });

    document.querySelectorAll("[data-search-word]").forEach(function (button) {
      button.addEventListener("click", function () {
        input.value = button.getAttribute("data-search-word") || "";
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      });
    });

    syncFromUrl();
  }

  window.initMoviePlayer = function (streamUrl, playerId) {
    var shell = document.getElementById(playerId);
    if (!shell) {
      return;
    }
    var video = shell.querySelector("video");
    var layer = shell.querySelector(".play-layer");
    var hls = null;
    var loaded = false;

    function load() {
      if (loaded || !video) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
            hls = null;
            video.src = streamUrl;
          }
        });
      } else {
        video.src = streamUrl;
      }
    }

    function play() {
      load();
      if (layer) {
        layer.classList.add("is-hidden");
      }
      var started = video.play();
      if (started && typeof started.catch === "function") {
        started.catch(function () {
          if (layer) {
            layer.classList.remove("is-hidden");
          }
        });
      }
    }

    if (layer) {
      layer.addEventListener("click", function (event) {
        event.preventDefault();
        play();
      });
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });

    video.addEventListener("play", function () {
      if (layer) {
        layer.classList.add("is-hidden");
      }
    });

    video.addEventListener("pause", function () {
      if (layer && video.currentTime === 0) {
        layer.classList.remove("is-hidden");
      }
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupLocalFilter();
    setupSearch();
  });
})();
