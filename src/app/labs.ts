import type { ComponentType } from 'react';
import { EventHandlingLab } from '../labs/events/EventHandlingLab';
import { IntersectionObserverLab } from '../labs/intersection-observer/IntersectionObserverLab';
import { MutationObserverLab } from '../labs/mutation-observer/MutationObserverLab';
import { PassiveListenersLab } from '../labs/passive-listeners/PassiveListenersLab';
import { PerformanceApiLab } from '../labs/performance/PerformanceApiLab';
import { RequestAnimationFrameLab } from '../labs/request-animation-frame/RequestAnimationFrameLab';
import { RequestIdleCallbackLab } from '../labs/request-idle-callback/RequestIdleCallbackLab';
import { RenderingPerformanceLab } from '../labs/rendering/RenderingPerformanceLab';
import { ResizeObserverLab } from '../labs/resize-observer/ResizeObserverLab';
import { WebWorkersLab } from '../labs/web-workers/WebWorkersLab';

export type LabDefinition = {
  slug: string;
  title: string;
  summary: string;
  api: string;
  component: ComponentType;
};

export const labs: LabDefinition[] = [
  {
    slug: 'resize-observer',
    title: 'ResizeObserver',
    summary: 'Element-aware layout without listening to global window resize.',
    api: 'ResizeObserver',
    component: ResizeObserverLab,
  },
  {
    slug: 'intersection-observer',
    title: 'IntersectionObserver',
    summary: 'Lazy initialization and infinite loading based on viewport visibility.',
    api: 'IntersectionObserver',
    component: IntersectionObserverLab,
  },
  {
    slug: 'web-workers',
    title: 'Web Workers',
    summary: 'Move CPU-heavy prime calculations away from the main thread.',
    api: 'Worker',
    component: WebWorkersLab,
  },
  {
    slug: 'request-idle-callback',
    title: 'requestIdleCallback',
    summary: 'Run non-urgent background work when the browser has spare time.',
    api: 'requestIdleCallback',
    component: RequestIdleCallbackLab,
  },
  {
    slug: 'request-animation-frame',
    title: 'requestAnimationFrame',
    summary: 'Compare timer-driven animation with paint-synchronized animation.',
    api: 'requestAnimationFrame',
    component: RequestAnimationFrameLab,
  },
  {
    slug: 'events',
    title: 'Event Handling',
    summary: 'Delegation, bubbling, capturing, preventDefault, and stopPropagation.',
    api: 'DOM Events',
    component: EventHandlingLab,
  },
  {
    slug: 'passive-listeners',
    title: 'Passive Event Listeners',
    summary: 'See why passive scroll and wheel listeners keep scrolling responsive.',
    api: 'addEventListener options',
    component: PassiveListenersLab,
  },
  {
    slug: 'mutation-observer',
    title: 'MutationObserver',
    summary: 'Watch child, attribute, and text mutations in a DOM playground.',
    api: 'MutationObserver',
    component: MutationObserverLab,
  },
  {
    slug: 'performance-api',
    title: 'Performance API',
    summary: 'Measure operations with now, mark, measure, and PerformanceObserver.',
    api: 'Performance',
    component: PerformanceApiLab,
  },
  {
    slug: 'rendering-performance',
    title: 'Rendering Performance',
    summary: 'Long tasks, frequent DOM updates, layout thrashing, and batched work.',
    api: 'Rendering pipeline',
    component: RenderingPerformanceLab,
  },
];
