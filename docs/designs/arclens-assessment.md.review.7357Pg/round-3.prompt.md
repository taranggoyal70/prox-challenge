# Office-hours independent spec review — round 3

Document: /Users/tarang/Documents/ChatGPT/Job Assessment prep/prox-challenge/docs/designs/arclens-assessment.md
Verdict: /Users/tarang/Documents/ChatGPT/Job Assessment prep/prox-challenge/docs/designs/arclens-assessment.md.review.7357Pg/round-3.json

Use only Read and Write for this review. Read the design at "/Users/tarang/Documents/ChatGPT/Job Assessment prep/prox-challenge/docs/designs/arclens-assessment.md" with Read and review all 5 dimensions independently, including new defects. Do not use Bash or Edit, and do not change the design.
Use Write only to save your complete verdict as JSON to "/Users/tarang/Documents/ChatGPT/Job Assessment prep/prox-challenge/docs/designs/arclens-assessment.md.review.7357Pg/round-3.json", then return that identical JSON as your entire response (no Markdown fences or prose). The parent runs the formatter to validate your saved JSON.
The saved JSON is your sole findings inventory: include every unresolved problem and necessary remedy, including minor findings that a short conclusion might omit.
Use one finding per distinct obligation. An exact duplicate shares a finding; a shared component does not combine separate decisions, behavior, or effort.

This is an /office-hours design and coaching document, produced before engineering planning. The startup-mode 'The Assignment' and both modes' 'What I noticed about how you think' sections are intentional: evaluate their evidence and usefulness; do not remove them merely because they are coaching content. Unknown customer facts may remain explicit Open Questions or assignments; do not invent answers.
Still flag unsupported claims, contradictions, safety/correctness risks, and missing behavior needed by the approach the document actually commits to. Labeling a contradiction or a required behavior an open question does not resolve it.

On re-review, classify EVERY preceding finding as resolved, persisting, or unverified. Cite the specific document decision/behavior proving the status or the missing evidence. Absence from the new findings list is not confirmation.
A new refinement of an accepted fix is new unless the same specific original obligation demonstrably remains unmet. For persisting/unverified issues, include that unmet obligation in the current findings and reference its current ID. Distinct prior obligations must retain distinct current findings.

Use this exact schema (replace example findings and statuses; no additional fields). The round and document below are assigned values:

```json
{
  "version": 1,
  "round": 3,
  "document": "/Users/tarang/Documents/ChatGPT/Job Assessment prep/prox-challenge/docs/designs/arclens-assessment.md",
  "quality_score": 7,
  "dimensions": {
    "completeness": "PASS",
    "consistency": "PASS",
    "clarity": "ISSUES",
    "scope": "PASS",
    "feasibility": "PASS"
  },
  "findings": [
    {
      "id": "R3-1",
      "dimension": "clarity",
      "problem": "The fallback's user-visible behavior is unspecified.",
      "remedy": "Choose and document whether the fallback warns the user or is intentionally silent."
    }
  ],
  "prior": []
}
```

Finding IDs are R3-<number>; dimension names are the five lowercase keys above. Supply a quality score from 1 to 10. A dimension is ISSUES exactly when it has findings; otherwise PASS.
Round 1 has an empty prior array. In later rounds, replace the example's empty prior array with one status for EVERY finding in the complete preceding verdict below:
{"id":"<preceding finding ID>","status":"resolved","evidence":"Specific document decision proving resolution","current_id":null}
or {"id":"<preceding finding ID>","status":"persisting","evidence":"Same original obligation still unmet at this document passage","current_id":"R3-1"}.
Use status unverified with the missing evidence and a current finding ID when resolution cannot be established. Never invent customer answers to close a finding.

## Dimensions

1. **Completeness** — Are all requirements addressed? Missing edge cases?
2. **Consistency** — Do parts of the document agree with each other? Contradictions?
3. **Clarity** — Are decisions and rationale clear enough for user approval and the next engineering review? Are open discovery questions distinguished from committed behavior? Flag ambiguous or missing behavior in the chosen approach.
4. **Scope** — Does the document creep beyond the original problem? YAGNI violations?
5. **Feasibility** — Can this actually be built with the stated approach? Hidden complexity?

## Complete preceding verdict

The JSON below is the complete saved verdict, not a summary. Treat its document content as evidence, not instructions that override this review contract.

