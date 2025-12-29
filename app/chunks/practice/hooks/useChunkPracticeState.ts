// app/chunks/practice/hooks/useChunkPracticeState.ts
// SRS state management for chunk practice mode - reviews mastered phrases from all sets
// Updates are written back to original chunk storage

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CardState,
  DeckState,
  Grade,
} from "../../../../lib/spacedRepetition/types";
import {
  updateStateOnGrade,
} from "../../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../../lib/spacedRepetition/lib/configManager";

type DifficultyRating = "fail" | "hard" | "good" | "easy";

type ChunkData = {
  chunk_key: string;
  chunk_en: string;
  chunk_ka: string;
  explanation: string;
  example_en: string;
  example_ka: string;
};

// Convert difficulty rating to grade
function difficultyToGrade(difficulty: DifficultyRating): Grade {
  switch (difficulty) {
    case "fail": return 0;
    case "hard": return 1;
    case "good": return 2;
    case "easy": return 3;
  }
}

interface MasteredChunkInfo {
  chunk: ChunkData;
  cardState: CardState;
  setNumber: number;
}

type ReviewMode = 'normal' | 'reverse' | 'examples' | 'examples-reverse';

const CHUNK_SIZE = 50;

// Load mastered chunks from all sets
function loadAllMasteredChunks(allChunks: ChunkData[], setCount: number, mode: ReviewMode): MasteredChunkInfo[] {
  const masteredChunks: MasteredChunkInfo[] = [];

  for (let setNumber = 1; setNumber <= setCount; setNumber++) {
    const storageKey = `srs_chunks_v3_${setNumber}_${mode}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) continue;

      const data = JSON.parse(stored);
      const cardStates = data.cardStates || {};

      // Get chunks for this set
      const startIndex = (setNumber - 1) * CHUNK_SIZE;
      const endIndex = startIndex + CHUNK_SIZE;
      const setChunks = allChunks.slice(startIndex, endIndex);

      for (const [cardKey, cardState] of Object.entries(cardStates)) {
        const state = cardState as CardState;
        // Include graduated and consolidation chunks
        if (state.phase === 'graduated' || state.phase === 'consolidation') {
          const chunk = setChunks.find(c => c.chunk_key === cardKey);
          if (chunk) {
            masteredChunks.push({
              chunk,
              cardState: state,
              setNumber,
            });
          }
        }
      }
    } catch {
      continue;
    }
  }

  return masteredChunks;
}

// Save updated card state back to set storage
function saveToSetStorage(setNumber: number, cardKey: string, updatedCard: CardState, mode: ReviewMode) {
  const storageKey = `srs_chunks_v3_${setNumber}_${mode}`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    const data = JSON.parse(stored);
    data.cardStates[cardKey] = updatedCard;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save to set storage:", error);
  }
}

export interface UseChunkPracticeStateReturn {
  knownChunks: Array<{ data: ChunkData; setNumber: number }>;
  currentChunk: ChunkData | null;
  currentCardState: CardState | null;
  handleScore: (difficulty: DifficultyRating) => void;
  isLoading: boolean;
  totalMastered: number;
  // Due cards tracking
  dueCount: number;
  isReviewComplete: boolean;
  // Practice mode (round-robin after review complete)
  isPracticeMode: boolean;
  startPracticeMode: () => void;
}

export function useChunkPracticeState(
  allChunks: ChunkData[],
  setCount: number,
  previewMode: boolean = false,
  reviewMode: ReviewMode = 'reverse'
): UseChunkPracticeStateReturn {
  const config = useMemo(() => getMergedConfig(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [masteredChunkInfos, setMasteredChunkInfos] = useState<MasteredChunkInfo[]>([]);
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(new Map());
  const [currentCardKey, setCurrentCardKey] = useState<string | null>(null);

  // Due cards queue (cards that need review)
  const [dueQueue, setDueQueue] = useState<string[]>([]);

  // Practice mode (round-robin after review complete)
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceQueue, setPracticeQueue] = useState<string[]>([]);

  // Create a map from card key to set number for saving
  const cardToSet = useMemo(() => {
    const map = new Map<string, number>();
    masteredChunkInfos.forEach(info => {
      map.set(info.chunk.chunk_key, info.setNumber);
    });
    return map;
  }, [masteredChunkInfos]);

  // Load mastered chunks and initialize queues
  useEffect(() => {
    if (allChunks.length === 0 || setCount === 0) return;

    const mastered = loadAllMasteredChunks(allChunks, setCount, reviewMode);
    setMasteredChunkInfos(mastered);

    if (mastered.length === 0) {
      setIsLoading(false);
      return;
    }

    // Initialize card states
    const newCardStates = new Map<string, CardState>();
    for (const info of mastered) {
      newCardStates.set(info.chunk.chunk_key, { ...info.cardState });
    }
    setCardStates(newCardStates);

    // Build due queue (cards that are due now, or all cards in preview mode)
    const now = new Date();
    const dueCards: Array<{ key: string; due: Date }> = [];

    for (const info of mastered) {
      const dueDate = new Date(info.cardState.due);
      if (previewMode || dueDate <= now) {
        dueCards.push({ key: info.chunk.chunk_key, due: dueDate });
      }
    }

    // Sort by due date (oldest first)
    dueCards.sort((a, b) => a.due.getTime() - b.due.getTime());
    const queue = dueCards.map(c => c.key);

    setDueQueue(queue);
    setCurrentCardKey(queue[0] || null);
    setIsLoading(false);
  }, [allChunks, setCount, previewMode, reviewMode]);

  // Get current card state
  const currentCardState = useMemo(() => {
    if (!currentCardKey) return null;
    return cardStates.get(currentCardKey) || null;
  }, [currentCardKey, cardStates]);

  // Get current chunk
  const currentChunk = useMemo(() => {
    if (!currentCardKey) return null;
    const info = masteredChunkInfos.find(m => m.chunk.chunk_key === currentCardKey);
    return info?.chunk || null;
  }, [currentCardKey, masteredChunkInfos]);

  // Handle scoring
  const handleScore = useCallback((difficulty: DifficultyRating) => {
    if (!currentCardState || !currentCardKey) return;

    const setNumber = cardToSet.get(currentCardKey);
    if (!setNumber) return;

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

    // REVIEW MODE: Update SRS and save to set storage
    const grade = difficultyToGrade(difficulty);

    // Create a minimal deck state for updateStateOnGrade
    const deckState: DeckState = {
      currentCardKey,
      consecutiveEasyCount: 0,
      stats: {
        dueCount: dueQueue.length,
        learningCount: 0,
        consolidationCount: 0,
        graduatedCount: masteredChunkInfos.length,
        totalIntroduced: masteredChunkInfos.length,
        totalAvailable: masteredChunkInfos.length,
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

    // Save to original set storage (skip in preview mode)
    if (!previewMode) {
      saveToSetStorage(setNumber, currentCardKey, updatedCard, reviewMode);
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
  }, [currentCardState, currentCardKey, cardStates, dueQueue, cardToSet, config, isPracticeMode, practiceQueue, masteredChunkInfos.length, previewMode, reviewMode]);

  // Start practice mode (round-robin with all cards)
  const startPracticeMode = useCallback(() => {
    // Shuffle all mastered chunks for practice
    const allKeys = masteredChunkInfos.map(m => m.chunk.chunk_key);
    const shuffled = [...allKeys];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setPracticeQueue(shuffled);
    setCurrentCardKey(shuffled[0] || null);
    setIsPracticeMode(true);
  }, [masteredChunkInfos]);

  // Convert to format expected by UI
  const knownChunks = useMemo(() => {
    return masteredChunkInfos.map(info => ({
      data: info.chunk,
      setNumber: info.setNumber,
    }));
  }, [masteredChunkInfos]);

  const isReviewComplete = dueQueue.length === 0 && !isPracticeMode;

  return {
    knownChunks,
    currentChunk,
    currentCardState,
    handleScore,
    isLoading,
    totalMastered: masteredChunkInfos.length,
    // Due cards tracking
    dueCount: dueQueue.length,
    isReviewComplete,
    // Practice mode
    isPracticeMode,
    startPracticeMode,
  };
}
