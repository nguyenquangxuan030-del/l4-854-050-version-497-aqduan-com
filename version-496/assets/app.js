function initMoviePlayer(source) {
    var video = document.querySelector(".player-video");
    var overlay = document.querySelector(".player-overlay");
    if (!video || !overlay || !source) {
        return;
    }

    var attached = false;

    function attachSource() {
        if (attached) {
            return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
        } else if (typeof Hls !== "undefined" && Hls.isSupported()) {
            var hls = new Hls({ enableWorker: true });
            hls.loadSource(source);
            hls.attachMedia(video);
        } else {
            video.src = source;
        }
    }

    function startPlayer() {
        attachSource();
        overlay.classList.add("is-hidden");
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {
                overlay.classList.remove("is-hidden");
            });
        }
    }

    overlay.addEventListener("click", startPlayer);
    video.addEventListener("click", function () {
        if (video.paused) {
            startPlayer();
        }
    });
    video.addEventListener("play", function () {
        overlay.classList.add("is-hidden");
    });
    video.addEventListener("pause", function () {
        if (!video.ended) {
            overlay.classList.remove("is-hidden");
        }
    });
}

(function () {
    function setupMobileMenu() {
        var toggle = document.querySelector(".menu-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("open");
        });
    }

    function setupHeroSlider() {
        var sliders = document.querySelectorAll("[data-hero-slider]");
        sliders.forEach(function (slider) {
            var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
            var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
            var prev = slider.querySelector("[data-hero-prev]");
            var next = slider.querySelector("[data-hero-next]");
            var current = 0;
            var timer = null;

            if (!slides.length) {
                return;
            }

            function show(index) {
                current = (index + slides.length) % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle("active", slideIndex === current);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle("active", dotIndex === current);
                });
            }

            function start() {
                timer = window.setInterval(function () {
                    show(current + 1);
                }, 5000);
            }

            function restart() {
                if (timer) {
                    window.clearInterval(timer);
                }
                start();
            }

            dots.forEach(function (dot, index) {
                dot.addEventListener("click", function () {
                    show(index);
                    restart();
                });
            });

            if (prev) {
                prev.addEventListener("click", function () {
                    show(current - 1);
                    restart();
                });
            }

            if (next) {
                next.addEventListener("click", function () {
                    show(current + 1);
                    restart();
                });
            }

            start();
        });
    }

    function setupFilters() {
        var panels = document.querySelectorAll("[data-filter-panel]");
        panels.forEach(function (panel) {
            var scope = panel.parentElement;
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card, .list-row"));
            var search = panel.querySelector("[data-card-search]");
            var year = panel.querySelector("[data-year-filter]");
            var region = panel.querySelector("[data-region-filter]");
            var empty = scope.querySelector("[data-empty-state]");

            function apply() {
                var query = search ? search.value.trim().toLowerCase() : "";
                var selectedYear = year ? year.value : "";
                var selectedRegion = region ? region.value : "";
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = [
                        card.getAttribute("data-title") || "",
                        card.getAttribute("data-year") || "",
                        card.getAttribute("data-region") || "",
                        card.getAttribute("data-genre") || ""
                    ].join(" ").toLowerCase();
                    var yearOk = !selectedYear || card.getAttribute("data-year") === selectedYear;
                    var regionOk = !selectedRegion || card.getAttribute("data-region") === selectedRegion;
                    var queryOk = !query || haystack.indexOf(query) !== -1;
                    var isVisible = yearOk && regionOk && queryOk;
                    card.classList.toggle("is-hidden", !isVisible);
                    if (isVisible) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle("show", visible === 0);
                }
            }

            [search, year, region].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
        });
    }

    function escapeText(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function setupSearchPage() {
        var host = document.querySelector("[data-search-results]");
        var form = document.querySelector("[data-search-form]");
        var input = document.querySelector("[data-search-input]");
        if (!host || !form || !input || typeof MOVIE_SEARCH_INDEX === "undefined") {
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var queryFromUrl = params.get("q") || "";
        if (queryFromUrl) {
            input.value = queryFromUrl;
        }

        function render() {
            var query = input.value.trim().toLowerCase();
            var list = MOVIE_SEARCH_INDEX;
            if (query) {
                list = list.filter(function (movie) {
                    return movie.searchText.indexOf(query) !== -1;
                });
            }
            list = list.slice(0, 160);

            if (!list.length) {
                host.innerHTML = '<div class="empty-state show">没有找到匹配内容</div>';
                return;
            }

            host.innerHTML = '<div class="grid four">' + list.map(function (movie) {
                return '<article class="movie-card">' +
                    '<a class="poster-link" href="' + escapeText(movie.href) + '">' +
                    '<img src="' + escapeText(movie.cover) + '" alt="' + escapeText(movie.title) + '" loading="lazy">' +
                    '<span class="card-badge">' + escapeText(movie.category) + '</span>' +
                    '</a>' +
                    '<div class="card-content">' +
                    '<h3><a href="' + escapeText(movie.href) + '">' + escapeText(movie.title) + '</a></h3>' +
                    '<p>' + escapeText(movie.oneLine) + '</p>' +
                    '<div class="card-meta"><span>' + escapeText(movie.year) + '</span><span>' + escapeText(movie.region) + '</span><span>' + escapeText(movie.type) + '</span></div>' +
                    '<div class="tag-list"><span>' + escapeText(movie.genre) + '</span></div>' +
                    '</div>' +
                    '</article>';
            }).join("") + '</div>';
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var value = input.value.trim();
            var nextUrl = value ? "./search.html?q=" + encodeURIComponent(value) : "./search.html";
            window.history.replaceState(null, "", nextUrl);
            render();
        });

        render();
    }

    document.addEventListener("DOMContentLoaded", function () {
        setupMobileMenu();
        setupHeroSlider();
        setupFilters();
        setupSearchPage();
    });
})();
