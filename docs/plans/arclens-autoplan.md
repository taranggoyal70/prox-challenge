<!-- /autoplan restore point: "/Users/tarang/.gstack/projects/prox-technologies-prox-challenge/main-autoplan-restore-20261026-011407.md" -->
# ArcLens implementation plan

Source design: [ArcLens assessment design](../designs/arclens-assessment.md)
Competitive research: [fork landscape](../research/fork-landscape.md), [feature matrix](../research/fork-feature-matrix.md)
Status: APPROVED FOR IMPLEMENTATION

## Implementation plan

### Goal

Ship the most inspectable and falsifiable technical-support agent in the public Prox challenge cohort. ArcLens must match the strongest public reliability baseline, use the Claude Agent SDK in the real execution path, and differentiate through photo-based setup verification, exact source-region Proof Mode, a shipped knowledge-gap correction loop, and exportable support cases.

### Non-negotiable release gates

1. A clean clone reaches the no-key or ready state in under two minutes on Node 24.
2. The three prompts from the challenge README are correct, grounded, and rendered through distinct useful artifacts.
3. Free-form Claude output never reaches the browser. `submit_answer` is the only answer path.
4. Every manual-backed technical claim resolves to a canonical one-based PDF page; visual facts, numeric settings, diagram labels, and artifact values require an exact region. Page-level fallback is permitted only for prose guidance with no stable subregion, is visibly labeled, and scores below region-grounded evidence. Verified field knowledge uses a separate provenance class and never masquerades as a manual citation.
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
- Allow only the five MCP tools, use non-interactive fail-closed permissions, an empty temporary working directory, eight turns, a 45-second timeout, cancellation, and a $0.75 default per-request budget ceiling.

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
- Recover expired sessions from a bounded client-carried payload of prior user turns and already validated envelopes/source IDs. Revalidate its schema and source IDs, treat recovered assistant prose as untrusted context rather than evidence, and rerun retrieval for every new answer.

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

### Phase 5.5: Core proof gate

Files:

- `evals/core/**`, `evals/holdout/core/**`, `scripts/run-core-gate.mjs`, `evals/results/core-gate.json`

Work:

- Implement `npm run gate:core` immediately after Phase 5. It runs all offline suites, the exact three challenge prompts, 40 live adversarial core cases, the four core artifact families, safety/abstention, citation, session-race, and mutation checks.
- Require zero deterministic or safety failures, at least 95% citation precision/recall, at least 90% required clarification, at least 95% valid artifacts, and at least 90% sealed-holdout aggregate.
- Record corpus/prompt/schema/model versions, raw validated envelopes, tool receipts, latency, and cost in `core-gate.json`. CI and the implementation sequence block Phases 6 and 7 unless this report passes.

Verification:

- Corrupting polarity, page mapping, citations, the tool allowlist, or an artifact value makes the gate fail.
- The core gate runs with concurrency 2, transport/rate-limit retries only, a 30-minute wall limit, and a $12 total budget cap.

### Phase 6: Flagship `verify before you act` flow

Files:

- `src/domain/preflight.ts`, `src/preflight/analyze-setup-photo.ts`
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

- Start only after `npm run gate:core` produces a passing `evals/results/core-gate.json`; Phase 7 has the same executable prerequisite as Phase 6.
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

- Preserve the 40-case blocking core suite and add up to 40 feature-specific extended live cases for implemented photo preflight, knowledge operations, support cases, and optional polish. The full release report covers at least 80 live cases only when every extended feature ships.
- Separate visible tuning cases from sealed holdout cases.
- Preserve raw validated envelopes, tool calls, artifacts, latency, cost, and failures.
- Block release on any deterministic or safety failure, offline test failure, citation precision/recall below 95%, invalid artifact rate above 5%, or holdout aggregate below 90%.
- Document architecture, extraction, Agent SDK usage, source model, answer gate, artifacts, threat model, tradeoffs, setup, and troubleshooting.
- Run a timed clean-clone smoke test; create a concise recording script that demonstrates the three required prompts, photo preflight, Proof Mode, knowledge gap, and support case.
- Treat hosted deployment as an optional promotion milestone after the local release; it does not affect local submission readiness and requires separate rate and spend controls.

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


<!-- autoplan-accepted:ceo -->
- Photo uploads accept only JPEG, PNG, or WebP up to 10 MB; validate decode and dimensions, strip metadata, and test malformed, oversized, misleading, and prompt-injected images.
- The in-memory session store holds at most 32 active sessions; LRU eviction applies only to idle sessions, active requests are never evicted, and the limit/eviction behavior has deterministic tests.
- Expert-knowledge mutation is enabled for local single-user evaluation; hosted builds require `ADMIN_TOKEN`, otherwise mutation routes are disabled and the panel is read-only.
- Add a sanitized, read-only no-key replay gallery built from validated golden answer envelopes; it never presents replay output as a live model response.
- Photo analysis is a request-scoped server service that runs before the Agent SDK. It is not a sixth agent tool. Verify the decoded signature matches the declared type, reject decompression or pixel bombs above 24 megapixels, re-encode to a metadata-free working image, keep uploads out of logs/evals/exports by default, delete temporary bytes at request completion, allow at most two concurrent image analyses, and test every lifecycle outcome.
- If all 32 sessions are active, reject admission with typed `session_capacity` and `Retry-After: 5`; idle TTL is 30 minutes, each session holds at most 24 user turns and 256 KB of validated text/envelope history, and request-scoped images/artifacts do not live in the session store.
- A replay fixture is generated from a validated envelope through an allowlist sanitizer, binds answer/artifact/source-schema and corpus checksums, is visibly labeled `Recorded proof`, and fails `knowledge:check` on stale schema, stale sources, secrets, or unexpected user data.
- The three blocking prompt oracles are: (1) MIG at 200 A on 240 V must state 25%, 2.5 minutes welding and 7.5 resting, cite owner-manual PDF page 19, and render a duty timeline; (2) flux-cored porosity must clarify process when omitted, check DCEN and the documented causes, cite polarity/troubleshooting regions, and render a diagnostic flow; (3) TIG polarity must place ground positive and torch negative, cite the setup region, include the safety context, and render a connection diagram.
- Hosted expert mutations use one authorization middleware: `Authorization: Bearer` token compared in constant time, same-origin browser requests with CSRF protection, no query-string token, fail-closed startup for weak configured tokens, route-matrix tests for absent/invalid/valid credentials, and audit fields for request ID, timestamp, action, fact version, and result without secret values.
- Provenance is discriminated as `manual` or `verified_field`. Manual claims use `SourceRef`; field claims use versioned expert fact ID, author label, verification state, and history. The UI never renders field knowledge as manual evidence, and the blocking core suite uses manual facts only.
- Exact regions are mandatory for numeric facts, polarity, controls, diagram labels, visual observations, and artifact values. Page-only fallback is allowed for general prose when no stable region exists, is visibly labeled, and cannot satisfy a region-required eval.
- The default `claude-sonnet-5-5` at high effort is an explicit CEO choice for the accuracy/latency tradeoff. Startup checks model access and fails actionably; `CLAUDE_MODEL` and `CLAUDE_EFFORT` overrides are recorded in every eval result and never silently substituted.
- The live evaluation budget is split: an 8-case PR smoke gate capped at $2 and 8 minutes; a 40-case core release gate capped at $12 and 30 minutes; extended cases capped at an additional $12. Concurrency is 2, only transport/429 failures retry with bounded backoff, and semantic failures never auto-retry.
- `npm run gate:core` is the named executable prerequisite for Phases 6 and 7 and writes `evals/results/core-gate.json`; Phase 8 aggregates rather than first creating the gate.
- Clean-clone timing includes clone checkout already complete, cold `npm ci`, `npm run doctor`, production build, server start, and successful health/landing request on an Ubuntu 24.04 two-core CI runner with no npm cache; run three times, require median at most 120 seconds and every run at most 150 seconds.
- Restart recovery is client-carried and non-authoritative: the browser resubmits bounded visible user turns plus previously validated envelopes/source IDs, the server revalidates all IDs, and new answers rerun retrieval. No durable provider session is assumed.
- Expert facts persist in a local `node:sqlite` database with transactional append-only versions, atomic publish plus impacted-eval invalidation, crash/partial-write tests, and rollback to a prior published version. Hosted public mutation remains disabled unless explicitly authorized.
- The immutable hard-prompt fixtures contain the exact strings `What's the duty cycle for MIG welding at 200A on 240V?`, `I'm getting porosity in my flux-cored welds. What should I check?`, and `What polarity setup do I need for TIG welding? Which socket does the ground clamp go in?`; `knowledge:check` records and verifies their UTF-8 content hashes beside the existing prompt-specific oracles.
- `ARCLENS_DEPLOYMENT_MODE` accepts only `local` or `hosted` and defaults to `hosted`. `local` mutation mode is rejected when `NODE_ENV=production`; missing/invalid modes fail closed, hosted mode always requires the admin middleware, and startup tests cover every misconfiguration.
- `Strongest public reliability baseline` refers to the 2026-10-26 public-fork audit in `docs/research/`: match or exceed a 40-case blocking live core gate, 95% citation precision/recall, 100% deterministic and safety accuracy, 95% valid artifacts, visible raw result evidence, CI, and under-two-minute setup. The dated comparison is context; the explicit internal thresholds control release.
- CEO decision: use `claude-sonnet-5-5` at high effort by default because current official guidance positions it as the speed/intelligence balance and the core gate measures latency/cost; any configured replacement must support vision, tools, Agent SDK access, and the same thresholds, with no silent fallback.
- Primary persona: a nonprofessional OmniPro owner in a garage who needs the next safe, manual-consistent action. Primary outcomes are 100% deterministic first-action correctness, zero unsafe action recommendations in the safety set, and median time to a useful next action or evidence-complete escalation under 45 seconds. Evaluator inspection is the secondary persona.
- User-visible photo terminology is `Visible setup preflight`. It reports only `visible match`, `visible discrepancy`, `not observable`, or `inconclusive`; never `safe`, `verified overall`, or `pass`. Required capture angles, machine-model confirmation, photo-freshness confirmation, and an explicit unobservable-conditions list precede every result.
- Prototype one narrow gasless-flux-core visible preflight during Phase 2 using fixtures and the expected-state contract; it cannot reach production routes before `npm run gate:core`, but its early usefulness/refusal data decides whether Phase 6 proceeds.
- Add a hazard taxonomy for electric shock/energized service, fire/hot work, shielding gas/fumes, compressed cylinders, UV/PPE, duty-cycle overheating, and unknown equipment state. Each class defines mandatory warnings, allowed guidance, prohibited guidance, stop conditions, evidence requirements, and escalation language; safety suites require 100% per class.
- Region evidence always links to the full page and surrounding context. Evidence scoring measures entailment, qualification completeness, and context retention, not merely region presence. Curate safety, polarity, numeric settings, diagram labels, and the three challenge prompts first.
- The core holdout labels and citation-entailment spot checks are authored independently from prompt/tool implementation, locked before tuning, and reported case by case. Safety-critical categories require 100% individually; aggregate scores cannot hide a class failure.
- Configuration modes are explicit: `build/no-key`, `live-local`, `hosted-read-only`, and `hosted-admin`. Each has required variables, allowed routes, startup behavior, and CI coverage. Missing mode selects `build/no-key` with all live and mutation routes disabled; it never implicitly enables hosted mutation.
- Verify the inherited manual's assessment-use and public-hosting terms before publishing rendered assets. Until then, source PDFs and page renders stay local to the fork and optional hosting is blocked. The photo UI states processing purpose, in-memory/request-only retention, logging/export exclusion, and deletion behavior before upload.
- Benchmark application readiness and network-bound installation separately. The 120-second goal covers the challenge's clone-to-run experience, while reports isolate `npm ci` time from doctor/build/start/health time and record repository plus generated-asset size.
- Compare deterministic wizard, evidence viewer, retrieval-only assistant, technician escalation copilot, and photo-first checker against challenge fit, safety, build effort, memorability, and defensibility. The selected hybrid keeps deterministic flows for high-risk known setups and uses the Agent SDK for intent, retrieval, clarification, and case synthesis.
- Expert field facts require a named verifier role, supporting observation/source, conflict handling, expiry/re-review date, audit history, and visibly distinct presentation. The core answer path remains manual-only until this publication protocol has its own passing extended gate.
<!-- /autoplan-accepted:ceo -->

