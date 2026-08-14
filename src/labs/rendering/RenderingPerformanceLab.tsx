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
        problem="Рендеринг останавливается, когда скрипты надолго занимают основной поток или вызывают лишний layout."
        api="Конвейер рендеринга эффективнее работает с короткими задачами и сгруппированными операциями DOM."
        howItWorks="Запускайте сценарии и сравнивайте выполнение скриптов и layout в DevTools Performance."
        whenToUse="Панели мониторинга, редакторы, большие таблицы, drag-and-drop и сложные анимации."
        impact="Пакетная обработка сокращает перерасчёты layout и оставляет кадры для ввода и отрисовки."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={scenario}
            onChange={setScenario}
            options={[
              { label: 'Долгая задача', value: 'long-task' },
              { label: 'Обновления DOM', value: 'dom-updates' },
              { label: 'Layout thrashing', value: 'thrashing' },
              { label: 'Пакетно', value: 'batched' },
            ]}
          />
          <button className="primary" onClick={run} type="button">
            Запустить сценарий
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Длительность" value={`${duration.toFixed(2)} мс`} />
          <Metric label="Операции" value={operations} />
        </div>
      </section>
      <section className="renderArea" ref={areaRef} />
      <pre className="codeSample">{`Плохо:
element.style.width = nextWidth;
element.offsetWidth;

Лучше:
const widths = elements.map(el => el.offsetWidth);
elements.forEach((el, index) => {
  el.style.width = nextWidth(widths[index]);
});`}</pre>
    </div>
  );
}
