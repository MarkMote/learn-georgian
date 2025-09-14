// app/chunks/[chunkId]/hooks/useChunkState.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChunkData, KnownChunkState, DifficultyRating, ReviewMode } from "../types";
import { WordData, CardState, DeckState, Grade } from "../../../../lib/spacedRepetition/types";
import {
  initializeDeck,
  updateStateOnGrade,
  selectNextCard,
  introduceNewCard,
  calculateDeckStats,
} from "../../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../../lib/spacedRepetition/lib/configManager";

// Convert ChunkData to WordData format
function chunkToWordData(chunk: ChunkData): WordData {
  return {
    key: chunk.chunk_key,
    word_key: chunk.chunk_key,
    img_key: "",
    EnglishWord: chunk.chunk_en,
    PartOfSpeech: "",
    GeorgianWord: chunk.chunk_ka,
    hint: chunk.explanation || "",
    priority: "1",
    group: "chunk",
    ExampleEnglish1: chunk.example_en || "",
    ExampleGeorgian1: chunk.example_ka || ""
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
function getStorageKey(chunkId: string, mode: string): string {
  return `srs_chunks_${chunkId}_${mode}`;
}

function saveState(chunkId: string, mode: string, cardStates: Map<string, CardState>, deckState: DeckState) {
  if (typeof window === 'undefined') return;

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
  if (typeof window === 'undefined') return null;

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
export interface UseChunkStateReturn {
  // Legacy format for UI compatibility
  knownChunks: KnownChunkState[];
  currentIndex: number;
  cognitiveLoad: number;

  // UI state
  isFlipped: boolean;
  isLeftHanded: boolean;
  showExamples: "off" | "on" | "tap";
  showExplanation: "off" | "on" | "tap";
  revealedExamples: Set<string>;
  revealedExplanations: Set<string>;

  // Setters
  setIsFlipped: (value: boolean) => void;
  setIsLeftHanded: (value: boolean) => void;
  setShowExamples: (value: "off" | "on" | "tap") => void;
  setShowExplanation: (value: "off" | "on" | "tap") => void;
  setRevealedExamples: (value: Set<string>) => void;
  setRevealedExplanations: (value: Set<string>) => void;
  setCurrentIndex: (value: number) => void;

  // Actions
  handleScore: (difficulty: DifficultyRating) => void;
  clearProgress: () => void;
}

export function useChunkState(
  chunkId: string,
  chunkSet: ChunkData[],
  reviewMode: ReviewMode = "normal"
): UseChunkStateReturn {
  // Get user-configured or default SRS config
  const config = useMemo(() => getMergedConfig(), []);

  // Convert chunks to WordData format
  const availableWords = useMemo(() => {
    let filtered = chunkSet.map(chunkToWordData);

    // Mode-specific filtering
    if (reviewMode === "examples" || reviewMode === "examples-reverse") {
      filtered = filtered.filter(w => w.ExampleEnglish1 && w.ExampleGeorgian1);
    }

    return filtered;
  }, [chunkSet, reviewMode]);

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
  const [showExamples, setShowExamples] = useState<"off" | "on" | "tap">("off");
  const [showExplanation, setShowExplanation] = useState<"off" | "on" | "tap">("off");
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [revealedExplanations, setRevealedExplanations] = useState<Set<string>>(new Set());

  // Initialize or load saved state
  useEffect(() => {
    if (availableWords.length === 0) return;

    const saved = loadState(chunkId, reviewMode);
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
  }, [chunkId, reviewMode, availableWords.length, config]);

  // Save state when it changes
  useEffect(() => {
    if (cardStates.size > 0) {
      saveState(chunkId, reviewMode, cardStates, deckState);
    }
  }, [cardStates, deckState, chunkId, reviewMode]);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setRevealedExamples(new Set());
    setRevealedExplanations(new Set());
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
        localStorage.removeItem(getStorageKey(chunkId, reviewMode));
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
    setRevealedExplanations(new Set());
  }, [chunkId, reviewMode, availableWords, config]);

  // Convert to legacy format for UI compatibility
  const knownChunks = useMemo(() => {
    return Array.from(cardStates.entries()).map(([key, cardState]) => {
      const chunk = chunkSet.find(c => c.chunk_key === key);
      if (!chunk) return null;

      return {
        data: chunk,
        rating: 2,
        lastSeen: deckState.currentStep - cardState.lastReviewStep,
        interval: cardState.stability,
        repetitions: cardState.reviewCount,
        easeFactor: 2.5
      };
    }).filter(item => item !== null) as KnownChunkState[];
  }, [cardStates, chunkSet, deckState.currentStep]);

  const currentIndex = knownChunks.findIndex(item => item.data.chunk_key === deckState.currentCardKey);

  const setCurrentIndex = useCallback((index: number) => {
    if (index >= 0 && index < knownChunks.length) {
      const newCardKey = knownChunks[index].data.chunk_key;
      setDeckState(prev => ({
        ...prev,
        currentCardKey: newCardKey
      }));
    }
  }, [knownChunks]);

  return {
    // Legacy format for UI
    knownChunks,
    currentIndex: Math.max(0, currentIndex),
    cognitiveLoad: deckState.stats.averageRisk,

    // UI state
    isFlipped,
    isLeftHanded,
    showExamples,
    showExplanation,
    revealedExamples,
    revealedExplanations,

    // Setters
    setIsFlipped,
    setIsLeftHanded,
    setShowExamples,
    setShowExplanation,
    setRevealedExamples,
    setRevealedExplanations,
    setCurrentIndex,

    // Actions
    handleScore,
    clearProgress
  };
}