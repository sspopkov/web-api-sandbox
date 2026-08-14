import { useMemo, useState } from 'react';
import { labs } from './labs';

export function App() {
  const [activeSlug, setActiveSlug] = useState(labs[0].slug);
  const activeLab = useMemo(
    () => labs.find((lab) => lab.slug === activeSlug) ?? labs[0],
    [activeSlug],
  );
  const ActiveComponent = activeLab.component;

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">API</span>
          <div>
            <h1>Web API Sandbox</h1>
            <p>Interactive labs for browser behavior.</p>
          </div>
        </div>
        <nav className="navList" aria-label="Labs">
          {labs.map((lab, index) => (
            <button
              className={lab.slug === activeSlug ? 'navItem active' : 'navItem'}
              key={lab.slug}
              onClick={() => setActiveSlug(lab.slug)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{lab.title}</strong>
            </button>
          ))}
        </nav>
      </aside>
      <main className="content">
        <header className="pageHeader">
          <div>
            <p className="eyebrow">{activeLab.api}</p>
            <h2>{activeLab.title}</h2>
            <p>{activeLab.summary}</p>
          </div>
        </header>
        <ActiveComponent />
      </main>
    </div>
  );
}
