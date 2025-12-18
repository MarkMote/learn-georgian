// app/review/practice/hooks/usePracticeState.ts
// SRS state management for practice mode - reviews mastered words from all chunks

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  WordData,
  CardState,
  DeckState,
  Grade,
  SelectNextCardResult,
} from "../../../../lib/spacedRepetition/types";
import {
  updateStateOnGrade,
  selectNextCard,
  calculateDeckStats,
} from "../../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../../lib/spacedRepetition/lib/configManager";
import { createCardState } from "../../../../lib/spacedRepetition/lib/fsrs";

type DifficultyRating = "fail" | "hard" | "good" | "easy";

// Convert difficulty rating to grade
function difficultyToGrade(difficulty: DifficultyRating): Grade {
  switch (difficulty) {
    case "fail": return 0;
    case "hard": return 1;
    case "good": return 2;
    case "easy": return 3;
  }
}

// Storage key for practice deck
const PRACTICE_STORAGE_KEY = "srs_v3_practice_review";

function saveState(cardStates: Map<string, CardState>, deckState: DeckState) {
  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState,
      version: 3,
    };
    localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save practice state:", error);
  }
}

function loadState(): { cardStates: Map<string, CardState>; deckState: DeckState } | null {
  try {
    const stored = localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (data.version !== 3) return null;

    return {
      cardStates: new Map(Object.entries(data.cardStates)),
      deckState: data.deckState,
    };
  } catch {
    return null;
  }
}

interface MasteredWordInfo {
  word: WordData;
  cardState: CardState;
  chunkNumber: number;
}

// Load mastered words from all chunks
function loadAllMasteredWords(allWords: WordData[], chunkCount: number): MasteredWordInfo[] {
  const CHUNK_SIZE = 50;
  const masteredWords: MasteredWordInfo[] = [];

  // Get unique word keys
  const seen = new Set<string>();
  const uniqueWordKeys: string[] = [];
  for (const word of allWords) {
    if (!seen.has(word.word_key)) {
      seen.add(word.word_key);
      uniqueWordKeys.push(word.word_key);
    }
  }

  for (let chunkNumber = 1; chunkNumber <= chunkCount; chunkNumber++) {
    const storageKey = `srs_v3_${chunkNumber}_normal`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) continue;

      const data = JSON.parse(stored);
      const cardStates = data.cardStates || {};

      // Get words for this chunk
      const startIndex = (chunkNumber - 1) * CHUNK_SIZE;
      const endIndex = startIndex + CHUNK_SIZE;
      const chunkWordKeys = new Set(uniqueWordKeys.slice(startIndex, endIndex));
      const chunkWords = allWords.filter(word => chunkWordKeys.has(word.word_key));

      for (const [cardKey, cardState] of Object.entries(cardStates)) {
        const state = cardState as CardState;
        // Include graduated and consolidation words
        if (state.phase === 'graduated' || state.phase === 'consolidation') {
          const word = chunkWords.find(w => w.key === cardKey);
          if (word) {
            masteredWords.push({
              word,
              cardState: state,
              chunkNumber,
            });
          }
        }
      }
    } catch {
      continue;
    }
  }

  return masteredWords;
}

export interface UsePracticeStateReturn {
  knownWords: Array<{ data: WordData; chunkNumber: number }>;
  currentIndex: number;
  currentWord: WordData | null;
  currentCardState: CardState | null;
  deckState: DeckState;
  source: SelectNextCardResult['source'];
  handleScore: (difficulty: DifficultyRating) => void;
  clearProgress: () => void;
  isLoading: boolean;
  totalMastered: number;
}

export function usePracticeState(
  allWords: WordData[],
  chunkCount: number
): UsePracticeStateReturn {
  const config = useMemo(() => getMergedConfig(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [masteredWordInfos, setMasteredWordInfos] = useState<MasteredWordInfo[]>([]);
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(new Map());
  const [deckState, setDeckState] = useState<DeckState>({
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
  });
  const [recentCardKeys, setRecentCardKeys] = useState<string[]>([]);
  const [selectionResult, setSelectionResult] = useState<SelectNextCardResult>({
    nextCardKey: null,
    shouldIntroduceNew: false,
    source: 'practice',
    allComplete: false,
  });

  // Load mastered words and initialize deck
  useEffect(() => {
    if (allWords.length === 0 || chunkCount === 0) return;

    const mastered = loadAllMasteredWords(allWords, chunkCount);
    setMasteredWordInfos(mastered);

    if (mastered.length === 0) {
      setIsLoading(false);
      return;
    }

    // Create WordData array for the practice deck
    const practiceWords = mastered.map(m => m.word);

    // Initialize card states for practice - all cards start as "graduated" (practice mode)
    const newCardStates = new Map<string, CardState>();
    const now = new Date();

    for (const info of mastered) {
      // Copy the card state but ensure it's in graduated phase for practice
      newCardStates.set(info.word.key, {
        ...info.cardState,
        // Keep the original state - we're just reviewing them
      });
    }

    setCardStates(newCardStates);

    // Calculate initial stats
    const stats = calculateDeckStats(newCardStates, practiceWords.length);

    // Select first card
    const initialDeckState: DeckState = {
      currentCardKey: null,
      consecutiveEasyCount: 0,
      stats,
    };

    const selection = selectNextCard(
      newCardStates,
      initialDeckState,
      practiceWords,
      config,
      []
    );

    setDeckState({
      ...initialDeckState,
      currentCardKey: selection.nextCardKey || (practiceWords.length > 0 ? practiceWords[0].key : null),
    });
    setSelectionResult(selection);
    setIsLoading(false);
  }, [allWords, chunkCount, config]);

  // Save state when it changes
  useEffect(() => {
    if (cardStates.size > 0) {
      saveState(cardStates, deckState);
    }
  }, [cardStates, deckState]);

  // Get current card state
  const currentCardState = useMemo(() => {
    if (!deckState.currentCardKey) return null;
    return cardStates.get(deckState.currentCardKey) || null;
  }, [deckState.currentCardKey, cardStates]);

  // Get available words for the practice deck
  const availableWords = useMemo(() => {
    return masteredWordInfos.map(m => m.word);
  }, [masteredWordInfos]);

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

    const finalDeckState: DeckState = {
      ...updatedDeck,
      currentCardKey: selection.nextCardKey,
      stats: calculateDeckStats(newCardStates, availableWords.length),
    };

    setCardStates(newCardStates);
    setDeckState(finalDeckState);
    setSelectionResult(selection);
    setRecentCardKeys(newRecentCards);
  }, [currentCardState, deckState, cardStates, availableWords, config, recentCardKeys]);

  // Clear progress
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(PRACTICE_STORAGE_KEY);
    } catch {
      // Ignore
    }
    // Reload to reset state
    window.location.reload();
  }, []);

  // Convert to format expected by UI
  const knownWords = useMemo(() => {
    return masteredWordInfos
      .filter(info => cardStates.has(info.word.key))
      .map(info => ({
        data: info.word,
        chunkNumber: info.chunkNumber,
      }));
  }, [masteredWordInfos, cardStates]);

  const currentIndex = knownWords.findIndex(item => item.data.key === deckState.currentCardKey);
  const currentWord = currentIndex >= 0 ? knownWords[currentIndex]?.data : null;

  return {
    knownWords,
    currentIndex: Math.max(0, currentIndex),
    currentWord,
    currentCardState,
    deckState,
    source: selectionResult.source,
    handleScore,
    clearProgress,
    isLoading,
    totalMastered: masteredWordInfos.length,
  };
}
