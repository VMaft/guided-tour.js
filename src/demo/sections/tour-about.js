TourUtils.registerSection({
    id: 'about',
    tag: '// about',
    title: 'About',
    comment: 'Learn what guided-tour.js can do for your site.',
    steps: [
        { action: 'highlight', selector: '#about .gt-section__text', duration: 3_000 },

        { action: 'sleep', duration: 800 },
        { action: 'type', text: 'cat about.txt' },

        { action: 'hover', selector: '#feat1', duration: 1_400 },
        { action: 'type', text: '// Pausable — Space to pause / resume' },

        { action: 'hover', selector: '#feat2', duration: 1_400 },
        { action: 'type', text: '// Keyboard navigation — ← →' },

        { action: 'hover', selector: '#feat3', duration: 1_400 },
        { action: 'type', text: '// Optional terminal overlay' },

        { action: 'hover', selector: '#feat4', duration: 1_400 },
        { action: 'type', text: '// Virtual cursor with hover effects' },

        { action: 'sleep', duration: 600 },
        { action: 'type', text: '// 4 features — loaded ✓' },

    ]
});