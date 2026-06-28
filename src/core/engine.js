/* ══════════════════════════════════════════════════════════════
   engine.js  v1.0.0
   Ядро guided-tour — управление состоянием тура

   Зависимости (подключать до этого файла):
     - tour-utils.js   → window.TourUtils
     - tour-cursor.js  → window.TourCursor

   Предоставляет:
     - window.GuidedTour   — публичное API
     - window.TourEngine   — внутренний движок (для секций)
══════════════════════════════════════════════════════════════ */
'use strict';

(function initEngine() {

    /* ══════════════════════════════════════
       КОНСТАНТЫ
    ══════════════════════════════════════ */

    const SCROLL_OFFSET = 80;   // px от верха при скролле к секции
    const SECTION_DELAY = 800;  // ms пауза между секциями
    const PROGRESS_TICK = 100;  // ms интервал обновления прогресс-бара

    /* ══════════════════════════════════════
       СОСТОЯНИЕ
    ══════════════════════════════════════ */

    const state = {
        running: false,
        paused: false,
        stopped: false,
        currentIdx: -1,
        sections: [],      // массив { id, label, fn }
        abortCtrl: null,    // AbortController для текущей секции
    };

    /* ══════════════════════════════════════
       DOM-УЗЛЫ
       Ищем лениво — на момент вызова init()
       все элементы уже есть в DOM
    ══════════════════════════════════════ */

    let dom = {};

    function queryDom() {
        dom = {
            overlay: document.querySelector('.auto-overlay'),
            bar: document.querySelector('.auto-bar'),
            barSection: document.querySelector('.auto-bar-section'),
            progressFill: document.querySelector('.auto-progress-fill'),
            progressLabel: document.querySelector('.auto-progress-label'),
            btnPause: document.querySelector('.auto-ctrl-btn--play'),
            btnExit: document.querySelector('.auto-ctrl-btn--exit'),
            toast: document.querySelector('.auto-toast'),
            tourTerminal: document.getElementById('tourTerminal'),
            edgeLeft: document.querySelector('.auto-edge-line--left'),
            edgeRight: document.querySelector('.auto-edge-line--right'),
        };
    }

    /* ══════════════════════════════════════
       ПРОГРЕСС-БАР
    ══════════════════════════════════════ */

    let _progressTimer = null;
    let _progressValue = 0;   // 0–100
    let _progressTarget = 0;

    function setProgress(pct) {
        _progressTarget = Math.min(100, Math.max(0, pct));
    }

    function _tickProgress() {
        /* Плавно догоняем target */
        const diff = _progressTarget - _progressValue;
        if (Math.abs(diff) > 0.5) {
            _progressValue += diff * 0.12;
        } else {
            _progressValue = _progressTarget;
        }

        const v = _progressValue.toFixed(1);

        if (dom.progressFill) {
            dom.progressFill.style.width = v + '%';
        }

        if (dom.progressLabel) {
            dom.progressLabel.textContent = Math.round(_progressValue) + '%';
        }

        /* Линия под auto-bar */
        if (dom.bar) {
            dom.bar.style.setProperty('--section-fill', v + '%');
        }
    }

    function startProgressTimer() {
        stopProgressTimer();
        _progressTimer = setInterval(_tickProgress, PROGRESS_TICK);
    }

    function stopProgressTimer() {
        if (_progressTimer) {
            clearInterval(_progressTimer);
            _progressTimer = null;
        }
    }

    /* ══════════════════════════════════════
       AUTO-BAR
    ══════════════════════════════════════ */

    function showBar() {
        if (dom.overlay) dom.overlay.classList.add('is-active');
        document.body.classList.add('auto-mode-active');
    }

    function hideBar() {
        if (dom.overlay) dom.overlay.classList.remove('is-active');
        document.body.classList.remove('auto-mode-active');
    }

    function updateBarSection(label) {
        if (dom.barSection) dom.barSection.textContent = label ?? '';
    }

    /* ══════════════════════════════════════
       TOAST
    ══════════════════════════════════════ */

    let _toastTimer = null;

    function showToast(html, { persist = false, isPause = false } = {}) {
        if (!dom.toast) return;

        dom.toast.innerHTML = html;
        dom.toast.classList.toggle('is-pause', isPause);
        dom.toast.classList.add('is-visible');

        clearTimeout(_toastTimer);

        if (!persist) {
            _toastTimer = setTimeout(() => hideToast(), 4500);
        }
    }

    function hideToast() {
        if (!dom.toast) return;
        dom.toast.classList.remove('is-visible');
    }

    /* ══════════════════════════════════════
       TOUR TERMINAL
    ══════════════════════════════════════ */

    function showTourTerminal() {
        if (!dom.tourTerminal) return;
        dom.tourTerminal.classList.add('is-visible');
    }

    function hideTourTerminal() {
        if (!dom.tourTerminal) return;
        dom.tourTerminal.classList.remove('is-visible');
    }

    /* ══════════════════════════════════════
       EDGE LINES
    ══════════════════════════════════════ */

    function pulseEdgeLines() {
        [dom.edgeLeft, dom.edgeRight].forEach(el => {
            if (!el) return;
            el.classList.remove('is-pulsing');
            /* reflow — чтобы анимация перезапустилась */
            void el.offsetWidth;
            el.classList.add('is-pulsing');
            el.addEventListener('animationend', () => {
                el.classList.remove('is-pulsing');
            }, { once: true });
        });
    }

    /* ══════════════════════════════════════
       СКРОЛЛ К СЕКЦИИ
    ══════════════════════════════════════ */

    async function scrollToSection(sectionId) {
        const el = document.getElementById(sectionId)
            ?? document.querySelector(sectionId);

        if (!el) return;

        const top = el.getBoundingClientRect().top
            + window.scrollY
            - SCROLL_OFFSET;

        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

        /* Ждём завершения скролла */
        await TourUtils.sleep(600);
    }

    /* ══════════════════════════════════════
       ПАУЗА / ВОЗОБНОВЛЕНИЕ
    ══════════════════════════════════════ */

    function pause() {
        if (!state.running || state.paused) return;
        state.paused = true;

        document.body.classList.add('is-paused');
        stopProgressTimer();

        if (dom.btnPause) dom.btnPause.textContent = '▶';

        showToast(
            '⏸ &nbsp;<strong>Тур на паузе</strong><br>' +
            'Нажми <kbd>Space</kbd> или кнопку ▶ чтобы продолжить',
            { persist: true, isPause: true }
        );

        window.TourUtils?.setPaused(true);
    }

    function resume() {
        if (!state.running || !state.paused) return;
        state.paused = false;

        document.body.classList.remove('is-paused');
        startProgressTimer();

        if (dom.btnPause) dom.btnPause.textContent = '⏸';

        hideToast();
        window.TourUtils?.setPaused(false);
    }

    function togglePause() {
        state.paused ? resume() : pause();
    }

    /* ══════════════════════════════════════
       СТОП
    ══════════════════════════════════════ */

    function stop() {
        if (!state.running) return;

        state.running = false;
        state.stopped = true;
        state.paused = false;

        /* Отменяем текущую секцию */
        state.abortCtrl?.abort();

        /* Убираем UI */
        hideBar();
        hideToast();
        hideTourTerminal();
        stopProgressTimer();

        document.body.classList.remove('is-paused');
        window.TourUtils?.setPaused(false);
        window.TourCursor?.reset();

        /* Убираем обработчики клавиатуры */
        document.removeEventListener('keydown', _onKeydown);

        console.info('[TourEngine] stopped');
    }

    /* ══════════════════════════════════════
       КЛАВИАТУРА
    ══════════════════════════════════════ */

    function _onKeydown(e) {
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            togglePause();
        }
        if (e.key === 'Escape') {
            stop();
        }
    }

    /* ══════════════════════════════════════
       ЗАПУСК ТУРА
    ══════════════════════════════════════ */

    async function start(sections) {
        if (state.running) return;
        if (!sections?.length) {
            console.warn('[TourEngine] нет секций для запуска');
            return;
        }

        /* Инициализация состояния */
        state.sections = sections;
        state.running = true;
        state.stopped = false;
        state.paused = false;
        state.currentIdx = -1;
        _progressValue = 0;
        _progressTarget = 0;

        queryDom();
        showBar();
        showTourTerminal();
        startProgressTimer();

        document.addEventListener('keydown', _onKeydown);

        /* Вешаем кнопки управления */
        dom.btnPause?.addEventListener('click', togglePause);
        dom.btnExit?.addEventListener('click', stop);

        /* Стартовый тост */
        showToast(
            '&nbsp;<strong>Auto Tour запущен</strong><br>' +
            'Нажми <kbd>Space</kbd> — пауза &nbsp;|&nbsp; <kbd>Esc</kbd> — выход',
            { persist: false }
        );

        /* ── Перебираем секции ── */
        for (let i = 0; i < state.sections.length; i++) {

            if (state.stopped) break;

            /* Ждём снятия паузы */
            await TourUtils.waitUnpaused();
            if (state.stopped) break;

            state.currentIdx = i;
            const section = state.sections[i];

            /* Создаём AbortController для секции */
            state.abortCtrl = new AbortController();

            /* Обновляем UI */
            updateBarSection(section.label ?? section.id);
            pulseEdgeLines();

            /* Прогресс секции: i / total → (i+1) / total */
            const pctStart = (i / state.sections.length) * 100;
            const pctEnd = ((i + 1) / state.sections.length) * 100;
            setProgress(pctStart);

            /* Скроллим к секции */
            if (section.id) {
                await scrollToSection(section.id);
            }

            if (state.stopped) break;

            /* Запускаем сценарий секции */
            try {
                await section.fn({
                    signal: state.abortCtrl.signal,
                    setProgress: (pct) => setProgress(pctStart + (pct / 100) * (pctEnd - pctStart)),
                    showToast,
                    hideToast,
                });
            } catch (err) {
                if (err?.name === 'AbortError') break;
                console.error('[TourEngine] ошибка в секции', section.id, err);
            }

            setProgress(pctEnd);

            /* Пауза между секциями */
            if (i < state.sections.length - 1) {
                await TourUtils.sleep(SECTION_DELAY);
            }
        }

        /* ── Тур завершён ── */
        if (!state.stopped) {
            setProgress(100);
            await TourUtils.sleep(400);

            showToast(
                '&nbsp;<strong>Тур завершён!</strong><br>' +
                'Спасибо за просмотр.',
                { persist: false }
            );

            await TourUtils.sleep(3000);
            stop();
        }
    }

    /* ══════════════════════════════════════
       PUBLIC API
    ══════════════════════════════════════ */

    window.TourEngine = {
        start,
        stop,
        pause,
        resume,
        togglePause,
        setProgress,
        showToast,
        hideToast,
        scrollToSection,
        pulseEdgeLines,
        updateBarSection,
        get isRunning() { return state.running; },
        get isPaused() { return state.paused; },
        get currentIdx() { return state.currentIdx; },
    };

    /* GuidedTour — псевдоним для внешнего использования */
    window.GuidedTour = window.TourEngine;

    console.info('[TourEngine] ✓ ready');

})();