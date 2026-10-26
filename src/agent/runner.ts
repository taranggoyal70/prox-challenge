import {
  query,
  type Options,
  type SDKMessage,
  type SDKResultMessage,
} from "@anthropic-ai/claude-agent-sdk/core";

import { buildAgentOptions } from "@/agent/options";
import {
  createArcLensMcpServer,
  createArcLensToolHandlers,
  type KnowledgeGateway,
} from "@/agent/tools";
import type { ArcLensConfig } from "@/config";
import { ArcLensError } from "@/domain/errors";
import { RequestTransaction, type CommittedBundle } from "@/domain/request-transaction";
import type { SourceRef } from "@/knowledge/schema";

export type AgentQuery = AsyncIterable<SDKMessage> & { close(): void };
export type AgentQueryFactory = (params: {
  prompt: string;
  options?: Options;
}) => AgentQuery;

export type AgentExecution = {
  config: ArcLensConfig;
  knowledge: KnowledgeGateway;
  transaction: RequestTransaction;
  handlers: ReturnType<typeof createArcLensToolHandlers>;
  options: Options;
};

export function prepareAgentExecution(input: {
  config: ArcLensConfig;
  cwd: string;
  knowledge: KnowledgeGateway;
  requestId: string;
  resumeSessionId?: string;
}): AgentExecution {
  const transaction = new RequestTransaction(input.requestId);
  const handlers = createArcLensToolHandlers({
    knowledge: input.knowledge,
    transaction,
  });
  const mcpServer = createArcLensMcpServer({
    knowledge: input.knowledge,
    transaction,
  });

  return {
    config: input.config,
    knowledge: input.knowledge,
    transaction,
    handlers,
    options: buildAgentOptions({
      config: input.config,
      cwd: input.cwd,
      mcpServer,
      resumeSessionId: input.resumeSessionId,
    }),
  };
}

export async function executeAgentTurn(input: {
  execution: AgentExecution;
  prompt: string;
  queryFactory?: AgentQueryFactory;
  signal?: AbortSignal;
}): Promise<{
  sessionId: string;
  bundle: CommittedBundle;
  citations: SourceRef[];
  usage: { costUsd: number; turns: number; model: string };
}> {
  const queryFactory = input.queryFactory ?? ((params) => query(params));
  const agentQuery = queryFactory({
    prompt: input.prompt,
    options: input.execution.options,
  });
  let sessionId: string | undefined;
  let result: SDKResultMessage | undefined;
  const abort = () => agentQuery.close();

  if (input.signal?.aborted) abort();
  else input.signal?.addEventListener("abort", abort, { once: true });

  try {
    for await (const message of agentQuery) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      if (message.type === "result") result = message;
    }

    if (!result) {
      throw agentFailure(
        "AGENT_RESULT_MISSING",
        "The Agent SDK ended without a result message.",
        "Retry once, then inspect the SDK subprocess logs.",
      );
    }
    if (result.subtype !== "success" || result.is_error) {
      throw agentFailure(
        "AGENT_EXECUTION_FAILED",
        `The Agent SDK ended with ${result.subtype}${result.terminal_reason ? ` (${result.terminal_reason})` : ""}.`,
        result.subtype === "error_max_budget_usd"
          ? "Reduce the request or raise the budget within the configured safety cap."
          : "Retry if the provider failure is transient; otherwise inspect the request ID and SDK diagnostics.",
      );
    }

    const bundle = input.execution.transaction.commit();
    const citations = bundle.sourceIds.map((sourceId) => {
      const source = input.execution.knowledge.getSource(sourceId);
      if (!source) {
        throw agentFailure(
          "ANSWER_SOURCE_UNKNOWN",
          `The validated answer references unknown source ${sourceId}.`,
          "Search again and submit only source IDs returned by the verified knowledge package.",
        );
      }
      return source;
    });

    return {
      sessionId: sessionId ?? result.session_id,
      bundle,
      citations,
      usage: {
        costUsd: result.total_cost_usd,
        turns: result.num_turns,
        model: input.execution.config.model,
      },
    };
  } catch (error) {
    input.execution.transaction.abort();
    throw error;
  } finally {
    input.signal?.removeEventListener("abort", abort);
    agentQuery.close();
  }
}

function agentFailure(code: string, cause: string, fix: string): ArcLensError {
  return new ArcLensError({
    code,
    status: 502,
    retryable: true,
    problem: "ArcLens could not complete a validated answer.",
    cause,
    fix,
    docsUrl: `/docs/errors#${code.toLowerCase().replaceAll("_", "-")}`,
  });
}
