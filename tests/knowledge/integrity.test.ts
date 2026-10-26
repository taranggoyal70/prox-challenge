import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { validateKnowledgePackage } from "@/knowledge/integrity";

describe("committed knowledge package", () => {
  it("has current source hashes, unique IDs, and every committed asset", () => {
    const root = process.cwd();
    const manifest = JSON.parse(
      readFileSync(join(root, "src/knowledge/generated/manifest.json"), "utf8"),
    );
    const visualEvidence = JSON.parse(
      readFileSync(join(root, "src/knowledge/generated/visual-evidence.json"), "utf8"),
    );

    expect(
      validateKnowledgePackage({ root, manifest, visualEvidence }),
    ).toEqual({ pages: 51, visualEvidence: expect.any(Number) });
  });
});
