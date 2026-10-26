import { describe, expect, it } from "vitest";

import { loadConfig } from "@/config";
import { buildReadiness } from "@/domain/readiness";

describe("buildReadiness", () => {
  it("treats recorded proof as a healthy no-key product", () => {
    const readiness = buildReadiness(loadConfig({}), {
      valid: true,
      corpusVersion: "owner-manual@test",
      schemaVersion: 1,
    });

    expect(readiness).toEqual({
      v: 1,
      ready: true,
      mode: "build-no-key",
      capabilities: {
        liveAnswers: false,
        expertMutation: false,
        recordedProof: true,
      },
      knowledge: {
        status: "valid",
        corpusVersion: "owner-manual@test",
        schemaVersion: 1,
      },
    });
  });

  it("fails readiness when the committed knowledge package is invalid", () => {
    const readiness = buildReadiness(loadConfig({}), {
      valid: false,
      corpusVersion: "unknown",
      schemaVersion: 1,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.knowledge.status).toBe("invalid");
  });
});
