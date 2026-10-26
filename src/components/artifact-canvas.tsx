import { DutyCycleTimeline } from "@/components/artifacts/duty-cycle-timeline";
import { PolarityDiagram } from "@/components/artifacts/polarity-diagram";
import { TroubleshootingFlow } from "@/components/artifacts/troubleshooting-flow";
import type { RecordedScenario } from "@/components/recorded-proof-data";

export function ArtifactCanvas({ scenario }: { scenario: RecordedScenario }) {
  switch (scenario.artifact.kind) {
    case "duty":
      return <DutyCycleTimeline data={scenario.artifact.data} />;
    case "polarity":
      return <PolarityDiagram data={scenario.artifact.data} />;
    case "troubleshooting":
      return <TroubleshootingFlow checks={scenario.artifact.data} />;
  }
}
