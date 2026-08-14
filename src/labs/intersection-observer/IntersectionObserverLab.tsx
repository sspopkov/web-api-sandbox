import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Mode = 'observer' | 'scroll';

type FeedCardProps = {
  id: number;
  initialized: boolean;
  visible: boolean;
  registerNode: (id: number, node: HTMLElement | null) => void;
};

const INITIAL_ITEMS = 16;
const BATCH_SIZE = 8;
const MAX_ITEMS = 80;
const VISIBILITY_THRESHOLD = 0.1;

function FeedCard({ id, initialized, visible, registerNode }: FeedCardProps) {
  const setNode = useCallback(
    (node: HTMLElement | null) => {
      registerNode(id, node);
    },
    [id, registerNode],
  );

  const className = ['feedCard', initialized ? 'ready' : '', visible ? 'inView' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <article className={className} data-item={id} ref={setNode}>
      <strong>Карточка {id}</strong>
      <p className="note">
        {initialized ? 'Контент инициализирован.' : 'Ожидает инициализации.'}
        {visible ? ' Сейчас во viewport.' : ''}
      </p>
    </article>
  );
}

function getIntersectionRatio(target: DOMRect, root: DOMRect) {
  const width = Math.max(0, Math.min(target.right, root.right) - Math.max(target.left, root.left));
  const height = Math.max(0, Math.min(target.bottom, root.bottom) - Math.max(target.top, root.top));
  const targetArea = target.width * target.height;
  return targetArea === 0 ? 0 : (width * height) / targetArea;
}

