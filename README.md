Интерактивные авто-туры для ваших веб-страниц с эффектом живой демонстрации
<p align="center">
  <img src="assets/logo.svg" width="600" alt="guided-tour.js">
</p>


---
## 👋 Привет!

Меня зовут Вадим, и этот проект я решил сделать публичным, потому что он может принести пользу не только мне, но и вам!

## Demo

**[Посмотреть живую демонстрацию →](https://vmaft.github.io/guided-tour.js/)**
> *Автоматическая навигация с подсветкой элементов и терминалом субтитров*



---

## Идея и концепция

Что лучше, чем просто показ слайдов? **Автоматический показ слайдов!**  
А если сделать слайды интерактивными - получится сайт, о котором очень удобно рассказать закадрово в субтитрах и **подсветить** самое нужное и значимое.

### Проблема
Стандартные туториалы и туры по сайту:
- Статичны и скучны
- Требуют ручного клика на "Далее"
- Не создают эффекта живой демонстрации

### Решение
**guided-tour.js** - это попытка выйти за границы стандартного показа сайта и простой демонстрации страницы "О себе". Библиотека предоставляет возможность прокомментировать всю страницу в привычном формате субтитров с автоматической навигацией.

### Ключевые особенности

 **Автоматический режим** - тур проигрывается сам, как видеоролик  
 **Подсветка элементов** - фокус на важных деталях  
 **Терминал субтитров** - стильное отображение комментариев  
 **Виртуальный курсор** - эффект записи экрана  
 **Управление** - пауза, навигация стрелками, выход  
 **Легкая интеграция** - простое описание сценариев



---


## Структура библиотеки

**guided-tour.js** - это легковесная библиотека из 5 файлов:

```
guided-tour.js/
├── guided-tour.js          # Движок (управление, переключение секций, терминал)
├── tour-utils.js           # Утилиты (регистрация сценариев, выделение элементов)
├── tour-cursor.js          # Виртуальный курсор (опционально)
├── tour-sections.js        # Описание секций (генерируется автоматически)
└── tour-scenario.js        # Сценарий демонстрации (ваш контент)
```

### Файлы

| Файл | Описание | Обязательный |
|------|----------|--------------|
| **guided-tour.js** | Движок: управление демонстрацией, переключение секций, вывод "субтитров", отрисовка элементов автотура | Да |
| **tour-utils.js** | Утилиты: анализ и регистрация сценариев, выделение элементов, обработка остановки тура | Да |
| **tour-cursor.js** | Виртуальный курсор: отрисовка и перемещение курсора по странице, выделение элементов | Опционально |
| **tour-sections.js** | Описание секций: регистрация всех секций автотура (с v1.1.0 генерируется автоматически) | Да |
| **tour-scenario.js** | Сценарий: описание всех действий, комментарии к секциям, шаги демонстрации | Да |



---


## Установка

### 1. Подключите файлы библиотеки

```html
<!-- Порядок важен! -->
<script src="tour-sections.js"></script>      <!-- всегда первым -->
<script src="guided-tour.js"></script>        <!-- основной движок -->
<script src="tour-cursor.js"></script>        <!-- опционально -->
<script src="tour-utils.js"></script>         <!-- утилиты -->
<script src="tour-scenario-1.js"></script>    <!-- ваши сценарии -->
<script src="tour-scenario-N.js"></script>
```

### 2. Добавьте стили

```html
<link rel="stylesheet" href="guided-tour.css">
```

### 3. Создайте свой сценарий

```javascript
  // tour-hero.js
  let hover_duration = 1_000;
  TourUtils.registerSection({
      id: 'example',  // у секции желательно наличие уникального id для корректной регистрации автотура
      tag: '// example',
      title: 'Example',
      comment: 'Welcome to guided-tour.js - a lightweight auto-tour library.',
      steps: [
          { action: 'highlight', selector: '.gt-hero__title', duration: hover_duration },
          { action: 'highlight', selector: '.gt-hero__sub', duration: 7_600 },
  
          { action: 'sleep', duration: 600 },
          { action: 'type', text: 'guided-tour.js --version 1.0.0' },
  
          { action: 'hover', selector: '#btnAuto', duration: 2_200 },
          { action: 'type', text: '// Press "Run Demo Tour" to start' },
      ]
  });
```

---

## Примеры использования

### Базовый тур демонстарции about секции **[демо](https://vmaft.github.io/guided-tour.js/)**

```javascript
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
        { action: 'type', text: '// Pausable - Space to pause / resume' },

        { action: 'hover', selector: '#feat2', duration: 1_400 },
        { action: 'type', text: '// Keyboard navigation - ← →' },

        { action: 'hover', selector: '#feat3', duration: 1_400 },
        { action: 'type', text: '// Optional terminal overlay' },

        { action: 'hover', selector: '#feat4', duration: 1_400 },
        { action: 'type', text: '// Virtual cursor with hover effects' },

        { action: 'sleep', duration: 600 },
        { action: 'type', text: '// 4 features - loaded ✓' },

    ]
});
```
### Как это выглядит **[демо](https://vmaft.github.io/guided-tour.js/)**
<img width="1192" height="720" alt="chrome-capture-2026-07-08 (1)" src="https://github.com/user-attachments/assets/50f05bc7-4353-4794-93d6-f19811e1ee87" />

---

## Настройка

### Доступные действия в сценариях

| Действие | Описание | Параметры |
|----------|----------|-----------|
| `type` | Вывод текста в терминал | `text`, `duration` |
| `highlight` | Подсветка элемента | `selector`, `duration` |
| `scroll` | Переместить курсор | `selector`, `duration` |
| `hover` | Выделеить элемент с эффектом ховера | `selector`, `duration` |
| `sleep` | Пауза | `duration` |

### Управление во время тура

| Клавиша | Действие |
|---------|----------|
| `Space` | Пауза / Продолжить |
| `←` / `→` | Предыдущая / Следующая секция |
| `Esc` | Выход из тура |

---

## Кастомизация

### Изменение стилей терминала

```css
:root {
  --term-bg: rgba(30, 30, 46, 0.95);
  --term-text: #cdd6f4;
  --term-accent: #89b4fa;
  --term-height: 160px;
}
```

### Настройка таймингов

```javascript
// В tour-sections.js:
window.__tourConfig = {
    //Конфиг демонстрации комментария к секции - по умолчанию 5 секунд
    delay: 5000,
    onTourStart: () => console.log('tour started'), 
    onTourEnd: () => console.log('tour ended'),
    sections: []
};
```
```javascript
// Пример реального сценария секции about:
'use strict';

let hover_duration = 1_000; // переменная со значением времени выделению элементов на странице

TourUtils.registerSection('about', [

    { action: 'sleep', duration: 400 },
    { action: 'highlight', selector: '#about .about-intro', duration: 7_000 }, // 
    { action: 'highlight', selector: '[data-testid="about-body-2"]', duration: 7_000 },

    { action: 'hover', selector: '[data-testid="experiense_stat"]', duration: hover_duration },
    { action: 'type', text: '8+ лет опыта в тестировании' },
    ...
    { action: 'hover', selector: '[data-testid="education_stat"]', duration: hover_duration },
    { action: 'type', text: 'Высшее образование' },
    ...
```
---

## Roadmap

### Выполнено
- [x] Вынесен в отдельный публичный проект
- [x] Автогенерация секций из описания сценариев
- [x] Кейс-заглушка для автотура
- [x] GitHub Pages для демо-стенда

### В разработке
- [ ] Вынести настройки стилей в отдельный конфиг
- [ ] Единый конфиг для управления таймаутами
- [ ] Вариативность форматов селекторов
- [ ] Создание секций без привязки к ID

### Планируется
- [ ] Обработка ошибок и fallback'ы
- [ ] Уровни логирования (debug/info/error)
- [ ] Улучшение стабильности
- [ ] Продвинутый UI/UX состояний тура

---

## Технические детали

### Реализация

Проект разработан с использованием **AI-ассистента** (Claude/ChatGPT).

**Мной выполнено:**
-  Архитектура проекта и движка
-  Система переключения секций
-  Управление автотуром и навигация
-  Баг-репорты и исправления
-  Интеграция с портфолио
-  Доработка под требования

### Почему AI?

Моя основная экспертиза - **тестирование и автоматизация на Java/Selenide**.  
JavaScript использован как инструмент для быстрой реализации идеи и акцентов.

---

##  Лицензия

MIT License - делайте что хотите, но укажите автора 😊

---

## Contributing

Нашли баг? Есть идея? Открывайте [Issue](../../issues) или [Pull Request](../../pulls)!

---

## Контакты

**Вадим**  
GitHub: [@vmaft](https://github.com/vmaft)  
Demo: [guided-tour.js](https://vmaft.github.io/guided-tour.js/)

---

<p align="center">
  <sub>Сделано с ❤️ и AI</sub>
</p>
