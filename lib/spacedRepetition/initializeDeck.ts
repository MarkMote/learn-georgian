// lib/spacedRepetition/initializeDeck.ts

import { WordData, CardState, DeckState, SRSConfig } from './types';

/**
 * Initialize deck with first card
 */
export function initializeDeck(availableWords: WordData[], config: SRSConfig): { cardStates: Map<string, CardState>; deckState: DeckState } {
  const cardStates = new Map<string, CardState>();

  // Start with first word if available
  if (availableWords.length > 0) {
    const firstWord = availableWords[0];
    cardStates.set(firstWord.key, {
      key: firstWord.key,
      stability: config.initialStability,
      lastReviewStep: 0,
      reviewCount: 0,
      lapseCount: 0,
      introducedAtStep: 0
    });
  }

  const deckState: DeckState = {
    currentStep: 0,
    currentCardKey: availableWords.length > 0 ? availableWords[0].key : null,
    consecutiveEasyCount: 0,
    stats: {
      averageRisk: 0,
      cardsAtRisk: 0
    }
  };

  return { cardStates, deckState };
}