<!-- autoplan-accepted:design -->
- `docs/designs/arclens-ui-spec.md` is the normative UI contract. Implement owner, inspector, and local-admin information architectures as separate surfaces, with the exact hierarchy, state tables, storyboard, component anatomies, Proof Mode behavior, visual tokens, responsive rules, mode matrix, and accessibility contract it defines.
- Safety-first response anatomy is mandatory: immediate stop and safe next action precede clarification, artifacts, explanation, and evidence; normal answers show direct action, artifact, supporting steps, then evidence.
- The visible setup preflight uses only `visible match`, `visible discrepancy`, `not observable`, and `inconclusive`, each mapped to recapture, manual confirmation, deterministic fallback, correction, or escalation; it never grants an overall safety pass.
- Recorded proof is a separate, visibly recorded gallery with no live-looking input. Owner, inspector, and admin actions vary by the explicit four-mode matrix; unavailable controls are hidden or replaced with setup guidance.
- All core diagrams and photo overlays have keyboard-operable, screen-reader-friendly list or table equivalents; dialogs restore focus; status announcements are bounded; touch targets are at least 44px; forced-colors, 320px, landscape phone, high zoom, and reduced motion are release tests.
- Before Phase 5 UI implementation, create desktop and phone wireframes, four artifact anatomy sheets, and clickable flows for normal, clarification, hazard refusal, partial artifact failure, preflight inconclusive, and escalation states when design tooling is available. Until then the textual UI spec controls implementation.
<!-- /autoplan-accepted:design -->

<!-- autoplan-accepted:dx -->
- `docs/developer-experience.md` is the normative evaluator/developer journey. Phase 1 must implement its two-command no-key quickstart, version preinstall, canonical four-mode `ARCLENS_MODE`, generated `.env.example`, command help, doctor profiles, health/readiness split, public error registry, and minimal tested README.
- Remove the older `ARCLENS_DEPLOYMENT_MODE` two-value behavior. `ARCLENS_MODE` accepts only `build-no-key`, `live-local`, `hosted-read-only`, or `hosted-admin`; unset selects `build-no-key`, invalid values fail startup, and production rejects `live-local`.
- Every public failure maps to `ArcLensError` with stable code, status, retryability, problem, cause, fix, docs URL, request ID when available, and optional retry-after. Contract tests cover startup, scripts, HTTP, NDJSON, and UI and reject secret leakage.
- `npm run dev` runs cheap offline preflight and starts a useful no-key product without a key or manual doctor. `npm run doctor -- --mode <mode>` is deeper and supports stable check IDs, pass/warn/fail/skipped, documented exit codes, and `--json`.
- `npm run help` lists every script with network/key requirement, expected duration, maximum spend, and release impact. Cost-bearing evals require explicit `--yes` or `ARCLENS_ALLOW_SPEND=1` and print caps before requests.
- Generate JSON Schema references and executable examples for all five MCP tools, answer/artifact/event/config/error contracts. Wire names use snake_case, NDJSON media type and versioning are documented, and docs CI validates snippets, links, env names, help snapshots, and examples.
- Documentation starts in Phase 1 and follows tutorial/how-to/reference/explanation/operations structure. Add changelog, contributing, security, issue templates, mode guides, error catalog, config/command/API/tool/schema reference, corpus maintenance, expert publication, and eval-cost guidance as their features land.
- Use one typed configuration module with documented defaults, ranges, precedence, and override classes. Safety invariants cannot be weakened by configuration; attempts fail startup. Effective non-secret configuration appears in doctor and eval results.
- Measure install, offline preflight, build, readiness, first recorded proof, and first live answer separately. Publish machine-readable results and run post-implementation `/devex-review` against ≤2-minute no-key and ≤3-minute live targets.
<!-- /autoplan-accepted:dx -->

