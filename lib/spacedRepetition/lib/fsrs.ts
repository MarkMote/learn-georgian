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

// FSRS parameters optimized for language learning with frequent sessions
// - Higher retention = shorter intervals (more frequent reviews)
// - Maximum interval capped to ensure periodic review
// - Short-term scheduling enabled for better new card handling
const DEFAULT_FSRS_PARAMS: Partial<FSRSParameters> = {
  request_retention: 0.92,  // Higher than default 0.9 = shorter intervals
  maximum_interval: 60,      // Cap at 60 days (default is 36500)
  enable_short_term: true,   // Better handling for new/learning cards
};

// Create singleton FSRS instance with language-learning optimized parameters
let fsrsInstance = fsrs(DEFAULT_FSRS_PARAMS);

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

/**
 * Create a new CardState for a word being introduced
 * New cards start in learning phase at step 0, due immediately
 */
export function createCardState(key: string, now: Date = new Date()): CardState {
  const fsrsCard = createEmptyCard(now);
  return {
    key,
    // FSRS fields
    due: fsrsCard.due.toISOString(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    scheduled_days: fsrsCard.scheduled_days,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: fsrsCard.state,
    last_review: fsrsCard.last_review?.toISOString(),
    // Learning box fields - new cards start in learning at step 0
    learningStep: 0,
    stepDue: now.toISOString(),  // Due immediately
    phase: 'learning',
    // Custom fields
    introducedAt: now.toISOString(),
    consecutiveEasyCount: 0,
  };
}

/**
 * Convert FSRS Card back to our CardState format (after grading)
 * Learning fields are passed in since they're managed separately from FSRS
 */
export function fsrsCardToCardState(
  fsrsCard: FSRSCard,
  key: string,
  introducedAt: string,
  grade: 0 | 1 | 2 | 3,
  learningFields: {
    learningStep: number;
    stepDue: string;
    phase: 'learning' | 'review' | 'graduated';
    consecutiveEasyCount: number;
  }
): CardState {
  return {
    key,
    // FSRS fields
    due: fsrsCard.due.toISOString(),
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    scheduled_days: fsrsCard.scheduled_days,
    reps: fsrsCard.reps,
    lapses: fsrsCard.lapses,
    state: fsrsCard.state,
    last_review: fsrsCard.last_review?.toISOString(),
    // Learning box fields
    learningStep: learningFields.learningStep,
    stepDue: learningFields.stepDue,
    phase: learningFields.phase,
    // Custom fields
    introducedAt,
    lastGrade: grade,
    consecutiveEasyCount: learningFields.consecutiveEasyCount,
  };
}
