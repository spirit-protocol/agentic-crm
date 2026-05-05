# Architecture — @spirit/agentic-crm

> What's in v0.1, where the production source-of-truth lives, and what v0.2 is shaped to absorb.

---

## A. The frame: Memory Substrate + Control Plane

An agent that tries to meet the same person twice fails along two axes. **Memory** decides whether the agent *knows* anything — whether each touchpoint becomes durable understanding the next prompt can use. **Control plane** decides whether what the agent does with that knowledge is *bounded and reviewable* — whether retrieved insight becomes a per-recipient decision instead of an uncontrolled send. Both axes have to hold. SOLIENNE's April failure was not a memory failure; the memory substrate worked. It was a control-plane failure: the system actuated at batch scale without a reviewable per-recipient decision.

### A.1 Memory substrate — the Five Ruptures

Every agent that tries to meet the same person twice fails in the same five memory places. These are not model problems. They are not solved by a better LLM. They are **structural**.

| # | Rupture | Question it answers |
|---|---|---|
| 1 | **Extraction** | Did the touchpoint become an event the system can reason over? |
| 2 | **Synthesis** | Did the events become understanding the next prompt can use? |
| 3 | **Retrieval** | Did the understanding actually reach the next outbound? |
| 4 | **Evaluation** | Is the system learning from landings (replies, RSVPs, purchases), not sends? |
| 5 | **Cross-surface** | When the same person shows up on email + SMS + encounter, do the channels resolve to one identity? |

If any of the five fail, the second conversation is a re-introduction.

### A.2 Control plane — actuation governance

Closing the five ruptures gives the agent memory. Memory is not enough — production safety requires that every outbound is a *reviewable decision*, not a streamed action. The control plane is the layer that holds:

| Surface | Question it answers |
|---|---|
| **Proposal envelope** | Is this outbound a typed object with intent, recipient, content, and gates declared upfront? |
| **Gates** | Did cooldown / cap / consent / bounce / dead-man checks run, and did they pass? |
| **Operator review** | Could a human inspect, approve, refuse, or supersede before send (without that being the bottleneck forever)? |
| **Send ledger** | Is there a durable record of what was proposed, what was approved, what was sent, and what was refused — with reasons? |

**Closing all five ruptures + holding the control plane is the substrate.** Everything in this repo, and everything we lift into v0.2, is in service of one of those two layers.

---

## B. v0.1 layout (what's on disk)

```
agentic-crm/
├── schema/
│   ├── event.ts           # canonical relationship_event type — Rupture 1
│   ├── profile.ts         # RelationshipProfile + strength score — Rupture 2
│   └── genome.ts          # tunable outreach parameters (evolvable) — Rupture 4
├── prompts/
│   ├── synthesis.md       # 2-paragraph first-person context — Rupture 2
│   ├── extract.md         # observation extraction — Rupture 1
│   └── recall.md          # context injection at outbound — Rupture 3
├── safety/
│   └── guardrails.ts      # cooldown, 1+1 cap, bounce halt, dead-man — control-plane gates layer
├── examples/
│   └── minimal-loop.ts    # ~80 lines: load → log → synthesize → generate
├── README.md              # framing + five-ruptures explainer
├── CONTRIBUTING.md        # who, how, cross-CC discipline
└── ARCHITECTURE.md        # this file
```

Rupture 5 (cross-surface identity) is **not** addressed in v0.1. It requires a persistent identity store and a resolver, which a scaffold repo has no business shipping. It is the most likely v0.2 addition, because both SOLIENNE (email + encounter) and MERIAN (Telegram + booth) need it from day one.

---

## C. The pipeline shape

The minimal loop in `examples/minimal-loop.ts` walks:

