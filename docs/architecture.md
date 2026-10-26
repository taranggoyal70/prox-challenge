# ArcLens architecture

This document describes the implementation in v0.1. Future production work is isolated in the final section and is not a claim about shipped capability.

Runtime: Node.js 24, one Next.js process
Primary invariant: a live technical answer is not rendered until its answer, artifacts, and sources pass server validation and commit as one request transaction.

## Implemented system boundary

```text
BUILD TIME
three supplied PDFs
        |
        v
Poppler text + page rendering ---> curated visual crops and metadata
        |                                      |
        +--> checksummed manifest and facts <--+
                         |
                         v
                committed knowledge package

RUNTIME: build-no-key
browser ---> three labeled recorded fixtures
                  |          |
                  |          +--> deterministic domain functions
                  +-------------> canonical page evidence + original PDFs

RUNTIME: live-local
browser --POST /api/chat--> request-scoped temp directory
                                 |
                                 v
                         Claude Agent SDK query()
                                 |
                 five allowlisted in-process MCP tools
                    |            |             |
             manual search   product facts   stage/submit
                    |            |             |
                    +------> grounding <--------+
                                 |
                                 v
                        atomic request commit
                                 |
                                 v
                   NDJSON committed bundle ---> browser
```

`build-no-key` is the safe default. It never starts provider work. `live-local` requires `ANTHROPIC_API_KEY` and can incur API charges only when a user submits a question.

## Implemented module boundaries

```text
src/config/                 modes, limits, capabilities, subprocess environment
src/domain/                 schemas, facts, computations, grounding, transactions
src/knowledge/              immutable corpus, search, source and visual metadata
src/agent/                  Agent SDK options, runner, and MCP server
src/app/api/                chat, liveness, and readiness routes
src/components/             recorded and live UI; consumes committed contracts
src/security/               local asset allowlist, CSP, headers, redaction
scripts/                    doctor, knowledge build/check, offline evals, docs check
tests/                      offline contract, domain, API, security, knowledge, UI
```

The domain layer owns technical truth. Components render domain/event contracts and do not calculate welding facts. Route handlers validate transport and configuration but delegate tool behavior and grounding to the agent/domain modules.

## Knowledge package

The canonical inputs are the owner manual, quick-start guide, and process-selection chart under `files/`. The checked-in generator produces:

- 51 checksummed page records and page images;
- eight curated visual evidence records and crops;
- process-specific duty-cycle and polarity facts;
- three public local PDFs;
- a corpus version derived from source checksums.

`src/knowledge/index.ts` ranks local pages using normalized page text, curated tags, and visual metadata such as captions, entities, relationships, aliases, intents, and region labels. Search returns canonical page source IDs, excerpts, and matching visual-evidence IDs.

Page and region evidence are distinct:

- `public/manual-pages` holds canonical rendered pages used by source citations.
- `public/manual-regions` holds curated crops used by the visual evidence index.
- `public/manuals` holds the original PDFs.

The v0.1 source contract resolves a source ID such as `owner-manual:pdf-24` to a canonical page asset. Recorded fixtures then join that source to a matching curated visual-evidence record and attach its crop URL and normalized region coordinates. Live citations currently resolve to page-level sources. A proof says **Exact region** only when the source actually carries those coordinates; otherwise it says **Full page**.

The build is deterministic for a pinned local toolchain and records its Poppler and `sharp` versions. `npm run check:knowledge` verifies source assets, generated assets, schemas, and checksums. See [Maintaining the knowledge package](how-to-maintain-knowledge.md).

## Recorded Proof

Recorded Proof is an offline evaluator path, not simulated live output. `src/components/recorded-proof-data.ts` defines three visibly labeled fixtures:

- MIG duty cycle at 200 A / 240 V;
- flux-cored porosity troubleshooting;
- TIG polarity and ground-socket setup.

The fixtures call deterministic domain functions, derive corpus/schema provenance from the generated manifest, and join fixed page references to generated visual-region records. They render the same artifact components used by live bundles, but they are a separate fixture type rather than a replayed SDK transaction. The UI says **Recorded proof; not generated for your setup** and leaves live input disabled in `build-no-key`.

This distinction matters: Recorded Proof demonstrates the product, source navigation, and deterministic visuals without a key; only `live-local` proves provider execution.

## Claude Agent SDK execution

`src/agent/runner.ts` imports `query()` from `@anthropic-ai/claude-agent-sdk/core` and consumes its async message stream. The SDK result's free-form text is not rendered. A successful turn must populate and commit ArcLens' server-owned transaction.

The options in `src/agent/options.ts` enforce:

- no built-in SDK tools (`tools: []`);
- exactly five allowed ArcLens MCP tool names;
- strict MCP configuration;
- `dontAsk` permission mode and no permission prompts;
- no inherited setting sources or skills;
- eight turns maximum;
- a configurable per-request SDK budget capped at USD 0.75;
- an explicit subprocess environment allowlist.

The in-process MCP server in `src/agent/tools.ts` exposes:

1. `search_manual` — rank verified page text and visual metadata.
2. `get_manual_pages` — resolve known source IDs to canonical metadata and page text.
3. `get_product_fact` — compute a supported process-specific duty-cycle, polarity, or porosity fact.
4. `present_artifact` — stage a server-built, schema-validated artifact.
5. `submit_answer` — submit an answer, clarification, or abstention envelope for grounding.

No shell, filesystem, web, plugin, skill, or subagent tool is available to the model.

## Deterministic product facts

Duty-cycle lookup requires process, input voltage, and amperage. It reads generated facts keyed by all three values and rejects undocumented combinations instead of interpolating them. MIG and flux-core wire-mode ratings cite page 19; TIG and stick ratings cite page 29.

