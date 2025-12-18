// app/review/[chunkId]/hooks/useReviewState.tsx
// SRS state management with Leitner-style learning boxes + FSRS

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  WordData,
  CardState,
  DeckState,
  DifficultyRating,
  Grade,
  SelectNextCardResult,
} from "../../../../lib/spacedRepetition/types";
import {
  initializeDeck,
  updateStateOnGrade,
  selectNextCard,
  introduceNewCard,
  calculateDeckStats,
  DEFAULT_CONFIG,
} from "../../../../lib/spacedRepetition";
import { getMergedConfig } from "../../../../lib/spacedRepetition/lib/configManager";
import { createCardState } from "../../../../lib/spacedRepetition/lib/fsrs";

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
  return `srs_v3_${chunkId}_${mode}`;  // v3 for learning box format
}

function saveState(chunkId: string, mode: string, cardStates: Map<string, CardState>, deckState: DeckState) {
  try {
    const data = {
      cardStates: Object.fromEntries(cardStates),
      deckState,
      version: 3,  // Learning box format
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
      deckState: data.deckState,
    };
  } catch (error) {
    console.warn("Failed to load SRS state:", error);
    return null;
  }
}

// Hook interface
export interface UseReviewStateReturn {
  // Current state
  currentWord: WordData | null;
  currentCardState: CardState | null;
  deckState: DeckState;
  cardStates: Map<string, CardState>;

  // Learning box state
  source: SelectNextCardResult['source'];
  allComplete: boolean;
  isPracticeMode: boolean;

  // Legacy compatibility (for existing UI)
  knownWords: Array<{
    data: WordData;
    rating: number;
    lastSeen: number;
    interval: number;
    repetitions: number;
    easeFactor: number;
  }>;
  currentIndex: number;
  cognitiveLoad: number;
  globalStep: number;

  // Actions
  handleScore: (difficulty: DifficultyRating) => void;
  clearProgress: () => void;
}

