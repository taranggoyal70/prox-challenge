import { describe, expect, it } from "vitest";

import { sourceRefSchema } from "@/knowledge/schema";

describe("SourceRef", () => {
  it("accepts the canonical one-based owner-manual identity", () => {
    expect(
      sourceRefSchema.parse({
        id: "owner-manual:pdf-19",
        documentId: "owner-manual",
        documentTitle: "Vulcan OmniPro 220 Owner's Manual",
        pdfPageNumber: 19,
        printedPageLabel: "19",
        section: "Duty Cycle (Duration of Use)",
        assetUrl: "/manual-pages/owner-manual/page-019.webp",
        assetSha256: "a".repeat(64),
        textSha256: "b".repeat(64),
      }),
    ).toMatchObject({ pdfPageNumber: 19, printedPageLabel: "19" });
  });

  it("rejects page zero and out-of-bounds regions", () => {
    expect(() =>
      sourceRefSchema.parse({
        id: "owner-manual:pdf-0",
        documentId: "owner-manual",
        documentTitle: "Vulcan OmniPro 220 Owner's Manual",
        pdfPageNumber: 0,
        printedPageLabel: null,
        section: "cover",
        assetUrl: "/manual-pages/owner-manual/page-000.webp",
        assetSha256: "a".repeat(64),
        textSha256: "b".repeat(64),
        region: { x: 0.9, y: 0.9, width: 0.2, height: 0.2 },
      }),
    ).toThrow();
  });
});
