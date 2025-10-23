// app/custom/hooks/useCustomReviewState.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import { CustomWord, CustomWordData, CustomReviewMode, CustomExampleMode } from "../types";
import { WordData, CardState, DeckState, Grade } from "../../../lib/spacedRepetition/types";
import {
  initializeDeck,
  updateStateOnGrade,
  selectNextCard,
  introduceNewCard,
  calculateDeckStats,
} from "../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../lib/spacedRepetition/lib/configManager";

// Convert CustomWord to WordData format
function customWordToWordData(word: CustomWord): WordData {
  return {
    key: word.key,
    word_key: word.key,
    img_key: "",
    EnglishWord: word.front,
    PartOfSpeech: "",
    GeorgianWord: word.back,
    hint: "",
    priority: "1",
    group: "custom",
    ExampleEnglish1: word.examplePreview || "",
    ExampleGeorgian1: word.exampleRevealed || ""
  };
}

// Convert difficulty rating to grade
type DifficultyRating = "easy" | "good" | "hard" | "fail";

function difficultyToGrade(difficulty: DifficultyRating): Grade {
  switch (difficulty) {
    case "fail": return 0;
    case "hard": return 1;
    case "good": return 2;
    case "easy": return 3;
  }
}

// Storage helpers
function getStorageKey(mode: string): string {
  return `srs_custom_${mode}`;
}

function saveState(mode: string, cardStates: Map<string, CardState>, deckState: DeckState) {
  if (typeof window === 'undefined') return;

  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState
    };
    localStorage.setItem(getStorageKey(mode), JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save SRS state:", error);
  }
}

function loadState(mode: string): { cardStates: Map<string, CardState>; deckState: DeckState } | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(getStorageKey(mode));
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
export interface UseCustomReviewStateReturn {
  // Legacy format for UI compatibility
  knownWords: CustomWordData[];
  currentIndex: number;
  cognitiveLoad: number;

  // UI state
  isFlipped: boolean;
  showEnglish: boolean;
  showExamples: CustomExampleMode;
  revealedExamples: Set<string>;
  isLeftHanded: boolean;

  // Setters
  setIsFlipped: (value: boolean) => void;
  setShowEnglish: (value: boolean) => void;
  setShowExamples: (value: CustomExampleMode) => void;
  setRevealedExamples: (value: Set<string>) => void;
  setCurrentIndex: (value: number) => void;
  setIsLeftHanded: (value: boolean) => void;

  // Actions
  handleScore: (difficulty: DifficultyRating) => void;
  clearProgress: () => void;
}

