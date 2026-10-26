# Getting started

This tutorial takes ArcLens from a fresh checkout to a verified no-key session, then optionally enables live Claude answers.

## Prerequisites

- Node.js 24 (the exact development version is in `.nvmrc`)
- npm 11
- A modern browser
- Optional: an Anthropic API key for live answers

Confirm the runtime:

```bash
node --version
npm --version
```

The Node version must begin with `v24.` and the npm version with `11.`.

## 1. Install and start

From the repository root:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

ArcLens defaults to `build-no-key`, so no `.env.local` file is required. The app should show:

- **Recorded proof** in the mode badge;
- a disabled question field explaining that a key is required for live answers;
- the three suggested assessment questions;
- a complete recorded answer when a suggestion is selected.

If the port is occupied, stop the other service or restart with:

```bash
PORT=3001 npm run dev
```

## 2. Inspect the recorded proof

Select each suggested question and confirm the matching artifact:

| Question | Expected artifact | Expected evidence |
| --- | --- | --- |
| MIG duty cycle at 200 A / 240 V | Ten-minute duty timeline | owner manual page 19 |
| Flux-cored porosity | Ordered troubleshooting flow | owner manual pages 13 and 37 |
| TIG polarity and ground socket | DCEN polarity diagram | owner manual page 24 |

Open **Proof Mode** on an answer. It should expose the cited source metadata, exact visual crop, excerpt, precision label, and original full-PDF link rather than a hidden chain of thought. Each Recorded Proof source is joined to its curated visual-evidence record and normalized region coordinates. Live citations remain page-level unless a returned source explicitly carries region coordinates.

The duty-cycle example is specifically the MIG/wire-mode rating at 200 A on 240 V. Do not generalize that setting to TIG or stick: those processes have different rated points on owner manual page 29.

## 3. Run the no-key preflight

Stop the development server before checking its port, then run:

```bash
npm run doctor
npm run check:knowledge
npm run eval:offline
```

A healthy no-key doctor ends with `Ready for this mode.` The knowledge check reports the validated page, visual-record, and corpus counts. The offline eval command reports a passing case count and writes `evals/results/offline.json`.

## 4. Enable live mode (optional)

Copy the example environment:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```dotenv
ARCLENS_MODE=live-local
ANTHROPIC_API_KEY=sk-ant-...
```

Run the live profile before starting the app:

```bash
npm run doctor -- --mode live-local
npm run dev
```

The header should now show **Live · local**. Submitting a question starts a real Claude Agent SDK request and may incur API charges. The default per-request cap is USD 0.75 and the agent can take no more than eight turns.

Watch a live response progress through context checking, evidence retrieval, and validation. Only the final committed bundle is rendered; free-form model text is not sent to the browser.

## 5. Verify the repository

Stop the development server and run:

```bash
npm run verify
node scripts/check-docs.mjs
```

`npm run verify` checks the knowledge package, types, lint, tests, and production build. The docs checker rejects broken local Markdown links and references to nonexistent npm scripts.

## Next steps

- Learn why ArcLens fails closed in [Architecture](architecture.md).
- Review every supported setting in [Configuration](configuration.md).
- Use [Commands](commands.md) as the operator reference.
- Diagnose structured failures with [Error reference](errors.md).
- Rebuild the manual corpus with [Maintaining the knowledge package](how-to-maintain-knowledge.md).
