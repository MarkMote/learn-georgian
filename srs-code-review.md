# Spaced Repetition System - Full Source Code

## Overview
This is an FSRS-based spaced repetition system for a language learning app.

---

## `lib/spacedRepetition/types.ts`

```typescript
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

// Individual card SRS state (FSRS-compatible)
export interface CardState {
  key: string;                    // Links to WordData.key
  // FSRS fields
  due: string;                    // ISO date string - when card is due
  stability: number;              // FSRS stability (days until 90% recall)
  difficulty: number;             // FSRS difficulty (1-10)
  scheduled_days: number;         // Days until next review
  reps: number;                   // Successful review count
  lapses: number;                 // Failed review count (Again)
  state: State;                   // New/Learning/Review/Relearning
  last_review?: string;           // ISO date string - last review time
  // Custom fields
  introducedAt: string;           // ISO date string - when card was introduced
  lastGrade?: Grade;              // Last grade given (0-3), for UI
}

// Deck aggregate state
export interface DeckState {
  currentCardKey: string | null;
  consecutiveEasyCount: number;
  // Stats for UI
  stats: {
    dueCount: number;             // Cards due now
    newCount: number;             // Introduced but never reviewed
    learningCount: number;        // Cards in learning state
    totalIntroduced: number;      // Total cards introduced
    totalAvailable: number;       // Total cards in deck
  };
}

// SRS Configuration (simplified - FSRS handles most params)
export interface SRSConfig {
  // Card introduction thresholds
  maxConsecutiveEasy: number;     // Introduce new card after N easy grades (default: 3)
  // Practice mode settings
  almostDueThresholdMs: number;   // "Almost due" threshold in ms (default: 4 hours)
}

export type Grade = 0 | 1 | 2 | 3; // fail | hard | good | easy
export type DifficultyRating = "fail" | "hard" | "good" | "easy";

// Selection result with practice mode info
export interface SelectNextCardResult {
  nextCardKey: string | null;
  shouldIntroduceNew: boolean;
  isDueReview: boolean;           // True if card is actually due
  isPracticeMode: boolean;        // True if all due done, user continuing
  milestoneReached?: 'all_due_complete' | 'set_mastered';
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
```

---

## `lib/spacedRepetition/config.ts`

```typescript
// lib/spacedRepetition/config.ts

import { SRSConfig } from './types';

export const DEFAULT_CONFIG: SRSConfig = {
  // Card introduction: introduce new card after 3 consecutive easy grades
  maxConsecutiveEasy: 3,

  // Practice mode: consider cards "almost due" if within 4 hours
  almostDueThresholdMs: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
};
```

---

## `lib/spacedRepetition/lib/fsrs.ts`

