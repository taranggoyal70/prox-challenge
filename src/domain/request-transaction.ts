import { z } from "zod";

import { answerEnvelopeSchema, type AnswerEnvelope } from "@/domain/answer-envelope";
import {
  artifactRequestSchema,
  buildArtifact,
  type Artifact,
  type ArtifactRequest,
} from "@/domain/artifact";
import { checksum } from "@/domain/computations";
import { ArcLensError } from "@/domain/errors";

export type TransactionState = "open" | "committed" | "aborted";

export type CommittedBundle = {
  requestId: string;
  answer: AnswerEnvelope;
  artifacts: Artifact[];
  sourceIds: string[];
  checksum: string;
};

export class RequestTransaction {
  readonly requestId: string;
  #state: TransactionState = "open";
  #artifacts = new Map<string, Artifact>();
  #answer?: AnswerEnvelope;

  constructor(requestId: string) {
    this.requestId = z.string().min(1).parse(requestId);
  }

  get state(): TransactionState {
    return this.#state;
  }

  get stagedArtifacts(): Artifact[] {
    return [...this.#artifacts.values()];
  }

  stageArtifact(input: ArtifactRequest): Artifact {
    this.#assertOpen();
    const artifact = buildArtifact(artifactRequestSchema.parse(input));
    const existing = this.#artifacts.get(artifact.id);
    if (existing) {
      if (existing.payloadHash === artifact.payloadHash) {
        return existing;
      }
      throw new ArcLensError({
        code: "ARTIFACT_ID_CONFLICT",
        status: 422,
        retryable: false,
        problem: "The answer produced conflicting artifacts with the same ID.",
        cause: `Artifact ${artifact.id} was reused with different validated content.`,
        fix: "Use a new semantic artifact ID or submit the original artifact unchanged.",
        docsUrl: "/docs/errors#artifact-id-conflict",
      });
    }
    this.#artifacts.set(artifact.id, artifact);
    return artifact;
  }

  submitAnswer(input: AnswerEnvelope): void {
    this.#assertOpen();
    this.#answer = answerEnvelopeSchema.parse(input);
  }

  commit(): CommittedBundle {
    this.#assertOpen();
    if (!this.#answer) {
      throw new ArcLensError({
        code: "ANSWER_MISSING",
        status: 422,
        retryable: true,
        problem: "Claude did not submit a validated answer.",
        cause: "The agent turn ended without calling submit_answer.",
        fix: "Retry once. If this repeats, inspect the agent prompt and tool receipts.",
        docsUrl: "/docs/errors#answer-missing",
      });
    }

    const answer = this.#answer;
    if (answer.kind === "answer") {
      for (const artifactId of answer.artifactIds) {
        if (!this.#artifacts.has(artifactId)) {
          throw new ArcLensError({
            code: "ANSWER_ARTIFACT_MISSING",
            status: 422,
            retryable: false,
            problem: "The answer references a visual that was not validated.",
            cause: `Artifact ${artifactId} was not staged in this request.`,
            fix: "Present the artifact before submitting the answer, or remove the reference.",
            docsUrl: "/docs/errors#answer-artifact-missing",
          });
        }
      }

      const requiredSources = new Set([
        ...answer.claims.flatMap((claim) => claim.sourceIds),
        ...answer.artifactIds.flatMap(
          (artifactId) => this.#artifacts.get(artifactId)?.sourceIds ?? [],
        ),
      ]);
      const declaredSources = new Set(answer.sourceIds);
      for (const sourceId of requiredSources) {
        if (!declaredSources.has(sourceId)) {
          throw new ArcLensError({
            code: "ANSWER_SOURCE_MISSING",
            status: 422,
            retryable: false,
            problem: "The answer omitted evidence used by a claim or visual.",
            cause: `Source ${sourceId} is required but absent from the answer source list.`,
            fix: "Include every claim and artifact source in submit_answer.sourceIds.",
            docsUrl: "/docs/errors#answer-source-missing",
          });
        }
      }
    }

    const referenced =
      answer.kind === "answer"
        ? answer.artifactIds.map((id) => this.#artifacts.get(id)!).filter(Boolean)
        : [];
    const sourceIds =
      answer.kind === "answer" ? [...new Set(answer.sourceIds)] : [];
    const unsigned = { requestId: this.requestId, answer, artifacts: referenced, sourceIds };
    const bundle = { ...unsigned, checksum: checksum(unsigned) };
    this.#state = "committed";
    this.#artifacts.clear();
    return bundle;
  }

  abort(): void {
    if (this.#state !== "open") return;
    this.#artifacts.clear();
    this.#answer = undefined;
    this.#state = "aborted";
  }

  #assertOpen(): void {
    if (this.#state !== "open") {
      throw new ArcLensError({
        code: "REQUEST_NOT_COMMITTABLE",
        status: 409,
        retryable: false,
        problem: "This request is already closed.",
        cause: `Request ${this.requestId} is ${this.#state}.`,
        fix: "Start a new request instead of reusing a committed or aborted transaction.",
        docsUrl: "/docs/errors#request-not-committable",
      });
    }
  }
}
