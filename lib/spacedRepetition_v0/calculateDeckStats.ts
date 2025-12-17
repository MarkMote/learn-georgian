// lib/spacedRepetition/calculateDeckStats.ts

import { CardState, DeckState, SRSConfig } from './types';
import { calculateRisk } from './lib/calculateRisk';

/**
 * Calculate deck statistics
 */
export function calculateDeckStats(
  cardStates: Map<string, CardState>,
  deckState: DeckState,
  config: SRSConfig
): { averageRisk: number; cardsAtRisk: number } {

  if (cardStates.size === 0) {
    return { averageRisk: 0, cardsAtRisk: 0 };
  }

  let totalRisk = 0;
  let cardsAtRisk = 0;

  cardStates.forEach((cardState) => {
    const daysSinceReview = deckState.currentStep - cardState.lastReviewStep;
    const risk = calculateRisk(cardState.stability, daysSinceReview, config.beta);

    totalRisk += risk;
    if (risk > config.riskThreshold) {
      cardsAtRisk++;
    }
  });

  return {
    averageRisk: totalRisk / cardStates.size,
    cardsAtRisk
  };
}