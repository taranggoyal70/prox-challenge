import type { AgentEvent, SourceCitation } from "@/domain/agent-event";
import type { AnswerEnvelope } from "@/domain/answer-envelope";
import type { Artifact } from "@/domain/artifact";

export type ChatPhase =
  | "idle"
  | "checking_context"
  | "finding_evidence"
  | "validating"
  | "presenting"
  | "done"
  | "cancelled"
  | "error";

export type ChatState = {
  requestId: string | null;
  conversationId: string | null;
  lastSequence: number;
  phase: ChatPhase;
  answer: AnswerEnvelope | null;
  artifacts: Artifact[];
  sources: SourceCitation[];
  error: Extract<AgentEvent, { type: "error" }>["error"] | null;
};

export const initialChatState: ChatState = {
  requestId: null,
  conversationId: null,
  lastSequence: -1,
  phase: "idle",
  answer: null,
  artifacts: [],
  sources: [],
  error: null,
};

export function reduceAgentEvent(state: ChatState, event: AgentEvent): ChatState {
  if (state.requestId === event.requestId && event.seq <= state.lastSequence) {
    return state;
  }

  const base = {
    ...state,
    requestId: event.requestId,
    lastSequence: event.seq,
  };

  switch (event.type) {
    case "start":
      return {
        ...initialChatState,
        requestId: event.requestId,
        conversationId: event.conversationId,
        lastSequence: event.seq,
        phase: "checking_context",
      };
    case "status":
      return { ...base, phase: event.phase };
    case "committed_bundle":
      return {
        ...base,
        phase: "presenting",
        answer: event.bundle.answer,
        artifacts: event.bundle.artifacts,
        sources: event.bundle.sources,
        error: null,
      };
    case "done":
      return {
        ...base,
        phase: "done",
        conversationId: event.conversationId,
      };
    case "cancelled":
      return { ...base, phase: "cancelled" };
    case "error":
      return { ...base, phase: "error", error: event.error };
  }
}
