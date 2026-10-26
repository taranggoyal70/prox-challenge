# Error reference

ArcLens failures use a structured public shape:

```json
{
  "code": "ARCLENS_LIVE_DISABLED",
  "status": 409,
  "retryable": false,
  "problem": "Live answers are disabled in build-no-key mode.",
  "cause": "This mode never starts provider work or spends API credits.",
  "fix": "Open Recorded proof now, or configure ANTHROPIC_API_KEY and ARCLENS_MODE=live-local.",
  "docsUrl": "/docs/errors#arclens-live-disabled"
}
```

Some runtime errors also include `requestId`; retryable admission errors may include `retryAfterSeconds`. Public causes remain bounded and do not expose provider traces, credentials, or absolute user paths.

## Setup and readiness

### `CONFIG_LEGACY_MODE`

`ARCLENS_DEPLOYMENT_MODE` is present. Remove it and set `ARCLENS_MODE`; use `build-no-key` when unsure.

### `CONFIG_INVALID_MODE`

`ARCLENS_MODE` is not one of `build-no-key`, `live-local`, `hosted-read-only`, or `hosted-admin`. Correct the value and restart.

### `CONFIG_HOSTED_UNAVAILABLE`

`hosted-read-only` or `hosted-admin` was selected. Those names reserve the future mode contract, but this assessment build rejects them because production authentication, signed sessions, quotas, and admission controls are not implemented. Use `build-no-key` for review or `live-local` on a trusted machine.

### `CONFIG_INVALID_BUDGET`

`ARCLENS_MAX_BUDGET_USD` is not a positive number at or below `0.75`. Correct it and restart.

### `ARCLENS_KEY_MISSING`

A live mode was selected without `ANTHROPIC_API_KEY`. Add the key to `.env.local` and restart, or use `build-no-key`.

### `ARCLENS_LIVE_DISABLED`

The client called `/api/chat` while ArcLens was in `build-no-key`. Use Recorded Proof or enable `live-local`; no credits were spent.

### `ARCLENS_READINESS_FAILED`

Readiness could not load valid configuration or the bundled knowledge schema. Run `npm run doctor` for the full configuration, SDK, port, and knowledge-checksum checks, then follow its first failure.

### `ARCLENS_KNOWLEDGE_BUILDING`

Knowledge generation is replacing output files. Wait for `npm run build:knowledge` to finish, then run `npm run check:knowledge`.

### `ARCLENS_KNOWLEDGE_INVALID`

The committed knowledge package failed an integrity check. Run `npm run build:knowledge`, inspect the diff, then rerun `npm run check:knowledge`.

## Request and provider execution

### `ARCLENS_REQUEST_INVALID`

The chat body is not valid JSON or does not contain a trimmed question between 2 and 4,000 characters. Correct the request; do not retry it unchanged.

### `ARCLENS_CONVERSATION_BUSY`

The same conversation already has a live turn in progress. ArcLens serializes turns to prevent context and provider-spend races. Wait for the current turn to finish or cancel it, then retry.

### `ARCLENS_AGENT_TIMEOUT`

The live agent exceeded the 45-second request deadline. No partial answer was committed. Retry with a narrower question; if the provider remains slow, return to Recorded Proof rather than repeatedly spending.

### `AGENT_RESULT_MISSING`

The Claude Agent SDK stream ended without a result message. Retry once, then inspect server-side SDK diagnostics using the request ID.

### `AGENT_EXECUTION_FAILED`

The SDK returned a non-success result. If the terminal reason is a budget limit, reduce the request or adjust the budget within the USD 0.75 cap. Otherwise retry only if the provider condition is transient.

### `ARCLENS_INTERNAL_ERROR`

An unexpected local error interrupted the request before a validated answer was committed. Run `npm run doctor`, retry once, and include the request ID in a report if it repeats.

## Knowledge and fact tools

### `KNOWLEDGE_SOURCE_NOT_FOUND`

The agent requested a source outside the verified package. Search again and use only returned source IDs.

### `ANSWER_SOURCE_UNKNOWN`

A validated answer referenced a source that could not be resolved at commit time. Retry; if it repeats, verify the knowledge package.

### `FACT_INPUT_MISSING`

A deterministic fact request omitted required context such as voltage, amperage, or process. Supply the missing condition and retry.

### `FACT_DUTY_CYCLE_UNSUPPORTED`

The manuals do not state the requested voltage/amperage point. Use a documented rated point or ask for the nearest documented setting; ArcLens will not interpolate it.

## Grounding failures

All `GROUNDING_*` failures mean the proposed answer was rejected before publication. They are fail-closed results.

### `GROUNDING_SOURCE_OMITTED`

A claim used a source missing from the answer-level source list. The agent must declare every source used by a claim.

### `GROUNDING_SOURCE_UNKNOWN`

A source ID is not in the verified knowledge package. The agent must use IDs returned by the retrieval tools.

### `GROUNDING_ARTIFACT_UNKNOWN`

The answer references an artifact that was not built in this request.

### `GROUNDING_RECEIPT_UNKNOWN`

A calculation cites a computation receipt not attached to a staged deterministic artifact.

### `GROUNDING_ARTIFACT_REQUIRED`

Technical prose or a deterministic claim was submitted without a server-computed artifact. The agent must use the fact and artifact tools before submitting.

### `GROUNDING_EVIDENCE_REQUIRED`

A prose-only answer did not include an exact excerpt for every claim. The agent must call `get_manual_pages` and attach verified evidence.

### `GROUNDING_QUOTE_MISMATCH`

The submitted evidence quote was not present in the referenced page text or did not contain the extractive claim. The answer is rejected rather than published with approximate evidence.

## Transaction failures

### `ARTIFACT_ID_CONFLICT`

The same artifact ID was reused with different validated content. Use a new semantic ID or the original unchanged artifact.

### `ANSWER_MISSING`

The turn ended without `submit_answer`. This is retryable once; repeated failures indicate a prompt or tool-flow regression.

### `ANSWER_ARTIFACT_MISSING`

The answer references an artifact that was not staged in the same request.

### `ANSWER_SOURCE_MISSING`

The answer omitted evidence required by one of its claims or artifacts.

### `REQUEST_NOT_COMMITTABLE`

A committed or aborted request transaction was reused. Start a new request.

## Reporting a repeat failure

Include the error code, request ID, application mode, Node version, and exact reproduction steps. Never include `ANTHROPIC_API_KEY` or an unredacted environment dump. See [CONTRIBUTING.md](../CONTRIBUTING.md) for bug reports and [SECURITY.md](../SECURITY.md) for vulnerabilities.
