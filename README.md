# Web API Sandbox

## Project Purpose

Web API Sandbox is a learning frontend project for practicing modern browser APIs, rendering behavior, and interface performance. The app is a set of small interactive React + TypeScript labs where each example compares a naive implementation with a browser-native API or a more careful rendering pattern.

Frontend developers benefit from understanding these APIs because performance problems often happen at the boundary between framework code and the browser: layout, paint, input handling, observers, main-thread work, and scheduling.

## Labs

### ResizeObserver

- Purpose: react to an element's own size instead of the whole window.
- Project example: a resizable analytics widget changes from compact to roomy layout.
- Real scenarios: dashboards, editors, embedded widgets, split panels, responsive cards.
- Impact: better component-level adaptation and fewer global resize listeners.

### IntersectionObserver

- Purpose: detect viewport entry without polling geometry on every scroll.
- Project example: cards initialize lazily and a sentinel loads the next feed page.
- Real scenarios: lazy images, infinite feeds, analytics exposure tracking, deferred widgets.
- Impact: less urgent scroll work and cleaner lazy initialization.

### Web Workers

- Purpose: move CPU-heavy work off the main thread.
- Project example: prime counting runs either on the main thread or inside a Worker while an animation shows responsiveness.
- Real scenarios: parsing, compression, search indexing, image/data processing.
- Impact: the UI remains responsive during expensive computation.

### requestIdleCallback

- Purpose: schedule non-critical background work during idle periods.
- Project example: a queue of small precomputation tasks runs in chunks with a timeout fallback.
- Real scenarios: cache warming, cleanup, non-critical analytics, precomputing suggestions.
- Impact: reduces visible jank, but it must not be used for urgent or correctness-critical operations.

### requestAnimationFrame

- Purpose: synchronize animation updates with browser paints.
- Project example: a moving ball compares `setInterval` with `requestAnimationFrame`.
- Real scenarios: DOM animation, canvas, WebGL, custom transitions.
- Impact: smoother animation and predictable cleanup with `cancelAnimationFrame`.

### Event Handling

- Purpose: understand listeners, delegation, bubbling, capturing, cancellation, and propagation.
- Project example: a large button grid switches between individual listeners and delegated handling, with a visual event log.
- Real scenarios: tables, menus, trees, virtualized lists, guarded navigation.
- Impact: fewer listeners, less churn, and easier debugging of propagation bugs.

### Passive Event Listeners

- Purpose: tell the browser that a scroll-related listener will not cancel scrolling.
- Project example: a scroll box compares `{ passive: true }` with a blocking wheel listener.
- Real scenarios: scroll tracking, touch/wheel metrics, sticky UI reactions.
- Impact: smoother scrolling because the browser does not need to wait for JavaScript before scrolling.

### MutationObserver

- Purpose: observe DOM changes without polling.
- Project example: a DOM playground logs added/removed nodes and attribute changes while options are toggled.
- Real scenarios: editor plugins, third-party embeds, analytics, legacy DOM integration.
- Impact: precise, batched mutation records and less wasteful DOM scanning.

### Performance API

- Purpose: create high-resolution timings and named marks/measures.
- Project example: a sort operation is measured with `performance.now()`, `mark()`, `measure()`, and `PerformanceObserver`.
- Real scenarios: startup milestones, user-flow instrumentation, custom profiling.
- Impact: accurate timings that can be correlated with browser performance traces.

### Rendering Performance Lab

- Purpose: see how main-thread work affects rendering.
- Project example: long task, frequent DOM updates, layout thrashing, and batched reads/writes scenarios.
- Real scenarios: dashboards, editors, large tables, resizing tools, animation-heavy UI.
- Impact: batching reads/writes and shortening tasks reduces layout recalculation and input delay.

## Running Locally

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Browser DevTools

Open Chrome DevTools -> Performance and record while running the naive and optimized versions. Useful things to compare:

- Main thread activity.
- Long tasks.
- Scripting time.
- Rendering and layout.
- Painting.
- FPS.

The built-in diagnostics are intentionally lightweight. They make behavior visible in the UI, while DevTools gives the deeper timeline.