```
        Touchpoint (email reply, RSVP, booth visit, SMS reply, etc.)
              │
              ▼  Extraction (Rupture 1)
        relationship_event { contactId, kind, ts, payload }
              │
              ▼  Synthesis (Rupture 2)  — prompts/synthesis.md
        RelationshipProfile { strengthScore, narrativeContext, ... }
              │
              ▼  Retrieval (Rupture 3)  — prompts/recall.md
        Personalized outbound (subject + body, channel-shaped)
              │
              ▼  Safety gate (orthogonal)
        guardrails(): cooldown? cap? bounced? dead-man?
              │
              ▼  Send (your channel — Resend, Twilio, Telegram, etc.)
              │
              ▼  Outcome ingest (Rupture 4)
        next event back into the loop → genome mutation
```

This is the **shape** all production impls converge on. The differences are in the channel adapters, the persistence layer, the evaluator, the synthesis cadence, and the voice register — all of which are agent-specific and explicitly **not** in this repo.

---

## D. Production source-of-truth (where the real code lives)

**SOLIENNE — `solienne-ai/lib/outbound/` + `solienne-ai/lib/outreach/`** is the canonical production implementation. The split matters: `outbound/` is the **proposal-queue primitive** (queue, gates, ledger, author — the most likely first-extract target); `outreach/` is the **loop** (proposer, cycle logic, genome — agent-shaped today, generalizable later). Key files:

```
solienne-ai/
├── lib/outbound/                          # proposal queue primitive (extraction target)
│   ├── types.ts                           # SurfaceContactProposalInput envelope, status enum
│   ├── gates.ts                           # safety + policy gates (cooldown, cap, etc.)
│   ├── ledger.ts                          # append-only proposal/send/outcome log
│   ├── author.ts                          # message authoring helpers
│   ├── queue-observability.ts             # NEW (codex/auto-outreach-observability-guardrail
│   └── queue-observability.test.ts        #   branch — local-only on M5, awaiting push)
├── lib/outreach/                          # the loop (agent-shaped today)
│   ├── auto-outreach.ts                   # main loop module
│   └── proposer.ts                        # proposes the next outbound from profile + genome
├── app/api/outreach/
│   ├── loop/                              # outreach loop endpoint
│   ├── batch/                             # batch lifecycle
│   └── genome/                            # genome read/write
├── app/api/outbound/
│   └── list/route.ts                      # queue listing (admin-driven)
├── app/api/cron/
│   ├── stale-chat-reignite/               # re-engagement cron
│   ├── warm-responder-convert/            # responder → cohort progression
│   └── outreach-inbox/                    # inbound classifier
├── app/admin/contacts/
│   └── [key]/page.tsx                     # per-contact admin view
├── app/admin/outbound/page.tsx            # outbound queue admin
├── prisma/schema.prisma                   # SurfaceContactProposal, contact, event tables
└── prisma/migrations/
    ├── 20260423_surface_contact_proposals.sql
    ├── 20260425_surface_contact_compose_meta.sql
    ├── 20260425_surface_contact_html_body.sql
    └── 20260428_surface_press_v0.sql
```

PR #8 (legacy-wave SurfaceContact adapter) merged 2026-05-03 (commit `2d771eb9`). Fotografiska cross-cycle re-engagement on main as `7b095c3d` + `a3f97aba`.

**Working plan: `solienne-ai/planning/codex-goals/goal-auto-outreach.md`.** Codex's 8-12-week working agenda for the SOLIENNE loop. North star: *the loop genuinely learns from outcomes and improves week over week.* Six sub-goals, including outcome metric definition (week 1), outcome→genome wiring (weeks 2-4), monthly newsletter cadence (weeks 1-3), substrate dashboard (weeks 4-8), channel maturity decisions (weeks 6-10), compounding loop where SOLIENNE becomes editor not operator (weeks 8-12). **All 6 not started in this lane as of 2026-05-05** — adjacent foundation (queue, gates, ledger, PR #8 adapter) shipped first.

**Current outbound primitive spec: `solienne-ai/planning/spirit-primitives/agent-initiated-outbound/spec-v0.md`.** Codex's spec for the outbound primitive shape. Treat this as the current truth for what `lib/outbound/` is converging on.

