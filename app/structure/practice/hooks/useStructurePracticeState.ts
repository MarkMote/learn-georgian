// app/structure/practice/hooks/useStructurePracticeState.ts
// SRS state management for structure practice mode - reviews mastered examples from all modules

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
import { FrameData, FrameExampleData, DifficultyRating, ReviewMode } from "../../[moduleId]/types";
import { MODULES } from "../../[moduleId]/utils/modules";

function difficultyToGrade(difficulty: DifficultyRating): Grade {
  switch (difficulty) {
    case "fail": return 0;
    case "hard": return 1;
    case "good": return 2;
    case "easy": return 3;
  }
}

interface MasteredExampleInfo {
  example: FrameExampleData;
  frame: FrameData;
  cardState: CardState;
  moduleId: number;
}

function loadAllMasteredExamples(
  allExamples: FrameExampleData[],
  frames: FrameData[],
  frameLookup: Map<string, FrameData>,
  mode: ReviewMode
): MasteredExampleInfo[] {
  const masteredExamples: MasteredExampleInfo[] = [];

  for (const mod of MODULES) {
    const storageKey = `srs_structure_v3_${mod.id}_${mode}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) continue;

      const data = JSON.parse(stored);
      const cardStates = data.cardStates || {};

      for (const [cardKey, cardState] of Object.entries(cardStates)) {
        const state = cardState as CardState;
        if (state.phase === 'graduated' || state.phase === 'consolidation') {
          const example = allExamples.find(ex => ex.example_id === cardKey);
          if (example) {
            const frame = frameLookup.get(example.frame_id);
            if (frame) {
              masteredExamples.push({
                example,
                frame,
                cardState: state,
                moduleId: mod.id,
              });
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  return masteredExamples;
}

function saveToModuleStorage(moduleId: number, cardKey: string, updatedCard: CardState, mode: ReviewMode) {
  const storageKey = `srs_structure_v3_${moduleId}_${mode}`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    const data = JSON.parse(stored);
    data.cardStates[cardKey] = updatedCard;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save to module storage:", error);
  }
}

export interface UseStructurePracticeStateReturn {
  knownExamples: Array<{ example: FrameExampleData; frame: FrameData; moduleId: number }>;
  currentExample: FrameExampleData | null;
  currentFrame: FrameData | null;
  currentCardState: CardState | null;
  handleScore: (difficulty: DifficultyRating) => void;
  isLoading: boolean;
  totalMastered: number;
  dueCount: number;
  isReviewComplete: boolean;
  isPracticeMode: boolean;
  startPracticeMode: () => void;
}

export function useStructurePracticeState(
  allExamples: FrameExampleData[],
  frames: FrameData[],
  frameLookup: Map<string, FrameData>,
  previewMode: boolean = false,
  mode: ReviewMode = 'reverse'
): UseStructurePracticeStateReturn {
  const config = useMemo(() => getMergedConfig(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [masteredInfos, setMasteredInfos] = useState<MasteredExampleInfo[]>([]);
  const [cardStates, setCardStates] = useState<Map<string, CardState>>(new Map());
  const [currentCardKey, setCurrentCardKey] = useState<string | null>(null);

  const [dueQueue, setDueQueue] = useState<string[]>([]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceQueue, setPracticeQueue] = useState<string[]>([]);

  const cardToModule = useMemo(() => {
    const map = new Map<string, number>();
    masteredInfos.forEach(info => {
      map.set(info.example.example_id, info.moduleId);
    });
    return map;
  }, [masteredInfos]);

  // Load mastered examples
  useEffect(() => {
    if (allExamples.length === 0 || frames.length === 0) return;

    const mastered = loadAllMasteredExamples(allExamples, frames, frameLookup, mode);
    setMasteredInfos(mastered);

    if (mastered.length === 0) {
      setIsLoading(false);
      return;
    }

    const newCardStates = new Map<string, CardState>();
    for (const info of mastered) {
      newCardStates.set(info.example.example_id, { ...info.cardState });
    }
    setCardStates(newCardStates);

    const now = new Date();
    const dueCards: Array<{ key: string; due: Date }> = [];

    for (const info of mastered) {
      const dueDate = new Date(info.cardState.due);
      if (previewMode || dueDate <= now) {
        dueCards.push({ key: info.example.example_id, due: dueDate });
      }
    }

    dueCards.sort((a, b) => a.due.getTime() - b.due.getTime());
    const queue = dueCards.map(c => c.key);

    setDueQueue(queue);
    setCurrentCardKey(queue[0] || null);
    setIsLoading(false);
  }, [allExamples, frames, frameLookup, previewMode, mode]);

  const currentCardState = useMemo(() => {
    if (!currentCardKey) return null;
    return cardStates.get(currentCardKey) || null;
  }, [currentCardKey, cardStates]);

  const currentExample = useMemo(() => {
    if (!currentCardKey) return null;
    const info = masteredInfos.find(m => m.example.example_id === currentCardKey);
    return info?.example || null;
  }, [currentCardKey, masteredInfos]);

  const currentFrame = useMemo(() => {
    if (!currentCardKey) return null;
    const info = masteredInfos.find(m => m.example.example_id === currentCardKey);
    return info?.frame || null;
  }, [currentCardKey, masteredInfos]);

  const handleScore = useCallback((difficulty: DifficultyRating) => {
    if (!currentCardState || !currentCardKey) return;

    const moduleId = cardToModule.get(currentCardKey);
    if (!moduleId) return;

    if (isPracticeMode) {
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

    const grade = difficultyToGrade(difficulty);

    const deckState: DeckState = {
      currentCardKey,
      consecutiveEasyCount: 0,
      stats: {
        dueCount: dueQueue.length,
        learningCount: 0,
        consolidationCount: 0,
        graduatedCount: masteredInfos.length,
        totalIntroduced: masteredInfos.length,
        totalAvailable: masteredInfos.length,
      },
    };

    const { cardState: updatedCard } = updateStateOnGrade(
      currentCardState,
      deckState,
      grade,
      config
    );

    const newCardStates = new Map(cardStates);
    newCardStates.set(updatedCard.key, updatedCard);
    setCardStates(newCardStates);

    if (!previewMode) {
      saveToModuleStorage(moduleId, currentCardKey, updatedCard, mode);
    }

    const newDueQueue = dueQueue.filter(k => k !== currentCardKey);
    setDueQueue(newDueQueue);

    if (newDueQueue.length > 0) {
      setCurrentCardKey(newDueQueue[0]);
    } else {
      setCurrentCardKey(null);
    }
  }, [currentCardState, currentCardKey, cardStates, dueQueue, cardToModule, config, isPracticeMode, practiceQueue, masteredInfos.length, previewMode, mode]);

  const startPracticeMode = useCallback(() => {
    const allKeys = masteredInfos.map(m => m.example.example_id);
    const shuffled = [...allKeys];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setPracticeQueue(shuffled);
    setCurrentCardKey(shuffled[0] || null);
    setIsPracticeMode(true);
  }, [masteredInfos]);

  const knownExamples = useMemo(() => {
    return masteredInfos.map(info => ({
      example: info.example,
      frame: info.frame,
      moduleId: info.moduleId,
    }));
  }, [masteredInfos]);

  const isReviewComplete = dueQueue.length === 0 && !isPracticeMode;

  return {
    knownExamples,
    currentExample,
    currentFrame,
    currentCardState,
    handleScore,
    isLoading,
    totalMastered: masteredInfos.length,
    dueCount: dueQueue.length,
    isReviewComplete,
    isPracticeMode,
    startPracticeMode,
  };
}
