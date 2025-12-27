// app/structure/[moduleId]/hooks/useStructureState.ts

import { useState, useEffect, useCallback, useMemo } from "react";
import { FrameData, FrameExampleData, KnownExampleState, DifficultyRating, ReviewMode } from "../types";
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

// Convert FrameExampleData to WordData format for SRS
function exampleToWordData(example: FrameExampleData): WordData {
  return {
    key: example.example_id,
    word_key: example.example_id,
    img_key: "",
    EnglishWord: example.english,
    PartOfSpeech: "",
    GeorgianWord: example.georgian,
    hint: example.context,
    priority: "1",
    group: example.frame_id,
  };
}

function difficultyToGrade(difficulty: DifficultyRating): Grade {
  switch (difficulty) {
    case "fail": return 0;
    case "hard": return 1;
    case "good": return 2;
    case "easy": return 3;
  }
}

function getStorageKey(moduleId: string, mode: string): string {
  return `srs_structure_v3_${moduleId}_${mode}`;
}

function saveState(
  moduleId: string,
  mode: string,
  cardStates: Map<string, CardState>,
  deckState: DeckState
) {
  if (typeof window === 'undefined') return;

  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState,
      version: 3,
    };
    localStorage.setItem(getStorageKey(moduleId, mode), JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save SRS state:", error);
  }
}

function loadState(
  moduleId: string,
  mode: string,
  totalAvailable: number
): { cardStates: Map<string, CardState>; deckState: DeckState } | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(getStorageKey(moduleId, mode));
    if (!stored) return null;

    const data = JSON.parse(stored);

    if (data.version !== 3) {
      console.log("Old SRS format detected, resetting progress");
      return null;
    }

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

export interface UseStructureStateReturn {
  knownExamples: KnownExampleState[];
  currentIndex: number;
  cognitiveLoad: number;
  source: SelectNextCardResult['source'];
  allComplete: boolean;

  isFlipped: boolean;
  setIsFlipped: (value: boolean) => void;

  handleScore: (difficulty: DifficultyRating) => void;
  clearProgress: () => void;

  deckState: DeckState;
  cardStates: Map<string, CardState>;
  currentCardState: CardState | null;
}

export function useStructureState(
  moduleId: string,
  moduleExamples: FrameExampleData[],
  frameLookup: Map<string, FrameData>,
  reviewMode: ReviewMode = "normal"
): UseStructureStateReturn {
  const config = useMemo(() => getMergedConfig(), []);

  const availableWords = useMemo(() => {
    return moduleExamples.map(exampleToWordData);
  }, [moduleExamples]);

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

  const [recentCardKeys, setRecentCardKeys] = useState<string[]>([]);
  const [selectionResult, setSelectionResult] = useState<SelectNextCardResult>({
    nextCardKey: null,
    shouldIntroduceNew: false,
    source: 'new',
    allComplete: false,
  });

  const [isFlipped, setIsFlipped] = useState(false);

  // Initialize or load saved state
  useEffect(() => {
    if (availableWords.length === 0) return;

    const availableKeys = new Set(availableWords.map(w => w.key));
    const saved = loadState(moduleId, reviewMode, availableWords.length);

    let useSaved = false;
    if (saved) {
      const validCardCount = Array.from(saved.cardStates.keys()).filter(key => availableKeys.has(key)).length;
      useSaved = validCardCount > 0;

      if (!useSaved) {
        console.log('Saved SRS state incompatible with current examples, reinitializing...');
        try {
          localStorage.removeItem(getStorageKey(moduleId, reviewMode));
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
        []
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

    setRecentCardKeys([]);
  }, [moduleId, reviewMode, availableWords.length, config]);

  // Save state when it changes
  useEffect(() => {
    if (cardStates.size > 0) {
      saveState(moduleId, reviewMode, cardStates, deckState);
    }
  }, [cardStates, deckState, moduleId, reviewMode]);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [deckState.currentCardKey]);

  const currentCardState = useMemo(() => {
    if (!deckState.currentCardKey) return null;
    return cardStates.get(deckState.currentCardKey) || null;
  }, [deckState.currentCardKey, cardStates]);

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

  const clearProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(getStorageKey(moduleId, reviewMode));
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
  }, [moduleId, reviewMode, availableWords, config]);

  // Convert to KnownExampleState format for UI
  const knownExamples = useMemo(() => {
    return Array.from(cardStates.entries()).map(([key, cardState]) => {
      const example = moduleExamples.find(ex => ex.example_id === key);
      if (!example) return null;

      const frame = frameLookup.get(example.frame_id);
      if (!frame) return null;

      const daysSinceReview = cardState.last_review
        ? Math.floor((Date.now() - new Date(cardState.last_review).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        data: example,
        frame: frame,
        rating: 2,
        lastSeen: daysSinceReview,
        interval: cardState.scheduled_days,
        repetitions: cardState.reps,
        easeFactor: 2.5
      };
    }).filter(item => item !== null) as KnownExampleState[];
  }, [cardStates, moduleExamples, frameLookup]);

  const currentIndex = knownExamples.findIndex(
    item => item.data.example_id === deckState.currentCardKey
  );

  const cognitiveLoad = useMemo(() => {
    if (deckState.stats.totalIntroduced === 0) return 0;
    return deckState.stats.learningCount / deckState.stats.totalIntroduced;
  }, [deckState.stats]);

  return {
    knownExamples,
    currentIndex: Math.max(0, currentIndex),
    cognitiveLoad,
    source: selectionResult.source,
    allComplete: selectionResult.allComplete,

    isFlipped,
    setIsFlipped,

    handleScore,
    clearProgress,

    deckState,
    cardStates,
    currentCardState,
  };
}
