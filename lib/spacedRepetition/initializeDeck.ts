// lib/spacedRepetition/initializeDeck.ts

import { WordData, CardState, DeckState, SRSConfig } from './types';
import { createCardState } from './lib/fsrs';
import { DEFAULT_CONFIG } from './config';

/**
 * Initialize deck with initial number of cards in learning box
 * Starts with fewer cards to avoid overwhelm, grows to targetLearningCount as user progresses
 */
export function initializeDeck(
  availableWords: WordData[],
  config: SRSConfig = DEFAULT_CONFIG
): { cardStates: Map<string, CardState>; deckState: DeckState } {
  const cardStates = new Map<string, CardState>();
  const now = new Date();

  // Initialize with initialLearningCount cards (or all available if fewer)
  // The selectNextCard logic will grow this to targetLearningCount as cards progress
  const initialCount = Math.min(config.initialLearningCount, availableWords.length);

  for (let i = 0; i < initialCount; i++) {
    const word = availableWords[i];
    cardStates.set(word.key, createCardState(word.key, now));
  }

  const deckState: DeckState = {
    currentCardKey: initialCount > 0 ? availableWords[0].key : null,
    consecutiveEasyCount: 0,
    stats: {
      dueCount: 0,
      learningCount: initialCount,  // All initial cards are in learning
      consolidationCount: 0,
      graduatedCount: 0,
      totalIntroduced: initialCount,
      totalAvailable: availableWords.length,
    },
  };

  return { cardStates, deckState };
}
