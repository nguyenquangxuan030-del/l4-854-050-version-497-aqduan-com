(function () {
  var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
  var hlsMap = new WeakMap();

  function prepare(video, source) {
    if (!video || !source || video.getAttribute('data-ready') === source) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.setAttribute('data-ready', source);
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var oldHls = hlsMap.get(video);
      if (oldHls) {
        oldHls.destroy();
      }
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hlsMap.set(video, hls);
      video.setAttribute('data-ready', source);
      return;
    }

    video.src = source;
    video.setAttribute('data-ready', source);
  }

  players.forEach(function (player) {
    var video = player.querySelector('video');
    var trigger = player.querySelector('[data-play-trigger]');
    var source = video ? video.getAttribute('data-m3u8') : '';

    function start() {
      if (!video) {
        return;
      }
      prepare(video, source);
      player.classList.add('is-playing');
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          player.classList.remove('is-playing');
        });
      }
    }

    if (trigger) {
      trigger.addEventListener('click', start);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
          player.classList.remove('is-playing');
        }
      });
    }
  });
})();
