// lib/spacedRepetition/lib/session/lib/introduction.ts

import { Card, Deck, SRSConfig } from '../../../types';
import { createCard } from '../../algorithm';

/**
 * Check if we should introduce a new card
 */
export function shouldIntroduceCard(
  averageRisk: number,
  consecutiveEasyCount: number,
  config: SRSConfig
): boolean {
  return (
    averageRisk < config.introRiskThreshold ||
    consecutiveEasyCount >= config.consecutiveEasyThreshold
  );
}

/**
 * Find next item to introduce
 */
export function findNextItemToIntroduce<T>(
  availableItems: T[],
  existingCards: Card<T>[],
  getItemKey: (item: T) => string
): T | null {
  const knownKeys = new Set(existingCards.map(c => getItemKey(c.data)));

  for (const item of availableItems) {
    if (!knownKeys.has(getItemKey(item))) {
      return item;
    }
  }

  return null;
}

/**
 * Introduce a new card to the deck
 */
export function introduceCard<T>(
  deck: Deck<T>,
  item: T,
  getItemKey: (item: T) => string
): Deck<T> {
  const cardId = getItemKey(item);
  const newCard = createCard(cardId, item, deck.currentStep);

  return {
    ...deck,
    cards: [...deck.cards, newCard]
  };
}