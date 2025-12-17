// lib/spacedRepetition/initializeDeck.ts

import { WordData, CardState, DeckState, SRSConfig } from './types';
import { createCardState } from './lib/fsrs';
import { DEFAULT_CONFIG } from './config';

/**
 * Initialize deck with target number of cards in learning box
 */
export function initializeDeck(
  availableWords: WordData[],
  config: SRSConfig = DEFAULT_CONFIG
): { cardStates: Map<string, CardState>; deckState: DeckState } {
  const cardStates = new Map<string, CardState>();
  const now = new Date();

  // Initialize with targetLearningCount cards (or all available if fewer)
  const initialCount = Math.min(config.targetLearningCount, availableWords.length);

  for (let i = 0; i < initialCount; i++) {
    const word = availableWords[i];
    cardStates.set(word.key, createCardState(word.key, now));
  }

  const deckState: DeckState = {
    currentCardKey: initialCount > 0 ? availableWords[0].key : null,
    stats: {
      dueCount: 0,
      learningCount: initialCount,  // All initial cards are in learning
      graduatedCount: 0,
      totalIntroduced: initialCount,
      totalAvailable: availableWords.length,
    },
  };

  return { cardStates, deckState };
}
