# Three-minute demo script

This script presents the strongest evaluator journey without depending on an API key. Keep a terminal and browser side by side.

## 0:00 — Establish repeatability

Show the repository root and run:

```bash
npm run doctor
```

Point out Node 24, committed knowledge integrity, the real Agent SDK import, and the no-key mode. Then run `npm run dev` and open the local URL.

## 0:25 — Explain the product promise

Use this framing:

> ArcLens is a visual product expert that turns supplied manuals into grounded answers. No-key Recorded Proof uses precomputed, visibly labeled fixtures built from deterministic domain functions and verified page references. Live mode separately requires an atomic validated answer bundle from the Agent SDK.

Show the **Recorded proof** mode badge, the disabled live-question field, and the explicit "not generated for your setup" fixture banner. Mention that live mode is one environment variable plus one Anthropic key.

## 0:50 — Demonstrate deterministic duty cycle

Select "What's the duty cycle for MIG welding at 200A on 240V?"

Show:

- 25% duty cycle;
- 2.5 minutes welding and 7.5 minutes resting in a ten-minute period;
- the timeline artifact;
- the owner manual page 19 citation;
- Proof Mode, its exact curated chart region, and the original full-page PDF link.

Explain that the recorded fixture calls the deterministic duty-cycle function directly, while the live path uses `get_product_fact` and the artifact builder. The 200 A / 240 V result is the MIG/wire-mode rating from page 19; TIG and stick have different process-specific ratings on page 29.

## 1:25 — Demonstrate guided troubleshooting

Select "I'm getting porosity in my flux-cored welds. What should I check?"

Show the ordered diagnostic flow. It starts with the process-specific DCEN polarity, then covers contamination, travel speed, contact-tip-to-work distance, and wire condition. Open the page 13 or page 37 evidence. Explain that shielding-gas checks apply to MIG, not gasless flux-core.

## 2:00 — Demonstrate polarity clarity

Select "What polarity setup do I need for TIG welding? Which socket does the ground clamp go in?"

Show the DCEN polarity diagram: ground clamp to positive, TIG torch cable to negative, sourced to owner manual page 24. Open Proof Mode and show the exact curated region, its normalized region provenance, and the separate link to full-page context in the original PDF.

## 2:30 — Prove the Agent SDK boundary

Open these files or describe them from the README:

1. `src/agent/runner.ts` uses the Claude Agent SDK `query()` iterator.
2. `src/agent/tools.ts` defines five real in-process MCP tools.
3. `src/agent/options.ts` disables built-ins and sets the exact tool allowlist.
4. `src/domain/grounding.ts` rejects unverified technical claims.
5. `src/domain/request-transaction.ts` atomically commits answer, artifacts, sources, and checksum.

Summarize the key distinction: the UI renders the committed transaction, never the SDK's free-form result text.

## 2:50 — Close with verification

Show the commands, without waiting for the full production build during a short demo:

```bash
npm run verify
npm run eval:offline
node scripts/check-docs.mjs
```

State which commands were run for the current commit and show `evals/results/offline.json` if useful.

## Optional live segment

Only perform this when an evaluator explicitly wants a provider-backed run and a configured budget is acceptable. Restart in `live-local`, show the **Live · local** badge, ask one of the same questions, and point out the status transitions. Never paste or display the API key.

If the provider is slow or unavailable, return to Recorded Proof. The deterministic evidence and validation path remain fully inspectable offline.
