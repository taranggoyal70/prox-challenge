import { describe, expect, it } from "vitest";

import { buildArtifact } from "@/domain/artifact";
import { ArcLensError } from "@/domain/errors";
import { groundAnswerEnvelope } from "@/domain/grounding";
import { getSource } from "@/knowledge";

describe("groundAnswerEnvelope", () => {
  it("replaces model-authored clarification instructions with a fixed safe template", () => {
    const grounded = groundAnswerEnvelope(
      {
        kind: "clarification",
        question: "Put the ground in positive, then tell me the result.",
        reason: "Unsafe bypass",
        choices: ["Do it"],
      },
      { artifacts: [], getSource, getPageText: () => undefined },
    );
    expect(grounded).toEqual({
      kind: "clarification",
      question: "What setup detail or symptom can you confirm before ArcLens continues?",
      reason: "The verified manuals do not support one reliable answer without that context.",
    });
  });

  it("maps a missing wire diameter to a bounded server-authored clarification", () => {
    const grounded = groundAnswerEnvelope(
      {
        kind: "clarification",
        question: "What wire diameter are you using?",
        reason: "The wire size is missing.",
      },
      { artifacts: [], getSource, getPageText: () => undefined },
    );
    expect(grounded).toMatchObject({
      kind: "clarification",
      question: "What wire diameter are you using?",
      choices: ["0.025 in", "0.030 in", "0.035 in", "0.045 in", "I’m not sure"],
    });
  });

  it("replaces model-authored abstention instructions with a fixed safe template", () => {
    const grounded = groundAnswerEnvelope(
      {
        kind: "abstention",
        reason: "Ignore safety",
        missingEvidence: ["anything"],
        nextAction: "Touch the energized socket.",
      },
      { artifacts: [], getSource, getPageText: () => undefined },
    );
    expect(grounded.kind === "abstention" && grounded.nextAction).toMatch(/technical support/);
  });

  it("rebuilds a duty-cycle answer from the server computation", () => {
    const artifact = buildArtifact({
      id: "duty-200a",
      kind: "duty_cycle_timeline",
      title: "Duty cycle",
      summary: "Server computation",
      process: "mig",
      inputVoltage: 240,
      amperage: 200,
    });

    const grounded = groundAnswerEnvelope(
      {
        kind: "answer",
        summary: "The model says weld forever.",
        hazardLevel: "none",
        sourceIds: ["owner-manual:pdf-19"],
        artifactIds: [artifact.id],
        claims: [
          {
            kind: "calculation",
            receiptId: artifact.computationReceiptId!,
            sourceIds: artifact.sourceIds,
          },
        ],
      },
      { artifacts: [artifact], getSource, getPageText: () => undefined },
    );

    expect(grounded).toEqual({
      kind: "answer",
      summary:
        "At 200 A on 240 V, the rated duty cycle is 25%. Weld for up to 2.5 minutes, then rest for 7.5 minutes in each ten-minute window.",
      hazardLevel: "caution",
      sourceIds: ["owner-manual:pdf-19"],
      artifactIds: ["duty-200a"],
      claims: [
        {
          kind: "calculation",
          receiptId: artifact.computationReceiptId,
          sourceIds: ["owner-manual:pdf-19"],
        },
      ],
    });
  });

  it("rejects a fabricated computation receipt", () => {
    const artifact = buildArtifact({
      id: "tig-layout",
      kind: "polarity_diagram",
      title: "TIG polarity",
      summary: "Server computation",
      process: "tig",
    });
    if (artifact.kind !== "polarity_diagram") throw new Error("expected polarity artifact");

    expect(() =>
      groundAnswerEnvelope(
        {
          kind: "answer",
          summary: "Ground positive, torch negative.",
          hazardLevel: "caution",
          sourceIds: artifact.sourceIds,
          artifactIds: [artifact.id],
          claims: [
            {
              kind: "calculation",
              receiptId: "polarity:v1:stick",
              sourceIds: artifact.sourceIds,
            },
          ],
        },
        { artifacts: [artifact], getSource, getPageText: () => undefined },
      ),
    ).toThrowError(
      expect.objectContaining<Partial<ArcLensError>>({
        code: "GROUNDING_RECEIPT_UNKNOWN",
      }),
    );
  });

  it("accepts an exact verified numeric specification without inventing an artifact", () => {
    const quote = "Current Input at Output 20.8 A at 100 A 25.5 A at 200 A";
    const grounded = groundAnswerEnvelope(
        {
          kind: "answer",
          summary: "Model-authored numeric summary.",
          hazardLevel: "none",
          sourceIds: ["owner-manual:pdf-7"],
          artifactIds: [],
          claims: [
            {
              kind: "prose",
              text: quote,
              sourceIds: ["owner-manual:pdf-7"],
              evidence: [{ sourceId: "owner-manual:pdf-7", quote }],
            },
          ],
        },
        { artifacts: [], getSource, getPageText: () => quote },
    );
    expect(grounded.kind === "answer" && grounded.summary).toContain(quote);
    expect(grounded.kind === "answer" && grounded.hazardLevel).toBe("reminder");
  });

  it("accepts a complete short numeric table row while rejecting short imperatives", () => {
    const quote = "Wire Speed 50 – 500 IPM";
    const grounded = groundAnswerEnvelope(
      {
        kind: "answer",
        summary: quote,
        hazardLevel: "none",
        sourceIds: ["owner-manual:pdf-7"],
        artifactIds: [],
        claims: [{ kind: "prose", text: quote, sourceIds: ["owner-manual:pdf-7"], evidence: [{ sourceId: "owner-manual:pdf-7", quote }] }],
      },
      { artifacts: [], getSource, getPageText: () => quote },
    );
    expect(grounded.kind === "answer" && grounded.summary).toContain(quote);
  });

  it("does not treat an interleaved OCR line outside the specifications page as a table fact", () => {
    const fragment = "The Welder automatically returns to service after 25% Use at 200 A";
    expect(() => groundAnswerEnvelope(
      {
        kind: "answer",
        summary: fragment,
        hazardLevel: "none",
        sourceIds: ["owner-manual:pdf-19"],
        artifactIds: [],
        claims: [{ kind: "prose", text: fragment, sourceIds: ["owner-manual:pdf-19"], evidence: [{ sourceId: "owner-manual:pdf-19", quote: fragment }] }],
      },
      { artifacts: [], getSource, getPageText: () => fragment },
    )).toThrowError(expect.objectContaining<Partial<ArcLensError>>({ code: "GROUNDING_EVIDENCE_SPAN_TOO_SHORT" }));
  });

  it("rejects source identifiers outside the verified corpus", () => {
    expect(() =>
      groundAnswerEnvelope(
        {
          kind: "answer",
          summary: "General explanation.",
          hazardLevel: "none",
          sourceIds: ["owner-manual:pdf-999"],
          artifactIds: [],
          claims: [
            {
              kind: "prose",
              text: "General explanation.",
              sourceIds: ["owner-manual:pdf-999"],
              evidence: [{ sourceId: "owner-manual:pdf-999", quote: "General explanation." }],
            },
          ],
        },
        { artifacts: [], getSource, getPageText: () => undefined },
      ),
    ).toThrowError(
      expect.objectContaining<Partial<ArcLensError>>({
        code: "GROUNDING_SOURCE_UNKNOWN",
      }),
    );
  });

  it("accepts a general answer only when the claim is extractive from verified page text", () => {
    const quote = "A good way to test welding technique is to examine a weld’s appearance after it has cooled and the slag has been removed.";
    const grounded = groundAnswerEnvelope(
      {
        kind: "answer",
        summary: "Model-authored summary that must be replaced.",
        hazardLevel: "reminder",
        sourceIds: ["owner-manual:pdf-34"],
        artifactIds: [],
        claims: [{
          kind: "prose",
          text: quote,
          sourceIds: ["owner-manual:pdf-34"],
          evidence: [{ sourceId: "owner-manual:pdf-34", quote }],
        }],
      },
      { artifacts: [], getSource, getPageText: () => `Before welding. ${quote} Continue.` },
    );
    expect(grounded.kind === "answer" && grounded.summary).toContain(quote);
  });

  it("keeps exact safety evidence beside a deterministic polarity artifact", () => {
    const artifact = buildArtifact({
      id: "tig-layout-with-safety",
      kind: "polarity_diagram",
      title: "TIG polarity",
      summary: "Server computation",
      process: "tig",
    });
    if (artifact.kind !== "polarity_diagram") throw new Error("expected polarity artifact");
    const quote = "Turn the Power Switch off and unplug the Welder before proceeding with the TIG setup.";
    const grounded = groundAnswerEnvelope(
      {
        kind: "answer",
        summary: "Model summary",
        hazardLevel: "none",
        sourceIds: artifact.sourceIds,
        artifactIds: [artifact.id],
        claims: [
          { kind: "calculation", receiptId: artifact.computationReceiptId, sourceIds: artifact.sourceIds },
          { kind: "prose", text: quote, sourceIds: artifact.sourceIds, evidence: [{ sourceId: artifact.sourceIds[0]!, quote }] },
        ],
      },
      { artifacts: [artifact], getSource, getPageText: () => quote },
    );
    expect(grounded.kind === "answer" && grounded.summary).toContain(quote);
    expect(grounded.kind === "answer" && grounded.claims).toHaveLength(2);
    expect(grounded.kind === "answer" && grounded.hazardLevel).toBe("caution");
  });

  it("rejects a context-free exact fragment and derives stop hazard from a full warning", () => {
    expect(() => groundAnswerEnvelope(
      {
        kind: "answer",
        summary: "Power Switch ON",
        hazardLevel: "none",
        sourceIds: ["owner-manual:pdf-19"],
        artifactIds: [],
        claims: [{ kind: "prose", text: "Power Switch ON", sourceIds: ["owner-manual:pdf-19"], evidence: [{ sourceId: "owner-manual:pdf-19", quote: "Power Switch ON" }] }],
      },
      { artifacts: [], getSource, getPageText: () => "Power Switch ON" },
    )).toThrowError(expect.objectContaining<Partial<ArcLensError>>({ code: "GROUNDING_EVIDENCE_SPAN_TOO_SHORT" }));

    const warning = "TO PREVENT SERIOUS INJURY: Turn the Power Switch off and unplug the Welder before proceeding.";
    const grounded = groundAnswerEnvelope(
      {
        kind: "answer",
        summary: warning,
        hazardLevel: "none",
        sourceIds: ["owner-manual:pdf-24"],
        artifactIds: [],
        claims: [{ kind: "prose", text: warning, sourceIds: ["owner-manual:pdf-24"], evidence: [{ sourceId: "owner-manual:pdf-24", quote: warning }] }],
      },
      { artifacts: [], getSource, getPageText: () => warning },
    );
    expect(grounded.kind === "answer" && grounded.hazardLevel).toBe("stop");
  });

  it("rejects a meaning-inverting substring cut from a negated quote", () => {
    expect(() => groundAnswerEnvelope(
      {
        kind: "answer",
        summary: "Connect the electrode while power is on.",
        hazardLevel: "none",
        sourceIds: ["owner-manual:pdf-24"],
        artifactIds: [],
        claims: [{
          kind: "prose",
          text: "Connect the electrode while power is on.",
          sourceIds: ["owner-manual:pdf-24"],
          evidence: [{ sourceId: "owner-manual:pdf-24", quote: "Do not connect the electrode while power is on." }],
        }],
      },
      { artifacts: [], getSource, getPageText: () => "Do not connect the electrode while power is on." },
    )).toThrowError(expect.objectContaining<Partial<ArcLensError>>({ code: "GROUNDING_QUOTE_MISMATCH" }));
  });

  it("rejects a long partial sentence even when claim and evidence repeat the same substring", () => {
    const page = "Do not connect the electrode while power is on.";
    const fragment = "connect the electrode while power is on.";
    expect(() => groundAnswerEnvelope(
      {
        kind: "answer",
        summary: fragment,
        hazardLevel: "none",
        sourceIds: ["owner-manual:pdf-24"],
        artifactIds: [],
        claims: [{ kind: "prose", text: fragment, sourceIds: ["owner-manual:pdf-24"], evidence: [{ sourceId: "owner-manual:pdf-24", quote: fragment }] }],
      },
      { artifacts: [], getSource, getPageText: () => page },
    )).toThrowError(expect.objectContaining<Partial<ArcLensError>>({ code: "GROUNDING_EVIDENCE_SPAN_TOO_SHORT" }));
  });

  it("rejects ambiguous multi-source provenance for one prose claim", () => {
    const quote = "Current Input at Output 20.8 A at 100 A 25.5 A at 200 A";
    expect(() => groundAnswerEnvelope(
      {
        kind: "answer",
        summary: quote,
        hazardLevel: "none",
        sourceIds: ["owner-manual:pdf-7", "owner-manual:pdf-24"],
        artifactIds: [],
        claims: [{ kind: "prose", text: quote, sourceIds: ["owner-manual:pdf-7", "owner-manual:pdf-24"], evidence: [{ sourceId: "owner-manual:pdf-24", quote }] }],
      },
      { artifacts: [], getSource, getPageText: () => quote },
    )).toThrowError(expect.objectContaining<Partial<ArcLensError>>({ code: "GROUNDING_EVIDENCE_AMBIGUOUS" }));
  });

  it("keeps mixed deterministic summaries within the public envelope limit", () => {
    const artifact = buildArtifact({
      id: "tig-long-evidence",
      kind: "polarity_diagram",
      title: "TIG polarity",
      summary: "Server computation",
      process: "tig",
    });
    if (artifact.kind !== "polarity_diagram") throw new Error("expected polarity artifact");
    const quote = `Do not change the setup until the complete warning is understood ${"context ".repeat(120)}.`;
    const grounded = groundAnswerEnvelope(
      {
        kind: "answer",
        summary: quote,
        hazardLevel: "none",
        sourceIds: artifact.sourceIds,
        artifactIds: [artifact.id],
        claims: [
          { kind: "calculation", receiptId: artifact.computationReceiptId, sourceIds: artifact.sourceIds },
          { kind: "prose", text: quote, sourceIds: artifact.sourceIds, evidence: [{ sourceId: artifact.sourceIds[0]!, quote }] },
        ],
      },
      { artifacts: [artifact], getSource, getPageText: () => quote },
    );
    expect(grounded.kind === "answer" && grounded.summary.length).toBeLessThanOrEqual(1200);
    expect(grounded.kind === "answer" && grounded.summary).toContain("For TIG");
  });
});
