// app/morphology/deck/hooks/useMorphologyReviewState.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import { MorphologyData, DifficultyRating, KnownMarkerState } from "../types";
import { WordData, CardState, DeckState, Grade } from "../../../../lib/spacedRepetition/types";
import {
  initializeDeck,
  updateStateOnGrade,
  selectNextCard,
  introduceNewCard,
  calculateDeckStats,
} from "../../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../../lib/spacedRepetition/lib/configManager";

// Convert MorphologyData to WordData format
function morphologyToWordData(marker: MorphologyData): WordData {
  return {
    key: marker.key,
    word_key: marker.key,
    img_key: "",
    EnglishWord: marker.meaning,
    PartOfSpeech: marker.markerType,
    GeorgianWord: marker.marker,
    hint: "",
    priority: "1",
    group: "morphology",
    ExampleEnglish1: "",
    ExampleGeorgian1: marker.example1
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
  return 'srs_morphology';
}

function saveState(cardStates: Map<string, CardState>, deckState: DeckState) {
  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save SRS state:", error);
  }
}

function loadState(): { cardStates: Map<string, CardState>; deckState: DeckState } | null {
  try {
    const stored = localStorage.getItem(getStorageKey());
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
export interface UseMorphologyReviewStateReturn {
  // Legacy format for UI compatibility
  knownMarkers: KnownMarkerState[];
  currentIndex: number;
  currentMarker: KnownMarkerState | null;
  cognitiveLoad: number;
  markerProgress: { unlocked: number; total: number };

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

export function useMorphologyReviewState(
  allMarkers: MorphologyData[]
): UseMorphologyReviewStateReturn {
  // Get user-configured or default SRS config
  const config = useMemo(() => getMergedConfig(), []);

  // Convert markers to WordData format
  const availableWords = useMemo(() => {
    return allMarkers.map(morphologyToWordData);
  }, [allMarkers]);

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
  const [isLeftHanded, setIsLeftHanded] = useState(false);

  // Initialize or load saved state
  useEffect(() => {
    if (availableWords.length === 0) return;

    const saved = loadState();
    if (saved) {
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
    setIsFlipped(false);
  }, [currentCardState, deckState, cardStates, availableWords, config]);

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
      stats: calculateDeckStats(freshCards, freshDeck, config)
    });

    // Reset UI state
    setIsFlipped(false);
  }, [availableWords, config]);

  // Convert to legacy format for UI compatibility
  const knownMarkers = useMemo(() => {
    return Array.from(cardStates.entries()).map(([key, cardState]) => {
      const marker = allMarkers.find(m => m.key === key);
      if (!marker) return null;

      return {
        data: marker,
        repetitions: cardState.reviewCount,
        easeFactor: 2.5, // Legacy field
        interval: cardState.stability,
        nextReview: Date.now() + cardState.stability * 86400000,
        lastReview: Date.now() - (deckState.currentStep - cardState.lastReviewStep) * 86400000,
        difficulty: "good" as DifficultyRating // Default
      };
    }).filter(item => item !== null) as KnownMarkerState[];
  }, [cardStates, allMarkers, deckState.currentStep]);

  const currentIndex = knownMarkers.findIndex(item => item.data.key === deckState.currentCardKey);
  const currentMarker = currentIndex >= 0 ? knownMarkers[currentIndex] : null;

  // Calculate marker progress
  const markerProgress = useMemo(() => {
    const unlocked = knownMarkers.filter(marker => marker.repetitions > 0).length;
    return { unlocked, total: knownMarkers.length };
  }, [knownMarkers]);

  return {
    // Legacy format for UI
    knownMarkers,
    currentIndex: Math.max(0, currentIndex),
    currentMarker,
    cognitiveLoad: deckState.stats.averageRisk,
    markerProgress,

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
