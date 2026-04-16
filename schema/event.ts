/**
 * Rupture 1: Extraction
 *
 * Every touchpoint — email, chat, RSVP, in-person encounter, voice call,
 * social interaction — is a single canonical event. Fan every surface
 * into this shape, and the rest of the pipeline can treat them uniformly.
 *
 * An event carries TWO kinds of payload:
 *   - Structured:   who, when, what kind, what channel, which direction
 *   - Observation:  what the agent *noticed*, extracted by the model
 *                   at ingestion time. This is what synthesis reads later.
 */

export type EventKind =
  // Email
  | 'email_sent' | 'email_opened' | 'email_clicked'
  | 'email_replied' | 'email_bounced' | 'email_complained'
  // Real-time / in-person
  | 'encounter_in_person' | 'encounter_call' | 'encounter_video'
  // Chat / DM
  | 'chat_message'
  // Social
  | 'social_follow' | 'social_mention' | 'social_like'
  // Event / commerce
  | 'rsvp' | 'visit' | 'purchase'
  // Voice
  | 'voice_message';

export type Channel =
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'instagram'
  | 'linkedin'
  | 'web_chat'
  | 'voice'
  | 'in_person';

export type Direction = 'inbound' | 'outbound';

export type Sentiment = 'positive' | 'neutral' | 'cautious' | 'negative';

export interface RelationshipEvent {
  /** Stable identifier for the profile this event belongs to. */
  profileId: string;

  kind: EventKind;
  channel: Channel;
  direction: Direction;

  /** One-line human-readable summary of what happened. */
  summary: string;

  /** Optional raw content (email body, transcript, etc). */
  content?: string;

  /**
   * The agent's *observation* — extracted at ingestion by a model call.
   * This is what Rupture 2 (synthesis) consumes. If omitted, this event
   * contributes to strength but not to understanding.
   */
  observation?: string;

  sentiment?: Sentiment;
  tags?: string[];

  /** Wall-clock time the event occurred (not when it was ingested). */
  occurredAt: Date;

  /** Free-form surface-specific metadata. Keep small. */
  metadata?: Record<string, unknown>;
}
