// lib/spacedRepetition/lib/algorithm/lib/selection.ts

import { Card, Deck, SRSConfig } from '../../../types';
import { forgettingRisk } from './forgetting';

/**
 * Select the card with highest forgetting risk
 */
export function selectNextCard<T>(
  deck: Deck<T>,
  config: SRSConfig
): string | null {
  if (deck.cards.length === 0) return null;

  let bestCard: Card<T> | null = null;
  let maxRisk = -Infinity;

  for (const card of deck.cards) {
    const risk = forgettingRisk(card, deck.currentStep, config);
    if (risk > maxRisk) {
      maxRisk = risk;
      bestCard = card;
    }
  }

  return bestCard?.id ?? null;
}

/**
 * Filter cards based on a predicate
 */
export function filterCards<T>(
  cards: Card<T>[],
  predicate: (data: T) => boolean
): Card<T>[] {
  return cards.filter(card => predicate(card.data));
}