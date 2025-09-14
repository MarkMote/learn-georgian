// lib/spacedRepetition/updateStateOnGrade.ts

import { CardState, DeckState, Grade, SRSConfig } from './types';
import { updateStability } from './lib/updateStability';

/**
 * Update card and deck state on grade
 */
export function updateStateOnGrade(
  cardState: CardState,
  deckState: DeckState,
  grade: Grade,
  config: SRSConfig
): { cardState: CardState; deckState: DeckState } {

  // Update card - reviewed at current step
  const updatedCard: CardState = {
    ...cardState,
    stability: updateStability(cardState, grade, config),
    lastReviewStep: deckState.currentStep, // Card reviewed at current step
    reviewCount: cardState.reviewCount + 1,
    lapseCount: grade === 0 ? cardState.lapseCount + 1 : cardState.lapseCount
  };

  // Update deck - advance to next step
  const updatedDeck: DeckState = {
    ...deckState,
    currentStep: deckState.currentStep + 1, // Advance deck step
    consecutiveEasyCount: grade === 3 ? deckState.consecutiveEasyCount + 1 : 0,
    stats: { ...deckState.stats } // Will be recalculated by caller
  };

  return {
    cardState: updatedCard,
    deckState: updatedDeck
  };
}