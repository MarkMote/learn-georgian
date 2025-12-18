// lib/spacedRepetition/updateStateOnGrade.ts

import { CardState, DeckState, Grade, SRSConfig, LearningPhase } from './types';
import { gradeCard, gradeToRating, cardStateToFSRSCard, fsrsCardToCardState } from './lib/fsrs';
import { DEFAULT_CONFIG } from './config';

/**
 * Update card and deck state on grade
 *
 * Learning phase logic:
 * - Fail: Reset to step 0
 * - Hard: Retry current step (stay at same step)
 * - Good: Advance +1 step (or +2 if new card)
 * - Easy: Advance +2 steps (or graduate immediately if new non-verb, +3 if new verb)
 *
 * Special rules:
 * - New non-verb cards: Easy = graduate immediately, Good = +2 steps
 * - New verb cards: Easy = +3 steps, Good = +2 steps (verbs need more practice)
 * - 3 consecutive Easy grades = graduate (prevents feeling stuck)
 *
 * Review/Graduated phase logic:
 * - Fail: Go back to learning step 0
 * - Hard/Good/Easy: FSRS schedules next review
 *
 * Graduation: When card graduates, FSRS interval is capped at maxGraduatingIntervalDays
 */
export function updateStateOnGrade(
  cardState: CardState,
  deckState: DeckState,
  grade: Grade,
  config: SRSConfig = DEFAULT_CONFIG,
  isVerb: boolean = false
): { cardState: CardState; deckState: DeckState } {
  const now = new Date();
  const { learningSteps } = config;
  const maxStep = learningSteps.length - 1;

  let newPhase: LearningPhase = cardState.phase;
  let newLearningStep = cardState.learningStep;
  let newStepDue = cardState.stepDue;

  // Track consecutive easy count
  let newConsecutiveEasyCount = grade === 3 ? (cardState.consecutiveEasyCount ?? 0) + 1 : 0;

  // Track if card is graduating (for interval capping)
  let isGraduating = false;

  // Check if card is brand new (never graded before)
  const isNewCard = cardState.learningStep === 0 && cardState.lastGrade === undefined;

  // Handle based on current phase
  if (cardState.phase === 'learning') {
    // Card is in learning phase
    switch (grade) {
      case 0: // Fail - reset to step 0
        newLearningStep = 0;
        newStepDue = new Date(now.getTime() + learningSteps[0]).toISOString();
        break;

      case 1: // Hard - retry current step (stay at same step)
        newStepDue = new Date(now.getTime() + learningSteps[newLearningStep]).toISOString();
        break;

      case 2: // Good - advance +1 step (or +2 if new card)
        newLearningStep += isNewCard ? 2 : 1;
        if (newLearningStep > maxStep) {
          newPhase = 'graduated';
          isGraduating = true;
        } else {
          newStepDue = new Date(now.getTime() + learningSteps[newLearningStep]).toISOString();
        }
        break;

      case 3: // Easy - special handling for new cards
        if (isNewCard) {
          if (isVerb) {
            // New verb + Easy = +3 steps (verbs need more practice)
            newLearningStep += 3;
          } else {
            // New non-verb + Easy = graduate immediately
            newPhase = 'graduated';
            isGraduating = true;
            newLearningStep = maxStep + 1;
          }
        } else {
          // Existing card + Easy = +2 steps
          newLearningStep += 2;
        }

        // Check if should graduate (for verb case or existing card)
        if (!isGraduating && newLearningStep > maxStep) {
          newPhase = 'graduated';
          isGraduating = true;
        } else if (!isGraduating) {
          newStepDue = new Date(now.getTime() + learningSteps[newLearningStep]).toISOString();
        }
        break;
    }
  } else {
    // Card is in review/graduated phase
    if (grade === 0) {
      // Fail - send back to learning
      newPhase = 'learning';
      newLearningStep = 0;
      newStepDue = new Date(now.getTime() + learningSteps[0]).toISOString();
      newConsecutiveEasyCount = 0; // Reset consecutive easy count
    }
    // Hard/Good/Easy - stays in graduated, FSRS handles scheduling
  }

  // Get FSRS scheduling for the card
  const fsrsCard = cardStateToFSRSCard(cardState);
  const rating = gradeToRating(grade);
  const result = gradeCard(fsrsCard, rating, now);

  // Convert back to our format with learning fields
  let updatedCard = fsrsCardToCardState(
    result.card,
    cardState.key,
    cardState.introducedAt,
    grade,
    {
      learningStep: newLearningStep,
      stepDue: newStepDue,
      phase: newPhase,
      consecutiveEasyCount: newConsecutiveEasyCount,
    }
  );

  // Cap FSRS interval when graduating (prevents newly graduated cards from being scheduled too far out)
  if (isGraduating && config.maxGraduatingIntervalDays) {
    const maxIntervalMs = config.maxGraduatingIntervalDays * 24 * 60 * 60 * 1000;
    const cappedDue = new Date(now.getTime() + maxIntervalMs);
    const currentDue = new Date(updatedCard.due);

    if (currentDue > cappedDue) {
      updatedCard = {
        ...updatedCard,
        due: cappedDue.toISOString(),
        scheduled_days: config.maxGraduatingIntervalDays,
      };
    }
  }

  // Update deck state
  // Track consecutive easy grades across all cards (for faster progression)
  const deckConsecutiveEasy = grade === 3
    ? (deckState.consecutiveEasyCount ?? 0) + 1
    : 0;

  const updatedDeck: DeckState = {
    ...deckState,
    consecutiveEasyCount: deckConsecutiveEasy,
    // Stats will be recalculated by caller
  };

  return {
    cardState: updatedCard,
    deckState: updatedDeck,
  };
}
