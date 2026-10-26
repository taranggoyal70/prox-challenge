import Image from "next/image";

import type { Artifact } from "@/domain/artifact";
import type { SourceRef } from "@/knowledge/schema";

import { DutyCycleTimeline } from "@/components/artifacts/duty-cycle-timeline";
import { PolarityDiagram } from "@/components/artifacts/polarity-diagram";
import { TroubleshootingFlow } from "@/components/artifacts/troubleshooting-flow";
import { withVisualEvidence } from "@/components/recorded-proof-data";

export function LiveArtifactCanvas({ artifacts, sources }: { artifacts: Artifact[]; sources: SourceRef[] }) {
  const artifact = artifacts.at(-1);
  if (!artifact) return null;

  switch (artifact.kind) {
    case "duty_cycle_timeline":
      return <DutyCycleTimeline data={artifact.data} />;
    case "polarity_diagram":
      return <PolarityDiagram data={artifact.data} />;
    case "troubleshooting_flow":
      return <TroubleshootingFlow checks={artifact.data.steps} process={artifact.data.process} />;
    case "manual_evidence": {
      const source = sources.find((candidate) => artifact.sourceIds.includes(candidate.id));
      const evidence = source ? withVisualEvidence(source) : undefined;
      return (
        <section className="artifact" aria-label="Manual evidence">
          <div className="artifact__header">
            <div>
              <p className="artifact__kicker">Manual evidence</p>
              <h2>{artifact.title}</h2>
            </div>
          </div>
          {evidence ? (
            <figure className="manual-page">
              <Image
                src={evidence.evidenceAssetUrl ?? evidence.assetUrl}
                alt={`${evidence.region ? "Manual region" : "Manual page"}: ${evidence.section}`}
                width={900}
                height={720}
                sizes="(max-width: 720px) 92vw, 42vw"
              />
            </figure>
          ) : null}
          <p className="artifact__note">{artifact.summary}</p>
        </section>
      );
    }
  }
}
