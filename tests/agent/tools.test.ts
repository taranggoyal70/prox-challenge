import { describe, expect, it } from "vitest";

import { createArcLensToolHandlers } from "@/agent/tools";
import { RequestTransaction } from "@/domain/request-transaction";
import type { KnowledgeGateway } from "@/agent/tools";

const sha = "0".repeat(64);
const source = {
  id: "owner-manual:pdf-19",
  documentId: "owner-manual" as const,
  documentTitle: "OmniPro 220 Owner's Manual",
  pdfPageNumber: 19,
  printedPageLabel: "19",
  section: "Duty Cycle",
  assetUrl: "/manual-pages/owner-manual/page-019.webp",
  assetSha256: sha,
  textSha256: sha,
};

const knowledge: KnowledgeGateway = {
  searchManual: () => [
    {
      source,
      excerpt: "240VAC: 25% use at 200A for 10 continuous minutes.",
      score: 12,
      matchedTerms: ["duty", "cycle", "200a"],
      visualEvidenceIds: ["duty-cycle-page-19"],
    },
  ],
  getSource: (id) => (id === source.id ? source : undefined),
  getPageText: (id) => id === source.id ? "240VAC: 25% use at 200A for 10 continuous minutes." : undefined,
};

describe("ArcLens tool handlers", () => {
  it("returns ranked source evidence without exposing filesystem access", () => {
    const transaction = new RequestTransaction("tools-1");
    const handlers = createArcLensToolHandlers({ knowledge, transaction });

    expect(handlers.searchManual({ query: "duty cycle 200A", limit: 4 })).toEqual({
      hits: [
        expect.objectContaining({
          source,
          score: 12,
          visualEvidenceIds: ["duty-cycle-page-19"],
        }),
      ],
    });
  });

  it("returns bounded page text so general answers can quote verified evidence", () => {
    const handlers = createArcLensToolHandlers({ knowledge, transaction: new RequestTransaction("tools-pages") });
    expect(handlers.getManualPages({ sourceIds: [source.id] })).toEqual({
      sources: [{ source, text: "240VAC: 25% use at 200A for 10 continuous minutes." }],
    });
  });

  it("stages a deterministic artifact and accepts a matching answer", () => {
    const transaction = new RequestTransaction("tools-2");
    const handlers = createArcLensToolHandlers({ knowledge, transaction });
    const artifact = handlers.presentArtifact({
      artifact: {
        id: "duty-200a",
        kind: "duty_cycle_timeline",
        title: "200 A duty cycle",
        summary: "Weld 2.5 minutes, then rest 7.5 minutes.",
        process: "mig",
        inputVoltage: 240,
        amperage: 200,
      },
    });
    if (artifact.artifact.kind !== "duty_cycle_timeline") {
      throw new Error("expected a duty-cycle artifact");
    }

    const receipt = handlers.submitAnswer({
      envelope: {
        kind: "answer",
        summary: "The rated duty cycle is 25%.",
        claims: [
          {
            kind: "calculation",
            receiptId: artifact.artifact.computationReceiptId,
            sourceIds: artifact.artifact.sourceIds,
          },
        ],
        artifactIds: [artifact.artifact.id],
        sourceIds: artifact.artifact.sourceIds,
        hazardLevel: "caution",
      },
    });

    expect(receipt).toEqual({ accepted: true, kind: "answer" });
    expect(transaction.commit().artifacts).toHaveLength(1);
  });

  it("returns deterministic product facts", () => {
    const transaction = new RequestTransaction("tools-3");
    const handlers = createArcLensToolHandlers({ knowledge, transaction });

    expect(
      handlers.getProductFact({
        kind: "polarity",
        process: "flux-core",
      }),
    ).toMatchObject({
      fact: {
        computationId: "polarity:v1",
        output: {
          process: "Flux-cored (gasless)",
          polarity: "DCEN",
          groundSocket: "positive",
          electrodeSocket: "negative",
        },
      },
    });
  });
});
