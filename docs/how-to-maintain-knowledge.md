# Maintaining the knowledge package

ArcLens commits a reproducible knowledge package so installation and ordinary development do not require PDF tooling. Rebuild it only when a source PDF, curated tag, visual region, or generator contract changes.

## What is generated

The canonical inputs are:

```text
files/owner-manual.pdf
files/quick-start-guide.pdf
files/selection-chart.pdf
```

`npm run build:knowledge` produces:

- public copies of the three PDFs in `public/manuals`;
- 51 rendered page images in `public/manual-pages`;
- eight curated visual crops in `public/manual-regions`;
- the text/search manifest in `src/knowledge/generated/manifest.json`;
- the visual evidence index in `src/knowledge/generated/visual-evidence.json`;
- deterministic product facts in `src/knowledge/generated/facts.json`.

The generator records input and output checksums plus the local Poppler and `sharp` versions. The build lock prevents integrity checks from reading a half-replaced package.

## Install the build prerequisites

Ordinary contributors only need `npm ci`. A contributor rebuilding knowledge additionally needs the Poppler commands `pdftotext` and `pdftoppm` on `PATH`.

On macOS with Homebrew:

```bash
brew install poppler
```

Confirm both commands are available:

```bash
pdftotext -v
pdftoppm -v
```

The JavaScript image dependency is installed by `npm ci`.

## Rebuild safely

1. Replace or intentionally edit the files under `files/`.
2. Update curated tags or visual-region definitions in `scripts/build-knowledge.mjs` if needed.
3. Run the generator:

   ```bash
   npm run build:knowledge
   ```

4. Validate the result:

   ```bash
   npm run check:knowledge
   npm run test
   npm run eval:offline
   ```

5. Inspect the entire generated diff. Look for unexpected page-count changes, blank renders, clipped crops, changed source IDs, or facts whose evidence page changed.
6. Run the app in Recorded Proof and open every cited page. Inspect every generated crop directly and confirm its visual-evidence record points to the correct canonical page.

Do not hand-edit generated JSON or image output. Change the source or generator and rebuild it.

## Source identity rules

- Document IDs and source IDs are public contracts.
- `owner-manual:pdf-19` means PDF page 19, not a guessed printed-page offset.
- Renaming a source requires updating deterministic facts, recorded fixtures, evals, and citations together.
- Numeric and polarity facts must cite the exact page from which they were derived.
- Page assets are canonical displayed evidence. Visual crops and their captions/entities/relationships enrich retrieval; only call proof "exact region" when a returned source includes normalized region coordinates.
- Duty-cycle facts are process-specific. MIG and flux-core wire ratings cite page 19; TIG and stick ratings cite page 29. Never reuse the 200 A MIG value for another process.

## Recover from a failed build

If a build exits unexpectedly, first confirm no generator process is still running. Remove no files manually while another build is active. Rerun `npm run build:knowledge`; its `finally` cleanup removes its lock in normal error paths. If `npm run check:knowledge` reports `ARCLENS_KNOWLEDGE_BUILDING` after the process has definitely ended, inspect `src/knowledge/generated/.build-in-progress` before taking any recovery action.

See [Architecture](architecture.md#knowledge-package) for the implemented contract and [Test plan](test-plan.md) for the broader coverage plan.
