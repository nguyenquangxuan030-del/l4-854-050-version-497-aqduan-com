(function () {
    'use strict';

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function rootPrefix() {
        return document.body.getAttribute('data-root-prefix') || './';
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initializeImages() {
        document.querySelectorAll('img').forEach(function (image) {
            image.addEventListener('error', function () {
                image.classList.add('is-missing');
            }, { once: true });
        });
    }

    function initializeMobileMenu() {
        var toggle = document.querySelector('[data-mobile-menu-toggle]');
        var menu = document.querySelector('[data-mobile-menu]');

        if (!toggle || !menu) {
            return;
        }

        toggle.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function initializeSiteSearchForms() {
        document.querySelectorAll('form[data-site-search]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input[name="q"]');
                var query = input ? input.value.trim() : '';

                if (!query) {
                    return;
                }

                window.location.href = rootPrefix() + 'search.html?q=' + encodeURIComponent(query);
            });
        });
    }

    function initializeHero() {
        var hero = document.querySelector('[data-hero]');

        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var previous = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                start();
            });
        });

        if (previous) {
            previous.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initializeFilters() {
        document.querySelectorAll('[data-filter-toolbar]').forEach(function (toolbar) {
            var section = toolbar.closest('.filterable-section') || document;
            var grid = section.querySelector('[data-filter-grid]');

            if (!grid) {
                return;
            }

            var cards = Array.prototype.slice.call(grid.querySelectorAll('.filter-card'));
            var input = toolbar.querySelector('[data-filter-input]');
            var typeSelect = toolbar.querySelector('[data-filter-type]');
            var yearSelect = toolbar.querySelector('[data-filter-year]');
            var count = toolbar.querySelector('[data-result-count]');

            function applyFilters() {
                var query = normalize(input ? input.value : '');
                var type = normalize(typeSelect ? typeSelect.value : '');
                var year = normalize(yearSelect ? yearSelect.value : '');
                var visible = 0;

                cards.forEach(function (card) {
                    var searchText = normalize(card.getAttribute('data-search'));
                    var cardType = normalize(card.getAttribute('data-type'));
                    var cardYear = normalize(card.getAttribute('data-year'));
                    var matched = true;

                    if (query && searchText.indexOf(query) === -1) {
                        matched = false;
                    }

                    if (type && cardType.indexOf(type) === -1) {
                        matched = false;
                    }

                    if (year && cardYear !== year) {
                        matched = false;
                    }

                    card.classList.toggle('is-hidden', !matched);
                    if (matched) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = String(visible);
                }
            }

            [input, typeSelect, yearSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', applyFilters);
                    control.addEventListener('change', applyFilters);
                }
            });

            applyFilters();
        });
    }

    function initializePlayer() {
        document.querySelectorAll('[data-player]').forEach(function (shell) {
            var video = shell.querySelector('video');
            var overlay = shell.querySelector('.player-overlay');
            var button = shell.querySelector('.player-start');
            var status = shell.querySelector('[data-player-status]');

            if (!video || !overlay) {
                return;
            }

            function setStatus(message) {
                if (status) {
                    status.textContent = message || '';
                }
            }

            function startPlayback() {
                var source = video.getAttribute('data-src');

                if (!source) {
                    setStatus('未找到播放源。');
                    return;
                }

                if (shell.getAttribute('data-started') === 'true') {
                    video.play().catch(function () {
                        setStatus('请再次点击视频播放。');
                    });
                    return;
                }

                shell.setAttribute('data-started', 'true');
                setStatus('正在初始化 HLS 播放源...');

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    shell.classList.add('is-playing');
                    video.play().catch(function () {
                        setStatus('浏览器阻止了自动播放，请点击视频继续。');
                    });
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });

                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        shell.classList.add('is-playing');
                        setStatus('');
                        video.play().catch(function () {
                            setStatus('浏览器阻止了自动播放，请点击视频继续。');
                        });
                    });
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setStatus('播放源加载失败，请刷新页面或更换浏览器。');
                        }
                    });
                    return;
                }

                setStatus('当前浏览器不支持 HLS 播放，请使用支持 HLS 的浏览器。');
            }

            overlay.addEventListener('click', startPlayback);
            if (button) {
                button.addEventListener('click', function (event) {
                    event.preventDefault();
                    startPlayback();
                });
            }
        });
    }

    function createSearchCard(movie) {
        var root = rootPrefix();
        var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');

        return [
            '<article class="movie-card movie-card-normal">',
            '    <a class="poster-link" href="' + root + escapeHtml(movie.url) + '">',
            '        <span class="poster-frame">',
            '            <img src="' + root + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '            <span class="poster-shade"></span>',
            '            <span class="score-badge">' + escapeHtml(movie.score) + '分</span>',
            '            <span class="play-chip">▶</span>',
            '        </span>',
            '    </a>',
            '    <div class="movie-card-body">',
            '        <h3><a href="' + root + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
            '        <p>' + escapeHtml(movie.oneLine) + '</p>',
            '        <div class="movie-meta">',
            '            <span>' + escapeHtml(movie.year) + '</span>',
            '            <span>' + escapeHtml(movie.region) + '</span>',
            '            <span>' + escapeHtml(movie.type) + '</span>',
            '        </div>',
            '        <div class="tag-row">' + tags + '</div>',
            '    </div>',
            '</article>'
        ].join('');
    }

    function initializeSearchPage() {
        var data = window.MOVIE_SEARCH_DATA;
        var form = document.querySelector('[data-search-page-form]');
        var input = document.querySelector('[data-search-page-input]');
        var results = document.querySelector('[data-search-results]');
        var count = document.querySelector('[data-search-result-count]');

        if (!data || !form || !input || !results) {
            return;
        }

        var params = new URLSearchParams(window.location.search);
        input.value = params.get('q') || '';

        function render() {
            var query = normalize(input.value);
            var terms = query.split(/\s+/).filter(Boolean);
            var matched = data.filter(function (movie) {
                var haystack = normalize([
                    movie.title,
                    movie.year,
                    movie.region,
                    movie.type,
                    movie.genre,
                    movie.category,
                    (movie.tags || []).join(' '),
                    movie.oneLine
                ].join(' '));

                if (!terms.length) {
                    return true;
                }

                return terms.every(function (term) {
                    return haystack.indexOf(term) !== -1;
                });
            }).slice(0, 200);

            results.innerHTML = matched.map(createSearchCard).join('');
            initializeImages();

            if (count) {
                count.textContent = String(matched.length);
            }
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var query = input.value.trim();
            var nextUrl = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
            window.history.replaceState(null, '', nextUrl);
            render();
        });

        input.addEventListener('input', render);
        render();
    }

    ready(function () {
        initializeImages();
        initializeMobileMenu();
        initializeSiteSearchForms();
        initializeHero();
        initializeFilters();
        initializePlayer();
        initializeSearchPage();
    });
})();
