import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';

type IdleTask = {
  id: number;
  label: string;
};

type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

const createTasks = () =>
  Array.from({ length: 24 }, (_, index) => ({
    id: index + 1,
    label: `Precompute search hint ${index + 1}`,
  }));

export function RequestIdleCallbackLab() {
  const [pending, setPending] = useState<IdleTask[]>(() => createTasks());
  const [active, setActive] = useState('idle');
  const [done, setDone] = useState<string[]>([]);
  const requestId = useRef<number | null>(null);
  const pendingRef = useRef<IdleTask[]>(pending);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    return () => {
      if (requestId.current === null) return;
      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(requestId.current);
      } else {
        globalThis.clearTimeout(requestId.current);
      }
    };
  }, []);

  const schedule = () => {
    const runChunk = (deadline: IdleDeadlineLike) => {
      const completed: string[] = [];
      while (
        pendingRef.current.length > 0 &&
        (deadline.timeRemaining() > 6 || deadline.didTimeout)
      ) {
        const task = pendingRef.current[0];
        setActive(task.label);
        const start = performance.now();
        let sink = 0;
        while (performance.now() - start < 5) {
          sink += Math.sqrt(start + sink);
        }
        pendingRef.current = pendingRef.current.slice(1);
        completed.push(task.label);
      }
      if (completed.length > 0) {
        setPending(pendingRef.current);
        setDone((items) => [...completed, ...items].slice(0, 30));
      }
      if (pendingRef.current.length > 0) {
        requestId.current =
          'requestIdleCallback' in window
            ? window.requestIdleCallback(runChunk, { timeout: 1200 })
            : globalThis.setTimeout(
                () => runChunk({ didTimeout: true, timeRemaining: () => 0 }),
                16,
              );
      } else {
        setActive('complete');
      }
    };

    requestId.current =
      'requestIdleCallback' in window
        ? window.requestIdleCallback(runChunk, { timeout: 1200 })
        : globalThis.setTimeout(() => runChunk({ didTimeout: true, timeRemaining: () => 0 }), 16);
  };

  return (
    <div className="labStack">
      <InfoBlock
        problem="Some work is useful but should not compete with first paint or direct input."
        api="requestIdleCallback schedules non-urgent tasks during idle periods, with a timeout fallback."
        howItWorks="Start the queue and interact with the page while small tasks are processed in chunks."
        whenToUse="Warm caches, precompute suggestions, non-critical analytics, cleanup after rendering."
        impact="Reduces user-visible jank, but it is unsuitable for urgent or correctness-critical work."
      />
      <section className="panel">
        <div className="controls">
          <button className="primary" onClick={schedule} type="button">
            Start background queue
          </button>
          <button
            onClick={() => {
              setPending(createTasks());
              pendingRef.current = createTasks();
              setDone([]);
              setActive('idle');
            }}
            type="button"
          >
            Reset
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Pending tasks" value={pending.length} />
          <Metric label="Current task" value={active} />
          <Metric label="Completed" value={done.length} />
        </div>
      </section>
      <pre className="log">{done.map((item) => `done: ${item}`).join('\n') || 'No tasks yet'}</pre>
    </div>
  );
}
