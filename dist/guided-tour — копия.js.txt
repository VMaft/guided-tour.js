'use strict';

/* ══════════════════════════════════════════════════════════════
   guided-tour.js  v1.0.0
   https://github.com/VMaft/guided-tour.js

   Usage:
     <script src="guided-tour.js"></script>
     <script src="tour-cursor.js"></script>      // optional
     <script src="tour-utils.js"></script>
     <script src="your-sections.js"></script>
══════════════════════════════════════════════════════════════ */

(function initGuidedTour() {

    /* ══════════════════════════
       ЭЛЕМЕНТЫ
    ══════════════════════════ */
    const tourTerm = document.getElementById('tourTerminal');
    const tourTermText = document.getElementById('tourTermText');
    const tourTermBody = document.getElementById('tourTermBody');

    const btnAuto = document.getElementById('btnAuto');
    const overlay = document.getElementById('autoOverlay');
    const autoBar = document.getElementById('autoBar');
    const autoBarSection = document.getElementById('autoBarSection');
    const autoProgressF = document.getElementById('autoProgressFill');
    const autoProgressL = document.getElementById('autoProgressLabel');
    const autoPrevBtn = document.getElementById('autoPrevBtn');
    const autoPlayBtn = document.getElementById('autoPlayBtn');
    const autoNextBtn = document.getElementById('autoNextBtn');
    const autoExitBtn = document.getElementById('autoExitBtn');
    const autoToast = document.getElementById('autoToast');

    const iconPause = autoPlayBtn?.querySelector('.auto-icon-pause') ?? null;
    const iconPlay = autoPlayBtn?.querySelector('.auto-icon-play') ?? null;

    if (!btnAuto || !overlay) return;

    /* ══════════════════════════
       СЕКЦИИ
    ══════════════════════════ */
    const TOUR_SECTIONS = [
        {
            id: 'hero',
            tag: '// hero',
            title: 'Hero',
            comment: 'Welcome to guided-tour.js — a lightweight auto-tour library.'
        },
        {
            id: 'about',
            tag: '// about',
            title: 'About',
            comment: 'Learn what guided-tour.js can do for your site.'
        },
        {
            id: 'features',
            tag: '// features',
            title: 'Features',
            comment: 'Explore the key features: cursor, typing, scenarios.'
        },
    ];

    const SECTION_DELAY = 5000;

    /* ══════════════════════════
       СОСТОЯНИЕ
    ══════════════════════════ */
    let currentIdx = 0;
    let isPlaying = true;
    let isRunning = false;
    let sectionGeneration = 0;
    let typingGeneration = 0;
    let pendingHookSection = null;
    let tourState = 'idle'; // 'idle' | 'navigating' | 'hook'
    let timer = null;
    let fillTimer = null;

    let prevLogLine = null;
    let activeLogLine = null;

    const sectionEnterHooks = {};
    const sectionLeaveHooks = {};

    /* ══════════════════════════
       HELPERS
    ══════════════════════════ */
    function isMobile() {
        return window.innerWidth < 769;
    }

    function _sleep(ms) {
        return window.TourUtils?.sleep
            ? window.TourUtils.sleep(ms)
            : new Promise(r => setTimeout(r, ms));
    }

    /* ══════════════════════════
       TERMINAL LOG
       Строго 2 строки: prev (dim) + active (bright)
    ══════════════════════════ */
    async function pushLogLine(text, isActive) {
        if (!tourTermBody) return;

        if (prevLogLine) {
            const dying = prevLogLine;
            dying.style.transition = 'opacity 0.2s ease, transform 0.22s ease';
            dying.style.opacity = '0';
            dying.style.transform = 'translateY(-100%)';
            setTimeout(() => dying.remove(), 230);
            prevLogLine = null;
        }

        if (activeLogLine) {
            activeLogLine.classList.remove('is-active');
            activeLogLine.classList.add('is-prev');
            prevLogLine = activeLogLine;
            activeLogLine = null;
        }

        const line = document.createElement('div');
        line.className = 'tour-log-line' + (isActive ? ' is-active' : ' is-prev');
        line.textContent = text;
        line.style.opacity = '0';
        line.style.transform = 'translateY(8px)';
        line.style.transition = 'opacity 0.22s ease, transform 0.22s ease';

        tourTermBody.appendChild(line);

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        line.style.opacity = '';
        line.style.transform = '';

        if (isActive) activeLogLine = line;
        else prevLogLine = line;
    }

    /* ══════════════════════════
       TYPETEXT
    ══════════════════════════ */
    async function typeText(text, speedMs = 28) {
        if (!tourTermText) return;

        typingGeneration++;
        const myGen = typingGeneration;

        restoreInputCursor();
        const cursor = tourTermText.querySelector('.tour-term-cursor');

        for (let i = 0; i < text.length; i++) {
            await new Promise(r => setTimeout(r, speedMs));
            if (typingGeneration !== myGen) return;
            tourTermText.insertBefore(document.createTextNode(text[i]), cursor);
        }

        await new Promise(r => setTimeout(r, 320));
        if (typingGeneration !== myGen) return;

        await pushLogLine(`▶ ${text}`, true);
        restoreInputCursor();
    }

    function restoreInputCursor() {
        if (!tourTermText) return;
        const existing = tourTermText.querySelector('.tour-term-cursor');
        tourTermText.innerHTML = '';
        if (existing) {
            tourTermText.appendChild(existing);
        } else {
            const c = document.createElement('span');
            c.className = 'tour-term-cursor';
            tourTermText.appendChild(c);
        }
    }

    /* ══════════════════════════
       ТЕРМИНАЛ ПОКАЗ / СКРЫТИЕ
    ══════════════════════════ */
    function showTourTerminal() {
        if (!tourTerm) return;
        tourTerm.style.removeProperty('display');
        tourTerm.classList.add('is-visible');
        tourTerm.setAttribute('aria-hidden', 'false');
    }

    function hideTourTerminal() {
        if (!tourTerm) return;
        tourTerm.classList.remove('is-visible');
        tourTerm.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            if (!isRunning) {
                tourTerm.style.display = 'none';
                if (tourTermBody) tourTermBody.innerHTML = '';
                prevLogLine = null;
                activeLogLine = null;
            }
        }, 300);
    }

    /* ══════════════════════════
       ИНФРАСТРУКТУРА
       Вертикальные линии + заголовок терминала
    ══════════════════════════ */
    function injectInfra() {

        /* Вертикальные линии по краям */
        if (!document.getElementById('autoEdgeLeft')) {
            ['left', 'right'].forEach(side => {
                const el = document.createElement('div');
                el.id = `autoEdge${side.charAt(0).toUpperCase() + side.slice(1)}`;
                el.className = `auto-edge-line auto-edge-line--${side}`;
                document.body.appendChild(el);
            });
        }

        if (!tourTerm) return;

        /* Убираем старый заголовок если был */
        tourTerm.querySelector('.tour-term-header')?.remove();

        const header = document.createElement('div');
        header.className = 'tour-term-header';
        header.innerHTML = `
            <span class="tour-term-dots">
                <span class="tour-dot tour-dot--red"    id="tourTermStop"></span>
                <span class="tour-dot tour-dot--yellow" id="tourTermPause"></span>
                <span class="tour-dot tour-dot--green"></span>
            </span>
            <span class="tour-term-title" id="tourTermTitle">guided-tour: // hero</span>
            <span class="tour-term-ctrl">
                <button class="tour-ctrl-btn" id="tourCtrlPrev" title="Previous">&#8249;</button>
                <button class="tour-ctrl-btn" id="tourCtrlPlay" title="Pause / Resume">
                <span class="tour-btn-icon-pause">⏸</span>
                <span class="tour-btn-icon-play" style="display:none">▶</span>
                </button>
                <button class="tour-ctrl-btn" id="tourCtrlNext" title="Next">&#8250;</button>
            </span>
            <span class="tour-term-tag">[ TOUR ]</span>
    `;
        tourTerm.insertBefore(header, tourTerm.firstChild);

        /* Обработчики inline-кнопок */
        document.getElementById('tourCtrlPrev')?.addEventListener('click', e => {
            e.stopPropagation();
            if (currentIdx > 0) { pauseTour(); goTo(currentIdx - 1); }
        });

        document.getElementById('tourCtrlPlay')?.addEventListener('click', e => {
            e.stopPropagation();
            if (isPlaying) pauseTour(); else resumeTour();
        });

        document.getElementById('tourCtrlNext')?.addEventListener('click', e => {
            e.stopPropagation();
            if (currentIdx < TOUR_SECTIONS.length - 1) { pauseTour(); goTo(currentIdx + 1); }
            else { pauseTour(); showEndToast(); }
        });

        document.getElementById('tourTermStop')?.addEventListener('click', e => {
            e.stopPropagation();
            stopTour();
        });

        document.getElementById('tourTermPause')?.addEventListener('click', e => {
            e.stopPropagation();
            if (isPlaying) pauseTour(); else resumeTour();
        });
    }

    /* ══════════════════════════
       BAR + ИКОНКИ
    ══════════════════════════ */
    function updateBar(idx) {
        const s = TOUR_SECTIONS[idx];
        if (!s) return;

        if (autoBarSection) autoBarSection.textContent = s.id;
        if (autoProgressL) autoProgressL.textContent = `${idx + 1} / ${TOUR_SECTIONS.length}`;
        if (autoProgressF) autoProgressF.style.width =
            `${((idx + 1) / TOUR_SECTIONS.length) * 100}%`;

        const title = document.getElementById('tourTermTitle');
        if (title) title.textContent = `guided-tour: ${s.tag}`;
    }

    function syncPauseIcon(playing) {
        if (iconPause) iconPause.style.display = playing ? '' : 'none';
        if (iconPlay) iconPlay.style.display = playing ? 'none' : '';

        /* Inline-кнопка в терминале */
        const ip = document.querySelector('#tourCtrlPlay .tour-btn-icon-pause');
        const ipl = document.querySelector('#tourCtrlPlay .tour-btn-icon-play');
        if (ip) ip.style.display = playing ? '' : 'none';
        if (ipl) ipl.style.display = playing ? 'none' : '';

        tourTerm?.classList.toggle('is-paused', !playing);
    }

    /* ══════════════════════════
       НАВИГАЦИЯ
    ══════════════════════════ */
    function scrollToSection(idx) {
        const s = TOUR_SECTIONS[idx];
        if (!s) return;
        const el = document.getElementById(s.id);
        if (!el) { console.warn(`[guided-tour] #${s.id} не найден`); return; }
        const offset = (autoBar?.offsetHeight ?? 0) + 8;
        window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - offset,
            behavior: 'smooth'
        });
    }

    async function goTo(idx) {
        if (idx < 0 || idx >= TOUR_SECTIONS.length) return;

        /* Вызываем leave-хук предыдущей секции */
        const prev = TOUR_SECTIONS[currentIdx];
        if (prev && idx !== currentIdx) sectionLeaveHooks[prev.id]?.();

        sectionGeneration++;
        typingGeneration++;
        const myGen = sectionGeneration;

        pendingHookSection = null;
        tourState = 'navigating';
        currentIdx = idx;

        const s = TOUR_SECTIONS[idx];

        await pushLogLine(`[${idx + 1}/${TOUR_SECTIONS.length}] → ${s.tag}`, false);
        updateBar(idx);
        scrollToSection(idx);

        /* Пульс по краям экрана */
        document.querySelectorAll('.auto-edge-line').forEach(el => {
            el.classList.remove('is-pulsing');
            void el.offsetWidth;
            el.classList.add('is-pulsing');
            setTimeout(() => el.classList.remove('is-pulsing'), 520);
        });

        /* Печатаем комментарий секции */
        if (s.comment) {
            showTourTerminal();
            await typeText(s.comment, 28);
        }

        if (sectionGeneration !== myGen) return;

        tourState = 'idle';

        /* Есть enter-хук? */
        if (sectionEnterHooks[s.id]) {
            if (!isPlaying) {
                /* На паузе — откладываем */
                pendingHookSection = s.id;
                return;
            }
            await _runHook(s.id, myGen);
            return;
        }

        /* Нет хука — просто ждём */
        if (isPlaying) {
            scheduleNext();
            resetFillAnimation();
        }
    }

    async function _runHook(sectionId, gen) {
        if (sectionGeneration !== gen) return;
        tourState = 'hook';
        pendingHookSection = null;
        try {
            await sectionEnterHooks[sectionId]();
        } finally {
            if (sectionGeneration === gen) tourState = 'idle';
        }
    }

    /* ══════════════════════════
       ТАЙМЕР + ПРОГРЕСС
    ══════════════════════════ */
    function scheduleNext() {
        clearTimeout(timer);
        if (!isPlaying) return;
        timer = setTimeout(() => {
            if (!isPlaying || !isRunning) return;
            if (currentIdx < TOUR_SECTIONS.length - 1) goTo(currentIdx + 1);
            else { pauseTour(); showEndToast(); }
        }, SECTION_DELAY);
    }

    function resetFillAnimation() {
        if (fillTimer) clearInterval(fillTimer);
        if (!autoBar) return;

        autoBar.style.setProperty('--section-fill', '0%');
        let elapsed = 0;

        fillTimer = setInterval(() => {
            if (!isPlaying) { clearInterval(fillTimer); return; }
            elapsed += 100;
            autoBar.style.setProperty('--section-fill',
                Math.min((elapsed / SECTION_DELAY) * 100, 100) + '%');
            if (elapsed >= SECTION_DELAY) clearInterval(fillTimer);
        }, 100);
    }

    /* ══════════════════════════
       УПРАВЛЕНИЕ ТУРОМ
    ══════════════════════════ */
    function pauseTour() {
        isPlaying = false;
        clearTimeout(timer);
        clearInterval(fillTimer);
        syncPauseIcon(false);
        document.body.classList.add('is-paused');
        showPauseToast();
    }

    function resumeTour() {
        isPlaying = true;
        syncPauseIcon(true);
        document.body.classList.remove('is-paused');
        hideToast();

        /* goTo ещё печатает — он сам разберётся */
        if (tourState === 'navigating') return;

        /* Есть отложенный хук */
        if (pendingHookSection) {
            _runHook(pendingHookSection, sectionGeneration);
            return;
        }

        /* Хук уже выполняется */
        if (tourState === 'hook') return;

        /* Обычная секция */
        scheduleNext();
        resetFillAnimation();
    }

    function startTour() {
        if (isMobile()) return;

        isRunning = true;
        isPlaying = true;
        currentIdx = 0;
        sectionGeneration = 0;
        typingGeneration = 0;
        pendingHookSection = null;
        tourState = 'idle';

        injectInfra();

        if (tourTerm) tourTerm.style.removeProperty('display');

        overlay.classList.add('is-active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('auto-mode-active');
        document.body.classList.remove('is-paused');

        syncPauseIcon(true);

        if (tourTermBody) tourTermBody.innerHTML = '';
        prevLogLine = null;
        activeLogLine = null;
        restoreInputCursor();

        /* onStepComplete — перезаписываем чтобы захватить актуальное замыкание */
        window.__tourEngine.onStepComplete = () => {
            if (!isRunning || !isPlaying) return;
            const gen = sectionGeneration;
            setTimeout(() => {
                if (!isRunning || !isPlaying) return;
                if (sectionGeneration !== gen) return;
                if (currentIdx < TOUR_SECTIONS.length - 1) goTo(currentIdx + 1);
                else { pauseTour(); showEndToast(); }
            }, 500);
        };

        goTo(0);
        showStartToast();
    }

    function stopTour() {
        isRunning = false;
        isPlaying = false;
        tourState = 'idle';
        pendingHookSection = null;

        clearTimeout(timer);
        clearInterval(fillTimer);

        sectionLeaveHooks[TOUR_SECTIONS[currentIdx]?.id]?.();
        window.TourCursor?.reset();

        overlay.classList.remove('is-active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('auto-mode-active', 'is-paused');

        hideTourTerminal();
        hideToast();
    }

    /* ══════════════════════════
       ТОСТЫ
    ══════════════════════════ */
    let toastTimer = null;

    function showToast(html, ms = 4000) {
        if (!autoToast) return;
        autoToast.classList.remove('is-pause');
        const t = autoToast.querySelector('.auto-toast-text');
        if (t) t.innerHTML = html;
        autoToast.classList.add('is-visible');
        if (toastTimer) clearTimeout(toastTimer);
        if (ms > 0) toastTimer = setTimeout(hideToast, ms);
    }

    function hideToast() {
        if (!autoToast) return;
        autoToast.classList.remove('is-visible', 'is-pause');
        if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    }

    function showStartToast() {
        showToast(
            'Tour started. <kbd>←</kbd><kbd>→</kbd> navigate, <kbd>Space</kbd> pause.',
            4500
        );
    }

    function showEndToast() {
        showToast(
            'Tour complete. Press <kbd>Esc</kbd> or ✕ to exit.',
            4000
        );
    }

    function showPauseToast() {
        if (!autoToast) return;
        if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
        const t = autoToast.querySelector('.auto-toast-text');
        if (t) t.innerHTML = 'Paused. <kbd>Space</kbd> to resume.';
        autoToast.classList.add('is-visible', 'is-pause');
    }

    /* ══════════════════════════
       ДВИЖОК — создаём сразу
       Секции регистрируются до startTour
    ══════════════════════════ */
    window.__tourEngine = {
        typeText,
        onSectionEnter: (id, cb) => { sectionEnterHooks[id] = cb; },
        onSectionLeave: (id, cb) => { sectionLeaveHooks[id] = cb; },
        onStepComplete: () => { },
    };

    console.info('[guided-tour] ✓ __tourEngine ready');

    /* ══════════════════════════
       СОБЫТИЯ
    ══════════════════════════ */
    btnAuto.addEventListener('click', () => {
        if (!isMobile()) startTour();
    });

    autoExitBtn?.addEventListener('click', stopTour);

    autoPlayBtn?.addEventListener('click', () => {
        if (isPlaying) pauseTour(); else resumeTour();
    });

    autoPrevBtn?.addEventListener('click', () => {
        if (currentIdx > 0) { pauseTour(); goTo(currentIdx - 1); }
    });

    autoNextBtn?.addEventListener('click', () => {
        if (currentIdx < TOUR_SECTIONS.length - 1) { pauseTour(); goTo(currentIdx + 1); }
        else { pauseTour(); showEndToast(); }
    });

    /* Клавиатура */
    document.addEventListener('keydown', e => {
        if (!isRunning) return;
        switch (e.key) {
            case 'Escape':
                stopTour();
                break;
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                if (isPlaying) pauseTour(); else resumeTour();
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (currentIdx < TOUR_SECTIONS.length - 1) { pauseTour(); goTo(currentIdx + 1); }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (currentIdx > 0) { pauseTour(); goTo(currentIdx - 1); }
                break;
        }
    });

    /* Ресайз — выходим на мобилке */
    window.addEventListener('resize', () => {
        if (isRunning && isMobile()) stopTour();
    });

})();