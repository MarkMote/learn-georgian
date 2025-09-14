// lib/spacedRepetition/adapters/useSpacedRepetition.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Grade,
  Card,
  ReviewSession,
  SRSConfig
} from '../legacyTypes';
import {
  initializeSession,
  processSessionAction,
  saveSession,
  loadSession,
  clearSession as clearStoredSession
} from '../lib/session';
import { DEFAULT_CONFIG } from '../legacyTypes';

interface UseSpacedRepetitionOptions<T> {
  chunkId: string;
  mode: string;
  availableItems: T[];
  getItemKey: (item: T) => string;
  config?: Partial<SRSConfig>;
  filterPredicate?: (item: T) => boolean;
}

/**
 * Simple React adapter for spaced repetition
 * Connects the pure algorithm to React state
 */
export function useSpacedRepetition<T>({
  chunkId,
  mode,
  availableItems,
  getItemKey,
  config: userConfig,
  filterPredicate
}: UseSpacedRepetitionOptions<T>) {
  // Merge config with defaults
  const config: SRSConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    [userConfig]
  );

  // Session state
  const [session, setSession] = useState<ReviewSession<T>>(() =>
    initializeSession(availableItems, config, getItemKey)
  );

  // Load saved session on mount
  useEffect(() => {
    if (availableItems.length === 0) return;

    const saved = loadSession<T>(chunkId, mode);
    if (saved?.deck && saved.deck.cards.length > 0) {
      setSession(current => ({
        ...current,
        ...saved,
        availableItems,
        config,
        stats: current.stats // Will be recalculated in processSessionAction
      }));
    } else {
      // Initialize with first item
      setSession(initializeSession(availableItems, config, getItemKey));
    }
  }, [chunkId, mode, availableItems.length]); // Only re-init when key params change

  // Save session when it changes
  useEffect(() => {
    if (session.deck.cards.length > 0) {
      saveSession(session, chunkId, mode);
    }
  }, [session, chunkId, mode]);

  // Handle grading a card
  const handleGrade = useCallback((grade: Grade) => {
    setSession(current =>
      processSessionAction(current, { type: 'GRADE_CARD', grade }, getItemKey)
    );
  }, [getItemKey]);

  // Reset session
  const resetSession = useCallback(() => {
    clearStoredSession(chunkId, mode);
    setSession(initializeSession(availableItems, config, getItemKey));
  }, [chunkId, mode, availableItems, config, getItemKey]);

  // Get current card (apply filter if needed)
  const currentCard = useMemo(() => {
    if (!session.currentCardId) return null;

    const card = session.deck.cards.find(c => c.id === session.currentCardId);
    if (!card) return null;

    // Check filter
    if (filterPredicate && !filterPredicate(card.data)) {
      // Card filtered out, select next
      const filteredCards = session.deck.cards.filter(c => filterPredicate(c.data));
      if (filteredCards.length === 0) return null;

      // Find next best card among filtered
      // This is a simplified version - ideally would recalculate risks
      return filteredCards[0];
    }

    return card;
  }, [session.currentCardId, session.deck.cards, filterPredicate]);

  // Get deck info
  const deckInfo = useMemo(() => ({
    totalCards: session.deck.cards.length,
    currentStep: session.deck.currentStep,
    averageRisk: session.stats.averageRisk,
    cardsAtRisk: session.stats.cardsAtRisk,
    consecutiveEasyCount: session.consecutiveEasyCount
  }), [session]);

  return {
    // Current card
    currentCard,

    // Deck information
    deckInfo,

    // Actions
    handleGrade,
    resetSession,

    // Raw session for debugging
    session
  };
}