// lib/spacedRepetition/lib/algorithm/index.ts

import { Card, Deck, Grade, SRSConfig, ReviewResult } from '../../legacyTypes';
import { updateStability } from './lib/stability';
import { selectNextCard } from './lib/selection';
import { calculateDeckStats } from './lib/stats';

/**
 * Pure algorithm for reviewing a card
 */
export function reviewCard<T>(
  card: Card<T>,
  grade: Grade,
  currentStep: number,
  config: SRSConfig
): Card<T> {
  const newStability = updateStability(card, grade, currentStep, config);

  return {
    ...card,
    stability: newStability,
    lastReviewStep: currentStep + 1,
    reviewCount: card.reviewCount + 1,
    lapseCount: grade === 0 ? card.lapseCount + 1 : card.lapseCount
  };
}

/**
 * Create a new card
 */
export function createCard<T>(
  id: string,
  data: T,
  currentStep: number,
  initialStability = 3
): Card<T> {
  return {
    id,
    data,
    stability: Math.max(initialStability, 1),
    lastReviewStep: currentStep,
    reviewCount: 0,
    lapseCount: 0,
    introducedAtStep: currentStep
  };
}

/**
 * Process a review and determine next actions
 */
export function processReview<T>(
  deck: Deck<T>,
  cardId: string,
  grade: Grade,
  config: SRSConfig,
  consecutiveEasyCount: number
): ReviewResult<T> {
  const card = deck.cards.find(c => c.id === cardId);
  if (!card) {
    throw new Error(`Card ${cardId} not found in deck`);
  }

  // Update the reviewed card
  const updatedCard = reviewCard(card, grade, deck.currentStep, config);

  // Update deck with new card
  const updatedDeck: Deck<T> = {
    cards: deck.cards.map(c => c.id === cardId ? updatedCard : c),
    currentStep: deck.currentStep + 1
  };

  // Check if we should introduce a new card
  const stats = calculateDeckStats(updatedDeck, config);
  const newConsecutiveEasy = grade === 3 ? consecutiveEasyCount + 1 : 0;
  const shouldIntroduceNew =
    stats.averageRisk < config.introRiskThreshold ||
    newConsecutiveEasy >= config.consecutiveEasyThreshold;

  // Select next card
  const nextCardId = selectNextCard(updatedDeck, config);

  return {
    updatedCard,
    shouldIntroduceNew,
    nextCardId
  };
}

// Re-export utilities
export { calculateDeckStats, selectNextCard, createCard as createNewCard };
export { forgettingRisk } from './lib/forgetting';