# ArcLens implementation plan

Source design: [ArcLens assessment design](../designs/arclens-assessment.md)
Competitive research: [fork landscape](../research/fork-landscape.md), [feature matrix](../research/fork-feature-matrix.md)
Status: DRAFT FOR GSTACK REVIEW

## Implementation plan

### Goal

Ship the most inspectable and falsifiable technical-support agent in the public Prox challenge cohort. ArcLens must match the strongest public reliability baseline, use the Claude Agent SDK in the real execution path, and differentiate through photo-based setup verification, exact source-region Proof Mode, a shipped knowledge-gap correction loop, and exportable support cases.

### Non-negotiable release gates

1. A clean clone reaches the no-key or ready state in under two minutes on Node 24.
2. The three prompts from the challenge README are correct, grounded, and rendered through distinct useful artifacts.
3. Free-form Claude output never reaches the browser. `submit_answer` is the only answer path.
4. Every technical claim resolves to a canonical one-based PDF page and, where possible, an exact page region.
5. No built-in Agent SDK filesystem, shell, web, or subagent tool is available.
6. Offline tests, safety cases, deterministic facts, mutation tests, and the live holdout gate pass before submission.
7. Core functionality remains usable with keyboard navigation, reduced motion, narrow screens, cancellation, invalid keys, and provider failures.

### Phase 1: Application foundation and evaluator preflight

Files:

