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
  isSafetySource?(id: string): boolean;
};

type GroundedArtifact = {
  summary: string;
  claim: Claim | null;
  hazardLevel: "none" | "reminder" | "caution" | "stop";
  sourceIds: string[];
};

const technicalProse =
  /\b(?:dcen|dcep|positive|negative|polarity|socket)\b|\b\d+(?:\.\d+)?\s*(?:a|v|%|minutes?)\b/i;
const safetyProse =
  /\b(?:electric shock|fire|explosion|disconnect|unplug|power off|power switch off|warning|caution|hazard|kill|serious injury)\b/i;

export function groundAnswerEnvelope(
  input: AnswerEnvelope,
  context: GroundingContext,
): AnswerEnvelope {
  const envelope = answerEnvelopeSchema.parse(input);
  if (envelope.kind === "clarification") {
    return safeClarification(envelope);
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
    if (claim.kind === "fact" || claim.kind === "procedure") {
      throw groundingError(
        "GROUNDING_CLAIM_UNVERIFIED",
        `Structured ${claim.kind} claims are not backed by a server computation receipt.`,
        "Use an exact prose evidence span or a deterministic ArcLens artifact.",
      );
    }
  }

  const proseClaims = envelope.claims.filter(
    (claim): claim is Extract<Claim, { kind: "prose" }> => claim.kind === "prose",
  );

  const deterministic = selectedArtifacts
    .map(groundArtifact)
    .filter((value): value is GroundedArtifact => value !== null);

  if (deterministic.length > 0) {
    const sourceIds = [...new Set([
      ...selectedArtifacts.flatMap((artifact) => artifact.sourceIds),
      ...proseClaims.flatMap((claim) => claim.sourceIds),
    ])];
    for (const sourceId of sourceIds) requireSource(sourceId, context);
    const claims = deterministic
      .map((value) => value.claim)
      .filter((value): value is Claim => value !== null)
      .concat(proseClaims);
    const summaries = deterministic.map((value) => value.summary);
    const deterministicLength = summaries.join(" ").length;
    if (proseClaims.length) {
      summaries.push(evidenceSummary(proseClaims, context, Math.max(80, 1180 - deterministicLength)));
    }

    return answerEnvelopeSchema.parse({
      kind: "answer",
      summary: summaries.join(" "),
      claims,
      artifactIds: selectedArtifacts.map((artifact) => artifact.id),
      sourceIds,
      hazardLevel: highestHazard([
        ...deterministic.map((value) => value.hazardLevel),
        ...proseClaims.map((claim) => proseHazard(claim, context)),
      ]),
    });
  }

  if (proseClaims.length !== envelope.claims.length || proseClaims.length === 0) {
    throw groundingError(
      "GROUNDING_EVIDENCE_REQUIRED",
      "The answer is not backed by exact excerpts from the verified manual corpus.",
      "Use get_manual_pages and attach an exact evidence quote to every prose claim.",
    );
  }

  return answerEnvelopeSchema.parse({
    ...envelope,
    summary: evidenceSummary(proseClaims, context),
    hazardLevel: highestHazard(proseClaims.map((claim) => proseHazard(claim, context))),
  });
}

function safeClarification(
  envelope: Extract<AnswerEnvelope, { kind: "clarification" }>,
): Extract<AnswerEnvelope, { kind: "clarification" }> {
  const requested = `${envelope.question} ${envelope.reason}`.toLowerCase();
  if (/wire (?:diameter|size)|diameter.*wire/.test(requested)) {
    return {
      kind: "clarification",
      question: "What wire diameter are you using?",
      reason: "Wire diameter changes the documented feed and setup guidance.",
      choices: ["0.025 in", "0.030 in", "0.035 in", "0.045 in", "I’m not sure"],
    };
  }
  if (/electrode|rod/.test(requested)) {
    return {
      kind: "clarification",
      question: "Which electrode type and diameter are you using?",
      reason: "Electrode type and diameter change the documented setup guidance.",
    };
  }
  if (/material|thickness|aluminum|steel/.test(requested)) {
    return {
      kind: "clarification",
      question: "What material and thickness are you welding?",
      reason: "Material and thickness determine which documented process and settings apply.",
    };
  }
  if (/shielding gas|gas type|gas mixture/.test(requested)) {
    return {
      kind: "clarification",
      question: "Which shielding gas, if any, are you using?",
      reason: "Gas requirements differ between MIG and self-shielded flux-core setups.",
    };
  }
  if (/voltage|120\s*v|240\s*v|input/.test(requested)) {
    return {
      kind: "clarification",
      question: "Is the welder connected to 120 V or 240 V input power?",
      reason: "The documented output and duty-cycle ratings change with input voltage.",
      choices: ["120 V", "240 V", "I’m not sure"],
    };
  }
  if (/process|mig|flux|tig|stick/.test(requested)) {
    return {
      kind: "clarification",
      question: "Which welding process are you using?",
      reason: "Polarity, connections, and troubleshooting steps differ by process.",
      choices: ["MIG", "Flux-core", "TIG", "Stick", "I’m not sure"],
    };
  }
  return {
    kind: "clarification",
    question: "What setup detail or symptom can you confirm before ArcLens continues?",
    reason: "The verified manuals do not support one reliable answer without that context.",
  };
}