<!-- autoplan-accepted:eng -->
- `docs/architecture.md` is the normative architecture contract. Before Agent SDK integration, implement and test the trusted claim/computation grammar, transactional request/event state machine, single-process mode/topology/admission contract, and photo observation/resource contract.
- Safety-critical, numeric, polarity, control, procedure, and artifact values use server-owned predicate/fact/computation IDs and receipts. Claude may select supported inputs but cannot author validated outputs or self-declare safety class. Residual prose entailment can only reject, clarify, or abstain.
- Stage sources, artifacts, tool receipts, and answer envelope inside one request transaction. Commit the referenced bundle atomically only after validation; discard in `finally` on cancel, timeout, disconnect, crash, or repair failure. NDJSON emits only committed bundles with monotonic sequence and one terminal event.
- Live modes are single-process v1. Hosted readiness fails unless one replica, signing secret, quota/budget controls, and topology assertions are configured. Multi-instance/serverless live chat remains disabled until a shared correctness backend and two-instance tests exist.
- Use signed HttpOnly session capabilities, global/per-session/per-origin quotas, atomic budget reservation, body/decode limits, request leases/watchdogs, and explicit deadline budgets. Hosted live routes stay disabled until abuse and cleanup chaos tests pass.
- Client restart recovery accepts user turns only; prior assistant output is never trusted as validated context or exported evidence after restart.
- Pin the complete knowledge generator toolchain and byte-compare temporary regeneration. Define region coordinates with page box/rotation/dimensions/renderer/DPI/checksum/context and golden drift tests. Rights verification precedes committing or hosting derived manual assets.
- `PhotoObservationService` is an explicit bounded provider interface with allowlisted observation output, offline fake, budget/timeout/cancel receipt, header-first single-frame decode limits, fixed re-encoding, hostile OCR handling, and guaranteed cleanup.
- Browser admin exchanges the bootstrap token server-side for a short-lived SameSite HttpOnly session with Origin and CSRF protection. SQLite uses migrations, transactions, WAL/busy policy, durable outbox, crash/disk/read-only/corruption tests, backup, and rollback.
- Model prose renders as plain text or minimal sanitized Markdown. All assets resolve from server-generated IDs through allowlisted local maps. Apply CSP, nosniff, safe downloads, path normalization, and hostile Markdown/URL/Unicode tests; never render model SVG or URLs.
- Live gates use atomic suite budgets, case-level results, repeated/variance-aware safety trials, per-category 100% safety/deterministic thresholds, and holdout grading outside the tuning path. Separate provider, validation, and transport deadlines.
- Implement every suite and release blocker in `docs/test-plan.md` alongside the feature. A feature is incomplete until its unit/property, integration, browser, fault-injection, security, eval, and mutation proof is present.
<!-- /autoplan-accepted:eng -->

## Approval readiness

PASS. Every accepted requirement is backed by the user's approved design direction, an autoplan mechanical decision, or a recorded provisional taste decision for the final gate. No policy or implementation choice is unanswered. Taste decisions remain reversible until final approval.

## NOT in scope

- Full offline/PWA mode: deferred until field demand justifies stale-data and sync complexity; recorded proof covers no-key evaluation.
- Product-agnostic multi-manual ingestion: rejected for the submission because OmniPro-specific trust is the product proof.
- Arbitrary model JavaScript, JSX, SVG, URLs, or filesystem paths: rejected for safety and deterministic rendering.
- Horizontal multi-instance live hosting: blocked until a shared session/lease/cancellation backend and two-instance tests exist.
- Voice as a headline differentiator: public forks have saturated it; it can return only after core gates and accessibility remain green.
- Broad accounts, billing, teams, and enterprise administration: outside the assessment lake.
- Public hosting of manual assets: blocked until rights are confirmed; local evaluation remains primary.

## What already exists

- Three supplied manuals, two product images, and the upstream challenge brief.
- The Claude Agent SDK's in-process MCP surface and resumable sessions, subject to the installed-version spike.
- Node 24 platform capabilities: Web Streams, AbortSignal, Web Crypto, `node:sqlite`, HTTP/cookie primitives, and testable process lifecycle.
- Browser primitives for file input, focus/dialog management, print, reduced motion, forced colors, and accessible controls.
- Public-fork research covering all 158 accessible forks and deep analysis of the strongest implementations.
- No application code exists to preserve or refactor. The project reuses platform capabilities and source assets, not competitor code.

## Dream state delta

```text
CURRENT                         APPROVED PLAN                      12-MONTH IDEAL
manuals + public demos     ->   trusted OmniPro vertical slice -> product-family evidence compiler
page citations            ->   claim/region Proof Mode        -> every support action auditable
free-form model answers    ->   typed claims + computations    -> formal product-knowledge runtime
user-reported setup        ->   visible setup preflight        -> multimodal field-service copilot
one-off questions          ->   support cases + gaps           -> customer questions improve knowledge
```

## Error and rescue registry

| Path | Failure classes | Rescue | User result | Required proof |
|---|---|---|---|---|
| Startup/config | version, invalid mode, invariant override, weak secret | stop before app or select build-no-key | problem/cause/fix/docs | preinstall/config matrix |
| Knowledge | missing, stale, corrupt, renderer drift, rights blocked | disable live answers/replay as applicable | integrity or acquisition action | byte compare/mutations |
| Admission | body, rate, quota, budget, capacity, invalid session | reject before spend | typed retry/wait/reconfigure | concurrent abuse tests |
| Agent SDK | spawn, model access, timeout, refusal, unauthorized tool | abort, one bounded repair only for missing envelope | preserved input + typed error/abstention | fake SDK + live smoke |
| Validation | malformed/contradicted/uncited/safety-incomplete claim | reject; never stream | clarification/abstention | property + mutation tests |
| Artifact | invalid, duplicate, unsupported, missing crop | discard or component-local failure; preserve answer | localized retry/fallback | schema/idempotency tests |
| Event transport | invalid UTF-8, truncation, backpressure, disconnect, duplicate terminal | abort or committed-bundle completion | one terminal state | fuzz/fault tests |
| Session | overlap, expired, leak, restart, cross-session access | busy/restore-user-turns/watchdog/deny | preserved question + clear state | fake-clock/race/chaos |
| Photo | bad type, bomb, animation, hostile text, provider failure, inconclusive | reject/cleanup/recapture/manual path | bounded visible result | decoder/security corpus |
| Expert data | auth/CSRF/conflict/disk/crash/corruption | deny/transaction/read-only/rollback | actionable admin state | crash/security tests |
| Rendering/export | XSS, path, URL, missing asset, private bytes | sanitize/allowlist/omit/retry | safe text/evidence or export notice | hostile fixture tests |

No silent/unrescued path is approved. A missing rescue or failure test is a release-blocking critical gap.

## Required diagrams

The maintained architecture, request transaction, topology, source region, photo, SQLite, lane, and test-flow diagrams live in [architecture.md](../architecture.md), [arclens-ui-spec.md](../designs/arclens-ui-spec.md), and [test-plan.md](../test-plan.md). Implementation must copy focused state/pipeline diagrams into complex source modules and update them in the same change as the code.

## Implementation Tasks

- [ ] **T1 (P1, human: ~1 day / CC: ~2h)** — Foundation — Scaffold Node 24 Next.js with typed config, ArcLensError, two-command no-key start, and CI.
  - Surfaced by: DX review, startup and error contract gaps.
  - Files: `package.json`, `src/config/**`, `src/domain/errors/**`, `scripts/**`, `README.md`, `.github/workflows/ci.yml`
  - Verify: cold no-key smoke plus config/error contract tests.
- [ ] **T2 (P1, human: ~3 days / CC: ~8h)** — Knowledge — Build the rights-aware, byte-reproducible source package and visual evidence catalog.
  - Surfaced by: CEO/Eng reviews, visual-only and drift risks.
  - Files: `scripts/build-knowledge.mjs`, `src/knowledge/**`, `public/manual-*`, `tests/knowledge/**`
  - Verify: temporary regeneration byte-compare, gold retrievals, mutation tests.
- [ ] **T3 (P1, human: ~3 days / CC: ~8h)** — Domain — Implement trusted claim grammar, hazard policy, deterministic facts, computations, and receipts.
  - Surfaced by: Eng findings 1–2.
  - Files: `src/domain/**`, `tests/domain/**`
  - Verify: property tests and mutations for every deterministic/safety class.
- [ ] **T4 (P1, human: ~3 days / CC: ~8h)** — Agent runtime — Implement five MCP tools, locked-down Agent SDK adapter, and one-answer-envelope gate.
  - Surfaced by: Challenge requirement and Eng tool-boundary findings.
  - Files: `src/agent/**`, `tests/agent/**`
  - Verify: installed SDK contract spike, zero built-ins assertion, free-text/repair/refusal tests.
