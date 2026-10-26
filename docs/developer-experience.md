# ArcLens developer experience contract

Status: APPROVED DX CONTRACT
Mode: DX POLISH
Primary developer: a Prox reviewer or engineer cloning an unfamiliar submission under time pressure.

> **Planning record:** this document preserves the target DX contract used to shape the build. The implemented command surface is narrower: use [README](../README.md) and [Commands](commands.md) for runnable instructions. Custom dev preflight output, browser E2E, live/cost-bearing evals, release automation, contract inspectors, clean-clone timing, and hosted workflows described below are targets unless the current command reference says otherwise.

## Persona

The reviewer expects a truthful README, one key, one familiar package manager, and a first result in minutes. They will abandon or downgrade the submission if setup is bespoke, a command spends money unexpectedly, errors send them into source code, or the documented Agent SDK path is not the real runtime path. They care about clean architecture and security but will not read it before the first successful run.

Tolerance: under two minutes to a useful no-key product and under three minutes to the first live validated answer after the key is available.

## Developer perspective

I clone the repository because I am judging the candidate, not because I want to learn a new framework. I open the README and start a clock. I want the exact commands, required versions, and what I will see. If Node is wrong, tell me before dependency installation. If I do not have a key pasted yet, show me a real recorded proof rather than a dead screen or a fake live chat. When I add the key, I want the first hard prompt to produce a diagram and source evidence without changing commands.

I am skeptical of claims like “grounded” and “tested.” I want a command that proves knowledge integrity, a report with failed cases preserved, and schemas I can inspect. If a live eval can spend money, it must say how much before it runs. If something fails, I need the problem, likely cause, exact fix, and a stable error code. I should never need to search the repository to discover why the app is read-only, why a model is unavailable, or whether an answer came from a replay.

## Competitive target

| Tool | Start → useful result | Evidence | DX choice |
|---|---|---|---|
| Upstream challenge requirement | clone → local frontend | README states under two minutes | One key, clear frontend |
| Strong public forks | URL or clone → chat/artifact | Public README/deployment evidence, not independently timed | Hosted demos, committed corpus, voice/artifacts |
| ArcLens no-key | cold `npm ci` → recorded proof | Must be measured by clean-clone script | No configuration and no fake live input |
| ArcLens live-local | cold `npm ci` + key → validated hard prompt | Must be measured and reported | Same command; mode changes capabilities |

Approved target: champion tier. Median no-key path ≤120 seconds and first live answer ≤180 seconds on the reference environment; report install, app readiness, and model latency separately.

## Magical moment

The reviewer runs the app, selects the TIG polarity prompt, and receives a connection diagram whose cable and socket labels open the exact manual crop and full-page context. This happens through the same runtime path used by all questions. In no-key mode, the same scene is available as persistently labelled recorded proof with immutable fixture metadata.

## Literal quickstart

```bash
npm ci
npm run dev
```

`npm run dev` executes cheap offline preflight checks before starting Next.js and prints:

```text
ArcLens ready: http://localhost:3000
Mode: build-no-key
Knowledge: valid (owner-manual@<checksum>)
Next: open Recorded proof, or add ANTHROPIC_API_KEY for live-local
```

To enable live-local:

```bash
cp .env.example .env.local
# add ANTHROPIC_API_KEY, then restart npm run dev
```

The README repeats these commands exactly. `npm run doctor` is a diagnostic, not a required quickstart step.

## Runtime and package-manager preflight

- `.nvmrc` pins Node 24.
- `package.json` declares `engines.node`, `engines.npm`, and an exact `packageManager`.
- A dependency-free `preinstall` script checks detected versions before packages install and prints remediation for nvm, fnm, and Volta.
- Node installation time is reported separately from ArcLens TTHW.

## Canonical application modes

One variable, `ARCLENS_MODE`, accepts exactly:

| Value | Default? | Key required | Live routes | Mutation routes |
|---|---|---|---|---|
| `build-no-key` | Yes when unset | No | Disabled | Disabled |
| `live-local` | No | Yes | Enabled | Local expert workflow enabled |
| `hosted-read-only` | No | Yes | Enabled with limits | Disabled |
| `hosted-admin` | No | Yes + strong admin token | Enabled with limits | Admin middleware required |

Any invalid value fails startup with `CONFIG_INVALID_MODE`. Production rejects `live-local`. The older two-value deployment variable is removed and unsupported.

## Configuration system

`src/config/schema.ts` owns typed parsing, defaults, ranges, precedence, and invariant enforcement. `.env.example` is generated from the schema and grouped by mode.

Freely configurable: port, log level, model, effort, request timeout within safe bounds, budget ceilings below configured maxima, session capacity below maximum, temporary directory, SQLite path, output paths, and eval concurrency.

