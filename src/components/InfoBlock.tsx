type InfoBlockProps = {
  problem: string;
  api: string;
  howItWorks: string;
  whenToUse: string;
  impact: string;
};

export function InfoBlock({ problem, api, howItWorks, whenToUse, impact }: InfoBlockProps) {
  return (
    <section className="infoGrid" aria-label="Lab explanation">
      <article>
        <h3>Problem</h3>
        <p>{problem}</p>
      </article>
      <article>
        <h3>API</h3>
        <p>{api}</p>
      </article>
      <article>
        <h3>How It Works</h3>
        <p>{howItWorks}</p>
      </article>
      <article>
        <h3>When To Use</h3>
        <p>{whenToUse}</p>
      </article>
      <article>
        <h3>Performance / UX Impact</h3>
        <p>{impact}</p>
      </article>
    </section>
  );
}