- [ ] **T5 (P1, human: ~3 days / CC: ~8h)** — Protocol — Implement request transaction, signed sessions, admission quotas, budget ledger, leases, and committed NDJSON transport.
  - Surfaced by: Eng findings 3–7, 16–17.
  - Files: `src/agent/request-*`, `src/persistence/**`, `src/app/api/**`, `src/lib/agent-stream.ts`
  - Verify: race, disconnect, parser fuzz, cleanup chaos, and abuse tests.
- [ ] **T6 (P1, human: ~3 days / CC: ~6h)** — UI — Implement the owner workspace, four core artifacts, Proof Mode, and complete state/accessibility matrix.
  - Surfaced by: Design review 36 findings.
  - Files: `src/app/page.tsx`, `src/components/**`, `src/app/globals.css`, `tests/ui/**`, `tests/e2e/**`
  - Verify: desktop/phone/keyboard/forced-color/reduced-motion/browser flows.
- [ ] **T7 (P1, human: ~1 day / CC: ~2h)** — Recorded proof — Generate sanitized, checksum-bound no-key fixtures and a distinct gallery.
  - Surfaced by: CEO taste decision and evaluator friction.
  - Files: `src/replay/**`, `public/replay/**`, `src/app/recorded-proof/**`
  - Verify: fixture integrity, PII/secret scan, non-live UX test.
- [ ] **T8 (P1, human: ~4 days / CC: ~10h)** — Core gate — Build offline, live holdout, security, race, mutation, and cost-bounded reporting.
  - Surfaced by: Competitive bar and Eng test review.
  - Files: `evals/core/**`, `evals/holdout/**`, `scripts/run-core-gate.mjs`, `docs/test-plan.md`
  - Verify: `npm run gate:core` and intentional mutation failures.
- [ ] **T9 (P1, human: ~3 days / CC: ~8h)** — Visible preflight — Build bounded image sanitation, PhotoObservationService, overlays, and deterministic comparison.
  - Surfaced by: Winning thesis and Eng findings 11–12.
  - Files: `src/preflight/**`, `src/components/preflight/**`, `src/app/api/preflight/**`, `tests/preflight/**`
  - Verify: adversarial photo corpus, cleanup, budget, uncertainty, and fallback cases.
- [ ] **T10 (P2, human: ~3 days / CC: ~8h)** — Support operations — Build cases, gaps, guarded expert publication, SQLite versioning, and export.
  - Surfaced by: Prox business thesis and competitive gap.
  - Files: `src/domain/knowledge-gap.ts`, `src/persistence/**`, `src/app/gaps/**`, `src/components/support-case/**`
  - Verify: auth/CSRF, crash/disk/conflict/outbox, publication gate, deterministic export.
- [ ] **T11 (P1, human: ~2 days / CC: ~4h)** — Documentation — Maintain tested README, tutorials, how-tos, references, architecture, errors, costs, release, and demo script throughout implementation.
  - Surfaced by: DX review, documentation arrived too late.
  - Files: `README.md`, `docs/**`, `examples/**`, `scripts/check-docs.mjs`
  - Verify: docs CI, examples, links, env/schema/help snapshots.
- [ ] **T12 (P1, human: ~2 days / CC: ~4h)** — Final release — Run gstack review/QA/benchmark/no-mistakes, clean-clone timing, video walkthrough, and optional hosting promotion.
  - Surfaced by: Challenge presentation requirements.
  - Files: `docs/release-checklist.md`, `docs/demo-script.md`, `evals/results/**`
  - Verify: all local gates green, no blocking review finding, submission form readiness.

## Autoplan completion summary

| Phase | Result |
|---|---|
| CEO | SELECTIVE EXPANSION; spec review 5→8→9 PASS; 13 native issues reconciled; outside unavailable |
| Design | 3→9 planned; 36 native issues reconciled into normative UI spec; mockup tool unavailable |
| DX | 3→9 planned; champion target; 16 native issues reconciled; outside unavailable |
| Engineering | 21 native issues reconciled; 0 remaining critical gaps; outside unavailable |
| Competitive research | 158 public forks inventoried; 80 substantive roots/README/manifests inspected; 15 deep README reviews |
| User challenges | 0; no second external model completed, so none can meet the two-model threshold |
| Taste decisions | 3 provisional: recorded-proof gallery, post-core knowledge ops/support cases, 40-case core live gate |
| Deferred | Full offline/PWA only |
| Lake score | 10/10 on every coverage decision; kind-only taste choices excluded |
| Unresolved | 0 implementation/policy decisions; final user approval pending |

## Review record

### CEO review: SELECTIVE EXPANSION

Review depth: implementation-ready.
Base branch: `main`.
UI scope: yes. DX scope: yes.
Repository state: upstream challenge contains manuals and product images only; all application code is greenfield.

#### Decision ledger

| ID and owner | Contract and evidence | Current | Proposed | Status | Exact approval and scope |
|---|---|---|---|---|---|
| CEO-1 / user | Build a submission that survives hard evaluation and differentiates from public forks | Evidence-first ArcLens with Proof Mode, preflight, knowledge gaps, support cases | Keep current direction | approved | User approved option A after the office-hours review; scope is the approved design and recorded concerns |
| CEO-2 / CEO review | Photo input attack surface | Photo preflight is post-core, but upload validation was implicit | Add JPEG/PNG/WebP allowlist, 10 MB limit, decode/dimension checks, metadata stripping, and image-prompt-injection handling | approved, mechanical | Autoplan principle 1: complete the accepted photo flow and its directly required safety tests |
| CEO-3 / CEO review | Session-store resource bounds | In-memory TTL defined, total capacity implicit | Cap at 32 active sessions with LRU eviction only for idle sessions; active work is never evicted | approved, mechanical | Autoplan principles 3 and 5: explicit bounded behavior within the existing session-store scope |
| CEO-4 / CEO review | Expert correction permissions | Local expert panel accepted, public behavior implicit | Local single-user editing; hosted builds disable mutation unless `ADMIN_TOKEN` is configured | approved, mechanical | Autoplan principle 1: prevents anonymous knowledge poisoning without adding an account system |
| CEO-5 / CEO review | No-key evaluator experience | Actionable no-key state | Add a read-only replay gallery from sanitized, validated golden envelopes | taste, provisional | Recommended because it proves the UI and evidence model without spending credits; surfaced at final gate |
| CEO-6 / CEO review | Offline/PWA workshop mode | Not planned | Full offline/PWA support | deferred | Outside the assessment lake; static replay covers evaluator resilience without a service-worker product branch |
| CEO-7 / CEO review | Product-agnostic ingestion | Explicitly excluded | Generalize beyond OmniPro | declined | Competitive research shows breadth is common; product-specific trust is the differentiator |

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| 1 | CEO | Complete upload validation inside photo-preflight scope | Mechanical | Completeness | Photo verification is unsafe without bounded decoding, metadata stripping, and adversarial-image handling | Prompt-only image safety |
| 2 | CEO | Bound in-memory sessions at 32 with idle-only LRU | Mechanical | Explicit over clever | Makes memory and eviction behavior testable without introducing a database | Unbounded map; database-backed sessions |
| 3 | CEO | Disable hosted expert mutations unless an admin token exists | Mechanical | Completeness | Prevents public demo users from poisoning field knowledge while preserving the local evaluator flow | Anonymous mutation; full auth system |
| 4 | CEO | Recommend a sanitized no-key replay gallery | Taste | Bias toward action | Removes evaluator friction and demonstrates the product shell when no API request can run | Blank disabled state; fake canned chat |

#### 0A: premise challenge

The real problem is not “chat with a welding manual.” Roughly ninety public forks already attempt that. The problem is proving that an agent can observe a physical setup, distinguish source facts from model observations, block unsafe confidence, and make every user-visible claim inspectable. The plan attacks that pain directly. Doing nothing means the submission looks competent but interchangeable with many public implementations.

#### 0B: existing leverage

- Reuse the three supplied PDFs and two product images as the immutable source corpus.
- Reuse Poppler only during development to generate committed assets; evaluators do not install it.
- Reuse the Claude Agent SDK's in-process MCP tool surface and session resume behavior.
- Reuse native browser primitives for file input, printing, focus management, and reduced motion.
- No application code exists to refactor. Fork research is evidence, not a source-code dependency.

#### 0C: dream-state mapping