Local/test only: fixture corpus path, deterministic seed, fake provider, and expert-mutation shortcuts.

Immutable release invariants: built-in Agent SDK tools disabled; answer-envelope validation; image sanitation; hosted mutation authorization; safety-category gates; source/corpus checksum validation. Attempts to weaken an invariant fail startup.

Effective non-secret configuration appears in doctor and eval reports.

## Command contract

`npm run help` prints every command, whether it needs network/key, expected duration, maximum spend, and release impact.

| Command | Purpose | Key/network | Cost behavior |
|---|---|---|---|
| `dev` | Start app after offline preflight | Optional | No live spend until user submits |
| `doctor -- --mode <mode>` | Full environment checks with human output | Mode-dependent | Non-mutating provider probe only |
| `doctor -- --json` | Machine-readable diagnostics | Mode-dependent | Same as above |
| `check:knowledge` | Corpus, fixtures, checksums, schemas | No | Free |
| `test:unit` | Offline domain/UI tests | No | Free |
| `test:e2e` | Local browser tests | No by default | Free fixtures |
| `eval:smoke -- --yes` | Eight live regression cases | Yes | ≤$2, ≤8 min |
| `eval:core -- --yes` | Forty-case blocking gate | Yes | ≤$12, ≤30 min |
| `eval:extended -- --yes` | Implemented optional features | Yes | ≤$12 additional |
| `release:check` | Offline gates, build, docs, smoke metadata | Key optional | Never starts live eval without `--yes` |

Cost-bearing commands refuse interactive and CI execution without explicit `--yes` or `ARCLENS_ALLOW_SPEND=1` and print their cap before running.

## Doctor profiles

Checks have stable IDs and `pass`, `warn`, `fail`, or `skipped` status. Default profile follows `ARCLENS_MODE`.

- `build-no-key`: Node/npm, filesystem, port, SDK import, knowledge, replay fixtures, schema. Key/model/provider checks are skipped with reason.
- `live-local`: all no-key checks plus key shape, model access, SDK subprocess, temp storage, and provider readiness.
- hosted profiles: add rate/budget configuration, secret strength, persistent path, and route-policy checks.

Exit 0 means ready for the selected mode, exit 1 means fixable environment/config issue, exit 2 means integrity or safety invariant failure.

## Public error contract

Every startup, script, HTTP, NDJSON, and UI error maps to `ArcLensError`:

```ts
type ArcLensError = {
  code: string;
  status: number;
  retryable: boolean;
  problem: string;
  cause: string;
  fix: string;
  docsUrl: string;
  requestId?: string;
  retryAfterSeconds?: number;
};
```

Contract tests require every public error to populate all mandatory fields and redact secrets, filesystem paths outside the project, provider internals, and image bytes.

Primary recovery action is fixed per code: retry, wait, reconfigure, recapture, reset, or escalate. Transport/429 errors can retry with bounds; semantic validation, safety, and integrity failures never auto-retry.

Representative messages:

```text
ARCLENS_KEY_MISSING
Problem: Live answers are unavailable.
Cause: ANTHROPIC_API_KEY is not set for live-local mode.
Fix: Add it to .env.local, then restart npm run dev. Recorded proof still works now.
Docs: /docs/errors#arclens-key-missing

ARCLENS_KNOWLEDGE_STALE
Problem: The checked-in knowledge package does not match the source manuals.
Cause: owner-manual.pdf changed after generated assets were built.
Fix: Run npm run build:knowledge, inspect the diff, then npm run check:knowledge.
Docs: /docs/errors#arclens-knowledge-stale

ARCLENS_MODEL_UNAVAILABLE
Problem: The configured Claude model cannot be used by this key.
Cause: The API returned model access denied for claude-sonnet-5-5.
Fix: Set CLAUDE_MODEL to an accessible vision-and-tool-capable model, then run npm run doctor -- --mode live-local.
Docs: /docs/errors#arclens-model-unavailable
```

## Health and readiness

- `/api/live`: process liveness only.
- `/api/ready`: versioned, non-secret response with mode, enabled capabilities, corpus/schema versions, and degraded checks.
- No-key mode is ready when recorded proof and manual browsing are valid; disabled live chat does not make it unhealthy.
- `/api/ready?level=live` checks provider readiness only when requested and authorized.

## Wire contracts and examples

Generate JSON Schema from Zod for five MCP tools, answer envelopes, artifacts, events, configuration, and errors. Wire names use `snake_case`; TypeScript identifiers use `camelCase`. NDJSON responses use `application/x-ndjson; charset=utf-8`, schema version `v: 1`, request IDs on every event, exactly one terminal event, and documented unknown-event behavior.

