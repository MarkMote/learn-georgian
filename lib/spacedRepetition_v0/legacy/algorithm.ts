// lib/spacedRepetition/legacy/algorithm.ts

import {
  ReviewCard,
  SpacedRepetitionConfig,
  CardPriorityParams,
  defaultConfig,
  defaultPriorityParams
} from "./config";

export type DifficultyRating = "fail" | "hard" | "good" | "easy";

/**
 * Convert difficulty rating to numeric score (0-3)
 * Matches original difficultyToScore function
 */
export function difficultyToScore(difficulty: DifficultyRating): number {
  switch (difficulty) {
    case "fail": return 0;
    case "hard": return 1;
    case "good": return 2;
    case "easy": return 3;
    default: return 0;
  }
}

/**
 * Core SM-2 algorithm implementation
 * Updates card state based on difficulty rating
 */
export function updateCardWithSM2<T>(
  card: ReviewCard<T>,
  difficulty: DifficultyRating,
  config: SpacedRepetitionConfig = defaultConfig
): ReviewCard<T> {
  const score = difficultyToScore(difficulty);
  const normalizedScore = score / 3;
  
  const updatedCard = { ...card };
  updatedCard.rating = score;
  
  if (score === 0) {
    // Failed card - reset
    updatedCard.repetitions = 0;
    updatedCard.interval = config.minInterval;
  } else {
    // Successful review
    updatedCard.repetitions += 1;
    
    // Calculate new interval based on repetition number
    if (updatedCard.repetitions === 1) {
      updatedCard.interval = 1;
    } else if (updatedCard.repetitions === 2) {
      updatedCard.interval = 6;
    } else {
      let newInterval = Math.round(updatedCard.interval * updatedCard.easeFactor);
      
      // Apply easy bonus if applicable
      if (difficulty === "easy") {
        newInterval = Math.round(newInterval * config.intervalMultipliers.easy);
      }
      
      updatedCard.interval = newInterval;
    }
    
    // Clamp interval to bounds
    updatedCard.interval = Math.min(
      Math.max(updatedCard.interval, config.minInterval),
      config.maxInterval
    );
  }
  
  // Update ease factor based on performance
  // Original formula: 0.1 - (1 - normalizedScore) * 0.8
  const easeChange = 0.1 - (1 - normalizedScore) * 0.8;
  updatedCard.easeFactor = Math.max(
    config.minEaseFactor,
    Math.min(
      updatedCard.easeFactor + easeChange,
      config.maxEaseFactor
    )
  );
  
  // Reset lastSeen counter
  updatedCard.lastSeen = 0;
  
  return updatedCard;
}

/**
 * Calculate priority for card selection
 * Higher priority = more likely to be shown next
 * Matches original calculateCardPriority function
 */
export function calculateCardPriority<T>(
  card: ReviewCard<T>,
  params: CardPriorityParams = defaultPriorityParams
): number {
  const rating = card.rating || 0;
  const lastSeen = card.lastSeen || 0;
  const interval = card.interval || 1;
  
  // Priority based on: how long since seen, interval, and performance
  // Lower rating = higher priority (struggling cards shown more)
  // Higher lastSeen = higher priority (not seen recently)
  // Lower interval = higher priority (newer cards)
  
  const lastSeenFactor = lastSeen * params.lastSeenWeight;
  const intervalFactor = (1 / interval) * params.intervalWeight;
  const ratingFactor = (3 - rating) * params.ratingWeight;
  
  return lastSeenFactor + intervalFactor + ratingFactor;
}

/**
 * Select next card based on priority
 * Returns index of selected card
 */
