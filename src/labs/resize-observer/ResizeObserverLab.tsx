import { useCallback, useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Mode = 'window' | 'observer';
type MeasurementStatus = 'synced' | 'waiting' | 'stale';
type NotificationSource = 'ResizeObserver' | 'window.resize' | 'fallback: window.resize';

type NotificationRecord = {
  id: number;
  source: NotificationSource;
  width: number;
  changed: boolean;
  time: string;
};

const INITIAL_WIDTH_PERCENT = 72;
const COMPACT_BREAKPOINT = 520;

function readBorderWidth(element: HTMLElement) {
  return Math.round(element.getBoundingClientRect().width);
}

function readObservedWidth(entry: ResizeObserverEntry, element: HTMLElement) {
  const borderBoxWidth = entry.borderBoxSize[0]?.inlineSize;
  return Math.round(borderBoxWidth ?? element.getBoundingClientRect().width);
}

export function ResizeObserverLab() {
  const boxRef = useRef<HTMLElement | null>(null);
  const measuredWidthRef = useRef(0);
  const notificationIdRef = useRef(0);

  const [mode, setMode] = useState<Mode>('observer');
  const [requestedWidth, setRequestedWidth] = useState(INITIAL_WIDTH_PERCENT);
  const [actualWidth, setActualWidth] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [status, setStatus] = useState<MeasurementStatus>('waiting');
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationLog, setNotificationLog] = useState<NotificationRecord[]>([]);

  const resizeObserverSupported = 'ResizeObserver' in window;
  const observerActive = mode === 'observer' && resizeObserverSupported;
  const fallbackActive = mode === 'observer' && !resizeObserverSupported;

  const recordNotification = useCallback((source: NotificationSource, width: number) => {
    const changed = measuredWidthRef.current !== width;
    measuredWidthRef.current = width;
    notificationIdRef.current += 1;

    setMeasuredWidth(width);
    setActualWidth(width);
    setStatus('synced');
    setNotificationCount((count) => count + 1);
    setNotificationLog((records) =>
      [
        ...records,
        {
          id: notificationIdRef.current,
          source,
          width,
          changed,
          time: performance.now().toFixed(1),
        },
      ].slice(-6),
    );
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const initialWidth = readBorderWidth(box);
    measuredWidthRef.current = initialWidth;
    notificationIdRef.current = 0;
    setActualWidth(initialWidth);
    setMeasuredWidth(initialWidth);
    setStatus('synced');
    setNotificationCount(0);
    setNotificationLog([]);

    if (mode === 'observer' && resizeObserverSupported) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        recordNotification('ResizeObserver', readObservedWidth(entry, box));
      });

      try {
        observer.observe(box, { box: 'border-box' });
      } catch {
        observer.observe(box);
      }

      return () => observer.disconnect();
    }

    const source: NotificationSource =
      mode === 'window' ? 'window.resize' : 'fallback: window.resize';
    const handleWindowResize = () => {
      recordNotification(source, readBorderWidth(box));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [mode, recordNotification, resizeObserverSupported]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const frame = requestAnimationFrame(() => {
      setActualWidth(readBorderWidth(box));
    });
    return () => cancelAnimationFrame(frame);
  }, [requestedWidth]);

  const changeRequestedWidth = (nextWidth: number) => {
    setRequestedWidth(nextWidth);
    setStatus(observerActive ? 'waiting' : 'stale');
  };

  const density = measuredWidth < COMPACT_BREAKPOINT ? 'compact' : 'roomy';
  const densityLabel = density === 'compact' ? 'компактный' : 'просторный';
  const measurementsMatch = actualWidth === measuredWidth;

  const statusTitle = fallbackActive
    ? status === 'stale'
      ? 'ResizeObserver недоступен, а fallback ждёт window.resize.'
      : 'ResizeObserver недоступен: используется явный fallback.'
    : status === 'waiting'
      ? 'Размер изменился, ожидаем уведомление ResizeObserver.'
      : status === 'stale'
        ? 'Данные устарели: размер элемента изменился без window.resize.'
        : measurementsMatch
          ? 'Измерение соответствует фактической ширине.'
          : 'Контрольное измерение ещё обновляется.';

  const statusDetail = observerActive
    ? 'Observer реагирует на изменение самого элемента независимо от размера viewport.'
    : 'Обработчик обновит данные только после события resize у объекта window.';

  return (
    <div className="labStack">
      <InfoBlock
        problem="Компонент может менять размер из-за сетки, боковой панели или действий пользователя, хотя viewport остаётся прежним. window.resize такие изменения не замечает."
        api="ResizeObserver сообщает об изменении размеров конкретного элемента после расчёта layout и перед отрисовкой следующего кадра."
        howItWorks="Ползунок меняет только ширину виджета. Сравните фактический размер DOM с последним измерением выбранной реализации и состоянием адаптивной сетки."
        whenToUse="Изменяемые панели, карточки в сетках, редакторы, графики, сайдбары и встраиваемые виджеты."
        impact="Компонент обновляется именно тогда, когда меняется его собственный размер, без зависимости от глобального события окна."
      />

      <section className="panel" aria-labelledby="resize-experiment-heading">
        <div className="resizeSectionHeader">
          <div>
            <span>Управление экспериментом</span>
            <h3 id="resize-experiment-heading">Изменение размера без изменения viewport</h3>
          </div>
          <p>
            Контрольное измерение используется только диагностикой. Компоновка виджета зависит от
            данных выбранного режима.
          </p>
        </div>

        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'ResizeObserver', value: 'observer' },
              { label: 'window.resize', value: 'window' },
            ]}
          />
          <button
            disabled={observerActive}
            onClick={() => window.dispatchEvent(new Event('resize'))}
            type="button"
          >
            Отправить тестовое window.resize
          </button>
        </div>

        <div className="resizeWidthControl">
          <label htmlFor="resize-widget-width">
            <span>Ширина тестового компонента</span>
            <output htmlFor="resize-widget-width">{requestedWidth}% контейнера</output>
          </label>
          <input
            id="resize-widget-width"
            max="100"
            min="60"
            onChange={(event) => changeRequestedWidth(Number(event.target.value))}
            step="1"
            type="range"
            value={requestedWidth}
          />
          <small>
            Ползунок меняет элемент напрямую и не создаёт событие <code>window.resize</code>.
          </small>
        </div>

        <div className={`resizeMeasurementStatus ${status}`} aria-live="polite">
          <strong>{statusTitle}</strong>
          <span>{statusDetail}</span>
        </div>

        <div className="metricsGrid">
          <Metric label="Заданная ширина" value={`${requestedWidth}%`} />
          <Metric label="Фактическая ширина DOM" value={`${actualWidth}px`} />
          <Metric label="Данные реализации" value={`${measuredWidth}px`} />
          <Metric label="Уведомления API" value={notificationCount} />
          <Metric label="Режим компоновки" value={densityLabel} />
        </div>
      </section>

      <section className="resizeExperimentLayout" aria-label="Результат эксперимента">
        <div className="resizeStage">
          <article
            className={`resizeWidget ${density} ${status === 'stale' ? 'stale' : ''}`}
            ref={boxRef}
            style={{ width: `${requestedWidth}%` }}
          >
            <div className="resizeWidgetHeader">
              <div>
                <span>Виджет аналитики</span>
                <h3>{density === 'compact' ? 'Компактная компоновка' : 'Просторная компоновка'}</h3>
              </div>
              <strong>{measuredWidth}px</strong>
            </div>
            <div className={`adaptiveGrid ${density}`}>
              {[
                { label: 'Выручка', value: '2,4 млн ₽' },
                { label: 'Задержка', value: '128 мс' },
                { label: 'Ошибки', value: '0,12%' },
              ].map((item) => (
                <div className="miniCard" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{density === 'compact' ? 'Вертикальный вид' : 'Одна строка'}</small>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="resizeDiagnostics">
          <h3>Журнал уведомлений</h3>
          <p>
            Начальная синхронизация не считается. Первое уведомление ResizeObserver после{' '}
            <code>observe()</code> является настоящим callback.
          </p>
          {notificationLog.length > 0 ? (
            <ol className="resizeNotificationLog" aria-live="polite">
              {notificationLog.map((record) => (
                <li key={record.id}>
                  <span>#{record.id}</span>
                  <div>
                    <strong>{record.source}</strong>
                    <small>
                      {record.width}px · {record.changed ? 'ширина изменилась' : 'ширина та же'} ·{' '}
                      {record.time} мс
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="resizeEmptyLog">Уведомлений пока не было.</div>
          )}
        </div>
      </section>
    </div>
  );
}
