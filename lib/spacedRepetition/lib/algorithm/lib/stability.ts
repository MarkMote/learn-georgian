// lib/spacedRepetition/lib/algorithm/lib/stability.ts

import { Card, Grade, SRSConfig } from '../../../types';
import { recallProbability } from './forgetting';

/**
 * Calculate new stability after review based on grade
 */
export function updateStability<T>(
  card: Card<T>,
  grade: Grade,
  currentStep: number,
  config: SRSConfig
): number {
  const elapsed = Math.max(1, currentStep - card.lastReviewStep);
  const recall = recallProbability(card.stability, elapsed, config.beta);

  if (grade === 0) {
    // Failed - reduce stability
    const newStability = card.stability * (1 - config.failShrink * recall);
    return Math.max(newStability, config.minStability);
  }

  // Success - increase stability based on grade
  const growthFactor = getGrowthFactor(grade, config);
  const newStability = card.stability * (1 + growthFactor * (1 - recall));
  return Math.max(newStability, card.stability);
}

/**
 * Get growth factor based on grade
 */
function getGrowthFactor(grade: Grade, config: SRSConfig): number {
  switch (grade) {
    case 1: return config.hardGrowth;
    case 2: return config.goodGrowth;
    case 3: return config.easyGrowth;
    default: return 0;
  }
}