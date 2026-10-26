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
      question: "Which welding process and input voltage are you using?",
      reason: "Those setup details can change the documented answer.",
      choices: ["MIG", "Flux-core", "TIG", "Stick", "I’m not sure"],
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

  it("rejects technical prose without a deterministic artifact", () => {
    expect(() =>
      groundAnswerEnvelope(
        {
          kind: "answer",
          summary: "Put the ground in positive and use DCEN at 200 A.",
          hazardLevel: "none",
          sourceIds: ["owner-manual:pdf-24"],
          artifactIds: [],
          claims: [
            {
              kind: "prose",
              text: "Put the ground in positive and use DCEN at 200 A.",
              sourceIds: ["owner-manual:pdf-24"],
              evidence: [{ sourceId: "owner-manual:pdf-24", quote: "Put the ground in positive and use DCEN at 200 A." }],
            },
          ],
        },
        { artifacts: [], getSource, getPageText: () => "Put the ground in positive and use DCEN at 200 A." },
      ),
    ).toThrowError(
      expect.objectContaining<Partial<ArcLensError>>({
        code: "GROUNDING_ARTIFACT_REQUIRED",
      }),
    );
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
    expect(grounded.kind === "answer" && grounded.summary).toBe(quote);
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
});
