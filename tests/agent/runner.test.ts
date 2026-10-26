import { describe, expect, it } from "vitest";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk/core";

import {
  executeAgentTurn,
  prepareAgentExecution,
  type AgentQuery,
} from "@/agent/runner";
import type { KnowledgeGateway } from "@/agent/tools";
import type { ArcLensConfig } from "@/config";
import { ArcLensError } from "@/domain/errors";

const sha = "0".repeat(64);
const source = {
  id: "owner-manual:pdf-24",
  documentId: "owner-manual" as const,
  documentTitle: "OmniPro 220 Owner's Manual",
  pdfPageNumber: 24,
  printedPageLabel: "24",
  section: "TIG Setup",
  assetUrl: "/manual-pages/owner-manual/page-024.webp",
  assetSha256: sha,
  textSha256: sha,
};

const knowledge: KnowledgeGateway = {
  searchManual: () => [],
  getSource: (id) => (id === source.id ? source : undefined),
  getPageText: () => "Ground clamp in positive; TIG torch cable in negative.",
};

const config: ArcLensConfig = {
  mode: "live-local",
  model: "claude-sonnet-5-5",
  effort: "high",
  maxBudgetUsd: 0.75,
  anthropicApiKey: "sk-ant-example",
  capabilities: { liveAnswers: true, expertMutation: true, recordedProof: true },
};

describe("agent runner", () => {
  it("returns only the transaction bundle committed after a successful SDK turn", async () => {
    const execution = prepareAgentExecution({
      config,
      cwd: "/tmp/arclens-agent-test",
      knowledge,
      requestId: "request-runner",
    });
    const artifact = execution.handlers.presentArtifact({
      artifact: {
        id: "tig-layout",
        kind: "polarity_diagram",
        title: "TIG polarity",
        summary: "Ground positive, torch negative.",
        process: "tig",
      },
    }).artifact;
    if (artifact.kind !== "polarity_diagram") {
      throw new Error("expected a polarity artifact");
    }
    execution.handlers.submitAnswer({
      envelope: {
        kind: "answer",
        summary: "Ground positive; TIG torch negative.",
        claims: [
          {
            kind: "calculation",
            receiptId: artifact.computationReceiptId,
            sourceIds: artifact.sourceIds,
          },
        ],
        artifactIds: [artifact.id],
        sourceIds: artifact.sourceIds,
        hazardLevel: "caution",
      },
    });

    let closed = false;
    const fakeQuery = {
      async *[Symbol.asyncIterator]() {
        yield { type: "system", subtype: "init", session_id: "session-1" } as SDKMessage;
        yield {
          type: "result",
          subtype: "success",
          session_id: "session-1",
          is_error: false,
          result: "ignored free-form text",
          total_cost_usd: 0.03,
          num_turns: 2,
          modelUsage: {},
        } as unknown as SDKMessage;
      },
      close() {
        closed = true;
      },
    } satisfies AgentQuery;

    const result = await executeAgentTurn({
      execution,
      prompt: "How do I connect TIG?",
      queryFactory: () => fakeQuery,
    });

    expect(result.sessionId).toBe("session-1");
    expect(result.bundle.artifacts).toHaveLength(1);
    expect(result.citations).toEqual([source]);
    expect(result.usage).toEqual({
      costUsd: 0.03,
      turns: 2,
      model: "claude-sonnet-5-5",
    });
    expect(closed).toBe(true);
  });

  it("does not expose raw provider error text through the public error cause", async () => {
    const execution = prepareAgentExecution({
      config,
      cwd: "/tmp/arclens-agent-test",
      knowledge,
      requestId: "request-provider-error",
    });
    const fakeQuery = {
      async *[Symbol.asyncIterator]() {
        yield {
          type: "result",
          subtype: "error_during_execution",
          session_id: "session-error",
          is_error: true,
          errors: ["provider echoed sk-ant-sensitive"],
          total_cost_usd: 0,
          num_turns: 1,
          modelUsage: {},
        } as unknown as SDKMessage;
      },
      close() {},
    } satisfies AgentQuery;

    try {
      await executeAgentTurn({
        execution,
        prompt: "Fail safely",
        queryFactory: () => fakeQuery,
      });
      throw new Error("expected executeAgentTurn to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ArcLensError);
      expect((error as ArcLensError).cause).not.toContain("sk-ant-sensitive");
      expect((error as ArcLensError).cause).toContain("error_during_execution");
    }
  });
});
