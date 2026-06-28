window.__tourConfig = {
    delay: 5000,
    onTourStart: () => console.log('tour started'),
    onTourEnd: () => console.log('tour ended'),
    sections: [
        { id: 'hero', tag: '// hero', title: 'Hero', comment: 'Welcome to guided-tour.js — a lightweight auto-tour library.' },
        { id: 'about', tag: '// about', title: 'About', comment: 'Learn what guided-tour.js can do for your site.' },
        { id: 'features', tag: '// features', title: 'Features', comment: 'Explore the key features: cursor, typing, scenarios.' }
    ]
};