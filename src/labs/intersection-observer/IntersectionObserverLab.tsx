import { useEffect, useMemo, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Mode = 'observer' | 'scroll';

export function IntersectionObserverLab() {
  const [mode, setMode] = useState<Mode>('observer');
  const [count, setCount] = useState(16);
  const [visible, setVisible] = useState<Set<number>>(() => new Set());
  const [callbacks, setCallbacks] = useState(0);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<number, HTMLElement>());
  const items = useMemo(() => Array.from({ length: count }, (_, index) => index + 1), [count]);

  useEffect(() => {
    setCallbacks(0);
    setVisible(new Set());
    const feed = feedRef.current;
    const sentinel = sentinelRef.current;
    if (!feed || !sentinel) return;

    if (mode === 'observer' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          setCallbacks((value) => value + 1);
          setVisible((current) => {
            const next = new Set(current);
            for (const entry of entries) {
              const id = Number((entry.target as HTMLElement).dataset.item);
              if (entry.isIntersecting && id) next.add(id);
              if (entry.isIntersecting && entry.target === sentinel) {
                setCount((value) => Math.min(value + 8, 80));
              }
            }
            return next;
          });
        },
        { root: feed, rootMargin: '80px', threshold: 0.1 },
      );
      itemRefs.current.forEach((node) => observer.observe(node));
      observer.observe(sentinel);
      return () => observer.disconnect();
    }

    const onScroll = () => {
      setCallbacks((value) => value + 1);
      const feedRect = feed.getBoundingClientRect();
      const next = new Set<number>();
      itemRefs.current.forEach((node, id) => {
        const rect = node.getBoundingClientRect();
        if (rect.bottom >= feedRect.top && rect.top <= feedRect.bottom) next.add(id);
      });
      setVisible(next);
      if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 80) {
        setCount((value) => Math.min(value + 8, 80));
      }
    };
    feed.addEventListener('scroll', onScroll);
    onScroll();
    return () => feed.removeEventListener('scroll', onScroll);
  }, [mode, count]);

  return (
    <div className="labStack">
      <InfoBlock
        problem="Обработчики scroll часто проверяют положение множества элементов при каждом событии прокрутки."
        api="IntersectionObserver сообщает, когда целевые элементы пересекают заданные границы viewport."
        howItWorks="Карточки инициализируются при появлении, а служебный элемент загружает следующую порцию."
        whenToUse="Ленивая загрузка медиа, аналитика показов, бесконечные ленты и отложенные виджеты."
        impact="Меньше ручных расчётов геометрии и срочных scroll-callback в основном потоке."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Оптимально: observer', value: 'observer' },
              { label: 'Наивно: опрос при scroll', value: 'scroll' },
            ]}
          />
          <button onClick={() => setCount(16)} type="button">
            Сбросить ленту
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Загружено элементов" value={count} />
          <Metric label="Инициализировано" value={visible.size} />
          <Metric label="Вызовы callback" value={callbacks} />
        </div>
      </section>
      <section className="feed" ref={feedRef}>
        {items.map((item) => (
          <article
            className={visible.has(item) ? 'feedCard ready' : 'feedCard'}
            data-item={item}
            key={item}
            ref={(node) => {
              if (node) itemRefs.current.set(item, node);
              else itemRefs.current.delete(item);
            }}
          >
            <strong>Карточка {item}</strong>
            <p className="note">
              {visible.has(item)
                ? 'Ленивый контент инициализирован.'
                : 'Ожидает появления во viewport.'}
            </p>
          </article>
        ))}
        <div className="sentinel" ref={sentinelRef}>
          Прокрутите сюда, чтобы загрузить ещё
        </div>
      </section>
    </div>
  );
}