Polarity lookup requires the welding process and returns the named socket layout from a generated fact. Porosity flow supports `flux-core` and `mig`, adding shielding-gas checks only for MIG.

Each live computation produces a receipt with normalized inputs, fact IDs, computation version, source IDs, output, and checksum. `present_artifact` uses that receipt to build the artifact; the model does not supply trusted numeric or socket-layout output.

## Grounding and atomic commit

Each request owns a `RequestTransaction` with `open`, `committed`, or `aborted` state.

The grounding validator checks that:

- every referenced source exists in the verified package and is declared by the answer;
- every referenced artifact was staged in the same request;
- calculation claims use a receipt attached to a staged artifact;
- deterministic technical prose uses a server-computed artifact;
- residual prose carries exact evidence excerpts returned from verified page text;
- an exact quote contains the extractive prose claim after whitespace/case normalization.

When deterministic artifacts are present, the server rebuilds the answer summary and claims from those artifacts rather than trusting model-authored technical prose. A transaction commits only the referenced artifacts and sources and adds a checksum over the bundle. On any failure, the transaction aborts and clears staged state.

## Chat transport

`POST /api/chat` accepts a question from 2 to 4,000 characters and an optional UUID `conversationId`. In no-key mode it returns `ARCLENS_LIVE_DISABLED` before provider work.

Live responses use `application/x-ndjson` with version `1`, one request ID, and monotonically increasing sequence numbers. The implemented event sequence includes:

- `start` with a conversation ID;
- status events for context, evidence, and validation;
- one `committed_bundle` with answer, artifacts, sources, and checksum;
- `done` with model, turns, and cost, or a terminal `cancelled`/`error` event.

The route creates a temporary working directory per request and removes it in `finally`. Aborting the browser request closes the SDK query. A 45-second deadline also closes the query and returns `ARCLENS_AGENT_TIMEOUT`; no partial answer is committed.

## Conversation continuity and its limit

The server maintains an in-memory `conversationId -> Agent SDK sessionId` map. A follow-up request can resume its SDK session while the same Node process remains alive. The map keeps at most 100 recent sessions, and an active-conversation set rejects overlapping turns for the same ID.

This is intentionally local-only state. It is not durable, shared between instances, tied to a user quota, authenticated, or represented by a signed cookie. Restarting the process loses it. Those constraints are why the assessment describes live operation as `live-local`, not production multi-user chat.

## Rendering and security

The UI renders ordinary React text and validated artifact components; it does not render model HTML. Local page, crop, and PDF paths pass a strict asset allowlist. The app applies a request nonce Content Security Policy and stable headers covering framing, MIME sniffing, referrers, permissions, cross-origin isolation, and HSTS.

Structured redaction covers secret-bearing fields, Anthropic/Bearer credentials, data-image payloads, absolute user paths, circular values, control characters, and bidirectional overrides. The Agent SDK subprocess receives only path/temp variables, the Anthropic key, and the ArcLens client marker.

The current security posture and public-hosting blockers are in [Security](security.md).

## Modes and readiness

The configuration parser recognizes four mode names, but their operational status differs:

| Mode | v0.1 status | Provider key | Notes |
| --- | --- | --- | --- |
| `build-no-key` | Shipped, default | No | Recorded Proof only |
| `live-local` | Shipped for trusted local use | Yes | Real Agent SDK requests |
| `hosted-read-only` | Reserved contract | Yes | Do not expose publicly before production controls |
| `hosted-admin` | Reserved contract | Yes | Do not expose publicly before auth/mutation controls |

`GET /api/live` reports process liveness. `GET /api/ready` validates configuration, reports that bundled knowledge JSON loaded with its schema, and returns non-secret mode/capability/corpus metadata. It does not re-hash filesystem assets or probe provider model access; `npm run doctor` performs the full knowledge checksum check.

## Failure model

Public failures use `ArcLensError`: code, HTTP status, retryability, problem, cause, fix, docs URL, and optional request/retry metadata. Configuration and synchronous request failures return JSON. Failures after a live stream starts become typed NDJSON error events.

The stable code guide is [Error reference](errors.md).

## Implemented verification

The repository currently provides:

- Vitest suites for domain computations, transactions, grounding, Agent SDK options/runner/tools, configuration, API contracts, security, knowledge, and UI behavior;
- a ten-case offline eval set covering the three hard prompts, process distinctions, unsupported duty-cycle points, visual retrieval, and corpus boundaries;
- knowledge integrity, type, lint, production build, doctor, and documentation checks.

Use [Commands](commands.md) for the exact executable surface and [Test plan](test-plan.md) for the broader future coverage map.

## Future production design — not implemented in v0.1

The following require separate implementation, tests, and security review before ArcLens can claim a public hosted or expert-authoring product:

- signed HttpOnly session capabilities and same-origin admission;
- bounded durable session storage shared across instances;
- rate limits, quotas, atomic spend reservation, and leases;
- a dedicated repair-turn policy and cross-request deadline budgets;
- persistent SQLite expert facts, versioning, publication, rollback, and outbox;
- hosted admin authentication, CSRF protection, and mutation authorization;
- photo upload, bounded decoding, observation providers, and visible-setup comparison;
- user support cases, export, voice, and expert review loops;
- live provider eval suites with explicit spend confirmation;
- browser E2E, image-fuzzing, race, crash, disk, and multi-instance tests;
- deployment, canary, telemetry, and rollback automation.

None of these future items should appear in product copy or release evidence as a shipped differentiator until its implementation and release gate exist.
