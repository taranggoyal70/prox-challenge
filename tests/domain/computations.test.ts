import { describe, expect, it } from "vitest";

import {
  computeDutyCycle,
  computePolarity,
} from "@/domain/computations";

describe("deterministic computation receipts", () => {
  it("binds the documented duty-cycle result to versioned inputs and a checksum", () => {
    const receipt = computeDutyCycle({ process: "mig", inputVoltage: 240, amperage: 200 });

    expect(receipt).toMatchObject({
      id: "duty-cycle:v1:mig:240v:200a",
      computationId: "duty-cycle:v1",
      inputFactIds: ["duty:mig:240v:200a"],
      output: { ratedPercent: 25, weldingMinutes: 2.5, restingMinutes: 7.5 },
      sourceIds: ["owner-manual:pdf-19"],
    });
    expect(receipt.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(computeDutyCycle({ process: "mig", inputVoltage: 240, amperage: 200 }).checksum).toBe(
      receipt.checksum,
    );
  });

  it("binds polarity layout to a deterministic receipt", () => {
    expect(computePolarity("tig")).toMatchObject({
      id: "polarity:v1:tig",
      computationId: "polarity:v1",
      inputFactIds: ["polarity:tig"],
      output: {
        polarity: "DCEN",
        groundSocket: "positive",
        electrodeSocket: "negative",
      },
      sourceIds: ["owner-manual:pdf-24"],
    });
  });
});
