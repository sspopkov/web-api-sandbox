import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';

export function MutationObserverLab() {
  const playgroundRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState(3);
  const [attributes, setAttributes] = useState(true);
  const [childList, setChildList] = useState(true);
  const [subtree, setSubtree] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const node = playgroundRef.current;
    if (!node || !('MutationObserver' in window)) return;
    const observer = new MutationObserver((records) => {
      setLog((entries) =>
        [
          ...records.map(
            (record) =>
              `${record.type}: добавлено ${record.addedNodes.length}, удалено ${record.removedNodes.length}, атрибут ${record.attributeName ?? '-'}`,
          ),
          ...entries,
        ].slice(0, 40),
      );
    });
    observer.observe(node, { attributes, childList, subtree });
    return () => observer.disconnect();
  }, [attributes, childList, subtree]);

  const addItem = () => setItems((value) => value + 1);
  const removeItem = () => setItems((value) => Math.max(0, value - 1));
  const toggleAttributes = () => {
    playgroundRef.current?.querySelectorAll<HTMLElement>('.domItem').forEach((node, index) => {
      node.dataset.active = String(index % 2 === Math.round(performance.now()) % 2);
    });
  };

  return (
    <div className="labStack">
      <InfoBlock
        problem="Иногда нужно отслеживать изменения DOM, внесённые вне React или сторонними скриптами."
        api="MutationObserver группирует записи об изменениях дочерних узлов, атрибутов и текста."
        howItWorks="Изменяйте DOM-песочницу и параметры observer, чтобы увидеть разные типы записей."
        whenToUse="Плагины редакторов, встраиваемые блоки, аналитика и интеграция с устаревшим DOM."
        impact="Устраняет постоянный опрос DOM и предоставляет точные записи для управляемой реакции."
      />
      <section className="panel">
        <div className="controls">
          <button className="primary" onClick={addItem} type="button">
            Добавить элемент
          </button>
          <button onClick={removeItem} type="button">
            Удалить элемент
          </button>
          <button onClick={toggleAttributes} type="button">
            Изменить атрибуты
          </button>
          <label>
            <input
              checked={childList}
              onChange={(event) => setChildList(event.target.checked)}
              type="checkbox"
            />{' '}
            childList
          </label>
          <label>
            <input
              checked={attributes}
              onChange={(event) => setAttributes(event.target.checked)}
              type="checkbox"
            />{' '}
            attributes
          </label>
          <label>
            <input
              checked={subtree}
              onChange={(event) => setSubtree(event.target.checked)}
              type="checkbox"
            />{' '}
            subtree
          </label>
        </div>
        <div className="metricsGrid">
          <Metric label="Элементы" value={items} />
          <Metric label="Записи об изменениях" value={log.length} />
        </div>
      </section>
      <section className="domPlayground" ref={playgroundRef}>
        {Array.from({ length: items }, (_, index) => (
          <div className="domItem" data-active="false" key={index}>
            Узел {index + 1}
          </div>
        ))}
      </section>
      <pre className="log">{log.join('\n') || 'Изменений пока не зарегистрировано'}</pre>
    </div>
  );
}
