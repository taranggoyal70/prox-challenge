import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("evaluator documentation", () => {
  it("contains valid local links and documented npm scripts", () => {
    const result = spawnSync(process.execPath, ["scripts/check-docs.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain("Documentation valid:");
  });
});