export function selectNextCard<T>(
  cards: ReviewCard<T>[],
  currentIndex: number,
  params: CardPriorityParams = defaultPriorityParams,
  filterFn?: (card: ReviewCard<T>) => boolean
): number {
  if (cards.length === 0) return -1;
  
  let candidates = cards;
  if (filterFn) {
    const filtered = cards.filter(filterFn);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }
  
  let bestIdx = -1;
  let bestPriority = -Infinity;
  
  candidates.forEach((card) => {
    const priority = calculateCardPriority(card, params);
    // Add small random factor to prevent getting stuck
    const randomFactor = Math.random() * 0.001;
    const adjustedPriority = priority + randomFactor;
    
    if (adjustedPriority > bestPriority) {
      bestPriority = adjustedPriority;
      // Find index in original array
      bestIdx = cards.findIndex(c => c === card);
    }
  });
  
  // Fallback to first card if no suitable card found
  if (bestIdx === -1 && cards.length > 0) {
    bestIdx = 0;
  }
  
  return bestIdx;
}

/**
 * Calculate cognitive load (k value)
 * k = (3*N - sum(scores))/3
 * Represents equivalent number of failed cards
 */
export function calculateCognitiveLoad<T>(cards: ReviewCard<T>[]): number {
  if (cards.length === 0) return 0;
  
  const scoreSum = cards.reduce((acc, card) => acc + card.rating, 0);
  return (3 * cards.length - scoreSum) / 3;
}

/**
 * Calculate average performance score
 * Returns value between 0 and 1
 */
export function calculateAveragePerformance<T>(cards: ReviewCard<T>[]): number {
  if (cards.length === 0) return 0;
  
  const sum = cards.reduce((acc, card) => acc + card.rating / 3, 0);
  return sum / cards.length;
}

/**
 * Calculate adaptive cognitive load threshold
 * Threshold increases as more cards are learned
 */
export function calculateCognitiveLoadThreshold(
  numCards: number,
  config: SpacedRepetitionConfig = defaultConfig
): number {
  if (numCards <= config.cognitiveLoadBaseThreshold) {
    return config.cognitiveLoadThreshold;
  }
  
  return config.cognitiveLoadThreshold + 
    config.cognitiveLoadScalingFactor * (numCards - config.cognitiveLoadBaseThreshold);
}

/**
 * Determine if new card should be introduced
 */
export function shouldIntroduceNewCard<T>(
  cards: ReviewCard<T>[],
  config: SpacedRepetitionConfig = defaultConfig
): boolean {
  const avgPerformance = calculateAveragePerformance(cards);
  const cognitiveLoad = calculateCognitiveLoad(cards);
  const threshold = calculateCognitiveLoadThreshold(cards.length, config);
  
  return avgPerformance > config.performanceThreshold && 
         cognitiveLoad < threshold;
}

/**
 * Update lastSeen counters for all cards except the current one
 */
export function updateLastSeenCounters<T>(
  cards: ReviewCard<T>[],
  currentIndex: number
): ReviewCard<T>[] {
  return cards.map((card, index) => {
    if (index === currentIndex) {
      return card;
    }
    return {
      ...card,
      lastSeen: card.lastSeen + 1
    };
  });
}

/**
 * Clean up and validate card data
 * Removes duplicates and ensures valid ranges
 */
export function cleanupCards<T>(
  cards: ReviewCard<T>[],
  getKey: (card: ReviewCard<T>) => string,
  config: SpacedRepetitionConfig = defaultConfig
): ReviewCard<T>[] {
  // Ensure valid ranges for all properties
  const cleaned = cards.map(card => ({
    ...card,
    interval: Math.min(Math.max(card.interval || 1, config.minInterval), config.maxInterval),
    lastSeen: Math.max(card.lastSeen || 0, 0),
    rating: Math.min(Math.max(card.rating || 0, 0), 3),
    repetitions: Math.max(card.repetitions || 0, 0),
    easeFactor: Math.min(Math.max(card.easeFactor || config.initialEaseFactor, config.minEaseFactor), config.maxEaseFactor)
  }));
  
  // Remove duplicates
  const keyCount = new Map<string, number>();
  const duplicateKeys = new Set<string>();
  
  cleaned.forEach(card => {
    const key = getKey(card);
    const count = keyCount.get(key) || 0;
    keyCount.set(key, count + 1);
    if (count > 0) {
      duplicateKeys.add(key);
    }
  });
  
  // Remove ALL instances of duplicate keys
  return cleaned.filter(card => !duplicateKeys.has(getKey(card)));
}