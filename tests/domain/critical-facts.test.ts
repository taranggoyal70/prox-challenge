import { describe, expect, it } from "vitest";

import {
  calculateDutyCycle,
  getPorosityChecklist,
  resolvePolarityLayout,
} from "@/domain/critical-facts";

describe("OmniPro critical facts", () => {
  it("calculates the documented 240V MIG duty cycle at 200A", () => {
    expect(calculateDutyCycle({ process: "mig", inputVoltage: 240, amperage: 200 })).toEqual({
      ratedPercent: 25,
      weldingMinutes: 2.5,
      restingMinutes: 7.5,
      sourceId: "owner-manual:pdf-19",
      computationId: "duty-cycle:v1",
    });
  });

  it("keeps process-specific ratings distinct at the same amperage", () => {
    expect(calculateDutyCycle({ process: "tig", inputVoltage: 240, amperage: 175 }).ratedPercent).toBe(30);
    expect(calculateDutyCycle({ process: "stick", inputVoltage: 240, amperage: 175 }).ratedPercent).toBe(25);
  });

  it("returns DCEN for gasless flux-cored welding", () => {
    expect(resolvePolarityLayout("flux-core")).toMatchObject({
      polarity: "DCEN",
      groundSocket: "positive",
      electrodeSocket: "negative",
      electrodeLabel: "Wire feed power cable",
      sourceId: "owner-manual:pdf-13",
    });
  });

  it("returns the documented TIG socket layout", () => {
    expect(resolvePolarityLayout("tig")).toMatchObject({
      polarity: "DCEN",
      groundSocket: "positive",
      electrodeSocket: "negative",
      electrodeLabel: "TIG torch cable",
      sourceId: "owner-manual:pdf-24",
    });
  });

  it("keeps MIG-only gas checks out of the flux-core checklist", () => {
    const checklist = getPorosityChecklist("flux-core");

    expect(checklist.map((item) => item.id)).toEqual([
      "polarity",
      "surface-contamination",
      "travel-speed",
      "ctwd",
      "wire-contamination",
    ]);
    expect(checklist.every((item) => item.sourceIds.length > 0)).toBe(true);
  });
});
