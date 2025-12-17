// lib/spacedRepetition/updateStateOnGrade.ts

import { CardState, DeckState, Grade, SRSConfig, LearningPhase } from './types';
import { gradeCard, gradeToRating, cardStateToFSRSCard, fsrsCardToCardState } from './lib/fsrs';
import { DEFAULT_CONFIG } from './config';

/**
 * Update card and deck state on grade
 *
 * Learning phase logic:
 * - Fail: Reset to step 0
 * - Hard: Retry current step
 * - Good: Advance to next step (or graduate if at last step)
 * - Easy: Graduate immediately
 *
 * Review/Graduated phase logic:
 * - Fail: Go back to learning step 0
 * - Hard/Good/Easy: FSRS schedules next review
 */
export function updateStateOnGrade(
  cardState: CardState,
  deckState: DeckState,
  grade: Grade,
  config: SRSConfig = DEFAULT_CONFIG
): { cardState: CardState; deckState: DeckState } {
  const now = new Date();
  const { learningSteps } = config;
  const maxStep = learningSteps.length - 1;

  let newPhase: LearningPhase = cardState.phase;
  let newLearningStep = cardState.learningStep;
  let newStepDue = cardState.stepDue;

  // Handle based on current phase
  if (cardState.phase === 'learning') {
    // Card is in learning phase
    switch (grade) {
      case 0: // Fail - reset to step 0
        newLearningStep = 0;
        newStepDue = new Date(now.getTime() + learningSteps[0]).toISOString();
        break;

      case 1: // Hard - retry current step
        newStepDue = new Date(now.getTime() + learningSteps[newLearningStep]).toISOString();
        break;

      case 2: // Good - advance step or graduate
        if (newLearningStep >= maxStep) {
          // Graduate!
          newPhase = 'graduated';
          newLearningStep = maxStep + 1;
        } else {
          newLearningStep++;
          newStepDue = new Date(now.getTime() + learningSteps[newLearningStep]).toISOString();
        }
        break;

      case 3: // Easy - graduate immediately
        newPhase = 'graduated';
        newLearningStep = maxStep + 1;
        break;
    }
  } else {
    // Card is in review/graduated phase
    if (grade === 0) {
      // Fail - send back to learning
      newPhase = 'learning';
      newLearningStep = 0;
      newStepDue = new Date(now.getTime() + learningSteps[0]).toISOString();
    }
    // Hard/Good/Easy - stays in graduated, FSRS handles scheduling
  }

  // Get FSRS scheduling for the card
  const fsrsCard = cardStateToFSRSCard(cardState);
  const rating = gradeToRating(grade);
  const result = gradeCard(fsrsCard, rating, now);

  // Convert back to our format with learning fields
  const updatedCard = fsrsCardToCardState(
    result.card,
    cardState.key,
    cardState.introducedAt,
    grade,
    {
      learningStep: newLearningStep,
      stepDue: newStepDue,
      phase: newPhase,
    }
  );

  // Update deck state (stats will be recalculated by caller)
  const updatedDeck: DeckState = {
    ...deckState,
    // Stats will be recalculated by caller
  };

  return {
    cardState: updatedCard,
    deckState: updatedDeck,
  };
}
