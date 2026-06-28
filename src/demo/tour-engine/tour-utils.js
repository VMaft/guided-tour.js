'use strict';

(function initTourUtils() {

    // Проверяем флаг паузы из основного движка
    function isPaused() {
        return document.body.classList.contains('is-paused');
    }

    const _sleep = (ms) => new Promise(resolve => {
        let elapsed = 0;
        let lastTime = null;   // ← запоминаем когда последний раз считали

        function tick(now) {
            if (isPaused()) {
                // На паузе — сбрасываем lastTime чтобы не считать время паузы
                lastTime = null;
                requestAnimationFrame(tick);
                return;
            }

            if (lastTime !== null) {
                elapsed += now - lastTime;  // ← считаем только реальное время
            }
            lastTime = now;

            if (elapsed >= ms) {
                resolve();
            } else {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    });

    // Ждёт пока isPaused() не станет false
    function waitForUnpause() {
        if (!isPaused()) return Promise.resolve();

        return new Promise(resolve => {
            function check() {
                if (!isPaused()) {
                    resolve();
                } else {
                    requestAnimationFrame(check);
                }
            }
            check();
        });
    }

    async function simulateHover(el, duration) {
        if (!el) {
            console.warn(
                `[TourUtils] Шаг "${step.action}" пропущен: элемент не найден по селектору "${step.selector}"`
            );
            return;
        }
        const cursor = window.TourCursor;
        if (cursor) {
            await cursor.hoverElement(el, duration);
        } else {
            el.classList.add('tour-hover');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            await _sleep(duration);
            el.classList.remove('tour-hover');
        }
    }

    async function highlightElement(el, duration) {
        const cursor = window.TourCursor;
        if (cursor) {
            await cursor.highlightElement(el, duration);
        } else {
            el.classList.add('tour-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await _sleep(duration);
            el.classList.remove('tour-highlight');
        }
    }

    async function termType(engine, text) {
        if (!engine?.typeText) return;
        await engine.typeText(text);
        await _sleep(500);
    }

    /* ── Универсальный прогон сценария ── */
    async function runScenario(steps, engine, getRunning) {
        for (const step of steps) {
            // Ждём снятия паузы перед каждым шагом
            await waitForUnpause();

            // Проверяем флаг остановки
            if (!getRunning()) return;

            const el = step.selector
                ? document.querySelector(step.selector)
                : null;

            switch (step.action) {
                case 'hover':
                    if (!el) { console.warn(`[TourUtils] не найден: ${step.selector}`); break; }
                    await simulateHover(el, step.duration ?? 2500);
                    if (!getRunning()) return;
                    await _sleep(step.gap ?? 400);
                    break;

                case 'highlight':
                    if (!el) { console.warn(`[TourUtils] не найден: ${step.selector}`); break; }
                    await highlightElement(el, step.duration ?? 30_000);
                    if (!getRunning()) return;
                    break;

                case 'type':
                    await termType(engine, step.text ?? '');
                    if (!getRunning()) return;
                    break;

                case 'scroll':
                    if (!el) { console.warn(`[TourUtils] не найден: ${step.selector}`); break; }
                    el.scrollIntoView({ behavior: 'smooth', block: step.block ?? 'center' });
                    await _sleep(step.delay ?? 1200);
                    if (!getRunning()) return;
                    break;

                case 'sleep':
                    await _sleep(step.duration ?? 1000);
                    if (!getRunning()) return;
                    break;

                default:
                    console.warn(`[TourUtils] неизвестный action: ${step.action}`);
            }
        }
    }

    function registerSection(config) {

        // Обратная совместимость — старый вызов registerSection('id', steps)
        if (typeof config === 'string') {
            console.warn(`[TourUtils] registerSection(id, steps) — устаревший синтаксис`);
            config = { id: config, steps: arguments[1] ?? [] };
        }

        const { id, tag, title, comment, steps = [] } = config;

        // Авторегистрация секции в движке
        const cfg = window.__tourConfig;
        if (cfg?.sections && !cfg.sections.find(s => s.id === id)) {
            cfg.sections.push({ id, tag: tag ?? `// ${id}`, title: title ?? id, comment });
            console.info(`[TourUtils] ✓ Секция добавлена в __tourConfig: ${id}`);
        }

        function doRegister(engine) {
            let running = false;

            engine.onSectionEnter?.(id, async () => {
                running = true;
                window.TourCursor?.show();

                let completed = false;
                try {
                    await runScenario(steps, engine, () => running);
                    completed = running;
                } catch (err) {
                    if (running) console.warn(`[Tour:${id}] Ошибка:`, err);
                } finally {
                    running = false;
                    window.TourCursor?.hide();
                    if (completed) engine.onStepComplete?.();
                }
            });

            engine.onSectionLeave?.(id, () => {
                running = false;
                window.TourCursor?.reset();
            });

            console.info(`[TourUtils] ✓ Зарегистрирован сценарий: ${id}`);
        }

        if (window.__tourEngine) {
            doRegister(window.__tourEngine);
        } else {
            console.warn(`[TourUtils] __tourEngine не найден для: ${id}, жду...`);
            const start = Date.now();
            const interval = setInterval(() => {
                if (window.__tourEngine) {
                    clearInterval(interval);
                    doRegister(window.__tourEngine);
                } else if (Date.now() - start > 5_000) {
                    clearInterval(interval);
                    console.error(`[TourUtils] __tourEngine так и не появился: ${id}`);
                }
            }, 50);
        }
    }



    /* ── Экспорт ── */
    window.TourUtils = {
        sleep: _sleep,
        simulateHover,
        highlightElement,
        termType,
        runScenario,
        registerSection,
    };

    console.info('[TourUtils] ✓ Инициализирован');

})();