```text
CURRENT                         THIS PLAN                         12-MONTH IDEAL
manuals + duplicate demos  ->  inspectable OmniPro expert  ->   product-family knowledge operations
page-level citations       ->  claim/region proof ledger   ->   every support action is auditable
one-off answers            ->  cases + knowledge gaps      ->   customer questions improve the graph
user-reported setup        ->  photo preflight verifier    ->   multimodal field-service copilot
```

The plan moves toward the ideal through reusable domain contracts, but correctly refuses product-agnostic ingestion before OmniPro quality is proven.

#### Mode analysis and scope

Mode is SELECTIVE EXPANSION because the approved plan is already large and distinct. The review keeps the four differentiation pillars, accepts only safety and evaluator-friction work inside their blast radius, and rejects platform breadth. No new approach decision was needed.

#### Temporal interrogation

- Hour 1: lock runtime versions, source identity, fact schema, and knowledge integrity. Any ambiguity here poisons every later layer.
- Hours 2–3: implement retrieval, five MCP tools, `submit_answer`, grounding, and request collector. The main surprise risk is Agent SDK message/tool ordering.
- Hours 4–5: integrate validated NDJSON events, session races, and four core renderers. The likely surprise is buffering a correct envelope without duplicating artifacts.
- Hour 6+: run hard prompts, accessibility, mutation tests, and clean-clone setup before photo preflight or knowledge operations.

#### Section 1: Architecture

The phase order is correct, but feature phases must remain gated by core proof. The authoritative pipeline is source assets → generated knowledge → domain contracts → locked-down Agent SDK → validated answer envelope → event transport → artifact UI. Photo preflight, expert corrections, and case export consume the same contracts rather than branching into separate agent loops.

#### Section 2: Error and rescue map

Mapped required classes: configuration/key/model access, SDK spawn, timeout/cancel, retrieval empty, source corruption, tool validation, missing answer envelope, grounding rejection, artifact validation, upload decode/size/type, session conflict/expiry, expert authorization, export failure, rate limit, and hosted budget stop. Every path needs a typed user-visible result and a test; catch-all logging is not accepted.

#### Section 3: Security

Primary risks are prompt injection in uploaded images or source text, unauthorized Agent SDK tools, oversized/malformed images, public knowledge poisoning, secret leakage, artifact-script execution, and cross-session state exposure. The plan mitigates most structurally. CEO-2 and CEO-4 close the implicit gaps without adding a full auth product.

#### Section 4: Data and interaction edges

The plan already specifies send/cancel/reset/expiry races. Add bounded upload parsing, double-submit prevention, stale artifact replacement, source-image failure, browser back/refresh, and export retry tests. Technical prose stays buffered until validation.

#### Section 5: Code quality

Centralize `SourceRef`, `AnswerEnvelope`, `Artifact`, and `AgentEvent` in domain modules. Never duplicate citation formatting or fact validation in UI renderers. Keep each tool handler thin and delegate deterministic validation to shared functions.

#### Section 6: Tests

The pyramid is appropriate: many offline domain and mutation tests, fewer API/session integrations, focused browser flows, and an expensive live holdout. Live tests must store model, effort, corpus checksum, prompt version, tool events, validated envelope, latency, and cost.

#### Section 7: Performance

The first bottlenecks are page-asset payloads, repeated corpus parsing, Agent SDK cold start, and concurrent image analysis. Load the immutable manifest once per process, lazy-load image assets, cap uploads, cap sessions, and report p50/p95. No external database is justified.

#### Section 8: Observability

Use structured request IDs across tool calls and events. Record phase durations, retrieval scores, grounding failures, artifact validation, model/cost, session state changes, and knowledge-gap creation. Redact user prompts and images by default. Proof Mode can expose evaluator-safe validation status without becoming a chain-of-thought surface.

#### Section 9: Deployment

Local release is first. Hosted deployment is a separate promotion after safety, rate, and budget controls pass. Static knowledge assets and immutable facts make rollback a normal deployment rollback; expert facts require version rollback and impacted-eval rerun.

#### Section 10: Trajectory

Reversibility is 4/5. The Agent SDK and artifact grammar are replaceable behind domain contracts. Product-specific visual curation is intentional domain value, not accidental debt. The main future risk is overfitting UI primitives to four demo questions; novel-composition tests counter it.

#### Section 11: Design and UX

Information order is task → machine context → safe progress → answer/artifact → Proof Mode. Required states are loading, clarification, partial artifact failure, unsupported question, invalid key, provider failure, cancel, expired session, and success. Mobile uses a full-width sheet, not a compressed split pane. Accessibility and reduced motion are release gates.

#### CEO spec review round 1

Score: 5/10. The reviewer found 15 issues across completeness, consistency, clarity, scope, and feasibility. Autoplan accepted the concrete repairs below. The central strategic direction remains unchanged; the changes make its gates executable and remove contradictions.

#### CEO spec review round 2

Score: 8/10. All consistency and feasibility issues passed. Four narrowed issues remained: literal fixture identity, fail-closed deployment-mode detection, definition of the dated public baseline, and ratification of the model/effort choice. The requirements below close each without changing product scope.

#### Independent CEO voice

Native reviewer completed against input `5d808e0d…` with 13 findings. Outside Claude Code coverage was unavailable because the CLI is not installed, so consensus is N/A rather than confirmed.

Accepted findings:

- Reframe the mission around a novice OmniPro owner reaching a safe next action or evidence-complete escalation; cohort leadership is proof, not the product goal.
- Treat photos as a visible-configuration preflight, never an overall safety verification or pass.
- Prototype one preflight slice during knowledge work so the differentiator is tested early, while productionization remains after the core gate.
- Add hazard policy, entailment/context scoring, config modes, rights/consent checks, and independent eval authorship.
- Separate controllable app-start timing from registry/network install timing.

Provisional taste decisions for the final gate:

- Keep the no-key replay gallery because it removes evaluator friction, but label it recorded proof and never use it as answer-quality evidence.
- Keep the expert-correction loop and support-case export after the core gate because they express Prox's business thesis; do not let them delay the flagship slice.
- Keep 40 blocking live core cases because the public field already contains 31–85 case suites; use independently authored labels and per-category safety thresholds to avoid circular proof.

### Design review

Scope gate: the active plan is the target. UI scope is substantial. No `DESIGN.md` or existing application UI exists. The gstack designer binary is unavailable, so no visual variants were generated; [the textual UI specification](../designs/arclens-ui-spec.md) is the normative visual/interaction contract until mockups supersede it.

Initial design completeness: 3/10. The plan named useful surfaces but left hierarchy, states, journey, component anatomy, and tokens to implementation.

#### Design scores

| Pass | Before | After accepted fixes | Why |
|---|---:|---:|---|
| Information architecture | 4 | 10 | Owner, inspector, and admin surfaces; first-screen order; response anatomy; pane behavior; context hierarchy |
| Interaction states | 4 | 10 | Complete request, retrieval, artifact, upload, session, replay, export, cancel, and error-state contracts |
| Journey | 3 | 10 | Owner storyboard from arrival through action, proof, resolution, or escalation |
| AI slop risk | 5 | 9 | OPERATE classification, cardless layout, utility language, specific visual tokens; no visual mockup available to prove 10 |
| Design system | 3 | 9 | Typography, colors, spacing, geometry, surfaces, browser chrome, and content rules specified; rendered calibration pending |
| Responsive/accessibility | 5 | 10 | Desktop/tablet/phone contracts, dialog focus, visual equivalents, targets, zoom, forced colors, reduced motion |

Pass 7: 36 native-review decisions resolved through the UI specification; zero deferred. Native design reviewer completed with 36 findings. Outside Claude Code review is unavailable, so cross-model consensus is N/A.

Hard rejections: none remain. The product is an OPERATE surface, not a marketing page. The landing screen uses one dominant composer and text-list examples, not a SaaS card grid. Artifacts are the interaction, so their contained surfaces are earned.

Litmus scorecard after fixes: brand/product first screen YES; one visual anchor YES after answer/NOT APPLICABLE empty state; scannable YES; one job per section YES; cards necessary only for interactive items YES; motion improves hierarchy YES; premium without shadows YES.

