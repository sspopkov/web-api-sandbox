type InfoBlockProps = {
  problem: string;
  api: string;
  howItWorks: string;
  whenToUse: string;
  impact: string;
};

export function InfoBlock({ problem, api, howItWorks, whenToUse, impact }: InfoBlockProps) {
  return (
    <section className="infoGrid" aria-label="Описание лабораторной работы">
      <article>
        <h3>Проблема</h3>
        <p>{problem}</p>
      </article>
      <article>
        <h3>API</h3>
        <p>{api}</p>
      </article>
      <article>
        <h3>Как это работает</h3>
        <p>{howItWorks}</p>
      </article>
      <article>
        <h3>Когда использовать</h3>
        <p>{whenToUse}</p>
      </article>
      <article>
        <h3>Влияние на производительность и UX</h3>
        <p>{impact}</p>
      </article>
    </section>
  );
}
