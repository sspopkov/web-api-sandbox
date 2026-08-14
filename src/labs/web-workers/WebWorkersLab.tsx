import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';
import { countPrimes } from '../../utils/math';

type Mode = 'main' | 'worker';

export function WebWorkersLab() {
  const [mode, setMode] = useState<Mode>('worker');
  const [limit, setLimit] = useState(230000);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState('not run');
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => workerRef.current?.terminate();
  }, []);

  const run = () => {
    setStatus('running');
    setResult('calculating...');
    if (mode === 'main') {
      const start = performance.now();
      const count = countPrimes(limit);
      setResult(`${count} primes in ${Math.round(performance.now() - start)}ms`);
      setStatus('done');
      return;
    }

    workerRef.current?.terminate();
    const worker = new Worker(new URL('../../workers/primeWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ count: number; duration: number }>) => {
      setResult(`${event.data.count} primes in ${Math.round(event.data.duration)}ms`);
      setStatus('done');
      worker.terminate();
      workerRef.current = null;
    };
    worker.onerror = () => {
      setStatus('error');
      setResult('worker failed');
    };
    worker.postMessage({ limit });
  };

  return (
    <div className="labStack">
      <InfoBlock
        problem="CPU-heavy JavaScript blocks input, animation, and rendering on the main thread."
        api="Web Workers execute scripts on a background thread and communicate by messages."
        howItWorks="Both modes count primes. The moving dot keeps animating only when the main thread is free."
        whenToUse="Parsing, compression, search indexing, image/data processing, expensive calculations."
        impact="Keeps the interface responsive while non-UI computation continues."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Optimized: worker', value: 'worker' },
              { label: 'Main thread', value: 'main' },
            ]}
          />
          <label>
            Limit{' '}
            <input
              max={400000}
              min={50000}
              onChange={(event) => setLimit(Number(event.target.value))}
              step={10000}
              type="range"
              value={limit}
            />
          </label>
          <button className="primary" onClick={run} type="button">
            Run calculation
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Limit" value={limit} />
          <Metric label="Worker state" value={status} />
          <Metric label="Result" value={result} />
        </div>
      </section>
      <section className="pulseStage">
        <div className="pulseDot" />
      </section>
    </div>
  );
}
