import { z } from "zod";

import { answerEnvelopeSchema } from "@/domain/answer-envelope";
import { artifactSchema } from "@/domain/artifact";
import type { CommittedBundle } from "@/domain/request-transaction";

const base = {
  v: z.literal(1),
  requestId: z.string().min(1),
  seq: z.number().int().nonnegative(),
};

export const sourceCitationSchema = z.object({
  id: z.string(),
  documentId: z.enum(["owner-manual", "quick-start", "selection-chart"]),
  documentTitle: z.string(),
  pdfPageNumber: z.number().int().positive(),
  printedPageLabel: z.string().nullable(),
  section: z.string(),
  assetUrl: z.string().startsWith("/manual-pages/"),
  assetSha256: z.string(),
  textSha256: z.string(),
  region: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().positive().max(1),
      height: z.number().positive().max(1),
    })
    .optional(),
  excerpt: z.string().optional(),
});

export type SourceCitation = z.infer<typeof sourceCitationSchema>;

export const agentEventSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("start"), conversationId: z.string() }),
  z.object({
    ...base,
    type: z.literal("status"),
    phase: z.enum(["checking_context", "finding_evidence", "validating", "presenting"]),
  }),
  z.object({
    ...base,
    type: z.literal("committed_bundle"),
    bundle: z.object({
      answer: answerEnvelopeSchema,
      artifacts: z.array(artifactSchema),
      sources: z.array(sourceCitationSchema),
      checksum: z.string().length(64),
    }),
  }),
  z.object({
    ...base,
    type: z.literal("done"),
    conversationId: z.string(),
    usage: z.object({
      costUsd: z.number().nonnegative(),
      turns: z.number().int().nonnegative(),
      model: z.string(),
    }),
  }),
  z.object({ ...base, type: z.literal("cancelled") }),
  z.object({
    ...base,
    type: z.literal("error"),
    error: z.object({
      code: z.string(),
      problem: z.string(),
      cause: z.string(),
      fix: z.string(),
      docsUrl: z.string(),
      retryable: z.boolean(),
    }),
  }),
]);

export type AgentEvent = z.infer<typeof agentEventSchema>;

export function parseAgentEvent(value: unknown): AgentEvent {
  return agentEventSchema.parse(value);
}

export function buildCommittedEvents(input: {
  requestId: string;
  conversationId: string;
  bundle: CommittedBundle;
  citations?: SourceCitation[];
  usage: { costUsd: number; turns: number; model: string };
}): AgentEvent[] {
  const events: AgentEvent[] = [
    {
      v: 1,
      requestId: input.requestId,
      seq: 0,
      type: "start",
      conversationId: input.conversationId,
    },
    {
      v: 1,
      requestId: input.requestId,
      seq: 1,
      type: "status",
      phase: "presenting",
    },
    {
      v: 1,
      requestId: input.requestId,
      seq: 2,
      type: "committed_bundle",
      bundle: {
        answer: input.bundle.answer,
        artifacts: input.bundle.artifacts,
        sources: input.citations ?? [],
        checksum: input.bundle.checksum,
      },
    },
    {
      v: 1,
      requestId: input.requestId,
      seq: 3,
      type: "done",
      conversationId: input.conversationId,
      usage: input.usage,
    },
  ];
  return events.map((event) => agentEventSchema.parse(event));
}
