import { afterEach, describe, expect, it, vi } from "vitest";

const runnerMocks = vi.hoisted(() => ({
  prepare: vi.fn((input: unknown) => input),
  execute: vi.fn(),
}));

vi.mock("@/agent/runner", () => ({
  prepareAgentExecution: runnerMocks.prepare,
  executeAgentTurn: runnerMocks.execute,
}));

import { POST } from "@/app/api/chat/route";

const originalMode = process.env.ARCLENS_MODE;
const originalKey = process.env.ANTHROPIC_API_KEY;

afterEach(() => {
  if (originalMode === undefined) delete process.env.ARCLENS_MODE;
  else process.env.ARCLENS_MODE = originalMode;
  if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalKey;
  runnerMocks.prepare.mockClear();
  runnerMocks.execute.mockReset();
  vi.restoreAllMocks();
});

describe("POST /api/chat", () => {
  it("fails closed in no-key mode while preserving recorded proof", async () => {
    process.env.ARCLENS_MODE = "build-no-key";
    delete process.env.ANTHROPIC_API_KEY;

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "What polarity do I use for TIG?" }),
      }),
    );

    expect(response.status).toBe(409);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.json()).resolves.toMatchObject({
      v: 1,
      error: {
        code: "ARCLENS_LIVE_DISABLED",
        retryable: false,
        fix: expect.stringContaining("Recorded proof"),
      },
    });
  });

  it("rejects malformed input before provider work", async () => {
    process.env.ARCLENS_MODE = "live-local";
    process.env.ANTHROPIC_API_KEY = "sk-ant-example";

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "ARCLENS_REQUEST_INVALID" },
    });
  });

  it("resumes the server-mapped SDK session on the next turn", async () => {
    process.env.ARCLENS_MODE = "live-local";
    process.env.ANTHROPIC_API_KEY = "sk-ant-example";
    runnerMocks.execute
      .mockResolvedValueOnce(successResult("sdk-session-1"))
      .mockResolvedValueOnce(successResult("sdk-session-2"));
    const conversationId = "11111111-1111-4111-8111-111111111111";

    await consumeLiveResponse(conversationId, "First question");
    await consumeLiveResponse(conversationId, "Follow-up question");

    expect(runnerMocks.prepare).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ resumeSessionId: "sdk-session-1" }),
    );
  });

  it("rejects overlapping turns for the same conversation and releases on cancel", async () => {
    process.env.ARCLENS_MODE = "live-local";
    process.env.ANTHROPIC_API_KEY = "sk-ant-example";
    let rejectPending: ((error: Error) => void) | undefined;
    runnerMocks.execute.mockImplementation(() =>
      new Promise((_resolve, reject) => {
        rejectPending = reject;
      }),
    );
    const conversationId = "22222222-2222-4222-8222-222222222222";
    const controller = new AbortController();
    const first = await POST(liveRequest(conversationId, "First question", controller.signal));
    await vi.waitFor(() => expect(runnerMocks.execute).toHaveBeenCalledTimes(1));
    const overlap = await POST(liveRequest(conversationId, "Racing question"));

    expect(overlap.status).toBe(409);
    await expect(overlap.json()).resolves.toMatchObject({ error: { code: "ARCLENS_CONVERSATION_BUSY" } });
    controller.abort();
    rejectPending?.(new Error("cancelled by test"));
    expect(await first.text()).toContain('"type":"cancelled"');
  });

  it("emits a typed timeout and releases the conversation lease", async () => {
    process.env.ARCLENS_MODE = "live-local";
    process.env.ANTHROPIC_API_KEY = "sk-ant-example";
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(AbortSignal.abort());
    runnerMocks.execute.mockRejectedValueOnce(new Error("provider hung"));
    const conversationId = "33333333-3333-4333-8333-333333333333";

    const timedOut = await POST(liveRequest(conversationId, "Slow question"));
    expect(await timedOut.text()).toContain("ARCLENS_AGENT_TIMEOUT");

    timeoutSpy.mockRestore();
    runnerMocks.execute.mockResolvedValueOnce(successResult("sdk-session-after-timeout"));
    const retry = await POST(liveRequest(conversationId, "Retry question"));
    expect(retry.status).toBe(200);
    expect(await retry.text()).toContain('"type":"done"');
  });
});

function liveRequest(conversationId: string, question: string, signal?: AbortSignal) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ conversationId, question }),
    signal,
  });
}

async function consumeLiveResponse(conversationId: string, question: string) {
  const response = await POST(liveRequest(conversationId, question));
  expect(response.status).toBe(200);
  await response.text();
}

function successResult(sessionId: string) {
  return {
    sessionId,
    bundle: {
      answer: {
        kind: "clarification",
        question: "Which welding process and input voltage are you using?",
        reason: "Those setup details can change the documented answer.",
        choices: ["MIG", "Flux-core", "TIG", "Stick", "I’m not sure"],
      },
      artifacts: [],
      sourceIds: [],
      checksum: "c".repeat(64),
    },
    citations: [],
    usage: { costUsd: 0.01, turns: 1, model: "claude-sonnet-5-5" },
  };
}
