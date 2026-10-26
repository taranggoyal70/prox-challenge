# ArcLens UI specification

Status: APPROVED DESIGN CONTRACT
Surface class: OPERATE
Primary use scene: a nonprofessional welder in a garage, often standing, distracted, wearing gloves, and using a phone or laptop under uneven light.

## Product hierarchy

ArcLens has three deliberately separate surfaces:

1. **Owner workspace (`/`)**: ask, clarify, follow a safe next action, inspect concise evidence, and resolve or escalate a case.
2. **Inspector layer (within `/`)**: Proof Mode opens from a specific claim or artifact element and never competes with the primary answer by default.
3. **Local admin (`/gaps`)**: knowledge gaps, expert fact review, eval impact, publication, and rollback. Hidden and unreachable in modes that do not allow mutation.

Raw eval results and diagnostics live under development routes, not in the owner's navigation.

## First screen

The first screen shows, in order:

1. A compact product bar: ArcLens, `Vulcan OmniPro 220`, current application mode, and model/key readiness.
2. A persistent machine-context bar with model, welding process, input voltage, and provenance for each value. `Unknown` is a valid visible state. Conflicts are highlighted and must be resolved before affected advice.
3. One dominant question composer labeled “What are you trying to do or fix?”
4. Three text-list examples using the literal challenge prompts. They are launch shortcuts, not marketing cards.
5. A secondary `Recorded proof` link in no-key mode. It opens a distinct gallery, not a simulated live chat.

Visible setup preflight appears only after the user chooses a supported setup task or opens it from a relevant answer. Knowledge gaps and admin controls never appear on the owner landing screen.

## Owner workspace layout

```text
DESKTOP ≥ 1100
┌──────────────────────────────────────────────────────────────────────────┐
│ Product bar: ArcLens | OmniPro 220 | context | mode                     │
├──────────────────────────────────────┬───────────────────────────────────┤
│ Conversation / next action  60%      │ Artifact canvas / Proof  40%      │
│                                      │ hidden until first artifact        │
│ Safety → action → artifact link      │ one selected artifact at a time    │
│ Supporting steps → evidence markers │ close returns focus to invoker     │
├──────────────────────────────────────┴───────────────────────────────────┤
│ Sticky composer; Cancel replaces Send while active                       │
└──────────────────────────────────────────────────────────────────────────┘

TABLET 720–1099
┌──────────────────────────────────────────────────────────────────────────┐
│ Product + context bar                                                     │
├──────────────────────────────────────────────────────────────────────────┤
│ Conversation                                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ Inline artifact, collapsible to a labelled summary                        │
└──────────────────────────────────────────────────────────────────────────┘

PHONE < 720
┌─────────────────────────────┐
│ Compact product/context bar │
├─────────────────────────────┤
│ Conversation                │
│                             │
├─────────────────────────────┤
│ Sticky composer             │
└─────────────────────────────┘
Artifact and Proof open as labelled full-screen dialogs. Close restores chat
scroll position and focus to the claim or control that opened the dialog.
```

Before the first artifact, conversation uses the full width. Artifacts do not stack in the canvas: the newest selected artifact replaces the canvas content, while earlier artifacts remain as labelled transcript controls. Deep links preserve the selected claim or artifact element.

## Response anatomy

### Immediate-stop or hazardous response

1. Immediate stop heading and prohibited action.
2. One safe next action or escalation.
3. Missing assumption or clarification, when required.
4. Relevant artifact or visible setup state.
5. Concise rationale and bounded steps.
6. Evidence markers; Proof Mode stays collapsed.

### Normal response

1. Direct answer or next action in one to three sentences.
2. Artifact when it reduces cognitive load.
3. Supporting steps or explanation.
4. Evidence markers and optional Proof Mode.

Technical validation details never precede the user's next action. Proof Mode never exposes chain-of-thought.

## Hazard presentation

