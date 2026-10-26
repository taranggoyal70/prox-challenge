import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { z } from "zod";

import { executeAgentTurn, prepareAgentExecution } from "@/agent/runner";
import { loadConfig } from "@/config";
import { agentEventSchema, type AgentEvent } from "@/domain/agent-event";
import { ArcLensError } from "@/domain/errors";
import { getPageText, getSource, isSafetySource, searchManual } from "@/knowledge";

const requestSchema = z.object({
  question: z.string().trim().min(2).max(4_000),
  conversationId: z.string().uuid().optional(),
});

const commonHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

type StripTransport<T> = T extends AgentEvent
  ? Omit<T, "v" | "requestId" | "seq">
  : never;
type AgentEventPayload = StripTransport<AgentEvent>;

const sessions = new Map<string, string>();
const activeConversations = new Set<string>();
const maxLocalSessions = 100;
const agentTimeoutMs = 45_000;

function rememberSession(conversationId: string, sessionId: string) {
  sessions.delete(conversationId);
  sessions.set(conversationId, sessionId);
  while (sessions.size > maxLocalSessions) {
    const oldest = sessions.keys().next().value;
    if (!oldest) break;
    sessions.delete(oldest);
  }
}

export async function POST(request: Request) {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    return errorResponse(asArcLensError(error));
  }

  if (!config.capabilities.liveAnswers) {
    return errorResponse(
      new ArcLensError({
        code: "ARCLENS_LIVE_DISABLED",
        status: 409,
        retryable: false,
        problem: "Live answers are disabled in build-no-key mode.",
        cause: "This mode never starts provider work or spends API credits.",
        fix: "Open Recorded proof now, or configure ANTHROPIC_API_KEY and ARCLENS_MODE=live-local.",
        docsUrl: "/docs/errors#arclens-live-disabled",
      }),
    );
  }

  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await request.json());
  } catch {
    return errorResponse(
      new ArcLensError({
        code: "ARCLENS_REQUEST_INVALID",
        status: 400,
        retryable: false,
        problem: "ArcLens could not read this question.",
        cause: "The request must contain a question between 2 and 4,000 characters.",
        fix: "Edit the question and submit it again.",
        docsUrl: "/docs/errors#arclens-request-invalid",
      }),
    );
  }

  const requestId = randomUUID();
  const conversationId = input.conversationId ?? randomUUID();
  if (activeConversations.has(conversationId)) {
    return errorResponse(new ArcLensError({
      code: "ARCLENS_CONVERSATION_BUSY",
      status: 409,
      retryable: true,
      problem: "This conversation already has a turn in progress.",
      cause: "ArcLens serializes turns so context and provider spend cannot race.",
      fix: "Wait for the current turn to finish or cancel it before retrying.",
      docsUrl: "/docs/errors#arclens-conversation-busy",
    }));
  }
  activeConversations.add(conversationId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void (async () => {
      let seq = 0;
      const emit = (event: AgentEventPayload) => {
        const parsed = agentEventSchema.parse({
          ...event,
          v: 1,
          requestId,
          seq: seq++,
        });
        controller.enqueue(encoder.encode(`${JSON.stringify(parsed)}\n`));
      };

      emit({ type: "start", conversationId });
      emit({ type: "status", phase: "checking_context" });
      emit({ type: "status", phase: "finding_evidence" });

      const timeoutSignal = AbortSignal.timeout(agentTimeoutMs);
      const executionSignal = AbortSignal.any([request.signal, timeoutSignal]);
      let cwd: string | undefined;
      try {
        cwd = await mkdtemp(join(tmpdir(), "arclens-agent-"));
        const execution = prepareAgentExecution({
          config,
          cwd,
          knowledge: { searchManual, getSource, getPageText, isSafetySource },
          requestId,
          resumeSessionId: sessions.get(conversationId),
        });
        const result = await executeAgentTurn({
          execution,
          prompt: `Answer this OmniPro 220 question using only verified ArcLens tools: ${input.question}`,
          signal: executionSignal,
        });
        rememberSession(conversationId, result.sessionId);

        emit({ type: "status", phase: "validating" });
        emit({
          type: "committed_bundle",
          bundle: {
            answer: result.bundle.answer,
            artifacts: result.bundle.artifacts,
            sources: result.citations,
            checksum: result.bundle.checksum,
          },
        });
        emit({ type: "done", conversationId, usage: result.usage });
      } catch (error) {
        if (request.signal.aborted) emit({ type: "cancelled" });
        else if (timeoutSignal.aborted) emit({
          type: "error",
          error: new ArcLensError({
            code: "ARCLENS_AGENT_TIMEOUT",
            status: 504,
            retryable: true,
            problem: "ArcLens could not finish within 45 seconds.",
            cause: "The provider or validation pipeline exceeded the bounded request deadline.",
            fix: "Retry with a narrower question; no partial answer was committed.",
            docsUrl: "/docs/errors#arclens-agent-timeout",
          }).toJSON(),
        });
        else emit({ type: "error", error: asArcLensError(error).toJSON() });
      } finally {
        if (cwd) await rm(cwd, { recursive: true, force: true });
        activeConversations.delete(conversationId);
        controller.close();
      }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      ...commonHeaders,
      "Content-Type": "application/x-ndjson; charset=utf-8",
    },
  });
}

function errorResponse(error: ArcLensError) {
  return Response.json(
    { v: 1, error: error.toJSON() },
    { status: error.status, headers: commonHeaders },
  );
}

function asArcLensError(error: unknown): ArcLensError {
  if (error instanceof ArcLensError) return error;
  return new ArcLensError({
    code: "ARCLENS_INTERNAL_ERROR",
    status: 500,
    retryable: false,
    problem: "ArcLens hit an internal error before it could answer.",
    cause: "An unexpected local error interrupted the request.",
    fix: "Run npm run doctor, then retry. Use the request ID when reporting a repeat failure.",
    docsUrl: "/docs/errors#arclens-internal-error",
  });
}
