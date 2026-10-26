import {
  calculateDutyCycle,
  getPorosityChecklist,
  resolvePolarityLayout,
  type TroubleshootingCheck,
} from "@/domain/critical-facts";
import type { SourceRef } from "@/knowledge/schema";
import rawManifest from "@/knowledge/generated/manifest.json";
import rawVisualEvidence from "@/knowledge/generated/visual-evidence.json";

export const challengePrompts = {
  duty: "What's the duty cycle for MIG welding at 200A on 240V?",
  porosity: "I'm getting porosity in my flux-cored welds. What should I check?",
  tig: "What polarity setup do I need for TIG welding? Which socket does the ground clamp go in?",
} as const;

export type EvidenceSource = Pick<
  SourceRef,
  | "id"
  | "documentId"
  | "documentTitle"
  | "pdfPageNumber"
  | "printedPageLabel"
  | "section"
  | "assetUrl"
  | "region"
> & { excerpt?: string; evidenceAssetUrl?: string };

const visualBySource = new Map(
  rawVisualEvidence.map((visual) => [visual.sourceId, visual] as const),
);

export const recordedProofProvenance = {
  corpusVersion: rawManifest.corpusVersion,
  schemaVersion: rawManifest.schemaVersion,
};

export function withVisualEvidence(source: EvidenceSource): EvidenceSource {
  const visual = visualBySource.get(source.id);
  const bounds = visual?.regions[0]?.bounds;
  return visual && bounds
    ? { ...source, region: bounds, evidenceAssetUrl: visual.assetUrl }
    : source;
}

export type RecordedScenario =
  | {
      id: "duty";
      prompt: string;
      eyebrow: string;
      answer: string;
      artifact: {
        kind: "duty";
        data: ReturnType<typeof calculateDutyCycle> & {
          process: "mig";
          inputVoltage: 120 | 240;
          amperage: number;
        };
      };
      sources: EvidenceSource[];
    }
  | {
      id: "tig";
      prompt: string;
      eyebrow: string;
      answer: string;
      artifact: { kind: "polarity"; data: ReturnType<typeof resolvePolarityLayout> };
      sources: EvidenceSource[];
    }
  | {
      id: "porosity";
      prompt: string;
      eyebrow: string;
      answer: string;
      artifact: { kind: "troubleshooting"; data: TroubleshootingCheck[] };
      sources: EvidenceSource[];
    };

const duty = {
  process: "mig" as const,
  inputVoltage: 240 as const,
  amperage: 200,
  ...calculateDutyCycle({ process: "mig", inputVoltage: 240, amperage: 200 }),
};
const tig = resolvePolarityLayout("tig");
const porosity = getPorosityChecklist("flux-core");

export const recordedScenarios: RecordedScenario[] = [
  {
    id: "duty",
    prompt: challengePrompts.duty,
    eyebrow: "Rated output · 240 V",
    answer:
      "At 200 A on 240 V, the rated duty cycle is 25%. In each ten-minute window, weld for no more than 2.5 minutes, then let the machine rest for 7.5 minutes with power on so the fan can cool it.",
    artifact: { kind: "duty", data: duty },
    sources: [
      withVisualEvidence({
        id: duty.sourceId,
        documentId: "owner-manual",
        documentTitle: "Owner's Manual",
        pdfPageNumber: 19,
        printedPageLabel: "19",
        section: "Duty Cycle (Duration of Use)",
        assetUrl: "/manual-pages/owner-manual/page-019.webp",
        excerpt: "240VAC: 25% use at 200A for 10 continuous minutes.",
      }),
    ],
  },
  {
    id: "porosity",
    prompt: challengePrompts.porosity,
    eyebrow: "Flux-core · diagnostic path",
    answer:
      "Start with polarity: gasless flux-core uses DCEN, with the ground clamp in positive and the wire-feed power cable in negative. Then check contamination, travel speed, contact-tip-to-work distance, and the condition of the wire. Shielding-gas checks apply to MIG, not gasless flux-core.",
    artifact: { kind: "troubleshooting", data: porosity },
    sources: [
      withVisualEvidence({
        id: "owner-manual:pdf-13",
        documentId: "owner-manual",
        documentTitle: "Owner's Manual",
        pdfPageNumber: 13,
        printedPageLabel: "13",
        section: "Flux-Cored Polarity Setup",
        assetUrl: "/manual-pages/owner-manual/page-013.webp",
        excerpt: "DCEN wire setup for flux-cored gasless welding.",
      }),
      withVisualEvidence({
        id: "owner-manual:pdf-37",
        documentId: "owner-manual",
        documentTitle: "Owner's Manual",
        pdfPageNumber: 37,
        printedPageLabel: "37",
        section: "Wire Weld — Porosity",
        assetUrl: "/manual-pages/owner-manual/page-037.webp",
        excerpt: "Possible causes include polarity, contamination, travel speed, and CTWD.",
      }),
    ],
  },
  {
    id: "tig",
    prompt: challengePrompts.tig,
    eyebrow: "TIG · DCEN setup",
    answer:
      "For TIG, connect the ground clamp to the positive (+) socket and the TIG torch cable to the negative (−) socket. Twist both connectors clockwise until fully locked before connecting power.",
    artifact: { kind: "polarity", data: tig },
    sources: [
      withVisualEvidence({
        id: tig.sourceId,
        documentId: "owner-manual",
        documentTitle: "Owner's Manual",
        pdfPageNumber: 24,
        printedPageLabel: "24",
        section: "TIG Setup",
        assetUrl: "/manual-pages/owner-manual/page-024.webp",
        excerpt: "Ground clamp in positive; TIG torch cable in negative.",
      }),
    ],
  },
];