| Level | Use | Presentation | Persistence |
|---|---|---|---|
| Stop | Electric shock, energized service, fire, unknown critical state | Red stop band, icon plus text, imperative heading, action blocked | Remains above all answer content; no dismiss |
| Caution | Action requires PPE, ventilation, cylinder handling, cool-down | Amber band immediately before affected step | Remains while step is active |
| Reminder | Contextual safe practice | Neutral inline note with icon and text | Collapsible after first read |

Color is never the only signal. Safety orange is reserved for caution or a primary action that needs attention, not ordinary decoration.

## Machine context

Required fields are machine model, process, and input voltage. Optional fields are material, thickness, wire/electrode, gas, and observed symptom. Each value has provenance: `user confirmed`, `photo observed`, `manual default`, or `unknown`. Photo and manual values never overwrite user-confirmed context silently. Conflicts open a one-question resolution before affected advice continues.

Context is scoped to the current support case. Changing process or voltage marks dependent answer segments stale and asks whether to restart the affected branch.

## User-visible request states

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Question | Composer preserved; Cancel visible | Warm examples plus one dominant input | Input preserved; typed cause and retry | Validated answer appears | Answer appears with localized visual/source notice |
| Clarification | Prior question visible | “Not sure” always offered | Choice preserved | Returns to original task | Free-text answer accepted when choices do not fit |
| Retrieval | “Finding manual evidence” | Explain sources searched; ask one useful detail or offer escalation | Corrupt knowledge blocks technical answer | Evidence markers available | Page-level reference labelled as less precise |
| Validation | “Checking the answer” | No envelope triggers one repair attempt | Rejection is distinct from provider failure | Answer emitted once | Valid text can survive a failed optional artifact |
| Artifact | “Preparing the diagram” | Explain why text is sufficient | Component-local retry, answer preserved | Selected canvas/dialog opens | Missing crop, failed render, or unsupported version each have distinct copy |
| Session | Send disabled while active | New-case orientation | Busy/capacity/expiry state preserves input | Follow-up continues | Restored history banner says sources were rechecked |
| Replay | Skeleton gallery | Explain no fixtures for this build | Fixture integrity failure blocks replay | Recorded proof shows date/version | Never falls back to a fake live answer |
| Upload | Per-slot validation/progress | Front and inside capture guidance | Cause-specific rejection and recapture advice | Analysis result plus deletion confirmation | Inconclusive angle routes to recapture/manual path |
| Case export | Generating brief | Explain what must be recorded first | Preserve case and retry export | Download/share confirmation | Review screen marks excluded or unavailable data |

Progress copy follows this bounded sequence: `Checking machine context` → `Finding manual evidence` → `Validating the answer` → `Preparing the diagram`. Status changes use a polite ARIA live region and do not announce timers or hidden reasoning.

Provider/key/model, timeout, budget ceiling, validation rejection, missing evidence, corrupt knowledge, unsupported artifact, capacity, and internal errors each have distinct codes, plain-language meaning, retry eligibility, and escalation action.

Cancellation copy is exact: `Cancelling…`; then either `Cancelled. Your question is still here.` or `The answer finished before cancellation.` Never show competing terminal messages.

## Journey storyboard

| Step | User does | Desired feeling | Trust cue and escape |
|---|---|---|---|
| 1 | Opens ArcLens | Oriented | Machine and mode are explicit; examples show scope |
| 2 | Confirms context | In control | Unknown is allowed; provenance is visible |
| 3 | Asks a question | Heard | Input remains visible and editable |
| 4 | Answers one clarification | Understands why | Short reason, `Not sure`, and free-text escape |
| 5 | Waits | Progress without theater | Bounded stages, cancel, no premature answer text |
| 6 | Receives answer | Knows the next safe action | Action-first anatomy, hazard band when needed |
| 7 | Uses diagram or timeline | Reduced cognitive load | Non-color cues and text/table equivalent |
| 8 | Opens Proof Mode | Can challenge the answer | Claim ↔ artifact ↔ source cross-highlighting |
| 9 | Records result | Momentum | Guided one-check-at-a-time troubleshooting and undo |
| 10 | Resolves or escalates | Closure | Case summary, evidence, exclusions, and next owner |

