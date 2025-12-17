// app/custom/hooks/useCustomReviewState.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import { CustomWord, CustomWordData, CustomReviewMode, CustomExampleMode } from "../types";
import {
  WordData,
  CardState,
  DeckState,
  Grade,
  SelectNextCardResult,
} from "../../../lib/spacedRepetition/types";
import {
  initializeDeck,
  updateStateOnGrade,
  selectNextCard,
  introduceNewCard,
  calculateDeckStats,
} from "../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../lib/spacedRepetition/lib/configManager";
import { createCardState } from "../../../lib/spacedRepetition/lib/fsrs";

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
  return `srs_custom_v3_${mode}`;  // v3 for learning box format
}

function saveState(mode: string, cardStates: Map<string, CardState>, deckState: DeckState) {
  if (typeof window === 'undefined') return;

  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState,
      version: 3,
    };
    localStorage.setItem(getStorageKey(mode), JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save SRS state:", error);
  }
}

function loadState(
  mode: string,
  totalAvailable: number
): { cardStates: Map<string, CardState>; deckState: DeckState } | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(getStorageKey(mode));
    if (!stored) return null;

    const data = JSON.parse(stored);

    // Only load v3 format - older formats will be reset
    if (data.version !== 3) {
      console.log("Old SRS format detected, resetting progress for new learning box system");
      return null;
    }

    // Validate that cards have the new fields
    const firstCardKey = Object.keys(data.cardStates)[0];
    if (firstCardKey) {
      const firstCard = data.cardStates[firstCardKey];
      if (!('phase' in firstCard) || !('learningStep' in firstCard)) {
        console.log("Card format missing learning box fields, resetting");
        return null;
      }
    }

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

  // Learning box state
  source: SelectNextCardResult['source'];
  allComplete: boolean;

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
    currentCardKey: null,
    stats: {
      dueCount: 0,
      learningCount: 0,
      graduatedCount: 0,
      totalIntroduced: 0,
      totalAvailable: 0,
    },
  }));

  // Recent cards for interleaving (not persisted - session only)
  const [recentCardKeys, setRecentCardKeys] = useState<string[]>([]);

  // Selection state
  const [selectionResult, setSelectionResult] = useState<SelectNextCardResult>({
    nextCardKey: null,
    shouldIntroduceNew: false,
    source: 'new',
    allComplete: false,
  });

  // UI state
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEnglish, setShowEnglish] = useState(true);
  const [showExamples, setShowExamples] = useState<CustomExampleMode>("off");
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [isLeftHanded, setIsLeftHanded] = useState(false);

  // Initialize or load saved state
  useEffect(() => {
    if (availableWords.length === 0) return;

    const availableKeys = new Set(availableWords.map(w => w.key));
    const saved = loadState(reviewMode, availableWords.length);

    let useSaved = false;
    if (saved) {
      const validCardCount = Array.from(saved.cardStates.keys()).filter(key => availableKeys.has(key)).length;
      useSaved = validCardCount > 0;

      if (!useSaved) {
        console.log('Saved SRS state incompatible with current custom words, reinitializing...');
        try {
          localStorage.removeItem(getStorageKey(reviewMode));
        } catch (e) {
          console.warn('Failed to clear incompatible state:', e);
        }
      }
    }

    if (useSaved && saved) {
      const filteredCardStates = new Map<string, CardState>();
      saved.cardStates.forEach((cardState, key) => {
        if (availableKeys.has(key)) {
          filteredCardStates.set(key, cardState);
        }
      });

      setCardStates(filteredCardStates);
      const stats = calculateDeckStats(filteredCardStates, availableWords.length);
      const selection = selectNextCard(
        filteredCardStates,
        saved.deckState,
        availableWords,
        config,
        []  // No recent cards on load
      );

      let validCurrentKey: string | null = selection.nextCardKey;
      if (!validCurrentKey && filteredCardStates.size > 0) {
        validCurrentKey = Array.from(filteredCardStates.keys())[0];
      }

      setDeckState({
        ...saved.deckState,
        currentCardKey: validCurrentKey,
        stats,
      });
      setSelectionResult(selection);
    } else {
      const { cardStates: initialCards, deckState: initialDeck } = initializeDeck(availableWords, config);
      setCardStates(initialCards);
      setDeckState({
        ...initialDeck,
        stats: calculateDeckStats(initialCards, availableWords.length),
      });

      const selection = selectNextCard(initialCards, initialDeck, availableWords, config, []);
      setSelectionResult(selection);
    }

    // Reset recent cards on mode change
    setRecentCardKeys([]);
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
    if (!currentCardState || !deckState.currentCardKey) return;

    const grade = difficultyToGrade(difficulty);

    const { cardState: updatedCard, deckState: updatedDeck } = updateStateOnGrade(
      currentCardState,
      deckState,
      grade,
      config
    );

    const newCardStates = new Map(cardStates);
    newCardStates.set(updatedCard.key, updatedCard);

    // Add current card to recent list (for interleaving)
    const newRecentCards = [...recentCardKeys, deckState.currentCardKey];
    const maxRecent = Math.max(config.minInterleaveCount + 2, 5);
    if (newRecentCards.length > maxRecent) {
      newRecentCards.shift();
    }

    const selection = selectNextCard(
      newCardStates,
      updatedDeck,
      availableWords,
      config,
      newRecentCards
    );

    let finalCardStates = newCardStates;
    let finalDeckState = updatedDeck;

    if (selection.shouldIntroduceNew) {
      const { cardStates: cardsWithNew, newCardKey } = introduceNewCard(
        newCardStates,
        updatedDeck,
        availableWords
      );

      if (newCardKey) {
        finalCardStates = cardsWithNew;
        finalDeckState = {
          ...updatedDeck,
          currentCardKey: newCardKey,
        };
      } else {
        finalDeckState = {
          ...updatedDeck,
          currentCardKey: selection.nextCardKey,
        };
      }
    } else {
      finalDeckState = {
        ...updatedDeck,
        currentCardKey: selection.nextCardKey,
      };
    }

    const newStats = calculateDeckStats(finalCardStates, availableWords.length);
    finalDeckState.stats = newStats;

    setCardStates(finalCardStates);
    setDeckState(finalDeckState);
    setSelectionResult(selection);
    setRecentCardKeys(newRecentCards);
  }, [currentCardState, deckState, cardStates, availableWords, config, recentCardKeys]);

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
      stats: calculateDeckStats(freshCards, availableWords.length),
    });

    const selection = selectNextCard(freshCards, freshDeck, availableWords, config, []);
    setSelectionResult(selection);
    setRecentCardKeys([]);

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
        interval: cardState.scheduled_days,
        repetitions: cardState.reps,
        nextReviewDate: new Date(cardState.due)
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

  const cognitiveLoad = useMemo(() => {
    if (deckState.stats.totalIntroduced === 0) return 0;
    return deckState.stats.learningCount / deckState.stats.totalIntroduced;
  }, [deckState.stats]);

  return {
    // Legacy format for UI
    knownWords,
    currentIndex: Math.max(0, currentIndex),
    cognitiveLoad,

    // Learning box state
    source: selectionResult.source,
    allComplete: selectionResult.allComplete,

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
