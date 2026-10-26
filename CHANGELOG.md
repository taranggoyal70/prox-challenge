# Changelog

All notable ArcLens changes are documented here. The project follows a human-readable changelog; it does not yet promise semantic-version compatibility.

## [Unreleased]

### Added

- Source-grounded OmniPro 220 question answering with Recorded Proof and optional live-local operation.
- Real Claude Agent SDK execution through five allowlisted in-process MCP tools.
- Deterministic duty-cycle, polarity, and porosity computations with visual artifacts and receipts.
- Verified manual corpus with 51 page assets, eight visual evidence records, source checksums, and local PDF access.
- Atomic answer transactions, structured public errors, NDJSON event streaming, abort handling, a 45-second live deadline, and fail-closed grounding.
- Process-local conversation resume with a 100-session cap and same-conversation turn serialization.
- Responsive evaluator UI with suggested questions, citations, Proof Mode, request states, and no-key/live mode labels.
- Offline unit, contract, API, security, UI, knowledge, and evaluation suites.
- Node/npm preflight, doctor, knowledge integrity, help, documentation validation, and full verification workflows.
- Evaluator and contributor documentation covering setup, configuration, commands, errors, architecture, security, knowledge maintenance, testing, release, and demo flow.

### Security

- Disabled Claude Agent SDK built-in tools and inherited settings; restricted the subprocess environment.
- Added local asset allowlists, CSP and security headers, structured redaction, and static trust-boundary tests.

[Unreleased]: https://github.com/taranggoyal70/prox-challenge/compare/main...HEAD
