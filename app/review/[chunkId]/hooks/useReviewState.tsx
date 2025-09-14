import { useCallback, useMemo } from "react";
import { WordData, DifficultyRating, ReviewMode } from "../types";
import { useSpacedRepetition } from "../../../../lib/spacedRepetition/adapters/reviewAdapter";
import { useUIState } from "./useUIState";
import { Grade } from "../../../../lib/spacedRepetition/algorithm";

// Convert difficulty rating to SRS grade
function difficultyToGrade(difficulty: DifficultyRating): Grade {
  switch (difficulty) {
    case "fail": return 0;
    case "hard": return 1;
    case "good": return 2;
    case "easy": return 3;
  }
}

// Check if word is a verb
function isVerb(word: WordData): boolean {
  const pos = (word.PartOfSpeech || "").toLowerCase();
  return pos.includes("verb") && !pos.includes("adverb");
}

export function useReviewState(
  chunkId: string,
  chunkWords: WordData[],
  reviewMode: ReviewMode = "normal"
) {
  // UI state (completely separate from SRS logic)
  const uiState = useUIState({ chunkId, mode: reviewMode });

  // Filter function based on UI preferences
  const filterPredicate = useMemo(() => {
    if (uiState.skipVerbs) {
      return (word: WordData) => !isVerb(word);
    }
    return undefined;
  }, [uiState.skipVerbs]);

  // Mode-specific filtering
  const availableWords = useMemo(() => {
    if (reviewMode === "examples" || reviewMode === "examples-reverse") {
      return chunkWords.filter(w => w.ExampleEnglish1 && w.ExampleGeorgian1);
    }
    return chunkWords;
  }, [chunkWords, reviewMode]);

  // Spaced repetition state
  const {
    currentCard,
    deck,
    currentIndex: srsCurrentIndex,
    stats,
    handleReview: srsHandleReview,
    resetProgress: srsResetProgress,
    consecutiveEasy
  } = useSpacedRepetition({
    chunkId,
    mode: reviewMode,
    availableItems: availableWords,
    getItemKey: (word: WordData) => word.key,
    filterPredicate
  });

  // Handle score and update UI
  const handleScore = useCallback((difficulty: DifficultyRating) => {
    const grade = difficultyToGrade(difficulty);
    srsHandleReview(grade);
    uiState.resetCardDisplay();
  }, [srsHandleReview, uiState]);

  // Clear progress
  const clearProgress = useCallback(() => {
    srsResetProgress();
    uiState.resetCardDisplay();
  }, [srsResetProgress, uiState]);

  // Convert to legacy format for UI (temporary compatibility layer)
  const knownWords = useMemo(() => {
    return deck.cards.map((card, idx) => ({
      data: card.data,
      rating: 2, // Default for compatibility
      lastSeen: deck.globalStep - card.lastStep,
      interval: Math.round(card.stability),
      repetitions: card.seen,
      easeFactor: 2.5, // Legacy field
      exampleIndex: 0
    }));
  }, [deck]);

  const currentIndex = deck.cards.findIndex(c => c === currentCard);

  return {
    // Core data
    knownWords,
    currentIndex: currentIndex >= 0 ? currentIndex : 0,

    // Statistics
    cognitiveLoad: stats.averageRisk,
    globalStep: deck.globalStep,
    consecutiveEasyCount: consecutiveEasy,

    // UI state (delegated)
    ...uiState,

    // Actions
    handleScore,
    clearProgress,

    // Debug/info
    reviewMode,

    // Raw SRS state for debug panel
    deck,
    srsCurrentIndex
  };
}