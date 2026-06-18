(function () {
  function initPlayer() {
    var configNode = document.getElementById("player-config");
    var video = document.getElementById("movie-player");
    var start = document.getElementById("player-start");

    if (!configNode || !video || !start) {
      return;
    }

    var config = {};

    try {
      config = JSON.parse(configNode.textContent || "{}");
    } catch (error) {
      config = {};
    }

    var source = config.source;
    var loaded = false;
    var hls = null;

    function attachSource() {
      if (!source || loaded) {
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }

      loaded = true;
    }

    function playVideo() {
      attachSource();
      start.classList.add("is-hidden");
      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          start.classList.remove("is-hidden");
        });
      }
    }

    start.addEventListener("click", playVideo);

    video.addEventListener("click", function () {
      if (video.paused) {
        playVideo();
      }
    });

    video.addEventListener("play", function () {
      start.classList.add("is-hidden");
    });

    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlayer);
  } else {
    initPlayer();
  }
})();
