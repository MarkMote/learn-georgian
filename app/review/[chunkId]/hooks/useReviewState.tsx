// app/review/[chunkId]/hooks/useReviewState.tsx
// Clean SRS state management

import { useState, useEffect, useCallback, useMemo } from "react";
import { WordData, CardState, DeckState, DifficultyRating, Grade } from "../../../../lib/spacedRepetition/types";
import {
  initializeDeck,
  updateStateOnGrade,
  selectNextCard,
  introduceNewCard,
  calculateDeckStats,
  DEFAULT_CONFIG
} from "../../../../lib/spacedRepetition";

// Convert difficulty rating to grade
function difficultyToGrade(difficulty: DifficultyRating): Grade {
  switch (difficulty) {
    case "fail": return 0;
    case "hard": return 1;
    case "good": return 2;
    case "easy": return 3;
  }
}

// Storage helpers
function getStorageKey(chunkId: string, mode: string): string {
  return `srs_simple_${chunkId}_${mode}`;
}

function saveState(chunkId: string, mode: string, cardStates: Map<string, CardState>, deckState: DeckState) {
  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState
    };
    localStorage.setItem(getStorageKey(chunkId, mode), JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save SRS state:", error);
  }
}

function loadState(chunkId: string, mode: string): { cardStates: Map<string, CardState>; deckState: DeckState } | null {
  try {
    const stored = localStorage.getItem(getStorageKey(chunkId, mode));
    if (!stored) return null;

    const data = JSON.parse(stored);
    return {
      cardStates: new Map(Object.entries(data.cardStates)),
      deckState: data.deckState
    };
  } catch (error) {
    console.warn("Failed to load SRS state:", error);
    return null;
  }
}

// Hook interface
export interface UseReviewStateReturn {
  // Current state
  currentWord: WordData | null;
  currentCardState: CardState | null;
  deckState: DeckState;

  // Legacy compatibility (for existing UI)
  knownWords: Array<{ data: WordData; rating: number; lastSeen: number; interval: number; repetitions: number; easeFactor: number; }>;
  currentIndex: number;
  cognitiveLoad: number;
  globalStep: number;
  consecutiveEasyCount: number;

  // Actions
  handleScore: (difficulty: DifficultyRating) => void;
  clearProgress: () => void;
}

