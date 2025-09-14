// lib/spacedRepetition/lib/calculateRisk.ts

/**
 * Calculate forgetting risk (0-1, higher = more likely forgotten)
 */
export function calculateRisk(stability: number, daysSinceReview: number, beta: number): number {
  if (daysSinceReview <= 0) return 0;
  return 1 - Math.exp(-Math.pow(daysSinceReview / stability, beta));
}