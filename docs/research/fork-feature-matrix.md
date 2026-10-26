# Prox challenge fork deep dive

Date: 2026-10-26
Source of truth: public GitHub fork metadata and repository contents

## Executive verdict

This is not a normal take-home field. The public fork network is deep, recent, and highly convergent. The obvious “strong submission” recipe has already been executed many times: a polished chat UI, pre-extracted manual pages, exact duty-cycle and polarity tools, page citations, a few interactive artifacts, browser voice, image upload, a hosted demo, and an eval folder.

The strongest visible submission is currently [SomeshBhandarkar/prox-challenge](https://github.com/SomeshBhandarkar/prox-challenge). Its repository contains a strict manual-only answer pipeline, a second-model fact checker, 118 manual figure crops, dynamic sandboxed drawings, browser voice, 41 test files, 34 eval/result files, and a README reporting 1,150 offline tests plus an 85-question exam. Those claims are backed by corresponding source and result files in the repository tree, although this review did not run them. [README](https://github.com/SomeshBhandarkar/prox-challenge/blob/main/README.md) · [repository tree](https://github.com/SomeshBhandarkar/prox-challenge/tree/main)

ArcLens cannot win merely by implementing the brief cleanly. It needs to match that reliability floor and then demonstrate a product thesis the other entries mostly stop short of: **verify the physical setup before the user acts, make every visual element traceable to exact source evidence, and turn each interaction into an inspectable support case plus a knowledge-gap signal.**

## Coverage and method

- GitHub reported **161 forks**. The public forks API returned **158 accessible public fork records** during this review. [Forks API](https://api.github.com/repos/prox-technologies/prox-challenge/forks)
- A conservative metadata filter identified 81 likely substantive forks: repository size over the unchanged upstream baseline, a post-fork push, and a changed tree. One was unavailable by the time its content was queried, leaving **80 substantive candidates inspected**.
- For all 80, this review read the root tree, README, default-branch history metadata, homepage URL, and root `package.json`, `requirements.txt`, `pyproject.toml`, `Dockerfile`, and `.env.example` when present.
- Fifteen high-signal submissions received a full README design review. Eight received recursive-tree verification to confirm that claimed knowledge, artifact, test, and eval files exist.
- No foreign code was executed, no API keys were supplied, and no live answer-quality claim was independently reproduced. Reported scores remain the submitters’ claims.
- The heuristic can miss a tiny but substantive fork and cannot see private submissions. Counts below are directional lower bounds, not an official leaderboard.

## Directional landscape counts

Across the 80 substantive public candidates inspected:

| Signal | Count | Interpretation |
|---|---:|---|
| Public homepage/deployment URL | 30 | Hosting is a useful baseline signal, not a differentiator. |
| Root TypeScript/JavaScript manifest | 48 | Next.js or React is the dominant presentation stack. |
| Root Python manifest | 15 | FastAPI/Streamlit-style solutions remain common. |
| Exact Agent SDK dependency visible in a root manifest | 29 | This is a lower bound because 15 monorepo/nested layouts were not recursively dependency-parsed. It also shows many submissions do not actually meet the stated foundation requirement. |
| Test directory visible at repository root | 13 | Real automated engineering evidence is much rarer than polished README claims. |
| Eval directory visible at repository root | 17 | A measured evaluation story remains a strong signal, but the best entries already have it. |
| README describes code-level grounding or answer guards | 7 | Prompt-only grounding is still a common weakness. |
| README describes browser voice or speech controls | 28 | Browser voice is no longer novel. |
| README describes dynamic or sandboxed generated artifacts | 41 | “We reverse-engineered Claude Artifacts” is no longer novel by itself. |
| README explicitly describes claim/page citation behavior | 11 | Source-linked trust is still underbuilt outside the top tier. |
| README explicitly describes a vector store or embedding stack | 34 | The field is split between vector retrieval and small-corpus deterministic/whole-manual approaches. |

These figures are derived from public repository contents, not from running each app.

## Strong-submission matrix

| Repository | What is genuinely strong | Evidence found | Remaining opening for ArcLens |
|---|---|---|---|
| [SomeshBhandarkar/prox-challenge](https://github.com/SomeshBhandarkar/prox-challenge) | The current reliability bar: strict manual-only pipeline, word guard, Haiku fact checker, rewrite/remove fallback, 118 figure crops, deterministic widgets, dynamic drawings, browser voice, cost caps, detailed error states. | 41 test files, 34 eval/result files, guard/judge/answering modules, large committed knowledge and visual assets. [README](https://github.com/SomeshBhandarkar/prox-challenge/blob/main/README.md) | It is still answer-centric. ArcLens can differentiate with physical preflight verification, per-claim region provenance, and a real knowledge-operations loop. |
| [shiva-shivanibokka/prox-challenge](https://github.com/shiva-shivanibokka/prox-challenge) | Excellent extraction narrative; captioned figure corpus; photo-based weld diagnosis with measured image evals; self-checking answer flow; cost discussion. | 200 image assets, ingest scripts, 16 eval/result files, weld-image fixtures. [README](https://github.com/shiva-shivanibokka/prox-challenge/blob/main/README.md) | Move from post-weld diagnosis to pre-action setup verification and explain exactly which observed cable/control differs from the required state. |
| [xenshreyas/prox-challenge](https://github.com/xenshreyas/prox-challenge) | Serious mixed-granularity extraction, retrieval recall testing, independent fact corroboration, artifact harness research, explicit design tradeoffs. | 160 knowledge files, recall/eval scripts, artifact runtime and parser sources. [README](https://github.com/xenshreyas/prox-challenge/blob/main/README.md) | Make evidence inspection a user-visible product capability rather than an engineering artifact. |
| [Adwaith673/prox-challenge](https://github.com/Adwaith673/prox-challenge) | Broad visual extraction, four-layer verification story, adversarial tests, photo cases, voice latency thinking, cross-reference graph. | 242 knowledge files, 195 images, 8 test files, 14 eval files. [README](https://github.com/Adwaith673/prox-challenge/blob/main/README.md) | Deliver a tighter flagship flow rather than breadth: one camera-based preflight that feels inevitable and safe. |
| [Nzouh/prox-challenge](https://github.com/Nzouh/prox-challenge) | Most distinctive visual navigation: 2.5D front/inside component explorer with verified hotspots; evidence verification and retry; grounded typed artifacts. | `InteractiveView.tsx`, hotspot overlays, OCR records, page-level corpus and eval outputs. [README](https://github.com/Nzouh/prox-challenge/blob/main/README.md) | ArcLens should avoid competing on a static explorer and instead use spatial overlays inside an actual verification workflow. |
| [soul0101/prox-challenge](https://github.com/soul0101/prox-challenge) | Strong product surface: image upload, image-labeling artifacts, memories, versioned artifacts, library/sidebar, source viewer, mobile artifact sheet, and a large sandbox runner. | Large artifact runner and chat components, 105 images, memory routes, artifact source modules. [README](https://github.com/soul0101/prox-challenge/blob/main/README.md) | Add measurable grounding and eval depth; turn memory into an auditable support case rather than convenience state. |
| [gandhiishan777/prox-challenge](https://github.com/gandhiishan777/prox-challenge) | Machine-context strip, exact numeric tools, cropped figures, openable citations, four response registers, grounded artifact research, detailed testing narrative. | 177 knowledge files, 160 images, test and eval files, large implementation surface. [README](https://github.com/gandhiishan777/prox-challenge/blob/main/README.md) | The machine-context strip is now table stakes. ArcLens should verify that context from a photo and show evidence for each inferred field. |
| [kveni12/prox-challenge](https://github.com/kveni12/prox-challenge) | Clean typed artifact strategy, process-filtered troubleshooting, multimodal photo input, safety benchmark, accessibility/reliability documentation, 62-case live eval claim. | 7 test files and 4 eval files; artifact, retrieval, and domain tool modules. [README](https://github.com/kveni12/prox-challenge/blob/main/README.md) | Add source-region evidence and a business-facing outcome artifact; avoid relying on prompt-only claim citations. |
| [swapnita1205/prox-challenge](https://github.com/swapnita1205/prox-challenge) | Explicit diagnostic belief state, information-gain question selection, prefetch, grounding statuses, validated configuration summary, Garage Mode. | Detailed architecture and testing claims in README; typed knowledge, detective, vision, grounding, and artifact directories listed. [README](https://github.com/swapnita1205/prox-challenge/blob/main/README.md) | This already covers structured troubleshooting. ArcLens needs the photo-based configuration delta and knowledge-gap handoff to move beyond it. |
| [MashaArakelyan/prox-challenge](https://github.com/MashaArakelyan/prox-challenge) | Canonical setup verification plus a Bayesian diagnostic loop that chooses the next best check. | Critical facts, canonical setups, diagnostic trees, salience-ranked regions described in README. [README](https://github.com/MashaArakelyan/prox-challenge/blob/main/README.md) | Verify the real observed machine state from pixels, not only user-reported settings. |
| [DINAKAR-S/prox-challenge](https://github.com/DINAKAR-S/prox-challenge) | Clear one-key hosted/local product, exact structured lookups, committed page images, dynamic sandboxed artifacts, strong no-RAG rationale. | Agent SDK dependency, Next.js app, knowledge and manual assets, deployed URL. [README](https://github.com/DINAKAR-S/prox-challenge/blob/main/README.md) | Add an enforceable final-answer guard and deeper test/eval evidence. |
| [KJ-11/chat-agent](https://github.com/KJ-11/chat-agent) | Polished artifact catalog, image uploads, structured tables, cached catalog, eval results, hosted artifact playground. | Eight React artifact templates and 28 annotated evals described in README. [README](https://github.com/KJ-11/chat-agent/blob/main/README.md) | Its README says it uses a Messages API tool runner, not the required Agent SDK. ArcLens can be strict about the requirement and still match the UX. |
| [thisisvk45/prox-challenge](https://github.com/thisisvk45/prox-challenge) | Strongest product/founder narrative: hands-free loop, ElevenLabs, photo overlays, persistent memory, guided walkthroughs, customer mode, feedback, multi-agent safety review. | Hosted demo, screenshots, architecture narrative, and code tree. [README](https://github.com/thisisvk45/prox-challenge/blob/main/README.md) | Requires a second key and explicitly uses a hand-rolled Messages API loop; human escalation and feedback aggregation are roadmap items, not the shipped differentiator. |
| [ArnavGarg10/prox-challenge](https://github.com/ArnavGarg10/prox-challenge) | Huge source-cited knowledge graph, multi-hop paths, 15 artifacts, photo overlays, video frame input, graph explorer, broad tests. | Knowledge graph and Agent SDK parity code described; 85 unit tests claimed. [README](https://github.com/ArnavGarg10/prox-challenge/blob/main/README.md) | The default execution path is explicitly hand-rolled Messages API, not Agent SDK. ArcLens can keep the Agent SDK central and make a smaller product more trustworthy. |
| [Entrasoft/prox-challenge](https://github.com/Entrasoft/prox-challenge) | Product-agnostic ingestion, typed KB, human verification checkpoint, hybrid registry plus generated artifacts, measured cost/cache metrics. | Committed KB/provenance, hosted demo, eval and cost narrative. [README](https://github.com/Entrasoft/prox-challenge/blob/main/README.md) | Convert human sign-off and provenance into a first-class interactive evidence ledger and knowledge-change workflow. |

## What has become table stakes

None of these should be presented as the central differentiator:

1. A Next.js chat page with streaming.
2. A committed manual corpus so startup stays under two minutes.
3. Duty-cycle and polarity lookup tools.
4. Page citations and a manual-page modal.
5. A polarity SVG, duty-cycle calculator, and troubleshooting flowchart.
6. Browser microphone/TTS.
7. User weld-photo upload and defect diagnosis.
8. Sandboxed HTML/SVG artifacts.
9. A hosted demo and a video walkthrough.
10. A README architecture diagram and a folder named `evals`.

The best entries already combine nearly all ten.

## Repeated weaknesses

### 1. The submission often proves a demo, not the stated SDK constraint

Only 29 of the 80 inspected roots exposed an exact Agent SDK dependency. Several polished entries explicitly use a hand-rolled Messages API loop as the default while keeping the Agent SDK as an alternate or schema dependency. That is an avoidable scoring risk because the brief calls the Agent SDK the foundation.

### 2. Most grounding is still advisory

Only seven READMEs describe a code-level answer guard or judge. Many systems use exact tools for numbers but still allow free-form final prose to introduce unsupported claims. Somesh’s buffered answer, guard, rewrite, and removal pipeline is the bar to match.

### 3. “Multimodal” usually means input/output variety, not physical verification

Many entries accept a weld image and show manual figures. Few describe checking a photograph of the user’s actual cable/socket/control setup against a source-backed expected configuration before the user energizes the machine. That is a materially different job: observation → spatial correspondence → discrepancy → safe next action.

### 4. Evidence stops at the page

Top entries cite pages and some keep figure boxes internally. The common UI still treats the citation as a page button. It rarely lets the user click a sentence, diagram label, calculator value, or troubleshooting branch and see the exact source region plus the deterministic transformation that produced it.

### 5. The business harness is mostly roadmap prose

Feedback buttons, memory, and customer mode appear in several apps. A working loop that converts low-confidence questions into a knowledge-gap queue, supports expert correction, versions the fact, and reruns affected evals was not surfaced as a completed flagship in the strong repositories inspected. This directly maps to Prox’s stated need to capture technician knowledge and feed customer questions back into the knowledge base.

### 6. Test evidence is uneven

Only 13 roots visibly include tests and 17 include evals. Some outstanding projects publish real transcripts and failure analysis; many others only quote a percentage. ArcLens should preserve raw case outputs, identify tuned versus holdout cases, report cost/latency, and run mutation tests that prove each guard actually fails when broken.

## Recommended winning thesis for ArcLens

### “Verify before you act”

Make one flagship flow that the current field does not already own:

1. The user selects a task such as gasless flux-core setup.
2. ArcLens renders the expected configuration from verified facts.
3. The user photographs the machine’s front panel and inside cable/spool area.
4. Claude vision identifies visible sockets, cables, controls, wire, and gas state, but every observation is represented as a bounded hypothesis with confidence.
5. A deterministic verifier compares observed state against the required configuration.
6. The UI overlays expected versus observed connections directly on the photo, lists discrepancies, links every expected state to an exact manual region, and refuses to issue a pass when the image cannot prove a condition.
7. Only after confirmation does it advance to a large-touch guided procedure.

This uses multimodal reasoning for a real physical-product problem rather than for a decorative artifact. It demonstrates vision, spatial reasoning, deterministic grounding, clarification, safety, and interaction design in one coherent scene.

### Evidence ledger, not citation chips

Every answer and artifact should compile into an `AnswerEnvelope`:

- atomic claim;
- exact `SourceRef` and page-region box;
- deterministic fact or retrieved passage used;
- transformation type, such as lookup, arithmetic, comparison, or model synthesis;
- safety classification;
- artifact element IDs that depend on the claim.

Clicking any prose claim, cable label, timer segment, or flow branch opens the source crop and highlights the exact region. An evaluator can visually audit why the answer is true. This makes the knowledge engine visible instead of hiding it behind chat.

### Ship the business feedback loop

When evidence is insufficient, ArcLens should not merely abstain. It should create a structured knowledge-gap record:

- exact user question and machine context;
- evidence searched and why it was insufficient;
- missing entity/relation/visual;
- proposed question for a technician;
- affected eval category;
- state: open, expert answered, verified, published.

A tiny reviewer panel can accept an expert correction, bind it to a source or mark it as technician knowledge, version the fact, and rerun only impacted evals. The result demonstrates the part of Prox’s product thesis most challenge submissions omit.

### Produce an exportable support case

The troubleshooting session should accumulate observations, checks performed, eliminated causes, safety stops, final resolution, and source evidence into a shareable case report. If escalation is needed, the human receives the complete case rather than asking the customer to start again. This connects the agent to actual ticket resolution and customer ownership.

## Non-negotiable parity work

The differentiators above only matter if ArcLens matches the visible reliability bar:

- use the Agent SDK in the real execution path;
- no built-in shell/filesystem/web tools;
- validated final `submit_answer` envelope instead of trusting free-form output;
- exact source identity with one-based PDF page number, printed label, and page region;
- full visual catalog and structured critical facts;
- buffered answer guard, repair, and abstention path;
- at least 80 adversarial live cases plus offline unit/integration tests;
- a real holdout set and mutation tests;
- raw transcripts, tool calls, artifacts, latency, and cost committed as evidence;
- clean-clone doctor and timed two-minute setup;
- browser QA on desktop, phone, keyboard, reduced-motion, cancellation, bad key, rate limit, and session restart;
- hosted demo and short walkthrough after the local release gate passes.

## Proposed evaluation categories beyond the public field

1. **Photo preflight**: correct setup, reversed polarity, occluded sockets, ambiguous photo, wrong machine, no visible cable.
2. **Claim provenance**: every technical sentence and artifact datum resolves to a source region; no orphan source IDs.
3. **Knowledge gaps**: missing manual fact creates a gap, expert correction remains quarantined until verification, affected evals rerun.
4. **Support-case continuity**: multi-turn observations survive follow-ups; reset/cancel races do not duplicate actions; escalation export is complete.
5. **Mutation tests**: flip a polarity fact, remove a citation, mis-map a page, permit a built-in tool, corrupt an artifact value, and prove the suite fails.
6. **Adversarial visual input**: irrelevant photo, screenshot of text, manipulated labels, multiple welders, low light, and prompt injection visible inside an uploaded image.

## Bottom line

The strongest public work has already saturated the brief’s obvious feature space. The winning move is not “more artifacts” or “more agents.” It is a tighter demonstration of what Prox needs in production:

> observe the real machine, verify it against source-backed product knowledge, explain every claim down to the visual region, preserve the diagnostic case, and turn unknowns into new knowledge.

That is the product story ArcLens should own.
