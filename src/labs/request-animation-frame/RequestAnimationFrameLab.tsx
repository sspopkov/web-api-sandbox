import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';
import { ModeToggle } from '../../components/ModeToggle';

type Mode = 'raf' | 'interval';

export function RequestAnimationFrameLab() {
  const [mode, setMode] = useState<Mode>('raf');
  const [running, setRunning] = useState(true);
  const [frames, setFrames] = useState(0);
  const [fps, setFps] = useState(0);
  const ballRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let frameId = 0;
    let intervalId = 0;
    let lastFpsTime = performance.now();
    let localFrames = 0;
    let position = 0;
    let direction = 1;

    const tick = () => {
      if (!ballRef.current) return;
      position += direction * 3;
      if (position > 420 || position < 0) direction *= -1;
      ballRef.current.style.transform = `translateX(${position}px)`;
      localFrames += 1;
      setFrames((value) => value + 1);
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        setFps(localFrames);
        localFrames = 0;
        lastFpsTime = now;
      }
    };

    if (!running) return;
    if (mode === 'raf') {
      const loop = () => {
        tick();
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frameId);
    }

    intervalId = window.setInterval(tick, 16);
    return () => window.clearInterval(intervalId);
  }, [mode, running]);

  return (
    <div className="labStack">
      <InfoBlock
        problem="Анимация по таймеру может рассинхронизироваться и запускаться независимо от отрисовки кадров."
        api="requestAnimationFrame вызывает callback непосредственно перед отрисовкой следующего кадра."
        howItWorks="Переключайте циклы и следите за числом кадров, пока шар движется по дорожке."
        whenToUse="Анимации DOM, canvas и WebGL, синхронизированные с частотой экрана и видимостью вкладки."
        impact="Более плавная анимация и простая очистка циклов, синхронизированных с отрисовкой."
      />
      <section className="panel">
        <div className="controls">
          <ModeToggle
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Оптимально: rAF', value: 'raf' },
              { label: 'setInterval', value: 'interval' },
            ]}
          />
          <button onClick={() => setRunning((value) => !value)} type="button">
            {running ? 'Пауза' : 'Продолжить'}
          </button>
        </div>
        <div className="metricsGrid">
          <Metric label="Кадры" value={frames} />
          <Metric label="Примерный FPS" value={fps} />
        </div>
      </section>
      <section className="animationTrack">
        <div className="animationBall" ref={ballRef} />
      </section>
    </div>
  );
}
