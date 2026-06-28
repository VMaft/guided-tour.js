TourUtils.registerSection('features', [

    { action: 'scroll', selector: '#cardGrid', block: 'start', delay: 1_000 },
    { action: 'type', text: 'ls ./features' },

    { action: 'highlight', selector: '#cardCursor', duration: 2_500 },
    { action: 'type', text: '// Virtual Cursor — smooth animated movement' },

    { action: 'highlight', selector: '#cardTyping', duration: 2_500 },
    { action: 'type', text: '// Typing Effect — terminal-style typewriter' },

    { action: 'highlight', selector: '#cardScenario', duration: 2_500 },
    { action: 'type', text: '// Step Scenarios — declarative JSON steps' },

    { action: 'sleep', duration: 800 },
    { action: 'type', text: '// Tour complete. Thanks for watching!' },

]);