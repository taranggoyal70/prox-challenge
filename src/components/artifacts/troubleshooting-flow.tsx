"use client";

import { useState } from "react";

import type { TroubleshootingCheck } from "@/domain/critical-facts";

export function TroubleshootingFlow({ checks, process = "flux-core" }: { checks: TroubleshootingCheck[]; process?: "flux-core" | "mig" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = checks[activeIndex];
  return (
    <section className="artifact artifact--flow" aria-label="Porosity troubleshooting flow">
      <div className="artifact__header">
        <div>
          <p className="artifact__kicker">{process === "mig" ? "MIG" : "Flux-core"} · porosity</p>
          <h2>Guided check {activeIndex + 1} of {checks.length}</h2>
        </div>
        <output className="artifact__readout">{checks.length} CHECKS</output>
      </div>
      {active ? <ol className="diagnostic-list">
          <li>
            <span className="diagnostic-list__index">{String(activeIndex + 1).padStart(2, "0")}</span>
            <div>
              <h3>{active.title}</h3>
              <p>{active.action}</p>
            </div>
          </li>
      </ol> : null}
      <div className="artifact-controls" aria-label="Troubleshooting navigation">
        <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((value) => value - 1)}>Previous</button>
        <button type="button" disabled={activeIndex === checks.length - 1} onClick={() => setActiveIndex((value) => value + 1)}>Next check</button>
      </div>
      <p className="artifact__note">
        Stop if the machine, cables, or work area appear damaged. Do not inspect energized connections.
      </p>
    </section>
  );
}