function setsAreEqual(left: Set<number>, right: Set<number>) {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

export function IntersectionObserverLab() {
  const [mode, setMode] = useState<Mode>('observer');
  const [count, setCount] = useState(INITIAL_ITEMS);
  const [initialized, setInitialized] = useState<Set<number>>(() => new Set());
  const [visible, setVisible] = useState<Set<number>>(() => new Set());
  const [callbacks, setCallbacks] = useState(0);
  const [workUnits, setWorkUnits] = useState(0);
  const [loads, setLoads] = useState(0);
  const [session, setSession] = useState(0);

  const feedRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemNodesRef = useRef(new Map<number, HTMLElement>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollMeasureRef = useRef<(() => void) | null>(null);
  const countRef = useRef(INITIAL_ITEMS);
  const sessionRef = useRef(0);
  const measuredKeyRef = useRef('');

  const supportsIntersectionObserver =
    typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';
  const activeStrategy =
    mode === 'observer' && supportsIntersectionObserver ? 'observer' : 'scroll';
  const items = useMemo(() => Array.from({ length: count }, (_, index) => index + 1), [count]);
  const hasMore = count < MAX_ITEMS;

  const loadNextBatch = useCallback(() => {
    const currentCount = countRef.current;
    if (currentCount >= MAX_ITEMS) return;

    const nextCount = Math.min(currentCount + BATCH_SIZE, MAX_ITEMS);
    countRef.current = nextCount;
    setCount(nextCount);
    setLoads((value) => value + 1);
  }, []);

  const registerItemNode = useCallback((id: number, node: HTMLElement | null) => {
    const previousNode = itemNodesRef.current.get(id);
    if (previousNode && previousNode !== node) {
      observerRef.current?.unobserve(previousNode);
    }

    if (node) {
      itemNodesRef.current.set(id, node);
      if (previousNode !== node) observerRef.current?.observe(node);
      return;
    }

    itemNodesRef.current.delete(id);
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    const sentinel = sentinelRef.current;
    const effectSession = session;
    if (!feed || !sentinel) return;

    if (activeStrategy === 'observer') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (sessionRef.current !== effectSession || observerRef.current !== observer) {
            return;
          }

          setCallbacks((value) => value + 1);
          setWorkUnits((value) => value + entries.length);

          const visibilityChanges = new Map<number, boolean>();
          const enteredIds: number[] = [];
          let shouldLoad = false;

          for (const entry of entries) {
            if (entry.target === sentinel) {
              shouldLoad ||= entry.isIntersecting;
              continue;
            }

            const id = Number((entry.target as HTMLElement).dataset.item);
            if (!id) continue;

            const isVisible =
              entry.isIntersecting && entry.intersectionRatio >= VISIBILITY_THRESHOLD;
            visibilityChanges.set(id, isVisible);
            if (isVisible) enteredIds.push(id);
          }

          if (visibilityChanges.size > 0) {
            setVisible((current) => {
              const next = new Set(current);
              let changed = false;

              visibilityChanges.forEach((isVisible, id) => {
                if (isVisible && !next.has(id)) {
                  next.add(id);
                  changed = true;
                }
                if (!isVisible && next.delete(id)) changed = true;
              });

              return changed ? next : current;
            });
          }

          if (enteredIds.length > 0) {
            setInitialized((current) => {
              const next = new Set(current);
              enteredIds.forEach((id) => next.add(id));
              return next.size === current.size ? current : next;
            });
          }

          if (shouldLoad) loadNextBatch();
        },
        {
          root: feed,
          rootMargin: '0px',
          threshold: [0, VISIBILITY_THRESHOLD],
        },
      );

      observerRef.current = observer;
      itemNodesRef.current.forEach((node) => observer.observe(node));
      observer.observe(sentinel);

      return () => {
        observer.disconnect();
        if (observerRef.current === observer) observerRef.current = null;
      };
    }

    const measureOnScroll = () => {
      if (sessionRef.current !== effectSession) return;

      const rootRect = feed.getBoundingClientRect();
      const nextVisible = new Set<number>();

      itemNodesRef.current.forEach((node, id) => {
        if (getIntersectionRatio(node.getBoundingClientRect(), rootRect) >= VISIBILITY_THRESHOLD) {
          nextVisible.add(id);
        }
      });

      const sentinelRect = sentinel.getBoundingClientRect();
      const sentinelVisible =
        sentinelRect.top <= rootRect.bottom && sentinelRect.bottom >= rootRect.top;

      setCallbacks((value) => value + 1);
      setWorkUnits((value) => value + itemNodesRef.current.size + 2);
      setVisible((current) => (setsAreEqual(current, nextVisible) ? current : nextVisible));
      setInitialized((current) => {
        const next = new Set(current);
        nextVisible.forEach((id) => next.add(id));
        return next.size === current.size ? current : next;
      });

      if (sentinelVisible) loadNextBatch();
    };

    scrollMeasureRef.current = measureOnScroll;
    feed.addEventListener('scroll', measureOnScroll, { passive: true });

    return () => {
      feed.removeEventListener('scroll', measureOnScroll);
      if (scrollMeasureRef.current === measureOnScroll) scrollMeasureRef.current = null;
    };
  }, [activeStrategy, loadNextBatch, session]);

  useEffect(() => {
    if (activeStrategy === 'observer') return;

    const measurementKey = `${activeStrategy}:${session}:${count}`;
    if (measuredKeyRef.current === measurementKey) return;

    measuredKeyRef.current = measurementKey;
    scrollMeasureRef.current?.();
  }, [activeStrategy, count, session]);

  const resetLab = (nextMode: Mode = mode) => {
    sessionRef.current += 1;
    countRef.current = INITIAL_ITEMS;
    feedRef.current?.scrollTo({ top: 0 });

    setMode(nextMode);
    setCount(INITIAL_ITEMS);
    setInitialized(new Set());
    setVisible(new Set());
    setCallbacks(0);
    setWorkUnits(0);
    setLoads(0);
    setSession(sessionRef.current);
  };

  const implementationLabel =
    activeStrategy === 'observer'
      ? 'IntersectionObserver'
      : mode === 'observer'
        ? 'scroll fallback'
        : 'scroll polling';

  const codeSample =
    activeStrategy === 'observer'
      ? `const observer = new IntersectionObserver(handleEntries, {
  root: feed,
  threshold: [0, 0.1],
});

cards.forEach(card => observer.observe(card));
observer.observe(sentinel);`
      : `feed.addEventListener('scroll', () => {
  const rootRect = feed.getBoundingClientRect();
  cards.forEach(card => {
    const cardRect = card.getBoundingClientRect();
    checkIntersection(cardRect, rootRect);
  });
});`;

  return (
    <div className="labStack">
      <InfoBlock
        problem="Ручной scroll-обработчик вынужден читать геометрию всех карточек при каждой прокрутке."
        api="IntersectionObserver сообщает только об изменениях пересечения целевых элементов с viewport контейнера."
        howItWorks="Оба режима отмечают видимые карточки, инициализируют их один раз и загружают порцию при появлении sentinel."
        whenToUse="Ленивая загрузка медиа, аналитика показов, бесконечные ленты и отложенные виджеты."
        impact="Observer сокращает ручные измерения DOM и переносит отслеживание пересечений на браузер."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={(nextMode) => resetLab(nextMode)}
            options={[
              {
                label: supportsIntersectionObserver
                  ? 'Оптимально: IntersectionObserver'
                  : 'IntersectionObserver: fallback',
                value: 'observer',
              },
              { label: 'Наивно: опрос при scroll', value: 'scroll' },
            ]}
          />
          <button onClick={() => resetLab()} type="button">
            Сбросить ленту
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Загружено элементов" value={count} />
          <Metric label="Инициализировано" value={initialized.size} />
          <Metric label="Сейчас во viewport" value={visible.size} />
          <Metric label="Вызовы обработчика" value={callbacks} />
          <Metric
            label={activeStrategy === 'observer' ? 'Обработано entries' : 'Чтения геометрии'}
            value={workUnits}
          />
          <Metric label="Загружено порций" value={loads} />
          <Metric label="Активная реализация" value={implementationLabel} />
        </div>
      </section>
      <section className="feed" ref={feedRef}>
        {items.map((item) => (
          <FeedCard
            id={item}
            initialized={initialized.has(item)}
            key={item}
            registerNode={registerItemNode}
            visible={visible.has(item)}
          />
        ))}
        <div className={hasMore ? 'sentinel' : 'sentinel complete'} ref={sentinelRef}>
          {hasMore ? 'Прокрутите сюда, чтобы загрузить ещё' : 'Все элементы загружены'}
        </div>
      </section>
      <pre className="codeSample">{codeSample}</pre>
    </div>
  );
}
