import {
  createSdkMcpServer,
  tool,
} from "@anthropic-ai/claude-agent-sdk/core";
import { z } from "zod";

import { answerEnvelopeSchema, type AnswerEnvelope } from "@/domain/answer-envelope";
import { artifactRequestSchema, type ArtifactRequest } from "@/domain/artifact";
import {
  computeDutyCycle,
  computePolarity,
  computePorosityFlow,
} from "@/domain/computations";
import { ArcLensError } from "@/domain/errors";
import { groundAnswerEnvelope } from "@/domain/grounding";
import type { RequestTransaction } from "@/domain/request-transaction";
import type { SearchHit, SourceRef } from "@/knowledge/schema";

export type KnowledgeGateway = {
  searchManual(query: string, options?: { limit?: number }): SearchHit[];
  getSource(id: string): SourceRef | undefined;
  getPageText(id: string): string | undefined;
  isSafetySource?(id: string): boolean;
};

type SearchInput = { query: string; limit?: number };
type PageInput = { sourceIds: string[] };
type FactInput = {
  kind: "duty_cycle" | "polarity" | "porosity";
  inputVoltage?: 120 | 240;
  amperage?: number;
  process?: "flux-core" | "mig" | "tig" | "stick";
};

export function createArcLensToolHandlers(input: {
  knowledge: KnowledgeGateway;
  transaction: RequestTransaction;
}) {
  return {
    searchManual(args: SearchInput) {
      const limit = Math.min(Math.max(args.limit ?? 6, 1), 10);
      return { hits: input.knowledge.searchManual(args.query, { limit }) };
    },

    getManualPages(args: PageInput) {
      const sources = args.sourceIds.map((sourceId) => {
        const source = input.knowledge.getSource(sourceId);
        if (!source) {
          throw new ArcLensError({
            code: "KNOWLEDGE_SOURCE_NOT_FOUND",
            status: 404,
            retryable: false,
            problem: "The requested manual evidence does not exist.",
            cause: `Source ${sourceId} is not in the verified knowledge package.`,
            fix: "Search the manual again and use only source IDs returned by ArcLens.",
            docsUrl: "/docs/errors#knowledge-source-not-found",
          });
        }
        return source;
      });
      return {
        sources: sources.map((source) => ({
          source,
          text: input.knowledge.getPageText(source.id)?.slice(0, 16_000),
        })),
      };
    },

    getProductFact(args: FactInput) {
      switch (args.kind) {
        case "duty_cycle":
          if (!args.process || !args.inputVoltage || args.amperage === undefined) {
            throw missingFactInput("process, inputVoltage, and amperage");
          }
          return { fact: computeDutyCycle({ process: args.process, inputVoltage: args.inputVoltage, amperage: args.amperage }) };
        case "polarity":
          if (!args.process) throw missingFactInput("process");
          return { fact: computePolarity(args.process) };
        case "porosity":
          if (args.process !== "flux-core" && args.process !== "mig") {
            throw missingFactInput("process (flux-core or mig)");
          }
          return { fact: computePorosityFlow(args.process) };
      }
    },

    presentArtifact(args: { artifact: ArtifactRequest }) {
      const artifact = input.transaction.stageArtifact(args.artifact);
      return {
        accepted: true as const,
        artifact,
      };
    },

    submitAnswer(args: { envelope: AnswerEnvelope }) {
      const envelope = answerEnvelopeSchema.parse(args.envelope);
      const grounded = groundAnswerEnvelope(envelope, {
        artifacts: input.transaction.stagedArtifacts,
        getSource: input.knowledge.getSource,
        getPageText: input.knowledge.getPageText,
        isSafetySource: input.knowledge.isSafetySource,
      });
      input.transaction.submitAnswer(grounded);
      return { accepted: true as const, kind: grounded.kind };
    },
  };
}

function missingFactInput(required: string): ArcLensError {
  return new ArcLensError({
    code: "FACT_INPUT_MISSING",
    status: 422,
    retryable: false,
    problem: "The deterministic fact lookup is missing required input.",
    cause: `This fact requires ${required}.`,
    fix: "Ask one clarification, then call get_product_fact with the documented input.",
    docsUrl: "/docs/errors#fact-input-missing",
  });
}

function mcpContent(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
  };
}

export function createArcLensMcpServer(input: {
  knowledge: KnowledgeGateway;
  transaction: RequestTransaction;
}) {
  const handlers = createArcLensToolHandlers(input);

  return createSdkMcpServer({
    name: "arclens",
    version: "1.0.0",
    instructions:
      "Search the verified manuals before answering. Use deterministic facts and artifacts, then finish with submit_answer.",
    alwaysLoad: true,
    timeout: 10_000,
    tools: [
      tool(
        "search_manual",
        "Search verified OmniPro manual text and visual captions. Returns ranked source IDs and excerpts.",
        {
          query: z.string().min(2).max(500),
          limit: z.number().int().min(1).max(10).optional(),
        },
        async (args) => mcpContent(handlers.searchManual(args)),
      ),
      tool(
        "get_manual_pages",
        "Resolve up to four source IDs to canonical page metadata, local visual assets, and bounded verified page text for exact evidence quotes.",
        { sourceIds: z.array(z.string().min(1)).min(1).max(4) },
        async (args) => mcpContent(handlers.getManualPages(args)),
      ),
      tool(
        "get_product_fact",
        "Compute a trusted duty-cycle, polarity, or porosity fact from normalized inputs.",
        {
          kind: z.enum(["duty_cycle", "polarity", "porosity"]),
          inputVoltage: z.union([z.literal(120), z.literal(240)]).optional(),
          amperage: z.number().positive().optional(),
          process: z.enum(["flux-core", "mig", "tig", "stick"]).optional(),
        },
        async (args) => mcpContent(handlers.getProductFact(args)),
      ),
      tool(
        "present_artifact",
        "Stage one validated visual program. Values are computed by ArcLens, not authored by the model.",
        { artifact: artifactRequestSchema },
        async (args) => mcpContent(handlers.presentArtifact(args)),
      ),
      tool(
        "submit_answer",
        "Submit the only answer, clarification, or abstention that may reach the user.",
        { envelope: answerEnvelopeSchema },
        async (args) => mcpContent(handlers.submitAnswer(args)),
      ),
    ],
  });
}
