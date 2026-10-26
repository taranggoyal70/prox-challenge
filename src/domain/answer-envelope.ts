import { z } from "zod";

const sourceIds = z.array(z.string().min(1)).min(1);

export const claimSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("fact"),
    predicateId: z.enum(["duty_cycle", "polarity", "porosity", "safety"]),
    args: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    sourceIds,
  }),
  z.object({
    kind: z.literal("calculation"),
    receiptId: z.string().min(1),
    sourceIds,
  }),
  z.object({
    kind: z.literal("procedure"),
    procedureId: z.string().min(1),
    stepIds: z.array(z.string().min(1)).min(1),
    sourceIds,
  }),
  z.object({
    kind: z.literal("prose"),
    text: z.string().min(1).max(1200),
    sourceIds,
    evidence: z
      .array(
        z.object({
          sourceId: z.string().min(1),
          quote: z.string().min(8).max(1600),
        }),
      )
      .min(1)
      .max(8),
  }),
]);

export const answerEnvelopeSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("answer"),
    summary: z.string().min(1).max(1200),
    claims: z.array(claimSchema).min(1).max(20),
    artifactIds: z.array(z.string()).max(2),
    sourceIds,
    hazardLevel: z.enum(["none", "reminder", "caution", "stop"]),
  }),
  z.object({
    kind: z.literal("clarification"),
    question: z.string().min(1).max(400),
    reason: z.string().min(1).max(400),
    choices: z.array(z.string().min(1).max(120)).max(6).optional(),
  }),
  z.object({
    kind: z.literal("abstention"),
    reason: z.string().min(1).max(800),
    missingEvidence: z.array(z.string().min(1)).min(1).max(8),
    nextAction: z.string().min(1).max(400),
  }),
]);

export type Claim = z.infer<typeof claimSchema>;
export type AnswerEnvelope = z.infer<typeof answerEnvelopeSchema>;
