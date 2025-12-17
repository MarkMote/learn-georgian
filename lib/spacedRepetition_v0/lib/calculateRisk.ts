// lib/spacedRepetition/lib/calculateRisk.ts

/**
 * Calculate forgetting risk (0-1, higher = more likely forgotten)
 */
export function calculateRisk(stability: number, daysSinceReview: number, beta: number): number {
  if (daysSinceReview < 0) return 0;
  if (daysSinceReview === 0) return 1.0; // New cards have 100% risk (need to be learned)
  return 1 - Math.exp(-Math.pow(daysSinceReview / stability, beta));
}