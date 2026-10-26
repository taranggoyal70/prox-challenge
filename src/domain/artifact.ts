import { z } from "zod";

import {
  checksum,
  computeDutyCycle,
  computePolarity,
  computePorosityFlow,
} from "@/domain/computations";

const artifactBaseShape = {
  id: z.string().min(1).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(280),
};

export const artifactRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    ...artifactBaseShape,
    kind: z.literal("duty_cycle_timeline"),
    process: z.enum(["flux-core", "mig", "tig", "stick"]),
    inputVoltage: z.union([z.literal(120), z.literal(240)]),
    amperage: z.number().positive(),
  }),
  z.object({
    ...artifactBaseShape,
    kind: z.literal("polarity_diagram"),
    process: z.enum(["flux-core", "mig", "tig", "stick"]),
  }),
  z.object({
    ...artifactBaseShape,
    kind: z.literal("troubleshooting_flow"),
    issue: z.literal("porosity"),
    process: z.enum(["flux-core", "mig"]),
  }),
  z.object({
    ...artifactBaseShape,
    kind: z.literal("manual_evidence"),
    sourceIds: z.array(z.string().min(1)).min(1).max(6),
  }),
]);

export type ArtifactRequest = z.infer<typeof artifactRequestSchema>;

const artifactCommonShape = {
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  sourceIds: z.array(z.string()),
  payloadHash: z.string().length(64),
};

export const artifactSchema = z.discriminatedUnion("kind", [
  z.object({
    ...artifactCommonShape,
    kind: z.literal("duty_cycle_timeline"),
    computationReceiptId: z.string(),
    data: z.object({
      process: z.enum(["flux-core", "mig", "tig", "stick"]),
      inputVoltage: z.number(),
      amperage: z.number(),
      ratedPercent: z.number(),
      weldingMinutes: z.number(),
      restingMinutes: z.number(),
    }),
  }),
  z.object({
    ...artifactCommonShape,
    kind: z.literal("polarity_diagram"),
    computationReceiptId: z.string(),
    data: z.object({
      process: z.string(),
      polarity: z.enum(["DCEN", "DCEP"]),
      groundSocket: z.enum(["positive", "negative"]),
      electrodeSocket: z.enum(["positive", "negative"]),
      electrodeLabel: z.string(),
    }),
  }),
  z.object({
    ...artifactCommonShape,
    kind: z.literal("troubleshooting_flow"),
    computationReceiptId: z.string(),
    data: z.object({
      process: z.enum(["flux-core", "mig"]),
      steps: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          action: z.string(),
          sourceIds: z.array(z.string()),
        }),
      ),
    }),
  }),
  z.object({
    ...artifactCommonShape,
    kind: z.literal("manual_evidence"),
    computationReceiptId: z.null(),
    data: z.object({ sourceIds: z.array(z.string()) }),
  }),
]);

export type Artifact = z.infer<typeof artifactSchema>;

export function buildArtifact(input: ArtifactRequest): Artifact {
  const request = artifactRequestSchema.parse(input);
  let value: Omit<Artifact, "payloadHash">;

  switch (request.kind) {
    case "duty_cycle_timeline": {
      const receipt = computeDutyCycle({
        process: request.process,
        inputVoltage: request.inputVoltage,
        amperage: request.amperage,
      });
      value = {
        id: request.id,
        kind: request.kind,
        title: request.title,
        summary: request.summary,
        sourceIds: receipt.sourceIds,
        computationReceiptId: receipt.id,
        data: {
          process: request.process,
          inputVoltage: request.inputVoltage,
          amperage: request.amperage,
          ...receipt.output,
        },
      };
      break;
    }
    case "polarity_diagram": {
      const receipt = computePolarity(request.process);
      value = {
        id: request.id,
        kind: request.kind,
        title: request.title,
        summary: request.summary,
        sourceIds: receipt.sourceIds,
        computationReceiptId: receipt.id,
        data: receipt.output,
      };
      break;
    }
    case "troubleshooting_flow": {
      const receipt = computePorosityFlow(request.process);
      value = {
        id: request.id,
        kind: request.kind,
        title: request.title,
        summary: request.summary,
        sourceIds: receipt.sourceIds,
        computationReceiptId: receipt.id,
        data: receipt.output,
      };
      break;
    }
    case "manual_evidence":
      value = {
        id: request.id,
        kind: request.kind,
        title: "Verified manual evidence",
        summary: "Inspect the attached source pages and exact visual regions.",
        sourceIds: request.sourceIds,
        computationReceiptId: null,
        data: { sourceIds: request.sourceIds },
      };
      break;
  }

  return artifactSchema.parse({ ...value, payloadHash: checksum(value) });
}
