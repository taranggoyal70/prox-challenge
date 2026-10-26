import { describe, expect, it } from "vitest";

import { initialChatState, reduceAgentEvent } from "@/components/chat-state";
import type { AgentEvent } from "@/domain/agent-event";

describe("reduceAgentEvent", () => {
  it("keeps technical content hidden until a committed bundle arrives", () => {
    const start: AgentEvent = {
      v: 1,
      requestId: "req-1",
      seq: 0,
      type: "start",
      conversationId: "conv-1",
    };
    const status: AgentEvent = {
      v: 1,
      requestId: "req-1",
      seq: 1,
      type: "status",
      phase: "finding_evidence",
    };

    const running = reduceAgentEvent(reduceAgentEvent(initialChatState, start), status);
    expect(running.phase).toBe("finding_evidence");
    expect(running.answer).toBeNull();
    expect(running.artifacts).toEqual([]);
  });

  it("installs answer, artifacts, and sources atomically", () => {
    const committed: AgentEvent = {
      v: 1,
      requestId: "req-1",
      seq: 2,
      type: "committed_bundle",
      bundle: {
        answer: {
          kind: "answer",
          summary: "Use the documented TIG polarity.",
          claims: [
            {
              kind: "fact",
              predicateId: "polarity",
              args: { process: "tig" },
              sourceIds: ["owner-manual:pdf-25"],
            },
          ],
          artifactIds: ["tig-polarity"],
          sourceIds: ["owner-manual:pdf-25"],
          hazardLevel: "caution",
        },
        artifacts: [
          {
            id: "tig-polarity",
            kind: "polarity_diagram",
            title: "TIG polarity",
            summary: "Ground positive, torch negative.",
            sourceIds: ["owner-manual:pdf-25"],
            payloadHash: "a".repeat(64),
            computationReceiptId: "polarity:v1:tig",
            data: {
              process: "TIG",
              polarity: "DCEN",
              groundSocket: "positive",
              electrodeSocket: "negative",
              electrodeLabel: "TIG torch cable",
            },
          },
        ],
        sources: [
          {
            id: "owner-manual:pdf-25",
            documentId: "owner-manual",
            documentTitle: "Owner's Manual",
            pdfPageNumber: 25,
            printedPageLabel: "25",
            section: "TIG setup",
            assetUrl: "/manual-pages/owner-manual/page-025.webp",
            assetSha256: "b".repeat(64),
            textSha256: "c".repeat(64),
            excerpt: "Ground clamp positive; TIG torch negative.",
          },
        ],
        checksum: "d".repeat(64),
      },
    };

    const state = reduceAgentEvent(initialChatState, committed);
    expect(state.answer?.kind).toBe("answer");
    expect(state.artifacts).toHaveLength(1);
    expect(state.sources).toHaveLength(1);
    expect(state.phase).toBe("presenting");
  });
});
