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
        problem="The browser may need to wait for wheel/touch listeners before it knows scrolling is allowed."
        api="addEventListener(type, handler, { passive: true }) promises not to call preventDefault."
        howItWorks="Scroll the box. Blocking mode intentionally calls preventDefault and burns CPU."
        whenToUse="Scroll, wheel, touchstart, and touchmove listeners that only observe input."
        impact="Passive listeners let the browser keep scrolling smooth without waiting on JavaScript."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Passive', value: 'passive' },
              { label: 'Blocking', value: 'blocking' },
            ]}
          />
          <button
            onClick={() => {
              setEvents(0);
              setBlocked(0);
            }}
            type="button"
          >
            Reset metrics
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Wheel events" value={events} />
          <Metric label="Blocked events" value={blocked} />
          <Metric label="Listener option" value={mode === 'passive' ? 'passive: true' : 'passive: false'} />
        </div>
      </section>
      <section className="scrollBox" ref={boxRef}>
        {Array.from({ length: 30 }, (_, index) => (
          <div className="scrollRow" key={index}>
            Scroll row {index + 1}
          </div>
        ))}
      </section>
    </div>
  );
}
