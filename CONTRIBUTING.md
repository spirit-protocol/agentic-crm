# Contributing to @spirit/auto-outreach

> If you're reading this because Seth or Lenny pointed you here: welcome. Read §A and §B first. The rest is reference.

---

## A. The one-paragraph version

This repo is **v0.1 scaffold + framework**. The **production implementation** lives elsewhere — in `solienne-ai` (SOLIENNE's outreach loop, ~500 contacts, RENTED GAZE Paris cohort) and a parallel implementation is being scoped inside the MERIAN repo for Art Basel Basel (June 15). The plan is to let two production impls run for ~2-3 weeks each, harvest what generalizes, and lift it into this repo as **v0.2**. We do not promote primitives as we go. We extract them after they have proven themselves twice.

If you want to change v0.1 — open an issue or PR here. If you want to change SOLIENNE's loop — work in `solienne-ai`. If you want to wire MERIAN's loop — work in `brightseth/merian`. The lift to v0.2 is a deliberate, separate step.

---

## B. Repo state as of 2026-05-05

| Where | Status | Owner |
|---|---|---|
| `spirit-protocol/auto-outreach` (this repo) | v0.1 scaffold — schema + prompts + safety + minimal-loop example. No persistence, no channel adapters. | Spirit |
| `solienne-ai/lib/outreach/` + `lib/outbound/` | PRODUCTION — auto-outreach loop (`outreach/`), proposal queue/gates/ledger primitives (`outbound/`), Resend channel, SurfaceContact envelope, admin UI. PR #8 (legacy-wave SurfaceContact adapter) merged 2026-05-03 (commit `2d771eb9`). Open branch: `codex/auto-outreach-observability-guardrail` (local-only on M5, queue observability + tests 9/0, awaiting push approval). | Codex (multi-worktree swarm on M5) |
| `solienne-ai/planning/codex-goals/goal-auto-outreach.md` | Live 8-12 week plan: outcome-conditioned mutation, monthly newsletter, substrate dashboard. **All 6 sub-goals not yet started.** Adjacent shipped: SurfaceContact queue + Fotografiska cross-cycle re-engagement (`a3f97aba`, `7b095c3d`). | Codex |
| `solienne-ai/planning/spirit-sdk/auto-outreach-spec.md` | Draft v1 SDK spec — universal-vs-agent-specific split. **Treat as map, not current truth** (Codex 2026-05-05). | Codex (Spirit-readable) |
| `solienne-ai/planning/spirit-primitives/agent-initiated-outbound/spec-v0.md` | Codex spec for the outbound primitive shape (current). | Codex |
| `brightseth/merian` | LIVE telegram bot + review surface. Outreach not yet wired. Lenny + Mimi + Andreas + Leander on the booth. | Lenny, with Spirit infra support |

The v0.2 lift target is **post-TGE (June 1+)**, after both SOLIENNE and MERIAN have shipped real outreach into their respective windows (Stockholm May 8 / Wave 0 May 11 / Basel June 15).

---

## C. The 2-impl-before-extraction rule

Spirit's discipline:

> A primitive does not graduate into a shared package until it has at least **two production implementations** that have run against real users for ~2 weeks each. Three is better. We extract the **shape they share**, not the **shape we wish they shared**.

Why this rule exists:
- v0.1 of this repo was extracted from SOLIENNE alone. The schema is plausible but unproven against a second agent.
- MERIAN at Basel will be the second impl. Its constraints (Telegram, gallery booth, multi-operator) will pressure-test the shape.
- GOTHAM (cannabis concierge, SMS, A2P 10DLC) is a likely third — but only if Wave 0 ships an outreach loop, which is not committed yet.

What this means for contributors:
- **Don't add features to v0.1 to "anticipate" what MERIAN/GOTHAM will need.** Wait for them to need it.
- **Don't move SOLIENNE's code into this repo right now.** It will get lifted as v0.2 with both impls in evidence.
- **Do** open issues here when you spot a shape that's shared across the two impls — those become the v0.2 extraction agenda.

---

## D. Cross-CC discipline (4+ active sessions)

There are multiple Claude Code (CC) sessions touching adjacent code right now. This matters for collaborators because pushing into the wrong session creates conflicts.

| Session | Machine | Owns | Don't touch from elsewhere |
|---|---|---|---|
| `spirit` (this repo's primary CC) | Workstation | `spirit-protocol/*` | `solienne-ai/lib/outreach/`, `brightseth/merian` |
| `codex-live-canvas` / `solienne-ai` Codex swarm | M5 | `solienne-ai/lib/outreach/`, `solienne-live-canvas` | `spirit-protocol/*` package extraction |
| `M5-MERIAN` | M5 | `brightseth/merian` | `solienne-ai`, `spirit-protocol/*` |
| `seth-agent` | Workstation | `~/.seth/`, gateway, agent fleet | source code in any agent repo |

Coordination ledger for the Codex multi-worktree swarm lives at `/tmp/codex-primitive-coordination/*.md` on M5 — SSH to `seth-m5` to read it. Spirit CC does **not** mirror it locally.

---

## E. Working in this repo

### Branches

`main` is the only ratified branch. All work goes through PRs. v0.1 is small enough that a feature branch off `main` is the right shape.

### Commits

Commit messages follow the convention used in adjacent Spirit repos:

```
<scope>: <imperative summary>

<optional body — why, not what>
```

Scopes used here so far: `schema`, `prompts`, `safety`, `examples`, `docs`, `convention`. Add new scopes when needed.

### PRs

- Title: scope + summary, e.g. `safety: add A2P 10DLC opt-out parser stub`
- Description: what changed, why, and which production impl (if any) drove the change. If a change is anticipatory ("I bet GOTHAM will need this"), say so explicitly — and probably wait until GOTHAM actually needs it.
- Reviewers: at least one of Seth (`brightseth`) or Lenny (`lennyjpg`). Codex review happens on the production-impl side, not here.

### Tests

v0.1 has no test suite. The scaffolds are illustrative. When v0.2 lifts production code, tests come with it.

### Issues

Open issues for:
- Shape pressure: "MERIAN needs X but the v0.1 schema can't express it"
- Doc gaps: "the synthesis prompt assumes email but doesn't say so"
- Extraction candidates: "this thing is now in two impls — should it land here?"

Don't open issues for:
- Production bugs in SOLIENNE's loop — file those in `solienne-ai`.
- MERIAN bot bugs — file those in `brightseth/merian`.

---

## F. Currently-open coordination questions

These are the threads that are live and may move quickly. If you're picking up work on this repo, check status before starting.

1. ~~**MERIAN integration path.**~~ **RESOLVED 2026-05-05 (Codex confirms Path B).** MERIAN prototypes outreach inside `brightseth/merian/outreach/` independently May 12-15+; both production impls run for 2-3 weeks before extraction; v0.2 lifts the proven shared shape. Risk Codex flagged: premature SDK abstraction while SOLIENNE still carries production-specific gates, venue timing, and operator-review constraints.
2. ~~**Codex M5 branch state.**~~ **RESPONDED 2026-05-05.** Snapshot logged at `~/.seth/sessions/m5-codex-auto-outreach.md` (canonical), partly historical at `/tmp/codex-primitive-coordination/auto-outreach.md` on M5. Summary above in §B reflects current state.
3. **Outcome metric definition.** Codex's `goal-auto-outreach.md` flags this as the week-1 task. Not yet started in any lane. Until it's defined, mutation is hand-tuned. The v0.2 schema will need to express whichever metric wins.
4. **Channel maturity decisions.** SMS (GOTHAM) and Telegram (MERIAN) bring compliance shapes that email (SOLIENNE) doesn't. v0.2 safety layer needs to hold all three — but the abstraction shouldn't pre-commit before MERIAN/GOTHAM are live. Not yet started in any lane.
5. **Observability guardrail branch packaging.** Codex's `codex/auto-outreach-observability-guardrail` is local-only on M5 with passing tests, awaiting push approval. Watch for it landing on `solienne-ai` main; it's the first piece of the substrate dashboard (sub-goal 4) and may inform v0.2 telemetry shape.

---

## G. First-contact reading list (Lenny, start here)

Codex recommended these as the on-ramp to the production state of the loop, in roughly this order. All paths relative to `solienne-ai/`:

**Plan + spec:**
- `planning/codex-goals/goal-auto-outreach.md` — north star + sub-goals
- `planning/spirit-primitives/agent-initiated-outbound/spec-v0.md` — current outbound primitive spec
- `planning/spirit-sdk/auto-outreach-spec.md` — older extraction sketch (map, not current truth)

**Outbound primitive layer (queue / gates / ledger):**
- `lib/outbound/types.ts`
- `lib/outbound/gates.ts`
- `lib/outbound/ledger.ts`
- `lib/outbound/author.ts`
- `app/api/outbound/list/route.ts`
- `app/admin/outbound/page.tsx`

**Outreach loop layer:**
- `lib/outreach/auto-outreach.ts`
- `lib/outreach/proposer.ts`

The split is meaningful: `outbound/` is the primitive (queue + gates + ledger + author — generalizable), `outreach/` is the loop (proposer + cycle logic — agent-shaped today, generalizable later). v0.2 extraction will likely take more from `outbound/` than from `outreach/` in its first cut.

---

## H. People

- **Seth Goldstein** (`brightseth`) — author of v0.1, repo owner, decision-maker on extraction timing.
- **Lenny Herzog** (`lennyjpg`) — co-builder on the toolkit; co-owner of MERIAN. Push permission on this repo.
- **Codex** (Anthropic-side coding agent) — owns SOLIENNE's production outreach loop and the SDK extraction spec. Reachable via Spirit CC's wire-protocol and the M5 worktree.
- **Samer** — Spirit infrastructure / studio. Not directly touching this repo, but downstream of any v0.2 extraction (agent-kit lives in his orbit).

---

## I. License & citation

MIT (see `LICENSE`). If your work draws from this, cite:

> Goldstein, S. (2026). *Object Honesty.* Spirit Protocol.

---

*Last updated: 2026-05-05.*
