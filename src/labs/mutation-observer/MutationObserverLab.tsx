import { useEffect, useRef, useState } from 'react';
import { InfoBlock } from '../../components/InfoBlock';
import { Metric } from '../../components/Metric';

type ActionFeedback = {
  tone: 'neutral' | 'captured' | 'ignored';
  text: string;
};

const INITIAL_ITEMS = 3;
const MAX_LOG_ENTRIES = 60;

function createPlaygroundItem(id: number) {
  const item = document.createElement('article');
  item.className = 'domItem';
  item.dataset.node = String(id);
  item.dataset.active = 'false';

  const title = document.createElement('strong');
  title.textContent = `Узел ${id}`;

  const text = document.createElement('span');
  text.className = 'domItemText';
  text.append(document.createTextNode('Вложенный текст: версия 0'));

  const nestedArea = document.createElement('div');
  nestedArea.className = 'domNestedArea';

  item.append(title, text, nestedArea);
  return item;
}

function describeTarget(target: Node, playground: HTMLElement) {
  if (target === playground) return 'playground';

  const element = target instanceof Element ? target : target.parentElement;
  const item = element?.closest<HTMLElement>('[data-node]');
  const itemName = item ? `узел ${item.dataset.node}` : element?.tagName.toLowerCase();

  if (target.nodeType === Node.TEXT_NODE) return `текст внутри «${itemName}»`;
  if (element?.classList.contains('domNestedArea')) return `вложенная область «${itemName}»`;
  return itemName ?? target.nodeName.toLowerCase();
}

function quoteValue(value: string | null) {
  return value === null ? 'отсутствует' : `«${value}»`;
}

function formatMutation(record: MutationRecord, playground: HTMLElement) {
  const target = describeTarget(record.target, playground);

  if (record.type === 'childList') {
    return `childList | ${target} | добавлено: ${record.addedNodes.length}, удалено: ${record.removedNodes.length}`;
  }

  if (record.type === 'attributes') {
    const element = record.target as Element;
    const currentValue = record.attributeName ? element.getAttribute(record.attributeName) : null;
    return `attributes | ${target} | ${record.attributeName}: ${quoteValue(record.oldValue)} -> ${quoteValue(currentValue)}`;
  }

  return `characterData | ${target} | ${quoteValue(record.oldValue)} -> ${quoteValue(record.target.textContent)}`;
}

