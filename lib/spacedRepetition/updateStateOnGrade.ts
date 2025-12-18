// lib/spacedRepetition/updateStateOnGrade.ts

import { CardState, DeckState, Grade, SRSConfig, LearningPhase } from './types';
import { gradeCard, gradeToRating, cardStateToFSRSCard, fsrsCardToCardState } from './lib/fsrs';
import { DEFAULT_CONFIG } from './config';

/**
 * Update card and deck state on grade
 *
 * Learning phase logic [1m, 2m, 4m, 8m, 16m]:
 * - Fail: Reset to step 0
 * - Hard: Retry current step (stay at same step)
 * - Good: Advance +1 step (or +2 if new card)
 * - Easy: Advance +2 steps (or graduate immediately if new non-verb, +3 if new verb)
 * - After final learning step: move to consolidation
 *
 * Special rules:
 * - New non-verb cards: Easy = graduate immediately (skip consolidation), Good = +2 steps
 * - New verb cards: Easy = +3 steps, Good = +2 steps (verbs need more practice)
 *
 * Consolidation phase logic [30m, 1hr]:
 * - Fail: Go back to learning step 0
 * - Hard: Retry current consolidation step
 * - Good/Easy: Advance +1 consolidation step
 * - After final consolidation step: graduate to FSRS
 *
 * Graduated phase logic:
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
  const { learningSteps, consolidationSteps } = config;
  const maxLearningStep = learningSteps.length - 1;
  const maxConsolidationStep = consolidationSteps.length - 1;

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
        if (newLearningStep > maxLearningStep) {
          // Move to consolidation phase
          newPhase = 'consolidation';
          newLearningStep = 0; // Reset to consolidation step 0
          newStepDue = new Date(now.getTime() + consolidationSteps[0]).toISOString();
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
            // New non-verb + Easy = graduate immediately (skip consolidation)
            newPhase = 'graduated';
            isGraduating = true;
            newLearningStep = 0; // Reset for graduated state
          }
        } else {
          // Existing card + Easy = +2 steps
          newLearningStep += 2;
        }

        // Check if should move to consolidation (for verb case or existing card)
        if (!isGraduating && newLearningStep > maxLearningStep) {
          newPhase = 'consolidation';
          newLearningStep = 0; // Reset to consolidation step 0
          newStepDue = new Date(now.getTime() + consolidationSteps[0]).toISOString();
        } else if (!isGraduating) {
          newStepDue = new Date(now.getTime() + learningSteps[newLearningStep]).toISOString();
        }
        break;
    }
  } else if (cardState.phase === 'consolidation') {
    // Card is in consolidation phase
    switch (grade) {
      case 0: // Fail - send back to learning step 0
        newPhase = 'learning';
        newLearningStep = 0;
        newStepDue = new Date(now.getTime() + learningSteps[0]).toISOString();
        newConsecutiveEasyCount = 0;
        break;

      case 1: // Hard - retry current consolidation step
        newStepDue = new Date(now.getTime() + consolidationSteps[newLearningStep]).toISOString();
        break;

      case 2: // Good - advance +1 consolidation step
      case 3: // Easy - advance +1 consolidation step (no skipping in consolidation)
        newLearningStep += 1;
        if (newLearningStep > maxConsolidationStep) {
          // Graduate to FSRS
          newPhase = 'graduated';
          isGraduating = true;
          newLearningStep = 0; // Reset for graduated state
        } else {
          newStepDue = new Date(now.getTime() + consolidationSteps[newLearningStep]).toISOString();
        }
        break;
    }
  } else {
    // Card is in graduated phase
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
