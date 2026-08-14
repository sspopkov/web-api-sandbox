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
      addLog(`делегирование, всплытие: ячейка ${button.dataset.cell}`);
    };
    const individualHandlers: Array<[HTMLButtonElement, EventListener]> = [];

    if (mode === 'delegated') {
      grid.addEventListener('click', onClick);
      return () => grid.removeEventListener('click', onClick);
    }

    grid.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach((button) => {
      const handler = () => {
        setSelected(Number(button.dataset.cell));
        addLog(`отдельный обработчик: ячейка ${button.dataset.cell}`);
      };
      button.addEventListener('click', handler);
      individualHandlers.push([button, handler]);
    });
    return () =>
      individualHandlers.forEach(([button, handler]) =>
        button.removeEventListener('click', handler),
      );
  }, [mode]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const capture = (event: Event) =>
      addLog(`перехват: ${(event.currentTarget as HTMLElement).dataset.zone}`);
    const bubble = (event: Event) =>
      addLog(`всплытие: ${(event.currentTarget as HTMLElement).dataset.zone}`);
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
        problem="Большие списки создают много обработчиков, а порядок распространения событий легко понять неверно."
        api="События DOM поддерживают перехват, целевую фазу, всплытие, отмену и делегирование."
        howItWorks="Нажимайте ячейки и вложенную кнопку, чтобы увидеть стратегию и порядок обработки."
        whenToUse="Таблицы, меню, деревья, виртуализированные списки и ссылки с проверкой перехода."
        impact="Делегирование сокращает число обработчиков, а журнал наглядно показывает ошибки распространения."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Делегирование', value: 'delegated' },
              { label: 'Отдельные обработчики', value: 'individual' },
            ]}
          />
          <a
            className="button"
            href="https://example.com"
            onClick={(event) => {
              event.preventDefault();
              addLog('preventDefault: переход отменён');
            }}
          >
            Проверить preventDefault
          </a>
        </div>
        <div className="metricsGrid">
          <Metric label="Активные обработчики" value={mode === 'delegated' ? 1 : 60} />
          <Metric label="Выбранная ячейка" value={selected || 'нет'} />
          <Metric label="Записи журнала" value={log.length} />
        </div>
      </section>
      <section className="twoColumn">
        <div className="panel">
          <h3>Большой интерактивный список</h3>
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
          <h3>Распространение события</h3>
          <div className="eventPlaygroundOuter" data-zone="внешний элемент" ref={outerRef}>
            Внешний элемент
            <div className="eventPlaygroundInner" data-zone="внутренний элемент" ref={innerRef}>
              Внутренний элемент
              <button
                className="button"
                onClick={(event) => {
                  event.stopPropagation();
                  addLog('stopPropagation: событие обработано только обработчиком React');
                }}
                type="button"
              >
                Остановить всплытие
              </button>
            </div>
          </div>
        </div>
      </section>
      <pre className="log">
        {log.join('\n') || 'Нажимайте элементы, чтобы увидеть порядок событий'}
      </pre>
    </div>
  );
}
