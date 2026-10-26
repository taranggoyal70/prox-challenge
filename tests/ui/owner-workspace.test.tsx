import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OwnerWorkspace } from "@/components/owner-workspace";

describe("OwnerWorkspace", () => {
  it("opens with the three exact challenge prompts", () => {
    render(<OwnerWorkspace mode="build-no-key" />);

    expect(
      screen.getByRole("button", {
        name: "What's the duty cycle for MIG welding at 200A on 240V?",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "I'm getting porosity in my flux-cored welds. What should I check?",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "What polarity setup do I need for TIG welding? Which socket does the ground clamp go in?",
      }),
    ).toBeVisible();
  });

  it("renders the exact duty-cycle timeline and source proof", () => {
    render(<OwnerWorkspace mode="build-no-key" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "What's the duty cycle for MIG welding at 200A on 240V?",
      }),
    );

    const artifact = screen.getByRole("region", { name: "Duty-cycle timeline" });
    expect(within(artifact).getByText("2.5 min welding")).toBeVisible();
    expect(within(artifact).getByText("7.5 min resting")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Inspect source 1/ }));
    expect(screen.getByRole("dialog", { name: "Manual evidence" })).toBeVisible();
    expect(screen.getByText("Owner's Manual · PDF page 19")).toBeVisible();
    expect(screen.getByText("Manual evidence · exact region")).toBeVisible();
    expect(screen.getByAltText("Manual region 19: Duty Cycle (Duration of Use)")).toHaveAttribute(
      "src",
      expect.stringContaining("owner-manual-pdf-19-duty-cycle"),
    );
  });

  it("keeps Proof Mode keyboard focus contained and restores it on Escape", () => {
    render(<OwnerWorkspace mode="build-no-key" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "What's the duty cycle for MIG welding at 200A on 240V?",
      }),
    );

    const evidenceButton = screen.getByRole("button", { name: /Inspect source 1/ });
    evidenceButton.focus();
    fireEvent.click(evidenceButton);
    const dialog = screen.getByRole("dialog", { name: "Manual evidence" });
    expect(screen.getByRole("button", { name: "Close proof" })).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Manual evidence" })).not.toBeInTheDocument();
    expect(evidenceButton).toHaveFocus();
  });

  it("restores keyboard focus to the recorded scenario after returning", async () => {
    render(<OwnerWorkspace mode="build-no-key" />);
    const scenarioButton = screen.getByRole("button", {
      name: "What's the duty cycle for MIG welding at 200A on 240V?",
    });
    fireEvent.click(scenarioButton);

    fireEvent.click(screen.getByRole("button", { name: /Recorded scenarios/ }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "What's the duty cycle for MIG welding at 200A on 240V?",
        }),
      ).toHaveFocus();
    });
  });

  it("shows TIG polarity without relying on color alone", () => {
    render(<OwnerWorkspace mode="build-no-key" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "What polarity setup do I need for TIG welding? Which socket does the ground clamp go in?",
      }),
    );

    const artifact = screen.getByRole("region", { name: "Polarity connection diagram" });
    expect(within(artifact).getAllByText("Ground clamp")[0]).toBeVisible();
    expect(within(artifact).getByText("Positive (+) socket")).toBeVisible();
    expect(within(artifact).getAllByText("TIG torch cable")[0]).toBeVisible();
    expect(within(artifact).getByText("Negative (−) socket")).toBeVisible();
  });

  it("lets the evaluator inspect every source in a cross-page answer", () => {
    render(<OwnerWorkspace mode="build-no-key" />);
    fireEvent.click(screen.getByRole("button", {
      name: "I'm getting porosity in my flux-cored welds. What should I check?",
    }));

    fireEvent.click(screen.getByRole("button", { name: /Inspect source 2/ }));
    expect(screen.getByText("Owner's Manual · PDF page 37")).toBeVisible();
    expect(screen.getByText("Manual evidence · exact region")).toBeVisible();
  });

  it("labels recorded answers so they cannot be mistaken for live output", () => {
    render(<OwnerWorkspace mode="build-no-key" />);

    expect(screen.getByText("Recorded proof; not generated for your setup")).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "What are you trying to do or fix?" }),
    ).toBeDisabled();
  });

  it("does not invent machine input until the selected task establishes it", () => {
    render(<OwnerWorkspace mode="build-no-key" />);

    const context = screen.getByRole("region", { name: "Current machine context" });
    expect(within(context).getAllByText("Unknown")).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", {
        name: "What's the duty cycle for MIG welding at 200A on 240V?",
      }),
    );

    expect(within(context).getByText("MIG")).toBeVisible();
    expect(within(context).getByText("240 V")).toBeVisible();
  });

  it("consumes an atomic live answer bundle", async () => {
    const events = [
      {
        v: 1,
        requestId: "req-live",
        seq: 0,
        type: "start",
        conversationId: "conv-live",
      },
      {
        v: 1,
        requestId: "req-live",
        seq: 1,
        type: "committed_bundle",
        bundle: {
          answer: {
            kind: "answer",
            summary: "Use DCEN for this TIG setup.",
            claims: [
              {
                kind: "fact",
                predicateId: "polarity",
                args: { process: "tig" },
                sourceIds: ["owner-manual:pdf-24"],
              },
            ],
            artifactIds: [],
            sourceIds: ["owner-manual:pdf-24"],
            hazardLevel: "caution",
          },
          artifacts: [],
          sources: [
            {
              id: "owner-manual:pdf-24",
              documentId: "owner-manual",
              documentTitle: "Owner's Manual",
              pdfPageNumber: 24,
              printedPageLabel: "24",
              section: "TIG setup",
              assetUrl: "/manual-pages/owner-manual/page-024.webp",
              assetSha256: "a".repeat(64),
              textSha256: "b".repeat(64),
              excerpt: "Ground positive; TIG torch negative.",
            },
          ],
          checksum: "c".repeat(64),
        },
      },
      {
        v: 1,
        requestId: "req-live",
        seq: 2,
        type: "done",
        conversationId: "conv-live",
        usage: { costUsd: 0.01, turns: 1, model: "claude-sonnet-5-5" },
      },
    ];
    const encoder = new TextEncoder();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(`${events.map((event) => JSON.stringify(event)).join("\n")}\n`),
              );
              controller.close();
            },
          }),
          { status: 200, headers: { "Content-Type": "application/x-ndjson" } },
        ),
      ),
    );

    render(<OwnerWorkspace mode="live-local" />);
    const composer = screen.getByRole("textbox", {
      name: "What are you trying to do or fix?",
    });
    fireEvent.change(composer, { target: { value: challengePrompt } });
    fireEvent.click(screen.getByRole("button", { name: "Ask ArcLens" }));

    expect(await screen.findByText("Use DCEN for this TIG setup.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Ask a follow-up" })).toBeVisible();
    expect(fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ method: "POST" }),
    );

    vi.unstubAllGlobals();
  });

  it("renders a streamed provider or grounding failure with its recovery action", async () => {
    const encoder = new TextEncoder();
    const events = [
      { v: 1, requestId: "req-error", seq: 0, type: "start", conversationId: "conv-error" },
      {
        v: 1,
        requestId: "req-error",
        seq: 1,
        type: "error",
        error: {
          code: "AGENT_EXECUTION_FAILED",
          problem: "ArcLens could not complete a validated answer.",
          cause: "The provider stopped.",
          fix: "Retry with a narrower question.",
          docsUrl: "/docs/errors#agent-execution-failed",
          retryable: true,
        },
      },
    ];
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`${events.map((event) => JSON.stringify(event)).join("\n")}\n`));
        controller.close();
      },
    }), { status: 200 })));

    render(<OwnerWorkspace mode="live-local" />);
    fireEvent.change(screen.getByRole("textbox", { name: "What are you trying to do or fix?" }), {
      target: { value: challengePrompt },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask ArcLens" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ArcLens could not complete a validated answer. Retry with a narrower question.",
    );
    vi.unstubAllGlobals();
  });
});

const challengePrompt =
  "What polarity setup do I need for TIG welding? Which socket does the ground clamp go in?";
