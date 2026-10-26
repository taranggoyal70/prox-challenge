import {
  answerEnvelopeSchema,
  type AnswerEnvelope,
  type Claim,
} from "@/domain/answer-envelope";
import type { Artifact } from "@/domain/artifact";
import { ArcLensError } from "@/domain/errors";

export type GroundingContext = {
  artifacts: Artifact[];
  getSource(id: string): unknown | undefined;
  getPageText(id: string): string | undefined;
};

type GroundedArtifact = {
  summary: string;
  claim: Claim | null;
  hazardLevel: "none" | "reminder" | "caution" | "stop";
  sourceIds: string[];
};

const technicalProse =
  /\b(?:dcen|dcep|positive|negative|polarity|socket)\b|\b\d+(?:\.\d+)?\s*(?:a|v|%|minutes?)\b/i;

export function groundAnswerEnvelope(
  input: AnswerEnvelope,
  context: GroundingContext,
): AnswerEnvelope {
  const envelope = answerEnvelopeSchema.parse(input);
  if (envelope.kind === "clarification") {
    return {
      kind: "clarification",
      question: "Which welding process and input voltage are you using?",
      reason: "Those setup details can change the documented answer.",
      choices: ["MIG", "Flux-core", "TIG", "Stick", "I’m not sure"],
    };
  }
  if (envelope.kind === "abstention") {
    return {
      kind: "abstention",
      reason: "ArcLens could not ground a reliable answer in the verified manual package.",
      missingEvidence: ["Verified manual evidence for this exact question"],
      nextAction: "Check the owner’s manual or contact Vulcan technical support before changing the setup.",
    };
  }

  const declaredSources = new Set(envelope.sourceIds);
  const referencedSources = new Set([
    ...envelope.sourceIds,
    ...envelope.claims.flatMap((claim) => claim.sourceIds),
  ]);
  for (const sourceId of referencedSources) {
    requireSource(sourceId, context);
    if (!declaredSources.has(sourceId)) {
      throw groundingError(
        "GROUNDING_SOURCE_OMITTED",
        `Claim source ${sourceId} is absent from the answer source list.`,
        "Include every cited source in submit_answer.sourceIds.",
      );
    }
  }

  const artifactsById = new Map(context.artifacts.map((artifact) => [artifact.id, artifact]));
  const selectedArtifacts = envelope.artifactIds.map((artifactId) => {
    const artifact = artifactsById.get(artifactId);
    if (!artifact) {
      throw groundingError(
        "GROUNDING_ARTIFACT_UNKNOWN",
        `Artifact ${artifactId} was not built by the server in this request.`,
        "Present a server-validated artifact before submitting the answer.",
      );
    }
    return artifact;
  });

  const receiptIds = new Set(
    selectedArtifacts.flatMap((artifact) =>
      artifact.computationReceiptId ? [artifact.computationReceiptId] : [],
    ),
  );
  for (const claim of envelope.claims) {
    if (claim.kind === "calculation" && !receiptIds.has(claim.receiptId)) {
      throw groundingError(
        "GROUNDING_RECEIPT_UNKNOWN",
        `Computation receipt ${claim.receiptId} is not attached to a staged deterministic artifact.`,
        "Use the receipt returned by present_artifact for this request.",
      );
    }
    if (claim.kind === "prose") validateExtractiveEvidence(claim, context);
  }

  const deterministic = selectedArtifacts
    .map(groundArtifact)
    .filter((value): value is GroundedArtifact => value !== null);

  if (deterministic.length > 0) {
    const sourceIds = [
      ...new Set(selectedArtifacts.flatMap((artifact) => artifact.sourceIds)),
    ];
    for (const sourceId of sourceIds) requireSource(sourceId, context);
    const claims = deterministic
      .map((value) => value.claim)
      .filter((value): value is Claim => value !== null);

    return answerEnvelopeSchema.parse({
      kind: "answer",
      summary: deterministic.map((value) => value.summary).join(" "),
      claims,
      artifactIds: selectedArtifacts.map((artifact) => artifact.id),
      sourceIds,
      hazardLevel: highestHazard(deterministic.map((value) => value.hazardLevel)),
    });
  }

  if (
    envelope.claims.some((claim) => claim.kind !== "prose") ||
    technicalProse.test(envelope.summary) ||
    envelope.claims.some(
      (claim) => claim.kind === "prose" && technicalProse.test(claim.text),
    )
  ) {
    throw groundingError(
      "GROUNDING_ARTIFACT_REQUIRED",
      "The answer contains deterministic technical claims without a server-computed artifact.",
      "Use get_product_fact and present_artifact, then submit the validated receipt.",
    );
  }

  const proseClaims = envelope.claims.filter(
    (claim): claim is Extract<Claim, { kind: "prose" }> => claim.kind === "prose",
  );
  if (proseClaims.length !== envelope.claims.length || proseClaims.length === 0) {
    throw groundingError(
      "GROUNDING_EVIDENCE_REQUIRED",
      "The answer is not backed by exact excerpts from the verified manual corpus.",
      "Use get_manual_pages and attach an exact evidence quote to every prose claim.",
    );
  }

  return answerEnvelopeSchema.parse({
    ...envelope,
    summary: proseClaims.map((claim) => claim.text).join(" "),
  });
}

