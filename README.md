# Web API Sandbox

Учебный frontend-проект для практического изучения современных браузерных API, управления рендерингом и оптимизации производительности интерфейсов.

Проект состоит из набора небольших интерактивных лабораторных работ на React + TypeScript. Каждая лабораторная показывает, какую проблему решает конкретный Browser API, как выглядит более наивный подход, как работает оптимизированный вариант и какой эффект это дает для UX или производительности.

## Цель Проекта

Frontend-разработчику важно понимать не только React, но и то, как браузер выполняет JavaScript, обрабатывает события, считает layout, рисует кадры, планирует задачи и освобождает main thread.

Этот проект помогает потрогать эти механики руками:

- переключать наивную и оптимизированную реализации;
- запускать сценарии, которые нагружают main thread;
- видеть простые диагностические метрики прямо в интерфейсе;
- сравнивать поведение в Chrome DevTools Performance.

## Технологии

- TypeScript
- React
- Vite
- CSS
- ESLint
- Prettier

Проект намеренно не использует тяжелые UI-библиотеки и абстракции, которые скрывают работу браузерных API.

## Лабораторные

### ResizeObserver

- Назначение: отслеживать изменение размера конкретного элемента, а не всего окна.
- Пример в проекте: resizable analytics widget меняет компоновку с компактной на многоколоночную в зависимости от собственной ширины.
- Реальные сценарии: dashboards, split panels, editors, embedded widgets, responsive cards.
- Эффект: компонент точнее адаптируется к контейнеру и не требует глобального `window.resize`.

### IntersectionObserver

- Назначение: определять появление элементов во viewport без ручного polling на каждый `scroll`.
- Пример в проекте: карточки лениво инициализируются при попадании в область видимости, а sentinel подгружает следующую порцию списка.
- Реальные сценарии: lazy loading изображений, infinite scroll, exposure analytics, deferred widgets.
- Эффект: меньше срочной работы во время scroll и более чистая логика lazy initialization.

### Web Workers

- Назначение: выносить CPU-intensive операции из main thread.
- Пример в проекте: подсчет простых чисел выполняется либо в основном потоке, либо внутри Worker.
- Реальные сценарии: парсинг больших данных, сжатие, поиск, индексация, обработка изображений, тяжелые вычисления.
- Эффект: интерфейс остается отзывчивым во время дорогих вычислений.

### requestIdleCallback

- Назначение: выполнять некритичные фоновые задачи в периоды простоя браузера.
- Пример в проекте: очередь небольших задач выполняется чанками, с fallback через `setTimeout`.
- Реальные сценарии: прогрев кеша, предварительные вычисления, non-critical analytics, cleanup после рендера.
- Эффект: снижает заметные лаги, но не подходит для срочных или критически важных операций.

### requestAnimationFrame

- Назначение: синхронизировать обновления анимации с кадрами браузера.
- Пример в проекте: простая анимация сравнивает цикл на `setInterval` и цикл на `requestAnimationFrame`.
- Реальные сценарии: DOM-анимации, canvas, WebGL, кастомные переходы.
- Эффект: более плавная анимация и корректный cleanup через `cancelAnimationFrame`.

### Event Handling

- Назначение: показать работу event listeners, delegation, bubbling, capturing, `preventDefault` и `stopPropagation`.
- Пример в проекте: большой список кнопок переключается между отдельными listeners и event delegation, а event log показывает порядок событий.
- Реальные сценарии: таблицы, меню, деревья, большие списки, guarded navigation.
- Эффект: delegation уменьшает количество listeners и помогает проще обслуживать динамические списки.

### Passive Event Listeners

- Назначение: показать, как `{ passive: true }` помогает браузеру не ждать JavaScript перед scroll.
- Пример в проекте: scroll box сравнивает passive wheel listener и blocking listener, который вызывает `preventDefault`.
- Реальные сценарии: scroll tracking, touch/wheel metrics, sticky UI reactions.
- Эффект: более плавный scrolling, когда обработчик только наблюдает событие и не отменяет его.

### MutationObserver

- Назначение: наблюдать за DOM-изменениями без polling.
- Пример в проекте: DOM playground позволяет добавлять элементы, удалять их и менять attributes, а журнал показывает mutation records.
- Реальные сценарии: editor plugins, third-party embeds, analytics, интеграция с legacy DOM.
- Эффект: точные batched-записи об изменениях DOM без постоянного сканирования дерева.

### Performance API

- Назначение: измерять операции с высокой точностью и создавать именованные marks/measures.
- Пример в проекте: сортировка массива измеряется через `performance.now()`, `performance.mark()`, `performance.measure()` и `PerformanceObserver`.
- Реальные сценарии: измерение startup, пользовательских сценариев, дорогих операций, кастомных performance metrics.
- Эффект: точные метрики, которые можно сопоставлять с Performance trace в DevTools.

### Rendering Performance Lab

- Назначение: показать, как main thread и DOM-операции влияют на rendering pipeline.
- Пример в проекте: long task, частые DOM updates, layout thrashing и batching DOM reads/writes.
- Реальные сценарии: dashboards, editors, большие таблицы, drag/resize tools, animation-heavy interfaces.
- Эффект: batching чтений и записей DOM уменьшает layout recalculation и освобождает кадры для input/render/paint.

## Структура

```text
src/
  app/
  components/
  labs/
    resize-observer/
    intersection-observer/
    web-workers/
    request-idle-callback/
    request-animation-frame/
    events/
    passive-listeners/
    mutation-observer/
    performance/
    rendering/
  utils/
  workers/
```

Логика каждой лабораторной находится рядом с соответствующим компонентом. Общие компоненты используются только для layout, информационных блоков, метрик и переключателей режимов.

## Локальный Запуск

```bash
npm install
npm run dev
npm run build
npm run lint
```

После запуска dev server открой адрес, который выведет Vite, обычно:

```text
http://127.0.0.1:5173/
```

## Browser DevTools

Открой Chrome DevTools -> Performance и запиши trace во время работы лабораторных. Особенно полезно сравнивать наивные и оптимизированные режимы.

На что смотреть:

- Main thread;
- long tasks;
- scripting;
- rendering;
- layout;
- painting;
- FPS.

Встроенная диагностика в интерфейсе специально простая. Она помогает быстро увидеть эффект, а DevTools дает подробную временную шкалу и реальные browser metrics.
