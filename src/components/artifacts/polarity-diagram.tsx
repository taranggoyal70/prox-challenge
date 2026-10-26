type PolarityData = {
  process: string;
  polarity: "DCEN" | "DCEP";
  groundSocket: "positive" | "negative";
  electrodeSocket: "positive" | "negative";
  electrodeLabel: string;
};

export function PolarityDiagram({ data }: { data: PolarityData }) {
  const groundOnPositive = data.groundSocket === "positive";
  const leftLead = groundOnPositive ? "Ground clamp" : data.electrodeLabel;
  const rightLead = groundOnPositive ? data.electrodeLabel : "Ground clamp";

  return (
    <section className="artifact artifact--polarity" aria-label="Polarity connection diagram">
      <div className="artifact__header">
        <div>
          <p className="artifact__kicker">{data.process}</p>
          <h2>{data.polarity} connection</h2>
        </div>
        <output className="artifact__readout">POWER OFF</output>
      </div>
      <div className="socket-board" aria-hidden="true">
        <div className="lead lead--ground">
          <span>{leftLead}</span>
          <i />
        </div>
        <div className="socket socket--positive">
          <b>+</b>
          <small>POSITIVE</small>
        </div>
        <div className="socket socket--negative">
          <b>−</b>
          <small>NEGATIVE</small>
        </div>
        <div className="lead lead--torch">
          <i />
          <span>{rightLead}</span>
        </div>
      </div>
      <dl className="connection-list">
        <div>
          <dt>Ground clamp</dt>
          <dd>{socketLabel(data.groundSocket)}</dd>
        </div>
        <div>
          <dt>{data.electrodeLabel}</dt>
          <dd>{socketLabel(data.electrodeSocket)}</dd>
        </div>
      </dl>
      <p className="artifact__note">
        Connect with power disconnected. Push each plug fully in and twist clockwise to lock.
      </p>
    </section>
  );
}

function socketLabel(socket: "positive" | "negative") {
  return socket === "positive" ? "Positive (+) socket" : "Negative (−) socket";
}
