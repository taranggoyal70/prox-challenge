# Command reference

Run these commands from the repository root with Node 24 and npm 11.

## Development and production

### `npm run dev`

Starts the Next.js development server in the mode selected by `ARCLENS_MODE`. Defaults to no-key Recorded Proof. A live provider call occurs only after a question is submitted in a live mode.

### `npm run build`

Creates a production Next.js build. It performs no provider generation after dependencies are installed.

### `npm run start`

Starts the prepared standalone production server. Run `npm run build` first; set `PORT=3001` when the default port is occupied.

## Diagnostics

### `npm run doctor`

Loads `.env.local` when present, without replacing variables already exported by the shell, then checks:

- Node 24;
- recognized application-mode spelling (application startup separately rejects the reserved hosted modes);
- Anthropic key presence and prefix when the mode is live;
- `package-lock.json`;
- committed knowledge integrity;
- the Claude Agent SDK core import;
- availability of `PORT` (3000 by default).

Options are passed after `--`:

```bash
npm run doctor -- --json
npm run doctor -- --mode live-local
PORT=3001 npm run doctor
```

`--mode` overrides `ARCLENS_MODE` for the profile; the key and other variables still come from the shell first and then `.env.local`.

Exit code `0` means all required checks pass; exit code `1` means at least one check failed. Run doctor before starting the development server, because a running server intentionally makes its port check fail.

### `npm run help`

Prints the compact operator command summary.

## Knowledge package

### `npm run check:knowledge`

Validates the generated manifest, source assets, page images, visual records, and corpus checksums. It does not modify files.

### `npm run build:knowledge`

Regenerates the knowledge package from `files/*.pdf`. It uses local PDF rendering and `sharp`, then replaces committed outputs under `public/manuals`, `public/manual-pages`, `public/manual-regions`, and `src/knowledge/generated`. Inspect every generated diff before committing it.

See [Maintaining the knowledge package](how-to-maintain-knowledge.md).

## Tests and evaluation

### `npm run test`

Runs all Vitest suites once. Tests are offline and should not spend API credits.

### `npm run test:watch`

Runs Vitest in watch mode.

### `npm run test:unit`

Runs the same current Vitest suite once. The alias exists for automation that requests a unit-test command.

### `npm run eval:offline`

Runs the versioned offline evaluation set for deterministic facts, retrieval, and corpus integrity. Writes `evals/results/offline.json`. This command makes no provider call.

There is no cost-bearing live-eval npm script in this release. Live checks must remain explicit and must not be hidden inside `npm run verify`.

## Static checks

### `npm run typecheck`

Runs `tsc --noEmit`.

### `npm run lint`

Runs ESLint across the repository.

### `node scripts/check-docs.mjs`

Checks required evaluator documentation, local Markdown links, and every documented `npm run` script name. This is intentionally runnable directly until the release owner chooses to add a package alias.

## Full verification

### `npm run verify`

Runs, in order:

1. `npm run check:knowledge`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test`
5. `npm run build`

The command stops at the first failure. It does not run offline evals or provider-backed calls; run `npm run eval:offline` and `node scripts/check-docs.mjs` separately.