Five-second goal: know what machine/context is active and where to ask. Five-minute goal: complete one safe action or export an evidence-complete escalation. Long-term goal: trust ArcLens because it admits uncertainty and preserves a case record.

## Clarification interaction

Show one question at a time with a one-sentence reason. Use large choice controls, always include `I'm not sure`, and keep free text available. The original user question remains above the clarification. A context-edit control is visible when a choice changes process, voltage, or machine assumptions.

## Guided troubleshooting

Use one check at a time, not a static decision tree. Each check includes why it matters, safe instructions, result choices, current position, completed checks, Back/Undo, and `Stop and export case`. Confirmed results become support-case observations. A branch cannot mark a cause eliminated from an inferred or missing observation.

## Visible setup preflight

Use separate front-panel and inside-machine capture slots. Each slot supports empty, selected, validating, rejected, ready, processing, analyzed, removed, and deletion-confirmed states. Privacy/retention copy appears before selection.

Results map to actions:

| Result | Next action |
|---|---|
| Visible match | Continue only with documented guided steps and the unobservable-conditions list |
| Visible discrepancy | Show the exact visible difference and a source-backed correction |
| Not observable | Ask for the missing angle or manual confirmation; never infer |
| Inconclusive | Explain what was visible, give one recapture instruction, offer deterministic/no-photo path or escalation |

ArcLens never says the machine is safe or fully verified. Wrong machine, low light, multiple machines, manipulated labels, or hostile image content are explained in owner language with recapture and manual alternatives.

Early prototype metrics: capture completion, recapture rate, uncertainty recognition, false-confidence incidents, time to next action, comprehension of the four result labels, and fallback completion.

## Artifact specifications

### Polarity diagram

- Exact positive/negative socket labels, cable endpoints, DCEN/DCEP/process title, non-color polarity symbols, and warning placement.
- Cable line and socket label are jointly focusable; opening Proof selects both artifact element and source region.
- Text list/table equivalent describes each connection.

### Duty-cycle timeline

- Shows input voltage, amperage, ten-minute window, welding segment, rest segment, formula, units, and source.
- Uses labels/patterns as well as color. Out-of-range values return unsupported, never extrapolated.
- A table equivalent exposes start/end minutes and calculations.

### Troubleshooting flow

- One current check, reason, safe procedure, result choices, completed checks, next branch, Back/Undo, and escalation.
- Distinguishes observed, user-confirmed, model-hypothesized, and eliminated states.

### Evidence viewer

- Exact crop first; surrounding full page second.
- Shows document, one-based PDF page, printed page label, section, provenance, transformation, and validation status.
- Zoom/pan are keyboard operable. Missing crop falls back to page metadata and accessible extracted text, never a visual-valid badge.

## Proof Mode

Inline claims use quiet numbered evidence markers. Artifact elements expose visible focus/hover affordances. Selecting either cross-highlights the claim, transformation, artifact elements, and source region.

Plain-language transformations are `Quoted`, `Looked up`, `Calculated from`, `Compared with`, and `Synthesized from`. Technical IDs and hashes sit behind a disclosure. Multiple sources are ordered by directness. Page-level fallback uses a persistent `Page-level reference; no stable exact region` label and a distinct icon.

Manual evidence and verified field notes are separate components. Manual evidence shows document/page/crop. A field note shows verifier role, version, observation/source, review date, and conflict state. They never share one undifferentiated citation list.

## Recorded proof

Recorded proof has its own gallery route and persistent banner: `Recorded proof; not generated for your setup`. It displays fixture date, corpus/schema/model version, and immutable scenario. Live input is absent. A separate `Configure live mode` action explains the key requirement.

## Support case

