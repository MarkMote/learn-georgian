// lib/spacedRepetition/lib/algorithm/lib/forgetting.ts

import { Card, SRSConfig } from '../../../types';

/**
 * Calculate recall probability using exponential decay
 */
export function recallProbability(
  stability: number,
  elapsedSteps: number,
  beta: number
): number {
  const safestability = Math.max(stability, 1e-6);
  return Math.exp(-Math.pow(elapsedSteps / safestability, beta));
}

/**
 * Calculate forgetting risk for a card
 */
export function forgettingRisk<T>(
  card: Card<T>,
  currentStep: number,
  config: SRSConfig
): number {
  // New cards have 100% forgetting risk
  if (card.reviewCount === 0) {
    return 1.0;
  }

  const elapsed = Math.max(1, currentStep - card.lastReviewStep);
  return 1 - recallProbability(card.stability, elapsed, config.beta);
}