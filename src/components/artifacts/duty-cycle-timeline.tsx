"use client";

import { useMemo, useState } from "react";

import facts from "@/knowledge/generated/facts.json";

type DutyCycleData = {
  process: "flux-core" | "mig" | "tig" | "stick";
  inputVoltage: number;
  amperage: number;
  ratedPercent: number;
  weldingMinutes: number;
  restingMinutes: number;
};

export function DutyCycleTimeline({ data }: { data: DutyCycleData }) {
  const ratings = useMemo(
    () => facts.facts.filter(
      (fact) => fact.predicate === "duty_cycle" && fact.inputs.process === data.process,
    ),
    [data.process],
  );
  const initialId = `duty:${data.process}:${data.inputVoltage}v:${data.amperage}a`;
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = ratings.find((rating) => rating.id === selectedId);
  const shown = selected
    ? {
        process: selected.inputs.process as DutyCycleData["process"],
        inputVoltage: Number(selected.inputs.inputVoltage),
        amperage: Number(selected.inputs.amperage),
        ratedPercent: Number(selected.output.ratedPercent),
        weldingMinutes: Number(selected.output.weldingMinutes),
        restingMinutes: Number(selected.output.restingMinutes),
      }
    : data;
  return (
    <section className="artifact artifact--duty" aria-label="Duty-cycle timeline">
      <div className="artifact__header">
        <div>
          <p className="artifact__kicker">{shown.process.toUpperCase()} · 10-minute rated window</p>
          <h2>{shown.ratedPercent}% duty cycle</h2>
        </div>
        <output className="artifact__readout">
          {shown.amperage} A / {shown.inputVoltage} V
        </output>
      </div>
      <div className="timeline" aria-hidden="true">
        <div
          className="timeline__weld"
          style={{ width: `${shown.ratedPercent}%` }}
        >
          <span>WELD</span>
        </div>
        <div className="timeline__rest" style={{ width: `${100 - shown.ratedPercent}%` }}>
          <span>REST</span>
        </div>
      </div>
      <dl className="artifact__metrics">
        <div>
          <dt>Arc on</dt>
          <dd>{shown.weldingMinutes} min welding</dd>
        </div>
        <div>
          <dt>Fan cooling</dt>
          <dd>{shown.restingMinutes} min resting</dd>
        </div>
      </dl>
      <label className="artifact-selector">
        Explore documented ratings
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          {ratings.map((rating) => (
            <option key={rating.id} value={rating.id}>
              {String(rating.inputs.process).toUpperCase()} · {rating.inputs.amperage} A · {rating.inputs.inputVoltage} V
            </option>
          ))}
        </select>
      </label>
      <p className="artifact__note">
        Keep the welder powered during the rest period so the internal fan can cool it.
      </p>
    </section>
  );
}