Every live conversation creates a case shell. Its timeline separates automatic system events, explicitly user-confirmed observations, inferred hypotheses, completed checks, safety stops, and resolution. Users can edit notes but not rewrite system evidence. Before export, a review screen lists included data, excluded photos, and absent fields.

The printable case brief contains machine context, question, confirmed observations, actions tried, eliminated causes, resolution/escalation, source thumbnails/pages, and generation metadata. It omits controls, progress messages, provider/session IDs, hidden proof internals, and private image bytes.

## Visual system

### Typography

- Display/section headings: `Barlow Condensed`, 600–700, used sparingly for industrial orientation.
- Body/UI: `Source Sans 3`, 400–600, 16px minimum.
- Numeric/data: `IBM Plex Mono`, tabular numerals, only for values, source IDs, and statuses.

### Color tokens

```css
--canvas: #f3f1e9;
--surface: #fffdf8;
--ink: #171a17;
--muted: #626760;
--line: #c9c8be;
--action: #155e75;
--action-hover: #0e4b5e;
--caution: #d95d00;
--danger: #b42318;
--success: #1f6f4a;
--focus: #075985;
```

Orange is caution, not the ordinary brand/action color. Secondary text on colored surfaces is tinted from that surface. Body text contrast is at least 4.5:1.

### Geometry and density

- Spacing scale: 4, 8, 12, 16, 24, 32, 48.
- Corners: 4px controls, 8px dialogs/artifacts; no uniform bubbly radius.
- Borders: 1px functional separators; no decorative left-border cards.
- Shadows: only floating dialogs/sheets, 0 8px 24px rgba(23,26,23,.16).
- Cards exist only for selectable prompts, capture slots, or case items where the card is the interaction.

Theme selection, caret, scrollbars, focus rings, link underlines, and visited links from the same tokens. The single authored motion moment is synchronized claim/artifact/source cross-highlighting at 160ms cubic-bezier(.2,.8,.2,1). Reduced-motion mode switches instantly.

## Content rules

- Utility language, not marketing language.
- Answer summary is one to three sentences before detail.
- Supporting detail collapses after roughly 75 words, without hiding safety or the next action.
- Group citations by claim; never show an unbounded chip row.
- Line length is 65–75 characters for prose.
- Headings have more space above than below.
- No generic “AI is thinking,” “unlock,” “power,” or “magic” copy.

## Accessibility contract

- Semantic landmarks and one logical heading hierarchy.
- Focus enters and leaves artifact/proof dialogs predictably and returns to the invoker.
- Status live region announces only stage changes and terminal results.
- Every diagram/overlay has a synchronized list or table equivalent.
- Hotspots, zoom, pan, branches, and timeline controls work by keyboard.
- All touch targets are at least 44×44px.
- Color never carries polarity, hazard, status, or branch meaning alone.
- High zoom, 320px viewport, landscape phone, forced colors, and reduced motion are browser-test cases.

## Mode matrix

| Mode | Visible status | Allowed owner actions | Admin actions |
|---|---|---|---|
| build/no-key | `Recorded proof` | Browse replay and manuals; live composer disabled with setup CTA | Hidden |
| live-local | `Live; local` | Full live chat, preflight, case export | Local expert workflow allowed |
| hosted-read-only | `Live; read-only` | Live chat/preflight/case export with rate limits | Hidden/read-only |
| hosted-admin | `Live; admin protected` | Same as read-only | Token/CSRF-protected expert workflow |

Missing or invalid mode enters build/no-key. It never enables a live or mutation route.

## Design gate before UI implementation

Before Phase 5 begins, preserve these artifacts under gstack design storage when tooling is available:

- Desktop and phone wireframes for all three challenge prompts.
- Component anatomy sheets for four artifact families and Proof Mode.
- Clickable flows for normal answer, clarification, hazard refusal, partial artifact failure, preflight inconclusive result, and escalation export.
- The request, upload, safety, provenance, and mode matrices from this document.

No visual mockup was generated during plan review because the gstack designer binary was unavailable. This textual contract remains normative until approved mockups supersede it.
