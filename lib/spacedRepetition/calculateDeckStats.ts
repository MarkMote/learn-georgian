// lib/spacedRepetition/calculateDeckStats.ts

import { CardState, DeckState, WordData } from './types';

/**
 * Calculate deck statistics based on learning box phases
 */
export function calculateDeckStats(
  cardStates: Map<string, CardState>,
  totalAvailable: number,
  filterPredicate?: (word: WordData) => boolean,
  wordByKey?: Map<string, WordData>
): DeckState['stats'] {
  const now = new Date();

  if (cardStates.size === 0) {
    return {
      dueCount: 0,
      learningCount: 0,
      graduatedCount: 0,
      totalIntroduced: 0,
      totalAvailable,
    };
  }

  let dueCount = 0;
  let learningCount = 0;
  let graduatedCount = 0;

  cardStates.forEach((cardState, key) => {
    // Apply filter if provided
    if (filterPredicate && wordByKey) {
      const word = wordByKey.get(key);
      if (!word || !filterPredicate(word)) return;
    }

    if (cardState.phase === 'learning') {
      learningCount++;
      // Learning cards use stepDue, not FSRS due
      if (new Date(cardState.stepDue) <= now) {
        dueCount++;
      }
    } else if (cardState.phase === 'graduated' || cardState.phase === 'review') {
      graduatedCount++;
      // Graduated cards use FSRS due
      if (new Date(cardState.due) <= now) {
        dueCount++;
      }
    }
  });

  return {
    dueCount,
    learningCount,
    graduatedCount,
    totalIntroduced: cardStates.size,
    totalAvailable,
  };
}