```typescript
// lib/spacedRepetition/lib/fsrs.ts
// FSRS wrapper - provides simplified interface to ts-fsrs library

import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card as FSRSCard,
  type FSRSParameters,
  type RecordLogItem,
} from 'ts-fsrs';
import type { CardState } from '../types';

// Re-export types we need
export { Rating, State };
export type { FSRSCard, FSRSParameters, RecordLogItem };

/**
 * Convert our CardState to FSRS Card format
 */
export function cardStateToFSRSCard(cardState: CardState): FSRSCard {
  const dueDate = new Date(cardState.due);
  const lastReview = cardState.last_review ? new Date(cardState.last_review) : undefined;

  // Calculate elapsed_days from last_review
  let elapsed_days = 0;
  if (lastReview) {
    elapsed_days = Math.floor((Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    due: dueDate,
    stability: cardState.stability,
    difficulty: cardState.difficulty,
    elapsed_days,
    scheduled_days: cardState.scheduled_days,
    reps: cardState.reps,
    lapses: cardState.lapses,
    state: cardState.state as State,
    last_review: lastReview,
    learning_steps: 0, // Not tracked in our CardState, default to 0
  };
}

// Create singleton FSRS instance with default parameters
let fsrsInstance = fsrs({});

/**
 * Get the FSRS instance
 */
export function getFSRS(): ReturnType<typeof fsrs> {
  return fsrsInstance;
}

/**
 * Update FSRS parameters (for user customization)
 */
export function updateFSRSParams(params: Partial<FSRSParameters>): void {
  fsrsInstance = fsrs(params);
}

/**
 * Create a new FSRS card (for when a card is introduced)
 */
export function createNewCard(now: Date = new Date()): FSRSCard {
  return createEmptyCard(now);
}

/**
 * Grade a card and get the updated state
 * @param card Current card state
 * @param grade Rating (1=Again, 2=Hard, 3=Good, 4=Easy)
 * @param now Current time
 * @returns Updated card and review log
 */
export function gradeCard(
  card: FSRSCard,
  grade: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy,
  now: Date = new Date()
): RecordLogItem {
  return fsrsInstance.next(card, now, grade);
}

/**
 * Get retrievability (probability of recall) for a card
 * @param card The card to check (can be FSRSCard or CardState)
 * @param now Current time
 * @returns Retrievability as a number between 0 and 1
 */
export function getRetrievability(card: FSRSCard | CardState, now: Date = new Date()): number {
  // Convert CardState to FSRSCard if needed
  const fsrsCard = 'key' in card ? cardStateToFSRSCard(card as CardState) : card;
  return fsrsInstance.get_retrievability(fsrsCard, now, false);
}

/**
 * Check if a card is due for review
 * @param card The card to check
 * @param now Current time
 * @returns true if the card is due
 */
export function isCardDue(card: FSRSCard, now: Date = new Date()): boolean {
  return card.due <= now;
}

/**
 * Convert our Grade (0-3) to FSRS Rating (1-4)
 * Our system: 0=fail, 1=hard, 2=good, 3=easy
 * FSRS: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
export function gradeToRating(grade: 0 | 1 | 2 | 3): Rating.Again | Rating.Hard | Rating.Good | Rating.Easy {
  switch (grade) {
    case 0: return Rating.Again;
    case 1: return Rating.Hard;
    case 2: return Rating.Good;
    case 3: return Rating.Easy;
  }
}

/**
 * Convert FSRS Rating (1-4) to our Grade (0-3)
 */
export function ratingToGrade(rating: Rating): 0 | 1 | 2 | 3 {
  switch (rating) {
    case Rating.Again: return 0;
    case Rating.Hard: return 1;
    case Rating.Good: return 2;
    case Rating.Easy: return 3;
    default: return 2; // Default to good for Manual rating
  }
}

/**
 * Get time until card is due (in milliseconds)
 * Negative means overdue
 */
export function getTimeUntilDue(card: FSRSCard, now: Date = new Date()): number {
  return card.due.getTime() - now.getTime();
}

/**
 * Check if card is "almost due" (within threshold)
 * @param card The card to check
 * @param thresholdMs Time threshold in milliseconds (default 4 hours)
 * @param now Current time
 */
export function isCardAlmostDue(
  card: FSRSCard,
  thresholdMs: number = 4 * 60 * 60 * 1000, // 4 hours
  now: Date = new Date()
): boolean {
  const timeUntilDue = getTimeUntilDue(card, now);
  return timeUntilDue > 0 && timeUntilDue <= thresholdMs;
}
```

---

## `lib/spacedRepetition/lib/configManager.ts`

```typescript
// lib/spacedRepetition/lib/configManager.ts

import { SRSConfig } from '../types';
import { DEFAULT_CONFIG } from '../config';

export interface UserConfigOverride {
  maxConsecutiveEasy: number;
  almostDueThresholdMs: number;
}

const CONFIG_STORAGE_KEY = 'srs_config_override';

export function saveUserConfig(config: UserConfigOverride): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}

export function loadUserConfig(): UserConfigOverride | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load user SRS config:', error);
    return null;
  }
}

export function clearUserConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }
}

export function getMergedConfig(): SRSConfig {
  const userConfig = loadUserConfig();

  if (!userConfig) {
    return DEFAULT_CONFIG;
  }

  // Apply user overrides to default config
  return {
    ...DEFAULT_CONFIG,
    maxConsecutiveEasy: userConfig.maxConsecutiveEasy,
    almostDueThresholdMs: userConfig.almostDueThresholdMs,
  };
}

export function getDefaultUserConfig(): UserConfigOverride {
  return {
    maxConsecutiveEasy: DEFAULT_CONFIG.maxConsecutiveEasy,
    almostDueThresholdMs: DEFAULT_CONFIG.almostDueThresholdMs,
  };
}
```

---

## `lib/spacedRepetition/initializeDeck.ts`

