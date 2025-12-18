// lib/spacedRepetition/selectNextCard.ts

import { CardState, DeckState, WordData, SRSConfig, SelectNextCardResult } from './types';

/**
 * Select next card using Leitner-style queue management
 *
 * Priority:
 * 1. Learning cards whose step is due (must show other cards between repeats)
 * 2. Review cards that are due (FSRS scheduled)
 * 3. Practice mode - review non-due cards if nothing else to do
 *
 * Introduction:
 * - Introduce new card when learning box has fewer than targetLearningCount cards
 */
export function selectNextCard(
  cardStates: Map<string, CardState>,
  deckState: DeckState,
  availableWords: WordData[],
  config: SRSConfig,
  recentCardKeys: string[] = [],  // For interleaving - recently shown cards
  filterPredicate?: (word: WordData) => boolean
): SelectNextCardResult {
  const now = new Date();

  // Build word lookup map for efficiency
  const wordByKey = new Map(availableWords.map(w => [w.key, w]));
  const recentSet = new Set(recentCardKeys);

  // Partition cards into queues
  const learningDue: Array<{ key: string; stepDue: Date }> = [];
  const reviewDue: Array<{ key: string; due: Date }> = [];
  const practiceCards: Array<{ key: string; stability: number }> = [];
  let learningCount = 0;

  cardStates.forEach((cardState, key) => {
    // Check if word passes filter
    const word = wordByKey.get(key);
    if (!word || (filterPredicate && !filterPredicate(word))) {
      return; // Skip filtered cards
    }

    if (cardState.phase === 'learning') {
      learningCount++;
      const stepDue = new Date(cardState.stepDue);
      if (stepDue <= now) {
        learningDue.push({ key, stepDue });
      }
    } else if (cardState.phase === 'review' || cardState.phase === 'graduated') {
      const due = new Date(cardState.due);
      if (due <= now) {
        reviewDue.push({ key, due });
      } else {
        // Not due - available for practice
        practiceCards.push({ key, stability: cardState.stability });
      }
    }
  });

  // Sort queues
  learningDue.sort((a, b) => a.stepDue.getTime() - b.stepDue.getTime());
  reviewDue.sort((a, b) => a.due.getTime() - b.due.getTime());
  practiceCards.sort((a, b) => a.stability - b.stability); // Weakest first

  // Determine if we need to introduce a new card
  const allIntroduced = cardStates.size >= availableWords.length;
  // Introduce new card if:
  // 1. Learning box below target, OR
  // 2. 4+ consecutive easys (user is finding things easy, give them more)
  const consecutiveEasyThreshold = 4;
  const forceNewFromEasy = !allIntroduced && (deckState.consecutiveEasyCount ?? 0) >= consecutiveEasyThreshold;
  const shouldIntroduceNew = !allIntroduced && (learningCount < config.targetLearningCount || forceNewFromEasy);

  // Helper to filter out recent cards (for interleaving)
  const filterRecent = <T extends { key: string }>(cards: T[]): T[] => {
    const filtered = cards.filter(c => !recentSet.has(c.key));
    // If all cards are recent, return original list (will pick oldest from recent)
    return filtered.length > 0 ? filtered : cards;
  };

  // Case 1: Learning cards due (with interleaving)
  if (learningDue.length > 0) {
    const candidates = filterRecent(learningDue);
    if (candidates.length > 0) {
      return {
        nextCardKey: candidates[0].key,
        shouldIntroduceNew,
        source: 'learning',
        allComplete: false,
      };
    }
  }

  // Case 2: Review cards due
  if (reviewDue.length > 0) {
    const candidates = filterRecent(reviewDue);
    if (candidates.length > 0) {
      return {
        nextCardKey: candidates[0].key,
        shouldIntroduceNew,
        source: 'review',
        allComplete: false,
      };
    }
  }

  // Case 3: If we should introduce a new card and nothing else is due, signal it
  if (shouldIntroduceNew) {
    return {
      nextCardKey: null,
      shouldIntroduceNew: true,
      source: 'new',
      allComplete: false,
    };
  }

  // Case 4: Learning cards exist but not yet due (waiting)
  // IMPORTANT: Check this BEFORE practice mode - we want to wait for learning cards
  // rather than jumping to practice mode with graduated cards
  if (learningCount > 0) {
    // Find learning cards not yet due, sorted by stepDue
    const waitingCards: Array<{ key: string; stepDue: Date }> = [];

    cardStates.forEach((cardState, key) => {
      const word = wordByKey.get(key);
      if (!word || (filterPredicate && !filterPredicate(word))) return;

      if (cardState.phase === 'learning') {
        const stepDue = new Date(cardState.stepDue);
        // Only include cards that aren't due yet (due cards handled in Case 1)
        if (stepDue > now) {
          waitingCards.push({ key, stepDue });
        }
      }
    });

    // Sort by stepDue (earliest first)
    waitingCards.sort((a, b) => a.stepDue.getTime() - b.stepDue.getTime());

    // Apply interleaving - don't show the same card we just graded
    const candidates = filterRecent(waitingCards);
    if (candidates.length > 0) {
      return {
        nextCardKey: candidates[0].key,
        shouldIntroduceNew: false,
        source: 'learning',
        allComplete: false,
      };
    }
  }

  // Case 5: Practice mode - no due cards AND no learning cards waiting
  // Only go to practice mode when there's truly nothing else to do
  if (practiceCards.length > 0) {
    const candidates = filterRecent(practiceCards);
    if (candidates.length > 0) {
      return {
        nextCardKey: candidates[0].key,
        shouldIntroduceNew: false,
        source: 'practice',
        allComplete: false,
      };
    }
  }

  // Case 6: Nothing to do - all complete!
  return {
    nextCardKey: null,
    shouldIntroduceNew: false,
    source: 'practice',
    allComplete: true,
  };
}