<!-- autoplan-accepted:design -->
- `docs/designs/arclens-ui-spec.md` is the normative UI contract. Implement owner, inspector, and local-admin information architectures as separate surfaces, with the exact hierarchy, state tables, storyboard, component anatomies, Proof Mode behavior, visual tokens, responsive rules, mode matrix, and accessibility contract it defines.
- Safety-first response anatomy is mandatory: immediate stop and safe next action precede clarification, artifacts, explanation, and evidence; normal answers show direct action, artifact, supporting steps, then evidence.
- The visible setup preflight uses only `visible match`, `visible discrepancy`, `not observable`, and `inconclusive`, each mapped to recapture, manual confirmation, deterministic fallback, correction, or escalation; it never grants an overall safety pass.
- Recorded proof is a separate, visibly recorded gallery with no live-looking input. Owner, inspector, and admin actions vary by the explicit four-mode matrix; unavailable controls are hidden or replaced with setup guidance.
- All core diagrams and photo overlays have keyboard-operable, screen-reader-friendly list or table equivalents; dialogs restore focus; status announcements are bounded; touch targets are at least 44px; forced-colors, 320px, landscape phone, high zoom, and reduced motion are release tests.
- Before Phase 5 UI implementation, create desktop and phone wireframes, four artifact anatomy sheets, and clickable flows for normal, clarification, hazard refusal, partial artifact failure, preflight inconclusive, and escalation states when design tooling is available. Until then the textual UI spec controls implementation.
<!-- /autoplan-accepted:design -->

### Developer experience review

Product type: AI agent application with local CLI/scripts, HTTP/NDJSON contracts, MCP tools, documentation, and evaluation tooling. Mode: DX POLISH.

Primary developer persona: a Prox reviewer or engineer cloning an unfamiliar submission under time pressure. Their tolerance is under two minutes to useful no-key proof and under three minutes to a first live validated answer after supplying a key.

Magical moment: the evaluator selects the TIG prompt and receives a connection diagram whose cable/socket elements open the exact manual crop and full-page context. No-key mode delivers the same scene as persistently labelled recorded proof; live-local uses the real Agent SDK path.

Competitive benchmark: public forks make hosted demos and committed corpora common. ArcLens differentiates with a two-command no-key start, a mode-aware doctor, generated wire/schema references, one actionable error contract, explicit spend confirmation, and verifiable release reports.

DX scores: Getting Started 4→10; API/CLI 5→9; Errors 3→10; Documentation 2→10; Upgrade 1→8; Environment 4→9; Community 2→8; Measurement 4→10. Overall 3→9. TTHW target is champion tier.

Native DX reviewer completed with 16 findings. Outside Claude Code coverage is unavailable. All findings are resolved in [the DX contract](../developer-experience.md); consensus is N/A.

<!-- autoplan-accepted:dx -->
- `docs/developer-experience.md` is the normative evaluator/developer journey. Phase 1 must implement its two-command no-key quickstart, version preinstall, canonical four-mode `ARCLENS_MODE`, generated `.env.example`, command help, doctor profiles, health/readiness split, public error registry, and minimal tested README.
- Remove the older `ARCLENS_DEPLOYMENT_MODE` two-value behavior. `ARCLENS_MODE` accepts only `build-no-key`, `live-local`, `hosted-read-only`, or `hosted-admin`; unset selects `build-no-key`, invalid values fail startup, and production rejects `live-local`.
- Every public failure maps to `ArcLensError` with stable code, status, retryability, problem, cause, fix, docs URL, request ID when available, and optional retry-after. Contract tests cover startup, scripts, HTTP, NDJSON, and UI and reject secret leakage.
- `npm run dev` runs cheap offline preflight and starts a useful no-key product without a key or manual doctor. `npm run doctor -- --mode <mode>` is deeper and supports stable check IDs, pass/warn/fail/skipped, documented exit codes, and `--json`.
- `npm run help` lists every script with network/key requirement, expected duration, maximum spend, and release impact. Cost-bearing evals require explicit `--yes` or `ARCLENS_ALLOW_SPEND=1` and print caps before requests.
- Generate JSON Schema references and executable examples for all five MCP tools, answer/artifact/event/config/error contracts. Wire names use snake_case, NDJSON media type and versioning are documented, and docs CI validates snippets, links, env names, help snapshots, and examples.
- Documentation starts in Phase 1 and follows tutorial/how-to/reference/explanation/operations structure. Add changelog, contributing, security, issue templates, mode guides, error catalog, config/command/API/tool/schema reference, corpus maintenance, expert publication, and eval-cost guidance as their features land.
- Use one typed configuration module with documented defaults, ranges, precedence, and override classes. Safety invariants cannot be weakened by configuration; attempts fail startup. Effective non-secret configuration appears in doctor and eval results.
- Measure install, offline preflight, build, readiness, first recorded proof, and first live answer separately. Publish machine-readable results and run post-implementation `/devex-review` against ≤2-minute no-key and ≤3-minute live targets.
<!-- /autoplan-accepted:dx -->

### Engineering review

Scope challenge: original feature scope retained, but implementation is re-sequenced into gated vertical lanes. The hard minimum release slice is three challenge prompts, trusted claim/computation grammar, four artifacts, Proof Mode, hazard policy, recorded proof, and one narrow visible-preflight experiment. Expert publication and durable support operations remain after the core gate and cannot delay the minimum slice.

Existing code leverage: the repo provides source manuals/images only. Reuse platform/standard capabilities: Next.js Node routes, Agent SDK in-process MCP, Node `node:sqlite`, Web Streams/AbortSignal, Web Crypto, native cookies/headers, and committed generated assets. Do not invent a vector service, queue, or multi-service deployment.

Architecture findings: 8 primary issues accepted: untrusted model claims; circular derived artifact values; transactional answer/artifact/event commit; single-process hosting limits and spend abuse; reproducible regions/knowledge generation; bounded photo service; config/auth/storage/rendering security; phase sequencing.

Code-quality findings: centralize domain/config/error contracts; explicit dependency injection for request context; no direct `process.env` outside config; no fact logic in UI/tools/routes; one canonical public error registry; no model-authored URLs/paths/HTML/SVG.

Test review: all proposed paths are greenfield gaps until implemented. [The test plan](../test-plan.md) maps knowledge, request, owner, photo, and knowledge-operation branches to unit, property, integration, E2E, eval, chaos, and mutation proof. Critical gaps are zero only if every listed release-blocking suite lands with the feature.

Performance findings: immutable knowledge loads once; static images are lazy; provider/image concurrency is bounded; suite and request budgets reserve atomically; request deadlines leave validation/transport margin; session leases have watchdog cleanup; generated assets and repo size are measured.

Native engineering reviewer completed with 21 findings. Outside Claude Code coverage is unavailable. All findings are resolved in [the architecture contract](../architecture.md) and [test plan](../test-plan.md); consensus is N/A.

#### Architecture diagram

```text
source PDFs -> pinned compiler -> immutable knowledge
                                  |
browser -> admission/session -> request transaction -> Agent SDK + 5 tools
             |                    |                 -> deterministic computations
             |                    `-> atomic validate/commit -> NDJSON bundle
             `-> quotas/budget/session lease
photo -> bounded decoder -> observation service -> deterministic visible comparison
admin -> HttpOnly session -> SQLite versions/outbox -> impacted evals
```

#### Failure modes registry

| Codepath | Failure mode | Rescue | Test | User-visible | Logged |
|---|---|---|---|---|---|
| Knowledge build | renderer/OCR drift | pin + byte compare | yes | integrity error | checksum/toolchain only |
| Admission | rate/budget/capacity | reject before spend | yes | typed retry/wait | request ID, no secret |
| Agent request | timeout/refusal/bad tool/free text | abort or one repair | yes | typed error/abstain | phases/usage |
| Validation | unsupported/contradicted claim | reject | property/mutation | safe refusal | claim IDs |
| Commit/event | crash/disconnect/backpressure | discard or committed bundle | fault injection | cancel/error/retry | sequence/commit ID |
| Photo | malformed/bomb/hostile/inconclusive | reject/recapture/fallback | security corpus | bounded result | receipt only |
| Session | leak/hang/cross-session | watchdog + signed capability | race/chaos | busy/expired | lifecycle |
| Expert DB | auth/CSRF/disk/crash/conflict | deny/transaction/read-only | crash/security | actionable admin state | audit/outbox |
| Rendering | XSS/path/URL/SVG | plain text + allowlisted IDs + CSP | hostile fixtures | blocked content | error code |

Critical gaps after approved plan amendments: 0. Any omitted failure test or rescue reopens the gap.

#### Parallelization

