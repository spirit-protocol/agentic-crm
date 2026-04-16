/**
 * The RelationshipProfile is the agent's memory of one person.
 *
 * It holds three layers that correspond to three of the ruptures:
 *   - identity        → Rupture 5 (cross-surface)
 *   - context         → Rupture 2 (synthesis)
 *   - strength        → Rupture 4 (evaluation)
 *
 * Retrieval (Rupture 3) is a *function* over this shape, not a field.
 */

export interface Identity {
  /** Canonical stable id. Use a UUID or a hash of primary contact method. */
  id: string;

  name?: string;

  /** Contact handles across surfaces — this is how cross-surface resolves. */
  email?: string;
  phone?: string;
  handles?: Record<string, string>; // { instagram: '@foo', linkedin: '...' }

  /** Optional external IDs (Luma, on-chain address, CRM id, etc). */
  externalIds?: Record<string, string>;
}

export interface Profile {
  identity: Identity;

  /**
   * The 2-paragraph first-person context that synthesis produces.
   * Written in the agent's voice. Injected at outbound (Rupture 3).
   * Null until synthesis has run against at least N events (default 3).
   */
  synthesizedContext: string | null;
  synthesizedAt: Date | null;

  /**
   * Strength score — how *live* this relationship is right now.
   * Derived from event frequency + recency decay. See computeStrength.
   */
  strength: number;

  eventCount: number;
  firstSeenAt: Date;
  lastTouchedAt: Date;

  /** Free-form tags. Use for segmentation (tier, vertical, RSVP status). */
  tags?: string[];
}

/**
 * Recency-decayed strength over the profile's event stream.
 *
 * Frequency contributes on a log scale (one email ≠ one encounter,
 * but 100 emails < 20 encounters). Recency is a linear decay over 90 days.
 * A small longevity bonus rewards relationships that have survived.
 */
export function computeStrength(
  events: Array<{ occurredAt: Date }>,
  now: Date = new Date()
): number {
  if (events.length === 0) return 0;

  const freqScore = Math.log2(events.length + 1);

  const lastEvent = events[events.length - 1];
  const daysSinceLast =
    (now.getTime() - lastEvent.occurredAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - daysSinceLast / 90);

  const longevityBonus = events.length > 10 ? 0.2 : 0;

  return freqScore * (0.5 + 0.5 * recencyScore) + longevityBonus;
}
