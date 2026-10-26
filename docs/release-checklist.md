# Release checklist

Use this checklist for an assessment handoff or any tagged ArcLens release. A checked box should correspond to observed evidence, not intent.

## Repository and configuration

- [ ] The branch contains only intended changes; generated and source diffs were reviewed.
- [ ] `package-lock.json`, `.nvmrc`, and exact production dependency versions are present.
- [ ] `.env.local`, API keys, local databases, logs, and test artifacts are not tracked.
- [ ] `build-no-key` starts without a credential and remains the default.
- [ ] `.env.example` contains placeholders only.

## Automated verification

- [ ] `npm ci` succeeds on Node 24 / npm 11 from a clean checkout.
- [ ] `npm run doctor` ends with `Ready for this mode.` while the server is stopped.
- [ ] `npm run verify` passes.
- [ ] `npm run eval:offline` passes and `evals/results/offline.json` was inspected.
- [ ] `node scripts/check-docs.mjs` passes.
- [ ] `npm audit --omit=dev` reports no unresolved production vulnerability, or an explicit risk decision is documented.

## Evaluator journey

- [ ] `npm ci` followed by `npm run dev` is sufficient for Recorded Proof.
- [ ] The header clearly distinguishes Recorded Proof from Live expert.
- [ ] The MIG duty-cycle prompt returns 2.5 minutes welding and 7.5 minutes rest for 200 A / 240 V and cites owner manual page 19.
- [ ] The flux-cored porosity prompt begins with DCEN polarity and shows the ordered checks with visible citations to pages 13 and 37.
- [ ] The TIG polarity prompt returns DCEN, ground positive, torch negative and cites owner manual page 24.
- [ ] Every source control opens the correct local manual page; any exact-region label has matching region coordinates.
- [ ] Proof Mode exposes source metadata, evidence precision, and the original PDF link without exposing hidden reasoning.
- [ ] Recorded answers remain explicitly labeled as validated fixtures, not live output, and their provenance matches the generated manifest.
- [ ] The layout and controls work with keyboard navigation and narrow viewports.

## Live Agent SDK proof

- [ ] `npm run doctor -- --mode live-local` passes with a deliberately provided key.
- [ ] A live question visibly progresses through evidence retrieval and validation.
- [ ] Server logs and public errors contain no credential, Bearer token, absolute user path, or raw provider payload.
- [ ] SDK options still set `tools: []`, use `permissionMode: "dontAsk"`, and allowlist only the five ArcLens MCP tools.
- [ ] A malformed or unsupported answer is rejected before any partial bundle is rendered.
- [ ] The request cost and turn limit remain bounded by configuration.

## Security and operations

- [ ] Security header and asset-allowlist tests pass.
- [ ] No user-controlled outbound URL or redirect path was added.
- [ ] Hosted modes are not described as production-ready unless all mandatory controls in [Security](security.md) are implemented and tested.
- [ ] The [Security policy](../SECURITY.md), [Error reference](errors.md), and rollback notes are current.
- [ ] The demo follows [Demo script](demo-script.md) and does not depend on network access until the optional live segment.

## Handoff evidence

Record the commit SHA, Node/npm versions, operating system, verification timestamp, offline eval result, and any intentionally skipped check in the release notes or pull request.