- `package.json`, `package-lock.json`, `.nvmrc`, `.env.example`, `.gitignore`
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/app/api/health/route.ts`, `scripts/doctor.mjs`

Work:

- Scaffold one Next.js App Router application on Node 24 and pin every production dependency.
- Add `@anthropic-ai/claude-agent-sdk`, Zod, testing, and browser-test dependencies.
- Provide a single local command and an actionable no-key state.
- Implement `npm run doctor` for runtime version, env-key shape, generated knowledge integrity, SDK import/subprocess startup, temporary-directory access, and port availability.
- Add a CI workflow for install, doctor/no-key, typecheck, lint, tests, knowledge check, and production build.

Verification:

- Clean install and build succeed without an Anthropic key.
- Health output never prints secrets.
- Wrong Node version, missing key, corrupt knowledge, and port conflict each produce a cause and fix.

### Phase 2: Deterministic knowledge build

Files:

- `scripts/build-knowledge.mjs`, `scripts/check-knowledge.mjs`
- `src/knowledge/schema.ts`, `src/knowledge/generated/manifest.json`
- `src/knowledge/generated/facts.json`, `src/knowledge/generated/visual-evidence.json`
- `public/manuals/**`, `public/manual-pages/**`, `public/manual-regions/**`
- `tests/knowledge/**`

Work:

- Render and commit every PDF page to web-friendly images; preserve the original PDFs.
- Extract layout text per page.
- Define `SourceRef` with document ID, explicit one-based PDF page number, printed label, section, asset URL, checksum, and optional normalized region.
- Curate `VisualEvidence` for selection chart, controls, cable/socket diagrams, duty-cycle charts, weld profiles, troubleshooting figures, and wiring schematic.
- Normalize critical facts for polarity, duty cycles, capabilities, settings supported by exact source data, and safety requirements.
- Record source checksums, generator version, and deterministic outputs.
- Build a small lexical ranker over extracted text, captions, entities, aliases, relationships, and likely intents.

Verification:

- First/last page boundary tests for every PDF; page zero is invalid.
- Unique source IDs, valid regions, non-orphaned assets, current checksums, and required-fact assertions.
- Retrieval gold cases include image-only selection chart and wiring schematic.
- Mutation tests catch flipped polarity, wrong page mapping, missing asset, and stale checksum.

### Phase 3: Domain contracts, answer gate, and Agent SDK tools

Files:

- `src/domain/source.ts`, `src/domain/facts.ts`, `src/domain/artifact.ts`
- `src/domain/answer-envelope.ts`, `src/domain/agent-event.ts`, `src/domain/support-case.ts`
- `src/agent/tools/search-manual.ts`, `get-manual-pages.ts`, `get-product-fact.ts`
- `src/agent/tools/present-artifact.ts`, `submit-answer.ts`, `src/agent/server.ts`
- `src/agent/grounding.ts`, `src/agent/prompt.ts`, `src/agent/request-context.ts`
- `tests/domain/**`, `tests/agent/**`

Work:

- Define typed answers, clarifications, and abstentions with atomic claims, source IDs, transformations, safety classes, and artifact dependencies.
- Implement the five in-process MCP tools.
- `present_artifact` stores normalized payloads in a request-scoped collector keyed by SDK tool-call ID and returns a receipt.
- `submit_answer` validates source existence, deterministic facts, safety evidence, claim coverage, and artifact references.
- Ignore free-form SDK final text; permit one bounded repair turn when no valid envelope arrives.
- Configure `claude-sonnet-5-5` at high effort by default, with explicit overrides and no silent model fallback.
- Allow only the five MCP tools, use non-interactive fail-closed permissions, an empty temporary working directory, eight turns, 45-second timeout, cancellation, and a low default budget ceiling.

Verification:

- Startup assertion proves zero built-in tools are enabled.
- Unauthorized tool calls, uncited technical claims, missing safety evidence, invalid artifacts, and incorrect deterministic facts fail closed.
- Invalid or repeated artifact calls preserve the answer, deduplicate side effects, and emit a recoverable visual notice.
- Tool and envelope tests run without an API key.

### Phase 4: Conversation state and validated event transport

Files:

- `src/agent/session-store.ts`, `src/agent/request-runner.ts`
- `src/app/api/chat/route.ts`, `src/app/api/chat/cancel/route.ts`, `src/app/api/chat/reset/route.ts`
- `src/lib/agent-stream.ts`, `src/hooks/use-agent-conversation.ts`
- `tests/agent/session-races.test.ts`, `tests/api/chat.test.ts`

Work:

- Map browser `conversationId` values to server-only provider sessions with idle expiry.
- Serialize requests per conversation; return `conversation_busy` on overlap.
- Make cancel and reset idempotent with explicit terminal-event race rules.
- Buffer technical prose until the full answer envelope passes validation; stream only safe progress states while Claude works.
- Emit versioned NDJSON events in strict order: start, statuses, sources, artifacts, answer/clarification, terminal event.
- Recover expired sessions from bounded prior user turns and already validated envelopes/source IDs; rerun retrieval for new answers.

Verification:

- Tests cover send/send, send/cancel, cancel/done, reset/active, repeated cancel, expiry, retry IDs, provider failure, and process restart.
- Exactly one terminal event is visible per request and provider session IDs never reach the client.

### Phase 5: Workshop UI and typed artifact interpreter

Files:

- `src/components/chat/**`, `src/components/artifacts/**`, `src/components/evidence/**`
- `src/components/workshop/**`, `src/components/error-boundary.tsx`
- `src/app/page.tsx`, `src/app/globals.css`
- `tests/ui/**`, `tests/e2e/**`

Work:

- Build a desktop conversation/artifact split and a mobile full-width artifact sheet.
- Use a warm off-white, charcoal, and safety-orange workshop-console visual system with instrument-style typography and large touch targets.
- Add hard-prompt launch cards, machine-context controls, safe progress states, clarification choices, cancel/retry/reset, and error recovery.
- Implement four core artifact programs: polarity connection diagram, duty-cycle timeline/calculator, troubleshooting flow, and manual evidence viewer.
- Add Proof Mode so any claim or artifact element opens the exact source crop, transformation type, and validation status.
- Preserve text answers when visuals fail; never execute model-authored JavaScript.

Verification:

- Component tests cover all event and artifact states, unsupported versions, conflicting emissions, long content, zero results, and missing images.
- Browser tests cover desktop, phone, keyboard-only use, focus order, screen-reader names, color contrast, reduced motion, and print/share output.

### Phase 6: Flagship `verify before you act` flow

Files:

- `src/domain/preflight.ts`, `src/agent/tools/analyze-setup-photo.ts`
- `src/components/preflight/**`, `src/app/api/preflight/route.ts`
- `evals/photo-preflight/**`, `tests/preflight/**`

Work:

- Let the user choose a source-backed setup such as gasless flux-core or TIG.
- Accept front-panel and inside-machine photographs after the core gate passes.
- Represent vision results as bounded observations with confidence and visible uncertainty, never as source facts.
- Compare observations against deterministic expected configuration.
- Overlay expected versus observed sockets, cables, controls, wire, and gas state on the photo.
- Refuse a pass when conditions are occluded, ambiguous, unsupported, the wrong machine, or unsafe to infer.
- Link every expected state and discrepancy to an exact source region and advance to guided steps only after verification.

Verification:

- Cases cover correct setup, reversed polarity, occluded socket, low light, irrelevant image, wrong machine, multiple machines, manipulated labels, and prompt injection inside the image.
- No-photo and unsupported-process paths remain complete and useful.

### Phase 7: Knowledge operations and support-case continuity

Files:

- `src/domain/knowledge-gap.ts`, `src/domain/expert-fact.ts`
- `src/app/gaps/page.tsx`, `src/app/api/gaps/**`
- `src/components/support-case/**`, `src/app/api/cases/**`
- `tests/knowledge-ops/**`, `tests/support-case/**`

Work:

- Turn insufficient evidence into a structured gap with question, context, searched evidence, missing relation/visual, proposed technician question, and affected eval category.
- Add a small local expert panel that records field knowledge separately from manual facts, requires verification before publication, versions changes, and reruns impacted evals.
- Accumulate user observations, checks, eliminated causes, safety stops, resolution, and evidence into an exportable support case.
- Generate a clean escalation brief without hidden reasoning or secrets.

Verification:

- Unverified expert corrections cannot affect live answers.
- Publishing a fact invalidates only linked retrieval/eval caches and preserves history.
- Export includes all visible session evidence, excludes provider/session secrets, and is deterministic.

### Phase 8: Evaluation, documentation, and submission release

Files:

- `evals/core/**`, `evals/extended/**`, `evals/holdout/**`, `evals/results/**`
- `scripts/run-evals.mjs`, `scripts/report-evals.mjs`, `scripts/smoke-clean-clone.mjs`
- `README.md`, `docs/architecture.md`, `docs/demo-script.md`, `docs/release-checklist.md`
- `.github/workflows/ci.yml`

Work:

- Build at least 80 live adversarial cases plus offline fact, retrieval, schema, event, race, accessibility, and mutation tests.
- Separate visible tuning cases from sealed holdout cases.
- Preserve raw validated envelopes, tool calls, artifacts, latency, cost, and failures.
- Block release on any deterministic or safety failure, offline test failure, citation precision/recall below 95%, invalid artifact rate above 5%, or holdout aggregate below 90%.
- Document architecture, extraction, Agent SDK usage, source model, answer gate, artifacts, threat model, tradeoffs, setup, and troubleshooting.
- Run a timed clean-clone smoke test; create a concise recording script that demonstrates the three required prompts, photo preflight, Proof Mode, knowledge gap, and support case.
- Only after local release passes, add a hosted deployment with rate and spend controls.

Verification:

- CI is green from a fresh checkout.
- README path from clone to first screen is under two minutes.
- Demo script contains no pre-baked answer dependency.
- Final gstack `/review`, `/qa`, `/benchmark`, and `/no-mistakes` passes report no blocking finding.

### Explicitly not in the submission-critical path

- Arbitrary model-generated JavaScript or unrestricted JSX.
- A generic vector database or external ingestion service.
- Voice as the main differentiator.
- Product-agnostic multi-document ingestion before OmniPro quality is proven.
- Broad account/auth/billing systems.
- Public hosting before local accuracy, safety, and spend controls pass.

## Review record

No plan-review decisions recorded yet.
