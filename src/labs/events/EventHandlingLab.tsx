import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Mode = 'delegated' | 'individual';

export function EventHandlingLab() {
  const [mode, setMode] = useState<Mode>('delegated');
  const [selected, setSelected] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  const addLog = (message: string) => setLog((items) => [message, ...items].slice(0, 40));

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const onClick = (event: Event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-cell]');
      if (!button) return;
      setSelected(Number(button.dataset.cell));
      addLog(`delegated bubble: cell ${button.dataset.cell}`);
    };
    const individualHandlers: Array<[HTMLButtonElement, EventListener]> = [];

    if (mode === 'delegated') {
      grid.addEventListener('click', onClick);
      return () => grid.removeEventListener('click', onClick);
    }

    grid.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach((button) => {
      const handler = () => {
        setSelected(Number(button.dataset.cell));
        addLog(`individual listener: cell ${button.dataset.cell}`);
      };
      button.addEventListener('click', handler);
      individualHandlers.push([button, handler]);
    });
    return () => individualHandlers.forEach(([button, handler]) => button.removeEventListener('click', handler));
  }, [mode]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const capture = (event: Event) => addLog(`capture: ${(event.currentTarget as HTMLElement).dataset.zone}`);
    const bubble = (event: Event) => addLog(`bubble: ${(event.currentTarget as HTMLElement).dataset.zone}`);
    outer.addEventListener('click', capture, { capture: true });
    inner.addEventListener('click', capture, { capture: true });
    outer.addEventListener('click', bubble);
    inner.addEventListener('click', bubble);
    return () => {
      outer.removeEventListener('click', capture, { capture: true });
      inner.removeEventListener('click', capture, { capture: true });
      outer.removeEventListener('click', bubble);
      inner.removeEventListener('click', bubble);
    };
  }, []);

  return (
    <div className="labStack">
      <InfoBlock
        problem="Large lists can create many listeners, and event flow is often misunderstood."
        api="DOM event propagation supports capturing, target, bubbling, cancellation, and delegation."
        howItWorks="Click cells and nested buttons to see listener strategy and propagation order."
        whenToUse="Tables, menus, trees, virtualized lists, links that need guarded navigation."
        impact="Delegation reduces listener churn and event logs make propagation bugs visible."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Delegation', value: 'delegated' },
              { label: 'Individual listeners', value: 'individual' },
            ]}
          />
          <a
            className="button"
            href="https://example.com"
            onClick={(event) => {
              event.preventDefault();
              addLog('preventDefault: navigation cancelled');
            }}
          >
            Test preventDefault
          </a>
        </div>
        <div className="metricsGrid">
          <Metric label="Active listeners" value={mode === 'delegated' ? 1 : 60} />
          <Metric label="Selected cell" value={selected || 'none'} />
          <Metric label="Log entries" value={log.length} />
        </div>
      </section>
      <section className="twoColumn">
        <div className="panel">
          <h3>Large interactive list</h3>
          <div className="eventGrid" ref={gridRef}>
            {Array.from({ length: 60 }, (_, index) => index + 1).map((cell) => (
              <button
                className={selected === cell ? 'eventCell selected' : 'eventCell'}
                data-cell={cell}
                key={cell}
                type="button"
              >
                {cell}
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Propagation playground</h3>
          <div className="eventPlaygroundOuter" data-zone="outer" ref={outerRef}>
            Outer
            <div className="eventPlaygroundInner" data-zone="inner" ref={innerRef}>
              Inner
              <button
                className="button"
                onClick={(event) => {
                  event.stopPropagation();
                  addLog('stopPropagation: target handled only by React handler');
                }}
                type="button"
              >
                Stop propagation
              </button>
            </div>
          </div>
        </div>
      </section>
      <pre className="log">{log.join('\n') || 'Click controls to see event order'}</pre>
    </div>
  );
}
