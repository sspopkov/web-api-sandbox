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
      setLog((entries) => [
        ...records.map(
          (record) =>
            `${record.type}: added ${record.addedNodes.length}, removed ${record.removedNodes.length}, attr ${record.attributeName ?? '-'}`,
        ),
        ...entries,
      ].slice(0, 40));
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
        problem="Code sometimes needs to observe DOM changes made outside React or by third-party scripts."
        api="MutationObserver batches child, attribute, and text mutation records."
        howItWorks="Change the playground and toggle observer options to see which records appear."
        whenToUse="Editor plugins, embeds, analytics, design tools, legacy integration boundaries."
        impact="Avoids polling the DOM and gives precise records for controlled reactions."
      />
      <section className="panel">
        <div className="controls">
          <button className="primary" onClick={addItem} type="button">
            Add element
          </button>
          <button onClick={removeItem} type="button">
            Remove element
          </button>
          <button onClick={toggleAttributes} type="button">
            Change attributes
          </button>
          <label>
            <input checked={childList} onChange={(event) => setChildList(event.target.checked)} type="checkbox" />{' '}
            childList
          </label>
          <label>
            <input checked={attributes} onChange={(event) => setAttributes(event.target.checked)} type="checkbox" />{' '}
            attributes
          </label>
          <label>
            <input checked={subtree} onChange={(event) => setSubtree(event.target.checked)} type="checkbox" /> subtree
          </label>
        </div>
        <div className="metricsGrid">
          <Metric label="Elements" value={items} />
          <Metric label="Mutation records" value={log.length} />
        </div>
      </section>
      <section className="domPlayground" ref={playgroundRef}>
        {Array.from({ length: items }, (_, index) => (
          <div className="domItem" data-active="false" key={index}>
            Node {index + 1}
          </div>
        ))}
      </section>
      <pre className="log">{log.join('\n') || 'No mutations recorded yet'}</pre>
    </div>
  );
}
