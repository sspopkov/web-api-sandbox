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
    performance.measure('sandbox-sort-operation', 'sandbox-operation-start', 'sandbox-operation-end');
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
        problem="Date-based timing is imprecise and manual timings are hard to inspect in DevTools."
        api="performance.now, mark, measure, and PerformanceObserver expose high-resolution timings."
        howItWorks="Run a sort operation and inspect the generated marks and measures."
        whenToUse="Profiling user flows, custom metrics, expensive operations, app startup milestones."
        impact="Gives accurate instrumentation that can be correlated with DevTools performance traces."
      />
      <section className="panel">
        <div className="controls">
          <button className="primary" onClick={runMeasuredWork} type="button">
            Run measured operation
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="performance.now duration" value={`${duration.toFixed(2)}ms`} />
          <Metric label="Observed measures" value={observerCount} />
        </div>
      </section>
      <pre className="log">{marks.join('\n') || 'Run the operation to create marks'}</pre>
    </div>
  );
}
