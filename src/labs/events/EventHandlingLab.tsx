import { useCallback, useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type ListenerMode = 'delegated' | 'individual';
type FlowPhase = 'capture' | 'target' | 'bubble';

type FlowEntry = {
  step: number;
  phase: FlowPhase;
  node: string;
  detail: string;
};

const INITIAL_ITEM_COUNT = 48;
const ITEMS_PER_BATCH = 12;
const MAX_ITEM_COUNT = 96;

function findCellButton(event: Event, grid: HTMLElement) {
  if (!(event.target instanceof Element)) return null;

  const button = event.target.closest<HTMLButtonElement>('[data-cell]');
  return button && grid.contains(button) ? button : null;
}

export function EventHandlingLab() {
  const [listenerMode, setListenerMode] = useState<ListenerMode>('delegated');
  const [itemCount, setItemCount] = useState(INITIAL_ITEM_COUNT);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [handledClicks, setHandledClicks] = useState(0);
  const [strategyLog, setStrategyLog] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [stopAtTarget, setStopAtTarget] = useState(false);
  const [flow, setFlow] = useState<FlowEntry[]>([]);
  const flowStepRef = useRef(0);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLButtonElement | null>(null);

  const [preventDefaultEnabled, setPreventDefaultEnabled] = useState(true);
  const [defaultActionStatus, setDefaultActionStatus] = useState('Ссылка ещё не нажата.');
  const [parentObservation, setParentObservation] = useState('Родитель ещё не получал click.');
  const [defaultClicks, setDefaultClicks] = useState(0);
  const [defaultBubbleCount, setDefaultBubbleCount] = useState(0);
  const [currentHash, setCurrentHash] = useState('(пусто)');
  const defaultDemoRef = useRef<HTMLDivElement | null>(null);
  const defaultLinkRef = useRef<HTMLAnchorElement | null>(null);

  const recordStrategyClick = useCallback((cell: number, source: string) => {
    setSelectedCell(cell);
    setHandledClicks((count) => count + 1);
    setStrategyLog((entries) => [...entries, `${source}: обработан элемент ${cell}`].slice(-6));
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    if (listenerMode === 'delegated') {
      const handleGridClick = (event: MouseEvent) => {
        const button = findCellButton(event, grid);
        if (!button) return;

        recordStrategyClick(Number(button.dataset.cell), 'Обработчик контейнера');
      };

      grid.addEventListener('click', handleGridClick);
      return () => grid.removeEventListener('click', handleGridClick);
    }

    const subscriptions = Array.from(
      grid.querySelectorAll<HTMLButtonElement>('[data-cell]'),
      (button) => {
        const handleButtonClick = () => {
          recordStrategyClick(Number(button.dataset.cell), 'Обработчик кнопки');
        };

        button.addEventListener('click', handleButtonClick);
        return { button, handleButtonClick };
      },
    );

    return () => {
      subscriptions.forEach(({ button, handleButtonClick }) => {
        button.removeEventListener('click', handleButtonClick);
      });
    };
  }, [itemCount, listenerMode, recordStrategyClick]);

  const resetStrategyDiagnostics = () => {
    setSelectedCell(null);
    setHandledClicks(0);
    setStrategyLog([]);
  };

  const changeListenerMode = (mode: ListenerMode) => {
    setListenerMode(mode);
    resetStrategyDiagnostics();
  };

  const addItems = () => {
    const nextCount = Math.min(itemCount + ITEMS_PER_BATCH, MAX_ITEM_COUNT);
    setItemCount(nextCount);
    setSelectedCell(null);
    setStrategyLog((entries) =>
      [...entries, `Добавлено ${nextCount - itemCount} новых элементов`].slice(-6),
    );
  };

  const resetItems = () => {
    setItemCount(INITIAL_ITEM_COUNT);
    resetStrategyDiagnostics();
  };

  const beginFlow = useCallback((entry: Omit<FlowEntry, 'step'>) => {
    flowStepRef.current = 1;
    setFlow([{ step: 1, ...entry }]);
  }, []);

  const appendFlow = useCallback((entry: Omit<FlowEntry, 'step'>) => {
    const step = flowStepRef.current + 1;
    flowStepRef.current = step;
    setFlow((entries) => [...entries, { step, ...entry }]);
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const target = targetRef.current;
    if (!outer || !inner || !target) return;

    const isTargetClick = (event: MouseEvent) => event.target === target;

    const handleOuterCapture = (event: MouseEvent) => {
      if (!isTargetClick(event)) return;
      beginFlow({
        phase: 'capture',
        node: 'Внешний контейнер',
        detail: 'Первым сработал listener с capture: true.',
      });
    };
    const handleInnerCapture = (event: MouseEvent) => {
      if (!isTargetClick(event)) return;
      appendFlow({
        phase: 'capture',
        node: 'Внутренний контейнер',
        detail: 'Событие движется к целевому элементу.',
      });
    };
    const handleTargetClick = (event: MouseEvent) => {
      appendFlow({
        phase: 'target',
        node: 'Кнопка-цель',
        detail: stopAtTarget
          ? 'Вызван stopPropagation(): дальнейшее движение остановлено.'
          : 'Целевой listener завершён без остановки события.',
      });

      if (stopAtTarget) event.stopPropagation();
    };
    const handleInnerBubble = (event: MouseEvent) => {
      if (!isTargetClick(event)) return;
      appendFlow({
        phase: 'bubble',
        node: 'Внутренний контейнер',
        detail: 'Событие всплывает от цели к предкам.',
      });
    };
    const handleOuterBubble = (event: MouseEvent) => {
      if (!isTargetClick(event)) return;
      appendFlow({
        phase: 'bubble',
        node: 'Внешний контейнер',
        detail: 'Последний listener в этом дереве.',
      });
    };

    outer.addEventListener('click', handleOuterCapture, true);
    inner.addEventListener('click', handleInnerCapture, true);
    target.addEventListener('click', handleTargetClick);
    inner.addEventListener('click', handleInnerBubble);
    outer.addEventListener('click', handleOuterBubble);

    return () => {
      outer.removeEventListener('click', handleOuterCapture, true);
      inner.removeEventListener('click', handleInnerCapture, true);
      target.removeEventListener('click', handleTargetClick);
      inner.removeEventListener('click', handleInnerBubble);
      outer.removeEventListener('click', handleOuterBubble);
    };
  }, [appendFlow, beginFlow, stopAtTarget]);

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash || '(пусто)');
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    const wrapper = defaultDemoRef.current;
    const link = defaultLinkRef.current;
    if (!wrapper || !link) return;

    const handleLinkClick = (event: MouseEvent) => {
      if (preventDefaultEnabled) event.preventDefault();

      setDefaultClicks((count) => count + 1);
      setDefaultActionStatus(
        event.defaultPrevented
          ? 'Действие ссылки отменено: адрес и прокрутка не изменятся.'
          : 'Действие разрешено: браузер перейдёт к элементу из href.',
      );
    };
    const handleParentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || !link.contains(event.target)) return;

      setDefaultBubbleCount((count) => count + 1);
      setParentObservation(
        `Родитель получил click: defaultPrevented = ${String(event.defaultPrevented)}.`,
      );
    };

    link.addEventListener('click', handleLinkClick);
    wrapper.addEventListener('click', handleParentClick);
    return () => {
      link.removeEventListener('click', handleLinkClick);
      wrapper.removeEventListener('click', handleParentClick);
    };
  }, [preventDefaultEnabled]);

  const clearHash = () => {
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
    setCurrentHash('(пусто)');
  };

  return (
    <div className="labStack">
      <InfoBlock
        problem="В больших динамических списках легко создать сотни обработчиков, а смешение фаз DOM-события часто приводит к ошибкам в stopPropagation и preventDefault."
        api="Нативная модель событий DOM включает перехват, целевую фазу, всплытие, делегирование и управление стандартным действием браузера."
        howItWorks="Три независимых эксперимента показывают стратегию подписки, точный путь одного click и отличие preventDefault от stopPropagation."
        whenToUse="Таблицы, меню, динамические списки, вложенные интерактивные области, ссылки и формы с проверкой перед стандартным действием."
        impact="Делегирование уменьшает число подписок и автоматически охватывает новые элементы. Понимание фаз делает сложные взаимодействия предсказуемыми."
      />

      <section className="panel" aria-labelledby="listener-strategy-heading">
        <div className="eventSectionHeader">
          <div>
            <span>Эксперимент 1</span>
            <h3 id="listener-strategy-heading">Отдельные listeners и делегирование</h3>
          </div>
          <p>
            Выберите стратегию, нажимайте элементы и добавьте новую порцию. Сравните число активных
            обработчиков.
          </p>
        </div>

        <div className="controls">
          <ModeToggle
            value={listenerMode}
            onChange={changeListenerMode}
            options={[
              { label: 'Делегирование', value: 'delegated' },
              { label: 'Listener на каждом', value: 'individual' },
            ]}
          />
          <button disabled={itemCount === MAX_ITEM_COUNT} onClick={addItems} type="button">
            Добавить {ITEMS_PER_BATCH} элементов
          </button>
          <button onClick={resetItems} type="button">
            Сбросить список
          </button>
        </div>

        <div className={`eventStrategyStatus ${listenerMode}`}>
          <strong>
            {listenerMode === 'delegated'
              ? 'Один listener установлен на общем контейнере.'
              : 'Каждая кнопка получила собственный listener.'}
          </strong>
          <span>
            {listenerMode === 'delegated'
              ? 'Click всплывает до контейнера, а target.closest() определяет нужную кнопку. Новые элементы работают без отдельной подписки.'
              : 'После добавления элементов effect очищает старые подписки и подключает listeners ко всем кнопкам заново.'}
          </span>
        </div>

        <div className="metricsGrid">
          <Metric label="Элементы" value={itemCount} />
          <Metric
            label="Активные click listeners"
            value={listenerMode === 'delegated' ? 1 : itemCount}
          />
          <Metric label="Обработано кликов" value={handledClicks} />
          <Metric label="Выбран элемент" value={selectedCell ?? 'нет'} />
        </div>

        <div className="eventStrategyLayout">
          <div>
            <h4>Динамический список</h4>
            <div className="eventGrid" ref={gridRef}>
              {Array.from({ length: itemCount }, (_, index) => index + 1).map((cell) => (
                <button
                  aria-pressed={selectedCell === cell}
                  className={selectedCell === cell ? 'eventCell selected' : 'eventCell'}
                  data-cell={cell}
                  key={cell}
                  title={cell > INITIAL_ITEM_COUNT ? 'Добавленный элемент' : undefined}
                  type="button"
                >
                  {cell}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4>Журнал стратегии</h4>
            {strategyLog.length > 0 ? (
              <ol className="eventSimpleLog" aria-live="polite">
                {strategyLog.map((entry, index) => (
                  <li key={`${entry}-${index}`}>{entry}</li>
                ))}
              </ol>
            ) : (
              <p className="eventEmptyState">Нажмите любой элемент списка.</p>
            )}
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="propagation-heading">
        <div className="eventSectionHeader">
          <div>
            <span>Эксперимент 2</span>
            <h3 id="propagation-heading">Путь события: capture → target → bubble</h3>
          </div>
          <p>Все пять обработчиков нативные. Журнал строится в фактическом порядке вызовов.</p>
        </div>

        <label className="eventOption">
          <input
            checked={stopAtTarget}
            onChange={(event) => {
              setStopAtTarget(event.target.checked);
              setFlow([]);
            }}
            type="checkbox"
          />
          <span>
            <strong>Вызвать stopPropagation() на кнопке-цели</strong>
            <small>Capture успеет выполниться, но событие не перейдёт к bubble listeners.</small>
          </span>
        </label>

        <div className="eventFlowLayout">
          <div className="eventPlaygroundOuter" data-zone="outer" ref={outerRef}>
            <span>Внешний контейнер</span>
            <div className="eventPlaygroundInner" data-zone="inner" ref={innerRef}>
              <span>Внутренний контейнер</span>
              <button className="button primary" ref={targetRef} type="button">
                Запустить click
              </button>
            </div>
          </div>

          <div>
            <div className="eventFlowSummary">
              <span>Выполнено обработчиков</span>
              <strong>
                {flow.length} / {stopAtTarget ? 3 : 5}
              </strong>
            </div>
            {flow.length > 0 ? (
              <ol className="eventTimeline" aria-live="polite">
                {flow.map((entry) => (
                  <li className={entry.phase} key={entry.step}>
                    <span className="eventStep">{entry.step}</span>
                    <span className="eventPhase">{entry.phase}</span>
                    <span>
                      <strong>{entry.node}</strong>
                      <small>{entry.detail}</small>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="eventEmptyState">Нажмите «Запустить click».</p>
            )}
          </div>
        </div>

        <p className="eventNote">
          <code>stopPropagation()</code> останавливает дальнейшее распространение, но не отменяет
          стандартное действие. Для остановки других listeners на том же узле существует{' '}
          <code>stopImmediatePropagation()</code>.
        </p>
      </section>

      <section className="panel" aria-labelledby="default-action-heading">
        <div className="eventSectionHeader">
          <div>
            <span>Эксперимент 3</span>
            <h3 id="default-action-heading">preventDefault и стандартное действие</h3>
          </div>
          <p>
            Ссылка по-прежнему отправляет click родителю. Меняется только переход к адресу из{' '}
            <code>href</code>.
          </p>
        </div>

        <label className="eventOption">
          <input
            checked={preventDefaultEnabled}
            onChange={(event) => {
              setPreventDefaultEnabled(event.target.checked);
              setDefaultActionStatus('Настройка изменена. Нажмите ссылку ещё раз.');
            }}
            type="checkbox"
          />
          <span>
            <strong>Вызывать preventDefault() в listener ссылки</strong>
            <small>Отключите, чтобы разрешить переход к якорю ниже.</small>
          </span>
        </label>

        <div className="controls" ref={defaultDemoRef}>
          <a className="button primary" href="#events-default-destination" ref={defaultLinkRef}>
            Перейти к демонстрационной цели
          </a>
          <button disabled={currentHash === '(пусто)'} onClick={clearHash} type="button">
            Очистить hash
          </button>
        </div>

        <div className="metricsGrid">
          <Metric label="Клики по ссылке" value={defaultClicks} />
          <Metric label="Click дошёл до родителя" value={defaultBubbleCount} />
          <Metric label="Текущий location.hash" value={currentHash} />
        </div>

        <div className="defaultActionResult" aria-live="polite">
          <strong>{defaultActionStatus}</strong>
          <span>{parentObservation}</span>
        </div>

        <div className="defaultDestination" id="events-default-destination" tabIndex={-1}>
          Цель ссылки <code>#events-default-destination</code>
        </div>
      </section>
    </div>
  );
}
