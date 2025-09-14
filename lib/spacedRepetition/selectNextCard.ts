// lib/spacedRepetition/selectNextCard.ts

import { CardState, DeckState, WordData, SRSConfig } from './types';
import { calculateRisk } from './lib/calculateRisk';

/**
 * Select next card to show (highest risk)
 */
export function selectNextCard(
  cardStates: Map<string, CardState>,
  deckState: DeckState,
  availableWords: WordData[],
  config: SRSConfig,
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