```typescript
// lib/spacedRepetition/initializeDeck.ts

import { WordData, CardState, DeckState } from './types';
import { createNewCard } from './lib/fsrs';
import { State } from 'ts-fsrs';

/**
 * Convert FSRS card to our CardState format
 */
function fsrsCardToCardState(key: string, now: Date): CardState {
  const fsrsCard = createNewCard(now);
  return {
    key,
    due: fsrsCard.due.toISOString(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    scheduled_days: fsrsCard.scheduled_days,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: fsrsCard.state,
    last_review: fsrsCard.last_review?.toISOString(),
    introducedAt: now.toISOString(),
  };
}

/**
 * Initialize deck with first card
 */
export function initializeDeck(
  availableWords: WordData[]
): { cardStates: Map<string, CardState>; deckState: DeckState } {
  const cardStates = new Map<string, CardState>();
  const now = new Date();

  // Start with first word if available
  if (availableWords.length > 0) {
    const firstWord = availableWords[0];
    cardStates.set(firstWord.key, fsrsCardToCardState(firstWord.key, now));
  }

  const deckState: DeckState = {
    currentCardKey: availableWords.length > 0 ? availableWords[0].key : null,
    consecutiveEasyCount: 0,
    stats: {
      dueCount: availableWords.length > 0 ? 1 : 0, // First card is due immediately
      newCount: availableWords.length > 0 ? 1 : 0, // First card is new
      learningCount: 0,
      totalIntroduced: availableWords.length > 0 ? 1 : 0,
      totalAvailable: availableWords.length,
    },
  };

  return { cardStates, deckState };
}
```

---

## `lib/spacedRepetition/introduceNewCard.ts`

```typescript
// lib/spacedRepetition/introduceNewCard.ts

import { CardState, DeckState, WordData } from './types';
import { createNewCard } from './lib/fsrs';

/**
 * Convert FSRS card to our CardState format
 */
function fsrsCardToCardState(key: string, now: Date): CardState {
  const fsrsCard = createNewCard(now);
  return {
    key,
    due: fsrsCard.due.toISOString(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    scheduled_days: fsrsCard.scheduled_days,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: fsrsCard.state,
    last_review: fsrsCard.last_review?.toISOString(),
    introducedAt: now.toISOString(),
  };
}

/**
 * Introduce a new card to the deck
 */
export function introduceNewCard(
  cardStates: Map<string, CardState>,
  deckState: DeckState,
  availableWords: WordData[]
): { cardStates: Map<string, CardState>; newCardKey: string | null } {
  // Find next word to introduce
  const existingKeys = new Set(cardStates.keys());
  const nextWord = availableWords.find(word => !existingKeys.has(word.key));

  if (!nextWord) {
    return { cardStates, newCardKey: null };
  }

  const now = new Date();

  // Create new card state using FSRS
  const newCardState = fsrsCardToCardState(nextWord.key, now);

  // Add to card states
  const updatedCardStates = new Map(cardStates);
  updatedCardStates.set(nextWord.key, newCardState);

  return {
    cardStates: updatedCardStates,
    newCardKey: nextWord.key,
  };
}
```

---

## `lib/spacedRepetition/updateStateOnGrade.ts`

```typescript
// lib/spacedRepetition/updateStateOnGrade.ts

import { CardState, DeckState, Grade } from './types';
import { gradeCard, gradeToRating } from './lib/fsrs';
import type { Card as FSRSCard } from 'ts-fsrs';

/**
 * Convert our CardState to FSRS Card format
 */
function cardStateToFSRS(cardState: CardState): FSRSCard {
  return {
    due: new Date(cardState.due),
    stability: cardState.stability,
    difficulty: cardState.difficulty,
    elapsed_days: 0, // Deprecated, but required
    scheduled_days: cardState.scheduled_days,
    learning_steps: 0,
    reps: cardState.reps,
    lapses: cardState.lapses,
    state: cardState.state,
    last_review: cardState.last_review ? new Date(cardState.last_review) : undefined,
  };
}

/**
 * Convert FSRS Card back to our CardState format
 */
function fsrsToCardState(fsrsCard: FSRSCard, key: string, introducedAt: string, grade: Grade): CardState {
  return {
    key,
    due: fsrsCard.due.toISOString(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    scheduled_days: fsrsCard.scheduled_days,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: fsrsCard.state,
    last_review: fsrsCard.last_review?.toISOString(),
    introducedAt,
    lastGrade: grade,
  };
}

/**
 * Update card and deck state on grade using FSRS
 */
export function updateStateOnGrade(
  cardState: CardState,
  deckState: DeckState,
  grade: Grade
): { cardState: CardState; deckState: DeckState } {
  const now = new Date();

  // Convert to FSRS format and get next state
  const fsrsCard = cardStateToFSRS(cardState);
  const rating = gradeToRating(grade);
  const result = gradeCard(fsrsCard, rating, now);

  // Convert back to our format
  const updatedCard = fsrsToCardState(
    result.card,
    cardState.key,
    cardState.introducedAt,
    grade
  );

  // Update deck state
  const updatedDeck: DeckState = {
    ...deckState,
    consecutiveEasyCount: grade === 3 ? deckState.consecutiveEasyCount + 1 : 0,
    // Stats will be recalculated by caller
  };

  return {
    cardState: updatedCard,
    deckState: updatedDeck,
  };
}
```

