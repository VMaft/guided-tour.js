'use strict';

/* ══════════════════════════════════════════════════════════════
   demo.js
   Подключается ПОСЛЕДНИМ после всех скриптов тура
══════════════════════════════════════════════════════════════ */

(function initDemo() {

    /* ══════════════════════════
       ТЕМА (dark / light)
    ══════════════════════════ */

    const root = document.documentElement;
    const themeBtn = document.getElementById('themeToggle');
    const STORAGE_KEY = 'gt-demo-theme';

    function getTheme() {
        return localStorage.getItem(STORAGE_KEY) || 'dark';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (themeBtn) {
            themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
            themeBtn.title = theme === 'dark' ? 'Switch to light' : 'Switch to dark';
            themeBtn.setAttribute('aria-label', themeBtn.title);
        }
        localStorage.setItem(STORAGE_KEY, theme);
    }

    function toggleTheme() {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }

    applyTheme(getTheme());
    themeBtn?.addEventListener('click', toggleTheme);

    /* ══════════════════════════
       REVEAL ON SCROLL
       Секции плавно появляются при прокрутке
    ══════════════════════════ */

    const revealItems = document.querySelectorAll('.gt-reveal');

    if (revealItems.length) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, i) => {
                    if (!entry.isIntersecting) return;
                    setTimeout(() => {
                        entry.target.classList.add('gt-reveal--visible');
                    }, i * 80);
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.12 }
        );

        revealItems.forEach(el => observer.observe(el));
    }

    /* ══════════════════════════
       NAVBAR SCROLL SHADOW
    ══════════════════════════ */

    const navbar = document.querySelector('.gt-navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('gt-navbar--scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    /* ══════════════════════════
       АКТИВНЫЙ ПУНКТ МЕНЮ
       Подсвечивает текущий раздел в навбаре
    ══════════════════════════ */

    const navLinks = document.querySelectorAll('.gt-nav__link[href^="#"]');
    const sections = document.querySelectorAll('section[id]');

    if (navLinks.length && sections.length) {
        const linkMap = {};
        navLinks.forEach(link => {
            const id = link.getAttribute('href').slice(1);
            linkMap[id] = link;
        });

        const navObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const link = linkMap[entry.target.id];
                    if (!link) return;
                    link.classList.toggle('gt-nav__link--active', entry.isIntersecting);
                });
            },
            { rootMargin: '-40% 0px -55% 0px' }
        );

        sections.forEach(s => navObserver.observe(s));
    }

    /* ══════════════════════════
       МОБИЛЬНОЕ МЕНЮ
    ══════════════════════════ */

    const burger = document.getElementById('burger');
    const navMenu = document.getElementById('navMenu');

    if (burger && navMenu) {
        burger.addEventListener('click', () => {
            const open = navMenu.classList.toggle('gt-nav__menu--open');
            burger.classList.toggle('gt-burger--open', open);
            burger.setAttribute('aria-expanded', String(open));
        });

        /* Закрываем при клике на ссылку */
        navMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navMenu.classList.remove('gt-nav__menu--open');
                burger.classList.remove('gt-burger--open');
                burger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ══════════════════════════
       CANVAS ЧАСТИЦЫ (фон)
       Простые точки — без зависимостей
    ══════════════════════════ */

    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, particles;

    const PARTICLE_COUNT = 55;
    const PARTICLE_COLOR_DARK = 'rgba(74, 158, 255, 0.45)';
    const PARTICLE_COLOR_LIGHT = 'rgba(42, 126, 232, 0.30)';

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function makeParticle() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.8 + 0.4,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            o: Math.random() * 0.6 + 0.2,
        };
    }

    function initParticles() {
        particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        const isDark = root.getAttribute('data-theme') === 'dark';
        const color = isDark ? PARTICLE_COLOR_DARK : PARTICLE_COLOR_LIGHT;

        particles.forEach(p => {
            /* движение */
            p.x += p.vx;
            p.y += p.vy;

            /* оборачиваем по краям */
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10;
            if (p.y > H + 10) p.y = -10;

            /* рисуем */
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = p.o;
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    draw();

    window.addEventListener('resize', () => {
        resize();
        initParticles();
    }, { passive: true });

    /* ══════════════════════════
       ГОТОВО
    ══════════════════════════ */
    console.info('[demo.js] ✓ ready');

})();