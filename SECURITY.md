# Security policy

## Reporting a vulnerability

Do not publish a vulnerability, credential, exploit payload, or sensitive log in a public issue. Report it privately to the repository owner through the private contact channel associated with the assessment submission. Include a concise impact statement, affected commit, reproduction steps, and a safe proof of concept.

If no private channel is available, request one without disclosing technical details. Do not include an Anthropic API key or other secret in any report.

## Scope

Security reports are especially valuable for:

- credential or environment leakage;
- prompt or manual-content injection that escapes the MCP allowlist;
- unauthorized filesystem, shell, network, plugin, or built-in tool access;
- cross-session access or expert-mutation authorization failures;
- unsafe local asset resolution, path traversal, or arbitrary URL fetching;
- XSS, CSP bypass, unsafe Markdown/HTML/SVG rendering, or Unicode log spoofing;
- quota, budget, race, or partial-publication failures in any future hosted deployment;
- knowledge checksum or source-identity bypasses.

The implemented controls and the additional gates required before public hosting are documented in [docs/security.md](docs/security.md).

## Supported state

This assessment repository is under active development and does not currently publish long-term version support commitments. The safest supported mode is `build-no-key`. `live-local` is intended for a trusted local operator. Do not expose hosted modes publicly until every mandatory control in [docs/security.md](docs/security.md) and [the release checklist](docs/release-checklist.md) passes.

## Secret hygiene

- Store local credentials only in `.env.local`.
- Never paste credentials into prompts, screenshots, issues, demos, or logs.
- Rotate a key immediately if it may have been disclosed.
- Treat provider responses, manual content, and model tool arguments as untrusted. If image input is added later, treat image bytes and decoded metadata as untrusted too.
- Preserve structured redaction when adding telemetry or errors.

## Disclosure process

The maintainer will acknowledge a valid private report, reproduce it, assess severity, prepare a fix and regression test, and coordinate disclosure. Public details should wait until affected deployments are remediated.