| Lane | Modules | Depends on |
|---|---|---|
| A | config, errors, DX docs, knowledge/source contracts | none |
| B | fixture UI shell and recorded proof | design contract |
| C | claim/computation grammar, request transaction, Agent SDK | A |
| D | artifact renderers and Proof Mode | A, design contract |
| E | sessions, quotas, event transport, browser integration | C + D |
| F | visible preflight | core gate |
| G | knowledge ops/support cases | core gate |

Launch A and B in parallel worktrees. Merge and freeze domain contracts. Launch C and D in parallel with no shared-file edits. Merge, then E. Core gate blocks F/G. F and G may proceed in parallel after the gate, with SQLite/domain coordination kept sequential.

<!-- autoplan-accepted:eng -->
- `docs/architecture.md` is the normative architecture contract. Before Agent SDK integration, implement and test the trusted claim/computation grammar, transactional request/event state machine, single-process mode/topology/admission contract, and photo observation/resource contract.
- Safety-critical, numeric, polarity, control, procedure, and artifact values use server-owned predicate/fact/computation IDs and receipts. Claude may select supported inputs but cannot author validated outputs or self-declare safety class. Residual prose entailment can only reject, clarify, or abstain.
- Stage sources, artifacts, tool receipts, and answer envelope inside one request transaction. Commit the referenced bundle atomically only after validation; discard in `finally` on cancel, timeout, disconnect, crash, or repair failure. NDJSON emits only committed bundles with monotonic sequence and one terminal event.
- Live modes are single-process v1. Hosted readiness fails unless one replica, signing secret, quota/budget controls, and topology assertions are configured. Multi-instance/serverless live chat remains disabled until a shared correctness backend and two-instance tests exist.
- Use signed HttpOnly session capabilities, global/per-session/per-origin quotas, atomic budget reservation, body/decode limits, request leases/watchdogs, and explicit deadline budgets. Hosted live routes stay disabled until abuse and cleanup chaos tests pass.
- Client restart recovery accepts user turns only; prior assistant output is never trusted as validated context or exported evidence after restart.
- Pin the complete knowledge generator toolchain and byte-compare temporary regeneration. Define region coordinates with page box/rotation/dimensions/renderer/DPI/checksum/context and golden drift tests. Rights verification precedes committing or hosting derived manual assets.
- `PhotoObservationService` is an explicit bounded provider interface with allowlisted observation output, offline fake, budget/timeout/cancel receipt, header-first single-frame decode limits, fixed re-encoding, hostile OCR handling, and guaranteed cleanup.
- Browser admin exchanges the bootstrap token server-side for a short-lived SameSite HttpOnly session with Origin and CSRF protection. SQLite uses migrations, transactions, WAL/busy policy, durable outbox, crash/disk/read-only/corruption tests, backup, and rollback.
- Model prose renders as plain text or minimal sanitized Markdown. All assets resolve from server-generated IDs through allowlisted local maps. Apply CSP, nosniff, safe downloads, path normalization, and hostile Markdown/URL/Unicode tests; never render model SVG or URLs.
- Live gates use atomic suite budgets, case-level results, repeated/variance-aware safety trials, per-category 100% safety/deterministic thresholds, and holdout grading outside the tuning path. Separate provider, validation, and transport deadlines.
- Implement every suite and release blocker in `docs/test-plan.md` alongside the feature. A feature is incomplete until its unit/property, integration, browser, fault-injection, security, eval, and mutation proof is present.
<!-- /autoplan-accepted:eng -->

<!-- autoplan-baseline-edits:ceo {"sourceSha256":"5f4228314b002e1fe1e8fbc1454f88a6be89170196f3e01f0bd0121bd4cd0afd","replacements":[{"oldText":"4. Every technical claim resolves to a canonical one-based PDF page and, where possible, an exact page region.","newText":"4. Every manual-backed technical claim resolves to a canonical one-based PDF page; visual facts, numeric settings, diagram labels, and artifact values require an exact region. Page-level fallback is permitted only for prose guidance with no stable subregion, is visibly labeled, and scores below region-grounded evidence. Verified field knowledge uses a separate provenance class and never masquerades as a manual citation."},{"oldText":"- Allow only the five MCP tools, use non-interactive fail-closed permissions, an empty temporary working directory, eight turns, 45-second timeout, cancellation, and a low default budget ceiling.","newText":"- Allow only the five MCP tools, use non-interactive fail-closed permissions, an empty temporary working directory, eight turns, a 45-second timeout, cancellation, and a $0.75 default per-request budget ceiling."},{"oldText":"- Recover expired sessions from bounded prior user turns and already validated envelopes/source IDs; rerun retrieval for new answers.","newText":"- Recover expired sessions from a bounded client-carried payload of prior user turns and already validated envelopes/source IDs. Revalidate its schema and source IDs, treat recovered assistant prose as untrusted context rather than evidence, and rerun retrieval for every new answer."},{"oldText":"### Phase 6: Flagship `verify before you act` flow","newText":"### Phase 5.5: Core proof gate\n\nFiles:\n\n- `evals/core/**`, `evals/holdout/core/**`, `scripts/run-core-gate.mjs`, `evals/results/core-gate.json`\n\nWork:\n\n- Implement `npm run gate:core` immediately after Phase 5. It runs all offline suites, the exact three challenge prompts, 40 live adversarial core cases, the four core artifact families, safety/abstention, citation, session-race, and mutation checks.\n- Require zero deterministic or safety failures, at least 95% citation precision/recall, at least 90% required clarification, at least 95% valid artifacts, and at least 90% sealed-holdout aggregate.\n- Record corpus/prompt/schema/model versions, raw validated envelopes, tool receipts, latency, and cost in `core-gate.json`. CI and the implementation sequence block Phases 6 and 7 unless this report passes.\n\nVerification:\n\n- Corrupting polarity, page mapping, citations, the tool allowlist, or an artifact value makes the gate fail.\n- The core gate runs with concurrency 2, transport/rate-limit retries only, a 30-minute wall limit, and a $12 total budget cap.\n\n### Phase 6: Flagship `verify before you act` flow"},{"oldText":"- `src/domain/preflight.ts`, `src/agent/tools/analyze-setup-photo.ts`","newText":"- `src/domain/preflight.ts`, `src/preflight/analyze-setup-photo.ts`"},{"oldText":"Work:\n\n- Turn insufficient evidence into a structured gap with question, context, searched evidence, missing relation/visual, proposed technician question, and affected eval category.","newText":"Work:\n\n- Start only after `npm run gate:core` produces a passing `evals/results/core-gate.json`; Phase 7 has the same executable prerequisite as Phase 6.\n- Turn insufficient evidence into a structured gap with question, context, searched evidence, missing relation/visual, proposed technician question, and affected eval category."},{"oldText":"- Build at least 80 live adversarial cases plus offline fact, retrieval, schema, event, race, accessibility, and mutation tests.","newText":"- Preserve the 40-case blocking core suite and add up to 40 feature-specific extended live cases for implemented photo preflight, knowledge operations, support cases, and optional polish. The full release report covers at least 80 live cases only when every extended feature ships."},{"oldText":"- Only after local release passes, add a hosted deployment with rate and spend controls.","newText":"- Treat hosted deployment as an optional promotion milestone after the local release; it does not affect local submission readiness and requires separate rate and spend controls."}]} -->

