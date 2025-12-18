// app/review/practice/hooks/usePracticeState.ts
// SRS state management for practice mode - reviews mastered words from all chunks
// Updates are written back to original chunk storage

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  WordData,
  CardState,
  DeckState,
  Grade,
} from "../../../../lib/spacedRepetition/types";
import {
  updateStateOnGrade,
  calculateDeckStats,
} from "../../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../../lib/spacedRepetition/lib/configManager";

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

// Save updated card state back to chunk storage
function saveToChunkStorage(chunkNumber: number, cardKey: string, updatedCard: CardState) {
  const storageKey = `srs_v3_${chunkNumber}_normal`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    const data = JSON.parse(stored);
    data.cardStates[cardKey] = updatedCard;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save to chunk storage:", error);
  }
}

export interface UsePracticeStateReturn {
  knownWords: Array<{ data: WordData; chunkNumber: number }>;
  currentWord: WordData | null;
  currentCardState: CardState | null;
  handleScore: (difficulty: DifficultyRating) => void;
  isLoading: boolean;
  totalMastered: number;
  // New: due cards tracking
  dueCount: number;
  isReviewComplete: boolean;
  // New: practice mode (round-robin after review complete)
  isPracticeMode: boolean;
  startPracticeMode: () => void;
}

export function usePracticeState(
  allWords: WordData[],
  chunkCount: number,
  previewMode: boolean = false  // If true, treat all cards as due for testing
): UsePracticeStateReturn {
  const config = useMemo(() => getMergedConfig(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [masteredWordInfos, setMasteredWordInfos] = useState<MasteredWordInfo[]>([]);
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(new Map());
  const [currentCardKey, setCurrentCardKey] = useState<string | null>(null);

  // Due cards queue (cards that need review)
  const [dueQueue, setDueQueue] = useState<string[]>([]);

  // Practice mode (round-robin after review complete)
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceQueue, setPracticeQueue] = useState<string[]>([]);

  // Create a map from card key to chunk number for saving
  const cardToChunk = useMemo(() => {
    const map = new Map<string, number>();
    masteredWordInfos.forEach(info => {
      map.set(info.word.key, info.chunkNumber);
    });
    return map;
  }, [masteredWordInfos]);

  // Load mastered words and initialize queues
  useEffect(() => {
    if (allWords.length === 0 || chunkCount === 0) return;

    const mastered = loadAllMasteredWords(allWords, chunkCount);
    setMasteredWordInfos(mastered);

    if (mastered.length === 0) {
      setIsLoading(false);
      return;
    }

    // Initialize card states
    const newCardStates = new Map<string, CardState>();
    for (const info of mastered) {
      newCardStates.set(info.word.key, { ...info.cardState });
    }
    setCardStates(newCardStates);

    // Build due queue (cards that are due now, or all cards in preview mode)
    const now = new Date();
    const dueCards: Array<{ key: string; due: Date }> = [];

    for (const info of mastered) {
      const dueDate = new Date(info.cardState.due);
      if (previewMode || dueDate <= now) {
        dueCards.push({ key: info.word.key, due: dueDate });
      }
    }

    // Sort by due date (oldest first)
    dueCards.sort((a, b) => a.due.getTime() - b.due.getTime());
    const queue = dueCards.map(c => c.key);

    setDueQueue(queue);
    setCurrentCardKey(queue[0] || null);
    setIsLoading(false);
  }, [allWords, chunkCount, previewMode]);

  // Get current card state
  const currentCardState = useMemo(() => {
    if (!currentCardKey) return null;
    return cardStates.get(currentCardKey) || null;
  }, [currentCardKey, cardStates]);

  // Get current word
  const currentWord = useMemo(() => {
    if (!currentCardKey) return null;
    const info = masteredWordInfos.find(m => m.word.key === currentCardKey);
    return info?.word || null;
  }, [currentCardKey, masteredWordInfos]);

  // Handle scoring
  const handleScore = useCallback((difficulty: DifficultyRating) => {
    if (!currentCardState || !currentCardKey) return;

    const chunkNumber = cardToChunk.get(currentCardKey);
    if (!chunkNumber) return;

    if (isPracticeMode) {
      // PRACTICE MODE: Round-robin, no SRS updates
      const newQueue = practiceQueue.filter(k => k !== currentCardKey);

      let insertPosition: number;
      switch (difficulty) {
        case 'fail':
          insertPosition = Math.min(2, newQueue.length);
          break;
        case 'hard':
          insertPosition = Math.min(4, newQueue.length);
          break;
        case 'good':
          insertPosition = Math.min(8, newQueue.length);
          break;
        case 'easy':
          insertPosition = newQueue.length;
          break;
      }

      newQueue.splice(insertPosition, 0, currentCardKey);
      const nextKey = newQueue[0] !== currentCardKey ? newQueue[0] : newQueue[1] || newQueue[0];

      setPracticeQueue(newQueue);
      setCurrentCardKey(nextKey);
      return;
    }

    // REVIEW MODE: Update SRS and save to chunk storage
    const grade = difficultyToGrade(difficulty);

    // Create a minimal deck state for updateStateOnGrade
    const deckState: DeckState = {
      currentCardKey,
      consecutiveEasyCount: 0,
      stats: {
        dueCount: dueQueue.length,
        learningCount: 0,
        consolidationCount: 0,
        graduatedCount: masteredWordInfos.length,
        totalIntroduced: masteredWordInfos.length,
        totalAvailable: masteredWordInfos.length,
      },
    };

    const { cardState: updatedCard } = updateStateOnGrade(
      currentCardState,
      deckState,
      grade,
      config
    );

    // Update local state
    const newCardStates = new Map(cardStates);
    newCardStates.set(updatedCard.key, updatedCard);
    setCardStates(newCardStates);

    // Save to original chunk storage (skip in preview mode)
    if (!previewMode) {
      saveToChunkStorage(chunkNumber, currentCardKey, updatedCard);
    }

    // Move to next card in due queue
    const newDueQueue = dueQueue.filter(k => k !== currentCardKey);
    setDueQueue(newDueQueue);

    if (newDueQueue.length > 0) {
      setCurrentCardKey(newDueQueue[0]);
    } else {
      // All due cards reviewed
      setCurrentCardKey(null);
    }

    console.log('Review:', difficulty, 'remaining:', newDueQueue.length);
  }, [currentCardState, currentCardKey, cardStates, dueQueue, cardToChunk, config, isPracticeMode, practiceQueue, masteredWordInfos.length, previewMode]);

  // Start practice mode (round-robin with all cards)
  const startPracticeMode = useCallback(() => {
    // Shuffle all mastered words for practice
    const allKeys = masteredWordInfos.map(m => m.word.key);
    const shuffled = [...allKeys];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setPracticeQueue(shuffled);
    setCurrentCardKey(shuffled[0] || null);
    setIsPracticeMode(true);
  }, [masteredWordInfos]);

  // Convert to format expected by UI
  const knownWords = useMemo(() => {
    return masteredWordInfos.map(info => ({
      data: info.word,
      chunkNumber: info.chunkNumber,
    }));
  }, [masteredWordInfos]);

  const isReviewComplete = dueQueue.length === 0 && !isPracticeMode;

  return {
    knownWords,
    currentWord,
    currentCardState,
    handleScore,
    isLoading,
    totalMastered: masteredWordInfos.length,
    // Due cards tracking
    dueCount: dueQueue.length,
    isReviewComplete,
    // Practice mode
    isPracticeMode,
    startPracticeMode,
  };
}