**Extraction blueprint (older sketch): `solienne-ai/planning/spirit-sdk/auto-outreach-spec.md`.** Earlier draft of what the SDK shape would be once extracted. Codex flagged 2026-05-05: **treat as map, not current truth** — implementation has moved past it. Splits the system into:

```
UNIVERSAL (the SDK, future v0.2)         AGENT-SPECIFIC (the config)
────────────────────────────────         ───────────────────────────
Loop orchestrator                        SOUL.md persona → voice
Genome storage + mutation                Strategy doc → phase logic
Safety rails engine                      Channel adapters (Resend/Twilio/Telegram)
Batch lifecycle                          Tier definitions + frames
Learning memory                          Evaluation weights
Correspondence log                       Template/design system
Relationship graph                       Nurture flow definitions
Rate limiting + cooldowns                LLM provider + model choice
```

This is the **target shape** of v0.2. It is not load-bearing yet — it gets pressure-tested against the MERIAN second impl before it lands here.

---

## E. The compounding-intel sibling (chat side of the same primitive)

SOLIENNE also runs a **compounding-intel primitive** on the chat side (commits `b2536b54` / `60bb8016` / `384c34b9`, Apr 26-30). This is the **inbound** complement to outreach's **outbound**:

| | Auto-outreach (outbound) | Compounding-intel (inbound) |
|---|---|---|
| Trigger | Loop tick / time-based | Live chat turn |
| Substrate | `relationship_event` + genome | `learned_facts` Postgres table |
| Tool | (channel adapter) | `learn_fact` chat tool + voice rubric |
| Voice gating | At generation | Soft-block synchronous, hard-block async |
| Goal | Reach out with memory | Remember what you heard |

Both compound the same audience relationship. They are two halves of one underlying primitive. v0.2 is likely to recognize this in its data model (one `relationship` aggregate, two write-paths) but does not yet — that determination waits for the second outreach impl + a second compounding-intel impl.

The convention captured in `spirit/conventions/compounding-intel-v1.md` (egress complement to ADR-010 Memory Primitive) is the early formalization of this shape on the chat side.

---

## F. What v0.2 is shaped to absorb

This is a **target list**, not a commitment. Items move into v0.2 only after they have proven themselves in two impls. Roughly ordered by extraction-readiness — items 1-4 are already pressure-tested in SOLIENNE production and don't force autonomy on adopters; items 5-9 require a second impl (MERIAN) to clarify their shape.

