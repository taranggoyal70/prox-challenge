import { describe, expect, it } from "vitest";

import { getPage, searchManual } from "@/knowledge";

describe("manual knowledge search", () => {
  it("finds the image-only process selection chart", () => {
    const [hit] = searchManual("which welding process for aluminum with gas", {
      limit: 3,
    });

    expect(hit?.source.documentId).toBe("selection-chart");
    expect(hit?.visualEvidenceIds).toContain("selection-chart:process-matrix");
  });

  it("finds the wiring schematic through curated visual aliases", () => {
    const hits = searchManual("MCU remote board fan solenoid wiring schematic", {
      limit: 5,
    });

    expect(hits.some((hit) => hit.source.id === "owner-manual:pdf-45")).toBe(true);
    expect(
      hits.flatMap((hit) => hit.visualEvidenceIds),
    ).toContain("owner-manual:pdf-45:wiring-schematic");
  });

  it("returns the exact polarity page for gasless flux-core", () => {
    const [hit] = searchManual("flux core DCEN ground positive wire feed negative", {
      limit: 1,
    });

    expect(hit?.source.id).toBe("owner-manual:pdf-13");
  });

  it("prioritizes the exact troubleshooting row for wire feeding without an arc", () => {
    const [hit] = searchManual("why does wire feed but arc not ignite", { limit: 3 });
    expect(hit?.source.id).toBe("owner-manual:pdf-43");
  });

  it("prioritizes the porosity diagnosis table over generic wire pages", () => {
    const [hit] = searchManual("porosity in the weld metal diagnosis", { limit: 3 });
    expect(hit?.source.id).toBe("owner-manual:pdf-43");
  });

  it("returns undefined instead of accepting a zero-based page", () => {
    expect(getPage("owner-manual", 0)).toBeUndefined();
    expect(getPage("owner-manual", 48)?.source.id).toBe("owner-manual:pdf-48");
  });
});
