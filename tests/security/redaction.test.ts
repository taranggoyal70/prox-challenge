import { describe, expect, it } from "vitest";

import { redactSensitive, sanitizeUserFacingText } from "@/security/redaction";

describe("security redaction", () => {
  it("redacts secret-bearing keys and values recursively", () => {
    const result = redactSensitive({
      apiKey: "sk-ant-secret-value",
      nested: {
        authorization: "Bearer hidden",
        image: "data:image/png;base64,AAAA",
        safe: "request-123",
      },
    });

    expect(result).toEqual({
      apiKey: "[REDACTED]",
      nested: {
        authorization: "[REDACTED]",
        image: "[REDACTED_IMAGE]",
        safe: "request-123",
      },
    });
  });

  it("removes bidirectional and non-printing controls from user-facing text", () => {
    expect(sanitizeUserFacingText("safe\u202Eexe.txt\u0000\nnext")).toBe(
      "safeexe.txt\nnext",
    );
  });
});
