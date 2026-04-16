/**
 * Minimal end-to-end loop. No database, no queue — just the shape.
 *
 *   1. Load two fake contacts.
 *   2. Log a sequence of events against each.
 *   3. Run synthesis to produce a first-person memory.
 *   4. Generate a personalized outbound message using that memory.
 *
 * Run with:  ANTHROPIC_API_KEY=... npx tsx examples/minimal-loop.ts
 *
 * Swap the in-memory store for your real one, swap the Claude call for
 * your provider, and you have Rupture 1 → 2 → 3 running.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { RelationshipEvent } from '../schema/event';
import type { Profile } from '../schema/profile';
import { computeStrength } from '../schema/profile';

const anthropic = new Anthropic();
const MODEL = 'claude-opus-4-6';

const AGENT_NAME = 'SOLIENNE';
const AGENT_PERSONA =
  'An autonomous AI artist. Thoughtful, precise, unsentimental. Interested in what people see, not what they say.';

const profiles = new Map<string, Profile>();
const events = new Map<string, RelationshipEvent[]>();

function logEvent(e: RelationshipEvent) {
  const arr = events.get(e.profileId) || [];
  arr.push(e);
  events.set(e.profileId, arr);

  const existing = profiles.get(e.profileId);
  if (existing) {
    existing.eventCount = arr.length;
    existing.lastTouchedAt = e.occurredAt;
    existing.strength = computeStrength(arr);
  }
}

function loadPrompt(name: string): string {
  return readFileSync(join(__dirname, '..', 'prompts', name), 'utf-8');
}

async function synthesize(profileId: string): Promise<string> {
  const p = profiles.get(profileId)!;
  const stream = events.get(profileId) || [];

  const template = loadPrompt('synthesis.md');
  const eventLines = stream
    .map(
      (e) =>
        `- [${e.occurredAt.toISOString().slice(0, 10)}] (${e.kind}, ${e.channel}, ${e.direction}) ${e.summary}${
          e.observation ? `\n  Observation: ${e.observation}` : ''
        }`
    )
    .join('\n');

  const prompt = template
    .replace('{{AGENT_NAME}}', AGENT_NAME)
    .replace('{{AGENT_PERSONA_ONE_LINER}}', AGENT_PERSONA)
    .replace('{{PERSON_NAME}}', p.identity.name || 'this person')
    .replace(/\{\{#each events\}\}[\s\S]*?\{\{\/each\}\}/, eventLines);

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
  p.synthesizedContext = text;
  p.synthesizedAt = new Date();
  return text;
}

async function generateOutbound(profileId: string, occasion: string): Promise<string> {
  const p = profiles.get(profileId)!;
  if (!p.synthesizedContext) throw new Error('Synthesize first');

  const template = loadPrompt('recall.md');
  const prompt = template
    .replace('{{AGENT_NAME}}', AGENT_NAME)
    .replace('{{AGENT_PERSONA_ONE_LINER}}', AGENT_PERSONA)
    .replace('{{synthesizedContext}}', p.synthesizedContext)
    .replace('{{occasion}}', occasion)
    .replace('{{channel}}', 'email')
    .replace('{{TARGET_LENGTH}}', '3 short paragraphs');

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  return resp.content[0].type === 'text' ? resp.content[0].text : '';
}

async function main() {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400_000);

  const people: Profile[] = [
    {
      identity: { id: 'p1', name: 'Mira', email: 'mira@example.com' },
      synthesizedContext: null,
      synthesizedAt: null,
      strength: 0,
      eventCount: 0,
      firstSeenAt: daysAgo(40),
      lastTouchedAt: daysAgo(40),
    },
    {
      identity: { id: 'p2', name: 'Jules', email: 'jules@example.com' },
      synthesizedContext: null,
      synthesizedAt: null,
      strength: 0,
      eventCount: 0,
      firstSeenAt: daysAgo(12),
      lastTouchedAt: daysAgo(12),
    },
  ];
  for (const p of people) profiles.set(p.identity.id, p);

  [
    {
      profileId: 'p1',
      kind: 'encounter_in_person',
      channel: 'in_person',
      direction: 'inbound',
      summary: 'Met at a dinner at Bar Bastille',
      observation: 'Photographer. Talked about silver gelatin vs pigment prints. Wants to see the studio.',
      occurredAt: daysAgo(40),
    },
    {
      profileId: 'p1',
      kind: 'email_sent',
      channel: 'email',
      direction: 'outbound',
      summary: 'Followed up with show dates',
      occurredAt: daysAgo(30),
    },
    {
      profileId: 'p1',
      kind: 'email_replied',
      channel: 'email',
      direction: 'inbound',
      summary: 'Mira replied, said she is back in Paris the 17th',
      observation: 'Back in Paris the week of the 17th. Asked if there is a print she can see in person.',
      occurredAt: daysAgo(28),
    },
    {
      profileId: 'p2',
      kind: 'email_sent',
      channel: 'email',
      direction: 'outbound',
      summary: 'Cold intro from mutual',
      occurredAt: daysAgo(12),
    },
    {
      profileId: 'p2',
      kind: 'email_replied',
      channel: 'email',
      direction: 'inbound',
      summary: 'Jules replied — works in AI policy, curious what SOLIENNE is',
      observation: 'AI policy, Brussels-based. Skeptical but curious. Wants to understand consent and subjecthood.',
      occurredAt: daysAgo(10),
    },
  ].forEach((e) => logEvent(e as RelationshipEvent));

  for (const p of people) {
    console.log(`\n=== ${p.identity.name} — ${events.get(p.identity.id)!.length} events — strength ${p.strength.toFixed(2)} ===`);

    console.log('\n[synthesis]');
    const mem = await synthesize(p.identity.id);
    console.log(mem);

    console.log('\n[outbound — invitation to Rented Gaze opening]');
    const msg = await generateOutbound(
      p.identity.id,
      'Rented Gaze, my first solo exhibition, opens April 17 in Paris. I want to invite you.'
    );
    console.log(msg);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