function validateExtractiveEvidence(
  claim: Extract<Claim, { kind: "prose" }>,
  context: GroundingContext,
): void {
  if (
    claim.sourceIds.length !== 1 ||
    claim.evidence.length !== 1 ||
    claim.evidence[0]?.sourceId !== claim.sourceIds[0]
  ) {
    throw groundingError(
      "GROUNDING_EVIDENCE_AMBIGUOUS",
      "Each prose claim must bind to exactly one evidence quote from exactly one source.",
      "Split cross-page evidence into one prose claim per source.",
    );
  }
  const normalizedClaim = normalizeEvidence(claim.text);
  let exactButTooShort = false;
  const supported = claim.evidence.some((evidence) => {
    if (!claim.sourceIds.includes(evidence.sourceId)) return false;
    const pageText = context.getPageText(evidence.sourceId);
    if (!pageText) return false;
    const normalizedQuote = normalizeEvidence(evidence.quote);
    const normalizedPage = normalizeEvidence(pageText);
    const quoteIndex = normalizedPage.indexOf(normalizedQuote);
    const exact = quoteIndex >= 0 && normalizedQuote === normalizedClaim;
    if (!exact) return false;
    const tokenCount = normalizedClaim.split(" ").length;
    const contextualSentence =
      normalizedClaim.length >= 32 &&
      tokenCount >= 6 &&
      /[.!?:;]$/.test(normalizedClaim);
    const exactPhysicalLine = pageText
      .split(/\r?\n/)
      .some((line) => normalizeEvidence(line) === normalizedQuote);
    const completeTableRow =
      evidence.sourceId === "owner-manual:pdf-7" &&
      exactPhysicalLine &&
      normalizedClaim.length >= 20 &&
      tokenCount >= 4 &&
      /\d/.test(normalizedClaim) &&
      /\b(?:a|v|vac|ipm|%|kva|ocv)\b/i.test(normalizedClaim);
    const previous = quoteIndex > 0
      ? normalizedPage.slice(0, quoteIndex).trimEnd().at(-1)
      : undefined;
    const quoteEnd = quoteIndex + normalizedQuote.length;
    const next = quoteEnd < normalizedPage.length
      ? normalizedPage.slice(quoteEnd).trimStart()[0]
      : undefined;
    const startsAtBoundary = previous === undefined || /[.!?:;]/.test(previous);
    const endsAtBoundary =
      next === undefined ||
      /[.!?:;]/.test(next) ||
      /[.!?:;]/.test(normalizedQuote.at(-1) ?? "");
    const boundedSentence = contextualSentence && startsAtBoundary && endsAtBoundary;
    if (!boundedSentence && !completeTableRow) exactButTooShort = true;
    return boundedSentence || completeTableRow;
  });
  if (supported) return;
  if (exactButTooShort) {
    throw groundingError(
      "GROUNDING_EVIDENCE_SPAN_TOO_SHORT",
      "The evidence span is too short to preserve its condition, negation, and surrounding meaning.",
      "Quote a complete manual sentence, or a complete numeric table row with its unit.",
    );
  }
  throw groundingError(
    "GROUNDING_QUOTE_MISMATCH",
    `Prose claim “${claim.text.slice(0, 120)}” is not contained in an exact verified-manual quote.`,
    "Copy a short exact excerpt returned by get_manual_pages and keep the claim extractive.",
  );
}

function evidenceSummary(
  claims: Array<Extract<Claim, { kind: "prose" }>>,
  context: GroundingContext,
  maxLength = 1150,
): string {
  const excerpts = claims.map((claim) => {
    const sourceId = claim.sourceIds[0];
    const source = context.getSource(sourceId) as
      | { documentTitle?: string; pdfPageNumber?: number }
      | undefined;
    const label = source?.documentTitle && source.pdfPageNumber
      ? `${source.documentTitle}, PDF page ${source.pdfPageNumber}`
      : sourceId;
    return `${label}: “${claim.text}”`;
  });
  let summary = "Verified manual evidence";
  for (const excerpt of excerpts) {
    const candidate = `${summary}${summary.endsWith("evidence") ? " — " : " "}${excerpt}`;
    if (candidate.length > maxLength) {
      const fallback = "Verified manual evidence is attached to the cited source.";
      if (summary === "Verified manual evidence") return fallback.slice(0, maxLength);
      const suffix = " Additional verified evidence is attached.";
      if (summary.length + suffix.length <= maxLength) summary += suffix;
      break;
    }
    summary = candidate;
  }
  return summary;
}

function proseHazard(
  claim: Extract<Claim, { kind: "prose" }>,
  context: GroundingContext,
): "none" | "reminder" | "caution" | "stop" {
  if (/\b(?:kill|death|to prevent serious injury)\b/i.test(claim.text)) return "stop";
  if (safetyProse.test(claim.text) || claim.sourceIds.some((id) => context.isSafetySource?.(id))) {
    return "caution";
  }
  return technicalProse.test(claim.text) ? "reminder" : "none";
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
