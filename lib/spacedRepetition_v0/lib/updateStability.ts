// lib/spacedRepetition/lib/updateStability.ts

import { CardState, Grade, SRSConfig } from '../types';
import { calculateRisk } from './calculateRisk';

/**
 * Update card stability based on grade
 */
export function updateStability(cardState: CardState, grade: Grade, config: SRSConfig): number {
  const daysSinceReview = Math.max(1, config.beta); // Simplified - using beta as time unit
  const currentRisk = calculateRisk(cardState.stability, daysSinceReview, config.beta);

  if (grade === 0) {
    // Failed - reduce stability
    const newStability = cardState.stability * (1 - config.failShrink * currentRisk);
    return Math.max(newStability, config.minStability);
  }

  // Success - increase stability based on grade
  const growthFactors = [0, config.hardGrowth, config.goodGrowth, config.easyGrowth];
  const growthFactor = growthFactors[grade];
  const newStability = cardState.stability * (1 + growthFactor * (1 - currentRisk));

  return Math.min(Math.max(newStability, cardState.stability), config.maxStability);
}