export function useReviewState(
  chunkId: string,
  chunkWords: WordData[],
  reviewMode: string = "normal",
  filterPredicate?: (word: WordData) => boolean
): UseReviewStateReturn {

  // Filter words based on review mode
  const availableWords = useMemo(() => {
    let filtered = chunkWords;

    // Mode-specific filtering
    if (reviewMode === "examples" || reviewMode === "examples-reverse") {
      filtered = filtered.filter(w => w.ExampleEnglish1 && w.ExampleGeorgian1);
    }

    // Additional filter predicate
    if (filterPredicate) {
      filtered = filtered.filter(filterPredicate);
    }

    return filtered;
  }, [chunkWords, reviewMode, filterPredicate]);

  // Core state
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(new Map());
  const [deckState, setDeckState] = useState<DeckState>(() => ({
    currentStep: 0,
    currentCardKey: null,
    consecutiveEasyCount: 0,
    stats: { averageRisk: 0, cardsAtRisk: 0 }
  }));

  // Initialize or load saved state
  useEffect(() => {
    if (availableWords.length === 0) return;

    const saved = loadState(chunkId, reviewMode);
    if (saved) {
      setCardStates(saved.cardStates);
      setDeckState(prev => ({
        ...saved.deckState,
        stats: calculateDeckStats(saved.cardStates, saved.deckState, DEFAULT_CONFIG)
      }));
    } else {
      const { cardStates: initialCards, deckState: initialDeck } = initializeDeck(availableWords, DEFAULT_CONFIG);
      setCardStates(initialCards);
      setDeckState({
        ...initialDeck,
        stats: calculateDeckStats(initialCards, initialDeck, DEFAULT_CONFIG)
      });
    }
  }, [chunkId, reviewMode, availableWords.length]);

  // Save state when it changes
  useEffect(() => {
    if (cardStates.size > 0) {
      saveState(chunkId, reviewMode, cardStates, deckState);
    }
  }, [cardStates, deckState, chunkId, reviewMode]);

  // Get current word data
  const currentWord = useMemo(() => {
    if (!deckState.currentCardKey) return null;
    return availableWords.find(w => w.key === deckState.currentCardKey) || null;
  }, [deckState.currentCardKey, availableWords]);

  // Get current card state
  const currentCardState = useMemo(() => {
    if (!deckState.currentCardKey) return null;
    return cardStates.get(deckState.currentCardKey) || null;
  }, [deckState.currentCardKey, cardStates]);

  // Handle scoring (main action)
  const handleScore = useCallback((difficulty: DifficultyRating) => {
    if (!currentCardState) return;

    const grade = difficultyToGrade(difficulty);

    // Update card and deck
    const { cardState: updatedCard, deckState: updatedDeck } = updateStateOnGrade(
      currentCardState,
      deckState,
      grade,
      DEFAULT_CONFIG
    );

    // Update card states
    const newCardStates = new Map(cardStates);
    newCardStates.set(updatedCard.key, updatedCard);

    // Check if we should introduce a new card
    const { nextCardKey, shouldIntroduceNew } = selectNextCard(
      newCardStates,
      updatedDeck,
      availableWords,
      DEFAULT_CONFIG,
      filterPredicate
    );

    let finalCardStates = newCardStates;
    let finalDeckState = updatedDeck;

    if (shouldIntroduceNew) {
      const { cardStates: cardsWithNew, newCardKey } = introduceNewCard(
        newCardStates,
        updatedDeck,
        availableWords,
        DEFAULT_CONFIG
      );

      if (newCardKey) {
        finalCardStates = cardsWithNew;
        finalDeckState = {
          ...updatedDeck,
          currentCardKey: newCardKey,
          consecutiveEasyCount: 0 // Reset after introducing new card
        };
      } else {
        finalDeckState = {
          ...updatedDeck,
          currentCardKey: nextCardKey
        };
      }
    } else {
      finalDeckState = {
        ...updatedDeck,
        currentCardKey: nextCardKey
      };
    }

    // Calculate updated stats
    const newStats = calculateDeckStats(finalCardStates, finalDeckState, DEFAULT_CONFIG);
    finalDeckState.stats = newStats;

    // Debug logging
    console.log('Grade applied:', difficulty, 'grade:', grade);
    console.log('Updated card:', updatedCard);
    console.log('Final deck state:', {
      currentStep: finalDeckState.currentStep,
      currentCardKey: finalDeckState.currentCardKey
    });

    // Update state
    setCardStates(finalCardStates);
    setDeckState(finalDeckState);
  }, [currentCardState, deckState, cardStates, availableWords, filterPredicate]);

  // Clear progress
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(chunkId, reviewMode));
    } catch (error) {
      console.warn("Failed to clear stored state:", error);
    }

    const { cardStates: freshCards, deckState: freshDeck } = initializeDeck(availableWords, DEFAULT_CONFIG);
    setCardStates(freshCards);
    setDeckState({
      ...freshDeck,
      stats: calculateDeckStats(freshCards, freshDeck, DEFAULT_CONFIG)
    });
  }, [chunkId, reviewMode, availableWords]);

  // Legacy compatibility - convert to old format for existing UI
  const knownWords = useMemo(() => {
    return Array.from(cardStates.entries()).map(([key, cardState]) => {
      const wordData = availableWords.find(w => w.key === key);
      if (!wordData) return null;

      return {
        data: wordData,
        rating: 2, // Default for compatibility
        lastSeen: deckState.currentStep - cardState.lastReviewStep,
        interval: cardState.stability,
        repetitions: cardState.reviewCount,
        easeFactor: 2.5 // Legacy field
      };
    }).filter(item => item !== null);
  }, [cardStates, availableWords, deckState.currentStep]);

  const currentIndex = knownWords.findIndex(item => item.data.key === deckState.currentCardKey);

  return {
    // Current state
    currentWord,
    currentCardState,
    deckState,

    // Legacy compatibility
    knownWords,
    currentIndex: Math.max(0, currentIndex),
    cognitiveLoad: deckState.stats.averageRisk,
    globalStep: deckState.currentStep,
    consecutiveEasyCount: deckState.consecutiveEasyCount,

    // Actions
    handleScore,
    clearProgress
  };
}