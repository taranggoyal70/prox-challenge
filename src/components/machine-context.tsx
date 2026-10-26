export function MachineContext({
  process,
  inputVoltage,
}: {
  process?: string;
  inputVoltage?: string;
}) {
  return (
    <section className="machine-context" aria-label="Current machine context">
      <div>
        <span>MODEL</span>
        <strong>OmniPro 220</strong>
        <small>Challenge product</small>
      </div>
      <div>
        <span>PROCESS</span>
        <strong aria-live="polite">{process ?? "Unknown"}</strong>
        <small>{process ? "From selected task" : "Confirm before settings advice"}</small>
      </div>
      <div>
        <span>INPUT</span>
        <strong aria-live="polite">{inputVoltage ?? "Unknown"}</strong>
        <small>{inputVoltage ? "From selected task" : "Confirm before settings advice"}</small>
      </div>
    </section>
  );
}
