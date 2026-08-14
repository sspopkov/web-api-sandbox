import { useEffect, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';

export function PerformanceApiLab() {
  const [duration, setDuration] = useState(0);
  const [marks, setMarks] = useState<string[]>([]);
  const [observerCount, setObserverCount] = useState(0);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;
    const observer = new PerformanceObserver((list) => {
      setObserverCount((value) => value + list.getEntries().length);
    });
    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);

  const runMeasuredWork = () => {
    performance.clearMarks();
    performance.clearMeasures();
    performance.mark('sandbox-operation-start');
    const start = performance.now();
    const data = Array.from({ length: 90000 }, (_, index) => Math.sin(index) * Math.random());
    data.sort((a, b) => a - b);
    const nowDuration = performance.now() - start;
    performance.mark('sandbox-operation-end');
    performance.measure(
      'sandbox-sort-operation',
      'sandbox-operation-start',
      'sandbox-operation-end',
    );
    setDuration(nowDuration);
    setMarks(
      performance
        .getEntriesByType('mark')
        .map((entry) => `${entry.name}: ${entry.startTime.toFixed(2)}ms`),
    );
  };

  return (
    <div className="labStack">
      <InfoBlock
        problem="Измерение через Date недостаточно точное, а ручные замеры трудно анализировать в DevTools."
        api="performance.now, mark, measure и PerformanceObserver дают высокоточную временную шкалу."
        howItWorks="Запустите сортировку и изучите созданные временные метки и измерения."
        whenToUse="Профилирование сценариев, пользовательские метрики, дорогие операции и запуск приложения."
        impact="Даёт точные измерения, которые можно сопоставить с записью производительности в DevTools."
      />
      <section className="panel">
        <div className="controls">
          <button className="primary" onClick={runMeasuredWork} type="button">
            Запустить измеряемую операцию
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Длительность по performance.now" value={`${duration.toFixed(2)} мс`} />
          <Metric label="Получено измерений" value={observerCount} />
        </div>
      </section>
      <pre className="log">{marks.join('\n') || 'Запустите операцию, чтобы создать метки'}</pre>
    </div>
  );
}
