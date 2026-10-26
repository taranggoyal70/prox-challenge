# Prox challenge fork landscape

Date: 2026-10-26
Target: [`prox-technologies/prox-challenge`](https://github.com/prox-technologies/prox-challenge)
Companion data: [`fork-inventory.json`](./fork-inventory.json)

## Executive conclusion

The public field is much stronger than the raw fork count suggests. GitHub reports 161 forks on the source repository, and its public forks endpoint exposes 158 of them. Sixty are identical to upstream. Ninety are ahead of upstream, of which 86 contain changed code and four contain only documentation or asset changes. Eight additional forks could not be compared through GitHub's cross-fork compare endpoint; seven of those have application-shaped trees and READMEs. In practical terms, there are roughly ninety serious-looking public implementations, not 161.

The obvious checklist is already crowded. Among the 86 compare-confirmed code implementations, repository/README signals show 43 claiming Claude Agent SDK use, 64 discussing RAG or vector retrieval, 46 discussing voice, 28 discussing evals, and 46 publishing a deployment URL. Thirty contain test-shaped paths. Only four contain GitHub Actions workflow files. These counts are discovery signals, not proof that the feature works.

The strongest public submission is already beyond “chat with a PDF.” It combines a typed knowledge graph, page-grounded citations, five validated widgets, a sandboxed artifact escape hatch, voice, a live graph view, video timestamps, a hosted demo, and a 31-question eval suite reporting 30/31. Matching that feature list will not stand out.

The clearest opening is **verifiable trust and evaluator-grade engineering**:

1. Produce every answer through a typed `submit_answer` contract, with claim-level source IDs, safety flags, clarification/abstention variants, and no unvalidated technical text streamed to the browser.
2. Make provenance structurally correct: document ID, explicit one-based PDF page number, printed page label, visual region, source checksum, and stale-output detection.
3. Treat concurrency, cancellation, reset, retry, and provider-session isolation as tested product behavior. No public README describes these race contracts.
4. Put the release gate in the product: show the evaluator the offline evidence checks, adversarial cases, valid-artifact rate, citation score, cost, and latency. Many repos mention evals; few make readiness auditable.
5. Ship accessibility and CI as evidence of finished engineering. Only one compare-confirmed implementation README explicitly mentions accessibility-related work, and only four clear implementations contain workflow files.

This is a better differentiation than another voice button, another generic vector store, or another free-form artifact iframe.

## Method

All evidence came from first-party GitHub sources:

- Upstream repository metadata: [GitHub API](https://api.github.com/repos/prox-technologies/prox-challenge)
- Public fork pages: [page 1](https://api.github.com/repos/prox-technologies/prox-challenge/forks?per_page=100&page=1), [page 2](https://api.github.com/repos/prox-technologies/prox-challenge/forks?per_page=100&page=2)
- Per-fork default-branch comparisons against `prox-technologies:main`
- Per-fork recursive Git trees, exact changed-file lists where compare succeeded, and repository READMEs

Coverage was exhaustive for every fork returned by the public API. Fork contents were treated as untrusted data. No code from a fork was executed.

Important limits:

- The upstream count is 161 while the public endpoint returned 158. Deleted, private, disabled, or otherwise inaccessible forks cannot be inspected.
- GitHub's compare endpoint failed for eight forks, commonly after renamed repositories or rewritten history. Their trees and READMEs were still inventoried.
- GitHub caps a compare response at 300 changed files, so rows showing exactly 300 may contain more.
- Feature labels are conservative keyword/path signals for navigation. They do not prove correct behavior, security, test quality, or a working deployment.
- Hosted demos and README-reported eval scores were not independently run in this pass.

## What is already common

| Signal among 86 compare-confirmed code implementations | Count | Why it is not differentiation by itself |
|---|---:|---|
| Visual/artifact language in changed README or paths | 83 | The challenge explicitly asks for it, so nearly everyone claims it. |
| Multimodal or image-language signal | 76 | Basic image/manual-page surfacing is table stakes. |
| Citation/evidence language | 67 | Most implementations promise page citations; enforcement quality is the differentiator. |
| RAG/vector/retrieval language | 64 | Architecture choice alone says little about exact-cell and cross-page accuracy. |
| Safety/grounding language | 58 | Prompt-level safety is common; server-enforced claim validation is not. |
| Voice/speech language | 46 | Browser speech buttons are widely implemented and easy to copy. |
| Public deployment URL | 46 | Hosting reduces friction but does not establish correctness. |
| Agent SDK language | 43 | Several repos install the package while the web path still uses the Messages API, so use must be substantive. |
| Test-shaped repository paths | 30 | Test presence is useful, but coverage and adversarial quality vary sharply. |
| Eval/benchmark language | 28 | Public suites range from smoke prompts to serious hallucination tests. |
| OCR/document-AI language | 12 | Less common, but raw OCR still misses vector diagrams and table structure. |
| Knowledge-graph language | 9 | Distinctive earlier, but no longer unique in this cohort. |
| GitHub Actions workflows | 4 | This remains a strong and easily verified quality signal. |

## The public bar: five submissions worth learning from

### 1. [`Shauryagulati/omnipro-expert`](https://github.com/Shauryagulati/omnipro-expert)

Its README describes a 576-node, roughly 1,400-edge typed knowledge graph; deterministic alias-aware traversal; five Zod-validated widgets; a sandboxed HTML fallback; citations backed by graph schema; voice; a graph visualization; video moments; an MCP surface; a hosted demo; and 31 live evals reporting 30/31. It also openly preserves the failed visual case instead of tuning it away. [Primary source](https://github.com/Shauryagulati/omnipro-expert/blob/main/README.md)

Lesson: a graph, widgets, voice, deployment, and evals are already bundled in one polished public submission. We need a stronger trust contract and cleaner evaluator proof, not a longer feature list.

### 2. [`gandhiishan777/prox-challenge`](https://github.com/gandhiishan777/prox-challenge)

This submission starts by measuring the corpus, notices the selection chart has no text, runs every page through vision transcription, crops vector-drawn figures from rendered pages, keeps a full-context prompt for the small corpus, moves numerical claims into deterministic tools, exposes machine context in the UI, and reports 87 unit tests plus a gold eval set. [Primary source](https://github.com/gandhiishan777/prox-challenge/blob/main/README.md)

Lesson: “we use RAG” is not a quality signal. The better question is whether the system can prove it preserved tables, figures, page identity, and unsupported facts.

### 3. [`soul0101/prox-challenge`](https://github.com/soul0101/prox-challenge)

Its README describes a document-agnostic ingestion path, query expansion, page-image reinspection, region cropping, sandboxed React artifacts with retry, responsive mobile/desktop evidence views, pre-seeded no-key demos, and user-photo diagnosis against manual defect references. [Primary source](https://github.com/soul0101/prox-challenge/blob/main/README.md)

Lesson: generic ingestion, responsive design, photo input, and no-key demo states are already present. If we include them, they must support the core proof rather than become the headline.

### 4. [`sshtomar/prox-challenge`](https://github.com/sshtomar/prox-challenge)

This project derives an evaluation corpus from real Reddit questions, defines query-type axes, adds synthetic gap cases, and includes eight programmatic hallucination traps. Its README describes seven MCP tools, BM25 markdown retrieval, structured JSON, 300-DPI page images, SSE, citations, artifacts, and voice. [Primary source](https://github.com/sshtomar/prox-challenge/blob/main/README.md)

Lesson: adversarial evaluation based on real user language is a high-value move. Our suite should keep this idea but make its pass/fail contract visible and release-blocking.

### 5. [`MashaArakelyan/prox-challenge`](https://github.com/MashaArakelyan/prox-challenge)

Its README describes ontology-first extraction, deterministic critical facts, bounding-box diagrams, a constrained artifact descriptor system with a React escape hatch, and a Bayesian troubleshooting loop whose belief state is visible to the user. It explicitly rejects voice as polish risk and unrestricted generated JSX as unreliable. [Primary source](https://github.com/MashaArakelyan/prox-challenge/blob/main/README.md)

Lesson: constrained generative UI and diagnostic state are already thoughtful. We can improve on this by validating the final answer as rigorously as the artifact and by avoiding unsupported numeric probabilities.

## Recommended winning position

### Product thesis

Build **the most inspectable and falsifiable technical-support agent in the cohort**. The reviewer should be able to challenge any answer and immediately see:

- the exact structured claims the server accepted;
- the manual page and highlighted region supporting each claim;
- whether the value came from a deterministic fact, extracted visual, or synthesized procedure;
- which safety rule or abstention gate fired;
- whether the same behavior passes the checked-in regression case.

Call this evaluator-facing layer **Proof Mode**. It should expose evidence and validation outcomes, never hidden chain-of-thought.

### Architecture choices that exploit public gaps

1. **`submit_answer` as the only completion path.** Claude submits one of `answer`, `clarification`, or `abstention`. Claims carry canonical source IDs. Free-form final SDK output never reaches the browser.
2. **Artifact program, not widget selection or arbitrary JSX.** Claude composes a validated program from layout, control, diagram, evidence, and branching primitives. This is more generative than fixed widgets and more dependable than an iframe-first design.
3. **Canonical provenance ledger.** Use explicit one-based PDF page numbers and separate printed labels; include checksums and visual-region IDs; fail CI on stale or orphaned knowledge assets.
4. **Buffered technical answers.** Stream progress states, but emit technical prose only after grounding validation. Several submissions stream first and trust prompting to keep claims cited.
5. **Core and extended eval gates.** Core blocks submission for facts, cross-page synthesis, visual retrieval, ambiguity, safety, citations, and the four required artifact families. Extended covers optional configurators, gallery, voice, and image upload only when present.
6. **Race-tested sessions.** Serialize per conversation; make cancel/reset idempotent; keep provider session IDs server-side; test send/send, cancel/done, reset/active, retry, and expiry.
7. **CI plus accessibility.** Make keyboard use, reduced motion, focus management, screen-reader labels, knowledge integrity, production build, and no-key startup state visible in checks.

### Ideas to borrow as principles, not code

- From Shaurya: keep honest failed evals and use aliases for garage vocabulary.
- From Gandhi: measure the corpus before choosing retrieval; crop rendered line art, not only embedded raster images.
- From Soul: let users inspect a retrieved page region and support an excellent no-key demonstration.
- From Tomar: derive adversarial cases from real user language and include programmatic hallucination traps.
- From Masha: constrain generated UI and represent troubleshooting as evolving state instead of a static checklist.

### Things not worth using as the headline

- Generic vector RAG
- Browser speech buttons
- A hosted URL without spend/rate controls
- A knowledge graph with no measurable retrieval advantage
- Free-form generated JSX without a validated answer contract
- Large feature counts that are not release-gated

## Full public-fork inventory

The appendix below has one row for every fork returned by GitHub's public forks endpoint. `Ahead` is the commit delta from upstream when GitHub could calculate it. `Signals` are README/path indicators, not verified capabilities. Exact metadata and changed paths are in [`fork-inventory.json`](./fork-inventory.json).

| Repository | Status | Ahead | Changed files | Stack | Deployment | Signals |
|---|---|---:|---:|---|---|---|
| [koushikpb/prox-challenge](https://github.com/koushikpb/prox-challenge) | code implementation | 67 | 247 | Next.js + React | [1](https://prox-challenge-livid.vercel.app) | Agent SDK, multimodal, artifacts, citations, streaming, evals, tests, safety |
| [AsbestosSoup-dev/prox-challenge](https://github.com/AsbestosSoup-dev/prox-challenge) | code implementation | 63 | 104 | Vite/React + FastAPI | [1](https://prox-challenge-eosin.vercel.app) | Agent SDK, retrieval, multimodal, artifacts, voice, streaming, codegen |
| [MashaArakelyan/prox-challenge](https://github.com/MashaArakelyan/prox-challenge) | code implementation | 58 | 179 | Next.js + React | [1](https://prox-challenge-plum.vercel.app) | retrieval, multimodal, artifacts, voice, citations, streaming, codegen, evals, tests, safety |
| [krtk-ptl/prox-challenge](https://github.com/krtk-ptl/prox-challenge) | code implementation | 57 | 105 | Next.js + React + FastAPI | [1](https://prox-vulcan-ai.vercel.app) | retrieval, multimodal, artifacts, citations, streaming, codegen, evals, safety |
| [Berk-CS/prox-challenge](https://github.com/Berk-CS/prox-challenge) | code implementation | 55 | 132 | Next.js + React + Python |  | Agent SDK, retrieval, multimodal, artifacts, voice, codegen, safety |
| [xenshreyas/prox-challenge](https://github.com/xenshreyas/prox-challenge) | code implementation | 46 | 223 | Vite/React + Python |  | Agent SDK, retrieval, multimodal, artifacts, voice, citations, OCR, streaming, codegen, evals, Docker, tests, safety |
| [Vedant1202/prox-challenge](https://github.com/Vedant1202/prox-challenge) | code implementation | 44 | 223 | Next.js + React + FastAPI | [1](https://prox-challenge-eight.vercel.app/) | retrieval, multimodal, artifacts, citations, streaming, codegen, tests |
| [Shauryagulati/omnipro-expert](https://github.com/Shauryagulati/omnipro-expert) | code implementation | 42 | 277 | Next.js + React + Python | [1](https://omnipro-expert-6b9s.onrender.com) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, graph, codegen, evals, tests, safety |
| [tchalikanti1705/prox-challenge](https://github.com/tchalikanti1705/prox-challenge) | code implementation | 37 | 90 | Next.js + React + FastAPI | [1](https://prox-challenge-production.up.railway.app/) [2](https://teja-chalikanti.vercel.app) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, streaming, codegen, Docker |
| [gandhiishan777/prox-challenge](https://github.com/gandhiishan777/prox-challenge) | code implementation | 31 | 290 | Next.js + React + Python | [1](https://prox-challenge-production-db9e.up.railway.app/) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, streaming, codegen, evals, Docker, tests, safety |
| [soul0101/prox-challenge](https://github.com/soul0101/prox-challenge) | code implementation | 25 | 236 | Next.js + React | [1](https://prox-challenge-ten.vercel.app) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, OCR, codegen, evals, tests, safety |
| [amrutsavadatti/prox-challenge](https://github.com/amrutsavadatti/prox-challenge) | code implementation | 24 | 274 | Vite/React + Python | [1](https://youtu.be/yuOQoFR6Lp0) | multimodal, artifacts, voice, citations, OCR, evals, safety |
| [krishpatel1077/prox-challenge-krish](https://github.com/krishpatel1077/prox-challenge-krish) | code implementation | 24 | 80 | Next.js + React + Python | [1](https://prox-challenge-krish.vercel.app) | retrieval, artifacts, Docker |
| [ymiled/vulcan-omnipro-assistant](https://github.com/ymiled/vulcan-omnipro-assistant) | code implementation | 24 | 76 | Vite/React + Python | [1](https://vulcan-omnipro-assistant.fly.dev) | retrieval, multimodal, artifacts, voice, citations, streaming, codegen, evals, Docker |
| [Gowtham-Pentela/vulcan-agentic-system](https://github.com/Gowtham-Pentela/vulcan-agentic-system) | code implementation | 22 | 300 | Streamlit | [1](https://vulcanomnipro220agent.streamlit.app/) | retrieval, multimodal, artifacts, citations, tests, safety |
| [mahirsowad3/prox-challenge](https://github.com/mahirsowad3/prox-challenge) | code implementation | 22 | 42 | Next.js + React |  | Agent SDK, retrieval, multimodal, artifacts, citations, tests, safety |
| [shiva-shivanibokka/prox-challenge](https://github.com/shiva-shivanibokka/prox-challenge) | code implementation | 22 | 230 | Next.js + React + Python | [1](https://omnipro-220-expert.vercel.app) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, evals, tests |
| [AbhinavMalkoochi/prox-challenge](https://github.com/AbhinavMalkoochi/prox-challenge) | code implementation | 21 | 58 | Next.js + React | [1](https://prox-challenge.vercel.app/) | retrieval, multimodal, artifacts, citations, tests, safety |
| [SatyamDave/prox-challenge](https://github.com/SatyamDave/prox-challenge) | code implementation | 20 | 57 | Vite/React + FastAPI |  | retrieval, multimodal, artifacts, citations, Docker |
| [ibz-arain/prox-challenge](https://github.com/ibz-arain/prox-challenge) | code implementation | 19 | 73 | Next.js + React | [1](https://omnipro.ibrahimarain.com/) [2](https://prox-challenge-ibz-arain.vercel.app/) | retrieval, multimodal, artifacts, citations, streaming, evals, Docker, safety |
| [katipally/prox-challenge](https://github.com/katipally/prox-challenge) | code implementation | 19 | 188 | Next.js + React | [1](https://yash3471-prox.hf.space) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, streaming, codegen, Docker, tests, safety |
| [LorenzoTaylor/prox-challenge](https://github.com/LorenzoTaylor/prox-challenge) | code implementation | 19 | 117 | Vite/React + Python | [1](https://prox-challenge-production-9f29.up.railway.app/) | retrieval, multimodal, artifacts, voice, citations, codegen, Docker |
| [Blizzard42/prox-challenge](https://github.com/Blizzard42/prox-challenge) | code implementation | 18 | 129 | Next.js + React + FastAPI | [1](https://prox-challenge-web.vercel.app) [2](https://prox-challenge-web.vercel.app/) | retrieval, multimodal, artifacts, voice, citations, streaming, Docker, safety |
| [Haneul25/prox-challenge](https://github.com/Haneul25/prox-challenge) | code implementation | 17 | 82 | Next.js + React | [1](https://prox-challenge-production-f288.up.railway.app) | Agent SDK, retrieval, multimodal, artifacts, citations |
| [kveni12/prox-challenge](https://github.com/kveni12/prox-challenge) | code implementation | 17 | 87 | Next.js + React |  | Agent SDK, retrieval, multimodal, artifacts, voice, citations, streaming, evals, Docker, tests, safety |
| [DINAKAR-S/prox-challenge](https://github.com/DINAKAR-S/prox-challenge) | code implementation | 16 | 141 | Next.js + React | [1](https://prox-welder-agent.vercel.app/) [2](https://prox-welder-agent.vercel.app) | Agent SDK, retrieval, multimodal, artifacts, citations, streaming, codegen, safety |
| [Keugene11/manual-support-agent](https://github.com/Keugene11/manual-support-agent) | code implementation | 16 | 132 | Next.js + React | [1](https://prox-challenge-sooty.vercel.app) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, OCR, streaming, codegen, safety |
| [KJ-11/chat-agent](https://github.com/KJ-11/chat-agent) | code implementation | 15 | 129 | Next.js + React | [1](https://prox-challenge-delta.vercel.app) [2](https://prox-challenge-delta.vercel.app/dev/artifacts) | retrieval, multimodal, artifacts, voice, citations, streaming, evals, safety |
| [sprihaapandey/prox-challenge](https://github.com/sprihaapandey/prox-challenge) | code implementation | 14 | 158 | Vite/React + FastAPI | [1](https://omnipro-385920925770.us-central1.run.app/) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, streaming, evals, Docker, tests, safety |
| [aktanazat/prox-challenge](https://github.com/aktanazat/prox-challenge) | code implementation | 13 | 190 | Python + Node.js |  | Agent SDK, retrieval, artifacts, citations, streaming, codegen, tests, safety, CI |
| [Entrasoft/prox-challenge](https://github.com/Entrasoft/prox-challenge) | code implementation | 13 | 191 | Next.js + React |  | Agent SDK, retrieval, multimodal, artifacts, voice, citations, codegen, evals, Docker, safety |
| [Karan-05/prox-challenge](https://github.com/Karan-05/prox-challenge) | code implementation | 13 | 150 | Vite/React + Python | [1](https://prox-challenge-7x5k.onrender.com) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, streaming, codegen, evals, Docker, safety, CI |
| [akshai0296/prox-challenge](https://github.com/akshai0296/prox-challenge) | code implementation | 12 | 86 | Vite/React | [1](https://prox-challenge-production-39d1.up.railway.app/) | Agent SDK, multimodal, artifacts, voice, citations, OCR, Docker, tests, safety, CI |
| [Adwaith673/prox-challenge](https://github.com/Adwaith673/prox-challenge) | code implementation | 11 | 300 | Next.js + Python | [1](https://omnipro-220-specialist.onrender.com) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, graph, evals, Docker, tests, safety |
| [iakhil/prox-challenge](https://github.com/iakhil/prox-challenge) | code implementation | 10 | 42 | Vite/React + FastAPI | [1](https://omnipro-api.onrender.com/) | Agent SDK, multimodal, artifacts, voice, streaming, codegen, Docker |
| [nickhuo/vulcan-omnipro-copilot](https://github.com/nickhuo/vulcan-omnipro-copilot) | code implementation | 10 | 99 | Next.js + React + Python |  | Agent SDK, retrieval, multimodal, artifacts, citations, streaming, safety |
| [sanikakulkarni89/prox-challenge](https://github.com/sanikakulkarni89/prox-challenge) | code implementation | 10 | 81 | Next.js + React + Python | [1](https://prox-challenge-theta.vercel.app) | multimodal, artifacts, voice, citations |
| [Spidey13/diagnostiq](https://github.com/Spidey13/diagnostiq) | code implementation | 10 | 300 | Vite/React + FastAPI |  | retrieval, multimodal, artifacts, citations, streaming, codegen, evals, Docker, tests |
| [Pranay0302/prox-challenge](https://github.com/Pranay0302/prox-challenge) | code implementation | 9 | 99 | Next.js + React | [1](https://prox-challenge.up.railway.app) | artifacts, streaming, codegen, Docker, tests |
| [sshtomar/prox-challenge](https://github.com/sshtomar/prox-challenge) | code implementation | 9 | 98 | FastAPI | [1](https://prox-welding-agent-production.up.railway.app) | Agent SDK, retrieval, artifacts, voice, citations, streaming, codegen, evals, Docker, safety |
| [AditM99/prox-challenge](https://github.com/AditM99/prox-challenge) | code implementation | 8 | 65 | Next.js + React | [1](https://prox-challenge-five.vercel.app) [2](https://prox-challenge-five.vercel.app/) | retrieval, multimodal, artifacts, voice, streaming, codegen, Docker, safety |
| [Nzouh/prox-challenge](https://github.com/Nzouh/prox-challenge) | code implementation | 8 | 300 | Next.js + React + Python |  | Agent SDK, multimodal, artifacts, citations, OCR, streaming, evals, Docker, tests, safety |
| [SomeshBhandarkar/prox-challenge](https://github.com/SomeshBhandarkar/prox-challenge) | code implementation | 8 | 300 | React + FastAPI |  | Agent SDK, retrieval, multimodal, artifacts, voice, citations, streaming, codegen, evals, Docker, tests, safety |
| [tom-byrn/prox-challenge](https://github.com/tom-byrn/prox-challenge) | code implementation | 8 | 300 | Vite/React + Python | [1](https://prox-challenge-rouge.vercel.app) | Agent SDK, artifacts, citations, streaming, codegen, evals, tests, safety |
| [kp183/prox-challenge](https://github.com/kp183/prox-challenge) | code implementation | 7 | 36 | Next.js + React + FastAPI |  | retrieval, multimodal, artifacts, citations, graph, codegen, safety |
| [panam-dodia/prox-challenge](https://github.com/panam-dodia/prox-challenge) | code implementation | 7 | 83 | Vite/React | [1](https://prox-vulcan-agent-web.onrender.com) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, OCR, streaming, codegen, safety, CI |
| [Wyatt-design5110/prox-challenge](https://github.com/Wyatt-design5110/prox-challenge) | code implementation | 7 | 21 | Vite/React | [1](https://prox-challenge-mu.vercel.app) | retrieval, multimodal, artifacts, voice, citations, streaming, codegen, safety |
| [abhinav-TB/prox-challenge](https://github.com/abhinav-TB/prox-challenge) | code implementation | 6 | 300 | Vite/React + FastAPI |  | retrieval, multimodal, artifacts, citations, streaming, codegen, Docker, safety |
| [swapnita1205/prox-challenge](https://github.com/swapnita1205/prox-challenge) | code implementation | 6 | 300 | Next.js + React + Python |  | Agent SDK, retrieval, multimodal, artifacts, voice, citations, OCR, graph, streaming, evals, Docker, tests, safety |
| [Fizza-Mukhtar/prox-challenge](https://github.com/Fizza-Mukhtar/prox-challenge) | code implementation | 5 | 141 | Next.js + React + Python |  | retrieval, multimodal, artifacts, citations, streaming, codegen |
| [fleursee/prox-challenge](https://github.com/fleursee/prox-challenge) | code implementation | 4 | 35 | Vite/React + FastAPI |  | artifacts |
| [haripriyarao26/prox-challenge](https://github.com/haripriyarao26/prox-challenge) | code implementation | 4 | 17 | Next.js + React |  | Agent SDK, multimodal, artifacts, OCR |
| [Krisp140/prox-challenge](https://github.com/Krisp140/prox-challenge) | code implementation | 4 | 89 | Next.js + React | [1](https://prox-challenge-ten.vercel.app) [2](https://prox-challenge-ten.vercel.app/) | retrieval, multimodal, artifacts, citations, streaming, codegen, evals, Docker, tests, safety |
| [MAINAKSAHA07/prox-challenge](https://github.com/MAINAKSAHA07/prox-challenge) | code implementation | 4 | 71 | Next.js + React | [1](https://prox-challenge-chi.vercel.app) [2](https://prox-challenge-chi.vercel.app/) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, OCR, tests, safety |
| [MihirSahu14/prox-challenge](https://github.com/MihirSahu14/prox-challenge) | code implementation | 4 | 140 | Vite/React + FastAPI | [1](https://omnipro-expert.onrender.com) | Agent SDK, retrieval, multimodal, artifacts, voice, graph, streaming, codegen, safety |
| [mitanshubhoot/prox-challenge](https://github.com/mitanshubhoot/prox-challenge) | code implementation | 4 | 75 | Next.js + React + FastAPI |  | retrieval, multimodal, artifacts, citations, streaming, codegen, safety |
| [pranavishal/prox-challenge](https://github.com/pranavishal/prox-challenge) | code implementation | 4 | 101 | Next.js + React | [1](https://prox-challenge-three.vercel.app) [2](https://prox-challenge-three.vercel.app/) | retrieval, multimodal, artifacts, citations, graph, codegen, Docker, safety |
| [ArnavGarg10/prox-challenge](https://github.com/ArnavGarg10/prox-challenge) | code implementation | 3 | 300 | Next.js + React | [1](https://proxchallenge.vercel.app) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, graph, streaming, codegen, evals, tests, safety |
| [darealbirdie/prox-challenge](https://github.com/darealbirdie/prox-challenge) | code implementation | 3 | 93 | Next.js + React + Streamlit + Flask |  | retrieval, multimodal, artifacts, citations, OCR, Docker, safety |
| [isabelccc/prox-challenge](https://github.com/isabelccc/prox-challenge) | code implementation | 3 | 34 | Next.js + React |  | retrieval, multimodal, artifacts, voice, streaming, codegen, evals, safety |
| [karthikosa11/prox-challenge](https://github.com/karthikosa11/prox-challenge) | code implementation | 3 | 10 | FastAPI | [1](https://prox-challenge-aows.onrender.com) | Agent SDK, multimodal, artifacts |
| [NicoKaragozian/prox-challenge](https://github.com/NicoKaragozian/prox-challenge) | code implementation | 3 | 14 | Python |  | Agent SDK, retrieval, multimodal, artifacts, graph, safety |
| [rishikeshydv/prox-challenge](https://github.com/rishikeshydv/prox-challenge) | code implementation | 3 | 103 | Next.js + React + FastAPI | [1](https://frontend-production-fa28.up.railway.app/) | retrieval, multimodal, artifacts, citations, streaming, safety |
| [ruiner28/prox-challenge](https://github.com/ruiner28/prox-challenge) | code implementation | 3 | 86 | Next.js + React | [1](https://prox-challenge-blush.vercel.app) | retrieval, multimodal, artifacts, voice, citations, streaming, codegen, safety |
| [damoahdominic/prox-challenge](https://github.com/damoahdominic/prox-challenge) | code implementation | 2 | 171 | Next.js + React + Python |  | retrieval, multimodal, artifacts, voice, citations, codegen, evals, safety |
| [dhruvac29/prox-challenge](https://github.com/dhruvac29/prox-challenge) | code implementation | 2 | 21 | Next.js + React | [1](https://prox-challenge-kappa.vercel.app) | Agent SDK, multimodal, artifacts, voice, citations, safety |
| [Sapna24Sangmitra/prox-challenge](https://github.com/Sapna24Sangmitra/prox-challenge) | code implementation | 2 | 30 | Next.js + React |  | Agent SDK, retrieval, multimodal, artifacts, codegen |
| [vibhusings/prox-challenge](https://github.com/vibhusings/prox-challenge) | code implementation | 2 | 126 | Next.js + React | [1](https://gallant-dubinsky.vercel.app) | retrieval, multimodal, artifacts, voice, citations, streaming, codegen |
| [AbhijitJowhari/prox-challenge](https://github.com/AbhijitJowhari/prox-challenge) | code implementation | 1 | 102 | Python + Node.js |  | multimodal, artifacts |
| [akhilmw/prox-challenge](https://github.com/akhilmw/prox-challenge) | code implementation | 1 | 3 | Python |  |  |
| [amit943c/prox-challenge](https://github.com/amit943c/prox-challenge) | code implementation | 1 | 160 | Next.js + React + Python |  | retrieval, multimodal, artifacts, voice, citations, streaming, codegen, Docker, safety |
| [andyzong16/prox-challenge](https://github.com/andyzong16/prox-challenge) | code implementation | 1 | 77 | Vite/React |  | Agent SDK, retrieval, multimodal, artifacts, citations, streaming, codegen, safety |
| [darshannere/prox-challenge](https://github.com/darshannere/prox-challenge) | code implementation | 1 | 58 | FastAPI |  | Agent SDK, multimodal, artifacts, voice, citations, streaming |
| [JeffNi/prox-challenge](https://github.com/JeffNi/prox-challenge) | code implementation | 1 | 11 | Python |  | multimodal, tests |
| [Lakshyak7/prox-challenge](https://github.com/Lakshyak7/prox-challenge) | code implementation | 1 | 65 | Next.js + React |  | multimodal, artifacts, voice, citations, safety |
| [Lekha-Reddy-git-hub/prox-challenge](https://github.com/Lekha-Reddy-git-hub/prox-challenge) | code implementation | 1 | 78 | Vite/React + FastAPI |  | multimodal, artifacts, voice, citations, graph, streaming, codegen, safety |
| [lpv2011/prox-challenge](https://github.com/lpv2011/prox-challenge) | code implementation | 1 | 123 | Python |  | citations, Docker, tests |
| [MekalaKaveri18/prox-challenge](https://github.com/MekalaKaveri18/prox-challenge) | code implementation | 1 | 60 | Next.js + React |  | Agent SDK, retrieval, multimodal, artifacts, voice, citations, OCR, streaming, codegen, safety |
| [MichelleG045/prox-challenge](https://github.com/MichelleG045/prox-challenge) | code implementation | 1 | 66 | Node.js |  | Agent SDK, multimodal, artifacts, voice, citations, evals, safety |
| [prava241/prox-challenge](https://github.com/prava241/prox-challenge) | code implementation | 1 | 66 | Next.js + React + FastAPI |  | Agent SDK, retrieval, multimodal, artifacts, citations, streaming, codegen, tests, safety |
| [qwertyxx99xx99/prox-challenge](https://github.com/qwertyxx99xx99/prox-challenge) | code implementation | 1 | 22 | Next.js + React | [1](https://prox-challenge-opal.vercel.app) | artifacts, tests |
| [sallyoswal/prox-challenge](https://github.com/sallyoswal/prox-challenge) | code implementation | 1 | 6 | Node.js |  | retrieval, multimodal, artifacts, citations, streaming |
| [sarvanithin/prox-challenge](https://github.com/sarvanithin/prox-challenge) | code implementation | 1 | 69 | Vite/React + FastAPI |  | retrieval, multimodal, artifacts, voice, citations, streaming, codegen, Docker, safety |
| [Sebastianrtj/prox-challenge](https://github.com/Sebastianrtj/prox-challenge) | code implementation | 1 | 12 | Python |  | Agent SDK, retrieval, multimodal, artifacts, voice, citations, codegen |
| [Shivam-Lahoti/prox-challenge](https://github.com/Shivam-Lahoti/prox-challenge) | code implementation | 1 | 35 | Vite/React + FastAPI |  | retrieval, multimodal, artifacts, safety |
| [SimranShaikh20/prox-challenge](https://github.com/SimranShaikh20/prox-challenge) | code implementation | 1 | 80 | Vite/React |  | artifacts |
| [hwang2409/prox-challenge](https://github.com/hwang2409/prox-challenge) | compare unavailable | ? |  | Next.js + React + FastAPI |  | retrieval, multimodal, artifacts, citations, streaming, codegen, evals, Docker, safety |
| [mbeukadev/prox-challenge](https://github.com/mbeukadev/prox-challenge) | compare unavailable | ? |  | Next.js + React | [1](https://prox-challenge-two.vercel.app) | retrieval, multimodal, artifacts, voice, citations, streaming, safety |
| [midhat81/prox-challenge_midhat](https://github.com/midhat81/prox-challenge_midhat) | compare unavailable | ? |  | Python |  |  |
| [nehanataraj/prox-challenge](https://github.com/nehanataraj/prox-challenge) | compare unavailable | ? |  | FastAPI | [1](https://prox-challenge-3fr8.onrender.com/) | multimodal, artifacts, citations, streaming, Docker |
| [pranav2910/prox-challenge](https://github.com/pranav2910/prox-challenge) | compare unavailable | ? |  | Streamlit |  | multimodal, citations, graph |
| [sanyam-jn/OmniPro](https://github.com/sanyam-jn/OmniPro) | compare unavailable | ? |  | FastAPI | [1](https://prox-lyart-nine.vercel.app) | Agent SDK, retrieval, multimodal, artifacts, citations, streaming, codegen |
| [thisisvk45/prox-challenge](https://github.com/thisisvk45/prox-challenge) | compare unavailable | ? |  | Next.js + React | [1](https://omnipro.helloviks.com/) | Agent SDK, retrieval, multimodal, artifacts, voice, citations, graph, streaming, safety |
| [vanshsharmabuisness/prox-challenge](https://github.com/vanshsharmabuisness/prox-challenge) | compare unavailable | ? |  | Python |  |  |
| [TejasChaudhari01/prox-challenge](https://github.com/TejasChaudhari01/prox-challenge) | non-code change | 6 | 2 | FastAPI |  | multimodal, artifacts, voice, citations |
| [aneesh2411/prox-challenge](https://github.com/aneesh2411/prox-challenge) | non-code change | 1 | 1 |  |  |  |
| [AneriPatel28/prox-challenge-AP](https://github.com/AneriPatel28/prox-challenge-AP) | non-code change | 1 | 1 |  |  | multimodal |
| [edgemoorlf/prox-challenge](https://github.com/edgemoorlf/prox-challenge) | non-code change | 1 | 3 |  |  |  |
| [AchuthReddy-16/prox-challenge](https://github.com/AchuthReddy-16/prox-challenge) | identical | 0 |  |  |  |  |
| [adi-suresh01/prox-challenge](https://github.com/adi-suresh01/prox-challenge) | identical | 0 |  |  |  |  |
| [AdiS-lab/prox-challenge](https://github.com/AdiS-lab/prox-challenge) | identical | 0 |  |  |  |  |
| [anoop2000/prox-challenge](https://github.com/anoop2000/prox-challenge) | identical | 0 |  |  |  |  |
| [anshikavashistha/prox-challenge](https://github.com/anshikavashistha/prox-challenge) | identical | 0 |  |  |  |  |
| [anuraggulavane/prox-challenge](https://github.com/anuraggulavane/prox-challenge) | identical | 0 |  |  |  |  |
| [ashcastelinocs124/prox-challenge](https://github.com/ashcastelinocs124/prox-challenge) | identical | 0 |  |  |  |  |
| [Atharva9281/prox-challenge](https://github.com/Atharva9281/prox-challenge) | identical | 0 |  |  |  |  |
| [aunshx/prox-challenge](https://github.com/aunshx/prox-challenge) | identical | 0 |  |  |  |  |
| [b0wen-liu/prox-challenge](https://github.com/b0wen-liu/prox-challenge) | identical | 0 |  |  |  |  |
| [BHUVAN-RJ/prox-challenge](https://github.com/BHUVAN-RJ/prox-challenge) | identical | 0 |  |  |  |  |
| [bmardimani/prox-challenge](https://github.com/bmardimani/prox-challenge) | identical | 0 |  |  |  |  |
| [Chinmayrawat15/prox-challenge](https://github.com/Chinmayrawat15/prox-challenge) | identical | 0 |  |  |  |  |
| [chinmoyrp/prox-challenge](https://github.com/chinmoyrp/prox-challenge) | identical | 0 |  |  |  |  |
| [deveshmittal/prox-challenge](https://github.com/deveshmittal/prox-challenge) | identical | 0 |  |  |  |  |
| [Dhiraj455/prox-challenge](https://github.com/Dhiraj455/prox-challenge) | identical | 0 |  |  |  |  |
| [Dhruva966/prox-challenge](https://github.com/Dhruva966/prox-challenge) | identical | 0 |  |  |  |  |
| [Dishant1804/prox-challenge](https://github.com/Dishant1804/prox-challenge) | identical | 0 |  |  |  |  |
| [Fyrlex/prox-challenge](https://github.com/Fyrlex/prox-challenge) | identical | 0 |  |  |  |  |
| [grahamonica/prox-challenge](https://github.com/grahamonica/prox-challenge) | identical | 0 |  |  |  |  |
| [gsonntag/prox-challenge](https://github.com/gsonntag/prox-challenge) | identical | 0 |  |  |  |  |
| [Hamzakhan7473/prox-challenge](https://github.com/Hamzakhan7473/prox-challenge) | identical | 0 |  |  |  |  |
| [harsh-185/prox-challenge](https://github.com/harsh-185/prox-challenge) | identical | 0 |  |  |  |  |
| [harshnandal981/prox-challenge-copy](https://github.com/harshnandal981/prox-challenge-copy) | identical | 0 |  |  |  |  |
| [holden-alt/prox-challenge](https://github.com/holden-alt/prox-challenge) | identical | 0 |  |  |  |  |
| [JayJaveri2711/prox-challenge](https://github.com/JayJaveri2711/prox-challenge) | identical | 0 |  |  |  |  |
| [kalyaan09/prox-challenge](https://github.com/kalyaan09/prox-challenge) | identical | 0 |  |  |  |  |
| [Krishnan9074/prox-challenge-krish](https://github.com/Krishnan9074/prox-challenge-krish) | identical | 0 |  |  |  |  |
| [Lasereyepop/prox-challenge](https://github.com/Lasereyepop/prox-challenge) | identical | 0 |  |  |  |  |
| [Lifsaa/prox-challenge](https://github.com/Lifsaa/prox-challenge) | identical | 0 |  |  |  |  |
| [madhura22-code/prox-challenge](https://github.com/madhura22-code/prox-challenge) | identical | 0 |  |  |  |  |
| [maghams62/prox-challenge](https://github.com/maghams62/prox-challenge) | identical | 0 |  |  |  |  |
| [matinsaurralde/prox-challenge](https://github.com/matinsaurralde/prox-challenge) | identical | 0 |  |  |  |  |
| [missmathpati/prox-challenge](https://github.com/missmathpati/prox-challenge) | identical | 0 |  |  |  |  |
| [Nishu2000-hub/prox-challenge](https://github.com/Nishu2000-hub/prox-challenge) | identical | 0 |  |  |  |  |
| [Niwant/prox-challenge](https://github.com/Niwant/prox-challenge) | identical | 0 |  |  |  |  |
| [OctavianTocan/prox-challenge](https://github.com/OctavianTocan/prox-challenge) | identical | 0 |  |  |  |  |
| [PatnamMadhu/prox-challenge](https://github.com/PatnamMadhu/prox-challenge) | identical | 0 |  |  |  |  |
| [phattandang/prox-challenge](https://github.com/phattandang/prox-challenge) | identical | 0 |  |  |  |  |
| [revanthchristober/prox-challenge-revanth](https://github.com/revanthchristober/prox-challenge-revanth) | identical | 0 |  |  |  |  |
| [ritikakumar0204/prox-challenge](https://github.com/ritikakumar0204/prox-challenge) | identical | 0 |  |  |  |  |
| [RogueTex/prox-challenge](https://github.com/RogueTex/prox-challenge) | identical | 0 |  |  |  |  |
| [SaraVaseem/prox-challenge](https://github.com/SaraVaseem/prox-challenge) | identical | 0 |  |  |  |  |
| [sarveshKharche/prox-challenge](https://github.com/sarveshKharche/prox-challenge) | identical | 0 |  |  |  |  |
| [shizhigu/prox-challenge](https://github.com/shizhigu/prox-challenge) | identical | 0 |  |  |  |  |
| [Shwetankkk/prox-challenge-shwetank](https://github.com/Shwetankkk/prox-challenge-shwetank) | identical | 0 |  |  |  |  |
| [srirammura/prox-challenge](https://github.com/srirammura/prox-challenge) | identical | 0 |  |  |  |  |
| [sshah229/prox-challenge](https://github.com/sshah229/prox-challenge) | identical | 0 |  |  |  |  |
| [studychain01/prox-challenge](https://github.com/studychain01/prox-challenge) | identical | 0 |  |  |  |  |
| [SumanMadipeddi/prox-challenge](https://github.com/SumanMadipeddi/prox-challenge) | identical | 0 |  |  |  |  |
| [taranggoyal70/prox-challenge](https://github.com/taranggoyal70/prox-challenge) | identical | 0 |  |  |  |  |
| [twilwa/prox-challenge](https://github.com/twilwa/prox-challenge) | identical | 0 |  |  |  |  |
| [uditohri4/prox-challenge](https://github.com/uditohri4/prox-challenge) | identical | 0 |  |  |  |  |
| [utkarshsharma00/prox-challenge](https://github.com/utkarshsharma00/prox-challenge) | identical | 0 |  |  |  |  |
| [vageeshadatta2000/prox-challenge](https://github.com/vageeshadatta2000/prox-challenge) | identical | 0 |  |  |  |  |
| [varun0630/prox-challenge](https://github.com/varun0630/prox-challenge) | identical | 0 |  |  |  |  |
| [vraj00222/prox-challenge](https://github.com/vraj00222/prox-challenge) | identical | 0 |  |  |  |  |
| [yassinreda101/prox-challenge](https://github.com/yassinreda101/prox-challenge) | identical | 0 |  |  |  |  |
| [zaanu/prox-challenge](https://github.com/zaanu/prox-challenge) | identical | 0 |  |  |  |  |
| [zeroxjohn/prox-challenge](https://github.com/zeroxjohn/prox-challenge) | identical | 0 |  |  |  |  |
