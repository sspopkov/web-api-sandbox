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
    summary: 'Адаптация компонента к его собственному размеру без глобального window.resize.',
    api: 'ResizeObserver',
    component: ResizeObserverLab,
  },
  {
    slug: 'intersection-observer',
    title: 'IntersectionObserver',
    summary: 'Ленивая инициализация и подгрузка списка по видимости во viewport.',
    api: 'IntersectionObserver',
    component: IntersectionObserverLab,
  },
  {
    slug: 'web-workers',
    title: 'Веб-воркеры',
    summary: 'Выполнение ресурсоёмкого подсчёта простых чисел вне основного потока.',
    api: 'Worker',
    component: WebWorkersLab,
  },
  {
    slug: 'request-idle-callback',
    title: 'requestIdleCallback',
    summary: 'Выполнение несрочных фоновых задач в периоды простоя браузера.',
    api: 'requestIdleCallback',
    component: RequestIdleCallbackLab,
  },
  {
    slug: 'request-animation-frame',
    title: 'requestAnimationFrame',
    summary: 'Сравнение анимации по таймеру с анимацией, синхронизированной с отрисовкой.',
    api: 'requestAnimationFrame',
    component: RequestAnimationFrameLab,
  },
  {
    slug: 'events',
    title: 'Обработка событий',
    summary: 'Делегирование, всплытие, перехват, preventDefault и stopPropagation.',
    api: 'События DOM',
    component: EventHandlingLab,
  },
  {
    slug: 'passive-listeners',
    title: 'Пассивные обработчики',
    summary: 'Как пассивные обработчики scroll и wheel помогают сохранить плавную прокрутку.',
    api: 'Параметры addEventListener',
    component: PassiveListenersLab,
  },
  {
    slug: 'mutation-observer',
    title: 'MutationObserver',
    summary: 'Наблюдение за узлами, атрибутами и текстом в DOM-песочнице.',
    api: 'MutationObserver',
    component: MutationObserverLab,
  },
  {
    slug: 'performance-api',
    title: 'API производительности',
    summary: 'Измерение операций с помощью now, mark, measure и PerformanceObserver.',
    api: 'Performance',
    component: PerformanceApiLab,
  },
  {
    slug: 'rendering-performance',
    title: 'Производительность рендеринга',
    summary: 'Долгие задачи, частые обновления DOM, layout thrashing и пакетная обработка.',
    api: 'Конвейер рендеринга',
    component: RenderingPerformanceLab,
  },
];