export function useCustomReviewState(
  customWords: CustomWord[],
  reviewMode: CustomReviewMode = "normal"
): UseCustomReviewStateReturn {
  // Get user-configured or default SRS config
  const config = useMemo(() => getMergedConfig(), []);

  // Convert custom words to WordData format
  const availableWords = useMemo(() => {
    let filtered = customWords.map(customWordToWordData);

    // Mode-specific filtering
    if (reviewMode === "examples" || reviewMode === "examples-reverse") {
      filtered = filtered.filter(w => w.ExampleEnglish1 && w.ExampleGeorgian1);
    }

    return filtered;
  }, [customWords, reviewMode]);

  // Core SRS state
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(new Map());
  const [deckState, setDeckState] = useState<DeckState>(() => ({
    currentStep: 0,
    currentCardKey: null,
    consecutiveEasyCount: 0,
    stats: { averageRisk: 0, cardsAtRisk: 0 }
  }));

  // UI state
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEnglish, setShowEnglish] = useState(true);
  const [showExamples, setShowExamples] = useState<CustomExampleMode>("off");
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [isLeftHanded, setIsLeftHanded] = useState(false);

  // Initialize or load saved state
  useEffect(() => {
    if (availableWords.length === 0) return;

    const saved = loadState(reviewMode);
    let shouldUseSaved = false;

    if (saved) {
      // Validate that saved state has at least one card that exists in current availableWords
      const availableWordKeys = new Set(availableWords.map(w => w.key));
      const hasValidCards = Array.from(saved.cardStates.keys()).some(key =>
        availableWordKeys.has(key)
      );

      shouldUseSaved = hasValidCards;

      if (!hasValidCards) {
        console.log('Saved SRS state is incompatible with current words, reinitializing...');
        // Clear the invalid saved state
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(getStorageKey(reviewMode));
          } catch (error) {
            console.warn("Failed to clear invalid SRS state:", error);
          }
        }
      }
    }

    if (shouldUseSaved && saved) {
      setCardStates(saved.cardStates);
      setDeckState(prev => ({
        ...saved.deckState,
        stats: calculateDeckStats(saved.cardStates, saved.deckState, config)
      }));
    } else {
      const { cardStates: initialCards, deckState: initialDeck } = initializeDeck(availableWords, config);
      setCardStates(initialCards);
      setDeckState({
        ...initialDeck,
        stats: calculateDeckStats(initialCards, initialDeck, config)
      });
    }
  }, [reviewMode, availableWords.length, config]);

  // Save state when it changes
  useEffect(() => {
    if (cardStates.size > 0) {
      saveState(reviewMode, cardStates, deckState);
    }
  }, [cardStates, deckState, reviewMode]);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setRevealedExamples(new Set());
  }, [deckState.currentCardKey]);

  // Get current card state
  const currentCardState = useMemo(() => {
    if (!deckState.currentCardKey) return null;
    return cardStates.get(deckState.currentCardKey) || null;
  }, [deckState.currentCardKey, cardStates]);

  // Handle scoring
  const handleScore = useCallback((difficulty: DifficultyRating) => {
    if (!currentCardState) return;

    const grade = difficultyToGrade(difficulty);

    // Update card and deck
    const { cardState: updatedCard, deckState: updatedDeck } = updateStateOnGrade(
      currentCardState,
      deckState,
      grade,
      config
    );

    // Update card states
    const newCardStates = new Map(cardStates);
    newCardStates.set(updatedCard.key, updatedCard);

    // Check if we should introduce a new card
    const { nextCardKey, shouldIntroduceNew } = selectNextCard(
      newCardStates,
      updatedDeck,
      availableWords,
      config
    );

    let finalCardStates = newCardStates;
    let finalDeckState = updatedDeck;

    if (shouldIntroduceNew) {
      const { cardStates: cardsWithNew, newCardKey } = introduceNewCard(
        newCardStates,
        updatedDeck,
        availableWords,
        config
      );

      if (newCardKey) {
        finalCardStates = cardsWithNew;
        finalDeckState = {
          ...updatedDeck,
          currentCardKey: newCardKey,
          consecutiveEasyCount: 0
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
    const newStats = calculateDeckStats(finalCardStates, finalDeckState, config);
    finalDeckState.stats = newStats;

    // Update state
    setCardStates(finalCardStates);
    setDeckState(finalDeckState);
  }, [currentCardState, deckState, cardStates, availableWords, config]);

  // Clear progress
  const clearProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(getStorageKey(reviewMode));
      } catch (error) {
        console.warn("Failed to clear stored state:", error);
      }
    }

    const { cardStates: freshCards, deckState: freshDeck } = initializeDeck(availableWords, config);
    setCardStates(freshCards);
    setDeckState({
      ...freshDeck,
      stats: calculateDeckStats(freshCards, freshDeck, config)
    });

    // Reset UI state
    setIsFlipped(false);
    setRevealedExamples(new Set());
  }, [reviewMode, availableWords, config]);

  // Convert to legacy format for UI compatibility
  const knownWords = useMemo(() => {
    return Array.from(cardStates.entries()).map(([key, cardState]) => {
      const word = customWords.find(w => w.key === key);
      if (!word) return null;

      return {
        data: word,
        easinessFactor: 2.5,
        interval: cardState.stability,
        repetitions: cardState.reviewCount,
        nextReviewDate: new Date(Date.now() + cardState.stability * 24 * 60 * 60 * 1000)
      };
    }).filter(item => item !== null) as CustomWordData[];
  }, [cardStates, customWords]);

  const currentIndex = knownWords.findIndex(item => item.data.key === deckState.currentCardKey);

  const setCurrentIndex = useCallback((index: number) => {
    if (index >= 0 && index < knownWords.length) {
      const newCardKey = knownWords[index].data.key;
      setDeckState(prev => ({
        ...prev,
        currentCardKey: newCardKey
      }));
    }
  }, [knownWords]);

  return {
    // Legacy format for UI
    knownWords,
    currentIndex: Math.max(0, currentIndex),
    cognitiveLoad: deckState.stats.averageRisk,

    // UI state
    isFlipped,
    showEnglish,
    showExamples,
    revealedExamples,
    isLeftHanded,

    // Setters
    setIsFlipped,
    setShowEnglish,
    setShowExamples,
    setRevealedExamples,
    setCurrentIndex,
    setIsLeftHanded,

    // Actions
    handleScore,
    clearProgress
  };
}