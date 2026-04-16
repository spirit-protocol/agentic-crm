/**
 * The genome is the set of tunable parameters that shape outbound behavior.
 *
 * Relates to Rupture 4 (evaluation): you want to observe which genome
 * settings produce better *landings* (replies, conversions, attendance) and
 * mutate toward success. Start with DEFAULT_PARAMS, measure, evolve.
 *
 * Do not evolve on sends. Evolve on landings — open rate, reply rate,
 * N+2 reply rate, event conversion. Send-rate optimization is a trap.
 */

export interface GenomeParams {
  /** How many contacts per batch. 1–10 is a sane range. */
  batchSize: number;

  /** Hour of day (UTC) to send. 9 works for western Europe morning. */
  sendHourUTC: number;

  /**
   * Tone warmth, 0.0–1.0. Higher = more personal, more risk of overreach.
   * Most implementations map this to LLM temperature.
   */
  toneWarmth: number;

  /** Days to wait before a reminder on an unanswered message. */
  followUpDays: number;

  /** Hard daily cap across all contacts. Deliverability matters more than speed. */
  maxDailyMessages: number;

  /**
   * Autonomy level:
   *   1 = human approves every send
   *   2 = agent sends, human can veto before dispatch
   *   3 = agent sends fully autonomously (with safety guardrails)
   */
  autonomyPhase: 1 | 2 | 3;

  /** How many batches fire per cron tick. Default 1. */
  batchesPerRun: number;
}

export const DEFAULT_PARAMS: GenomeParams = {
  batchSize: 5,
  sendHourUTC: 9,
  toneWarmth: 0.6,
  followUpDays: 7,
  maxDailyMessages: 50,
  autonomyPhase: 1,
  batchesPerRun: 1,
};

export interface Genome {
  id: string;
  params: GenomeParams;

  /** Monotonic counter — increment on each mutation. */
  generation: number;

  /**
   * The last evaluator score against this genome. Used by proposeMutation
   * to decide whether to step toward or away from a direction.
   */
  lastEvalScore: number | null;

  updatedAt: Date;
}
