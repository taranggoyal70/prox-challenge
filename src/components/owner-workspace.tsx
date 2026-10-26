"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ArtifactCanvas } from "@/components/artifact-canvas";
import { EvidenceDialog } from "@/components/evidence-dialog";
import { MachineContext } from "@/components/machine-context";
import { LiveArtifactCanvas } from "@/components/live-artifact-canvas";
import { ProductBar } from "@/components/product-bar";
import {
  recordedScenarios,
  recordedProofProvenance,
  withVisualEvidence,
  type EvidenceSource,
  type RecordedScenario,
} from "@/components/recorded-proof-data";
import { readAgentEvents } from "@/components/agent-stream";
import { initialChatState, reduceAgentEvent } from "@/components/chat-state";
import type { ArcLensMode } from "@/config";

export function OwnerWorkspace({ mode }: { mode: ArcLensMode }) {
  const [selectedId, setSelectedId] = useState<RecordedScenario["id"] | null>(null);
  const [proofSource, setProofSource] = useState<EvidenceSource | null>(null);
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [liveError, setLiveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [chat, setChat] = useState(initialChatState);
  const abortRef = useRef<AbortController | null>(null);
  const questionRef = useRef<HTMLInputElement>(null);
  const answerHeadingRef = useRef<HTMLHeadingElement>(null);
  const liveEnabled = mode !== "build-no-key";

  const selected = useMemo(
    () => recordedScenarios.find((scenario) => scenario.id === selectedId) ?? null,
    [selectedId],
  );
  const liveAnswer = chat.answer;
  const hasLiveAnswer = liveAnswer !== null;
  const active = selected !== null || hasLiveAnswer;
  const liveRunning = submitting || [
    "checking_context",
    "finding_evidence",
    "validating",
    "presenting",
  ].includes(chat.phase);
  const displayError = liveError ?? (chat.error ? `${chat.error.problem} ${chat.error.fix}` : null);

  const process =
    selected?.id === "tig"
      ? "TIG"
      : selected?.id === "porosity"
        ? "Flux-core"
        : selected?.id === "duty"
          ? "MIG"
          : undefined;

  useEffect(() => {
    if (active) answerHeadingRef.current?.focus();
  }, [active, selectedId, chat.answer]);

  return (
    <div className="app-shell" id="top">
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <ProductBar mode={mode} />
      <MachineContext
        process={process}
        inputVoltage={selected?.id === "duty" ? "240 V" : undefined}
      />

      <main id="workspace" className={active ? "workspace workspace--active" : "workspace"}>
        <section
          className="conversation"
          aria-label="ArcLens conversation"
          aria-busy={liveRunning}
        >
          {!liveEnabled || selected ? (
            <div className="recorded-banner" role="status">
              <span aria-hidden="true">REC</span>
              <div>
                <strong>Recorded proof; not generated for your setup</strong>
                <small>
                  Generated fixture · corpus {recordedProofProvenance.corpusVersion} · schema v{recordedProofProvenance.schemaVersion}
                </small>
              </div>
            </div>
          ) : null}

          {!selected && !hasLiveAnswer ? (
            <div className="launch-panel">
              <p className="section-label">TECHNICAL PRODUCT EXPERT</p>
              <h1>Ask the machine.<br />Inspect the proof.</h1>
              <p className="launch-panel__intro">
                ArcLens turns the OmniPro manual into the next safe action, a purpose-built visual,
                and evidence you can challenge.
              </p>
              <form
                className={liveEnabled ? "composer" : "composer composer--disabled"}
                onSubmit={submitLiveQuestion}
              >
                <label htmlFor="question">What are you trying to do or fix?</label>
                <div>
                  <input
                    ref={questionRef}
                    id="question"
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={!liveEnabled || liveRunning}
                    placeholder={
                      liveEnabled
                        ? "Describe the setup or symptom"
                        : "Add ANTHROPIC_API_KEY for a live answer"
                    }
                  />
                  {liveRunning ? (
                    <button type="button" onClick={() => abortRef.current?.abort()}>
                      Cancel
                    </button>
                  ) : (
                    <button type="submit" disabled={!liveEnabled || question.trim().length < 2}>
                      Ask ArcLens
                    </button>
                  )}
                </div>
              </form>
              {liveRunning ? (
                <p className="live-status" role="status" aria-live="polite">
                  {phaseLabel(chat.phase)}
                </p>
              ) : null}
              {displayError ? <p className="live-error" role="alert">{displayError}</p> : null}
              <section className="prompt-list" aria-labelledby="recorded-prompts-heading">
                <h2 id="recorded-prompts-heading">Try a hard question</h2>
                {recordedScenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    data-scenario-id={scenario.id}
                    aria-label={scenario.prompt}
                    onClick={() => setSelectedId(scenario.id)}
                  >
                    <span>{scenario.eyebrow}</span>
                    {scenario.prompt}
                    <b aria-hidden="true">↗</b>
                  </button>
                ))}
              </section>
            </div>
          ) : selected ? (
            <article className="answer">
              <button className="back-button" type="button" onClick={returnToRecordedScenarios}>
                ← Recorded scenarios
              </button>
              <p className="section-label">YOUR QUESTION</p>
              <h1 ref={answerHeadingRef} tabIndex={-1}>{selected.prompt}</h1>
              <div className="answer__body">
                <p>{selected.answer}</p>
                {selected.sources.map((source, index) => (
                  <button
                    key={source.id}
                    type="button"
                    className="evidence-marker"
                    aria-label={`Inspect source ${index + 1}: ${source.section}`}
                    onClick={() => setProofSource(source)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="answer__sources">
                <span>{selected.sources.length} manual {selected.sources.length === 1 ? "source" : "sources"}</span>
                <span>Deterministic facts checked</span>
              </div>
            </article>
          ) : (
            <article className="answer">
              <button className="back-button" type="button" onClick={resetLiveAnswer}>
                ← Start new conversation
              </button>
              <p className="section-label">YOUR QUESTION</p>
              <h1 ref={answerHeadingRef} tabIndex={-1}>{submittedQuestion}</h1>
              <div className="answer__body">
                <p>{answerText(liveAnswer)}</p>
                {chat.sources.map((source, index) => (
                  <button
                    key={source.id}
                    type="button"
                    className="evidence-marker"
                    aria-label={`Inspect source ${index + 1}: ${source.section}`}
                    onClick={() => setProofSource(toEvidenceSource(source))}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="answer__sources">
                <span>{chat.sources.length} verified manual {chat.sources.length === 1 ? "source" : "sources"}</span>
                <span>Server-grounded answer</span>
              </div>
              {liveAnswer?.kind === "clarification" && liveAnswer.choices ? (
                <div className="artifact-controls" aria-label="Clarification choices">
                  {liveAnswer.choices.map((choice) => (
                    <button key={choice} type="button" onClick={() => {
                      setQuestion(choice);
                      requestAnimationFrame(() => questionRef.current?.focus());
                    }}>{choice}</button>
                  ))}
                </div>
              ) : null}
              <form className="composer composer--followup" onSubmit={submitLiveQuestion}>
                <label htmlFor="followup-question">Ask a follow-up</label>
                <div>
                  <input
                    ref={questionRef}
                    id="followup-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={liveRunning}
                    placeholder="Add context or ask a follow-up"
                  />
                  {liveRunning ? (
                    <button type="button" onClick={() => abortRef.current?.abort()}>Cancel</button>
                  ) : (
                    <button type="submit" disabled={question.trim().length < 2}>Send follow-up</button>
                  )}
                </div>
              </form>
              {displayError ? <p className="live-error" role="alert">{displayError}</p> : null}
            </article>
          )}
        </section>

        {selected || chat.artifacts.length > 0 ? (
          <aside className="artifact-canvas" aria-label="Selected visual explanation">
            <div className="artifact-canvas__chrome">
              <span>VISUAL EXPLANATION</span>
              <button
                type="button"
                disabled={!selected && !chat.sources[0]}
                onClick={() =>
                  setProofSource(
                    selected
                      ? selected.sources[0]
                      : chat.sources[0]
                        ? toEvidenceSource(chat.sources[0])
                        : null,
                  )
                }
              >
                Open Proof Mode
              </button>
            </div>
            {selected ? (
              <ArtifactCanvas scenario={selected} />
            ) : (
              <LiveArtifactCanvas artifacts={chat.artifacts} sources={chat.sources} />
            )}
          </aside>
        ) : (
          <aside className="empty-canvas" aria-label="How ArcLens answers">
            <div className="proof-trace" aria-hidden="true">
              <i>01</i><span /><i>02</i><span /><i>03</i>
            </div>
            <ol>
              <li><span>01</span><strong>Find</strong><p>Search manual text, diagrams, and exact product facts.</p></li>
              <li><span>02</span><strong>Validate</strong><p>Reject unsupported settings and unsafe confidence.</p></li>
              <li><span>03</span><strong>Show</strong><p>Generate the clearest visual and connect it to proof.</p></li>
            </ol>
          </aside>
        )}
      </main>

      <footer className="app-footer">
        <span>Built on the Claude Agent SDK</span>
        <a href="/manuals/owner-manual.pdf">Open source manual</a>
      </footer>

      {proofSource ? (
        <EvidenceDialog source={proofSource} onClose={() => setProofSource(null)} />
      ) : null}
    </div>
  );

  async function submitLiveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!liveEnabled || liveRunning || nextQuestion.length < 2) return;

    setLiveError(null);
    setSubmitting(true);
    setSelectedId(null);
    setSubmittedQuestion(nextQuestion);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: nextQuestion,
          ...(chat.conversationId ? { conversationId: chat.conversationId } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: { problem?: string; fix?: string };
        };
        throw new Error(
          [payload.error?.problem, payload.error?.fix].filter(Boolean).join(" ") ||
            `ArcLens returned HTTP ${response.status}.`,
        );
      }
      if (!response.body) throw new Error("ArcLens returned no event stream.");

      for await (const agentEvent of readAgentEvents(response.body)) {
        setChat((current) => reduceAgentEvent(current, agentEvent));
      }
      setQuestion("");
    } catch (error) {
      if (controller.signal.aborted) {
        setLiveError("Cancelled. Your question is still here.");
      } else {
        setLiveError(error instanceof Error ? error.message : "ArcLens could not answer.");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setSubmitting(false);
    }
  }

  function resetLiveAnswer() {
    setSubmittedQuestion("");
    setQuestion("");
    setChat(initialChatState);
    setLiveError(null);
    requestAnimationFrame(() => questionRef.current?.focus());
  }

  function returnToRecordedScenarios() {
    const scenarioId = selectedId;
    setSelectedId(null);
    requestAnimationFrame(() => {
      if (scenarioId) {
        document.querySelector<HTMLButtonElement>(`[data-scenario-id="${scenarioId}"]`)?.focus();
      }
    });
  }
}

function phaseLabel(phase: string) {
  return {
    checking_context: "Checking machine context",
    finding_evidence: "Finding manual evidence",
    validating: "Validating the answer",
    presenting: "Preparing the visual explanation",
  }[phase] ?? "Working";
}

function answerText(answer: typeof initialChatState.answer) {
  if (!answer) return "";
  if (answer.kind === "answer") return answer.summary;
  if (answer.kind === "clarification") return `${answer.question} ${answer.reason}`;
  return `${answer.reason} ${answer.nextAction}`;
}

function toEvidenceSource(source: typeof initialChatState.sources[number]): EvidenceSource {
  return withVisualEvidence({
    id: source.id,
    documentId: source.documentId,
    documentTitle: source.documentTitle,
    pdfPageNumber: source.pdfPageNumber,
    printedPageLabel: source.printedPageLabel,
    section: source.section,
    assetUrl: source.assetUrl,
    region: source.region,
    excerpt: source.excerpt ?? "Open the source page to inspect the surrounding context.",
  });
}
