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
  const densityLabel = density === 'compact' ? 'компактный' : 'просторный';

  return (
    <div className="labStack">
      <InfoBlock
        problem="Компонентам часто нужно реагировать на размер собственного контейнера, а не всего viewport."
        api="ResizeObserver сообщает об изменении размеров элемента после расчёта компоновки."
        howItWorks="Потяните за маркер блока. Observer сработает, даже если событие window.resize не возникает."
        whenToUse="Изменяемые панели, карточки в сетках, редакторы, графики и встраиваемые виджеты."
        impact="Не требует глобального отслеживания окна и точнее адаптирует интерфейс к размеру компонента."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Оптимально: ResizeObserver', value: 'observer' },
              { label: 'Наивно: window.resize', value: 'window' },
            ]}
          />
        </div>
        <div className="metricsGrid">
          <Metric label="Ширина элемента" value={`${width}px`} />
          <Metric label="Вызовы callback" value={callbacks} />
          <Metric label="Режим компоновки" value={densityLabel} />
        </div>
      </section>
      <section className="resizableBox" ref={boxRef}>
        <h3>Изменяемый виджет аналитики</h3>
        <p className="note">Используйте маркер изменения размера в правом нижнем углу.</p>
        <div className={`adaptiveGrid ${density}`}>
          {['Выручка', 'Задержка', 'Ошибки'].map((item) => (
            <div className="miniCard" key={item}>
              <strong>{item}</strong>
              <p className="note">
                {density === 'compact' ? 'Вертикальный вид' : 'Многоколоночный вид'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
