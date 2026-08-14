import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Mode = 'passive' | 'blocking';

export function PassiveListenersLab() {
  const [mode, setMode] = useState<Mode>('passive');
  const [events, setEvents] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const onWheel = (event: WheelEvent) => {
      setEvents((value) => value + 1);
      if (mode === 'blocking') {
        event.preventDefault();
        const start = performance.now();
        let sink = 0;
        while (performance.now() - start < 14) {
          sink += Math.random();
        }
        if (sink < 0) event.stopImmediatePropagation();
        setBlocked((value) => value + 1);
      }
    };
    box.addEventListener('wheel', onWheel, { passive: mode === 'passive' });
    return () => box.removeEventListener('wheel', onWheel);
  }, [mode]);

  return (
    <div className="labStack">
      <InfoBlock
        problem="Браузер может ждать обработчик wheel или touch, прежде чем поймёт, разрешена ли прокрутка."
        api="addEventListener(type, handler, { passive: true }) гарантирует, что preventDefault не будет вызван."
        howItWorks="Прокрутите блок. Блокирующий режим намеренно вызывает preventDefault и нагружает CPU."
        whenToUse="Обработчики scroll, wheel, touchstart и touchmove, которые только наблюдают за вводом."
        impact="Пассивные обработчики позволяют браузеру плавно прокручивать страницу, не ожидая JavaScript."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Пассивный', value: 'passive' },
              { label: 'Блокирующий', value: 'blocking' },
            ]}
          />
          <button
            onClick={() => {
              setEvents(0);
              setBlocked(0);
            }}
            type="button"
          >
            Сбросить метрики
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="События wheel" value={events} />
          <Metric label="Заблокировано" value={blocked} />
          <Metric
            label="Параметр обработчика"
            value={mode === 'passive' ? 'passive: true' : 'passive: false'}
          />
        </div>
      </section>
      <section className="scrollBox" ref={boxRef}>
        {Array.from({ length: 30 }, (_, index) => (
          <div className="scrollRow" key={index}>
            Строка прокрутки {index + 1}
          </div>
        ))}
      </section>
    </div>
  );
}
