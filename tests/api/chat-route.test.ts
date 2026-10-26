import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/chat/route";

const originalMode = process.env.ARCLENS_MODE;
const originalKey = process.env.ANTHROPIC_API_KEY;

afterEach(() => {
  if (originalMode === undefined) delete process.env.ARCLENS_MODE;
  else process.env.ARCLENS_MODE = originalMode;
  if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalKey;
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
});
