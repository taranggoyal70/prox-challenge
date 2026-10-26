import { describe, expect, it } from "vitest";

import { buildCommittedEvents } from "@/domain/agent-event";
import { RequestTransaction } from "@/domain/request-transaction";

describe("buildCommittedEvents", () => {
  it("emits one atomic committed bundle before one terminal event", () => {
    const transaction = new RequestTransaction("req-events");
    const artifact = transaction.stageArtifact({
      id: "tig-layout",
      kind: "polarity_diagram",
      title: "TIG polarity",
      summary: "Ground positive, torch negative.",
      process: "tig",
    });
    if (artifact.kind !== "polarity_diagram") {
      throw new Error("expected a polarity artifact");
    }
    transaction.submitAnswer({
      kind: "answer",
      summary: "Connect the TIG torch negative and the ground clamp positive.",
      claims: [
        {
          kind: "calculation",
          receiptId: artifact.computationReceiptId,
          sourceIds: artifact.sourceIds,
        },
      ],
      artifactIds: [artifact.id],
      sourceIds: artifact.sourceIds,
      hazardLevel: "caution",
    });

    const events = buildCommittedEvents({
      requestId: "req-events",
      conversationId: "conversation-1",
      bundle: transaction.commit(),
      usage: { costUsd: 0.04, turns: 2, model: "claude-sonnet-5-5" },
    });

    expect(events.map((event) => event.type)).toEqual([
      "start",
      "status",
      "committed_bundle",
      "done",
    ]);
    expect(events.map((event) => event.seq)).toEqual([0, 1, 2, 3]);
    expect(events.filter((event) => ["done", "error", "cancelled"].includes(event.type))).toHaveLength(1);
  });
});
