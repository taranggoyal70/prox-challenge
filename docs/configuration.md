# Configuration reference

ArcLens reads configuration from environment variables through `src/config/index.ts`. For local development, put overrides in `.env.local`; it is ignored by Git. The application starts safely in `build-no-key` when no configuration file exists.

## Application modes

| `ARCLENS_MODE` | v0.1 behavior | Key required | Intended use |
| --- | --- | --- | --- |
| `build-no-key` | Recorded Proof; live route disabled | No | Evaluation, UI review, offline development |
| `live-local` | Real Agent SDK answers on a trusted machine | Yes | Single-user local development |
| `hosted-read-only` | Rejected with `CONFIG_HOSTED_UNAVAILABLE` | Not applicable | Reserved future contract |
| `hosted-admin` | Rejected with `CONFIG_HOSTED_UNAVAILABLE` | Not applicable | Reserved future contract |

`build-no-key` is the default and does not require `ANTHROPIC_API_KEY`. `live-local` requires it at startup.

The hosted names reserve the intended configuration contract, but this assessment build rejects them because public authentication, signed sessions, quotas, and admission controls are not implemented. No expert-mutation workflow ships in v0.1.

## Variables

| Variable | Required | Default | Contract |
| --- | --- | --- | --- |
| `ARCLENS_MODE` | No | `build-no-key` | One of the four modes above |
| `ANTHROPIC_API_KEY` | In `live-local` | — | Anthropic credential; doctor expects the `sk-ant-` prefix |
| `CLAUDE_MODEL` | No | `claude-sonnet-5-5` | Model name forwarded to the Claude Agent SDK |
| `CLAUDE_EFFORT` | No | `high` | `low`, `medium`, `high`, `xhigh`, or `max`; invalid values fall back to `high` |
| `ARCLENS_MAX_BUDGET_USD` | No | `0.75` | Positive number no greater than `0.75`, per live request |
| `ARCLENS_LOG_LEVEL` | No | `info` | Reserved logging preference in the current example environment |
| `ARCLENS_SESSION_SECRET` | No v0.1 use | — | Reserved; does not enable hosted mode |
| `ARCLENS_ADMIN_TOKEN` | No v0.1 use | — | Reserved; does not enable admin mutation |
| `PORT` | No | `3000` | Local Next.js and doctor port |

`ARCLENS_DEPLOYMENT_MODE` is obsolete and is rejected. Remove it and use `ARCLENS_MODE`.

## Safe local examples

No-key evaluation:

```dotenv
ARCLENS_MODE=build-no-key
```

Live local development:

```dotenv
ARCLENS_MODE=live-local
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-5-5
CLAUDE_EFFORT=high
ARCLENS_MAX_BUDGET_USD=0.50
```

Validate either profile without making a generation request:

```bash
npm run doctor
npm run doctor -- --mode live-local
```

The doctor loads `.env.local` automatically, while preserving any same-named variable already exported by the shell. It checks the key format in live profiles but does not send the key to a model. `--mode` selects the doctor profile; application startup remains the authority that rejects reserved hosted modes.

## Agent subprocess boundary

The live agent subprocess receives an explicit environment allowlist: `PATH`, `HOME`, temporary-directory variables, `ANTHROPIC_API_KEY`, and the ArcLens SDK client marker. It does not inherit unrelated host secrets.

See [Architecture](architecture.md) for the complete execution boundary and [Security](security.md) for production requirements.
