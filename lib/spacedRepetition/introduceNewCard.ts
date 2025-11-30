// lib/spacedRepetition/introduceNewCard.ts

import { CardState, DeckState, WordData, SRSConfig } from './types';

/**
 * Introduce a new card to the deck
 */
export function introduceNewCard(
  cardStates: Map<string, CardState>,
  deckState: DeckState,
  availableWords: WordData[],
  config: SRSConfig
): { cardStates: Map<string, CardState>; newCardKey: string | null } {

  // Find next word to introduce
  const existingKeys = new Set(cardStates.keys());
  const nextWord = availableWords.find(word => !existingKeys.has(word.key));

  if (!nextWord) {
    return { cardStates, newCardKey: null };
  }

  // Create new card state
  const newCardState: CardState = {
    key: nextWord.key,
    stability: config.initialStability,
    lastReviewStep: deckState.currentStep,
    reviewCount: 0,
    lapseCount: 0,
    introducedAtStep: deckState.currentStep,
    lastGrade: 2 // Default to "good" for new cards
  };

  // Add to card states
  const updatedCardStates = new Map(cardStates);
  updatedCardStates.set(nextWord.key, newCardState);

  return {
    cardStates: updatedCardStates,
    newCardKey: nextWord.key
  };
}