---

## `lib/spacedRepetition/selectNextCard.ts`

```typescript
// lib/spacedRepetition/selectNextCard.ts

import { CardState, DeckState, WordData, SRSConfig, SelectNextCardResult } from './types';

/**
 * Select next card to show using FSRS due-date based selection
 *
 * Priority:
 * 1. Due cards (due <= now), sorted by oldest due first
 * 2. Almost-due cards if no due cards
 * 3. If all cards mastered (none due): practice mode (weakest stability first)
 *
 * New card introduction:
 * - Only after consecutive easy ratings (maxConsecutiveEasy threshold)
 * - Never when there are due/learning cards to review
 */
export function selectNextCard(
  cardStates: Map<string, CardState>,
  deckState: DeckState,
  availableWords: WordData[],
  config: SRSConfig,
  filterPredicate?: (word: WordData) => boolean
): SelectNextCardResult {
  const now = new Date();

  // No cards introduced yet - need to introduce first card
  if (cardStates.size === 0) {
    return {
      nextCardKey: null,
      shouldIntroduceNew: true,
      isDueReview: false,
      isPracticeMode: false,
    };
  }

  // Build word lookup map for efficiency
  const wordByKey = new Map(availableWords.map(w => [w.key, w]));

  // Partition cards into due, almost-due, and not-due
  const dueCards: Array<{ key: string; due: Date; stability: number }> = [];
  const almostDueCards: Array<{ key: string; due: Date; stability: number }> = [];
  const notDueCards: Array<{ key: string; due: Date; stability: number }> = [];

  cardStates.forEach((cardState, key) => {
    // Check if word passes filter
    const word = wordByKey.get(key);
    if (!word || (filterPredicate && !filterPredicate(word))) {
      return; // Skip filtered cards
    }

    const due = new Date(cardState.due);
    const cardInfo = { key, due, stability: cardState.stability };

    if (due <= now) {
      dueCards.push(cardInfo);
    } else if (due.getTime() - now.getTime() <= config.almostDueThresholdMs) {
      almostDueCards.push(cardInfo);
    } else {
      notDueCards.push(cardInfo);
    }
  });

  // Check if all cards have been introduced
  const allIntroduced = cardStates.size >= availableWords.length;

  // Case 1: Have due cards - return oldest due first
  if (dueCards.length > 0) {
    // Sort by due date (oldest first)
    dueCards.sort((a, b) => a.due.getTime() - b.due.getTime());

    // Only introduce new card after consecutive easy ratings
    // This prevents overwhelming the learner with new cards when struggling
    const shouldIntroduceNew = !allIntroduced &&
      deckState.consecutiveEasyCount >= config.maxConsecutiveEasy;

    return {
      nextCardKey: dueCards[0].key,
      shouldIntroduceNew,
      isDueReview: true,
      isPracticeMode: false,
    };
  }

  // Case 2: No due cards but have almost-due cards - show those
  if (almostDueCards.length > 0) {
    almostDueCards.sort((a, b) => a.due.getTime() - b.due.getTime());

    // Only introduce new if consecutive easy AND not too many almost-due
    const shouldIntroduceNew = !allIntroduced &&
      deckState.consecutiveEasyCount >= config.maxConsecutiveEasy &&
      almostDueCards.length <= 2;

    return {
      nextCardKey: almostDueCards[0].key,
      shouldIntroduceNew,
      isDueReview: false,
      isPracticeMode: false,
    };
  }

  // Case 3: No due or almost-due cards, but not all introduced
  // Only introduce new card if user has demonstrated mastery (consecutive easy threshold)
  // OR if we have very few cards (bootstrap phase)
  if (!allIntroduced) {
    const allCards = Array.from(cardStates.values());
    allCards.sort((a, b) => {
      const aTime = a.last_review ? new Date(a.last_review).getTime() : new Date(a.introducedAt).getTime();
      const bTime = b.last_review ? new Date(b.last_review).getTime() : new Date(b.introducedAt).getTime();
      return bTime - aTime;
    });

    // Only introduce new if:
    // - Bootstrap phase (fewer than 3 cards) OR
    // - User hit consecutive easy threshold
    const shouldIntroduce = cardStates.size < 3 ||
      deckState.consecutiveEasyCount >= config.maxConsecutiveEasy;

    return {
      nextCardKey: allCards[0]?.key || null,
      shouldIntroduceNew: shouldIntroduce,
      isDueReview: false,
      isPracticeMode: !shouldIntroduce, // Practice mode if not introducing
      milestoneReached: shouldIntroduce ? undefined : 'all_due_complete',
    };
  }

  // Case 4: All cards introduced, none due (mastery/practice mode)
  // For continued practice: prioritize weakest cards (lowest stability)
  const allNonDueCards = [...notDueCards];
  allNonDueCards.sort((a, b) => a.stability - b.stability);

  if (allNonDueCards.length === 0) {
    // Edge case: all cards filtered out
    return {
      nextCardKey: null,
      shouldIntroduceNew: false,
      isDueReview: false,
      isPracticeMode: true,
      milestoneReached: 'set_mastered',
    };
  }

  return {
    nextCardKey: allNonDueCards[0].key,
    shouldIntroduceNew: false,
    isDueReview: false,
    isPracticeMode: true,
    milestoneReached: 'all_due_complete',
  };
}
```

