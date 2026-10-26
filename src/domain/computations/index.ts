import { createHash } from "node:crypto";

import {
  calculateDutyCycle,
  getPorosityChecklist,
  resolvePolarityLayout,
  type WeldingProcess,
} from "@/domain/critical-facts";

export type ComputationReceipt<TOutput = unknown> = {
  id: string;
  computationId: string;
  inputFactIds: string[];
  normalizedInputs: Record<string, string | number | boolean>;
  output: TOutput;
  sourceIds: string[];
  checksum: string;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function checksum(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function withChecksum<TOutput>(
  value: Omit<ComputationReceipt<TOutput>, "checksum">,
): ComputationReceipt<TOutput> {
  return { ...value, checksum: checksum(value) };
}

export function computeDutyCycle(input: {
  process: WeldingProcess;
  inputVoltage: 120 | 240;
  amperage: number;
}) {
  const result = calculateDutyCycle(input);
  const output = {
    ratedPercent: result.ratedPercent,
    weldingMinutes: result.weldingMinutes,
    restingMinutes: result.restingMinutes,
  };

  return withChecksum({
    id: `duty-cycle:v1:${input.process}:${input.inputVoltage}v:${input.amperage}a`,
    computationId: "duty-cycle:v1",
    inputFactIds: [`duty:${input.process}:${input.inputVoltage}v:${input.amperage}a`],
    normalizedInputs: input,
    output,
    sourceIds: [result.sourceId],
  });
}

export function computePolarity(process: WeldingProcess) {
  const result = resolvePolarityLayout(process);
  const output = {
    process: result.process,
    polarity: result.polarity,
    groundSocket: result.groundSocket,
    electrodeSocket: result.electrodeSocket,
    electrodeLabel: result.electrodeLabel,
  };

  return withChecksum({
    id: `polarity:v1:${process}`,
    computationId: "polarity:v1",
    inputFactIds: [`polarity:${process}`],
    normalizedInputs: { process },
    output,
    sourceIds: [result.sourceId],
  });
}

export function computePorosityFlow(process: "flux-core" | "mig") {
  const steps = getPorosityChecklist(process);
  const sourceIds = [...new Set(steps.flatMap((step) => step.sourceIds))];

  return withChecksum({
    id: `porosity:v1:${process}`,
    computationId: "porosity:v1",
    inputFactIds: [`porosity:${process}`, `polarity:${process}`],
    normalizedInputs: { process },
    output: { process, steps },
    sourceIds,
  });
}
