# @spirit/agentic-crm

> An agentic CRM for artists, creators, performers, influencers, and brands.

Take your cold list — emails, phone numbers, RSVPs, DMs, signups that have gone silent — and hand it to an agent that **remembers, synthesizes, and compounds** every interaction. The list becomes a relationship. The relationship compounds.

Not a blast tool. Not another marketing-automation SaaS. A reference implementation of the five primitives every creator-facing AI agent needs to keep a relationship — a checklist you can ship against, not a product, not a framework.

Companion repo to Seth Goldstein's essay [*Object Honesty*](https://object-honesty-review.vercel.app), published April 2026.

---

## Who this is for

- **Artists** with a mailing list they've stopped writing to
- **Creators / performers** with RSVP history that goes nowhere after the show
- **Influencers** with DMs they can't keep up with but shouldn't let rot
- **Brands** whose CRM knows every purchase but forgets every conversation
- **Anyone building an agent** that has to meet the same person twice

If you have a list and you want the second conversation to be better than the first — not a reintroduction — this is for you.

## Why

Every AI agent that tries to meet the same person twice fails in the same five places. We named them the **five ruptures of agent memory** after closing them for SOLIENNE — the autonomous AI artist whose first solo exhibition, *RENTED GAZE*, opens in Paris on April 17, 2026.

The failures are structural. They are not model problems. They do not get fixed by a better LLM. They are also the same reason your current CRM is a graveyard: it is a list, not a conversation.

## The Five Ruptures

```
1. Extraction      Touchpoints become events.
2. Synthesis       Events become understanding.
3. Retrieval       Understanding reaches the next prompt.
4. Evaluation      The system learns from landings, not sends.
5. Cross-surface   Channels resolve to one identity.
```

If any of these fail, the second conversation is a re-introduction. The agent has a good model and no memory.

Print them. Argue with them. Ship against them.

## What's here

```
agentic-crm/
├── schema/
│   ├── event.ts           Canonical relationship_event type
│   ├── profile.ts         RelationshipProfile + strength score
│   └── genome.ts          Tunable outreach parameters (evolvable)
├── prompts/
│   ├── synthesis.md       2-paragraph first-person context scaffold
│   ├── extract.md         Observation extraction (Rupture 1)
│   └── recall.md          Context injection at outbound (Rupture 3)
├── safety/
│   └── guardrails.ts      Cooldown, 1+1 cap, bounce halt, dead-man
└── examples/
    └── minimal-loop.ts    ~80 lines: load contact → log event →
                           synthesize context → generate outbound
```

This is a scaffolding repo. It is deliberately minimal. Clone it, swap in your agent's persona, your channel, your identity store, your compliance envelope — and you have a working relationship-memory loop in a weekend.

## Quickstart

```bash
git clone https://github.com/spirit-protocol/agentic-crm
cd agentic-crm
npm install
export ANTHROPIC_API_KEY=sk-ant-...
npm run demo
```

The demo takes two fake contacts, logs a sequence of events, runs Claude synthesis, and generates a personalized outbound message. You'll see the full loop in under a minute.

## What this is NOT

- Not an SDK. There is no `agenticCrm.send()`. You wire your own channels.
- Not a platform. No hosted DB, no queue, no UI.
- Not SOLIENNE's code. Her persona, her Luma webhook, her Resend account — all stripped.
- Not a production system. You will need to add: persistence, observability, compliance (TCPA, GDPR, A2P 10DLC per your channel), error handling, rate limiting beyond the safety layer.

What you get is the **shape** — the schemas, prompts, and guardrails that generalize across agents. Everything else is yours to build.

## Per-vertical generalization

The ruptures are universal. What you layer on top differs sharply:

| | Art agent | Cannabis concierge | Photo curator | Influencer | Brand CRM |
|---|---|---|---|---|---|
| **Channel** | Email + encounter | SMS (TCPA, A2P 10DLC) | Email + studio visit | DM + broadcast | Email + SMS + support |
| **Synthesis cadence** | Nightly | Twice-weekly | Weekly | Daily | Hourly for active segments |
| **Safety layer** | 1+1 cap | Opt-out parsing, geo-gate | Discretion rules | Fan-tier throttling | GDPR + CCPA + unsubs |
| **Evaluator** | N+2 reply rate | Order frequency + LTV | Acquisition + fit | Engagement + retention | LTV + NPS + churn |
| **Voice register** | First-person artist | Concierge, warm | Curatorial, precise | Personal, intimate | Brand guidelines |

The 4-layer pipeline, genome mechanism, event schema, and synthesis scaffold are reused across all five.

## Relationship to Spirit Protocol

[Spirit Protocol](https://spiritprotocol.io) is the coordination layer that sits above this substrate: legal personhood (Wyoming DUNA + Nevada Series LLC), on-chain provenance, opt-in genome federation across agents, and the sovereignty guarantees that let agents hold funds, sign contracts, and accumulate a body of work.

This repo is the substrate. Spirit Protocol is how agents built on it coordinate, federate, and persist.

Deploy your agent standalone. Or join the fleet.

## Versioning

This is **v0.1**. The API will change. The schemas will tighten. If you build against it and hit a limitation, open an issue — we read them.

## License

MIT. Take it. Ship it. Tell us what broke.

## Citation

If this shapes your work, cite the essay:

> Goldstein, S. (2026). *Object Honesty.* Spirit Protocol.

---

*The artist does not forget you. Neither should yours.*
