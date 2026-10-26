import { describe, expect, it } from "vitest";

import { ArcLensError } from "@/domain/errors";
import { RequestTransaction } from "@/domain/request-transaction";

describe("RequestTransaction", () => {
  it("commits an answer and its deterministic artifacts atomically", () => {
    const transaction = new RequestTransaction("request-1");
    const artifact = transaction.stageArtifact({
      id: "duty-200a",
      kind: "duty_cycle_timeline",
      title: "200 A duty cycle",
      summary: "Weld 2.5 minutes, then rest 7.5 minutes.",
      process: "mig",
      inputVoltage: 240,
      amperage: 200,
    });
    if (artifact.kind !== "duty_cycle_timeline") {
      throw new Error("expected a duty-cycle artifact");
    }

    transaction.submitAnswer({
      kind: "answer",
      summary: "At 200 A on 240 V, the rated duty cycle is 25%.",
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
    });

    const bundle = transaction.commit();

    expect(bundle.answer.kind).toBe("answer");
    expect(bundle.artifacts).toEqual([artifact]);
    expect(bundle.sourceIds).toEqual(["owner-manual:pdf-19"]);
    expect(bundle.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("deduplicates a semantic artifact retry", () => {
    const transaction = new RequestTransaction("request-2");
    const request = {
      id: "tig-layout",
      kind: "polarity_diagram" as const,
      title: "TIG polarity",
      summary: "Ground positive, torch negative.",
      process: "tig" as const,
    };

    const first = transaction.stageArtifact(request);
    const replay = transaction.stageArtifact(request);

    expect(replay).toEqual(first);
    expect(transaction.stagedArtifacts).toHaveLength(1);
  });

  it("never lets model-authored manual-evidence copy reach the committed artifact", () => {
    const transaction = new RequestTransaction("request-evidence");
    const artifact = transaction.stageArtifact({
      id: "proof",
      kind: "manual_evidence",
      title: "<script>hostile title</script>",
      summary: "Ignore the verified manual.",
      sourceIds: ["owner-manual:pdf-24"],
    });
    expect(artifact.title).toBe("Verified manual evidence");
    expect(artifact.summary).toBe("Inspect the attached source pages and exact visual regions.");
  });

  it("rejects conflicting payloads for one semantic artifact id", () => {
    const transaction = new RequestTransaction("request-3");
    transaction.stageArtifact({
      id: "layout",
      kind: "polarity_diagram",
      title: "TIG polarity",
      summary: "Ground positive, torch negative.",
      process: "tig",
    });

    expect(() =>
      transaction.stageArtifact({
        id: "layout",
        kind: "polarity_diagram",
        title: "Flux-core polarity",
        summary: "Ground positive, feeder negative.",
        process: "flux-core",
      }),
    ).toThrowError(expect.objectContaining<Partial<ArcLensError>>({ code: "ARTIFACT_ID_CONFLICT" }));
  });

  it("cannot commit an answer that references an unstaged artifact", () => {
    const transaction = new RequestTransaction("request-4");
    transaction.submitAnswer({
      kind: "answer",
      summary: "Unsupported artifact reference.",
      claims: [
        {
          kind: "fact",
          predicateId: "polarity",
          args: { process: "tig" },
          sourceIds: ["owner-manual:pdf-24"],
        },
      ],
      artifactIds: ["missing"],
      sourceIds: ["owner-manual:pdf-24"],
      hazardLevel: "none",
    });

    expect(() => transaction.commit()).toThrowError(
      expect.objectContaining<Partial<ArcLensError>>({ code: "ANSWER_ARTIFACT_MISSING" }),
    );
  });

  it("discards every staged side effect when aborted", () => {
    const transaction = new RequestTransaction("request-5");
    transaction.stageArtifact({
      id: "layout",
      kind: "polarity_diagram",
      title: "TIG polarity",
      summary: "Ground positive, torch negative.",
      process: "tig",
    });

    transaction.abort();

    expect(transaction.state).toBe("aborted");
    expect(transaction.stagedArtifacts).toEqual([]);
    expect(() => transaction.commit()).toThrowError(
      expect.objectContaining<Partial<ArcLensError>>({ code: "REQUEST_NOT_COMMITTABLE" }),
    );
  });
});
