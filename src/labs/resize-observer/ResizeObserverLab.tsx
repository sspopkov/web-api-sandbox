import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Mode = 'window' | 'observer';

export function ResizeObserverLab() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<Mode>('observer');
  const [width, setWidth] = useState(420);
  const [callbacks, setCallbacks] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    setCallbacks(0);
    const readSize = () => {
      setWidth(Math.round(box.getBoundingClientRect().width));
      setCallbacks((value) => value + 1);
    };

    readSize();
    if (mode === 'observer' && 'ResizeObserver' in window) {
      const observer = new ResizeObserver(readSize);
      observer.observe(box);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', readSize);
    return () => window.removeEventListener('resize', readSize);
  }, [mode]);

  const density = width < 360 ? 'compact' : 'roomy';

  return (
    <div className="labStack">
      <InfoBlock
        problem="Components often need to react to their own container size, not the whole viewport."
        api="ResizeObserver reports element box changes after layout."
        howItWorks="Drag the handle on the box. The observer reacts even when window.resize does not fire."
        whenToUse="Resizable panels, cards inside grids, editors, charts, and embedded widgets."
        impact="Avoids global resize bookkeeping and makes component-level adaptive UI more accurate."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Optimized: ResizeObserver', value: 'observer' },
              { label: 'Naive: window.resize', value: 'window' },
            ]}
          />
        </div>
        <div className="metricsGrid">
          <Metric label="Element width" value={`${width}px`} />
          <Metric label="Callbacks" value={callbacks} />
          <Metric label="Layout mode" value={density} />
        </div>
      </section>
      <section className="resizableBox" ref={boxRef}>
        <h3>Resizable analytics widget</h3>
        <p className="note">Use the browser resize handle in the lower-right corner.</p>
        <div className={`adaptiveGrid ${density}`}>
          {['Revenue', 'Latency', 'Errors'].map((item) => (
            <div className="miniCard" key={item}>
              <strong>{item}</strong>
              <p className="note">{density === 'compact' ? 'Stacked view' : 'Multi-column view'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
