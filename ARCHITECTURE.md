# Architecture — @spirit/agentic-crm

> What's in v0.1, where the production source-of-truth lives, and what v0.2 is shaped to absorb.

---

## A. The frame: Five Ruptures of Agent Memory

Every agent that tries to meet the same person twice fails in the same five places. These are not model problems. They are not solved by a better LLM. They are **structural** — and they are what this repo tries to make visible and cheap to close.

| # | Rupture | Question it answers |
|---|---|---|
| 1 | **Extraction** | Did the touchpoint become an event the system can reason over? |
| 2 | **Synthesis** | Did the events become understanding the next prompt can use? |
| 3 | **Retrieval** | Did the understanding actually reach the next outbound? |
| 4 | **Evaluation** | Is the system learning from landings (replies, RSVPs, purchases), not sends? |
| 5 | **Cross-surface** | When the same person shows up on email + SMS + encounter, do the channels resolve to one identity? |

If any of the five fail, the second conversation is a re-introduction. **Closing all five is the substrate.** Everything in this repo, and everything we lift into v0.2, is in service of one of those five.

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
│   └── guardrails.ts      # cooldown, 1+1 cap, bounce halt, dead-man — orthogonal to ruptures
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

This is a **target list**, not a commitment. Items move into v0.2 only after they have proven themselves in two impls.

1. **SurfaceContactProposalInput envelope.** SOLIENNE's typed I/O for proposals before they go to operator review. Lives in `lib/outbound/types.ts`. PR #8 adapter merged 2026-05-03 (commit `2d771eb9`). Likely first-extract target.
2. **Status taxonomy.** The lifecycle of an outreach proposal (draft → reviewed → queued → sent → landed → evaluated). PR #8 enum is the working version.
3. **Operator-review queue + admin UI shape.** Even a "fully autonomous" loop ships with a human-in-the-loop drawer for the first cohorts. `app/admin/outbound/page.tsx` + `app/api/outbound/list/route.ts` are the SOLIENNE shape.
4. **Queue observability primitive.** `codex/auto-outreach-observability-guardrail` branch (local-only on M5, tests 9/0 passing, awaiting push approval) — first piece of the substrate dashboard (sub-goal 4). May land as the next merge after observability gets reviewed.
5. **Outcome-conditioned genome mutation.** Currently hand-tuned. Codex sub-goal 2 (weeks 2-4). Not started yet. v0.2 should ship the mutator interface even if the policies are still agent-specific.
6. **Cross-surface identity resolver (Rupture 5).** Both SOLIENNE (email + encounter) and MERIAN (Telegram + booth) need this. v0.2's biggest scope addition.
7. **Channel adapter contract.** Resend (SOLIENNE), Twilio/A2P (GOTHAM), Telegram Bot (MERIAN). The contract — not the adapters themselves.
8. **Safety layer extensions.** v0.1's `guardrails.ts` covers cooldown, 1+1 cap, bounce halt, dead-man. SMS adds opt-out parsing + geo-gate. Telegram adds rate limits + group-vs-DM context. v0.2's safety layer needs to be channel-aware without being channel-coupled.

**Risk Codex flagged 2026-05-05:** premature SDK abstraction while SOLIENNE is still carrying production-specific gates, venue timing, and operator-review constraints. The 2-impl-before-extraction discipline (and the post-TGE timing) is the answer to this risk.

---

## G. What v0.2 is **not** shaped to absorb (yet)

- **Hosted DB / queue / UI.** This stays a substrate. Each agent owns its own infra.
- **Channel adapters themselves.** Adapter *contracts* land in v0.2. Concrete adapters stay agent-side until/unless three agents need the same one.
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
