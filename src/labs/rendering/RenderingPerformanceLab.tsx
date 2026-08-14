import { useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Scenario = 'long-task' | 'dom-updates' | 'thrashing' | 'batched';

export function RenderingPerformanceLab() {
  const [scenario, setScenario] = useState<Scenario>('thrashing');
  const [duration, setDuration] = useState(0);
  const [operations, setOperations] = useState(0);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const ensureBoxes = () => {
    const area = areaRef.current;
    if (!area) return [];
    if (area.children.length === 0) {
      for (let index = 0; index < 240; index += 1) {
        const box = document.createElement('div');
        box.className = 'renderBox';
        area.append(box);
      }
    }
    return Array.from(area.children) as HTMLElement[];
  };

  const run = () => {
    const boxes = ensureBoxes();
    const start = performance.now();
    let ops = 0;

    if (scenario === 'long-task') {
      let sink = 0;
      while (performance.now() - start < 180) {
        sink += Math.sqrt(ops + sink);
        ops += 1;
      }
    }

    if (scenario === 'dom-updates') {
      boxes.forEach((box, index) => {
        box.textContent = String(index);
        box.style.backgroundColor = index % 2 ? '#34d399' : '#60a5fa';
        ops += 1;
      });
    }

    if (scenario === 'thrashing') {
      boxes.forEach((box, index) => {
        box.style.width = `${18 + (index % 20)}px`;
        ops += box.offsetWidth;
      });
    }

    if (scenario === 'batched') {
      const widths = boxes.map((box) => box.offsetWidth);
      boxes.forEach((box, index) => {
        box.style.width = `${18 + (widths[index] % 20)}px`;
        ops += 1;
      });
    }

    setOperations(ops);
    setDuration(performance.now() - start);
  };

  return (
    <div className="labStack">
      <InfoBlock
        problem="Main-thread rendering can stall when scripts run too long or repeatedly force layout."
        api="The rendering pipeline rewards short tasks and grouped DOM reads/writes."
        howItWorks="Run scenarios, then inspect the page in DevTools Performance to compare scripting and layout."
        whenToUse="Dashboards, editors, large tables, drag/resize tools, animation-heavy interfaces."
        impact="Batching work reduces layout recalculation and keeps frames available for input and paint."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={scenario}
            onChange={setScenario}
            options={[
              { label: 'Long task', value: 'long-task' },
              { label: 'DOM updates', value: 'dom-updates' },
              { label: 'Thrashing', value: 'thrashing' },
              { label: 'Batched', value: 'batched' },
            ]}
          />
          <button className="primary" onClick={run} type="button">
            Run scenario
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Duration" value={`${duration.toFixed(2)}ms`} />
          <Metric label="Operations" value={operations} />
        </div>
      </section>
      <section className="renderArea" ref={areaRef} />
      <pre className="codeSample">{`Bad:
element.style.width = nextWidth;
element.offsetWidth;

Better:
const widths = elements.map(el => el.offsetWidth);
elements.forEach((el, index) => {
  el.style.width = nextWidth(widths[index]);
});`}</pre>
    </div>
  );
}
