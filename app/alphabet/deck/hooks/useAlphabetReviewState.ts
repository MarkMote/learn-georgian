// app/alphabet/deck/hooks/useAlphabetReviewState.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import { AlphabetData, DifficultyRating, KnownLetterState } from "../types";
import {
  WordData,
  CardState,
  DeckState,
  Grade,
  SelectNextCardResult,
} from "../../../../lib/spacedRepetition/types";
import {
  initializeDeck,
  updateStateOnGrade,
  selectNextCard,
  introduceNewCard,
  calculateDeckStats,
} from "../../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../../lib/spacedRepetition/lib/configManager";
import { createCardState } from "../../../../lib/spacedRepetition/lib/fsrs";

// Convert AlphabetData to WordData format
function alphabetToWordData(letter: AlphabetData): WordData {
  return {
    key: letter.key,
    word_key: letter.key,
    img_key: "",
    EnglishWord: letter.englishLetter,
    PartOfSpeech: "",
    GeorgianWord: letter.georgianLetter,
    hint: letter.explanation,
    priority: "1",
    group: "alphabet",
    ExampleEnglish1: letter.englishExample || "",
    ExampleGeorgian1: letter.georgianExample || ""
  };
}

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
function getStorageKey(): string {
  return 'srs_alphabet_v3';  // v3 for learning box format
}

function saveState(cardStates: Map<string, CardState>, deckState: DeckState) {
  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState,
      version: 3,
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save SRS state:", error);
  }
}

function loadState(totalAvailable: number): { cardStates: Map<string, CardState>; deckState: DeckState } | null {
  try {
    const stored = localStorage.getItem(getStorageKey());
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
export interface UseAlphabetReviewStateReturn {
  // Legacy format for UI compatibility
  knownLetters: KnownLetterState[];
  currentIndex: number;
  currentLetter: KnownLetterState | null;
  cognitiveLoad: number;
  letterProgress: { unlocked: number; total: number };

  // Learning box state
  source: SelectNextCardResult['source'];
  allComplete: boolean;

  // Debug state
  cardStates: Map<string, CardState>;
  deckState: DeckState;
  currentCardState: CardState | null;

  // UI state
  isFlipped: boolean;
  isLeftHanded: boolean;

  // Setters
  setIsFlipped: (value: boolean) => void;
  setIsLeftHanded: (value: boolean) => void;

  // Actions
  handleScore: (difficulty: DifficultyRating) => void;
  handleFlip: () => void;
  clearProgress: () => void;
}

export function useAlphabetReviewState(
  allLetters: AlphabetData[]
): UseAlphabetReviewStateReturn {
  // Get user-configured or default SRS config
  const config = useMemo(() => getMergedConfig(), []);

  // Convert letters to WordData format
  const availableWords = useMemo(() => {
    return allLetters.map(alphabetToWordData);
  }, [allLetters]);

  // Core SRS state
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(new Map());
  const [deckState, setDeckState] = useState<DeckState>(() => ({
    currentCardKey: null,
    consecutiveEasyCount: 0,
    stats: {
      dueCount: 0,
      learningCount: 0,
      consolidationCount: 0,
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
  const [isLeftHanded, setIsLeftHanded] = useState(false);

  // Initialize or load saved state
  useEffect(() => {
    if (availableWords.length === 0) return;

    const availableKeys = new Set(availableWords.map(w => w.key));
    const saved = loadState(availableWords.length);

    let useSaved = false;
    if (saved) {
      const validCardCount = Array.from(saved.cardStates.keys()).filter(key => availableKeys.has(key)).length;
      useSaved = validCardCount > 0;

      if (!useSaved) {
        console.log('Saved SRS state incompatible with current letters, reinitializing...');
        try {
          localStorage.removeItem(getStorageKey());
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

    // Reset recent cards on load
    setRecentCardKeys([]);
  }, [availableWords.length, config]);

  // Save state when it changes
  useEffect(() => {
    if (cardStates.size > 0) {
      saveState(cardStates, deckState);
    }
  }, [cardStates, deckState]);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
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
    setIsFlipped(false);
  }, [currentCardState, deckState, cardStates, availableWords, config, recentCardKeys]);

  // Handle flip
  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  // Clear progress
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.warn("Failed to clear stored state:", error);
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
  }, [availableWords, config]);

  // Convert to legacy format for UI compatibility
  const knownLetters = useMemo(() => {
    return Array.from(cardStates.entries()).map(([key, cardState]) => {
      const letter = allLetters.find(l => l.key === key);
      if (!letter) return null;

      return {
        data: letter,
        repetitions: cardState.reps,
        easeFactor: 2.5,
        interval: cardState.scheduled_days,
        nextReview: new Date(cardState.due).getTime(),
        lastReview: cardState.last_review ? new Date(cardState.last_review).getTime() : Date.now(),
        difficulty: "good" as DifficultyRating
      };
    }).filter(item => item !== null) as KnownLetterState[];
  }, [cardStates, allLetters]);

  const currentIndex = knownLetters.findIndex(item => item.data.key === deckState.currentCardKey);
  const currentLetter = currentIndex >= 0 ? knownLetters[currentIndex] : null;

  // Calculate letter progress
  const letterProgress = useMemo(() => {
    const unlocked = knownLetters.filter(letter => letter.repetitions > 0).length;
    return { unlocked, total: knownLetters.length };
  }, [knownLetters]);

  const cognitiveLoad = useMemo(() => {
    if (deckState.stats.totalIntroduced === 0) return 0;
    return deckState.stats.learningCount / deckState.stats.totalIntroduced;
  }, [deckState.stats]);

  return {
    // Legacy format for UI
    knownLetters,
    currentIndex: Math.max(0, currentIndex),
    currentLetter,
    cognitiveLoad,
    letterProgress,

    // Learning box state
    source: selectionResult.source,
    allComplete: selectionResult.allComplete,

    // Debug state
    cardStates,
    deckState,
    currentCardState,

    // UI state
    isFlipped,
    isLeftHanded,

    // Setters
    setIsFlipped,
    setIsLeftHanded,

    // Actions
    handleScore,
    handleFlip,
    clearProgress
  };
}