---

## `lib/spacedRepetition/calculateDeckStats.ts`

```typescript
// lib/spacedRepetition/calculateDeckStats.ts

import { CardState, DeckState } from './types';
import { State } from 'ts-fsrs';

/**
 * Calculate deck statistics
 */
export function calculateDeckStats(
  cardStates: Map<string, CardState>,
  totalAvailable: number
): DeckState['stats'] {
  const now = new Date();

  if (cardStates.size === 0) {
    return {
      dueCount: 0,
      newCount: 0,
      learningCount: 0,
      totalIntroduced: 0,
      totalAvailable,
    };
  }

  let dueCount = 0;
  let newCount = 0;
  let learningCount = 0;

  cardStates.forEach((cardState) => {
    const due = new Date(cardState.due);

    // Count due cards
    if (due <= now) {
      dueCount++;
    }

    // Count by state
    if (cardState.state === State.New) {
      newCount++;
    } else if (cardState.state === State.Learning || cardState.state === State.Relearning) {
      learningCount++;
    }
  });

  return {
    dueCount,
    newCount,
    learningCount,
    totalIntroduced: cardStates.size,
    totalAvailable,
  };
}
```

---

## `lib/spacedRepetition/index.ts`

```typescript
// lib/spacedRepetition/index.ts

// Export types
export type {
  WordData,
  CardState,
  DeckState,
  SRSConfig,
  Grade,
  DifficultyRating,
  SelectNextCardResult,
  LegacyCardState,
  LegacyDeckState,
} from './types';

// Export type guards
export {
  isLegacyCardState,
  isLegacyDeckState,
  State,
} from './types';

// Export configuration
export { DEFAULT_CONFIG } from './config';

// Export main SRS functions
export { initializeDeck } from './initializeDeck';
export { updateStateOnGrade } from './updateStateOnGrade';
export { selectNextCard } from './selectNextCard';
export { introduceNewCard } from './introduceNewCard';
export { calculateDeckStats } from './calculateDeckStats';

// Export FSRS utilities
export {
  Rating,
  gradeToRating,
  ratingToGrade,
  isCardDue,
  getRetrievability,
} from './lib/fsrs';
```

