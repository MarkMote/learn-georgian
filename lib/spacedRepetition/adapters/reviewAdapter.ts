// lib/spacedRepetition/adapters/reviewAdapter.ts

import { useSpacedRepetition as useCoreSRS } from './useSpacedRepetition';
import type { SRSConfig, Grade } from '../types';

interface ReviewAdapterOptions<T> {
  chunkId: string;
  mode: string;
  availableItems: T[];
  getItemKey: (item: T) => string;
  config?: Partial<SRSConfig>;
  filterPredicate?: (item: T) => boolean;
}

/**
 * Compatibility wrapper for existing review route
 * Maps the new clean API to the old interface
 */
export function useSpacedRepetition<T>({
  chunkId,
  mode,
  availableItems,
  getItemKey,
  config: userConfig,
  filterPredicate
}: ReviewAdapterOptions<T>) {
  // Use the clean adapter
  const {
    currentCard,
    deckInfo,
    handleGrade: coreHandleGrade,
    resetSession,
    session
  } = useCoreSRS({
    chunkId,
    mode,
    availableItems,
    getItemKey,
    config: userConfig,
    filterPredicate
  });

  // Map Grade type (0-3) to function parameter
  const handleReview = (grade: Grade) => {
    coreHandleGrade(grade);
  };

  // Find index of current card in deck
  const currentIndex = currentCard
    ? session.deck.cards.findIndex(c => c.id === currentCard.id)
    : -1;

  return {
    // Core state
    currentCard,
    deck: session.deck,
    currentIndex,
    srsCurrentIndex: currentIndex, // For compatibility

    // Statistics
    stats: session.stats,

    // Actions
    handleReview,
    resetProgress: resetSession,

    // Debug info
    consecutiveEasy: deckInfo.consecutiveEasyCount
  };
}