# ArcLens — founder review brief

## The bet

Technical support agents fail when they produce plausible prose without understanding the product. ArcLens treats an answer as a transaction: verified manual evidence, deterministic product facts, a purpose-built visual, and a checksum either commit together or nothing reaches the user.

## What I built

- A real Claude Agent SDK loop with exactly five in-process MCP tools and no SDK built-ins.
- A checksummed 51-page knowledge package covering text, source pages, image-only charts, diagrams, and ten exact visual regions.
- Process-specific deterministic facts for MIG, flux-core, TIG, and stick rather than generic welding advice.
- Three visual programs: an interactive duty-cycle timeline, a socket-level polarity diagram, and a guided troubleshooting flow.
- Proof Mode that connects an answer to the exact manual crop, transformation state, source identifier, and full-page context.
- A no-key Recorded Proof for immediate evaluation plus a one-key live-local mode with bounded turns and spend.

## The hard engineering choices

### Model output is a proposal, not the response

The UI never renders the Agent SDK result string. The agent must finish through `submit_answer`; server schemas validate the answer, source IDs, artifact receipts, and exact evidence spans before a request transaction can commit.

### Calculations are not delegated to the model

Duty cycle, polarity, and troubleshooting branches are derived from generated source facts in deterministic code. Unsupported duty-cycle points fail closed rather than being interpolated.

### Exact quotes still need context

Grounding rejects meaning-inverting substrings, ambiguous multi-source attribution, short imperatives, and OCR-interleaved pseudo-table rows. Short numeric rows are accepted only when they exactly match a physical line on the trusted specifications page.

### The visual is part of the answer

Artifacts are typed server objects with computation receipts and source IDs. Proof Mode uses the actual 23rd.dev Dither Scan engine to reveal the cited crop instead of decorating an unrelated image.

## Evidence

- Repository: <https://github.com/taranggoyal70/prox-challenge>
- 16/16 deterministic, cross-page, integrity, and retrieval holdouts pass.
- A real live-local TIG polarity run completed in 24.1 seconds for approximately USD 0.06 and returned a committed page-24 answer, receipt, artifact, exact power-off evidence, and caution classification.
- Production CI runs clean install, knowledge integrity, typecheck, lint, tests, build, documentation validation, and offline evals.

## Deliberate scope

The hosted evaluator is no-key so a public URL cannot spend the candidate’s provider credits. Live answers run locally with one Anthropic key. Hosted multi-user auth, image upload, voice, and expert publishing are documented production extensions rather than insecure assessment shortcuts.

## What I would build next

The next business loop is a support-case export plus knowledge-gap queue: capture unresolved field questions, route them to a senior technician with exact missing evidence, publish verified corrections transactionally, and rerun only the impacted evals.
