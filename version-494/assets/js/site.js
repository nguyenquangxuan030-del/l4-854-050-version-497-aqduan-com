(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function initNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".main-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function initHero() {
    const slider = document.querySelector(".hero-slider");
    if (!slider) {
      return;
    }
    const slides = Array.from(slider.querySelectorAll(".hero-slide"));
    const dots = Array.from(slider.querySelectorAll(".hero-dot"));
    const prev = slider.querySelector(".hero-prev");
    const next = slider.querySelector(".hero-next");
    let index = 0;
    let timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initSearch() {
    const input = document.querySelector(".movie-search");
    const list = document.querySelector(".searchable-list");
    const clear = document.querySelector(".search-clear");
    if (!input || !list) {
      return;
    }
    const cards = Array.from(list.querySelectorAll(".movie-card"));

    function applyFilter() {
      const value = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        const title = (card.getAttribute("data-title") || "").toLowerCase();
        const meta = (card.getAttribute("data-meta") || "").toLowerCase();
        const text = (card.textContent || "").toLowerCase();
        const matched = !value || title.includes(value) || meta.includes(value) || text.includes(value);
        card.classList.toggle("is-filtered-out", !matched);
      });
    }

    input.addEventListener("input", applyFilter);
    if (clear) {
      clear.addEventListener("click", function () {
        input.value = "";
        applyFilter();
        input.focus();
      });
    }
  }

  ready(function () {
    initNavigation();
    initHero();
    initSearch();
  });
})();

function initMoviePlayer(videoId, overlayId, sourceUrl) {
  const video = document.getElementById(videoId);
  const overlay = document.getElementById(overlayId);
  if (!video || !overlay || !sourceUrl) {
    return;
  }

  let playerReady = false;
  let hlsInstance = null;

  function prepareVideo() {
    if (playerReady) {
      return;
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(sourceUrl);
      hlsInstance.attachMedia(video);
    } else {
      video.src = sourceUrl;
    }
    playerReady = true;
  }

  function playVideo() {
    prepareVideo();
    overlay.classList.add("is-hidden");
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        overlay.classList.remove("is-hidden");
      });
    }
  }

  overlay.addEventListener("click", playVideo);
  video.addEventListener("click", function () {
    if (video.paused) {
      playVideo();
    }
  });
  video.addEventListener("play", function () {
    overlay.classList.add("is-hidden");
  });
  video.addEventListener("ended", function () {
    overlay.classList.remove("is-hidden");
  });
  window.addEventListener("beforeunload", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  });
}
