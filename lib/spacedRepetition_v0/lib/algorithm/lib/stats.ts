// lib/spacedRepetition/lib/algorithm/lib/stats.ts

import { Deck, DeckStats, SRSConfig } from '../../../types';
import { forgettingRisk } from './forgetting';

/**
 * Calculate deck statistics
 */
export function calculateDeckStats<T>(
  deck: Deck<T>,
  config: SRSConfig
): DeckStats {
  if (deck.cards.length === 0) {
    return {
      totalCards: 0,
      averageRisk: 0,
      cardsAtRisk: 0
    };
  }

  let totalRisk = 0;
  let cardsAtRisk = 0;

  for (const card of deck.cards) {
    const risk = forgettingRisk(card, deck.currentStep, config);
    totalRisk += risk;
    if (risk > 0.5) {
      cardsAtRisk++;
    }
  }

  return {
    totalCards: deck.cards.length,
    averageRisk: totalRisk / deck.cards.length,
    cardsAtRisk
  };
}