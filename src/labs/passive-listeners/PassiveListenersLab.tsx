import { useCallback, useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Mode = 'passive' | 'non-passive';

type Diagnostics = {
  wheelEvents: number;
  scrollEvents: number;
  scrollTop: number;
  totalHandlerTime: number;
  lastHandlerTime: number;
  maxHandlerTime: number;
};

type WheelSample = {
  id: number;
  mode: Mode;
  deltaY: number;
  handlerTime: number;
  scrollTopAtHandler: number;
};

const INITIAL_WORKLOAD = 12;
const MAX_LOG_ENTRIES = 7;

function createEmptyDiagnostics(): Diagnostics {
  return {
    wheelEvents: 0,
    scrollEvents: 0,
    scrollTop: 0,
    totalHandlerTime: 0,
    lastHandlerTime: 0,
    maxHandlerTime: 0,
  };
}

function detectPassiveSupport() {
  let supported = false;
  const listener = () => undefined;
  const options: AddEventListenerOptions = {
    get passive() {
      supported = true;
      return false;
    },
  };

  try {
    window.addEventListener('passive-support-test', listener, options);
    window.removeEventListener('passive-support-test', listener, options);
  } catch {
    return false;
  }

  return supported;
}

function runMainThreadWork(duration: number) {
  const startedAt = performance.now();
  let checksum = 0;

  while (performance.now() - startedAt < duration) {
    checksum = (checksum + Math.sqrt(checksum + 1)) % 10_000;
  }

  return checksum;
}

export function PassiveListenersLab() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const diagnosticsRef = useRef<Diagnostics>(createEmptyDiagnostics());
  const samplesRef = useRef<WheelSample[]>([]);
  const sampleIdRef = useRef(0);
  const publishFrameRef = useRef<number | null>(null);
  const workloadSinkRef = useRef(0);

  const [mode, setMode] = useState<Mode>('passive');
  const [workload, setWorkload] = useState(INITIAL_WORKLOAD);
  const [diagnostics, setDiagnostics] = useState<Diagnostics>(createEmptyDiagnostics);
  const [samples, setSamples] = useState<WheelSample[]>([]);
  const [passiveSupported] = useState(detectPassiveSupport);

  const publishDiagnostics = useCallback(() => {
    if (publishFrameRef.current !== null) return;

    publishFrameRef.current = requestAnimationFrame(() => {
      publishFrameRef.current = null;
      setDiagnostics({ ...diagnosticsRef.current });
      setSamples([...samplesRef.current]);
    });
  }, []);

  const resetDiagnostics = useCallback(() => {
    if (publishFrameRef.current !== null) {
      cancelAnimationFrame(publishFrameRef.current);
      publishFrameRef.current = null;
    }

    diagnosticsRef.current = {
      ...createEmptyDiagnostics(),
      scrollTop: Math.round(boxRef.current?.scrollTop ?? 0),
    };
    samplesRef.current = [];
    sampleIdRef.current = 0;
    setDiagnostics({ ...diagnosticsRef.current });
    setSamples([]);
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const listenerOptions: AddEventListenerOptions | boolean = passiveSupported
      ? { passive: mode === 'passive' }
      : false;
    const scrollOptions: AddEventListenerOptions | boolean = passiveSupported
      ? { passive: true }
      : false;

    const handleWheel = (event: WheelEvent) => {
      const startedAt = performance.now();
      workloadSinkRef.current = runMainThreadWork(workload);
      const handlerTime = performance.now() - startedAt;
      const current = diagnosticsRef.current;

      current.wheelEvents += 1;
      current.totalHandlerTime += handlerTime;
      current.lastHandlerTime = handlerTime;
      current.maxHandlerTime = Math.max(current.maxHandlerTime, handlerTime);
      sampleIdRef.current += 1;
      samplesRef.current = [
        ...samplesRef.current,
        {
          id: sampleIdRef.current,
          mode,
          deltaY: Math.round(event.deltaY),
          handlerTime,
          scrollTopAtHandler: Math.round(box.scrollTop),
        },
      ].slice(-MAX_LOG_ENTRIES);
      publishDiagnostics();
    };

    const handleScroll = () => {
      diagnosticsRef.current.scrollEvents += 1;
      diagnosticsRef.current.scrollTop = Math.round(box.scrollTop);
      publishDiagnostics();
    };

    box.addEventListener('wheel', handleWheel, listenerOptions);
    box.addEventListener('scroll', handleScroll, scrollOptions);
    return () => {
      box.removeEventListener('wheel', handleWheel);
      box.removeEventListener('scroll', handleScroll);
    };
  }, [mode, passiveSupported, publishDiagnostics, workload]);

  useEffect(
    () => () => {
      if (publishFrameRef.current !== null) {
        cancelAnimationFrame(publishFrameRef.current);
      }
    },
    [],
  );

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    resetDiagnostics();
  };

  const changeWorkload = (nextWorkload: number) => {
    setWorkload(nextWorkload);
    resetDiagnostics();
  };

  const scrollToStart = () => {
    boxRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };

  const averageHandlerTime =
    diagnostics.wheelEvents === 0 ? 0 : diagnostics.totalHandlerTime / diagnostics.wheelEvents;
  const passiveActive = mode === 'passive' && passiveSupported;

  return (
    <div className="labStack">
      <InfoBlock
        problem="Для wheel, touchstart и touchmove браузеру важно заранее знать, может ли JavaScript отменить прокрутку через preventDefault()."
        api="Параметр { passive: true } обещает браузеру, что listener не отменит стандартное действие события."
        howItWorks="Оба режима выполняют одинаковую синхронную работу и не вызывают preventDefault. Пассивный listener позволяет начать прокрутку без ожидания, непассивный заставляет браузер дождаться callback."
        whenToUse="Сбор аналитики, обновление индикаторов и наблюдение за wheel или touch-событиями, когда отменять жест не требуется."
        impact="Браузер может передать прокрутку compositor thread раньше и уменьшить задержку реакции на ввод, особенно на touch-устройствах."
      />

      <section className="panel" aria-labelledby="passive-experiment-heading">
        <div className="passiveSectionHeader">
          <div>
            <span>Управление экспериментом</span>
            <h3 id="passive-experiment-heading">Одинаковая работа, разный контракт listener</h3>
          </div>
          <p>
            Прокрутка разрешена в обоих режимах. Эксперимент меняет только параметр{' '}
            <code>passive</code>.
          </p>
        </div>

        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={changeMode}
            options={[
              { label: 'Пассивный', value: 'passive' },
              { label: 'Непассивный', value: 'non-passive' },
            ]}
          />
          <button onClick={resetDiagnostics} type="button">
            Сбросить метрики
          </button>
          <button onClick={scrollToStart} type="button">
            В начало списка
          </button>
        </div>

        <div className="passiveWorkloadControl">
          <label htmlFor="wheel-workload">
            <span>Синхронная работа внутри wheel handler</span>
            <output htmlFor="wheel-workload">{workload} мс</output>
          </label>
          <input
            id="wheel-workload"
            max="24"
            min="0"
            onChange={(event) => changeWorkload(Number(event.target.value))}
            step="2"
            type="range"
            value={workload}
          />
          <small>Нагрузка намеренно одинакова для честного сравнения режимов.</small>
        </div>

        <div
          className={`passiveContractStatus ${passiveActive ? 'passive' : 'nonPassive'}`}
          aria-live="polite"
        >
          <strong>
            {passiveActive
              ? 'Браузер знает, что прокрутку нельзя отменить.'
              : passiveSupported
                ? 'Браузер обязан дождаться завершения listener.'
                : 'Параметр passive не поддерживается: используется обычный listener.'}
          </strong>
          <span>
            {passiveActive
              ? 'Стандартное действие может начаться независимо от выполнения JavaScript callback.'
              : 'preventDefault() здесь специально не вызывается, поэтому после ожидания прокрутка всё равно происходит.'}
          </span>
        </div>

        <div className="metricsGrid">
          <Metric label="События wheel" value={diagnostics.wheelEvents} />
          <Metric label="События scroll" value={diagnostics.scrollEvents} />
          <Metric label="Текущий scrollTop" value={`${diagnostics.scrollTop}px`} />
          <Metric label="Среднее время handler" value={`${averageHandlerTime.toFixed(1)} мс`} />
          <Metric
            label="Максимальное время"
            value={`${diagnostics.maxHandlerTime.toFixed(1)} мс`}
          />
          <Metric
            label="Параметр listener"
            value={passiveActive ? 'passive: true' : 'passive: false'}
          />
        </div>
      </section>

      <section className="passiveExperimentLayout" aria-label="Область проверки прокрутки">
        <div>
          <div className="passiveScrollHeading">
            <div>
              <span>Тестовая область</span>
              <h3>Прокрутите список колесом или трекпадом</h3>
            </div>
            <strong>{diagnostics.scrollTop}px</strong>
          </div>
          <div className="scrollBox passiveScrollBox" ref={boxRef} tabIndex={0}>
            {Array.from({ length: 36 }, (_, index) => (
              <div className="scrollRow" key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>Строка прокрутки {index + 1}</strong>
                  <small>Содержимое для проверки движения scroll container</small>
                </div>
              </div>
            ))}
          </div>
          <p className="passiveClarification">
            <code>passive: false</code> не останавливает прокрутку автоматически. Для полной отмены
            потребовался бы отдельный вызов <code>preventDefault()</code>, которого в этом сравнении
            нет.
          </p>
        </div>

        <aside className="passiveDiagnostics" aria-labelledby="wheel-log-heading">
          <h3 id="wheel-log-heading">Последние wheel events</h3>
          <p>Позиция фиксируется внутри handler до выполнения стандартного действия браузера.</p>
          {samples.length > 0 ? (
            <ol className="passiveEventLog" aria-live="polite">
              {samples.map((sample) => (
                <li key={sample.id}>
                  <span>#{sample.id}</span>
                  <div>
                    <strong>
                      {sample.mode === 'passive' ? 'passive: true' : 'passive: false'}
                    </strong>
                    <small>
                      deltaY {sample.deltaY} · handler {sample.handlerTime.toFixed(1)} мс ·
                      scrollTop {sample.scrollTopAtHandler}px
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="passiveEmptyLog">
              Прокрутите тестовую область, чтобы получить события.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