1. **SurfaceContactProposalInput envelope.** SOLIENNE's typed I/O for proposals before they go to operator review. Lives in `lib/outbound/types.ts`. PR #8 adapter merged 2026-05-03 (commit `2d771eb9`). Likely first-extract target.
2. **Status taxonomy (proposal-state enum).** The current SOLIENNE enum is `draft | queued | claimed | sent | blocked | rejected | superseded` — that's the lifecycle of a proposal as it moves through the control plane. **Outcome states** (`landed`, `evaluated`, `replied`, etc.) are a separate axis layered on top once Rupture 4 has a defined metric. v0.2 should absorb the proposal-state enum first; outcome states wait for Codex's outcome-metric definition (sub-goal 1).
3. **Operator-review queue + admin UI shape.** Even a "fully autonomous" loop ships with a human-in-the-loop drawer for the first cohorts. `app/admin/outbound/page.tsx` + `app/api/outbound/list/route.ts` are the SOLIENNE shape. Pressure-tested locally; doesn't force autonomy on adopters who want the queue without the loop.
4. **Queue observability primitive.** `codex/auto-outreach-observability-guardrail` branch (local-only on M5, tests 9/0 passing, awaiting push approval) — first piece of the substrate dashboard (sub-goal 4). May land as the next merge after observability gets reviewed. Same logic as #3: pressure-tested + non-coercive.
5. **Decision/audit envelope.** A durable record of *why* a proposal was made, *who or what* approved it, *which gates ran*, *what was refused*, and *why*. Some of this lives in #1 (envelope) and #4 (queue observability) already, but it deserves explicit naming because it is what makes operator review portable across agents — and it is the substrate Spirit's on-chain provenance layer eventually anchors to.
6. **Outcome-conditioned mutator: interface + event requirements first, policy later.** Currently hand-tuned. Codex sub-goal 2 (weeks 2-4). v0.2 should absorb the *interface contract* (mutator signature, event vocabulary, genome-write protocol) — not the policy. Mutation policy waits for SOLIENNE + MERIAN to produce two weeks of outcome data each; extracting policy before then bakes in SOLIENNE-specific dynamics.
7. **Cross-surface identity resolver — contract, not store (Rupture 5).** Both SOLIENNE (email + encounter) and MERIAN (Telegram + booth) need this. v0.2 ships the **resolver contract** — the typed shape of "given a contact across channel A and B, does the system see one person or two?" — not a hosted identity store. The store stays agent-side; only the contract generalizes (consistent with §G).
8. **Channel adapter contract.** Resend (SOLIENNE), Twilio/A2P (GOTHAM), Telegram Bot (MERIAN). The contract — not the adapters themselves.
9. **Channel-aware safety layer.** v0.1's `guardrails.ts` covers cooldown, 1+1 cap, bounce halt, dead-man. v0.2 promotes **consent / opt-out / bounce semantics** to first-class concerns alongside rate limits — every channel has them, every channel handles them differently (CAN-SPAM unsubscribe vs A2P 10DLC STOP/HELP vs Telegram block-and-leave), and the abstraction must hold all three without coupling. Channel-specific extensions (SMS opt-out parsing + geo-gate, Telegram group-vs-DM context) are extension points, not the core.

**Risk Codex flagged 2026-05-05:** premature SDK abstraction while SOLIENNE is still carrying production-specific gates, venue timing, and operator-review constraints. The 2-impl-before-extraction discipline (and the post-TGE timing) is the answer to this risk. Items 1-4 are most defensible against this risk because they are already pressure-tested locally; items 5-9 are explicitly held until MERIAN produces a second shape to triangulate against.

---

## G. What v0.2 is **not** shaped to absorb (yet)

- **Hosted DB / queue / UI.** This stays a substrate. Each agent owns its own infra.
- **Hosted cross-surface identity store.** The *resolver contract* lands in v0.2 (§F #7); the actual identity store — wherever the canonical `(channel, channel_id) → person_id` rows live — stays agent-side. Same discipline as DB / queue / UI: contract generalizes, store does not.
- **Channel adapters themselves.** Adapter *contracts* land in v0.2. Concrete adapters stay agent-side until/unless three agents need the same one.
- **Outcome mutation policy.** The *interface* lands in v0.2 (§F #6); the policy that decides which genome parameters to nudge in response to which outcomes waits for two impls' worth of data.
- **LLM-provider abstraction.** Agents pick their own model and prompt style. Synthesis prompts in v0.1 are scaffolds, not norms.
- **Compliance modules.** TCPA, GDPR, A2P 10DLC are vertical-shaped. The safety layer hooks them in; it does not implement them.

---

## H. Relationship to Spirit Protocol

[Spirit Protocol](https://spiritprotocol.io) sits **above** this substrate:

- **Legal personhood** (Wyoming DUNA + Nevada Series LLC) — the entity an agent's outreach is from.
- **On-chain provenance** — receipts of what was said, what was promised, what was sent.
- **Opt-in genome federation** — agents in the fleet can share what's working, if they choose.
- **Sovereignty guarantees** — the agent owns its relationship graph. It is portable across deployers.

You can ship an agent on `@spirit/agentic-crm` without joining Spirit. Or you can join the fleet and inherit the coordination layer. Both paths stay open.

---

*Last updated: 2026-05-05. Update §F when v0.2 scope is set; update §D when production paths move.*
