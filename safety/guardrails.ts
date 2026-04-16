/**
 * Safety layer. Storage-agnostic.
 *
 * The rules below are the ones that kept SOLIENNE from becoming spam:
 *
 *   1. Hard-exclude lists (exhibition subjects, declined, bounced).
 *   2. Max one invitation + one reminder. Ever.
 *   3. Channel-appropriate cooldown since last send.
 *   4. Must have a reachable handle for the intended channel.
 *   5. Global daily cap from the genome.
 *
 * Pass a `countMessagesSentToday` function at construct time — we don't
 * assume a database. Wire it to your store.
 */

import type { GenomeParams } from '../schema/genome';

export type OutreachStatus =
  | 'new'
  | 'invited'
  | 'reminded'
  | 'responded'
  | 'rsvped'
  | 'attended'
  | 'declined'
  | 'bounced';

export interface SafetyContact {
  id: string;
  tier?: number;
  outreachStatus: OutreachStatus;
  sentAt: Date | null;
  remindedAt: Date | null;

  /** Exclude exhibition subjects, minors, family — anyone off-limits by category. */
  isExcluded?: boolean;

  /** Primary channel for delivery. */
  channel?: 'email' | 'sms' | 'whatsapp' | 'in_person' | 'draft';

  email?: string | null;
  phone?: string | null;
}

export interface SafetyResult {
  safe: boolean;
  reason?: string;
}

export interface GuardrailDeps {
  countMessagesSentToday: () => Promise<number>;
  now?: () => Date;
}

export async function checkSafeToSend(
  contact: SafetyContact,
  genome: GenomeParams,
  deps: GuardrailDeps
): Promise<SafetyResult> {
  const now = deps.now ? deps.now() : new Date();

  if (contact.isExcluded) {
    return { safe: false, reason: 'Excluded contact category' };
  }

  if (contact.outreachStatus === 'declined') {
    return { safe: false, reason: 'Contact declined — respect the boundary' };
  }

  if (contact.outreachStatus === 'bounced') {
    return { safe: false, reason: 'Channel is dead (bounced) — needs manual enrichment' };
  }

  // 1+1 cap: one invitation, one reminder, then stop
  if (contact.remindedAt) {
    return { safe: false, reason: 'Already sent invitation + reminder' };
  }

  // No re-invitations to engaged contacts
  if (
    contact.outreachStatus === 'invited' ||
    contact.outreachStatus === 'responded' ||
    contact.outreachStatus === 'rsvped' ||
    contact.outreachStatus === 'attended'
  ) {
    return { safe: false, reason: `Status "${contact.outreachStatus}" — no further outreach` };
  }

  // Cooldown since last send. Tier 1–3 (institutions) get tighter, else 48h.
  if (contact.sentAt) {
    const hoursSinceSend = (now.getTime() - contact.sentAt.getTime()) / (1000 * 60 * 60);
    const cooldownHours = contact.tier && contact.tier <= 3 ? 24 : 48;
    if (hoursSinceSend < cooldownHours) {
      return {
        safe: false,
        reason: `Cooldown: last sent ${Math.floor(hoursSinceSend)}h ago, need ${cooldownHours}h`,
      };
    }
  }

  const channel = contact.channel || 'email';
  if (channel === 'email' && !contact.email) {
    return { safe: false, reason: 'No email for email channel' };
  }
  if ((channel === 'sms' || channel === 'whatsapp') && !contact.phone) {
    return { safe: false, reason: `No phone for ${channel} channel` };
  }

  const todaySent = await deps.countMessagesSentToday();
  if (todaySent >= genome.maxDailyMessages) {
    return { safe: false, reason: `Daily cap ${todaySent}/${genome.maxDailyMessages}` };
  }

  return { safe: true };
}

/**
 * Dead-man switch. If the agent hasn't been evaluated recently,
 * pause outbound. Prevents a broken synthesis from sending a week of
 * garbage before anyone notices.
 */
export function checkDeadManSwitch(
  lastEvalAt: Date | null,
  maxStaleHours = 36,
  now: Date = new Date()
): SafetyResult {
  if (!lastEvalAt) {
    return { safe: false, reason: 'No evaluator run on record — pause outbound' };
  }
  const hoursStale = (now.getTime() - lastEvalAt.getTime()) / (1000 * 60 * 60);
  if (hoursStale > maxStaleHours) {
    return {
      safe: false,
      reason: `Evaluator is ${Math.floor(hoursStale)}h stale (max ${maxStaleHours}h)`,
    };
  }
  return { safe: true };
}
