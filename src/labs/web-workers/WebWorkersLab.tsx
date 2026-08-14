import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';
import { countPrimes } from '../../utils/math';

type Mode = 'main' | 'worker';

export function WebWorkersLab() {
  const [mode, setMode] = useState<Mode>('worker');
  const [limit, setLimit] = useState(230000);
  const [status, setStatus] = useState('ожидание');
  const [result, setResult] = useState('не запускалось');
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => workerRef.current?.terminate();
  }, []);

  const run = () => {
    setStatus('выполняется');
    setResult('вычисление...');
    if (mode === 'main') {
      const start = performance.now();
      const count = countPrimes(limit);
      setResult(`${count} простых чисел за ${Math.round(performance.now() - start)} мс`);
      setStatus('готово');
      return;
    }

    workerRef.current?.terminate();
    const worker = new Worker(new URL('../../workers/primeWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ count: number; duration: number }>) => {
      setResult(`${event.data.count} простых чисел за ${Math.round(event.data.duration)} мс`);
      setStatus('готово');
      worker.terminate();
      workerRef.current = null;
    };
    worker.onerror = () => {
      setStatus('ошибка');
      setResult('воркер завершился с ошибкой');
    };
    worker.postMessage({ limit });
  };

  return (
    <div className="labStack">
      <InfoBlock
        problem="Ресурсоёмкий JavaScript блокирует ввод, анимацию и рендеринг в основном потоке."
        api="Web Workers выполняют код в фоновом потоке и обмениваются данными через сообщения."
        howItWorks="Оба режима считают простые числа. Движение точки показывает, свободен ли основной поток."
        whenToUse="Парсинг, сжатие, поисковая индексация, обработка изображений и сложные вычисления."
        impact="Интерфейс остаётся отзывчивым, пока вычисления, не связанные с UI, продолжаются."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Оптимально: Web Worker', value: 'worker' },
              { label: 'Основной поток', value: 'main' },
            ]}
          />
          <label>
            Предел{' '}
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
            Запустить вычисление
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Предел" value={limit} />
          <Metric label="Состояние" value={status} />
          <Metric label="Результат" value={result} />
        </div>
      </section>
      <section className="pulseStage">
        <div className="pulseDot" />
      </section>
    </div>
  );
}
