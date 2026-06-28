TourUtils.registerSection({
    id: 'hero',
    tag: '// hero',
    title: 'Hero',
    comment: 'Welcome to guided-tour.js — a lightweight auto-tour library.',
    steps: [
        { action: 'highlight', selector: '.gt-hero__title', duration: 2_500 },
        { action: 'highlight', selector: '.gt-hero__sub', duration: 2_000 },

        { action: 'sleep', duration: 600 },
        { action: 'type', text: 'guided-tour.js --version 1.0.0' },

        { action: 'hover', selector: '#btnAuto', duration: 2_200 },
        { action: 'type', text: '// Press "Run Demo Tour" to start' },
    ]
});