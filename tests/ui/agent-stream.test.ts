import { describe, expect, it } from "vitest";

import { readAgentEvents } from "@/components/agent-stream";

function streamFromChunks(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

describe("readAgentEvents", () => {
  it("parses NDJSON across arbitrary chunk boundaries", async () => {
    const start = JSON.stringify({
      v: 1,
      requestId: "req-1",
      seq: 0,
      type: "start",
      conversationId: "conv-1",
    });
    const status = JSON.stringify({
      v: 1,
      requestId: "req-1",
      seq: 1,
      type: "status",
      phase: "finding_evidence",
    });

    const events = [];
    for await (const event of readAgentEvents(
      streamFromChunks([`${start.slice(0, 23)}`, `${start.slice(23)}\n${status}\n`]),
    )) {
      events.push(event);
    }

    expect(events.map((event) => event.type)).toEqual(["start", "status"]);
  });

  it("rejects a truncated final event", async () => {
    const collect = async () => {
      for await (const _event of readAgentEvents(
        streamFromChunks(['{"v":1,"type":"start"']),
      )) {
        // The generator should throw before yielding the incomplete event.
        void _event;
      }
    };

    await expect(collect()).rejects.toThrow("truncated");
  });
});
