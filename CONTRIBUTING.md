# Contributing to ArcLens

ArcLens is a safety-conscious technical assistant. Contributions must preserve source grounding, deterministic critical facts, fail-closed publication, and the no-key evaluator path.

## Set up the repository

Use Node 24 and npm 11:

```bash
npm ci
npm run doctor
npm run dev
```

See [Getting started](docs/getting-started.md) for the expected first run.

## Make a focused change

1. Read [Architecture](docs/architecture.md), [Security](docs/security.md), and the relevant module tests.
2. Add or update a test that expresses the behavior change.
3. Keep deterministic facts in domain code or generated fact data, not in model prose.
4. Keep user-visible technical claims tied to verified source IDs.
5. Do not broaden Agent SDK permissions, built-in tools, environment inheritance, outbound access, or public asset paths without a security review.
6. Update the appropriate tutorial, how-to, reference, or explanation document with the same change.

## Verification

Run before requesting review:

```bash
npm run verify
npm run eval:offline
node scripts/check-docs.mjs
```

If the change touches source PDFs, tags, crops, or fact records, also follow [Maintaining the knowledge package](docs/how-to-maintain-knowledge.md) and inspect every generated file.

Do not add a live provider call to the default test, build, or verify commands. Cost-bearing tests must be explicit and opt-in.

## Commit and review quality

- Keep commits scoped and explain why the change is needed.
- Include reproduction steps for a bug and before/after evidence for UI work.
- Report the exact commands run and any skipped check.
- Call out changes to a public contract: configuration, events, errors, source IDs, artifact schema, or MCP tool schema.
- Never commit `.env.local`, credentials, raw provider responses, local databases, or logs.

## Bug reports

Include:

- ArcLens version or commit SHA;
- operating system and Node/npm versions;
- application mode, with secrets removed;
- exact reproduction steps;
- expected and actual behavior;
- public error code and request ID, if present;
- the smallest safe log excerpt after redaction.

For a vulnerability or possible secret exposure, do not open a public issue; use [SECURITY.md](SECURITY.md).

## Documentation style

- Put first-use learning in a tutorial.
- Put task recipes in a how-to.
- Put exact commands, settings, errors, and schemas in reference pages.
- Put rationale and tradeoffs in explanation documents.
- Verify every command from the repository root and use local relative links.

The [Test plan](docs/test-plan.md) defines release-blocking behavior, and the [Release checklist](docs/release-checklist.md) defines handoff evidence.
