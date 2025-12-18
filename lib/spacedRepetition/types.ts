// lib/spacedRepetition/types.ts

import { State } from 'ts-fsrs';

// Re-export FSRS State for convenience
export { State };

// Static word content - never changes
export interface WordData {
  key: string;
  word_key: string;
  img_key: string;
  EnglishWord: string;
  PartOfSpeech: string;
  GeorgianWord: string;
  hint: string;
  priority: string;
  group: string;
  ExampleEnglish1?: string;
  ExampleGeorgian1?: string;
  tips?: string;
}

// Learning phase for session management (Leitner-style)
export type LearningPhase = 'learning' | 'review' | 'graduated';

// Individual card SRS state (FSRS-compatible + learning box)
export interface CardState {
  key: string;                    // Links to WordData.key
  // FSRS fields (for long-term scheduling after graduation)
  due: string;                    // ISO date string - when card is due (FSRS)
  stability: number;              // FSRS stability (days until 90% recall)
  difficulty: number;             // FSRS difficulty (1-10)
  scheduled_days: number;         // Days until next review
  reps: number;                   // Successful review count
  lapses: number;                 // Failed review count (Again)
  state: State;                   // New/Learning/Review/Relearning (FSRS state)
  last_review?: string;           // ISO date string - last review time
  // Learning box fields (for session management)
  learningStep: number;           // Current learning step (0, 1, 2+)
  stepDue: string;                // ISO date string - when current step is due
  phase: LearningPhase;           // Current phase: learning, review, or graduated
  // Custom fields
  introducedAt: string;           // ISO date string - when card was introduced
  lastGrade?: Grade;              // Last grade given (0-3), for UI
  consecutiveEasyCount: number;   // Track consecutive Easy grades for graduation rule
}

// Deck aggregate state
export interface DeckState {
  currentCardKey: string | null;
  consecutiveEasyCount: number;   // Track consecutive Easy grades across all cards
  // Stats for UI
  stats: {
    dueCount: number;             // Review cards due now
    learningCount: number;        // Cards in learning phase
    graduatedCount: number;       // Cards that have graduated
    totalIntroduced: number;      // Total cards introduced
    totalAvailable: number;       // Total cards in deck
  };
}

// SRS Configuration with learning box settings
export interface SRSConfig {
  // Learning box settings
  targetLearningCount: number;    // Target cards in learning box (default: 5)
  learningSteps: number[];        // Learning step intervals in ms (default: [1,2,4,8,16] minutes)
  maxGraduatingIntervalDays: number; // Cap first FSRS interval to this many days (default: 1)
  // Interleaving
  minInterleaveCount: number;     // Minimum cards between repeats (default: 2)
  // Practice mode settings
  almostDueThresholdMs: number;   // "Almost due" threshold in ms (default: 4 hours)
}

export type Grade = 0 | 1 | 2 | 3; // fail | hard | good | easy
export type DifficultyRating = "fail" | "hard" | "good" | "easy";

// Selection result with queue info
export interface SelectNextCardResult {
  nextCardKey: string | null;
  shouldIntroduceNew: boolean;    // True if learning box needs more cards
  source: 'learning' | 'review' | 'practice' | 'new';  // Where the card came from
  allComplete: boolean;           // True if no cards need review (celebration time!)
}

// Legacy CardState type for migration
export interface LegacyCardState {
  key: string;
  stability: number;
  lastReviewStep: number;
  reviewCount: number;
  lapseCount: number;
  introducedAtStep: number;
  lastGrade?: Grade;
}

// Legacy DeckState type for migration
export interface LegacyDeckState {
  currentStep: number;
  currentCardKey: string | null;
  consecutiveEasyCount: number;
  stats: {
    averageRisk: number;
    cardsAtRisk: number;
  };
}

/**
 * Type guard to check if stored state is legacy format
 */
export function isLegacyCardState(state: unknown): state is LegacyCardState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'lastReviewStep' in state &&
    !('due' in state)
  );
}

/**
 * Type guard to check if stored deck state is legacy format
 */
export function isLegacyDeckState(state: unknown): state is LegacyDeckState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'currentStep' in state
  );
}
