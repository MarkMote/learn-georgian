// app/chunks/[chunkId]/hooks/useChunkState.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChunkData, KnownChunkState, DifficultyRating, ReviewMode, ExampleMode, ExplanationMode } from "../types";
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
  return `srs_chunks_v3_${chunkId}_${mode}`;  // v3 for learning box format
}

function saveState(chunkId: string, mode: string, cardStates: Map<string, CardState>, deckState: DeckState) {
  if (typeof window === 'undefined') return;

  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState,
      version: 3,
    };
    localStorage.setItem(getStorageKey(chunkId, mode), JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save SRS state:", error);
  }
}

function loadState(
  chunkId: string,
  mode: string,
  totalAvailable: number
): { cardStates: Map<string, CardState>; deckState: DeckState } | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(getStorageKey(chunkId, mode));
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
export interface UseChunkStateReturn {
  // Legacy format for UI compatibility
  knownChunks: KnownChunkState[];
  currentIndex: number;
  cognitiveLoad: number;

  // Learning box state
  source: SelectNextCardResult['source'];
  allComplete: boolean;

  // UI state
  isFlipped: boolean;
  isLeftHanded: boolean;
  showExamples: ExampleMode;
  showExplanation: ExplanationMode;
  revealedExamples: Set<string>;
  revealedExplanations: Set<string>;

  // Setters
  setIsFlipped: (value: boolean) => void;
  setIsLeftHanded: (value: boolean) => void;
  setShowExamples: (value: ExampleMode | ((prev: ExampleMode) => ExampleMode)) => void;
  setShowExplanation: (value: ExplanationMode | ((prev: ExplanationMode) => ExplanationMode)) => void;
  setRevealedExamples: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setRevealedExplanations: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
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
  const [showExamples, setShowExamples] = useState<ExampleMode>("tap-ka");
  const [showExplanation, setShowExplanation] = useState<ExplanationMode>("on");
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());
  const [revealedExplanations, setRevealedExplanations] = useState<Set<string>>(new Set());

  // Initialize or load saved state
  useEffect(() => {
    if (availableWords.length === 0) return;

    const availableKeys = new Set(availableWords.map(w => w.key));
    const saved = loadState(chunkId, reviewMode, availableWords.length);

    // Check if saved state is compatible with current availableWords
    let useSaved = false;
    if (saved) {
      const validCardCount = Array.from(saved.cardStates.keys()).filter(key => availableKeys.has(key)).length;
      useSaved = validCardCount > 0;

      if (!useSaved) {
        console.log('Saved SRS state incompatible with current words, reinitializing...');
        try {
          localStorage.removeItem(getStorageKey(chunkId, reviewMode));
        } catch (e) {
          console.warn('Failed to clear incompatible state:', e);
        }
      }
    }

    if (useSaved && saved) {
      // Filter cardStates to only include cards that exist in availableWords
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

      // Determine valid currentCardKey
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

    // Reset recent cards on chunk/mode change
    setRecentCardKeys([]);
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
        localStorage.removeItem(getStorageKey(chunkId, reviewMode));
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
    setRevealedExplanations(new Set());
  }, [chunkId, reviewMode, availableWords, config]);

  // Convert to legacy format for UI compatibility
  const knownChunks = useMemo(() => {
    return Array.from(cardStates.entries()).map(([key, cardState]) => {
      const chunk = chunkSet.find(c => c.chunk_key === key);
      if (!chunk) return null;

      const daysSinceReview = cardState.last_review
        ? Math.floor((Date.now() - new Date(cardState.last_review).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        data: chunk,
        rating: 2,
        lastSeen: daysSinceReview,
        interval: cardState.scheduled_days,
        repetitions: cardState.reps,
        easeFactor: 2.5
      };
    }).filter(item => item !== null) as KnownChunkState[];
  }, [cardStates, chunkSet]);

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

  const cognitiveLoad = useMemo(() => {
    if (deckState.stats.totalIntroduced === 0) return 0;
    return deckState.stats.learningCount / deckState.stats.totalIntroduced;
  }, [deckState.stats]);

  return {
    // Legacy format for UI
    knownChunks,
    currentIndex: Math.max(0, currentIndex),
    cognitiveLoad,

    // Learning box state
    source: selectionResult.source,
    allComplete: selectionResult.allComplete,

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