function validateExtractiveEvidence(
  claim: Extract<Claim, { kind: "prose" }>,
  context: GroundingContext,
): void {
  const normalizedClaim = normalizeEvidence(claim.text);
  const supported = claim.evidence.some((evidence) => {
    if (!claim.sourceIds.includes(evidence.sourceId)) return false;
    const pageText = context.getPageText(evidence.sourceId);
    if (!pageText) return false;
    const normalizedQuote = normalizeEvidence(evidence.quote);
    return (
      normalizeEvidence(pageText).includes(normalizedQuote) &&
      normalizedQuote === normalizedClaim
    );
  });
  if (supported) return;
  throw groundingError(
    "GROUNDING_QUOTE_MISMATCH",
    `Prose claim “${claim.text.slice(0, 120)}” is not contained in an exact verified-manual quote.`,
    "Copy a short exact excerpt returned by get_manual_pages and keep the claim extractive.",
  );
}

function normalizeEvidence(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function requireSource(sourceId: string, context: GroundingContext): void {
  if (context.getSource(sourceId)) return;
  throw groundingError(
    "GROUNDING_SOURCE_UNKNOWN",
    `Source ${sourceId} is not in the verified knowledge package.`,
    "Use only source IDs returned by search_manual or get_manual_pages.",
  );
}

function groundArtifact(artifact: Artifact): GroundedArtifact | null {
  switch (artifact.kind) {
    case "duty_cycle_timeline":
      return {
        summary: `At ${artifact.data.amperage} A on ${artifact.data.inputVoltage} V, the rated duty cycle is ${artifact.data.ratedPercent}%. Weld for up to ${artifact.data.weldingMinutes} minutes, then rest for ${artifact.data.restingMinutes} minutes in each ten-minute window.`,
        claim: {
          kind: "calculation",
          receiptId: artifact.computationReceiptId,
          sourceIds: artifact.sourceIds,
        },
        hazardLevel: "caution",
        sourceIds: artifact.sourceIds,
      };
    case "polarity_diagram":
      return {
        summary: `For ${artifact.data.process}, connect the ground clamp to the ${artifact.data.groundSocket} socket and the ${artifact.data.electrodeLabel} to the ${artifact.data.electrodeSocket} socket (${artifact.data.polarity}).`,
        claim: {
          kind: "calculation",
          receiptId: artifact.computationReceiptId,
          sourceIds: artifact.sourceIds,
        },
        hazardLevel: "caution",
        sourceIds: artifact.sourceIds,
      };
    case "troubleshooting_flow": {
      const first = artifact.data.steps[0];
      const remaining = artifact.data.steps.slice(1).map((step) => step.title.toLowerCase());
      return {
        summary: `${first?.action ?? "Follow the documented troubleshooting flow."}${remaining.length ? ` Then check ${humanList(remaining)}.` : ""}`,
        claim: {
          kind: "calculation",
          receiptId: artifact.computationReceiptId,
          sourceIds: artifact.sourceIds,
        },
        hazardLevel: "caution",
        sourceIds: artifact.sourceIds,
      };
    }
    case "manual_evidence":
      return null;
  }
}

function highestHazard(
  values: Array<"none" | "reminder" | "caution" | "stop">,
) {
  const order = ["none", "reminder", "caution", "stop"] as const;
  return order[Math.max(...values.map((value) => order.indexOf(value)))] ?? "none";
}

function humanList(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function groundingError(code: string, cause: string, fix: string): ArcLensError {
  return new ArcLensError({
    code,
    status: 422,
    retryable: false,
    problem: "ArcLens rejected an answer that could not be grounded.",
    cause,
    fix,
    docsUrl: `/docs/errors#${code.toLowerCase().replaceAll("_", "-")}`,
  });
}