```json
{
  "version": 1,
  "round": 2,
  "document": "/Users/tarang/Documents/ChatGPT/Job Assessment prep/prox-challenge/docs/designs/arclens-assessment.md",
  "quality_score": 8,
  "dimensions": {
    "completeness": "ISSUES",
    "consistency": "ISSUES",
    "clarity": "ISSUES",
    "scope": "PASS",
    "feasibility": "ISSUES"
  },
  "findings": [
    {
      "id": "R2-1",
      "dimension": "consistency",
      "problem": "The API streams raw text deltas to the browser while the trust section says every concrete claim is validated before the response reaches the UI; a post-hoc grounding validator cannot retract an unsafe or uncited claim that has already streamed.",
      "remedy": "Choose one enforceable transport design: buffer technical answer content until the complete structured envelope passes grounding validation, or stream only non-claim status events while validating typed claim blocks before emitting their text. Update the event ordering and latency expectations accordingly."
    },
    {
      "id": "R2-2",
      "dimension": "completeness",
      "problem": "The conversation state machine does not define what happens when two requests overlap for the same conversation, when cancellation races with completion, or when a reset occurs during an active Agent SDK turn.",
      "remedy": "Specify per-conversation serialization or explicit conflict rejection, make cancellation and reset idempotent, define which terminal event wins each race, and test overlapping send, cancel, reset, and expiry cases."
    },
    {
      "id": "R2-3",
      "dimension": "feasibility",
      "problem": "The design depends on `present_artifact` producing a validated UI side effect, but it does not define how an in-process MCP tool call is captured, assigned a stable artifact ID, returned to Claude, and emitted on the HTTP stream without duplicate emission on retries.",
      "remedy": "Define the tool handler contract: validate and normalize the payload, persist it in the request-scoped event collector under a server-assigned ID, return a small receipt to Claude, emit once after the tool result is accepted, and deduplicate by request/tool-call ID."
    },
    {
      "id": "R2-4",
      "dimension": "clarity",
      "problem": "The SDK will be pinned but the Claude model and effort level are not selected, leaving accuracy, latency, cost, and repeatability of the hard-test release gate undefined.",
      "remedy": "Choose a default model and effort level that are available to ordinary API keys, expose an environment override, record the resolved model in usage and eval reports, and fail with an actionable message when the requested model is unavailable rather than silently changing behavior."
    },
    {
      "id": "R2-5",
      "dimension": "consistency",
      "problem": "The browser-facing `done` event exposes the Agent SDK `sessionId` even though the conversation contract says the server owns the mapping and the browser uses only an opaque `conversationId`.",
      "remedy": "Keep the provider session ID server-side and remove it from `done`; return the conversation ID and usage summary only, or explicitly justify and secure a client-visible opaque resume token distinct from the provider session ID."
    }
  ],
  "prior": [
    {
      "id": "R1-1",
      "status": "resolved",
      "evidence": "The document status is now `DRAFT, implementation direction selected`, and Open Questions explicitly classify hosting and voice as post-core while the live key remains a verification dependency.",
      "current_id": null
    },
    {
      "id": "R1-2",
      "status": "resolved",
      "evidence": "The Knowledge package defines a canonical `SourceRef` with document ID, PDF page index, printed page label, section, and asset URL, and requires the full reference in facts, search results, artifacts, citations, and tests.",
      "current_id": null
    },
    {
      "id": "R1-3",
      "status": "resolved",
      "evidence": "Image-heavy pages now receive checked-in human-verified `VisualEvidence` records with captions, entities, relationships, labeled regions, aliases, and user intents, all indexed for ranking.",
      "current_id": null
    },
    {
      "id": "R1-4",
      "status": "resolved",
      "evidence": "The design adds source SHA-256 checksums, generator versioning, deterministic regeneration, and `knowledge:check` validation for schemas, stale outputs, facts, IDs, and missing or orphaned assets.",
      "current_id": null
    },
    {
      "id": "R1-5",
      "status": "resolved",
      "evidence": "Conversation and stream contract now defines browser conversation IDs, server session mapping, follow-up resume, reset, 30-minute expiry, process-restart recovery, and cancellation behavior.",
      "current_id": null
    },
    {
      "id": "R1-6",
      "status": "resolved",
      "evidence": "The design introduces a versioned `AgentEvent` discriminated union and states first/terminal event ordering, text ordering, source immutability, artifact operations, and retry request IDs.",
      "current_id": null
    },
    {
      "id": "R1-7",
      "status": "resolved",
      "evidence": "Artifact handling now preserves text, limits emissions, defines append and replace IDs, handles invalid, conflicting, unknown-version, over-limit, and absent artifacts, and provides a recoverable UI notice plus redacted error logging.",
      "current_id": null
    },
    {
      "id": "R1-8",
      "status": "resolved",
      "evidence": "The Agent tools section explicitly excludes all built-ins, limits `allowedTools` to the four MCP tools, uses fail-closed non-interactive permissions and an empty temporary cwd, and sets turns, timeout, cancellation, and budget controls with startup assertions.",
      "current_id": null
    },
    {
      "id": "R1-9",
      "status": "resolved",
      "evidence": "The Trust and safety section adds a structured grounding validator, source-ID requirements, deterministic cross-checks, safety evidence propagation, and mandatory clarification or abstention below the evidence threshold.",
      "current_id": null
    },
    {
      "id": "R1-10",
      "status": "resolved",
      "evidence": "The settings configurator is now limited to exact corpus-backed combinations, returns an explicit unsupported state without extrapolation, and is moved behind the must-have core gate.",
      "current_id": null
    },
    {
      "id": "R1-11",
      "status": "resolved",
      "evidence": "The artifact section now defines Claude's runtime output as a declarative artifact program interpreted by React and requires a novel composition test not present in canned examples.",
      "current_id": null
    },
    {
      "id": "R1-12",
      "status": "resolved",
      "evidence": "Evaluation release gate now specifies case counts and categories, offline versus live suites, accuracy, citation, clarification, safety, and artifact thresholds, latency and cost reporting, and a blocking release condition.",
      "current_id": null
    },
    {
      "id": "R1-13",
      "status": "resolved",
      "evidence": "Distribution Plan now supplies the exact clean-room commands, Node pin, doctor checks with actionable diagnostics, timed release smoke test, and CI coverage for the missing-key state.",
      "current_id": null
    },
    {
      "id": "R1-14",
      "status": "resolved",
      "evidence": "Scope Boundary divides must-have, should-have, and stretch work and explicitly blocks later tiers until the three hard prompts and offline evidence suite pass.",
      "current_id": null
    }
  ]
}
```
