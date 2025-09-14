// lib/spacedRepetition/core.ts

import { WordData, CardState, DeckState, SRSConfig, Grade } from './types';

// Default configuration
export const DEFAULT_CONFIG: SRSConfig = {
  beta: 0.3,
  hardGrowth: 0.2,
  goodGrowth: 0.5,
  easyGrowth: 0.7,
  failShrink: 0.5,
  riskThreshold: 0.1,
  maxConsecutiveEasy: 5,
  minStability: 0.1,
  maxStability: 365
};

/**
 * Calculate forgetting risk (0-1, higher = more likely forgotten)
 */
function calculateRisk(stability: number, daysSinceReview: number, beta: number): number {
  if (daysSinceReview <= 0) return 0;
  return 1 - Math.exp(-Math.pow(daysSinceReview / stability, beta));
}

/**
 * Update card stability based on grade
 */
function updateStability(cardState: CardState, grade: Grade, config: SRSConfig): number {
  const daysSinceReview = Math.max(1, config.beta); // Simplified - using beta as time unit
  const currentRisk = calculateRisk(cardState.stability, daysSinceReview, config.beta);

  if (grade === 0) {
    // Failed - reduce stability
    const newStability = cardState.stability * (1 - config.failShrink * currentRisk);
    return Math.max(newStability, config.minStability);
  }

  // Success - increase stability based on grade
  const growthFactors = [0, config.hardGrowth, config.goodGrowth, config.easyGrowth];
  const growthFactor = growthFactors[grade];
  const newStability = cardState.stability * (1 + growthFactor * (1 - currentRisk));

  return Math.min(Math.max(newStability, cardState.stability), config.maxStability);
}

/**
 * Pipeline 1: Update card and deck state on grade
 */
export function updateStateOnGrade(
  cardState: CardState,
  deckState: DeckState,
  grade: Grade,
  config: SRSConfig = DEFAULT_CONFIG
): { cardState: CardState; deckState: DeckState; nextCardKey: string | null } {

  // Update card
  const updatedCard: CardState = {
    ...cardState,
    stability: updateStability(cardState, grade, config),
    lastReviewStep: deckState.currentStep,
    reviewCount: cardState.reviewCount + 1,
    lapseCount: grade === 0 ? cardState.lapseCount + 1 : cardState.lapseCount
  };

  // Update deck
  const updatedDeck: DeckState = {
    ...deckState,
    currentStep: deckState.currentStep + 1,
    consecutiveEasyCount: grade === 3 ? deckState.consecutiveEasyCount + 1 : 0,
    stats: { ...deckState.stats } // Will be recalculated by caller
  };

  return {
    cardState: updatedCard,
    deckState: updatedDeck,
    nextCardKey: null // Will be calculated separately
  };
}

/**
 * Pipeline 2: Initialize deck with first card
 */
export function initializeDeck(
  availableWords: WordData[],
  config: SRSConfig = DEFAULT_CONFIG
): { cardStates: Map<string, CardState>; deckState: DeckState } {

  const cardStates = new Map<string, CardState>();

  // Start with first word if available
  if (availableWords.length > 0) {
    const firstWord = availableWords[0];
    cardStates.set(firstWord.key, {
      key: firstWord.key,
      stability: 1.0, // Initial stability of 1 day
      lastReviewStep: 0,
      reviewCount: 0,
      lapseCount: 0,
      introducedAtStep: 0
    });
  }

  const deckState: DeckState = {
    currentStep: 0,
    currentCardKey: availableWords.length > 0 ? availableWords[0].key : null,
    consecutiveEasyCount: 0,
    stats: {
      averageRisk: 0,
      cardsAtRisk: 0
    }
  };

  return { cardStates, deckState };
}

/**
 * Pipeline 3: Select next card to show (highest risk)
 */
export function selectNextCard(
  cardStates: Map<string, CardState>,
  deckState: DeckState,
  availableWords: WordData[],
  config: SRSConfig = DEFAULT_CONFIG,
  filterPredicate?: (word: WordData) => boolean
): { nextCardKey: string | null; shouldIntroduceNew: boolean } {

  if (cardStates.size === 0) {
    return { nextCardKey: null, shouldIntroduceNew: true };
  }

  // Calculate risks for all cards
  const cardRisks: Array<{ key: string; risk: number }> = [];

  cardStates.forEach((cardState) => {
    // Check if word passes filter
    const word = availableWords.find(w => w.key === cardState.key);
    if (!word || (filterPredicate && !filterPredicate(word))) {
      return; // Skip filtered cards
    }

    const daysSinceReview = deckState.currentStep - cardState.lastReviewStep;
    const risk = calculateRisk(cardState.stability, daysSinceReview, config.beta);
    cardRisks.push({ key: cardState.key, risk });
  });

  if (cardRisks.length === 0) {
    return { nextCardKey: null, shouldIntroduceNew: true };
  }

  // Sort by risk (highest first)
  cardRisks.sort((a, b) => b.risk - a.risk);

  const highestRisk = cardRisks[0].risk;
  const shouldIntroduceNew =
    highestRisk < config.riskThreshold ||
    deckState.consecutiveEasyCount >= config.maxConsecutiveEasy;

  return {
    nextCardKey: cardRisks[0].key,
    shouldIntroduceNew: shouldIntroduceNew && cardStates.size < availableWords.length
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

  // Create new card state
  const newCardState: CardState = {
    key: nextWord.key,
    stability: 1.0,
    lastReviewStep: deckState.currentStep,
    reviewCount: 0,
    lapseCount: 0,
    introducedAtStep: deckState.currentStep
  };

  // Add to card states
  const updatedCardStates = new Map(cardStates);
  updatedCardStates.set(nextWord.key, newCardState);

  return {
    cardStates: updatedCardStates,
    newCardKey: nextWord.key
  };
}

/**
 * Calculate deck statistics
 */
export function calculateDeckStats(
  cardStates: Map<string, CardState>,
  deckState: DeckState,
  config: SRSConfig = DEFAULT_CONFIG
): { averageRisk: number; cardsAtRisk: number } {

  if (cardStates.size === 0) {
    return { averageRisk: 0, cardsAtRisk: 0 };
  }

  let totalRisk = 0;
  let cardsAtRisk = 0;

  cardStates.forEach((cardState) => {
    const daysSinceReview = deckState.currentStep - cardState.lastReviewStep;
    const risk = calculateRisk(cardState.stability, daysSinceReview, config.beta);

    totalRisk += risk;
    if (risk > config.riskThreshold) {
      cardsAtRisk++;
    }
  });

  return {
    averageRisk: totalRisk / cardStates.size,
    cardsAtRisk
  };
}