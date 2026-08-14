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
    label: `Подготовка поисковой подсказки ${index + 1}`,
  }));

export function RequestIdleCallbackLab() {
  const [pending, setPending] = useState<IdleTask[]>(() => createTasks());
  const [active, setActive] = useState('ожидание');
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
        setActive('завершено');
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
        problem="Некоторые задачи полезны, но не должны конкурировать с первой отрисовкой и вводом пользователя."
        api="requestIdleCallback планирует несрочные задачи на периоды простоя и использует fallback по таймеру."
        howItWorks="Запустите очередь и взаимодействуйте со страницей, пока короткие задачи выполняются порциями."
        whenToUse="Прогрев кеша, подготовка подсказок, некритичная аналитика и очистка после рендера."
        impact="Уменьшает заметные задержки, но не подходит для срочных или критически важных операций."
      />
      <section className="panel">
        <div className="controls">
          <button className="primary" onClick={schedule} type="button">
            Запустить фоновую очередь
          </button>
          <button
            onClick={() => {
              setPending(createTasks());
              pendingRef.current = createTasks();
              setDone([]);
              setActive('ожидание');
            }}
            type="button"
          >
            Сбросить
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Ожидают" value={pending.length} />
          <Metric label="Текущая задача" value={active} />
          <Metric label="Завершено" value={done.length} />
        </div>
      </section>
      <pre className="log">
        {done.map((item) => `готово: ${item}`).join('\n') || 'Задачи ещё не выполнялись'}
      </pre>
    </div>
  );
}