<!-- autoplan-accepted:ceo -->
- Photo uploads accept only JPEG, PNG, or WebP up to 10 MB; validate decode and dimensions, strip metadata, and test malformed, oversized, misleading, and prompt-injected images.
- The in-memory session store holds at most 32 active sessions; LRU eviction applies only to idle sessions, active requests are never evicted, and the limit/eviction behavior has deterministic tests.
- Expert-knowledge mutation is enabled for local single-user evaluation; hosted builds require `ADMIN_TOKEN`, otherwise mutation routes are disabled and the panel is read-only.
- Add a sanitized, read-only no-key replay gallery built from validated golden answer envelopes; it never presents replay output as a live model response.
- Photo analysis is a request-scoped server service that runs before the Agent SDK. It is not a sixth agent tool. Verify the decoded signature matches the declared type, reject decompression or pixel bombs above 24 megapixels, re-encode to a metadata-free working image, keep uploads out of logs/evals/exports by default, delete temporary bytes at request completion, allow at most two concurrent image analyses, and test every lifecycle outcome.
- If all 32 sessions are active, reject admission with typed `session_capacity` and `Retry-After: 5`; idle TTL is 30 minutes, each session holds at most 24 user turns and 256 KB of validated text/envelope history, and request-scoped images/artifacts do not live in the session store.
- A replay fixture is generated from a validated envelope through an allowlist sanitizer, binds answer/artifact/source-schema and corpus checksums, is visibly labeled `Recorded proof`, and fails `knowledge:check` on stale schema, stale sources, secrets, or unexpected user data.
- The three blocking prompt oracles are: (1) MIG at 200 A on 240 V must state 25%, 2.5 minutes welding and 7.5 resting, cite owner-manual PDF page 19, and render a duty timeline; (2) flux-cored porosity must clarify process when omitted, check DCEN and the documented causes, cite polarity/troubleshooting regions, and render a diagnostic flow; (3) TIG polarity must place ground positive and torch negative, cite the setup region, include the safety context, and render a connection diagram.
- Hosted expert mutations use one authorization middleware: `Authorization: Bearer` token compared in constant time, same-origin browser requests with CSRF protection, no query-string token, fail-closed startup for weak configured tokens, route-matrix tests for absent/invalid/valid credentials, and audit fields for request ID, timestamp, action, fact version, and result without secret values.
- Provenance is discriminated as `manual` or `verified_field`. Manual claims use `SourceRef`; field claims use versioned expert fact ID, author label, verification state, and history. The UI never renders field knowledge as manual evidence, and the blocking core suite uses manual facts only.
- Exact regions are mandatory for numeric facts, polarity, controls, diagram labels, visual observations, and artifact values. Page-only fallback is allowed for general prose when no stable region exists, is visibly labeled, and cannot satisfy a region-required eval.
- The default `claude-sonnet-5-5` at high effort is an explicit CEO choice for the accuracy/latency tradeoff. Startup checks model access and fails actionably; `CLAUDE_MODEL` and `CLAUDE_EFFORT` overrides are recorded in every eval result and never silently substituted.
- The live evaluation budget is split: an 8-case PR smoke gate capped at $2 and 8 minutes; a 40-case core release gate capped at $12 and 30 minutes; extended cases capped at an additional $12. Concurrency is 2, only transport/429 failures retry with bounded backoff, and semantic failures never auto-retry.
- `npm run gate:core` is the named executable prerequisite for Phases 6 and 7 and writes `evals/results/core-gate.json`; Phase 8 aggregates rather than first creating the gate.
- Clean-clone timing includes clone checkout already complete, cold `npm ci`, `npm run doctor`, production build, server start, and successful health/landing request on an Ubuntu 24.04 two-core CI runner with no npm cache; run three times, require median at most 120 seconds and every run at most 150 seconds.
- Restart recovery is client-carried and non-authoritative: the browser resubmits bounded visible user turns plus previously validated envelopes/source IDs, the server revalidates all IDs, and new answers rerun retrieval. No durable provider session is assumed.
- Expert facts persist in a local `node:sqlite` database with transactional append-only versions, atomic publish plus impacted-eval invalidation, crash/partial-write tests, and rollback to a prior published version. Hosted public mutation remains disabled unless explicitly authorized.
- The immutable hard-prompt fixtures contain the exact strings `What's the duty cycle for MIG welding at 200A on 240V?`, `I'm getting porosity in my flux-cored welds. What should I check?`, and `What polarity setup do I need for TIG welding? Which socket does the ground clamp go in?`; `knowledge:check` records and verifies their UTF-8 content hashes beside the existing prompt-specific oracles.
- `ARCLENS_DEPLOYMENT_MODE` accepts only `local` or `hosted` and defaults to `hosted`. `local` mutation mode is rejected when `NODE_ENV=production`; missing/invalid modes fail closed, hosted mode always requires the admin middleware, and startup tests cover every misconfiguration.
- `Strongest public reliability baseline` refers to the 2026-10-26 public-fork audit in `docs/research/`: match or exceed a 40-case blocking live core gate, 95% citation precision/recall, 100% deterministic and safety accuracy, 95% valid artifacts, visible raw result evidence, CI, and under-two-minute setup. The dated comparison is context; the explicit internal thresholds control release.
- CEO decision: use `claude-sonnet-5-5` at high effort by default because current official guidance positions it as the speed/intelligence balance and the core gate measures latency/cost; any configured replacement must support vision, tools, Agent SDK access, and the same thresholds, with no silent fallback.
- Primary persona: a nonprofessional OmniPro owner in a garage who needs the next safe, manual-consistent action. Primary outcomes are 100% deterministic first-action correctness, zero unsafe action recommendations in the safety set, and median time to a useful next action or evidence-complete escalation under 45 seconds. Evaluator inspection is the secondary persona.
- User-visible photo terminology is `Visible setup preflight`. It reports only `visible match`, `visible discrepancy`, `not observable`, or `inconclusive`; never `safe`, `verified overall`, or `pass`. Required capture angles, machine-model confirmation, photo-freshness confirmation, and an explicit unobservable-conditions list precede every result.
- Prototype one narrow gasless-flux-core visible preflight during Phase 2 using fixtures and the expected-state contract; it cannot reach production routes before `npm run gate:core`, but its early usefulness/refusal data decides whether Phase 6 proceeds.
- Add a hazard taxonomy for electric shock/energized service, fire/hot work, shielding gas/fumes, compressed cylinders, UV/PPE, duty-cycle overheating, and unknown equipment state. Each class defines mandatory warnings, allowed guidance, prohibited guidance, stop conditions, evidence requirements, and escalation language; safety suites require 100% per class.
- Region evidence always links to the full page and surrounding context. Evidence scoring measures entailment, qualification completeness, and context retention, not merely region presence. Curate safety, polarity, numeric settings, diagram labels, and the three challenge prompts first.
- The core holdout labels and citation-entailment spot checks are authored independently from prompt/tool implementation, locked before tuning, and reported case by case. Safety-critical categories require 100% individually; aggregate scores cannot hide a class failure.
- Configuration modes are explicit: `build/no-key`, `live-local`, `hosted-read-only`, and `hosted-admin`. Each has required variables, allowed routes, startup behavior, and CI coverage. Missing mode selects `build/no-key` with all live and mutation routes disabled; it never implicitly enables hosted mutation.
- Verify the inherited manual's assessment-use and public-hosting terms before publishing rendered assets. Until then, source PDFs and page renders stay local to the fork and optional hosting is blocked. The photo UI states processing purpose, in-memory/request-only retention, logging/export exclusion, and deletion behavior before upload.
- Benchmark application readiness and network-bound installation separately. The 120-second goal covers the challenge's clone-to-run experience, while reports isolate `npm ci` time from doctor/build/start/health time and record repository plus generated-asset size.
- Compare deterministic wizard, evidence viewer, retrieval-only assistant, technician escalation copilot, and photo-first checker against challenge fit, safety, build effort, memorability, and defensibility. The selected hybrid keeps deterministic flows for high-risk known setups and uses the Agent SDK for intent, retrieval, clarification, and case synthesis.
- Expert field facts require a named verifier role, supporting observation/source, conflict handling, expiry/re-review date, audit history, and visibly distinct presentation. The core answer path remains manual-only until this publication protocol has its own passing extended gate.
<!-- /autoplan-accepted:ceo -->

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---:|---|---|
| CEO Review | `/autoplan` CEO phase | Scope and strategy | 1 | CLEAR | 23 spec findings resolved; 13 native findings reconciled |
| Outside Review | Claude Code | Independent second opinion | 4 phases | UNAVAILABLE | CLI not installed; no completed external coverage |
| Eng Review | `/autoplan` Eng phase | Architecture and tests | 1 | ISSUES MAPPED | 21 issues converted to blocking contracts and tasks; 0 unresolved decisions |
| Design Review | `/autoplan` Design phase | UI/UX gaps | 1 | CLEAR | 3/10 → 9/10; 36 decisions recorded; mockups unavailable |
| DX Review | `/autoplan` DX phase | Developer experience | 1 | CLEAR | 3/10 → 9/10; TTHW target ≤2 min no-key / ≤3 min live |

**OUTSIDE COVERAGE:** Claude Code unavailable in CEO, design, DX, and engineering phases. Native reviewers completed every phase; native coverage is not counted as external coverage.

**VERDICT:** Plan is implementation-ready after final user approval. Engineering findings are fully mapped to mandatory tasks and tests; shipping still requires fresh diff review, QA, benchmark, and CI evidence.

NO UNRESOLVED DECISIONS
