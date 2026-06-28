/* ══════════════════════════════════════════════════════════════
   tour-cursor.js  v1.0.0
   Виртуальный курсор для guided-tour.js

   Зависимости:
     - TourUtils (tour-utils.js) — для паузируемого sleep
     - CSS: #tourCursor { position: fixed; ... }

   Подключение (порядок важен):
     <script src="guided-tour.js"></script>
     <script src="tour-cursor.js"></script>   ← до секций
     <script src="tour-utils.js"></script>
     <script src="your-sections.js"></script>
══════════════════════════════════════════════════════════════ */
'use strict';

(function initTourCursor() {

    /* ══════════════════════════
       SLEEP — через TourUtils
       (учитывает паузу тура)
    ══════════════════════════ */

    function _sleep(ms) {
        return window.TourUtils?.sleep
            ? window.TourUtils.sleep(ms)
            : new Promise(resolve => setTimeout(resolve, ms));
    }

    /* ══════════════════════════
       СОЗДАНИЕ / ПОЛУЧЕНИЕ ЭЛЕМЕНТА
    ══════════════════════════ */

    function createCursorEl() {
        if (document.getElementById('tourCursor')) return;
        const el = document.createElement('div');
        el.id = 'tourCursor';
        el.setAttribute('aria-hidden', 'true');
        document.body.appendChild(el);
    }

    createCursorEl();

    function getCursorEl() {
        return document.getElementById('tourCursor') ?? recreateCursor();
    }

    function recreateCursor() {
        const el = document.createElement('div');
        el.id = 'tourCursor';
        el.setAttribute('aria-hidden', 'true');
        document.body.appendChild(el);
        return el;
    }

    /* ══════════════════════════
       HELPERS
    ══════════════════════════ */

    function getElementCenter(el) {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    }

    /* ══════════════════════════
       MOVE
    ══════════════════════════ */

    async function moveTo(el, options = {}) {
        if (!el) return;

        const cursor = getCursorEl();
        if (!cursor) return;

        const { instant = false, offsetX = 0, offsetY = 0 } = options;
        const center = getElementCenter(el);
        const targetX = center.x + offsetX;
        const targetY = center.y + offsetY;

        if (instant) {
            cursor.style.transition = 'opacity 0.3s ease';
            cursor.style.left = targetX + 'px';
            cursor.style.top = targetY + 'px';
            return;
        }

        cursor.style.transition =
            'left 0.55s cubic-bezier(0.4,0,0.2,1), ' +
            'top  0.55s cubic-bezier(0.4,0,0.2,1), ' +
            'opacity 0.3s ease';

        cursor.style.left = targetX + 'px';
        cursor.style.top = targetY + 'px';

        await _sleep(360);
    }

    /* ══════════════════════════
       SHOW / HIDE
    ══════════════════════════ */

    function show() {
        const cursor = getCursorEl();
        if (cursor) cursor.style.opacity = '1';
    }

    function hide() {
        const cursor = getCursorEl();
        if (cursor) cursor.style.opacity = '0';
    }

    /* ══════════════════════════
       CLICK
    ══════════════════════════ */

    async function click(el) {
        if (!el) return;
        await moveTo(el);

        const cursor = getCursorEl();
        if (!cursor) return;

        cursor.classList.add('is-clicking');
        await _sleep(280);
        cursor.classList.remove('is-clicking');
        await _sleep(120);
    }

    /* ══════════════════════════
       HOVER ELEMENT
       Плавно подводит курсор к элементу,
       добавляет класс .tour-hover на duration мс
    ══════════════════════════ */

    async function hoverElement(el, duration = 2500) {
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        await _sleep(200);

        show();
        await moveTo(el);

        el.classList.add('tour-hover');
        await _sleep(duration);
        el.classList.remove('tour-hover');
        await _sleep(150);
    }

    /* ══════════════════════════
       HIGHLIGHT ELEMENT
       Подсвечивает блок целиком —
       добавляет класс .tour-highlight на duration мс
    ══════════════════════════ */

    async function highlightElement(el, duration = 3000) {
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await _sleep(200);

        show();

        const rect = el.getBoundingClientRect();
        const cursor = getCursorEl();

        if (cursor) {
            cursor.style.transition =
                'left 0.55s cubic-bezier(0.4,0,0.2,1), ' +
                'top  0.55s cubic-bezier(0.4,0,0.2,1), ' +
                'opacity 0.3s ease';
            cursor.style.left = (rect.left + 16) + 'px';
            cursor.style.top = (rect.top + 16) + 'px';
            await _sleep(580);
        }

        el.classList.add('tour-highlight');
        await _sleep(duration);
        el.classList.remove('tour-highlight');
        await _sleep(150);
    }

    /* ══════════════════════════
       RESET
       Скрывает курсор, убирает все классы выделения
    ══════════════════════════ */

    function reset() {
        hide();
        document
            .querySelectorAll('.tour-hover, .tour-highlight')
            .forEach(el => el.classList.remove('tour-hover', 'tour-highlight'));
    }

    /* ══════════════════════════
       PUBLIC API
    ══════════════════════════ */

    window.TourCursor = {
        show,
        hide,
        reset,
        moveTo,
        click,
        hoverElement,
        highlightElement,
    };

    console.info('[TourCursor] ✓ ready');

})();