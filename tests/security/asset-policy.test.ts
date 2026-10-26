import { describe, expect, it } from "vitest";

import {
  assertTrustedLocalAssetUrl,
  trustedManualPdfUrl,
} from "@/security/assets";

describe("trusted local assets", () => {
  it.each([
    "/manual-pages/owner-manual/page-019.webp",
    "/manual-regions/tig-polarity.webp",
    "/manuals/owner-manual.pdf",
  ])("accepts allowlisted generated assets: %s", (url) => {
    expect(assertTrustedLocalAssetUrl(url)).toBe(url);
  });

  it.each([
    "https://example.com/manual.png",
    "//example.com/manual.png",
    "/manual-pages/../../etc/passwd",
    "/api/ready",
    "/manuals/owner-manual.svg",
  ])("rejects model-authored or traversal-shaped URLs: %s", (url) => {
    expect(() => assertTrustedLocalAssetUrl(url)).toThrow();
  });

  it("maps canonical document IDs to allowlisted PDF names", () => {
    expect(trustedManualPdfUrl("owner-manual")).toBe("/manuals/owner-manual.pdf");
    expect(trustedManualPdfUrl("quick-start")).toBe(
      "/manuals/quick-start-guide.pdf",
    );
    expect(trustedManualPdfUrl("selection-chart")).toBe(
      "/manuals/selection-chart.pdf",
    );
  });
});
