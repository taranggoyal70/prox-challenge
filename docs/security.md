# ArcLens security posture

This document describes controls implemented in v0.1 and the explicit boundary of the trusted-local deployment. Controls required for a future public service are listed separately and are not shipped capabilities.

## Implemented trust boundary

```text
browser question (untrusted)
        |
        v  Zod request schema: trimmed, 2–4,000 characters
Next.js /api/chat
        |
        v  no SDK built-ins; five allowlisted in-process MCP tools
Claude Agent SDK output and tool arguments (untrusted)
        |
        v  verified sources + deterministic facts + exact-quote grounding
request transaction
        |
        v  atomic answer/artifact/source bundle only
React text and validated artifact components
```

The supplied manual content is also treated as data rather than instructions. The model does not receive shell, filesystem, web, plugin, skill, or subagent tools. It does not supply trusted file paths, URLs, HTML, SVG, numeric outputs, polarity layouts, or authorization decisions.

ArcLens v0.1 has no image-upload, expert-note, admin-mutation, voice, or support-case input surface.

## Implemented controls

### Agent isolation

- `tools: []` disables Claude Agent SDK built-ins.
- `allowedTools` contains exactly the five ArcLens MCP names.
- Strict MCP config, `dontAsk`, no permission prompts, no inherited settings, and no skills reduce ambient authority.
- The SDK subprocess environment allowlists only path/temp values, `ANTHROPIC_API_KEY`, and the ArcLens client marker; unrelated host secrets are not inherited.
- Each live request receives a temporary working directory that is removed in `finally`.
- The SDK turn count is limited to eight and its configured per-request budget cannot exceed USD 0.75.

### Publication boundary

- Source IDs must resolve inside the loaded knowledge package.
- Process-specific facts and technical artifacts are computed by server code.
- Calculation claims must carry a staged computation receipt.
- Residual prose must include an exact excerpt present in the referenced manual page text.
- Answer, artifacts, and sources commit atomically; failure aborts staged state.
- Free-form SDK result text is never rendered.

### Browser and asset boundary

- React renders plain text; source has static tests against `dangerouslySetInnerHTML`, direct `innerHTML`, `eval`, and `Function` use.
- Manual page, visual crop, and PDF paths pass strict same-origin allowlists with no traversal or percent-encoded path input.
- A request-scoped nonce Content Security Policy restricts scripts and connections. Development alone permits `unsafe-eval` for tooling.
- Stable headers deny framing and MIME sniffing, suppress referrers and sensitive browser permissions, isolate cross-origin resources, and enable HSTS.
- API responses use `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

### Secret and error handling

- `.env.local` is ignored by Git.
- Structured redaction covers secret-bearing keys, Anthropic/Bearer credentials, data-image payloads, absolute user paths, circular values, control characters, and bidirectional overrides.
- Unexpected public failures collapse to a bounded `ArcLensError` rather than returning a raw provider exception.

### Supply chain and corpus

- Production dependencies and the package manager are pinned exactly in `package.json` and `package-lock.json`.
- `npm run check:knowledge` verifies source PDFs, public PDFs, page text, page assets, visual crops, schemas, and checksums.
- `npm run doctor` runs that integrity check before reporting local readiness.

## Important v0.1 limitations

`live-local` is for one trusted local operator. It is not a hardened multi-user service.

- Conversation IDs are browser-supplied UUIDs mapped to SDK session IDs in process memory. The map is capped at 100 recent sessions and overlapping turns for one ID are rejected, but IDs are not signed, authenticated, durable, or shared across instances.
- There is no same-origin admission check, CSRF token, rate limit, quota ledger, or atomic cross-request spend reservation.
- There is no durable database, admin authentication, or expert mutation API.
- There is no uploaded-image decoder or user-controlled outbound fetch.
- `GET /api/ready` reports that the bundled knowledge JSON loaded and passed its schema. It does **not** re-hash filesystem assets. Use `npm run doctor` or `npm run check:knowledge` for checksum verification.
- Hosted mode names are rejected with `CONFIG_HOSTED_UNAVAILABLE`.

`build-no-key` remains the safe default and performs no provider work.

## Required before public hosting — not implemented

- Signed HttpOnly conversation capabilities, same-origin enforcement, and CSRF protection.
- Bounded durable session storage, per-user quotas, rate limiting, atomic budget reservation, and leases.
- Strict request-body byte limits and abuse/load tests beyond the current question schema bound.
- Provider/model readiness probing, operational metrics, audit events, canary checks, and rollback.
- If image input is added: header-first validation, fixed decoder limits, single-frame re-encoding, request-only storage, and guaranteed deletion.
- If admin mutation is added: short-lived SameSite HttpOnly sessions, strong authentication, Origin/CSRF validation, authorization tests, transactional versioning/publication, and rollback.
- If outbound integrations are added: explicit HTTPS/domain/IP allowlists and manual redirect handling.
- Cross-session, race, cancellation, crash, fuzz, resource-exhaustion, and multi-instance security tests.

## Security verification

Run:

```bash
npm test -- tests/security
npm run typecheck
npm run lint
npm audit --omit=dev
```

Also run `npm run verify`, `npm run eval:offline`, and the [release checklist](release-checklist.md). The broader future coverage matrix is in [Test plan](test-plan.md) and is explicitly labeled as a plan.