export function useReviewState(
  chunkId: string,
  chunkWords: WordData[],
  reviewMode: string = "normal",
  filterPredicate?: (word: WordData) => boolean
): UseReviewStateReturn {
  // Get user-configured or default SRS config
  const config = useMemo(() => getMergedConfig(), []);

  // Filter words based on review mode
  const availableWords = useMemo(() => {
    let filtered = chunkWords;

    // Mode-specific filtering
    if (reviewMode === "examples" || reviewMode === "examples-reverse") {
      filtered = filtered.filter(w => w.ExampleEnglish1 && w.ExampleGeorgian1);
    }

    // Additional filter predicate
    if (filterPredicate) {
      filtered = filtered.filter(filterPredicate);
    }

    return filtered;
  }, [chunkWords, reviewMode, filterPredicate]);

  // Core state
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

  // Practice mode queue (session-only, no persistence)
  // When all cards are graduated and nothing is due, we use simple round-robin
  const [practiceQueue, setPracticeQueue] = useState<string[]>([]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Selection state
  const [selectionResult, setSelectionResult] = useState<SelectNextCardResult>({
    nextCardKey: null,
    shouldIntroduceNew: false,
    source: 'new',
    allComplete: false,
  });

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

      // Calculate selection (with empty recent cards since this is fresh load)
      const selection = selectNextCard(
        filteredCardStates,
        saved.deckState,
        availableWords,
        config,
        [],  // No recent cards on load
        filterPredicate
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
      // Fresh initialization with target learning count
      const { cardStates: initialCards, deckState: initialDeck } = initializeDeck(availableWords, config);
      setCardStates(initialCards);
      setDeckState({
        ...initialDeck,
        stats: calculateDeckStats(initialCards, availableWords.length),
      });

      // Calculate initial selection
      const selection = selectNextCard(initialCards, initialDeck, availableWords, config, [], filterPredicate);
      setSelectionResult(selection);
    }

    // Reset recent cards on mode/chunk change
    setRecentCardKeys([]);
  }, [chunkId, reviewMode, availableWords.length, config, filterPredicate]);

  // Save state when it changes (but not in practice mode)
  useEffect(() => {
    if (cardStates.size > 0 && !isPracticeMode) {
      saveState(chunkId, reviewMode, cardStates, deckState);
    }
  }, [cardStates, deckState, chunkId, reviewMode, isPracticeMode]);

  // Initialize practice queue when entering practice mode
  useEffect(() => {
    if (selectionResult.source === 'practice' && !isPracticeMode) {
      // Entering practice mode - initialize queue with all graduated cards (shuffled)
      const graduatedKeys = Array.from(cardStates.entries())
        .filter(([_, state]) => state.phase === 'graduated' || state.phase === 'consolidation')
        .map(([key, _]) => key);

      // Shuffle the queue
      const shuffled = [...graduatedKeys];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setPracticeQueue(shuffled);
      setIsPracticeMode(true);

      // Set current card to first in queue
      if (shuffled.length > 0) {
        setDeckState(prev => ({ ...prev, currentCardKey: shuffled[0] }));
      }
    } else if (selectionResult.source !== 'practice' && isPracticeMode) {
      // Exiting practice mode
      setIsPracticeMode(false);
      setPracticeQueue([]);
    }
  }, [selectionResult.source, isPracticeMode, cardStates]);

  // Get current word data
  const currentWord = useMemo(() => {
    if (!deckState.currentCardKey) return null;
    return availableWords.find(w => w.key === deckState.currentCardKey) || null;
  }, [deckState.currentCardKey, availableWords]);

  // Get current card state
  const currentCardState = useMemo(() => {
    if (!deckState.currentCardKey) return null;
    return cardStates.get(deckState.currentCardKey) || null;
  }, [deckState.currentCardKey, cardStates]);

  // Handle scoring (main action)
  const handleScore = useCallback((difficulty: DifficultyRating) => {
    if (!currentCardState || !deckState.currentCardKey) return;

    // PRACTICE MODE: Simple round-robin, no SRS updates
    if (isPracticeMode && practiceQueue.length > 0) {
      const currentKey = deckState.currentCardKey;

      // Remove current card from its position
      const newQueue = practiceQueue.filter(k => k !== currentKey);

      // Determine reinsert position based on difficulty
      // fail=2 ahead, hard=4 ahead, good=8 ahead, easy=end (round-robin)
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
          insertPosition = newQueue.length; // End of queue
          break;
      }

      // Insert card at the calculated position
      newQueue.splice(insertPosition, 0, currentKey);

      // Next card is first in queue (after current is removed and reinserted)
      const nextKey = newQueue[0] !== currentKey ? newQueue[0] : newQueue[1] || newQueue[0];

      setPracticeQueue(newQueue);
      setDeckState(prev => ({ ...prev, currentCardKey: nextKey }));

      console.log('Practice mode:', difficulty, 'reinsert at', insertPosition, 'next:', nextKey);
      return;
    }

    // NORMAL MODE: Full SRS logic
    const grade = difficultyToGrade(difficulty);

    // Check if current word is a verb (for special graduation rules)
    const isVerb = currentWord?.PartOfSpeech?.toLowerCase().includes('verb') &&
                   !currentWord?.PartOfSpeech?.toLowerCase().includes('adverb');

    // Update card and deck with learning box logic
    const { cardState: updatedCard, deckState: updatedDeck } = updateStateOnGrade(
      currentCardState,
      deckState,
      grade,
      config,
      isVerb ?? false
    );

    // Update card states
    const newCardStates = new Map(cardStates);
    newCardStates.set(updatedCard.key, updatedCard);

    // Add current card to recent list (for interleaving)
    const newRecentCards = [...recentCardKeys, deckState.currentCardKey];
    // Keep only last N cards (based on minInterleaveCount + buffer)
    const maxRecent = Math.max(config.minInterleaveCount + 2, 5);
    if (newRecentCards.length > maxRecent) {
      newRecentCards.shift();
    }

    // Select next card
    const selection = selectNextCard(
      newCardStates,
      updatedDeck,
      availableWords,
      config,
      newRecentCards,
      filterPredicate
    );

    let finalCardStates = newCardStates;
    let finalDeckState = updatedDeck;

    // Introduce new card if needed
    if (selection.shouldIntroduceNew) {
      const { cardStates: cardsWithNew, newCardKey } = introduceNewCard(
        newCardStates,
        updatedDeck,
        availableWords
      );

      if (newCardKey) {
        finalCardStates = cardsWithNew;
        // If introducing new card, show it next
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

    // Calculate updated stats
    const newStats = calculateDeckStats(finalCardStates, availableWords.length);
    finalDeckState.stats = newStats;

    // Debug logging
    console.log('Grade applied:', difficulty, 'phase:', updatedCard.phase, 'step:', updatedCard.learningStep);
    console.log('Selection:', selection.source, 'next:', finalDeckState.currentCardKey);

    // Update state
    setCardStates(finalCardStates);
    setDeckState(finalDeckState);
    setSelectionResult(selection);
    setRecentCardKeys(newRecentCards);
  }, [currentCardState, currentWord, deckState, cardStates, availableWords, filterPredicate, config, recentCardKeys, isPracticeMode, practiceQueue]);

  // Clear progress
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(chunkId, reviewMode));
    } catch (error) {
      console.warn("Failed to clear stored state:", error);
    }

    const { cardStates: freshCards, deckState: freshDeck } = initializeDeck(availableWords, config);
    setCardStates(freshCards);
    setDeckState({
      ...freshDeck,
      stats: calculateDeckStats(freshCards, availableWords.length),
    });

    const selection = selectNextCard(freshCards, freshDeck, availableWords, config, [], filterPredicate);
    setSelectionResult(selection);
    setRecentCardKeys([]);
  }, [chunkId, reviewMode, availableWords, config, filterPredicate]);

  // Legacy compatibility - convert to old format for existing UI
  const knownWords = useMemo(() => {
    const now = new Date();
    return Array.from(cardStates.entries()).map(([key, cardState]) => {
      const wordData = availableWords.find(w => w.key === key);
      if (!wordData) return null;

      const daysSinceReview = cardState.last_review
        ? Math.floor((now.getTime() - new Date(cardState.last_review).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        data: wordData,
        rating: cardState.lastGrade ?? 2,
        lastSeen: daysSinceReview,
        interval: cardState.scheduled_days,
        repetitions: cardState.reps,
        easeFactor: 2.5, // Legacy field - not used
      };
    }).filter(item => item !== null);
  }, [cardStates, availableWords]);

  const currentIndex = knownWords.findIndex(item => item.data.key === deckState.currentCardKey);

  // Calculate cognitive load as percentage of learning cards
  const cognitiveLoad = useMemo(() => {
    if (deckState.stats.totalIntroduced === 0) return 0;
    return deckState.stats.learningCount / deckState.stats.totalIntroduced;
  }, [deckState.stats]);

  return {
    // Current state
    currentWord,
    currentCardState,
    deckState,
    cardStates,

    // Learning box state
    source: selectionResult.source,
    allComplete: selectionResult.allComplete,
    isPracticeMode,

    // Legacy compatibility
    knownWords,
    currentIndex: Math.max(0, currentIndex),
    cognitiveLoad,
    globalStep: deckState.stats.totalIntroduced,

    // Actions
    handleScore,
    clearProgress,
  };
}
