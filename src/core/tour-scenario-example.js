TourUtils.registerSection({
    id: 'hero',
    tag: '// hero',
    title: 'Hero',
    comment: 'Learn what guided-tour.js can do for your site.',
    steps: [
        { action: 'type', text: 'Это файл-пример автотур-сценария.' },
        { action: 'type', text: 'Ставьте звездочку в "https://github.com/VMaft/guided-tour.js" если решил ничего не менять и попробовать завести без настройки :)' },
        { action: 'type', text: 'Пожалуйста убедитесь в наличии указаных селекторов в шагах сценария!' },

        { action: 'type', text: '// Выделяем первый попавшийся заголовок первого уровня на странице (если есть).' },
        { action: 'highlight', selector: 'h1', duration: 3_000 },

        { action: 'type', text: 'Ставим паузу в 800 мс' },
        { action: 'sleep', duration: 800 },

        { action: 'type', text: '// Выделяем первый попавшийся параграф на странице (если есть).' },
        { action: 'hover', selector: 'p', duration: 3_400 },

        { action: 'type', text: '// На этом всё :)' },
    ]
});