export function MutationObserverLab() {
  const playgroundRef = useRef<HTMLDivElement | null>(null);
  const nextItemIdRef = useRef(INITIAL_ITEMS + 1);
  const nextNestedIdRef = useRef(1);
  const textVersionRef = useRef(0);

  const [itemCount, setItemCount] = useState(INITIAL_ITEMS);
  const [childList, setChildList] = useState(true);
  const [attributes, setAttributes] = useState(true);
  const [characterData, setCharacterData] = useState(true);
  const [subtree, setSubtree] = useState(true);
  const [callbacks, setCallbacks] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<ActionFeedback>({
    tone: 'neutral',
    text: 'Выберите действие с DOM и сравните ожидаемый результат с журналом.',
  });

  const supportsMutationObserver =
    typeof window !== 'undefined' && typeof window.MutationObserver === 'function';
  const hasMutationType = childList || attributes || characterData;
  const observerActive = supportsMutationObserver && hasMutationType;

  // React owns only the empty playground container; its children are changed through native DOM APIs.
  useEffect(() => {
    const playground = playgroundRef.current;
    if (!playground || playground.children.length > 0) return;

    const fragment = document.createDocumentFragment();
    for (let id = 1; id <= INITIAL_ITEMS; id += 1) {
      fragment.append(createPlaygroundItem(id));
    }
    playground.dataset.state = 'normal';
    playground.append(fragment);
  }, []);

  useEffect(() => {
    const playground = playgroundRef.current;
    if (!playground || !observerActive) return;

    const observer = new MutationObserver((records) => {
      setCallbacks((value) => value + 1);
      setRecordCount((value) => value + records.length);
      setLog((entries) =>
        [
          ...records.map((record) => formatMutation(record, playground)).reverse(),
          ...entries,
        ].slice(0, MAX_LOG_ENTRIES),
      );
    });

    const options: MutationObserverInit = {
      childList,
      attributes,
      characterData,
      subtree,
    };
    if (attributes) options.attributeOldValue = true;
    if (characterData) options.characterDataOldValue = true;

    observer.observe(playground, options);
    return () => observer.disconnect();
  }, [attributes, characterData, childList, observerActive, subtree]);

  const reportAction = (action: string, matchesConfig: boolean, requirement: string) => {
    if (!supportsMutationObserver) {
      setLastAction({
        tone: 'ignored',
        text: `${action}. DOM изменён, но MutationObserver не поддерживается браузером.`,
      });
      return;
    }

    if (!hasMutationType) {
      setLastAction({
        tone: 'ignored',
        text: `${action}. DOM изменён, но observer приостановлен: выберите хотя бы один тип мутаций.`,
      });
      return;
    }

    setLastAction(
      matchesConfig
        ? {
            tone: 'captured',
            text: `${action}. Текущая конфигурация должна добавить запись в журнал.`,
          }
        : {
            tone: 'ignored',
            text: `${action}. DOM изменён, но observer его игнорирует: требуется ${requirement}.`,
          },
    );
  };

  const addTopLevelItem = () => {
    const playground = playgroundRef.current;
    if (!playground) return;

    playground.append(createPlaygroundItem(nextItemIdRef.current));
    nextItemIdRef.current += 1;
    setItemCount(playground.childElementCount);
    reportAction('Добавлен верхний узел', childList, 'childList');
  };

  const removeTopLevelItem = () => {
    const playground = playgroundRef.current;
    const item = playground?.lastElementChild;
    if (!playground || !item) return;

    item.remove();
    setItemCount(playground.childElementCount);
    reportAction('Удалён верхний узел', childList, 'childList');
  };

  const addNestedItem = () => {
    const nestedArea = playgroundRef.current?.querySelector<HTMLElement>('.domItem .domNestedArea');
    if (!nestedArea) return;

    const nestedItem = document.createElement('span');
    nestedItem.className = 'domNestedNode';
    nestedItem.textContent = `Вложенный ${nextNestedIdRef.current}`;
    nextNestedIdRef.current += 1;
    nestedArea.append(nestedItem);
    reportAction('Добавлен вложенный элемент', childList && subtree, 'childList + subtree');
  };

  const togglePlaygroundAttribute = () => {
    const playground = playgroundRef.current;
    if (!playground) return;

    playground.dataset.state =
      playground.dataset.state === 'highlighted' ? 'normal' : 'highlighted';
    reportAction('Изменён data-state у самого playground', attributes, 'attributes');
  };

  const toggleChildAttribute = () => {
    const item = playgroundRef.current?.querySelector<HTMLElement>('.domItem');
    if (!item) return;

    item.dataset.active = item.dataset.active === 'true' ? 'false' : 'true';
    reportAction(
      'Изменён data-active у дочернего узла',
      attributes && subtree,
      'attributes + subtree',
    );
  };

  const changeNestedText = () => {
    const textElement = playgroundRef.current?.querySelector<HTMLElement>('.domItem .domItemText');
    const textNode = textElement?.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

    textVersionRef.current += 1;
    textNode.nodeValue = `Вложенный текст: версия ${textVersionRef.current}`;
    reportAction(
      'Изменено содержимое вложенного Text-узла',
      characterData && subtree,
      'characterData + subtree',
    );
  };

  const clearLog = () => {
    setCallbacks(0);
    setRecordCount(0);
    setLog([]);
    setLastAction({
      tone: 'neutral',
      text: 'Журнал очищен. Следующая мутация начнёт новый замер.',
    });
  };

  const observerStatus = !supportsMutationObserver
    ? 'API не поддерживается'
    : hasMutationType
      ? 'активен'
      : 'приостановлен';

  const statusExplanation = !supportsMutationObserver
    ? 'DOM-действия доступны, но журнал изменений работать не будет.'
    : hasMutationType
      ? 'Изменения фиксируются согласно выбранным параметрам.'
      : 'MutationObserverInit требует childList, attributes или characterData. subtree только расширяет область наблюдения.';

  const configSample = `const options: MutationObserverInit = {
  childList: ${childList},
  attributes: ${attributes},
  characterData: ${characterData},
  subtree: ${subtree},${attributes ? '\n  attributeOldValue: true,' : ''}${characterData ? '\n  characterDataOldValue: true,' : ''}
};

${hasMutationType ? 'observer.observe(playground, options);' : '// observe() приостановлен: конфигурация не содержит тип мутаций.'}`;

  return (
    <div className="labStack">
      <InfoBlock
        problem="DOM может изменяться вне React, а постоянный ручной опрос дерева создаёт лишнюю работу."
        api="MutationObserver асинхронно группирует записи childList, attributes и characterData."
        howItWorks="Меняйте цель и её потомков, затем включайте типы мутаций и область subtree, чтобы сравнить журнал."
        whenToUse="Плагины редакторов, сторонние виджеты, аналитика и интеграция с кодом, напрямую меняющим DOM."
        impact="Observer сообщает только о выбранных изменениях и позволяет реагировать на них без polling."
      />

      <section className="panel">
        <h3>Конфигурация MutationObserverInit</h3>
        <div className="observerOptions">
          <label className="observerOption">
            <input
              checked={childList}
              onChange={(event) => setChildList(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>childList</strong>
              <small>Добавление и удаление дочерних узлов у наблюдаемой цели.</small>
            </span>
          </label>
          <label className="observerOption">
            <input
              checked={attributes}
              onChange={(event) => setAttributes(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>attributes</strong>
              <small>Изменение атрибутов цели, например data-state.</small>
            </span>
          </label>
          <label className="observerOption">
            <input
              checked={characterData}
              onChange={(event) => setCharacterData(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>characterData</strong>
              <small>Изменение содержимого Text-узлов, а не замена элементов.</small>
            </span>
          </label>
          <label className="observerOption">
            <input
              checked={subtree}
              onChange={(event) => setSubtree(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>subtree</strong>
              <small>Расширяет выбранные типы на потомков; сам по себе не является типом.</small>
            </span>
          </label>
        </div>

        <div className={observerActive ? 'observerStatus active' : 'observerStatus paused'}>
          <strong>Observer {observerStatus}</strong>
          <span>{statusExplanation}</span>
        </div>

        <div className="metricsGrid">
          <Metric label="Верхние узлы" value={itemCount} />
          <Metric label="Вызовы callback" value={callbacks} />
          <Metric label="Получено records" value={recordCount} />
          <Metric label="Состояние" value={observerStatus} />
        </div>
      </section>

      <section className="panel">
        <h3>Действия с DOM</h3>
        <div className="controls">
          <button className="primary" onClick={addTopLevelItem} type="button">
            Добавить верхний узел
          </button>
          <button disabled={itemCount === 0} onClick={removeTopLevelItem} type="button">
            Удалить верхний узел
          </button>
          <button disabled={itemCount === 0} onClick={addNestedItem} type="button">
            Добавить вложенный
          </button>
          <button onClick={togglePlaygroundAttribute} type="button">
            Атрибут playground
          </button>
          <button disabled={itemCount === 0} onClick={toggleChildAttribute} type="button">
            Атрибут потомка
          </button>
          <button disabled={itemCount === 0} onClick={changeNestedText} type="button">
            Изменить вложенный текст
          </button>
          <button disabled={recordCount === 0} onClick={clearLog} type="button">
            Очистить журнал
          </button>
        </div>
        <div className={`mutationActionStatus ${lastAction.tone}`}>{lastAction.text}</div>
      </section>

      <section
        aria-label="DOM playground, наблюдаемый через MutationObserver"
        className="domPlayground"
        ref={playgroundRef}
      />

      <pre className="codeSample">{configSample}</pre>
      <pre className="log">{log.join('\n') || 'Изменений пока не зарегистрировано'}</pre>
    </div>
  );
}