`examples/` contains executable scripts for manual search, artifact submission, answer validation, NDJSON consumption, cancellation, and replay sanitization. Docs CI runs them against fixtures. A local `/dev/contracts` inspector renders schemas and sample events only outside production.

## Documentation architecture

Documentation begins in Phase 1 and grows with the code.

- **README**: two-command start, live-local key step, expected output, hard-prompt demo, commands, architecture summary.
- **Tutorials**: no-key first run; live-local first validated answer.
- **How-to**: regenerate knowledge; add visual evidence; run gates; inspect a failure; publish field knowledge; deploy read-only/admin.
- **Reference**: configuration, npm commands, HTTP/NDJSON, MCP tools, schemas, errors, modes, corpus layout.
- **Explanation**: grounding model, safety boundaries, provenance, threat model, tradeoffs, evaluation methodology.
- **Operations**: expert publication, rollback, eval cost, troubleshooting, release checklist.

Docs CI validates links, environment-variable names against the config schema, command help snapshots, shell snippets, JSON examples, and generated schema references.

## Journey map

| Stage | Developer does | Friction resolved | Success signal |
|---|---|---|---|
| Discover | Opens README | Scope and runtime named immediately | Sees exact two commands |
| Evaluate | Reads architecture and proof claim | No unsupported marketing | Sees raw eval/report links |
| Clone | Uses public fork | No extra bootstrap service | Files present |
| Install | `npm ci` | Version failure happens before dependencies | Preinstall passes |
| First run | `npm run dev` | No manual doctor or key required | URL and mode printed |
| Hello world | Opens recorded TIG proof | Clearly not live/fake | Diagram + exact evidence crop |
| Live usage | Adds key and restarts | Same command and UI | Live hard prompt passes |
| Debug | Runs mode-aware doctor or follows error URL | Problem/cause/fix/code available | Check turns green |
| Verify | Runs offline or explicit spend gate | Cost and duration announced | Saved result report |
| Upgrade | Reads changelog/migration note | Schema changes explicit | Doctor confirms compatibility |

## First-time confusion report

```text
T+0:00  Opens README; sees Node 24, two commands, and expected output.
T+0:20  Runs npm ci; preinstall either passes or prints exact version remediation.
T+0:55  Runs npm run dev; offline preflight checks knowledge and replay fixtures.
T+1:10  Opens the printed URL in build-no-key mode.
T+1:25  Selects Recorded proof and sees the TIG diagram plus exact crop.
T+1:50  Wants live output; the UI and README point to one env variable and restart.
T+2:30  Submits a hard prompt; status stages explain the wait.
T+3:00  Receives a validated answer or an actionable public error.
```

## Upgrade and compatibility policy

Use semantic versioning for app releases and explicit versions for corpus, schema, replay fixtures, prompt, and eval set. `CHANGELOG.md` exists from the first release. Breaking schema/corpus changes include a migration note and a compatibility check in doctor; local SQLite migrations are transactional and reversible. Because this is an application rather than a public SDK, codemods are not required unless a public extension API is added.

## Development environment

- Hot reload for app and docs; fixture provider for no-key tests.
- CI on Ubuntu Node 24; smoke coverage on macOS when available. Windows is documented as unsupported until Agent SDK subprocess behavior passes a dedicated job.
- Poppler is never needed for ordinary install; only `build:knowledge` checks for it and gives platform-specific install guidance.
- Types, source maps, deterministic fixtures, request IDs, verbose logging, and JSON doctor output are included.
- Network proxies and custom CA behavior follow Node/Anthropic SDK conventions and are documented, not custom-implemented.

## Community and repository hygiene

Add `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, a license/notice review, bug and eval-failure issue templates, and a single support channel in GitHub Issues. Pricing/cost expectations for each live command are documented. No plugin ecosystem is promised for this assessment.

## DX measurement

`scripts/smoke-clean-clone.mjs` records install, offline preflight, build, server readiness, first recorded proof, and optional first live answer separately. CI publishes its JSON result. A post-implementation `/devex-review` measures the actual journey. Release notes preserve regressions and explain deviations from target.

## Scorecard

| Dimension | Before | After contract |
|---|---:|---:|
| Getting started | 4 | 10 |
| API/CLI/SDK | 5 | 9 |
| Error messages | 3 | 10 |
| Documentation | 2 | 10 |
| Upgrade path | 1 | 8 |
| Developer environment | 4 | 9 |
| Community | 2 | 8 |
| DX measurement | 4 | 10 |

Overall: 3/10 initial → 9/10 planned. TTHW target: ≤2 minutes no-key, ≤3 minutes first live answer. Competitive rank target: Champion.
